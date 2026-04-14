// js/spark-core/progress-orchestrator.js
// Unified progression cascade: evaluates all progression systems after any session event.
(function() {

  function orchestratorRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function orchestratorRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = orchestratorRoot();
    if (!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function getPlayerSnapshot() {
    if (typeof window !== "undefined" &&
        window.sparkCore &&
        typeof window.sparkCore.getLegacyPlayerSnapshot === "function") {
      return window.sparkCore.getLegacyPlayerSnapshot();
    }
    return {
      xp: orchestratorRead("xp", 0) || 0,
      level: orchestratorRead("playerLevel", orchestratorRead("level", 1)) || 1,
      streak: orchestratorRead("streak", 0) || 0,
      lastSessionDate: orchestratorRead("lastSessionDate", null),
      achievements: orchestratorRead("playerAchievements", {}) || {},
      unlocks: orchestratorRead("unlocks", {}) || {}
    };
  }

  function getProgressSnapshot() {
    if (typeof window !== "undefined" &&
        window.sparkCore &&
        typeof window.sparkCore.getLegacyProgressSnapshot === "function") {
      return window.sparkCore.getLegacyProgressSnapshot();
    }
    return {
      mastery: orchestratorRead("mastery", {}) || {}
    };
  }

  var SparkProgressOrchestrator = {

    evaluateAll: function(event) {
      event = event || {};
      var playerSnapshot = getPlayerSnapshot();
      var progressSnapshot = getProgressSnapshot();
      var result = {
        xpTotal: 0,
        leveledUp: false,
        newLevel: playerSnapshot.level || 1,
        newAchievements: [],
        newUnlocks: [],
        goalsCompleted: [],
        masteryUpdates: {}
      };

      // 1. Award XP
      if (event.xpAwarded && typeof awardXP === "function") {
        awardXP(event.xpAwarded, event.type || "session");
        result.xpTotal += event.xpAwarded;
      }

      // 2. Practice time XP
      if (event.duration && typeof awardPracticeXP === "function") {
        var practiceMinutes = event.duration / 60;
        awardPracticeXP(practiceMinutes);
        result.xpTotal += Math.round(practiceMinutes * 2);
      }

      // 3. Song XP
      if (event.type === "song" && event.accuracy && typeof awardSongXP === "function") {
        awardSongXP(event.accuracy);
        result.xpTotal += 20 + Math.round((event.accuracy || 0) * 20);
      }

      // 4. Check level up
      var prevLevel = playerSnapshot.level || 1;
      if (typeof checkLevelUp === "function") {
        checkLevelUp();
      }
      playerSnapshot = getPlayerSnapshot();
      if ((playerSnapshot.level || 1) > prevLevel) {
        result.leveledUp = true;
        result.newLevel = playerSnapshot.level;
      }

      // 5. Update mastery
      if (event.chordName && typeof updateMastery === "function") {
        var acc = event.accuracy || 0.75;
        updateMastery("chords", event.chordName, acc * 100);
        progressSnapshot = getProgressSnapshot();
        result.masteryUpdates[event.chordName] = progressSnapshot.mastery && progressSnapshot.mastery.chords
          ? progressSnapshot.mastery.chords[event.chordName]
          : 0;
      }
      if (event.type === "song" && event.songId && typeof updateMastery === "function") {
        updateMastery("songs", event.songId, (event.accuracy || 0) * 100);
      }

      // 6. Evaluate unlocks
      if (typeof evaluateUnlocks === "function") {
        var prevUnlocks = JSON.stringify(playerSnapshot.unlocks || {});
        evaluateUnlocks();
        playerSnapshot = getPlayerSnapshot();
        var newUnlocks = JSON.stringify(playerSnapshot.unlocks || {});
        if (newUnlocks !== prevUnlocks) {
          result.newUnlocks.push("content_unlocked");
        }
      }

      // 7. Evaluate single-app achievements
      if (typeof evaluateAchievements === "function") {
        var prevAch = Object.keys(playerSnapshot.achievements || {}).length;
        evaluateAchievements();
        playerSnapshot = getPlayerSnapshot();
        var newAch = Object.keys(playerSnapshot.achievements || {}).length;
        if (newAch > prevAch) {
          result.newAchievements.push("achievement_earned");
        }
      }

      // 8. Evaluate suite-level achievements
      if (typeof SparkAchievements !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        if (profile) {
          var earned = SparkAchievements.evaluate(profile);
          if (earned.length > 0) {
            SparkAchievements.applyEarned(profile, earned);
            SparkStorage.save(profile);
            result.newAchievements = result.newAchievements.concat(earned);
          }
        }
      }

      // 9. Update weekly goals
      if (typeof updateWeeklyGoal === "function") {
        if (event.type === "session" || event.type === "drill") {
          updateWeeklyGoal("practice_minutes", (event.duration || 120) / 60);
          updateWeeklyGoal("practice_days", 1);
        }
        if (event.type === "song") {
          updateWeeklyGoal("songs_completed", 1);
        }
      }

      // 10. Update challenge progress
      if (typeof updateChallengeProgressByType === "function") {
        if (event.type === "session") updateChallengeProgressByType("sessions", 1);
        if (event.type === "drill") updateChallengeProgressByType("drills", 1);
        if (event.type === "song") updateChallengeProgressByType("songs", 1);
        if (event.chordName) updateChallengeProgressByType("chords_practiced", 1);
      }

      // 11. Streak XP bonus (every 7 days)
      playerSnapshot = getPlayerSnapshot();
      if (event.streakUpdated && playerSnapshot.streak && typeof awardStreakXP === "function") {
        if (playerSnapshot.streak % 7 === 0) {
          awardStreakXP(playerSnapshot.streak);
          result.xpTotal += playerSnapshot.streak * 5;
        }
      }

      // 12. Comeback bonus
      if (typeof SparkPsychology !== "undefined" && event.type === "session") {
        var comebackXP = SparkPsychology.getComebackBonus(playerSnapshot.lastSessionDate);
        if (comebackXP > 0 && typeof awardXP === "function") {
          awardXP(comebackXP, "comeback");
          result.xpTotal += comebackXP;
        }
      }

      return result;
    },

    /**
     * applySessionOutcome(sessionResult)
     * Single entry point for post-session state updates.
     * During dual-path migration: READ-ONLY observer that builds a ProgressOutcome
     * from current state WITHOUT running evaluateAll (legacy processResults already did that).
     * When legacy path is retired, this will become the sole progression driver.
     */
    applySessionOutcome: function(sessionResult) {
      sessionResult = sessionResult || {};

      // During dual-path phase: do NOT call evaluateAll; the legacy processResults
      // path already ran it. Instead, snapshot current state into a ProgressOutcome
      // for contract validation and debug logging.
      var playerSnapshot = getPlayerSnapshot();
      var xpSnapshot = playerSnapshot.xp || 0;
      var levelSnapshot = playerSnapshot.level || 1;

      if (typeof SparkContracts !== "undefined") {
        return SparkContracts.createProgressOutcome({
          xpEarned: 0, // Not awarding; legacy path already did
          levelUps: [],
          masteryChanges: {},
          unlocks: [],
          achievements: [],
          streakChanges: null,
          comebackBonus: 0,
          nextRecommendation: null,
          _dualPath: true,
          _stateSnapshot: { xp: xpSnapshot, level: levelSnapshot }
        });
      }

      return { _dualPath: true, xp: xpSnapshot, level: levelSnapshot };
    }
  };

  window.SparkProgressOrchestrator = SparkProgressOrchestrator;
})();
