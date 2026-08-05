// js/sparksuite/legacy/session_engine.js
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
      var explicitSessionNum = opts.sessionNum != null;
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

        // Engine-owned lesson choice (Phase 5): when the caller did not pin a
        // specific session, ask the CurriculumEngine which guided session is
        // next from the player's completion state instead of always starting
        // at session 1. Falls back to the index default when unavailable.
        if (!explicitSessionNum &&
            sessions.length > 0 &&
            typeof SparkCurriculumService !== "undefined" &&
            typeof SparkCurriculumService.getNextGuidedSession === "function") {
          var nextGuided = SparkCurriculumService.getNextGuidedSession(sessions);
          if (nextGuided && nextGuided.session) {
            plan       = nextGuided.session;
            sessionNum = nextGuided.sessionNum;
          }
        }

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

    // processResults(results) — thin delegate kept for legacy callers.
    // The session progression sequence was absorbed into
    // SparkProgressOrchestrator.runSessionProgression (Phase 7); new code
    // should call the orchestrator (or drive mode) directly.
    // results: { type, chordName, duration, accuracy }
    // Returns: { xpEarned, jackpot, leveledUp, newLevel, newBadges, streakUpdated }
    processResults: function(results) {
      results = results || {};

      if (typeof console !== "undefined" && console.debug) {
        console.debug("[SparkSession] processResults:", results.type || "session", results.chordName || "-");
      }

      if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.runSessionProgression === "function") {
        return SparkProgressOrchestrator.runSessionProgression(results);
      }

      return {
        xpEarned: 0,
        jackpot: false,
        leveledUp: false,
        newLevel: typeof S !== "undefined" ? S.level : 1,
        newBadges: [],
        streakUpdated: false
      };
    }
  };

  window.SparkSession = SparkSession;
})();
