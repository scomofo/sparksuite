// js/timers.js
// Legacy game-loop / timer / parser block extracted from js/app.js.
// Owns: practice/drill/daily timer ticks (tickS / tickD / tickDy / genQ),
// the rhythm-game and chord-runner per-frame loops,
// the chord-sheet import parser, the stem-file URL loader,
// the _prevChordKey morph-tracker var, and stopAllTimers (the cleanup
// entry point used by SparkInstruments.deactivate).
//
// All functions and module-scoped vars remain global so existing callers
// in instrument modules, page renderers, and tests work unchanged.
//
// Pre-conditions: this file must load AFTER js/state.js (uses S, T) and
// AFTER any helpers it calls (e.g. snd, stopMetronome, render).
// See <script> ordering in index.html.

// ===== TIMERS =====
// (normalizeAppTextInputValue moved to js/render.js; it's only used by the
// onboarding overlay which now lives there too.)

function getTimerCore(){
  return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
}

function tickS(){
  if(S.timerActive&&S.timer>0){
    S.timer--;
    syncLegacyPracticeRuntimeRequest("tick", {
      remainingSec: S.timer,
      timerActive: S.timerActive,
      mode: S.lastChordName ? "chord" : "quickStart",
      chordName: S.currentChord ? S.currentChord.name : null,
      durationSec: 120
    });
    if(S.timer%30===0&&S.timer>0&&SparkPsychology.shouldReward(S.sessions)){snd("tick");if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:5,toastAmount:5});else{S.xp+=5;S.xpToast={amount:5,time:Date.now()};}saveState();}
    else if(S.timer%30===0&&S.timer>0){if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:5});else{S.xp+=5;}} // silent XP accrual when toast skipped
    if(S.timer===60)fireMicro("halfway","Halfway there!","&#128170;");
    addPracticeSecond();
    render();T.session=setTimeout(tickS,1000);
  } else if(S.timerActive&&S.timer<=0){
    S.timerActive=false;clearTimeout(T.session);
    if(S.metronomeOn)stopMetronome();
    if(S.chordDetectOn)stopChordDetect();
    var core=getTimerCore();
    if(core && typeof core.completeLegacyPracticeSession === "function"){
      core.completeLegacyPracticeSession({
        mode: S.lastChordName ? "chord" : "quickStart",
        chordName: S.currentChord ? S.currentChord.name : null,
        durationSec: 120
      });
    }
    // Contract-only completion (Phase 7): the orchestrator is the single
    // progression entry point for this flow — the legacy processResults call
    // and the shadow observer call it ran beside are retired. Fallback to the
    // direct legacy call only when the contract stack isn't loaded.
    var outcome;
    if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
      var sessionResult = SparkContracts.createSessionResult({
        mode: S.lastChordName ? "chord" : "quickStart",
        chordName: S.currentChord ? S.currentChord.name : null,
        duration: 120,
        accuracy: 0.75,
        completed: true
      });
      var progressOutcome = SparkProgressOrchestrator.applySessionOutcome(sessionResult, { drive: true });
      if (typeof console !== "undefined" && console.debug) {
        console.debug("[App] ProgressOutcome:", progressOutcome);
      }
      outcome = progressOutcome.sessionEffects;
    } else {
      outcome = SparkSession.processResults({
        type:"session",
        chordName:S.currentChord?S.currentChord.name:null,
        duration:120
      });
    }
    if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({toastAmount:outcome.xpEarned,jackpot:outcome.jackpot});
    else S.xpToast={amount:outcome.xpEarned,time:Date.now(),jackpot:outcome.jackpot};
    if(outcome.jackpot){snd("levelup");}else{snd("complete");}
    if(outcome.leveledUp)snd("levelup");
    trigC();S.screen=SCR.COMPLETE;render();
  }
}

function tickD(){
  if(S.screen===SCR.DRILL&&S.drillTimer>0){
    S.drillTimer--;
    syncLegacyPracticeRuntimeRequest("tick", {
      remainingSec: S.drillTimer,
      timerActive: true,
      mode: "drill",
      chordNames: S.drillChords.map(function(c){ return c.name; }),
      durationSec: 60
    });
    if(S.drillTimer%30===0&&S.drillTimer>0&&SparkPsychology.shouldReward(S.sessions)){snd("tick");if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:5,toastAmount:5});else{S.xp+=5;S.xpToast={amount:5,time:Date.now()};}saveState();}
    else if(S.drillTimer%30===0&&S.drillTimer>0){if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:5});else{S.xp+=5;}}
    addPracticeSecond();
    if(!updateDrillTimerUI())render(); // partial update if elements exist
    T.drill=setTimeout(tickD,1000);
  } else if(S.screen===SCR.DRILL&&S.drillTimer<=0){
    clearTimeout(T.drill);snd("complete");
    var detail=S.drillChords.map(function(c){return c.name;}).join(" / ");
    var activityInstrument = getActiveInstrumentIdentityForActivity();
    var core=getTimerCore();
    if(core && typeof core.completeLegacyPracticeDrill === "function"){
      core.completeLegacyPracticeDrill({
        durationSec: 60,
        chordNames: S.drillChords.map(function(c){return c.name;})
      });
    }
    // Contract-only completion (Phase 7): the orchestrator drives the drill
    // completion sequence — the legacy call here and the shadow observer call
    // it ran beside are retired. Fallbacks below only cover contexts where
    // the contract stack isn't loaded.
    if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
      var drillSessionResult = SparkContracts.createSessionResult({
        mode: "drill",
        instrumentId: activityInstrument.appId,
        exerciseResults: S.drillChords.map(function(c){return c.name;}),
        chordName: S.drillChords && S.drillChords[0] ? S.drillChords[0].name : null,
        duration: 60,
        accuracy: 0.75,
        completed: true
      });
      var drillProgressOutcome = SparkProgressOrchestrator.applySessionOutcome(drillSessionResult, { drive: true });
      if (typeof console !== "undefined" && console.debug) {
        console.debug("[App] Drill ProgressOutcome:", drillProgressOutcome);
      }
    }else if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:20,
        toastAmount:20,
        incrementFields:{drillCount:1},
        history:{type:"drill",detail:detail,xp:20},
        emit:{type:"practice_session_completed",payload:{ appId: activityInstrument.appId, type: "drill", xp: 20, detail: detail }},
        checkBadges:true
      });
    }else{
      S.drillCount++;if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:20,toastAmount:20});else{S.xp+=20;S.xpToast={amount:20,time:Date.now()};}
      logHistory("drill",detail,20);
      _sparkEmit("practice_session_completed", { appId: activityInstrument.appId, type: "drill", xp: 20, detail: detail });
      checkBadges();saveState();
    }
    trigC();S.screen=SCR.DRILL_DONE;render();
  }
}

function tickDy(){
  if(S.screen===SCR.DAILY&&S.dailyTimer>0&&!S.dailyComplete){
    S.dailyTimer--;addPracticeSecond();
    syncLegacyDailyRuntimeRequest("tick", {
      challengeId: S.dailyChallenge ? S.dailyChallenge.id : null,
      remainingSec: S.dailyTimer,
      timerActive: true,
      durationSec: S.dailyChallenge && S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge && S.dailyChallenge.id === "marathon" ? 180 : 60
    });
    if(!updateDailyTimerUI())render(); // partial update if elements exist
    T.daily=setTimeout(tickDy,1000);
  } else if(S.screen===SCR.DAILY&&S.dailyTimer<=0&&!S.dailyComplete){
    clearTimeout(T.daily);snd("complete");
    var xp=(S.dailyChallenge&&S.dailyChallenge.xp)||40;
    completeLegacyDailyChallengeRequest({
      challengeId: S.dailyChallenge ? S.dailyChallenge.id : null,
      durationSec: S.dailyChallenge && S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge && S.dailyChallenge.id === "marathon" ? 180 : 60
    });
    // Contract-only completion (Phase 7): the orchestrator drives the daily
    // challenge completion sequence; fallbacks only cover contexts without
    // the contract stack.
    if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
      var dailyResult = SparkContracts.createSessionResult({
        mode: "daily",
        duration: S.dailyChallenge && S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge && S.dailyChallenge.id === "marathon" ? 180 : 60,
        accuracy: 1.0,
        completed: true,
        meta: { challenge: S.dailyChallenge ? { id: S.dailyChallenge.id, title: S.dailyChallenge.title, xp: S.dailyChallenge.xp } : null }
      });
      SparkProgressOrchestrator.applySessionOutcome(dailyResult, { drive: true });
    }else if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:xp,
        toastAmount:xp,
        setFlags:{dailyComplete:true},
        incrementFields:{dailyDone:1},
        history:{type:"daily",detail:S.dailyChallenge?S.dailyChallenge.title:"Challenge",xp:xp},
        checkBadges:true
      });
    }else{
      S.dailyComplete=true;S.dailyDone++;
      if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:xp,toastAmount:xp});else{S.xp+=xp;S.xpToast={amount:xp,time:Date.now()};}
      logHistory("daily",S.dailyChallenge?S.dailyChallenge.title:"Challenge",xp);
      checkBadges();saveState();
    }
    trigC();render();
  }
}

function genQ(){
  var av=[];for(var _l=1;_l<=S.level;_l++)av=av.concat(CHORDS[_l]||[]);
  if(!av.length)av=CHORDS[1];
  var q=av[Math.floor(Math.random()*av.length)];
  var opts=[q];
  var attempts=0;
  while(opts.length<3&&attempts<100){
    var r=ALL_CHORDS[Math.floor(Math.random()*ALL_CHORDS.length)];
    var d=false;for(var i=0;i<opts.length;i++)if(opts[i].name===r.name)d=true;
    if(!d)opts.push(r);
    attempts++;
  }
  opts=shuffle(opts);
  S.quizQ=q;S.quizOpts=opts;S.quizAns=null;
  var core=getTimerCore();
  if(core && typeof core.syncLegacyQuizRuntimeState === "function"){
    core.syncLegacyQuizRuntimeState({
      question: q,
      options: opts,
      answer: null
    });
  }
  render();
}

// ===== RHYTHM GAME =====
var _rhythmAnim=null;
function rhythmTick(){
  if(!S.rhythmActive)return;
  var elapsed=performance.now()-S.rhythmStartTime;
  var lastBeatTime=S.rhythmBeats[S.rhythmBeats.length-1].time;
  if(elapsed>lastBeatTime+2000){
    finishRhythm();
    return;
  }
  for(var i=0;i<S.rhythmBeats.length;i++){
    var b=S.rhythmBeats[i];
    if(!b.hit&&elapsed-b.time>200){
      b.hit=true;b.result="miss";
      S.rhythmCombo=0;
    }
  }
  syncLegacyRhythmRuntimeRequest({
    active: S.rhythmActive,
    beats: S.rhythmBeats,
    score: S.rhythmScore,
    combo: S.rhythmCombo,
    maxCombo: S.rhythmMaxCombo,
    startTimeMs: S.rhythmStartTime
  });
  render();
  _rhythmAnim=requestAnimationFrame(rhythmTick);
}

function finishRhythm(){
  var total=S.rhythmBeats.length,hits=0;
  for(var i=0;i<total;i++)if(S.rhythmBeats[i].result==="perfect"||S.rhythmBeats[i].result==="good")hits++;
  var acc=total>0?Math.round((hits/total)*100):0;
  var rhythmResult={score:S.rhythmScore,accuracy:acc,maxCombo:S.rhythmMaxCombo,total:total,hits:hits};
  completeLegacyRhythmGameRequest({
    beats: S.rhythmBeats,
    score: S.rhythmScore,
    combo: S.rhythmCombo,
    maxCombo: S.rhythmMaxCombo,
    startTimeMs: S.rhythmStartTime,
    results: rhythmResult
  });
  if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
    SparkProgressBridge.applyLegacyActivityRuntime({
      setFields:{rhythmActive:false,rhythmResults:rhythmResult},
      cancelAnimationFrames:_rhythmAnim?[_rhythmAnim]:[]
    });
  }else{
    S.rhythmActive=false;
    if(_rhythmAnim)cancelAnimationFrame(_rhythmAnim);
    S.rhythmResults=rhythmResult;
  }
  _rhythmAnim=null;
  // Contract-only completion (Phase 7): the orchestrator drives the rhythm
  // completion sequence and owns the score→XP policy; fallbacks only cover
  // contexts without the contract stack.
  var xp=Math.round(S.rhythmScore/10);
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var rhythmSessionResult = SparkContracts.createSessionResult({
      mode: "rhythm",
      accuracy: total > 0 ? hits / total : 0,
      completed: true,
      meta: { score: S.rhythmScore }
    });
    SparkProgressOrchestrator.applySessionOutcome(rhythmSessionResult, { drive: true });
  }else if(xp>0){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:xp,
        history:{type:"rhythm",detail:"Score: "+S.rhythmScore,xp:xp}
      });
    }else{
      if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:xp});else S.xp+=xp;logHistory("rhythm","Score: "+S.rhythmScore,xp);saveState();
    }
  }
  render();
}

// ===== CHORD RUNNER =====
var _runnerAnim=null;
var _runnerObstId=0;

function spawnRunnerObstacle(){
  var av=CHORDS[S.level]||CHORDS[1];
  var isTarget=Math.random()<0.35;
  var chord;
  if(isTarget){
    chord=S.runnerTarget;
  }else{
    chord=av[Math.floor(Math.random()*av.length)];
    var tries=0;
    while(chord.name===S.runnerTarget.name&&av.length>1&&tries<15){
      chord=av[Math.floor(Math.random()*av.length)];tries++;
    }
  }
  S.runnerObstacles.push({
    id:++_runnerObstId,name:chord.name,short:chord.short,
    x:460,isTarget:chord.name===S.runnerTarget.name,
    hit:false,result:null
  });
}

function changeRunnerTarget(){
  var av=CHORDS[S.level]||CHORDS[1];
  var prev=S.runnerTarget;var tries=0;
  S.runnerTarget=av[Math.floor(Math.random()*av.length)];
  while(S.runnerTarget.name===prev.name&&av.length>1&&tries<15){
    S.runnerTarget=av[Math.floor(Math.random()*av.length)];tries++;
  }
  // Mark existing unmatched obstacles as non-target (new target now)
  for(var i=0;i<S.runnerObstacles.length;i++){
    if(!S.runnerObstacles[i].hit){
      S.runnerObstacles[i].isTarget=S.runnerObstacles[i].name===S.runnerTarget.name;
    }
  }
  syncLegacyRunnerRuntimeRequest({
    active: S.runnerActive,
    targetName: S.runnerTarget ? S.runnerTarget.name : null,
    score: S.runnerScore,
    combo: S.runnerCombo,
    maxCombo: S.runnerMaxCombo,
    lives: S.runnerLives,
    distance: Math.floor(S.runnerDistance/100),
    obstacles: S.runnerObstacles
  });
}

function finishRunner(){
  var runnerResult={score:S.runnerScore,maxCombo:S.runnerMaxCombo,distance:Math.floor(S.runnerDistance/100)};
  completeLegacyRunnerGameRequest({
    targetName: S.runnerTarget ? S.runnerTarget.name : null,
    score: S.runnerScore,
    combo: S.runnerCombo,
    maxCombo: S.runnerMaxCombo,
    lives: S.runnerLives,
    distance: runnerResult.distance,
    obstacles: S.runnerObstacles,
    results: runnerResult
  });
  if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
    SparkProgressBridge.applyLegacyActivityRuntime({
      setFields:{runnerActive:false,runnerResults:runnerResult},
      cancelAnimationFrames:_runnerAnim?[_runnerAnim]:[]
    });
  }else{
    S.runnerActive=false;
    if(_runnerAnim)cancelAnimationFrame(_runnerAnim);
    S.runnerResults=runnerResult;
  }
  _runnerAnim=null;
  // Contract-only completion (Phase 7): the orchestrator drives the runner
  // completion sequence and owns the score→XP policy; fallbacks only cover
  // contexts without the contract stack.
  var xp=Math.round(S.runnerScore/20);
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var runnerSessionResult = SparkContracts.createSessionResult({
      mode: "runner",
      accuracy: S.runnerScore > 0 ? Math.min(1, S.runnerScore / 100) : 0,
      completed: true,
      meta: { score: S.runnerScore, results: runnerResult }
    });
    SparkProgressOrchestrator.applySessionOutcome(runnerSessionResult, { drive: true });
  }else if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
    SparkProgressBridge.applyLegacyActivityCompletion({
      xpDelta:xp>0?xp:0,
      maxFields:{runnerHighScore:S.runnerScore},
      resultFields:{runnerResults:runnerResult},
      history:xp>0?{type:"runner",detail:"Score: "+S.runnerScore,xp:xp}:null
    });
  }else{
    if(S.runnerScore>S.runnerHighScore)S.runnerHighScore=S.runnerScore;
    S.runnerResults=runnerResult;
    if(xp>0){if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:xp});else S.xp+=xp;logHistory("runner","Score: "+S.runnerScore,xp);saveState();}
  }
  snd("complete");
  render();
}

function runnerTick(){
  if(!S.runnerActive)return;
  var now=Date.now();
  var elapsed=(now-S.runnerStartTime)/1000;

  // Speed ramps from 2 to 6 over ~60s
  S.runnerSpeed=Math.min(6,2+elapsed/15);

  // Move obstacles
  for(var i=S.runnerObstacles.length-1;i>=0;i--){
    var o=S.runnerObstacles[i];
    o.x-=S.runnerSpeed;
    // Passed the hit zone without being handled
    if(o.x<20&&!o.hit){
      o.hit=true;
      if(o.isTarget){
        S.runnerLives--;S.runnerCombo=0;o.result="missed";
        snd("wrong");
        if(S.runnerLives<=0){finishRunner();return;}
      }
    }
    // Remove off-screen
    if(o.x<-100)S.runnerObstacles.splice(i,1);
  }

  // Track distance for ground animation
  S.runnerDistance+=S.runnerSpeed;

  // Spawn obstacles
  var spawnInterval=Math.max(900,1800-elapsed*12);
  if(now-S.runnerLastSpawn>spawnInterval){
    spawnRunnerObstacle();
    S.runnerLastSpawn=now;
  }

  syncLegacyRunnerRuntimeRequest({
    active: S.runnerActive,
    targetName: S.runnerTarget ? S.runnerTarget.name : null,
    score: S.runnerScore,
    combo: S.runnerCombo,
    maxCombo: S.runnerMaxCombo,
    lives: S.runnerLives,
    distance: Math.floor(S.runnerDistance/100),
    obstacles: S.runnerObstacles
  });

  render();
  _runnerAnim=requestAnimationFrame(runnerTick);
}

// ===== CHORD SHEET IMPORT PARSER =====
function parseChordSheet(text){
  if(!text||!text.trim())return {chords:[],progression:[],error:"Paste a chord sheet to parse"};
  var chordRegex=/\[([A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|6)*(?:\d*)(?:\/[A-Ga-g][#b]?)?)\]/g;
  var found=[];
  var match;
  while((match=chordRegex.exec(text))!==null){
    found.push(match[1]);
  }
  // Also try detecting inline chords (lines that are mostly chord names)
  if(found.length===0){
    var lines=text.split("\n");
    var inlineRegex=/\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|6)*(?:\d*))\b/g;
    for(var i=0;i<lines.length;i++){
      var line=lines[i].trim();
      if(!line||line.length>80)continue;
      var words=line.split(/\s+/);
      var chordWords=0;
      for(var j=0;j<words.length;j++){
        if(/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|6)*(?:\d*)$/.test(words[j]))chordWords++;
      }
      // If more than half the words look like chords, treat it as a chord line
      if(words.length>0&&chordWords/words.length>0.5){
        var m2;
        while((m2=inlineRegex.exec(line))!==null)found.push(m2[1]);
      }
    }
  }
  if(found.length===0)return {chords:[],progression:[],error:"No chords detected. Use [Am] [G] format or chord names on their own line."};
  // Map to full chord names
  var progression=[];
  var uniqueChords=[];
  for(var i=0;i<found.length;i++){
    var full=CHORD_NAME_MAP[found[i]]||found[i];
    progression.push(full);
    if(uniqueChords.indexOf(full)===-1)uniqueChords.push(full);
  }
  return {chords:uniqueChords,progression:progression,error:null};
}

// ===== STEM FILE URL LOADER =====
function _loadStemFileUrls(paths){
  if(!window.electron||!paths)return;
  var urlMap={};
  var names=Object.keys(paths);
  var loaded=0;
  for(var i=0;i<names.length;i++){
    (function(name){
      window.electron.stems.getFileUrl(paths[name]).then(function(url){
        urlMap[name]=url;
      }).catch(function(e){
        console.error("ChordSpark: stem load failed for "+name,e);
      }).then(function(){
        loaded++;
        if(loaded===names.length){
          loadStemUrls(urlMap);
          for(var j=0;j<STEM_NAMES.length;j++){
            var sn=STEM_NAMES[j];
            if(urlMap[sn])setStemMuted(sn,!S.stemToggles[sn]);
          }
          setStemVolume(S.stemVolume);
        }
      });
    })(names[i]);
  }
}

// ===== CHORD MORPH TRACKING =====
var _prevChordKey="";

// ===== CLEANUP =====
function stopAllTimers(){
  clearTimeout(T.session);clearTimeout(T.drill);clearTimeout(T.daily);clearInterval(T.fingerEx);
  // T.metro is set via setTimeout (not setInterval) — clearTimeout is the
  // matching API. clearInterval happens to work in most browsers because
  // they share an ID pool, but using the wrong API is technically incorrect.
  clearInterval(T.strum);clearInterval(T.song);clearTimeout(T.metro);clearInterval(T.prog);
  if(S.metronomeOn){stopMetronome();S.metronomeOn=false;}
  if(S.chordDetectOn)stopChordDetect();
  if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
    SparkProgressBridge.applyLegacyActivityRuntime({
      setFields:{
        rhythmActive:false,
        runnerActive:false,
        progPlaying:false,
        stemPlaying:false,
        timerActive:false,
        strumActive:false,
        songPlaying:false
      },
      cancelAnimationFrames:[_rhythmAnim,_runnerAnim]
    });
  }else{
    if(S.rhythmActive){S.rhythmActive=false;if(_rhythmAnim)cancelAnimationFrame(_rhythmAnim);}
    if(S.runnerActive){S.runnerActive=false;if(_runnerAnim)cancelAnimationFrame(_runnerAnim);}
    if(S.progPlaying){S.progPlaying=false;}
    S.timerActive=false;S.strumActive=false;S.songPlaying=false;
    S.stemPlaying=false;
  }
  _rhythmAnim=null;_runnerAnim=null;
  cleanupStems();
  if(!_performStopping&&(S.performPlaying||S.performPaused)){stopPerformance();}
  if(typeof stopSparkRhythmHighway==="function")stopSparkRhythmHighway();
}

