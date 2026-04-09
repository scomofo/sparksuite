// js/instruments/bass/app.js — Bass instrument action handler
(function() {
  function requestLegacyPracticePlan(options) {
    if (!window.sparkCore || typeof window.sparkCore.startSession !== "function") return null;
    return window.sparkCore.startSession(options || {});
  }

  function extractLegacyPractice(plan) {
    return plan && plan.context && plan.context.legacyPractice ? plan.context.legacyPractice : null;
  }

  function queueSessionTick() {
    clearTimeout(T.session);
    if (typeof tickS === "function") T.session = setTimeout(tickS, 1000);
  }

  function queueDrillTick() {
    clearTimeout(T.drill);
    if (typeof tickD === "function") T.drill = setTimeout(tickD, 1000);
  }

  function bassAct(a, v) {
    var D = SparkInstruments.getActive().getData();

    if (a === "quickStart") {
      var session = extractLegacyPractice(requestLegacyPracticePlan({ mode: "quickStart", level: S.level }));
      if (!session) return true;
      if (typeof window.openLegacyPracticeSessionRequest === "function") {
        window.openLegacyPracticeSessionRequest({
          mode: "quickStart",
          chordName: session.chordName,
          durationSec: session.durationSec
        });
      }
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.durationSec;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      queueSessionTick();
      saveState();
      return true;
    }

    if (a === "resumeSession") {
      var session = extractLegacyPractice(requestLegacyPracticePlan({ mode: "chord", chordName: S.lastChordName, level: S.level }));
      if (!session) { act("quickStart"); return true; }
      if (typeof window.openLegacyPracticeSessionRequest === "function") {
        window.openLegacyPracticeSessionRequest({
          mode: "chord",
          chordName: session.chordName,
          durationSec: session.durationSec
        });
      }
      S.sessionMicros = [];
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.durationSec;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      queueSessionTick();
      saveState();
      return true;
    }

    if (a === "startSession") {
      var session = extractLegacyPractice(requestLegacyPracticePlan({ mode: "chord", chordName: v, level: S.level }));
      if (!session) return true;
      if (typeof window.openLegacyPracticeSessionRequest === "function") {
        window.openLegacyPracticeSessionRequest({
          mode: "chord",
          chordName: session.chordName,
          durationSec: session.durationSec
        });
      }
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.durationSec;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      queueSessionTick();
      saveState();
      return true;
    }

    if (a === "startDrill") {
      var session = extractLegacyPractice(requestLegacyPracticePlan({ mode: "drill", level: S.level }));
      if (!session) return true;
      if (typeof window.openLegacyPracticeDrillRequest === "function") {
        window.openLegacyPracticeDrillRequest({
          durationSec: session.durationSec,
          chordNames: session.chords ? session.chords.map(function(ch) { return ch.name; }) : []
        });
      }
      S.drillChords = session.chords;
      S.drillIdx = 0;
      S.drillTimer = session.durationSec;
      S.drillSwitches = 0;
      S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60;
      S.drillConsecutiveFast = 0;
      S.drillConsecutiveSlow = 0;
      snd("start");
      S.screen = SCR.DRILL;
      render();
      queueDrillTick();
      return true;
    }

    if (a === "repeatLegacyPracticeSession") {
      var repeatChordName = S.currentChord ? S.currentChord.name : (S.lastChordName || null);
      var repeatDuration = typeof S.timer === "number" ? S.timer : 120;
      if (typeof window.repeatLegacyPracticeSessionRequest === "function") {
        window.repeatLegacyPracticeSessionRequest({
          mode: repeatChordName ? "chord" : "quickStart",
          chordName: repeatChordName,
          durationSec: repeatDuration
        });
      }
      if (repeatChordName) return bassAct("startSession", repeatChordName);
      return bassAct("quickStart");
    }

    if (a === "repeatLegacyPracticeDrill") {
      if (typeof window.repeatLegacyPracticeDrillRequest === "function") {
        window.repeatLegacyPracticeDrillRequest({
          durationSec: typeof S.drillTimer === "number" ? S.drillTimer : 60,
          chordNames: S.drillChords ? S.drillChords.map(function(ch) { return ch.name; }) : []
        });
      }
      return bassAct("startDrill");
    }

    if (a === "guidedStart") {
      var sessionNum = parseInt(v, 10);
      if (typeof window.openGuidedSessionRequest === "function") {
        var guidedSession = isNaN(sessionNum) ? (S.guidedSession || 1) : sessionNum;
        var corePlan = window.openGuidedSessionRequest({
          sessionNum: guidedSession
        });
        if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
          S.screen = SCR.GUIDED;
          snd("start");
          render();
          saveState();
          return true;
        }
      }
      return true;
    }

    if (a === "guidedComplete") {
      if (S.metronomeOn) stopMetronome();
      if (typeof window.completeGuidedSessionRequest === "function") {
        var guidedResult = window.completeGuidedSessionRequest();
        if (typeof window.applyGuidedNavigationRequest === "function") {
          window.applyGuidedNavigationRequest("guided_done");
        }
        snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
        trigC();
        S.screen = SCR.GUIDED_DONE;
        render();
        return true;
      }
      return true;
    }

    // Not handled by bass
    return false;
  }

  window.bassAct = bassAct;
})();
