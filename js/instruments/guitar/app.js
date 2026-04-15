// js/instruments/guitar/app.js — guitar-specific act() handler
(function() {

function guitarStateRead(path, fallback) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
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

function guitarStateWrite(path, value) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
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

function guitarStateIncrement(path, delta) {
  delta = typeof delta === "number" ? delta : 0;
  return guitarStateWrite(path, (guitarStateRead(path, 0) || 0) + delta);
}

function guitarStateEnsureArray(path) {
  var current = guitarStateRead(path, null);
  if (!Array.isArray(current)) {
    current = [];
    guitarStateWrite(path, current);
  }
  return current;
}

function guitarStateEnsureObject(path) {
  var current = guitarStateRead(path, null);
  if (!current || typeof current !== "object" || Array.isArray(current)) {
    current = {};
    guitarStateWrite(path, current);
  }
  return current;
}

function guitarPatchState(fields) {
  fields = fields || {};
  for (var key in fields) {
    guitarStateWrite(key, fields[key]);
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
  if (typeof SparkCore !== "undefined" && typeof SparkCore.startSession === "function") {
    return SparkCore.startSession(options || {});
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
  var allChords = D && Array.isArray(D.ALL_CHORDS) ? D.ALL_CHORDS : [];
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
  var allChords = D && Array.isArray(D.ALL_CHORDS) ? D.ALL_CHORDS : [];
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

function syncLegacyPracticeRuntime(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyPracticeRuntimeState === "function") {
    return window.sparkCore.syncLegacyPracticeRuntimeState(action, options || {});
  }
  if (typeof window.syncLegacyPracticeRuntimeRequest === "function") {
    return window.syncLegacyPracticeRuntimeRequest(action, options || {});
  }
  return null;
}

function openGuidedSessionRuntime(sessionNum) {
  var guidedSession = parseInt(sessionNum, 10);
  if (isNaN(guidedSession) || guidedSession < 1) guidedSession = guitarStateRead("guidedSession", 1) || 1;
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
    for (var flagKey in update.setFlags) guitarStateWrite(flagKey, update.setFlags[flagKey]);
  }
  if (update.incrementFields) {
    for (var incrementKey in update.incrementFields) {
      guitarStateIncrement(incrementKey, update.incrementFields[incrementKey]);
    }
  }
  if (update.resultFields) {
    for (var resultKey in update.resultFields) guitarStateWrite(resultKey, update.resultFields[resultKey]);
  }
  if (typeof update.xpDelta === "number" || update.toastAmount || update.jackpot) {
    if (window.sparkCore && typeof window.sparkCore.applyLegacyReward === "function") {
      window.sparkCore.applyLegacyReward({
        xpDelta: update.xpDelta || 0,
        toastAmount: update.toastAmount || 0,
        jackpot: !!update.jackpot
      });
    } else {
      guitarStateIncrement("xp", update.xpDelta || 0);
      if (update.toastAmount || update.jackpot) {
        guitarStateWrite("xpToast", { amount: update.toastAmount || 0, time: Date.now(), jackpot: !!update.jackpot });
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

function launchLegacyPracticeSession(session, sessionChord, sessionChordName, mode, options) {
  options = options || {};
  if (!session) {
    return showLegacyPracticeUnavailable();
  }
  openLegacyPracticeSessionRuntime({
    mode: mode,
    chordName: sessionChordName,
    durationSec: session.durationSec != null ? session.durationSec : session.duration
  });
  guitarPatchState({
    sessionMicros: [],
    lastChordName: sessionChordName,
    currentChord: sessionChord,
    timer: session.durationSec != null ? session.durationSec : session.duration,
    timerActive: true,
    selectedVoicing: 0,
    screen: SCR.SESSION
  });
  snd("start");
  if (options.updatePrevChord !== false && typeof _prevChordKey !== "undefined") {
    _prevChordKey = sessionChordName;
  }
  render();
  queueSessionTick();
  saveState();
  return true;
}

function launchLegacyPracticeDrill(session, drillChords) {
  if (!session || !drillChords || !drillChords.length) {
    return showLegacyPracticeUnavailable();
  }
  openLegacyPracticeDrillRuntime({
    durationSec: session.durationSec != null ? session.durationSec : session.duration,
    chordNames: drillChords.map(function(ch) { return ch.name; })
  });
  guitarPatchState({
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
  if (typeof _prevChordKey !== "undefined") _prevChordKey = drillChords[0].name;
  snd("start");
  render();
  queueDrillTick();
  return true;
}

function guitarAct(a, v) {
  var D = SparkInstruments.getActive().getData();

  if (a === "quickStart") {
    var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "quickStart", level: guitarStateRead("level", 1) }));
    var sessionChord = resolveLegacySessionChord(D, session, guitarStateRead("level", 1));
    var sessionChordName = session && session.chordName ? session.chordName : (sessionChord && sessionChord.name ? sessionChord.name : null);
    return launchLegacyPracticeSession(session, sessionChord, sessionChordName, "quickStart", {
      updatePrevChord: false
    });
  }

  if (a === "resumeSession") {
    var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "chord", chordName: guitarStateRead("lastChordName", null) }));
    var sessionChord = resolveLegacySessionChord(D, session, guitarStateRead("level", 1));
    var sessionChordName = session && session.chordName ? session.chordName : (sessionChord && sessionChord.name ? sessionChord.name : null);
    if (!session) { act("quickStart"); return true; }
    return launchLegacyPracticeSession(session, sessionChord, sessionChordName, "chord");
  }

  if (a === "startSession") {
    var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "chord", chordName: v }));
    var sessionChord = resolveLegacySessionChord(D, session, guitarStateRead("level", 1));
    var sessionChordName = session && session.chordName ? session.chordName : (sessionChord && sessionChord.name ? sessionChord.name : null);
    return launchLegacyPracticeSession(session, sessionChord, sessionChordName, "chord");
  }

  if (a === "startDrill") {
    var drillLevel = guitarStateRead("level", 1);
    var session = getLegacyPracticeContext(buildLegacyPracticePlan({ mode: "drill", level: drillLevel }));
    var drillChords = resolveLegacyDrillChords(D, session);
    if (!drillChords.length) drillChords = buildFallbackLegacyDrillChords(D, drillLevel);
    return launchLegacyPracticeDrill(session, drillChords);
  }

  if (a === "repeatLegacyPracticeSession") {
    var currentChord = guitarStateRead("currentChord", null);
    var repeatChordName = currentChord ? currentChord.name : (guitarStateRead("lastChordName", null) || null);
    var repeatDuration = typeof guitarStateRead("timer", null) === "number" ? guitarStateRead("timer", null) : 120;
    if (typeof window.repeatLegacyPracticeSessionRequest === "function") {
      window.repeatLegacyPracticeSessionRequest({
        mode: repeatChordName ? "chord" : "quickStart",
        chordName: repeatChordName,
        durationSec: repeatDuration
      });
    }
    if (repeatChordName) return guitarAct("startSession", repeatChordName);
    return guitarAct("quickStart");
  }

  if (a === "repeatLegacyPracticeDrill") {
    if (typeof window.repeatLegacyPracticeDrillRequest === "function") {
      window.repeatLegacyPracticeDrillRequest({
        durationSec: typeof guitarStateRead("drillTimer", null) === "number" ? guitarStateRead("drillTimer", null) : 60,
        chordNames: guitarStateRead("drillChords", null) ? guitarStateRead("drillChords", null).map(function(ch) { return ch.name; }) : []
      });
    }
    return guitarAct("startDrill");
  }

  if (a === "drillSwitch") {
    snd("click");
    var drillChords = guitarStateRead("drillChords", []);
    var drillIdx = guitarStateRead("drillIdx", 0);
    var drillSwitches = guitarStateRead("drillSwitches", 0);
    var drillLastSwitchTime = guitarStateRead("drillLastSwitchTime", Date.now());
    var drillAdaptiveBpm = guitarStateRead("drillAdaptiveBpm", 60);
    var drillConsecutiveFast = guitarStateRead("drillConsecutiveFast", 0);
    var drillConsecutiveSlow = guitarStateRead("drillConsecutiveSlow", 0);
    var now = Date.now();
    var fromChord = drillChords[drillIdx].name;
    var toChord = drillChords[(drillIdx + 1) % 2].name;
    var elapsed = (now - drillLastSwitchTime) / 1000;
    var transitionStats = guitarStateEnsureObject("transitionStats");
    if (elapsed < 15) {
      var key = fromChord + "->" + toChord;
      if (!transitionStats[key]) transitionStats[key] = { attempts: 0, avgTime: 0, best: 999 };
      var ts = transitionStats[key];
      ts.avgTime = (ts.avgTime * ts.attempts + elapsed) / (ts.attempts + 1);
      ts.attempts++;
      if (elapsed < ts.best) ts.best = elapsed;
      // Adaptive BPM: adjust target tempo based on switch speed performance
      var targetSecs = 60 / drillAdaptiveBpm;
      if (elapsed < targetSecs * 0.8) {
        drillConsecutiveFast++; drillConsecutiveSlow = 0;
        if (drillConsecutiveFast >= 3) {
          drillAdaptiveBpm = Math.min(drillAdaptiveBpm + 3, 160);
          drillConsecutiveFast = 0;
          fireMicro("speed_up", "Speeding up!", "&#9654;&#65039;");
        }
      } else if (elapsed > targetSecs * 1.5) {
        drillConsecutiveSlow++; drillConsecutiveFast = 0;
        if (drillConsecutiveSlow >= 2) {
          drillAdaptiveBpm = Math.max(drillAdaptiveBpm - 5, 40);
          drillConsecutiveSlow = 0;
        }
      } else { drillConsecutiveFast = 0; drillConsecutiveSlow = 0; }
      guitarStateWrite("transitionStats", transitionStats);
    }
    _prevChordKey = fromChord;
    drillSwitches += 1;
    guitarPatchState({
      drillLastSwitchTime: now,
      drillAdaptiveBpm: drillAdaptiveBpm,
      drillConsecutiveFast: drillConsecutiveFast,
      drillConsecutiveSlow: drillConsecutiveSlow,
      drillIdx: (drillIdx + 1) % 2,
      drillSwitches: drillSwitches
    });
    if (drillSwitches === 1) fireMicro("clean_switch", "Smooth switch!", "&#9889;");
    if (drillSwitches === 3) fireMicro("three_switches", "On fire!", "&#128293;");
    render();
    return true;
  }

  if (a === "drillTransition") {
    var parts = v.split("|");
    var c1 = null, c2 = null;
    for (var i = 0; i < D.ALL_CHORDS.length; i++) {
      if (D.ALL_CHORDS[i].name === parts[0]) c1 = D.ALL_CHORDS[i];
      if (D.ALL_CHORDS[i].name === parts[1]) c2 = D.ALL_CHORDS[i];
    }
    if (c1 && c2) {
      launchLegacyPracticeDrill({ durationSec: 60 }, [c1, c2]);
    }
    return true;
  }

  if (a === "startQuiz") {
    guitarPatchState({ quizScore: 0, quizTotal: 0, quizStreak: 0, screen: SCR.QUIZ });
    genQ();
    if (window.sparkCore && typeof window.sparkCore.openLegacyQuiz === "function") {
      window.sparkCore.openLegacyQuiz({
        score: 0,
        total: 0,
        streak: 0
      });
    } else if (window.sparkCore && typeof window.sparkCore.syncLegacyQuizRuntimeState === "function") {
      window.sparkCore.syncLegacyQuizRuntimeState({
        score: 0,
        total: 0,
        streak: 0
      });
    }
    return true;
  }

  if (a === "answerQuiz" && guitarStateRead("quizAns", null) === null) {
    var ch;
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === v) ch = D.ALL_CHORDS[i];
    if (ch) {
      var quizQuestion = guitarStateRead("quizQ", null);
      var quizOptions = guitarStateRead("quizOpts", []);
      var quizScore = guitarStateRead("quizScore", 0);
      var quizTotal = guitarStateRead("quizTotal", 0);
      var quizStreak = guitarStateRead("quizStreak", 0);
      var ok = quizQuestion && ch.name === quizQuestion.name;
      var nextQuizScore = quizScore + (ok ? 1 : 0);
      var nextQuizTotal = quizTotal + 1;
      var nextQuizStreak = ok ? (quizStreak + 1) : 0;
      if (window.sparkCore && typeof window.sparkCore.syncLegacyQuizRuntimeState === "function") {
        window.sparkCore.syncLegacyQuizRuntimeState({
          question: quizQuestion,
          options: quizOptions,
          answer: ch.name,
          score: nextQuizScore,
          total: nextQuizTotal,
          streak: nextQuizStreak
        });
      }
      guitarPatchState({
        quizAns: ch.name,
        quizScore: nextQuizScore,
        quizTotal: nextQuizTotal,
        quizStreak: nextQuizStreak
      });
      if (ok) {
        snd("correct");
        guitarStateIncrement("quizCorrect", 1);
        guitarStateIncrement("xp", 10);
        logHistory("quiz", quizQuestion.name, 10);
        _sparkEmit("drill_answered", { appId: "chordspark", skillId: quizQuestion.name, correct: true, xp: 10 });
        checkBadges();
        saveState();
        if (nextQuizStreak === 3) fireMicro("quiz_streak", "Hat trick!", "&#127913;");
      } else {
        snd("wrong");
      }
      render();
      setTimeout(genQ, 1200);
    }
    return true;
  }

  if (a === "startEarTrain") {
    var av = [];
    for (var _l = 1; _l <= guitarStateRead("level", 1); _l++) av = av.concat(D.CHORDS[_l] || []);
    if (!av.length) av = D.CHORDS[1];
    var q = av[Math.floor(Math.random() * av.length)];
    var opts = [q.name];
    var attempts = 0;
    while (opts.length < 4 && attempts < 100) {
      var r = D.ALL_CHORDS[Math.floor(Math.random() * D.ALL_CHORDS.length)];
      if (opts.indexOf(r.name) === -1) opts.push(r.name);
      attempts++;
    }
    opts = shuffle(opts);
    guitarPatchState({
      earTrainQ: q.name,
      earTrainOpts: opts,
      earTrainAns: null,
      earTrainScore: guitarStateRead("earTrainScore", 0) || 0,
      earTrainTotal: guitarStateRead("earTrainTotal", 0) || 0,
      earTrainStreak: guitarStateRead("earTrainStreak", 0) || 0
    });
    if (window.sparkCore && typeof window.sparkCore.openLegacyEarTraining === "function") {
      window.sparkCore.openLegacyEarTraining({
        question: q.name,
        options: opts,
        answer: null,
        score: guitarStateRead("earTrainScore", 0),
        total: guitarStateRead("earTrainTotal", 0),
        streak: guitarStateRead("earTrainStreak", 0)
      });
    } else if (window.sparkCore && typeof window.sparkCore.syncLegacyEarTrainingRuntimeState === "function") {
      window.sparkCore.syncLegacyEarTrainingRuntimeState({
        question: q.name,
        options: opts,
        answer: null,
        score: guitarStateRead("earTrainScore", 0),
        total: guitarStateRead("earTrainTotal", 0),
        streak: guitarStateRead("earTrainStreak", 0)
      });
    }
    strumChord(q.name); render();
    return true;
  }

  if (a === "openSong") {
    var sg = typeof v === "number" ? D.SONGS[v] : null;
    if (!sg) { for (var i = 0; i < D.SONGS.length; i++) if (D.SONGS[i].title === v) { sg = D.SONGS[i]; break; } }
    if (sg && sg.level <= guitarStateRead("level", 1)) {
      if (typeof window.openSongSessionRequest === "function") {
        window.openSongSessionRequest({ songData: sg, source: "builtin" });
      }
      guitarPatchState({
        selectedSong: sg,
        songPlaying: false,
        songBeat: 0,
        screen: SCR.SONG
      });
      clearInterval(T.song);
      render();
    }
    return true;
  }

  if (a === "guidedStart") {
    var sessionNum = parseInt(v, 10);
    var corePlan = openGuidedSessionRuntime(sessionNum);
    if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
      guitarStateWrite("screen", SCR.GUIDED); snd("start"); render(); saveState();
      return true;
    }
    var plan = D.SESSIONS[(isNaN(sessionNum) ? guitarStateRead("guidedSession", 1) || 1 : sessionNum) - 1];
    if (!plan) { guitarStateWrite("guidedSession", 1); plan = D.SESSIONS[0]; }
    if (window.sparkCore && typeof window.sparkCore.syncLegacyGuidedSession === "function") {
      window.sparkCore.syncLegacyGuidedSession(plan, plan && plan.num ? plan.num : (guitarStateRead("guidedSession", 1) || 1));
    } else {
      guitarPatchState({
        guidedPlan: plan,
        guidedStep: "spark",
        newMovePhase: null,
        guidedPaused: false
      });
    }
    guitarStateWrite("screen", SCR.GUIDED); snd("start"); render();
    return true;
  }

  if (a === "guidedComplete") {
    if (guitarStateRead("metronomeOn", false)) stopMetronome();
    if (typeof window.completeGuidedSessionRequest === "function") {
      var guidedResult = window.completeGuidedSessionRequest();
      applyGuidedDoneNavigation();
      snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
      trigC(); guitarStateWrite("screen", SCR.GUIDED_DONE); render();
      return true;
    } else if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
      var guidedResult = window.sparkCore.completeSession({
        flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
        markPlanComplete: true
      });
      applyGuidedDoneNavigation();
      snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
      trigC(); guitarStateWrite("screen", SCR.GUIDED_DONE); render();
      return true;
    }
    var plan = guitarStateRead("guidedPlan", null);
    if (plan) {
      if (window.sparkCore && typeof window.sparkCore.applyLegacySessionStatePatch === "function") {
        var guidedPatch = {
          guided: {
            completedSessionNums: [plan.num],
            nextGuidedSession: Math.min(D.SESSIONS.length, plan.num + 1),
            chordProgress: {}
          }
        };
        if (plan.newMove && plan.newMove.chord) guidedPatch.guided.chordProgress[plan.newMove.chord] = 25;
        window.sparkCore.applyLegacySessionStatePatch(guidedPatch);
      } else {
        var completedGuidedSessions = guitarStateEnsureArray("completedGuidedSessions");
        if (completedGuidedSessions.indexOf(plan.num) < 0) completedGuidedSessions.push(plan.num);
        if (plan.newMove && plan.newMove.chord) {
          var chordProgress = guitarStateEnsureObject("chordProgress");
          chordProgress[plan.newMove.chord] = Math.min((chordProgress[plan.newMove.chord] || 0) + 25, 100);
          guitarStateWrite("chordProgress", chordProgress);
        }
        guitarStateWrite("guidedSession", Math.min(D.SESSIONS.length, plan.num + 1));
      }
      // Route through SparkSession for full progression cascade
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
    trigC(); guitarStateWrite("screen", SCR.GUIDED_DONE); render();
    return true;
  }

  if (a === "startFingerEx") {
    var ex = null;
    for (var fi = 0; fi < D.FINGER_EXERCISES.length; fi++) if (D.FINGER_EXERCISES[fi].id === v) { ex = D.FINGER_EXERCISES[fi]; break; }
    if (!ex) return true;
    guitarPatchState({
      fingerExId: v,
      fingerExTimer: ex.duration,
      fingerExActive: true,
      fingerExCount: 0
    });
    if (window.sparkCore && typeof window.sparkCore.openLegacyFingerExercise === "function") {
      window.sparkCore.openLegacyFingerExercise({
        exerciseId: v,
        durationSec: ex.duration,
        exerciseCount: 0
      });
    }
    snd("start");
    clearInterval(T.fingerEx);
    T.fingerEx = setInterval(function() {
      var fingerExActive = guitarStateRead("fingerExActive", false);
      var fingerExTimer = guitarStateRead("fingerExTimer", ex.duration);
      var fingerExCount = guitarStateRead("fingerExCount", 0);
      if (!fingerExActive) return;
      fingerExTimer--;
      guitarStateWrite("fingerExTimer", fingerExTimer);
      syncLegacyPracticeRuntime("tick", {
        mode: "finger_exercise",
        remainingSec: fingerExTimer,
        durationSec: ex.duration,
        timerActive: true,
        fingerExerciseId: v,
        fingerExerciseActive: true,
        fingerExerciseCount: fingerExCount
      });
      addPracticeSecond();
      if (fingerExTimer <= 0) {
        clearInterval(T.fingerEx);
        guitarStateWrite("fingerExActive", false);
        if (window.sparkCore && typeof window.sparkCore.completeLegacyFingerExercise === "function") {
          window.sparkCore.completeLegacyFingerExercise({
            exerciseId: v,
            durationSec: ex.duration,
            exerciseCount: fingerExCount + 1
          });
        } else {
          syncLegacyPracticeRuntime("pause", {
            mode: "finger_exercise",
            remainingSec: 0,
            durationSec: ex.duration,
            timerActive: false,
            fingerExerciseId: v,
            fingerExerciseActive: false,
            fingerExerciseCount: fingerExCount + 1
          });
        }
        snd("complete");
        var nextFingerStats = guitarStateEnsureObject("fingerStats");
        nextFingerStats[v] = (nextFingerStats[v] || 0) + 1;
        applyLegacyCompletionUpdate({
          xpDelta: 10,
          toastAmount: 10,
          incrementFields: { fingerExCount: 1 },
          resultFields: { fingerStats: nextFingerStats },
          save: true
        });
      }
      render();
    }, 1000);
    render();
    return true;
  }

  if (a === "stopFingerEx") {
    syncLegacyPracticeRuntime("pause", {
      mode: "finger_exercise",
      remainingSec: guitarStateRead("fingerExTimer", null),
      durationSec: typeof guitarStateRead("fingerExTimer", null) === "number" ? guitarStateRead("fingerExTimer", null) : null,
      timerActive: false,
      fingerExerciseId: guitarStateRead("fingerExId", null),
      fingerExerciseActive: false,
      fingerExerciseCount: guitarStateRead("fingerExCount", 0)
    });
    clearInterval(T.fingerEx);
    guitarPatchState({ fingerExActive: false, fingerExId: null });
    render();
    return true;
  }

  if (a === "drillCustomSet") {
    var idx = parseInt(v);
    var customSets = guitarStateRead("customSets", []);
    if (idx >= 0 && idx < customSets.length) {
      var cs = customSets[idx];
      var pool = [];
      for (var i = 0; i < cs.chords.length; i++) {
        for (var j = 0; j < D.ALL_CHORDS.length; j++) {
          if (D.ALL_CHORDS[j].name === cs.chords[i]) { pool.push(D.ALL_CHORDS[j]); break; }
        }
      }
      if (pool.length < 2) {
        if (typeof showToast === "function") showToast("That practice set needs at least 2 valid chords.");
        return true;
      }
      var c1 = pool[Math.floor(Math.random() * pool.length)], c2 = c1, n = 0;
      while (c2.name === c1.name && pool.length > 1 && n < 20) { c2 = pool[Math.floor(Math.random() * pool.length)]; n++; }
      launchLegacyPracticeDrill({ durationSec: 60 }, [c1, c2]);
    }
    return true;
  }

  return false;
}

window.guitarAct = guitarAct;
})();
