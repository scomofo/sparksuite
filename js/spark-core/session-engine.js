// js/spark-core/session-engine.js
(function() {

  function getStateFacade() {
    return typeof SparkState !== "undefined" ? SparkState : null;
  }

  function getSessionRoot() {
    var stateFacade = getStateFacade();
    if (stateFacade && typeof stateFacade.getRoot === "function") {
      var sparkRoot = stateFacade.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function readSessionState(path, fallback) {
    var stateFacade = getStateFacade();
    if (stateFacade && typeof stateFacade.read === "function") {
      return stateFacade.read([path], fallback);
    }
    var root = getSessionRoot();
    if (!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function writeSessionState(path, value) {
    var stateFacade = getStateFacade();
    if (stateFacade && typeof stateFacade.write === "function") {
      return stateFacade.write([path], value);
    }
    var root = getSessionRoot();
    if (root) root[path] = value;
    return value;
  }

  function applyLegacySessionOutcomeUpdate(update) {
    var stateFacade = getStateFacade();
    var chordName;
    var chordProgressState;
    update = update || {};

    if (update.streak) {
      if (stateFacade) {
        stateFacade.increment(["streak"], update.streak.increment);
        stateFacade.write(["lastSessionDate"], update.streak.lastSessionDate);
      } else {
        writeSessionState("streak", (readSessionState("streak", 0) || 0) + update.streak.increment);
        writeSessionState("lastSessionDate", update.streak.lastSessionDate);
      }
    }

    if (update.sessionsDelta) {
      if (stateFacade) stateFacade.increment(["sessions"], update.sessionsDelta);
      else writeSessionState("sessions", (readSessionState("sessions", 0) || 0) + update.sessionsDelta);
    }

    if (update.xpDelta) {
      if (stateFacade) stateFacade.increment(["xp"], update.xpDelta);
      else writeSessionState("xp", (readSessionState("xp", 0) || 0) + update.xpDelta);
    }

    if (update.chordProgress) {
      for (chordName in update.chordProgress) {
        if (stateFacade && typeof stateFacade.incrementChordProgress === "function") {
          stateFacade.incrementChordProgress(chordName, update.chordProgress[chordName], 100);
        } else {
          chordProgressState = readSessionState("chordProgress", {});
          if (typeof chordProgressState !== "object" || chordProgressState === null) chordProgressState = {};
          chordProgressState[chordName] = Math.min((chordProgressState[chordName] || 0) + update.chordProgress[chordName], 100);
          writeSessionState("chordProgress", chordProgressState);
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, "level")) {
      if (stateFacade && typeof stateFacade.setLevel === "function") {
        stateFacade.setLevel(update.level);
      } else {
        writeSessionState("level", update.level);
      }
    }
  }

  var SparkSession = {

    // buildSession(opts) — returns a session plan object for the given mode.
    // opts: { instrument, level, mode, sessionNum, chordName }
    buildSession: function(opts) {
      opts = opts || {};
      var mode       = opts.mode || "quickStart";
      var stateFacade = getStateFacade();
      var level      = opts.level || (stateFacade && typeof stateFacade.getLevel === "function" ? stateFacade.getLevel() : readSessionState("level", 1));
      var sessionNum = opts.sessionNum || 1;
      var chordName  = opts.chordName || null;

      if (typeof console !== "undefined" && console.debug) {
        console.debug("[SparkSession] buildSession:", mode, "level:", level);
      }

      var D = opts.instrumentData || {};
      if (!opts.instrumentData) {
        if (typeof SparkInstrumentAdapter !== "undefined") {
          D = SparkInstrumentAdapter.getCurriculum() || {};
        } else if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive()) {
          D = SparkInstruments.getActive().getData();
        }
      }

      // Resolve instrument identity for contract
      var instrumentId = opts.instrumentId || null;
      var instrumentType = opts.instrumentType || null;
      var activeInstrument = typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function" ? SparkInstruments.getActive() : null;
      if (!instrumentId && activeInstrument) {
        instrumentId = activeInstrument.id || activeInstrument.appId || null;
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
      var stateFacade   = getStateFacade();
      var newLevel      = stateFacade && typeof stateFacade.getLevel === "function" ? stateFacade.getLevel() : readSessionState("level", 1);
      var streakUpdated = false;

      if (!stateFacade && !getSessionRoot()) {
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
      var lastSessionDate = stateFacade ? stateFacade.read(["lastSessionDate"], null) : readSessionState("lastSessionDate", null);
      if (lastSessionDate !== today) {
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

      applyLegacySessionOutcomeUpdate(sessionUpdate);

      // --- Level-up: all chords at current level mastered ---
      var D = results.instrumentData || {};
      if (!results.instrumentData) {
        if (typeof SparkInstrumentAdapter !== "undefined") {
          D = SparkInstrumentAdapter.getCurriculum() || {};
        } else if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive()) {
          D = SparkInstruments.getActive().getData();
        }
      }
      var activeLevel = stateFacade && typeof stateFacade.getLevel === "function" ? stateFacade.getLevel() : readSessionState("level", 1);
      var chordProgress = stateFacade && typeof stateFacade.getChordProgress === "function" ? stateFacade.getChordProgress() : readSessionState("chordProgress", {});
      var levelChords = (D.CHORDS && D.CHORDS[activeLevel]) || [];
      if (levelChords.length > 0) {
        var allMastered = true;
        for (var i = 0; i < levelChords.length; i++) {
          if ((chordProgress[levelChords[i].name] || 0) < 100) { allMastered = false; break; }
        }
        if (allMastered) {
          applyLegacySessionOutcomeUpdate({ level: activeLevel + 1 });
          leveledUp = true;
          newLevel  = stateFacade && typeof stateFacade.getLevel === "function" ? stateFacade.getLevel() : readSessionState("level", 1);
        }
      }

      // --- Log history ---
      if (typeof logHistory === "function") {
        logHistory("session", chordName || results.type || "session", xpEarned);
      }

      // --- Emit event ---
      if (typeof _sparkEmit === "function") {
        var emitActiveInstrument = typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function" ? SparkInstruments.getActive() : null;
        var emitInstrumentId = emitActiveInstrument ? (emitActiveInstrument.id || emitActiveInstrument.appId || null) : null;
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
        var beforeEarnedBadges = stateFacade && typeof stateFacade.getEarnedBadges === "function"
          ? stateFacade.getEarnedBadges().slice()
          : (Array.isArray(readSessionState("earnedBadges", [])) ? readSessionState("earnedBadges", []).slice() : []);
        checkBadges();
        var afterBadges  = stateFacade && typeof stateFacade.getEarnedBadges === "function"
          ? stateFacade.getEarnedBadges()
          : (Array.isArray(readSessionState("earnedBadges", [])) ? readSessionState("earnedBadges", []) : []);
        for (var b = 0; b < afterBadges.length; b++) {
          if (beforeEarnedBadges.indexOf(afterBadges[b]) < 0) newBadges.push(afterBadges[b]);
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
