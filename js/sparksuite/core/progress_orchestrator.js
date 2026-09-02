// js/sparksuite/core/progress_orchestrator.js
// Unified progression cascade: evaluates all progression systems after any session event.
(function() {

  // Resolves the active instrument entry (mirrors the legacy session
  // engine's resolution: prefer the active module, fall back to matching a
  // registered entry by id/appId).
  function getActiveInstrumentEntry() {
    var activeInstrument;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    activeInstrument = SparkInstruments.getActive();
    if (!activeInstrument) return null;
    if (typeof activeInstrument.getData === "function") return activeInstrument;
    candidate = activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return activeInstrument;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return activeInstrument;
  }

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

    /**
     * runSessionProgression(results)
     * The session progression sequence, absorbed from the legacy
     * SparkSession.processResults (which now delegates here): once-a-day
     * streak, XP with 1-in-15 jackpot, chord mastery (+34 capped at 100),
     * chord-set level-up, history entry, completion event, badge check, the
     * evaluateAll cascade, and a state save.
     * results: { type, chordName, duration, accuracy, songId, instrumentId }
     * Returns: { xpEarned, jackpot, leveledUp, newLevel, newBadges, streakUpdated }
     */
    runSessionProgression: function(results) {
      results = results || {};

      var xpEarned      = 0;
      var jackpot       = false;
      var leveledUp     = false;
      var newLevel      = typeof S !== "undefined" ? S.level : 1;
      var streakUpdated = false;

      if (typeof S === "undefined") {
        return { xpEarned: xpEarned, jackpot: jackpot, leveledUp: leveledUp, newLevel: newLevel, newBadges: [], streakUpdated: streakUpdated };
      }

      // --- Streak: once per day ---
      var today = SparkDay.today();
      var sessionUpdate = {
        streak: null,
        sessionsDelta: 1,
        xpDelta: 0,
        chordProgress: {},
        level: null
      };
      if (S.lastSessionDate !== today) {
        sessionUpdate.streak = {
          increment: 1,
          lastSessionDate: today
        };
        streakUpdated = true;
      }

      // --- XP with 1-in-15 jackpot ---
      jackpot  = Math.random() < (1 / 15);
      xpEarned = jackpot ? 50 : 10;
      sessionUpdate.xpDelta = xpEarned;

      // --- Chord mastery (+34 per session, capped at 100) ---
      var chordName = results.chordName || null;
      if (chordName) {
        sessionUpdate.chordProgress[chordName] = 34;
      }

      if (typeof SparkProgressBridge !== "undefined" && typeof SparkProgressBridge.applyLegacySessionOutcome === "function") {
        SparkProgressBridge.applyLegacySessionOutcome(sessionUpdate);
      } else if (typeof SparkInstrumentProgress !== "undefined") {
        // Engine-first path: route xp/streak/sessions through
        // SparkProgress on the per-app profile, which mirrors the
        // updated stats back into S.* for the dumb-renderer UI.
        if (sessionUpdate.streak) {
          SparkInstrumentProgress.updateStreak(sessionUpdate.streak.lastSessionDate);
          S.lastSessionDate = sessionUpdate.streak.lastSessionDate;
        }
        if (sessionUpdate.sessionsDelta) {
          for (var _si = 0; _si < sessionUpdate.sessionsDelta; _si++) {
            SparkInstrumentProgress.completeSession("legacy_session");
          }
        }
        if (sessionUpdate.xpDelta) SparkInstrumentProgress.addXp(sessionUpdate.xpDelta);
      } else {
        if (sessionUpdate.streak) {
          S.streak = (S.streak || 0) + sessionUpdate.streak.increment;
          S.lastSessionDate = sessionUpdate.streak.lastSessionDate;
        }
        S.sessions = (S.sessions || 0) + sessionUpdate.sessionsDelta;
        S.xp = (S.xp || 0) + sessionUpdate.xpDelta;
        if (chordName) {
          if (typeof SparkChordProgress !== "undefined") {
            SparkChordProgress.add(chordName, sessionUpdate.chordProgress[chordName]);
          } else {
            if (typeof S.chordProgress !== "object" || S.chordProgress === null) S.chordProgress = {};
            S.chordProgress[chordName] = Math.min((S.chordProgress[chordName] || 0) + sessionUpdate.chordProgress[chordName], 100);
          }
        }
      }

      // --- Level-up: all chords at current level mastered ---
      var activeInstrument = getActiveInstrumentEntry();
      var D = results.instrumentData || {};
      if (!results.instrumentData) {
        if (activeInstrument && typeof activeInstrument.getData === "function") {
          D = activeInstrument.getData() || {};
        } else if (typeof SparkInstrumentAdapter !== "undefined") {
          D = SparkInstrumentAdapter.getCurriculum() || {};
        }
      }
      var levelChords = (D.CHORDS && D.CHORDS[S.level]) || [];
      if (levelChords.length > 0) {
        var allMastered = true;
        for (var i = 0; i < levelChords.length; i++) {
          var chordPct = typeof SparkChordProgress !== "undefined"
            ? SparkChordProgress.get(levelChords[i].name)
            : (S.chordProgress && S.chordProgress[levelChords[i].name] || 0);
          if (chordPct < 100) { allMastered = false; break; }
        }
        if (allMastered) {
          if (typeof SparkProgressBridge !== "undefined" && typeof SparkProgressBridge.applyLegacySessionOutcome === "function") {
            SparkProgressBridge.applyLegacySessionOutcome({ level: (S.level || 1) + 1 });
          } else {
            S.level++;
          }
          leveledUp = true;
          newLevel  = S.level;
        }
      }

      // --- Log history ---
      if (typeof logHistory === "function") {
        logHistory("session", chordName || results.type || "session", xpEarned);
      }

      // --- Emit event ---
      if (typeof _sparkEmit === "function") {
        var emitInstrumentId = activeInstrument ? (activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null) : null;
        var resultInstrumentId = results.instrumentId || results.appId || results.instrumentAppId || null;
        _sparkEmit("practice_session_completed", {
          // Preserve legacy "chordspark" fallback so downstream event consumers
          // that expect a non-null appId don't break when no active instrument
          // can be resolved.
          appId:     emitInstrumentId || resultInstrumentId || "chordspark",
          type:      results.type || "session",
          xp:        xpEarned,
          chord:     chordName,
          jackpot:   jackpot,
          leveledUp: leveledUp
        });
      }

      // --- Check badges ---
      var newBadges = [];
      if (typeof checkBadges === "function") {
        var beforeBadges = Array.isArray(S.earnedBadges) ? S.earnedBadges.slice() : [];
        checkBadges();
        var afterBadges  = Array.isArray(S.earnedBadges) ? S.earnedBadges : [];
        for (var b = 0; b < afterBadges.length; b++) {
          if (beforeBadges.indexOf(afterBadges[b]) < 0) newBadges.push(afterBadges[b]);
        }
      }

      // --- Run full progression cascade ---
      var outcome = {
        xpEarned:      xpEarned,
        jackpot:       jackpot,
        leveledUp:     leveledUp,
        newLevel:      newLevel,
        newBadges:     newBadges,
        streakUpdated: streakUpdated
      };
      var progressResult = SparkProgressOrchestrator.evaluateAll({
        type: results.type || "session",
        chordName: chordName,
        accuracy: results.accuracy,
        xpAwarded: xpEarned,
        duration: results.duration,
        songId: results.songId,
        streakUpdated: streakUpdated
      });
      if (progressResult.leveledUp) {
        outcome.playerLeveledUp = true;
        outcome.newPlayerLevel = progressResult.newLevel;
      }
      if (progressResult.newAchievements.length) {
        outcome.newAchievements = progressResult.newAchievements;
      }

      // --- Save state ---
      if (typeof saveState === "function") {
        saveState();
      }

      return outcome;
    },

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
      //
      // This used to guard on `typeof updateMastery === "function"` — a bare
      // global that never existed (it was declared inside the IIFE in
      // js/progression/mastery.js and never exported), so the step silently
      // did nothing and chord/song mastery was never written by anything.
      // It now routes through the engine, which owns the 0-100 scale and the
      // blend rule. ProgressEngine.toMasteryPercent accepts either accuracy
      // convention, so no scaling is applied at this call site.
      var masteryEngine = typeof SparkSuiteProgressEngine !== "undefined"
        && typeof SparkSuiteProgressEngine.blendCategoryMastery === "function"
        ? SparkSuiteProgressEngine
        : null;

      if (masteryEngine && event.chordName) {
        result.masteryUpdates[event.chordName] =
          masteryEngine.blendCategoryMastery("chords", event.chordName, event.accuracy || 0.75);
      }
      if (masteryEngine && event.type === "song" && event.songId) {
        masteryEngine.blendCategoryMastery("songs", event.songId, event.accuracy || 0);
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

        // Session-shaped flows run the absorbed progression sequence (streak,
        // XP/jackpot, chord mastery, level-up, history, events, badges,
        // evaluateAll cascade) — the orchestrator owns it outright now;
        // SparkSession.processResults is a thin delegate kept for legacy
        // callers.
        var legacyType = mode === "song" ? mode : "session";
        var effects = SparkProgressOrchestrator.runSessionProgression({
          type: legacyType,
          chordName: sessionResult.chordName || null,
          duration: sessionResult.duration,
          accuracy: sessionResult.accuracy,
          songId: sessionResult.songId,
          instrumentId: sessionResult.instrumentId || null
        });

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
