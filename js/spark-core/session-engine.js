// js/spark-core/session-engine.js
(function() {
  function getLegacySessionActiveInstrument() {
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

  var SparkSession = {

    // buildSession(opts) — returns a session plan object for the given mode.
    // opts: { instrument, level, mode, sessionNum, chordName }
    buildSession: function(opts) {
      opts = opts || {};
      var mode       = opts.mode || "quickStart";
      var level      = opts.level || (typeof S !== "undefined" ? S.level : 1);
      var sessionNum = opts.sessionNum || 1;
      var chordName  = opts.chordName || null;

      if (typeof console !== "undefined" && console.debug) {
        console.debug("[SparkSession] buildSession:", mode, "level:", level);
      }

      var activeInstrument = getLegacySessionActiveInstrument();
      var D = opts.instrumentData || {};
      if (!opts.instrumentData) {
        if (activeInstrument && typeof activeInstrument.getData === "function") {
          D = activeInstrument.getData() || {};
        } else if (typeof SparkInstrumentAdapter !== "undefined") {
          D = SparkInstrumentAdapter.getCurriculum() || {};
        }
      }

      // Resolve instrument identity for contract
      var instrumentId = opts.instrumentId || null;
      var instrumentType = opts.instrumentType || null;
      if (!instrumentId && activeInstrument) {
        instrumentId = activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null;
        instrumentType = activeInstrument.instrument || null;
      }

      function wrapPlan(raw) {
        if (typeof SparkContracts !== "undefined") {
          return SparkContracts.createSessionPlan({
            sessionId: raw.sessionId,
            instrumentId: instrumentId,
            instrumentType: instrumentType,
            mode: raw.type || mode,
            chord: raw.chord,
            chordName: raw.chordName || (raw.chord ? raw.chord.name : null),
            estimatedDuration: raw.duration || 120,
            difficulty: raw.level || level,
            segments: raw.chords || [],
            lessonRef: raw.lessonRef || null,
            metadata: { plan: raw.plan || null, sessionNum: raw.sessionNum || null }
          });
        }
        return raw;
      }

      if (mode === "quickStart") {
        var avail = (D.CHORDS && D.CHORDS[level]) || (D.CHORDS && D.CHORDS[1]) || [];
        var chord = avail.length ? avail[Math.floor(Math.random() * avail.length)] : null;

        // Prefer chords needing review when CurriculumService is available (Phase 5)
        if (typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.getReviewTargets === "function" && avail.length > 0) {
          var reviewTargets = SparkCurriculumService.getReviewTargets();
          if (reviewTargets.length > 0) {
            // Try to find a review target chord in the available pool
            for (var rt = 0; rt < reviewTargets.length; rt++) {
              for (var ac = 0; ac < avail.length; ac++) {
                if (avail[ac].name === reviewTargets[rt].id) {
                  chord = avail[ac];
                  rt = reviewTargets.length; // break outer loop
                  break;
                }
              }
            }
          }
        }

        return wrapPlan({
          type:      "quickStart",
          chord:     chord,
          chordName: chord ? chord.name : null,
          duration:  120,
          level:     level
        });
      }

      if (mode === "guided") {
        var sessions = D.SESSIONS || [];
        var plan     = sessions[sessionNum - 1] || null;

        // Use CurriculumService for lesson resolution when available (Phase 5)
        var lessonRef = null;
        if (typeof SparkCurriculumService !== "undefined" && plan && plan.id) {
          if (SparkCurriculumService.isLessonUnlocked(plan.id)) {
            lessonRef = plan.id;
          }
        }

        return wrapPlan({
          type:       "guided",
          plan:       plan,
          sessionNum: sessionNum,
          duration:   300,
          level:      level,
          lessonRef:  lessonRef
        });
      }

      if (mode === "chord") {
        var allChords = D.ALL_CHORDS || [];
        var found     = null;
        for (var i = 0; i < allChords.length; i++) {
          if (allChords[i].name === chordName) { found = allChords[i]; break; }
        }
        return wrapPlan({
          type:      "chord",
          chord:     found,
          chordName: found ? found.name : chordName,
          duration:  120,
          level:     level
        });
      }

      if (mode === "drill") {
        var pool = (D.CHORDS && D.CHORDS[level]) || (D.CHORDS && D.CHORDS[1]) || [];
        var c1   = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
        var c2   = c1;
        var attempts = 0;
        while (c2 && c1 && c2.name === c1.name && pool.length > 1 && attempts < 20) {
          c2 = pool[Math.floor(Math.random() * pool.length)];
          attempts++;
        }
        return wrapPlan({
          type:     "drill",
          chords:   [c1, c2],
          duration: 60,
          level:    level
        });
      }

      // Fallback — unknown mode returns minimal stub
      return wrapPlan({ type: mode, duration: 120, level: level });
    },

    // processResults(results) — handles all post-session state updates.
    // results: { type, chordName, duration, accuracy }
    // Returns: { xpEarned, jackpot, leveledUp, newLevel, newBadges, streakUpdated }
    processResults: function(results) {
      results = results || {};

      if (typeof console !== "undefined" && console.debug) {
        console.debug("[SparkSession] processResults:", results.type || "session", results.chordName || "-");
      }

      var xpEarned      = 0;
      var jackpot       = false;
      var leveledUp     = false;
      var newLevel      = typeof S !== "undefined" ? S.level : 1;
      var streakUpdated = false;

      if (typeof S === "undefined") {
        return { xpEarned: xpEarned, jackpot: jackpot, leveledUp: leveledUp, newLevel: newLevel, newBadges: [], streakUpdated: streakUpdated };
      }

      // --- Streak: once per day ---
      var today = new Date().toISOString().slice(0, 10);
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
      } else {
        if (sessionUpdate.streak) {
          S.streak = (S.streak || 0) + sessionUpdate.streak.increment;
          S.lastSessionDate = sessionUpdate.streak.lastSessionDate;
        }
        S.sessions = (S.sessions || 0) + sessionUpdate.sessionsDelta;
        S.xp = (S.xp || 0) + sessionUpdate.xpDelta;
        if (chordName) {
          if (typeof S.chordProgress !== "object" || S.chordProgress === null) S.chordProgress = {};
          S.chordProgress[chordName] = Math.min((S.chordProgress[chordName] || 0) + sessionUpdate.chordProgress[chordName], 100);
        }
      }

      // --- Level-up: all chords at current level mastered ---
      var activeInstrument = getLegacySessionActiveInstrument();
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
          if ((S.chordProgress[levelChords[i].name] || 0) < 100) { allMastered = false; break; }
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
        _sparkEmit("practice_session_completed", {
          appId:     emitInstrumentId || results.instrumentId || "chordspark",
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
      if (typeof SparkProgressOrchestrator !== "undefined") {
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
      }

      // --- Save state ---
      if (typeof saveState === "function") {
        saveState();
      }

      return outcome;
    }
  };

  window.SparkSession = SparkSession;
})();
