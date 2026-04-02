// js/instruments/guitar/app.js — guitar-specific act() handler
(function() {

function guitarAct(a, v) {
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
    var ch = null;
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === S.lastChordName) ch = D.ALL_CHORDS[i];
    if (!ch) { act("quickStart"); return true; }
    S.sessionMicros = [];
    snd("start"); S.currentChord = ch; S.timer = 120; S.timerActive = true; S.selectedVoicing = 0; _prevChordKey = ch.name; S.screen = SCR.SESSION; render(); clearTimeout(T.session); T.session = setTimeout(tickS, 1000);
    return true;
  }

  if (a === "startSession") {
    var ch;
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === v) ch = D.ALL_CHORDS[i];
    if (ch) { S.sessionMicros = []; S.lastChordName = ch.name; snd("start"); S.currentChord = ch; S.timer = 120; S.timerActive = true; S.selectedVoicing = 0; _prevChordKey = ch.name; S.screen = SCR.SESSION; render(); clearTimeout(T.session); T.session = setTimeout(tickS, 1000); saveState(); }
    return true;
  }

  if (a === "startDrill") {
    var av = D.CHORDS[S.level] || D.CHORDS[1];
    var c1 = av[Math.floor(Math.random() * av.length)], c2 = c1, n = 0;
    while (c2.name === c1.name && av.length > 1 && n < 20) { c2 = av[Math.floor(Math.random() * av.length)]; n++; }
    S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
    S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
    _prevChordKey = c1.name;
    snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
    return true;
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
      if (!S.transitionStats[key]) S.transitionStats[key] = { attempts: 0, avgTime: 0, best: 999 };
      var ts = S.transitionStats[key];
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
      S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
      _prevChordKey = c1.name;
      snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
    }
    return true;
  }

  if (a === "startQuiz") {
    S.quizScore = 0; S.quizTotal = 0; S.quizStreak = 0; genQ(); S.screen = SCR.QUIZ;
    return true;
  }

  if (a === "answerQuiz" && S.quizAns === null) {
    var ch;
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === v) ch = D.ALL_CHORDS[i];
    if (ch) {
      var ok = ch.name === S.quizQ.name; S.quizAns = ch.name;
      if (ok) { snd("correct"); S.quizCorrect++; S.quizScore++; S.quizStreak++; S.xp += 10; logHistory("quiz", S.quizQ.name, 10); _sparkEmit("drill_answered", { appId: "chordspark", skillId: S.quizQ.name, correct: true, xp: 10 }); checkBadges(); saveState(); if (S.quizStreak === 3) fireMicro("quiz_streak", "Hat trick!", "&#127913;"); }
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
    strumChord(q.name); render();
    return true;
  }

  if (a === "openSong") {
    var sg = typeof v === "number" ? D.SONGS[v] : null;
    if (!sg) { for (var i = 0; i < D.SONGS.length; i++) if (D.SONGS[i].title === v) { sg = D.SONGS[i]; break; } }
    if (sg && sg.level <= S.level) { S.selectedSong = sg; S.songPlaying = false; S.songBeat = 0; clearInterval(T.song); S.screen = SCR.SONG; render(); }
    return true;
  }

  if (a === "guidedStart") {
    var plan = D.SESSIONS[S.guidedSession - 1];
    if (!plan) { S.guidedSession = 1; plan = D.SESSIONS[0]; }
    S.guidedPlan = plan; S.guidedStep = "spark"; S.newMovePhase = null; S.guidedPaused = false;
    S.screen = SCR.GUIDED; snd("start"); render();
    return true;
  }

  if (a === "guidedComplete") {
    if (S.metronomeOn) stopMetronome();
    var plan = S.guidedPlan;
    if (plan) {
      if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
      if (S.completedGuidedSessions.indexOf(plan.num) < 0) S.completedGuidedSessions.push(plan.num);
      S.xp += 30; S.sessions++;
      var today = new Date().toISOString().split("T")[0];
      if (S.lastSessionDate !== today) { S.streak++; S.lastSessionDate = today; }
      if (plan.newMove && plan.newMove.chord) {
        var k = plan.newMove.chord;
        S.chordProgress[k] = Math.min((S.chordProgress[k] || 0) + 25, 100);
      }
      S.guidedSession = Math.min(D.SESSIONS.length, plan.num + 1);
      logHistory("guided", "Session " + plan.num + ": " + plan.title, 30);
      _sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "guided_" + plan.num, xp: 30 });
      checkBadges();
    }
    S.xpToast = { amount: 30, time: Date.now() };
    saveState(); trigC(); S.screen = SCR.GUIDED_DONE; render();
    return true;
  }

  if (a === "startFingerEx") {
    var ex = null;
    for (var fi = 0; fi < D.FINGER_EXERCISES.length; fi++) if (D.FINGER_EXERCISES[fi].id === v) { ex = D.FINGER_EXERCISES[fi]; break; }
    if (!ex) return true;
    S.fingerExId = v; S.fingerExTimer = ex.duration; S.fingerExActive = true; S.fingerExCount = 0;
    snd("start");
    clearInterval(T.fingerEx);
    T.fingerEx = setInterval(function() {
      if (!S.fingerExActive) return;
      S.fingerExTimer--;
      addPracticeSecond();
      if (S.fingerExTimer <= 0) {
        clearInterval(T.fingerEx); S.fingerExActive = false;
        snd("complete"); S.xp += 10;
        if (typeof S.fingerStats !== "object" || S.fingerStats === null) S.fingerStats = {};
        S.fingerStats[v] = (S.fingerStats[v] || 0) + 1;
        S.xpToast = { amount: 10, time: Date.now() };
        saveState();
      }
      render();
    }, 1000);
    render();
    return true;
  }

  if (a === "stopFingerEx") {
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
