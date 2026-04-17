// js/instruments/bass/app.js — Bass instrument action handler
(function() {

  function bassStateRead(path, fallback) {
    var root = null;
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) root = sparkRoot;
    }
    if (!root && typeof globalThis !== "undefined") {
      root = globalThis.__sparkState || globalThis.S || null;
    }
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function bassStateWrite(path, value) {
    var root = null;
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) root = sparkRoot;
    }
    if (!root && typeof globalThis !== "undefined") {
      root = globalThis.__sparkState || globalThis.S || null;
    }
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    if (!cursor || !parts.length) return value;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function bassStateIncrement(path, delta) {
    delta = typeof delta === "number" ? delta : 0;
    return bassStateWrite(path, (bassStateRead(path, 0) || 0) + delta);
  }

  function bassStateEnsureArray(path) {
    var current = bassStateRead(path, null);
    if (!Array.isArray(current)) {
      current = [];
      bassStateWrite(path, current);
    }
    return current;
  }

  function bassPatchState(fields) {
    fields = fields || {};
    for (var key in fields) {
      bassStateWrite(key, fields[key]);
    }
  }

  function queueSessionTick() {
    clearTimeout(T.session);
    if (typeof tickS === "function") T.session = setTimeout(tickS, 1000);
  }

  function queueDrillTick() {
    clearTimeout(T.drill);
    if (typeof tickD === "function") T.drill = setTimeout(tickD, 1000);
  }

  function buildLegacyPracticePlan(options) {
    if (window.sparkCore && typeof window.sparkCore.startLegacyPracticeSession === "function") {
      return window.sparkCore.startLegacyPracticeSession(options || {});
    }
    if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
      return window.sparkCore.startSession(options || {});
    }
    if (typeof SparkSession !== "undefined" && typeof SparkSession.buildSession === "function") {
      return SparkSession.buildSession(options || {});
    }
    return null;
  }

  function getLegacyPracticeContext(plan) {
    return plan && plan.context && plan.context.legacyPractice ? plan.context.legacyPractice : plan;
  }

  function resolveLegacySessionChord(D, session, level) {
    var chordName = session && session.chordName ? session.chordName : null;
    var allChords = D && Array.isArray(D.ALL_CHORDS)
      ? D.ALL_CHORDS
      : ((typeof CHORDS !== "undefined" && Array.isArray(CHORDS)) ? CHORDS : []);
    var levelPool = [];
    var i;
    if (session && session.chord && typeof session.chord === "object") return session.chord;
    if (!chordName) {
      if (typeof CHORDS !== "undefined" && CHORDS && Array.isArray(CHORDS[level])) {
        levelPool = CHORDS[level];
      } else if (typeof CHORDS !== "undefined" && CHORDS && Array.isArray(CHORDS[1])) {
        levelPool = CHORDS[1];
      } else {
        levelPool = allChords;
      }
      return levelPool.length ? levelPool[0] : null;
    }
    for (i = 0; i < allChords.length; i++) {
      if (!allChords[i]) continue;
      if (allChords[i].name === chordName || allChords[i].short === chordName) return allChords[i];
    }
    return { name: chordName };
  }

  function resolveLegacyDrillChords(D, session) {
    if (!session) return [];
    if (Array.isArray(session.chords) && session.chords.length && session.chords[0] && typeof session.chords[0] === "object") {
      return session.chords;
    }
    var chordNames = Array.isArray(session.chordNames)
      ? session.chordNames
      : (Array.isArray(session.chords) ? session.chords : []);
    var resolved = [];
    var allChords = D && Array.isArray(D.ALL_CHORDS)
      ? D.ALL_CHORDS
      : ((typeof CHORDS !== "undefined" && Array.isArray(CHORDS)) ? CHORDS : []);
    for (var i = 0; i < chordNames.length; i++) {
      var chordName = chordNames[i];
      var matchedChord = null;
      for (var j = 0; j < allChords.length; j++) {
        if (allChords[j] && allChords[j].name === chordName) {
          matchedChord = allChords[j];
          break;
        }
      }
      resolved.push(matchedChord || { name: chordName });
    }
    return resolved;
  }

  function buildFallbackLegacyDrillChords(D, level) {
    var fallbackPool = [];
    if (typeof CHORDS !== "undefined" && CHORDS && Array.isArray(CHORDS[level])) {
      fallbackPool = CHORDS[level];
    } else if (typeof CHORDS !== "undefined" && CHORDS && Array.isArray(CHORDS[1])) {
      fallbackPool = CHORDS[1];
    } else if (D && Array.isArray(D.ALL_CHORDS)) {
      fallbackPool = D.ALL_CHORDS;
    }
    if (!fallbackPool.length) return [];
    var selection = fallbackPool.slice(0, Math.min(2, fallbackPool.length));
    if (selection.length === 1) selection.push(selection[0]);
    return selection;
  }

  function openLegacyPracticeSessionRuntime(options) {
    if (window.sparkCore && typeof window.sparkCore.openLegacyPracticeSession === "function") {
      return window.sparkCore.openLegacyPracticeSession(options || {});
    }
    if (typeof window.openLegacyPracticeSessionRequest === "function") {
      return window.openLegacyPracticeSessionRequest(options || {});
    }
    return null;
  }

  function openLegacyPracticeDrillRuntime(options) {
    if (window.sparkCore && typeof window.sparkCore.openLegacyPracticeDrill === "function") {
      return window.sparkCore.openLegacyPracticeDrill(options || {});
    }
    if (typeof window.openLegacyPracticeDrillRequest === "function") {
      return window.openLegacyPracticeDrillRequest(options || {});
    }
    return null;
  }

  function openGuidedSessionRuntime(sessionNum) {
    var guidedSession = parseInt(sessionNum, 10);
    if (isNaN(guidedSession) || guidedSession < 1) guidedSession = bassStateRead("guidedSession", 1) || 1;
    if (typeof window.openGuidedSessionRequest === "function") {
      return window.openGuidedSessionRequest({ sessionNum: guidedSession });
    }
    if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
      return window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
        sessionNum: guidedSession
      });
    }
    return null;
  }

  function applyGuidedDoneNavigation() {
    if (typeof window.applyGuidedNavigationRequest === "function") {
      return window.applyGuidedNavigationRequest("guided_done");
    }
    if (window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function") {
      return window.sparkCore.syncGuidedRuntimeState({
        activeScreen: "guided_done",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "completed", positionMs: 0 }
      });
    }
    return null;
  }

  function applyLegacyCompletionUpdate(update) {
    update = update || {};
    if (window.sparkCore && typeof window.sparkCore.applyLegacyActivityCompletion === "function") {
      return window.sparkCore.applyLegacyActivityCompletion(update);
    }

    if (update.setFlags) {
      for (var flagKey in update.setFlags) bassStateWrite(flagKey, update.setFlags[flagKey]);
    }
    if (update.incrementFields) {
      for (var incrementKey in update.incrementFields) {
        bassStateIncrement(incrementKey, update.incrementFields[incrementKey]);
      }
    }
    if (update.resultFields) {
      for (var resultKey in update.resultFields) bassStateWrite(resultKey, update.resultFields[resultKey]);
    }
    if (typeof update.xpDelta === "number" || update.toastAmount || update.jackpot) {
      if (window.sparkCore && typeof window.sparkCore.applyLegacyReward === "function") {
        window.sparkCore.applyLegacyReward({
          xpDelta: update.xpDelta || 0,
          toastAmount: update.toastAmount || 0,
          jackpot: !!update.jackpot
        });
      } else {
        bassStateIncrement("xp", update.xpDelta || 0);
        if (update.toastAmount || update.jackpot) {
          bassStateWrite("xpToast", { amount: update.toastAmount || 0, time: Date.now(), jackpot: !!update.jackpot });
        }
      }
    }
    if (update.save !== false) saveState();
    return update;
  }

  function showLegacyPracticeUnavailable() {
    if (typeof showToast === "function") showToast("That practice item couldn't be started right now.");
    return true;
  }

  function launchLegacyPracticeSession(session, sessionChord, sessionChordName, mode) {
    if (!session) return showLegacyPracticeUnavailable();
    openLegacyPracticeSessionRuntime({
      mode: mode,
      chordName: sessionChordName,
      durationSec: session.durationSec != null ? session.durationSec : session.duration
    });
    bassPatchState({
      sessionMicros: [],
      lastChordName: sessionChordName,
      currentChord: sessionChord,
      timer: session.durationSec != null ? session.durationSec : session.duration,
      timerActive: true,
      selectedVoicing: 0,
      screen: SCR.SESSION
    });
    snd("start");
    render();
    queueSessionTick();
    saveState();
    return true;
  }

  function launchLegacyPracticeDrill(session, drillChords) {
    if (!session || !drillChords || !drillChords.length) return showLegacyPracticeUnavailable();
    openLegacyPracticeDrillRuntime({
      durationSec: session.durationSec != null ? session.durationSec : session.duration,
      chordNames: drillChords.map(function(ch) { return ch.name; })
    });
    bassPatchState({
      drillChords: drillChords,
      drillIdx: 0,
      drillTimer: session.durationSec != null ? session.durationSec : session.duration,
      drillSwitches: 0,
      drillLastSwitchTime: Date.now(),
      drillAdaptiveBpm: 60,
      drillConsecutiveFast: 0,
      drillConsecutiveSlow: 0,
      screen: SCR.DRILL
    });
    snd("start");
    render();
    queueDrillTick();
    return true;
  }

  function resolveBassActiveInstrument() {
    var active = (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function")
      ? SparkInstruments.getActive()
      : null;
    if (active && typeof active.getData === "function") return active;
    if (!active || typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
      return active;
    }
    var activeId = active.appId || active.id || active.instrumentId || null;
    var instruments = SparkInstruments.getAll() || [];
    for (var i = 0; i < instruments.length; i++) {
      var instrument = instruments[i];
      if (!instrument) continue;
      if (instrument.appId === activeId || instrument.id === activeId || instrument.instrumentId === activeId) {
        return instrument;
      }
    }
    return active;
  }

  function bassAct(a, v) {
    var activeInstrument = resolveBassActiveInstrument();
    var D = activeInstrument && typeof activeInstrument.getData === "function" ? activeInstrument.getData() : {};

    if (a === "quickStart") {
      var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "quickStart", level: bassStateRead("level", 1) }));
      var sessionChord = resolveLegacySessionChord(D, session, bassStateRead("level", 1));
      var sessionChordName = session && session.chordName ? session.chordName : (sessionChord && sessionChord.name ? sessionChord.name : null);
      return launchLegacyPracticeSession(session, sessionChord, sessionChordName, "quickStart");
    }

    if (a === "resumeSession") {
      var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "chord", chordName: bassStateRead("lastChordName", null) }));
      var sessionChord = resolveLegacySessionChord(D, session, bassStateRead("level", 1));
      var sessionChordName = session && session.chordName ? session.chordName : (sessionChord && sessionChord.name ? sessionChord.name : null);
      if (!session) { act("quickStart"); return true; }
      return launchLegacyPracticeSession(session, sessionChord, sessionChordName, "chord");
    }

    if (a === "startSession") {
      var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "chord", chordName: v }));
      var sessionChord = resolveLegacySessionChord(D, session, bassStateRead("level", 1));
      var sessionChordName = session && session.chordName ? session.chordName : (sessionChord && sessionChord.name ? sessionChord.name : null);
      return launchLegacyPracticeSession(session, sessionChord, sessionChordName, "chord");
    }

    if (a === "startDrill") {
      var drillLevel = bassStateRead("level", 1);
      var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "drill", level: drillLevel }));
      var drillChords = resolveLegacyDrillChords(D, session);
      if (!drillChords.length) drillChords = buildFallbackLegacyDrillChords(D, drillLevel);
      return launchLegacyPracticeDrill(session, drillChords);
    }

    if (a === "repeatLegacyPracticeSession") {
      var currentChord = bassStateRead("currentChord", null);
      var repeatChordName = currentChord ? currentChord.name : (bassStateRead("lastChordName", null) || null);
      var repeatDuration = typeof bassStateRead("timer", null) === "number" ? bassStateRead("timer", null) : 120;
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
          durationSec: typeof bassStateRead("drillTimer", null) === "number" ? bassStateRead("drillTimer", null) : 60,
          chordNames: bassStateRead("drillChords", null) ? bassStateRead("drillChords", null).map(function(ch) { return ch.name; }) : []
        });
      }
      return bassAct("startDrill");
    }

    if (a === "guidedStart") {
      var sessionNum = parseInt(v, 10);
      var corePlan = openGuidedSessionRuntime(sessionNum);
      if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
        bassStateWrite("screen", SCR.GUIDED);
        snd("start");
        render();
        saveState();
        return true;
      }
      var plan = D.SESSIONS[(isNaN(sessionNum) ? bassStateRead("guidedSession", 1) || 1 : sessionNum) - 1];
      if (!plan) { bassStateWrite("guidedSession", 1); plan = D.SESSIONS[0]; }
      if (window.sparkCore && typeof window.sparkCore.syncLegacyGuidedSession === "function") {
        window.sparkCore.syncLegacyGuidedSession(plan, plan && plan.num ? plan.num : (bassStateRead("guidedSession", 1) || 1));
      } else {
        bassPatchState({
          guidedPlan: plan,
          guidedStep: "spark",
          newMovePhase: null,
          guidedPaused: false
        });
      }
      bassStateWrite("screen", SCR.GUIDED);
      snd("start");
      render();
      return true;
    }

    if (a === "guidedComplete") {
      if (bassStateRead("metronomeOn", false)) stopMetronome();
      if (typeof window.completeGuidedSessionRequest === "function") {
        var guidedResult = window.completeGuidedSessionRequest();
        applyGuidedDoneNavigation();
        snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
        trigC();
        bassStateWrite("screen", SCR.GUIDED_DONE);
        render();
        return true;
      } else if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
        var guidedResult = window.sparkCore.completeSession({
          flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
          markPlanComplete: true
        });
        applyGuidedDoneNavigation();
        snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
        trigC();
        bassStateWrite("screen", SCR.GUIDED_DONE);
        render();
        return true;
      }
      var plan = bassStateRead("guidedPlan", null);
      if (plan) {
        if (window.sparkCore && typeof window.sparkCore.applyLegacySessionStatePatch === "function") {
          window.sparkCore.applyLegacySessionStatePatch({
            guided: {
              completedSessionNums: [plan.num],
              nextGuidedSession: Math.min(D.SESSIONS.length, plan.num + 1),
              chordProgress: {}
            }
          });
        } else {
          var completedGuidedSessions = bassStateEnsureArray("completedGuidedSessions");
          if (completedGuidedSessions.indexOf(plan.num) < 0) completedGuidedSessions.push(plan.num);
          bassStateWrite("guidedSession", Math.min(D.SESSIONS.length, plan.num + 1));
        }
        var outcome = SparkSession.processResults({
          type: "guided",
          chordName: plan.newMove ? plan.newMove.chord : null,
          duration: 300
        });
        applyLegacyCompletionUpdate({
          toastAmount: outcome.xpEarned,
          jackpot: outcome.jackpot,
          save: true
        });
        if (outcome.jackpot) snd("levelup"); else snd("complete");
        if (outcome.leveledUp) snd("levelup");
      } else {
        applyLegacyCompletionUpdate({
          toastAmount: 30,
          save: true
        });
        snd("complete");
      }
      trigC();
      bassStateWrite("screen", SCR.GUIDED_DONE);
      render();
      return true;
    }

    // Not handled by bass
    return false;
  }

  window.bassAct = bassAct;
})();
