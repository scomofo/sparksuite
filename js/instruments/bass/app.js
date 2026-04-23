// js/instruments/bass/app.js — Bass instrument action handler
(function() {

  function getBassAppInstrument() {
    var inst;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    inst = SparkInstruments.getActive();
    if (!inst) return null;
    if (typeof inst.getData === "function" || inst.ui) return inst;
    candidate = inst.id || inst.appId || inst.instrumentId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return inst;
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
    var inst = getBassAppInstrument();
    var D = inst && inst.getData ? inst.getData() : {};

    if (a === "quickStart") {
      var session = SparkSession.buildSession({ mode: "quickStart", level: S.level });
      if (!session) return true;
      if (typeof window.openLegacyPracticeSessionRequest === "function") {
        window.openLegacyPracticeSessionRequest({
          mode: "quickStart",
          chordName: session.chordName,
          durationSec: session.duration
        });
      }
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      queueSessionTick();
      saveState();
      return true;
    }

    if (a === "resumeSession") {
      var session = SparkSession.buildSession({ mode: "chord", chordName: S.lastChordName });
      if (!session) { act("quickStart"); return true; }
      if (typeof window.openLegacyPracticeSessionRequest === "function") {
        window.openLegacyPracticeSessionRequest({
          mode: "chord",
          chordName: session.chordName,
          durationSec: session.duration
        });
      }
      S.sessionMicros = [];
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      queueSessionTick();
      saveState();
      return true;
    }

    if (a === "startSession") {
      var session = SparkSession.buildSession({ mode: "chord", chordName: v });
      if (!session) return true;
      if (typeof window.openLegacyPracticeSessionRequest === "function") {
        window.openLegacyPracticeSessionRequest({
          mode: "chord",
          chordName: session.chordName,
          durationSec: session.duration
        });
      }
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      queueSessionTick();
      saveState();
      return true;
    }

    if (a === "startDrill") {
      var session = SparkSession.buildSession({ mode: "drill", level: S.level });
      if (!session) return true;
      if (typeof window.openLegacyPracticeDrillRequest === "function") {
        window.openLegacyPracticeDrillRequest({
          durationSec: session.duration,
          chordNames: session.chords ? session.chords.map(function(ch) { return ch.name; }) : []
        });
      }
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
      a = "start_guided_session";
    }

    if (a === "start_guided_session") {
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
      } else if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
        var guidedSession = isNaN(sessionNum) ? (S.guidedSession || 1) : sessionNum;
        var corePlan = window.sparkCore.startSession({
          flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
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
      var plan = D.SESSIONS[(isNaN(sessionNum) ? S.guidedSession || 1 : sessionNum) - 1];
      if (!plan) { S.guidedSession = 1; plan = D.SESSIONS[0]; }
      if (window.SparkProgressBridge && typeof SparkProgressBridge.syncGuidedSessionToState === "function") {
        SparkProgressBridge.syncGuidedSessionToState({
          context: {
            guidedPlan: plan,
            guidedSession: plan && plan.num ? plan.num : (S.guidedSession || 1)
          }
        });
      } else {
        S.guidedPlan = plan;
        S.guidedStep = "spark";
        S.newMovePhase = null;
        S.guidedPaused = false;
      }
      S.screen = SCR.GUIDED;
      snd("start");
      render();
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
      } else if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
        var guidedResult = window.sparkCore.completeSession({
          flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
          markPlanComplete: true
        });
        if (typeof window.sparkCore.syncGuidedRuntimeState === "function") {
          window.sparkCore.syncGuidedRuntimeState({
            activeScreen: "guided_done",
            guidedStep: null,
            guidedNewMovePhase: null,
            transport: { status: "completed", positionMs: 0 }
          });
        }
        if (typeof window.applyGuidedNavigationRequest === "function") {
          window.applyGuidedNavigationRequest("guided_done");
        }
        snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
        trigC();
        S.screen = SCR.GUIDED_DONE;
        render();
        return true;
      }
      var plan = S.guidedPlan;
      if (plan) {
        if (window.SparkProgressBridge && typeof SparkProgressBridge.applySessionStatePatch === "function") {
          SparkProgressBridge.applySessionStatePatch({
            guided: {
              completedSessionNums: [plan.num],
              nextGuidedSession: Math.min(D.SESSIONS.length, plan.num + 1),
              chordProgress: {}
            }
          });
        } else {
          if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
          if (S.completedGuidedSessions.indexOf(plan.num) < 0) S.completedGuidedSessions.push(plan.num);
          S.guidedSession = Math.min(D.SESSIONS.length, plan.num + 1);
        }
        var outcome = SparkSession.processResults({
          type: "guided",
          chordName: plan.newMove ? plan.newMove.chord : null,
          duration: 300
        });
        if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyReward === "function") SparkProgressBridge.applyLegacyReward({ toastAmount: outcome.xpEarned, jackpot: outcome.jackpot });
        else S.xpToast = { amount: outcome.xpEarned, time: Date.now(), jackpot: outcome.jackpot };
        if (outcome.jackpot) snd("levelup"); else snd("complete");
        if (outcome.leveledUp) snd("levelup");
      } else {
        if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyReward === "function") SparkProgressBridge.applyLegacyReward({ toastAmount: 30 });
        else S.xpToast = { amount: 30, time: Date.now() };
        snd("complete");
      }
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
