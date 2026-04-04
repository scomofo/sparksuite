// js/spark-core/progress-orchestrator.js
// Unified progression cascade: evaluates all progression systems after any session event.
(function() {

  var SparkProgressOrchestrator = {

    evaluateAll: function(event) {
      event = event || {};
      var result = {
        xpTotal: 0,
        leveledUp: false,
        newLevel: S.playerLevel || 1,
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
      var prevLevel = S.playerLevel || 1;
      if (typeof checkLevelUp === "function") {
        checkLevelUp();
      }
      if ((S.playerLevel || 1) > prevLevel) {
        result.leveledUp = true;
        result.newLevel = S.playerLevel;
      }

      // 5. Update mastery
      if (event.chordName && typeof updateMastery === "function") {
        var acc = event.accuracy || 0.75;
        updateMastery("chords", event.chordName, acc * 100);
        result.masteryUpdates[event.chordName] = S.mastery && S.mastery.chords ? S.mastery.chords[event.chordName] : 0;
      }
      if (event.type === "song" && event.songId && typeof updateMastery === "function") {
        updateMastery("songs", event.songId, (event.accuracy || 0) * 100);
      }

      // 6. Evaluate unlocks
      if (typeof evaluateUnlocks === "function") {
        var prevUnlocks = JSON.stringify(S.unlocks || {});
        evaluateUnlocks();
        var newUnlocks = JSON.stringify(S.unlocks || {});
        if (newUnlocks !== prevUnlocks) {
          result.newUnlocks.push("content_unlocked");
        }
      }

      // 7. Evaluate single-app achievements
      if (typeof evaluateAchievements === "function") {
        var prevAch = Object.keys(S.playerAchievements || {}).length;
        evaluateAchievements();
        var newAch = Object.keys(S.playerAchievements || {}).length;
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
      if (event.streakUpdated && S.streak && typeof awardStreakXP === "function") {
        if (S.streak % 7 === 0) {
          awardStreakXP(S.streak);
          result.xpTotal += S.streak * 5;
        }
      }

      // 12. Comeback bonus
      if (typeof SparkPsychology !== "undefined" && event.type === "session") {
        var comebackXP = SparkPsychology.getComebackBonus(S.lastSessionDate);
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
     * Accepts a SessionResult contract, runs the full cascade, and returns a ProgressOutcome.
     */
    applySessionOutcome: function(sessionResult) {
      sessionResult = sessionResult || {};

      // Map SessionResult to the evaluateAll event shape
      var event = {
        type: sessionResult.mode || "session",
        chordName: sessionResult.chordName || null,
        accuracy: sessionResult.accuracy || 0,
        xpAwarded: 0,
        duration: sessionResult.duration || 0,
        songId: sessionResult.songId || null,
        streakUpdated: false
      };

      // Compute XP via existing logic
      var jackpot = typeof SparkPsychology !== "undefined" ? SparkPsychology.shouldJackpot() : (Math.random() < 1/15);
      event.xpAwarded = jackpot ? 50 : 10;

      // Check streak
      if (typeof S !== "undefined") {
        var today = new Date().toISOString().slice(0, 10);
        if (S.lastSessionDate !== today) {
          event.streakUpdated = true;
        }
      }

      // Run the full cascade
      var cascadeResult = this.evaluateAll(event);

      // Return structured ProgressOutcome
      if (typeof SparkContracts !== "undefined") {
        return SparkContracts.createProgressOutcome({
          xpEarned: cascadeResult.xpTotal || event.xpAwarded,
          levelUps: cascadeResult.leveledUp ? [{ newLevel: cascadeResult.newLevel }] : [],
          masteryChanges: cascadeResult.masteryUpdates || {},
          unlocks: cascadeResult.newUnlocks || [],
          achievements: cascadeResult.newAchievements || [],
          streakChanges: event.streakUpdated ? { incremented: true } : null,
          comebackBonus: 0,
          nextRecommendation: null
        });
      }

      return cascadeResult;
    }
  };

  window.SparkProgressOrchestrator = SparkProgressOrchestrator;
})();
