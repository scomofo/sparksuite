// js/spark-core/progress-orchestrator.js
// Unified progression cascade: evaluates all progression systems after any session event.
(function() {

  // Drill completion sequence (Phase 7 drive mode): fixed activity XP, drill
  // count, history entry, completion event, badge check. Chord names ride on
  // sessionResult.exerciseResults; the instrument appId on instrumentId.
  function driveDrillCompletion(sessionResult) {
    var results = Array.isArray(sessionResult.exerciseResults) ? sessionResult.exerciseResults : [];
    var chordNames = [];
    for (var i = 0; i < results.length; i++) {
      if (typeof results[i] === "string") chordNames.push(results[i]);
      else if (results[i] && results[i].chordName) chordNames.push(results[i].chordName);
    }
    var detail = chordNames.join(" / ");
    var appId = sessionResult.instrumentId || null;
    var xp = 20;

    if (typeof SparkProgressBridge !== "undefined" && typeof SparkProgressBridge.applyLegacyActivityCompletion === "function") {
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta: xp,
        toastAmount: xp,
        incrementFields: { drillCount: 1 },
        history: { type: "drill", detail: detail, xp: xp },
        emit: { type: "practice_session_completed", payload: { appId: appId, type: "drill", xp: xp, detail: detail } },
        checkBadges: true
      });
    } else {
      if (typeof S !== "undefined") {
        S.drillCount = (S.drillCount || 0) + 1;
        S.xp = (S.xp || 0) + xp;
        S.xpToast = { amount: xp, time: Date.now() };
      }
      if (typeof logHistory === "function") logHistory("drill", detail, xp);
      if (typeof _sparkEmit === "function") _sparkEmit("practice_session_completed", { appId: appId, type: "drill", xp: xp, detail: detail });
      if (typeof checkBadges === "function") checkBadges();
      if (typeof saveState === "function") saveState();
    }

    var outcome = typeof SparkContracts !== "undefined"
      ? SparkContracts.createProgressOutcome({ xpEarned: xp })
      : { xpEarned: xp };
    outcome.sessionEffects = { xpEarned: xp, jackpot: false, leveledUp: false, newBadges: [], streakUpdated: false };
    return outcome;
  }

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
        result.masteryUpdates[event.chordName] = typeof SparkMastery !== "undefined"
          ? (SparkMastery.get("chords", event.chordName) || 0)
          : (S.mastery && S.mastery.chords ? S.mastery.chords[event.chordName] : 0);
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
     * applySessionOutcome(sessionResult, opts)
     * Single entry point for post-session state updates.
     *
     * Two modes:
     * - opts.drive (Phase 7, retired flows): the orchestrator IS the progression
     *   driver. It runs the full progression sequence exactly once and returns a
     *   real ProgressOutcome. The caller must NOT also call
     *   SparkSession.processResults. Renderer-side effect data (xp toast amount,
     *   jackpot, level-up sounds) rides on outcome.sessionEffects.
     * - default (dual-path flows not yet retired): READ-ONLY observer that builds
     *   a ProgressOutcome snapshot WITHOUT running evaluateAll (the legacy
     *   processResults call at the call site already did that).
     */
    applySessionOutcome: function(sessionResult, opts) {
      sessionResult = sessionResult || {};
      opts = opts || {};

      if (opts.drive) {
        var mode = sessionResult.mode || "session";

        // Drill has its own completion sequence (fixed activity XP, drill
        // count, history, event, badges) — it never ran processResults.
        if (mode === "drill") {
          return driveDrillCompletion(sessionResult);
        }

        // The session progression sequence itself (streak, XP/jackpot, chord
        // mastery, level-up, history, events, badges, evaluateAll cascade)
        // still lives in SparkSession.processResults — shared with flows that
        // are not yet retired. Driving it from here makes this the flow's
        // single entry point; the sequence internals migrate into the
        // orchestrator once the remaining dual-path flows retire.
        var legacyType = mode === "song" ? mode : "session";
        var effects;
        if (typeof SparkSession !== "undefined" && typeof SparkSession.processResults === "function") {
          effects = SparkSession.processResults({
            type: legacyType,
            chordName: sessionResult.chordName || null,
            duration: sessionResult.duration,
            accuracy: sessionResult.accuracy,
            songId: sessionResult.songId
          });
        } else {
          effects = {
            xpEarned: 0, jackpot: false, leveledUp: false,
            newLevel: (typeof S !== "undefined" && S.level) || 1,
            newBadges: [], streakUpdated: false
          };
        }

        var driven = typeof SparkContracts !== "undefined"
          ? SparkContracts.createProgressOutcome({
              xpEarned: effects.xpEarned || 0,
              levelUps: effects.leveledUp ? [effects.newLevel] : [],
              achievements: effects.newBadges || [],
              streakChanges: effects.streakUpdated ? { incremented: 1 } : null
            })
          : { xpEarned: effects.xpEarned || 0 };
        driven.sessionEffects = effects;
        return driven;
      }

      // During dual-path phase: do NOT call evaluateAll — the legacy processResults
      // path already ran it. Instead, snapshot current state into a ProgressOutcome
      // for contract validation and debug logging.
      var xpSnapshot = typeof S !== "undefined" ? (S.xp || 0) : 0;
      var levelSnapshot = typeof S !== "undefined" ? (S.playerLevel || S.level || 1) : 1;

      if (typeof SparkContracts !== "undefined") {
        return SparkContracts.createProgressOutcome({
          xpEarned: 0, // Not awarding — legacy path already did
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
