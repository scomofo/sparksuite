// js/instruments/guitar/app.js — guitar-specific act() handler
(function() {

function getGuitarAppInstrument() {
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

function guitarAct(a, v) {
  var inst = getGuitarAppInstrument();
  var D = inst && inst.getData ? inst.getData() : {};

  if (a === "quickStart") {
    var session;
    if (typeof SparkCore !== "undefined" && typeof SparkCore.startSession === "function") {
      session = SparkCore.startSession({ mode: "quickStart", level: S.level });
    } else {
      session = SparkSession.buildSession({ mode: "quickStart", level: S.level });
    }
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
    clearTimeout(T.session);
    T.session = setTimeout(tickS, 1000);
    saveState();
    return true;
  }

  if (a === "resumeSession") {
    var session;
    if (typeof SparkCore !== "undefined" && typeof SparkCore.startSession === "function") {
      session = SparkCore.startSession({ mode: "chord", chordName: S.lastChordName });
    } else {
      session = SparkSession.buildSession({ mode: "chord", chordName: S.lastChordName });
    }
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
    if (typeof _prevChordKey !== "undefined") _prevChordKey = session.chordName;
    S.screen = SCR.SESSION;
    render();
    clearTimeout(T.session);
    T.session = setTimeout(tickS, 1000);
    saveState();
    return true;
  }

  if (a === "startSession") {
    var session;
    if (typeof SparkCore !== "undefined" && typeof SparkCore.startSession === "function") {
      session = SparkCore.startSession({ mode: "chord", chordName: v });
    } else {
      session = SparkSession.buildSession({ mode: "chord", chordName: v });
    }
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
    if (typeof _prevChordKey !== "undefined") _prevChordKey = session.chordName;
    S.screen = SCR.SESSION;
    render();
    clearTimeout(T.session);
    T.session = setTimeout(tickS, 1000);
    saveState();
    return true;
  }

  if (a === "startDrill") {
    var session;
    if (typeof SparkCore !== "undefined" && typeof SparkCore.startSession === "function") {
      session = SparkCore.startSession({ mode: "drill", level: S.level });
    } else {
      session = SparkSession.buildSession({ mode: "drill", level: S.level });
    }
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
    if (typeof _prevChordKey !== "undefined") _prevChordKey = session.chords[0].name;
    snd("start");
    S.screen = SCR.DRILL;
    render();
    T.drill = setTimeout(tickD, 1000);
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
    if (repeatChordName) return guitarAct("startSession", repeatChordName);
    return guitarAct("quickStart");
  }

  if (a === "repeatLegacyPracticeDrill") {
    if (typeof window.repeatLegacyPracticeDrillRequest === "function") {
      window.repeatLegacyPracticeDrillRequest({
        durationSec: typeof S.drillTimer === "number" ? S.drillTimer : 60,
        chordNames: S.drillChords ? S.drillChords.map(function(ch) { return ch.name; }) : []
      });
    }
    return guitarAct("startDrill");
  }

  if (a === "drillSwitch") {
    snd("click");
    var now = Date.now();
    var fromChord = S.drillChords[S.drillIdx].name;
    var toChord = S.drillChords[(S.drillIdx + 1) % 2].name;
    var elapsed = (now - S.drillLastSwitchTime) / 1000;
    S.drillLastSwitchTime = now;
    if (elapsed < 15) {
      var key = fromChord + "->" + toChord;
      var ts = SparkTransitionStats.ensure(key, { attempts: 0, avgTime: 0, best: 999 });
      ts.avgTime = (ts.avgTime * ts.attempts + elapsed) / (ts.attempts + 1);
      ts.attempts++;
      if (elapsed < ts.best) ts.best = elapsed;
      // Adaptive BPM: adjust target tempo based on switch speed performance
      var targetSecs = 60 / S.drillAdaptiveBpm;
      if (elapsed < targetSecs * 0.8) {
        S.drillConsecutiveFast++; S.drillConsecutiveSlow = 0;
        if (S.drillConsecutiveFast >= 3) {
          S.drillAdaptiveBpm = Math.min(S.drillAdaptiveBpm + 3, 160);
          S.drillConsecutiveFast = 0;
          fireMicro("speed_up", "Speeding up!", "&#9654;&#65039;");
        }
      } else if (elapsed > targetSecs * 1.5) {
        S.drillConsecutiveSlow++; S.drillConsecutiveFast = 0;
        if (S.drillConsecutiveSlow >= 2) {
          S.drillAdaptiveBpm = Math.max(S.drillAdaptiveBpm - 5, 40);
          S.drillConsecutiveSlow = 0;
        }
      } else { S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0; }
    }
    _prevChordKey = fromChord;
    S.drillIdx = (S.drillIdx + 1) % 2; S.drillSwitches++;
    if (S.drillSwitches === 1) fireMicro("clean_switch", "Smooth switch!", "&#9889;");
    if (S.drillSwitches === 3) fireMicro("three_switches", "On fire!", "&#128293;");
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
      if (typeof window.openLegacyPracticeDrillRequest === "function") {
        window.openLegacyPracticeDrillRequest({
          durationSec: 60,
          chordNames: [c1.name, c2.name]
        });
      }
      S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
      _prevChordKey = c1.name;
      snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
    }
    return true;
  }

  if (a === "startQuiz") {
    S.quizScore = 0; S.quizTotal = 0; S.quizStreak = 0; genQ(); S.screen = SCR.QUIZ;
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

  if (a === "answerQuiz" && S.quizAns === null) {
    var ch;
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === v) ch = D.ALL_CHORDS[i];
    if (ch) {
      var ok = ch.name === S.quizQ.name;
      var nextQuizScore = S.quizScore + (ok ? 1 : 0);
      var nextQuizTotal = S.quizTotal + 1;
      var nextQuizStreak = ok ? (S.quizStreak + 1) : 0;
      var activityInstrument = getGuitarAppInstrument();
      var activityAppId = activityInstrument ? (activityInstrument.id || activityInstrument.appId || activityInstrument.instrumentId || "chordspark") : "chordspark";
      if (window.sparkCore && typeof window.sparkCore.syncLegacyQuizRuntimeState === "function") {
        window.sparkCore.syncLegacyQuizRuntimeState({
          question: S.quizQ,
          options: S.quizOpts,
          answer: ch.name,
          score: nextQuizScore,
          total: nextQuizTotal,
          streak: nextQuizStreak
        });
      }
      S.quizAns = ch.name;
      if (ok) { snd("correct"); S.quizCorrect++; S.quizScore++; S.quizStreak++; S.xp += 10; logHistory("quiz", S.quizQ.name, 10); _sparkEmit("drill_answered", { appId: activityAppId, skillId: S.quizQ.name, correct: true, xp: 10 }); checkBadges(); saveState(); if (S.quizStreak === 3) fireMicro("quiz_streak", "Hat trick!", "&#127913;"); }
      else { snd("wrong"); S.quizStreak = 0; }
      S.quizTotal++; render(); setTimeout(genQ, 1200);
    }
    return true;
  }

  if (a === "startEarTrain") {
    var av = [];
    for (var _l = 1; _l <= S.level; _l++) av = av.concat(D.CHORDS[_l] || []);
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
    S.earTrainQ = q.name; S.earTrainOpts = opts; S.earTrainAns = null;
    S.earTrainScore = S.earTrainScore || 0; S.earTrainTotal = S.earTrainTotal || 0; S.earTrainStreak = S.earTrainStreak || 0;
    if (window.sparkCore && typeof window.sparkCore.openLegacyEarTraining === "function") {
      window.sparkCore.openLegacyEarTraining({
        question: q.name,
        options: opts,
        answer: null,
        score: S.earTrainScore,
        total: S.earTrainTotal,
        streak: S.earTrainStreak
      });
    } else if (window.sparkCore && typeof window.sparkCore.syncLegacyEarTrainingRuntimeState === "function") {
      window.sparkCore.syncLegacyEarTrainingRuntimeState({
        question: q.name,
        options: opts,
        answer: null,
        score: S.earTrainScore,
        total: S.earTrainTotal,
        streak: S.earTrainStreak
      });
    }
    strumChord(q.name); render();
    return true;
  }

  if (a === "openSong") {
    var sg = typeof v === "number" ? D.SONGS[v] : null;
    if (!sg) { for (var i = 0; i < D.SONGS.length; i++) if (D.SONGS[i].title === v) { sg = D.SONGS[i]; break; } }
    if (sg && sg.level <= S.level) {
      if (typeof window.openSongSessionRequest === "function") {
        window.openSongSessionRequest({ songData: sg, source: "builtin" });
      }
      S.selectedSong = sg; S.songPlaying = false; S.songBeat = 0; clearInterval(T.song); S.screen = SCR.SONG; render();
    }
    return true;
  }

  if (a === "start_guided_session") {
    var sessionNum = parseInt(v, 10);
    if (typeof window.openGuidedSessionRequest === "function") {
      var guidedSession = isNaN(sessionNum) ? (S.guidedSession || 1) : sessionNum;
      var corePlan = window.openGuidedSessionRequest({
        sessionNum: guidedSession
      });
      if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
        S.screen = SCR.GUIDED; snd("start"); render(); saveState();
        return true;
      }
    } else if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
      var guidedSession = isNaN(sessionNum) ? (S.guidedSession || 1) : sessionNum;
      var corePlan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
        sessionNum: guidedSession
      });
      if (corePlan && corePlan.context && corePlan.context.guidedPlan) {
        S.screen = SCR.GUIDED; snd("start"); render(); saveState();
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
      S.guidedPlan = plan; S.guidedStep = "spark"; S.newMovePhase = null; S.guidedPaused = false;
    }
    S.screen = SCR.GUIDED; snd("start"); render();
    return true;
  }

  if (a === "guidedComplete") {
    if (S.metronomeOn) stopMetronome();
    if (typeof window.completeGuidedSessionRequest === "function") {
      var guidedResult = window.completeGuidedSessionRequest();
      snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
      trigC(); S.screen = SCR.GUIDED_DONE; render();
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
      snd(guidedResult && guidedResult.audioCue === "levelup" ? "levelup" : "complete");
      trigC(); S.screen = SCR.GUIDED_DONE; render();
      return true;
    }
    var plan = S.guidedPlan;
    if (plan) {
      if (window.SparkProgressBridge && typeof SparkProgressBridge.applySessionStatePatch === "function") {
        var guidedPatch = {
          guided: {
            completedSessionNums: [plan.num],
            nextGuidedSession: Math.min(D.SESSIONS.length, plan.num + 1),
            chordProgress: {}
          }
        };
        if (plan.newMove && plan.newMove.chord) guidedPatch.guided.chordProgress[plan.newMove.chord] = 25;
        SparkProgressBridge.applySessionStatePatch(guidedPatch);
      } else {
        if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
        if (S.completedGuidedSessions.indexOf(plan.num) < 0) S.completedGuidedSessions.push(plan.num);
        if (plan.newMove && plan.newMove.chord) {
          SparkChordProgress.add(plan.newMove.chord, 25);
        }
        S.guidedSession = Math.min(D.SESSIONS.length, plan.num + 1);
      }
      // Route through SparkSession for full progression cascade
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
    trigC(); S.screen = SCR.GUIDED_DONE; render();
    return true;
  }

  if (a === "startFingerEx") {
    var ex = null;
    for (var fi = 0; fi < D.FINGER_EXERCISES.length; fi++) if (D.FINGER_EXERCISES[fi].id === v) { ex = D.FINGER_EXERCISES[fi]; break; }
    if (!ex) return true;
    S.fingerExId = v; S.fingerExTimer = ex.duration; S.fingerExActive = true; S.fingerExCount = 0;
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
      if (!S.fingerExActive) return;
      S.fingerExTimer--;
      if (window.sparkCore && typeof window.sparkCore.syncLegacyPracticeRuntimeState === "function") {
        window.sparkCore.syncLegacyPracticeRuntimeState("tick", {
          mode: "finger_exercise",
          remainingSec: S.fingerExTimer,
          durationSec: ex.duration,
          timerActive: true,
          fingerExerciseId: v,
          fingerExerciseActive: true,
          fingerExerciseCount: S.fingerExCount
        });
      }
      addPracticeSecond();
      if (S.fingerExTimer <= 0) {
        clearInterval(T.fingerEx); S.fingerExActive = false;
        if (window.sparkCore && typeof window.sparkCore.completeLegacyFingerExercise === "function") {
          window.sparkCore.completeLegacyFingerExercise({
            exerciseId: v,
            durationSec: ex.duration,
            exerciseCount: (S.fingerExCount || 0) + 1
          });
        } else if (window.sparkCore && typeof window.sparkCore.syncLegacyPracticeRuntimeState === "function") {
          window.sparkCore.syncLegacyPracticeRuntimeState("pause", {
            mode: "finger_exercise",
            remainingSec: 0,
            durationSec: ex.duration,
            timerActive: false,
            fingerExerciseId: v,
            fingerExerciseActive: false,
            fingerExerciseCount: (S.fingerExCount || 0) + 1
          });
        }
        snd("complete"); if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyReward === "function") SparkProgressBridge.applyLegacyReward({ xpDelta: 10, toastAmount: 10 }); else { S.xp += 10; S.xpToast = { amount: 10, time: Date.now() }; }
        SparkFingerStats.increment(v, 1);
        S.fingerExCount = (S.fingerExCount || 0) + 1;
        saveState();
      }
      render();
    }, 1000);
    render();
    return true;
  }

  if (a === "stopFingerEx") {
    if (window.sparkCore && typeof window.sparkCore.syncLegacyPracticeRuntimeState === "function") {
      window.sparkCore.syncLegacyPracticeRuntimeState("pause", {
        mode: "finger_exercise",
        remainingSec: S.fingerExTimer,
        durationSec: typeof S.fingerExTimer === "number" ? S.fingerExTimer : null,
        timerActive: false,
        fingerExerciseId: S.fingerExId,
        fingerExerciseActive: false,
        fingerExerciseCount: S.fingerExCount
      });
    }
    clearInterval(T.fingerEx); S.fingerExActive = false; S.fingerExId = null; render();
    return true;
  }

  if (a === "drillCustomSet") {
    var idx = parseInt(v);
    if (idx >= 0 && idx < S.customSets.length) {
      var cs = S.customSets[idx];
      var pool = [];
      for (var i = 0; i < cs.chords.length; i++) {
        for (var j = 0; j < D.ALL_CHORDS.length; j++) {
          if (D.ALL_CHORDS[j].name === cs.chords[i]) { pool.push(D.ALL_CHORDS[j]); break; }
        }
      }
      if (pool.length < 2) return true;
      var c1 = pool[Math.floor(Math.random() * pool.length)], c2 = c1, n = 0;
      while (c2.name === c1.name && pool.length > 1 && n < 20) { c2 = pool[Math.floor(Math.random() * pool.length)]; n++; }
      S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
      _prevChordKey = c1.name;
      snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
    }
    return true;
  }

  return false;
}

window.guitarAct = guitarAct;
})();
