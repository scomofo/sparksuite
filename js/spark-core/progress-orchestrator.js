// js/spark-core/progress-orchestrator.js
// Unified progression cascade: evaluates all progression systems after any session event.
(function() {

  // Generic activity-completion executor (Phase 7 drive mode). Prefers the
  // progress bridge; falls back to equivalent direct state updates so the
  // sequence behaves the same when the bridge isn't loaded.
  function runActivityCompletion(payload) {
    payload = payload || {};
    if (typeof SparkProgressBridge !== "undefined" && typeof SparkProgressBridge.applyLegacyActivityCompletion === "function") {
      SparkProgressBridge.applyLegacyActivityCompletion(payload);
      return;
    }
    var key;
    if (typeof S !== "undefined") {
      if (payload.setFlags) for (key in payload.setFlags) S[key] = payload.setFlags[key];
      if (payload.incrementFields) for (key in payload.incrementFields) S[key] = (S[key] || 0) + payload.incrementFields[key];
      if (payload.maxFields) for (key in payload.maxFields) S[key] = Math.max(S[key] || 0, payload.maxFields[key]);
      if (payload.resultFields) for (key in payload.resultFields) S[key] = payload.resultFields[key];
      if (payload.xpDelta) S.xp = (S.xp || 0) + payload.xpDelta;
      if (payload.toastAmount) S.xpToast = { amount: payload.toastAmount, time: Date.now() };
    }
    if (payload.history && typeof logHistory === "function") {
      logHistory(payload.history.type, payload.history.detail, payload.history.xp || 0);
    }
    if (payload.emit && typeof _sparkEmit === "function") {
      _sparkEmit(payload.emit.type, payload.emit.payload || {});
    }
    if (payload.checkBadges && typeof checkBadges === "function") checkBadges();
    if (typeof saveState === "function") saveState();
  }

  function activityOutcome(xp) {
    var outcome = typeof SparkContracts !== "undefined"
      ? SparkContracts.createProgressOutcome({ xpEarned: xp })
      : { xpEarned: xp };
    outcome.sessionEffects = { xpEarned: xp, jackpot: false, leveledUp: false, newBadges: [], streakUpdated: false };
    return outcome;
  }

  // Drill completion: fixed activity XP, drill count, history entry,
  // completion event, badge check. Chord names ride on
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
    runActivityCompletion({
      xpDelta: xp,
      toastAmount: xp,
      incrementFields: { drillCount: 1 },
      history: { type: "drill", detail: detail, xp: xp },
      emit: { type: "practice_session_completed", payload: { appId: appId, type: "drill", xp: xp, detail: detail } },
      checkBadges: true
    });
    return activityOutcome(xp);
  }

  // Daily challenge completion: XP comes from the challenge definition
  // (sessionResult.meta.challenge = { id, title, xp }).
  function driveDailyCompletion(sessionResult) {
    var challenge = (sessionResult.meta && sessionResult.meta.challenge) || {};
    var xp = challenge.xp || 40;
    runActivityCompletion({
      xpDelta: xp,
      toastAmount: xp,
      setFlags: { dailyComplete: true },
      incrementFields: { dailyDone: 1 },
      history: { type: "daily", detail: challenge.title || "Challenge", xp: xp },
      checkBadges: true
    });
    return activityOutcome(xp);
  }

  // Rhythm game completion: XP is score/10; zero score awards nothing.
  function driveRhythmCompletion(sessionResult) {
    var score = (sessionResult.meta && typeof sessionResult.meta.score === "number") ? sessionResult.meta.score : 0;
    var xp = Math.round(score / 10);
    if (xp > 0) {
      runActivityCompletion({
        xpDelta: xp,
        history: { type: "rhythm", detail: "Score: " + score, xp: xp }
      });
    }
    return activityOutcome(xp > 0 ? xp : 0);
  }

  // Runner game completion: XP is score/20; high score and results persist
  // even on a zero-XP run.
  function driveRunnerCompletion(sessionResult) {
    var meta = sessionResult.meta || {};
    var score = typeof meta.score === "number" ? meta.score : 0;
    var xp = Math.round(score / 20);
    runActivityCompletion({
      xpDelta: xp > 0 ? xp : 0,
      maxFields: { runnerHighScore: score },
      resultFields: meta.results ? { runnerResults: meta.results } : null,
      history: xp > 0 ? { type: "runner", detail: "Score: " + score, xp: xp } : null
    });
    return activityOutcome(xp > 0 ? xp : 0);
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

        // Activity flows have their own completion sequences — they never
        // ran processResults.
        if (mode === "drill") return driveDrillCompletion(sessionResult);
        if (mode === "daily") return driveDailyCompletion(sessionResult);
        if (mode === "rhythm") return driveRhythmCompletion(sessionResult);
        if (mode === "runner") return driveRunnerCompletion(sessionResult);

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
