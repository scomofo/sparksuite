// js/spark-core/session-engine.js
(function() {

  var SparkSession = {

    // buildSession(opts) — returns a session plan object for the given mode.
    // opts: { instrument, level, mode, sessionNum, chordName }
    buildSession: function(opts) {
      opts = opts || {};
      var mode       = opts.mode || "quickStart";
      var level      = opts.level || (typeof S !== "undefined" ? S.level : 1);
      var sessionNum = opts.sessionNum || 1;
      var chordName  = opts.chordName || null;

      var D = {};
      if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive()) {
        D = SparkInstruments.getActive().getData();
      }

      if (mode === "quickStart") {
        var avail = (D.CHORDS && D.CHORDS[level]) || (D.CHORDS && D.CHORDS[1]) || [];
        var chord = avail.length ? avail[Math.floor(Math.random() * avail.length)] : null;
        return {
          type:      "quickStart",
          chord:     chord,
          chordName: chord ? chord.name : null,
          duration:  120,
          level:     level
        };
      }

      if (mode === "guided") {
        var sessions = D.SESSIONS || [];
        var plan     = sessions[sessionNum - 1] || null;
        return {
          type:       "guided",
          plan:       plan,
          sessionNum: sessionNum,
          duration:   300,
          level:      level
        };
      }

      if (mode === "chord") {
        var allChords = D.ALL_CHORDS || [];
        var found     = null;
        for (var i = 0; i < allChords.length; i++) {
          if (allChords[i].name === chordName) { found = allChords[i]; break; }
        }
        return {
          type:      "chord",
          chord:     found,
          chordName: found ? found.name : chordName,
          duration:  120,
          level:     level
        };
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
        return {
          type:     "drill",
          chords:   [c1, c2],
          duration: 60,
          level:    level
        };
      }

      // Fallback — unknown mode returns minimal stub
      return { type: mode, duration: 120, level: level };
    },

    // processResults(results) — handles all post-session state updates.
    // results: { type, chordName, duration, accuracy }
    // Returns: { xpEarned, jackpot, leveledUp, newLevel, newBadges, streakUpdated }
    processResults: function(results) {
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
      var today = new Date().toISOString().slice(0, 10);
      if (S.lastSessionDate !== today) {
        S.streak = (S.streak || 0) + 1;
        S.lastSessionDate = today;
        streakUpdated = true;
      }

      // --- Session count ---
      S.sessions = (S.sessions || 0) + 1;

      // --- XP with 1-in-15 jackpot ---
      jackpot  = Math.random() < (1 / 15);
      xpEarned = jackpot ? 50 : 10;
      S.xp     = (S.xp || 0) + xpEarned;

      // --- Chord mastery (+34 per session, capped at 100) ---
      var chordName = results.chordName || null;
      if (chordName) {
        if (typeof S.chordProgress !== "object" || S.chordProgress === null) S.chordProgress = {};
        S.chordProgress[chordName] = Math.min((S.chordProgress[chordName] || 0) + 34, 100);
      }

      // --- Level-up: all chords at current level mastered ---
      var D = {};
      if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive()) {
        D = SparkInstruments.getActive().getData();
      }
      var levelChords = (D.CHORDS && D.CHORDS[S.level]) || [];
      if (levelChords.length > 0) {
        var allMastered = true;
        for (var i = 0; i < levelChords.length; i++) {
          if ((S.chordProgress[levelChords[i].name] || 0) < 100) { allMastered = false; break; }
        }
        if (allMastered) {
          S.level++;
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
        _sparkEmit("practice_session_completed", {
          appId:     "chordspark",
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

      // --- Save state ---
      if (typeof saveState === "function") {
        saveState();
      }

      return {
        xpEarned:      xpEarned,
        jackpot:       jackpot,
        leveledUp:     leveledUp,
        newLevel:      newLevel,
        newBadges:     newBadges,
        streakUpdated: streakUpdated
      };
    }
  };

  window.SparkSession = SparkSession;
})();
