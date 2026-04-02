// js/instruments/bass/app.js — Bass instrument action handler
(function() {

  function bassAct(a, v) {
    var D = SparkInstruments.getActive().getData();

    if (a === "quickStart") {
      var session = SparkSession.buildSession({ mode: "quickStart", level: S.level });
      if (!session) return true;
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      clearTimeout(T.session);
      T.session = setTimeout(tickS, 1000);
      saveState();
      return true;
    }

    if (a === "resumeSession") {
      var session = SparkSession.buildSession({ mode: "chord", chordName: S.lastChordName });
      if (!session) { act("quickStart"); return true; }
      S.sessionMicros = [];
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      clearTimeout(T.session);
      T.session = setTimeout(tickS, 1000);
      return true;
    }

    if (a === "startSession") {
      var session = SparkSession.buildSession({ mode: "chord", chordName: v });
      if (!session) return true;
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      clearTimeout(T.session);
      T.session = setTimeout(tickS, 1000);
      saveState();
      return true;
    }

    if (a === "startDrill") {
      var session = SparkSession.buildSession({ mode: "drill", level: S.level });
      if (!session) return true;
      S.drillChords = session.chords;
      S.drillIdx = 0;
      S.drillTimer = session.duration;
      S.drillSwitches = 0;
      S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60;
      S.drillConsecutiveFast = 0;
      S.drillConsecutiveSlow = 0;
      snd("start");
      S.screen = SCR.DRILL;
      render();
      T.drill = setTimeout(tickD, 1000);
      return true;
    }

    if (a === "guidedStart") {
      var plan = D.SESSIONS[S.guidedSession - 1];
      if (!plan) { S.guidedSession = 1; plan = D.SESSIONS[0]; }
      S.guidedPlan = plan;
      S.guidedStep = "spark";
      S.newMovePhase = null;
      S.guidedPaused = false;
      S.screen = SCR.GUIDED;
      snd("start");
      render();
      return true;
    }

    if (a === "guidedComplete") {
      if (S.metronomeOn) stopMetronome();
      var plan = S.guidedPlan;
      if (plan) {
        if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
        if (S.completedGuidedSessions.indexOf(plan.num) < 0) S.completedGuidedSessions.push(plan.num);
        S.xp += 30;
        S.sessions++;
        var today = new Date().toISOString().split("T")[0];
        if (S.lastSessionDate !== today) { S.streak++; S.lastSessionDate = today; }
        S.guidedSession = Math.min(D.SESSIONS.length, plan.num + 1);
        logHistory("guided", "Session " + plan.num + ": " + plan.title, 30);
        checkBadges();
      }
      S.xpToast = { amount: 30, time: Date.now() };
      saveState();
      trigC();
      S.screen = SCR.GUIDED_DONE;
      render();
      return true;
    }

    // Not handled by bass
    return false;
  }

  window.bassAct = bassAct;
})();
