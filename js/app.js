// ===== TIMERS =====
function getAppStateFacade(){
  return typeof SparkState !== "undefined" ? SparkState : null;
}

function getAppStateRoot(){
  var facade=getAppStateFacade();
  if(facade&&typeof facade.getRoot==="function")return facade.getRoot();
  if(typeof globalThis!=="undefined"&&globalThis.__sparkState)return globalThis.__sparkState;
  return null;
}

function appRead(path, fallback){
  var facade=getAppStateFacade();
  if(facade&&typeof facade.read==="function")return facade.read(path, fallback);
  var root=getAppStateRoot();
  if(!root)return fallback;
  var parts=Array.isArray(path)?path:[path],cursor=root;
  for(var i=0;i<parts.length;i++){
    if(cursor==null||!Object.prototype.hasOwnProperty.call(cursor, parts[i]))return fallback;
    cursor=cursor[parts[i]];
  }
  return cursor==null?fallback:cursor;
}

function appWrite(path, value){
  var facade=getAppStateFacade();
  if(facade&&typeof facade.write==="function")return facade.write(path, value);
  var root=getAppStateRoot();
  if(!root)return value;
  var parts=Array.isArray(path)?path:[path],cursor=root;
  for(var i=0;i<parts.length-1;i++){
    if(!cursor[parts[i]]||typeof cursor[parts[i]]!=="object")cursor[parts[i]]={};
    cursor=cursor[parts[i]];
  }
  cursor[parts[parts.length-1]]=value;
  return value;
}

function appIncrement(path, delta){
  var facade=getAppStateFacade();
  if(facade&&typeof facade.increment==="function")return facade.increment(path, delta);
  var current=appRead(path, 0);
  if(typeof current!=="number")current=0;
  if(typeof delta!=="number")delta=0;
  return appWrite(path, current+delta);
}

function normalizeActiveInstrumentId(instrumentId){
  if(!instrumentId) return instrumentId;
  var map = {
    guitar: "chordspark",
    piano: "pianospark",
    ukulele: "ukulelespark",
    bass: "bassspark",
    drums: "drumsspark"
  };
  return map[instrumentId] || instrumentId;
}

function appApplyLegacyReward(reward, fallback){
  if(window.sparkCore&&typeof window.sparkCore.applyLegacyReward==="function"){
    return window.sparkCore.applyLegacyReward(reward||{});
  }
  if(typeof fallback==="function")return fallback();
  return reward||{};
}

function appApplyLegacyActivityCompletion(update, fallback){
  if(window.sparkCore&&typeof window.sparkCore.applyLegacyActivityCompletion==="function"){
    return window.sparkCore.applyLegacyActivityCompletion(update||{});
  }
  if(typeof fallback==="function")return fallback();
  return update||{};
}

function appApplyLegacyActivityRuntime(update, fallback){
  if(window.sparkCore&&typeof window.sparkCore.applyLegacyActivityRuntime==="function"){
    return window.sparkCore.applyLegacyActivityRuntime(update||{});
  }
  if(typeof fallback==="function")return fallback();
  return update||{};
}

function tickS(){
  var timerActive=appRead("timerActive", false);
  var timer=appRead("timer", 0);
  var lastChordName=appRead("lastChordName", "");
  var currentChord=appRead("currentChord", null);
  var sessions=appRead("sessions", 0);
  if(timerActive&&timer>0){
    timer=appWrite("timer", timer-1);
    syncLegacyPracticeRuntimeRequest("tick", {
      remainingSec: timer,
      timerActive: timerActive,
      mode: lastChordName ? "chord" : "quickStart",
      chordName: currentChord ? currentChord.name : null,
      durationSec: 120
    });
    if(timer%30===0&&timer>0&&SparkPsychology.shouldReward(sessions)){snd("tick");appApplyLegacyReward({xpDelta:5,toastAmount:5},function(){appIncrement("xp",5);appWrite("xpToast",{amount:5,time:Date.now()});});saveState();}
    else if(timer%30===0&&timer>0){appApplyLegacyReward({xpDelta:5},function(){appIncrement("xp",5);});} // silent XP accrual when toast skipped
    if(timer===60)fireMicro("halfway","Halfway there!","&#128170;");
    addPracticeSecond();
    render();T.session=setTimeout(tickS,1000);
  } else if(timerActive&&timer<=0){
    appWrite("timerActive",false);clearTimeout(T.session);
    if(appRead("metronomeOn", false))stopMetronome();
    if(appRead("chordDetectOn", false))stopChordDetect();
    if(window.sparkCore && typeof window.sparkCore.completeLegacyPracticeSession === "function"){
      window.sparkCore.completeLegacyPracticeSession({
        mode: lastChordName ? "chord" : "quickStart",
        chordName: currentChord ? currentChord.name : null,
        durationSec: 120
      });
    }
    // Delegate all completion logic to SparkSession
    var outcome=SparkSession.processResults({
      type:"session",
      chordName:currentChord?currentChord.name:null,
      duration:120
    });
    // Route through contract-based progress path (Phase 3 migration)
    if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
      var sessionResult = SparkContracts.createSessionResult({
        mode: lastChordName ? "chord" : "quickStart",
        chordName: currentChord ? currentChord.name : null,
        duration: 120,
        accuracy: 0.75,
        completed: true
      });
      var progressOutcome = SparkProgressOrchestrator.applySessionOutcome(sessionResult);
      if (typeof console !== "undefined" && console.debug) {
        console.debug("[App] ProgressOutcome:", progressOutcome);
      }
    }
    appApplyLegacyReward({toastAmount:outcome.xpEarned,jackpot:outcome.jackpot},function(){appWrite("xpToast",{amount:outcome.xpEarned,time:Date.now(),jackpot:outcome.jackpot});});
    if(outcome.jackpot){snd("levelup");}else{snd("complete");}
    if(outcome.leveledUp)snd("levelup");
    trigC();appWrite("screen",SCR.COMPLETE);render();
  }
}

function tickD(){
  var screen=appRead("screen", null);
  var drillTimer=appRead("drillTimer", 0);
  var drillChords=appRead("drillChords", []);
  var sessions=appRead("sessions", 0);
  if(screen===SCR.DRILL&&drillTimer>0){
    drillTimer=appWrite("drillTimer", drillTimer-1);
    syncLegacyPracticeRuntimeRequest("tick", {
      remainingSec: drillTimer,
      timerActive: true,
      mode: "drill",
      chordNames: drillChords.map(function(c){ return c.name; }),
      durationSec: 60
    });
    if(drillTimer%30===0&&drillTimer>0&&SparkPsychology.shouldReward(sessions)){snd("tick");appApplyLegacyReward({xpDelta:5,toastAmount:5},function(){appIncrement("xp",5);appWrite("xpToast",{amount:5,time:Date.now()});});saveState();}
    else if(drillTimer%30===0&&drillTimer>0){appApplyLegacyReward({xpDelta:5},function(){appIncrement("xp",5);});}
    addPracticeSecond();
    if(!updateDrillTimerUI())render(); // partial update if elements exist
    T.drill=setTimeout(tickD,1000);
  } else if(screen===SCR.DRILL&&drillTimer<=0){
    clearTimeout(T.drill);snd("complete");
    var detail=drillChords.map(function(c){return c.name;}).join(" / ");
    if(window.sparkCore && typeof window.sparkCore.completeLegacyPracticeDrill === "function"){
      window.sparkCore.completeLegacyPracticeDrill({
        durationSec: 60,
        chordNames: drillChords.map(function(c){return c.name;})
      });
    }
    appApplyLegacyActivityCompletion({
      xpDelta:20,
      toastAmount:20,
      incrementFields:{drillCount:1},
      history:{type:"drill",detail:detail,xp:20},
      emit:{type:"practice_session_completed",payload:{ appId: "chordspark", type: "drill", xp: 20, detail: detail }},
      checkBadges:true
    },function(){
      appIncrement("drillCount",1);appApplyLegacyReward({xpDelta:20,toastAmount:20},function(){appIncrement("xp",20);appWrite("xpToast",{amount:20,time:Date.now()});});
      logHistory("drill",detail,20);
      _sparkEmit("practice_session_completed", { appId: "chordspark", type: "drill", xp: 20, detail: detail });
      checkBadges();saveState();
    });
    // Route through contract-based progress path (Phase 6 migration)
    if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
      var drillSessionResult = SparkContracts.createSessionResult({
        mode: "drill",
        chordName: drillChords && drillChords[0] ? drillChords[0].name : null,
        duration: 60,
        accuracy: 0.75,
        completed: true
      });
      var drillProgressOutcome = SparkProgressOrchestrator.applySessionOutcome(drillSessionResult);
      if (typeof console !== "undefined" && console.debug) {
        console.debug("[App] Drill ProgressOutcome:", drillProgressOutcome);
      }
    }
    trigC();appWrite("screen",SCR.DRILL_DONE);render();
  }
}

function tickDy(){
  var screen=appRead("screen", null);
  var dailyTimer=appRead("dailyTimer", 0);
  var dailyComplete=appRead("dailyComplete", false);
  var dailyChallenge=appRead("dailyChallenge", null);
  if(screen===SCR.DAILY&&dailyTimer>0&&!dailyComplete){
    dailyTimer=appWrite("dailyTimer", dailyTimer-1);addPracticeSecond();
    syncLegacyDailyRuntimeRequest("tick", {
      challengeId: dailyChallenge ? dailyChallenge.id : null,
      remainingSec: dailyTimer,
      timerActive: true,
      durationSec: dailyChallenge && dailyChallenge.id === "hold" ? 30 : dailyChallenge && dailyChallenge.id === "marathon" ? 180 : 60
    });
    if(!updateDailyTimerUI())render(); // partial update if elements exist
    T.daily=setTimeout(tickDy,1000);
  } else if(screen===SCR.DAILY&&dailyTimer<=0&&!dailyComplete){
    clearTimeout(T.daily);snd("complete");
    var xp=(dailyChallenge&&dailyChallenge.xp)||40;
    completeLegacyDailyChallengeRequest({
      challengeId: dailyChallenge ? dailyChallenge.id : null,
      durationSec: dailyChallenge && dailyChallenge.id === "hold" ? 30 : dailyChallenge && dailyChallenge.id === "marathon" ? 180 : 60
    });
    appApplyLegacyActivityCompletion({
      xpDelta:xp,
      toastAmount:xp,
      setFlags:{dailyComplete:true},
      incrementFields:{dailyDone:1},
      history:{type:"daily",detail:dailyChallenge?dailyChallenge.title:"Challenge",xp:xp},
      checkBadges:true
    },function(){
      appWrite("dailyComplete",true);appIncrement("dailyDone",1);
      appApplyLegacyReward({xpDelta:xp,toastAmount:xp},function(){appIncrement("xp",xp);appWrite("xpToast",{amount:xp,time:Date.now()});});
      logHistory("daily",dailyChallenge?dailyChallenge.title:"Challenge",xp);
      checkBadges();saveState();
    });
    // Route through contract-based progress path
    if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
      var dailyResult = SparkContracts.createSessionResult({
        mode: "daily",
        duration: dailyChallenge && dailyChallenge.id === "hold" ? 30 : dailyChallenge && dailyChallenge.id === "marathon" ? 180 : 60,
        accuracy: 1.0,
        completed: true
      });
      SparkProgressOrchestrator.applySessionOutcome(dailyResult);
    }
    trigC();render();
  }
}

function genQ(){
  var level=appRead("level", 1);
  var av=[];for(var _l=1;_l<=level;_l++)av=av.concat(CHORDS[_l]||[]);
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
  appWrite("quizQ",q);appWrite("quizOpts",opts);appWrite("quizAns",null);
  if(window.sparkCore && typeof window.sparkCore.syncLegacyQuizRuntimeState === "function"){
    window.sparkCore.syncLegacyQuizRuntimeState({
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
  var rhythmActive=appRead("rhythmActive", false);
  var rhythmStartTime=appRead("rhythmStartTime", 0);
  var rhythmBeats=appRead("rhythmBeats", []);
  if(!rhythmActive)return;
  var elapsed=performance.now()-rhythmStartTime;
  var lastBeatTime=rhythmBeats[rhythmBeats.length-1].time;
  if(elapsed>lastBeatTime+2000){
    finishRhythm();
    return;
  }
  for(var i=0;i<rhythmBeats.length;i++){
    var b=rhythmBeats[i];
    if(!b.hit&&elapsed-b.time>200){
      b.hit=true;b.result="miss";
      appWrite("rhythmCombo",0);
    }
  }
  syncLegacyRhythmRuntimeRequest({
    active: rhythmActive,
    beats: rhythmBeats,
    score: appRead("rhythmScore", 0),
    combo: appRead("rhythmCombo", 0),
    maxCombo: appRead("rhythmMaxCombo", 0),
    startTimeMs: rhythmStartTime
  });
  render();
  _rhythmAnim=requestAnimationFrame(rhythmTick);
}

function finishRhythm(){
  var rhythmBeats=appRead("rhythmBeats", []);
  var rhythmScore=appRead("rhythmScore", 0);
  var rhythmCombo=appRead("rhythmCombo", 0);
  var rhythmMaxCombo=appRead("rhythmMaxCombo", 0);
  var rhythmStartTime=appRead("rhythmStartTime", 0);
  var total=rhythmBeats.length,hits=0;
  for(var i=0;i<total;i++)if(rhythmBeats[i].result==="perfect"||rhythmBeats[i].result==="good")hits++;
  var acc=total>0?Math.round((hits/total)*100):0;
  var rhythmResult={score:rhythmScore,accuracy:acc,maxCombo:rhythmMaxCombo,total:total,hits:hits};
  completeLegacyRhythmGameRequest({
    beats: rhythmBeats,
    score: rhythmScore,
    combo: rhythmCombo,
    maxCombo: rhythmMaxCombo,
    startTimeMs: rhythmStartTime,
    results: rhythmResult
  });
  appApplyLegacyActivityRuntime({
    setFields:{rhythmActive:false,rhythmResults:rhythmResult},
    cancelAnimationFrames:_rhythmAnim?[_rhythmAnim]:[]
  },function(){
    appWrite("rhythmActive",false);
    if(_rhythmAnim)cancelAnimationFrame(_rhythmAnim);
    appWrite("rhythmResults",rhythmResult);
  });
  _rhythmAnim=null;
  var xp=Math.round(rhythmScore/10);
  if(xp>0){
    appApplyLegacyActivityCompletion({
      xpDelta:xp,
      history:{type:"rhythm",detail:"Score: "+rhythmScore,xp:xp}
    },function(){
      appApplyLegacyReward({xpDelta:xp},function(){appIncrement("xp",xp);});logHistory("rhythm","Score: "+rhythmScore,xp);saveState();
    });
  }
  // Route through contract-based progress path
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var rhythmResult = SparkContracts.createSessionResult({
      mode: "rhythm",
      accuracy: total > 0 ? hits / total : 0,
      completed: true
    });
    SparkProgressOrchestrator.applySessionOutcome(rhythmResult);
  }
  render();
}

// ===== CHORD RUNNER =====
var _runnerAnim=null;
var _runnerObstId=0;

function spawnRunnerObstacle(){
  var level=appRead("level", 1);
  var runnerTarget=appRead("runnerTarget", null);
  var runnerObstacles=appRead("runnerObstacles", []);
  var av=CHORDS[level]||CHORDS[1];
  var isTarget=Math.random()<0.35;
  var chord;
  if(isTarget){
    chord=runnerTarget;
  }else{
    chord=av[Math.floor(Math.random()*av.length)];
    var tries=0;
    while(runnerTarget&&chord.name===runnerTarget.name&&av.length>1&&tries<15){
      chord=av[Math.floor(Math.random()*av.length)];tries++;
    }
  }
  runnerObstacles.push({
    id:++_runnerObstId,name:chord.name,short:chord.short,
    x:460,isTarget:runnerTarget?chord.name===runnerTarget.name:false,
    hit:false,result:null
  });
}

function changeRunnerTarget(){
  var level=appRead("level", 1);
  var runnerObstacles=appRead("runnerObstacles", []);
  var av=CHORDS[level]||CHORDS[1];
  var prev=appRead("runnerTarget", null);var tries=0;
  var nextTarget=av[Math.floor(Math.random()*av.length)];
  while(prev&&nextTarget.name===prev.name&&av.length>1&&tries<15){
    nextTarget=av[Math.floor(Math.random()*av.length)];tries++;
  }
  appWrite("runnerTarget", nextTarget);
  // Mark existing unmatched obstacles as non-target (new target now)
  for(var i=0;i<runnerObstacles.length;i++){
    if(!runnerObstacles[i].hit){
      runnerObstacles[i].isTarget=runnerObstacles[i].name===nextTarget.name;
    }
  }
  syncLegacyRunnerRuntimeRequest({
    active: appRead("runnerActive", false),
    targetName: nextTarget ? nextTarget.name : null,
    score: appRead("runnerScore", 0),
    combo: appRead("runnerCombo", 0),
    maxCombo: appRead("runnerMaxCombo", 0),
    lives: appRead("runnerLives", 0),
    distance: Math.floor(appRead("runnerDistance", 0)/100),
    obstacles: runnerObstacles
  });
}

function finishRunner(){
  var runnerTarget=appRead("runnerTarget", null);
  var runnerScore=appRead("runnerScore", 0);
  var runnerCombo=appRead("runnerCombo", 0);
  var runnerMaxCombo=appRead("runnerMaxCombo", 0);
  var runnerLives=appRead("runnerLives", 0);
  var runnerDistance=appRead("runnerDistance", 0);
  var runnerObstacles=appRead("runnerObstacles", []);
  var runnerHighScore=appRead("runnerHighScore", 0);
  var runnerResult={score:runnerScore,maxCombo:runnerMaxCombo,distance:Math.floor(runnerDistance/100)};
  completeLegacyRunnerGameRequest({
    targetName: runnerTarget ? runnerTarget.name : null,
    score: runnerScore,
    combo: runnerCombo,
    maxCombo: runnerMaxCombo,
    lives: runnerLives,
    distance: runnerResult.distance,
    obstacles: runnerObstacles,
    results: runnerResult
  });
  appApplyLegacyActivityRuntime({
    setFields:{runnerActive:false,runnerResults:runnerResult},
    cancelAnimationFrames:_runnerAnim?[_runnerAnim]:[]
  },function(){
    appWrite("runnerActive",false);
    if(_runnerAnim)cancelAnimationFrame(_runnerAnim);
    appWrite("runnerResults",runnerResult);
  });
  _runnerAnim=null;
  var xp=Math.round(runnerScore/20);
  appApplyLegacyActivityCompletion({
    xpDelta:xp>0?xp:0,
    maxFields:{runnerHighScore:runnerScore},
    resultFields:{runnerResults:runnerResult},
    history:xp>0?{type:"runner",detail:"Score: "+runnerScore,xp:xp}:null
  },function(){
    if(runnerScore>runnerHighScore)appWrite("runnerHighScore",runnerScore);
    appWrite("runnerResults",runnerResult);
    if(xp>0){appApplyLegacyReward({xpDelta:xp},function(){appIncrement("xp",xp);});logHistory("runner","Score: "+runnerScore,xp);saveState();}
  });
  // Route through contract-based progress path
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var runnerSessionResult = SparkContracts.createSessionResult({
      mode: "runner",
      accuracy: runnerScore > 0 ? Math.min(1, runnerScore / 100) : 0,
      completed: true
    });
    SparkProgressOrchestrator.applySessionOutcome(runnerSessionResult);
  }
  snd("complete");
  render();
}

function runnerTick(){
  var runnerActive=appRead("runnerActive", false);
  var runnerStartTime=appRead("runnerStartTime", 0);
  var runnerObstacles=appRead("runnerObstacles", []);
  var runnerLives=appRead("runnerLives", 0);
  var runnerDistance=appRead("runnerDistance", 0);
  var runnerLastSpawn=appRead("runnerLastSpawn", 0);
  if(!runnerActive)return;
  var now=Date.now();
  var elapsed=(now-runnerStartTime)/1000;

  // Speed ramps from 2 to 6 over ~60s
  var runnerSpeed=appWrite("runnerSpeed",Math.min(6,2+elapsed/15));

  // Move obstacles
  for(var i=runnerObstacles.length-1;i>=0;i--){
    var o=runnerObstacles[i];
    o.x-=runnerSpeed;
    // Passed the hit zone without being handled
    if(o.x<20&&!o.hit){
      o.hit=true;
      if(o.isTarget){
        runnerLives=appIncrement("runnerLives",-1);appWrite("runnerCombo",0);o.result="missed";
        snd("wrong");
        if(runnerLives<=0){finishRunner();return;}
      }
    }
    // Remove off-screen
    if(o.x<-100)runnerObstacles.splice(i,1);
  }

  // Track distance for ground animation
  runnerDistance=appIncrement("runnerDistance",runnerSpeed);

  // Spawn obstacles
  var spawnInterval=Math.max(900,1800-elapsed*12);
  if(now-runnerLastSpawn>spawnInterval){
    spawnRunnerObstacle();
    appWrite("runnerLastSpawn",now);
  }

  syncLegacyRunnerRuntimeRequest({
    active: runnerActive,
    targetName: appRead(["runnerTarget","name"], null),
    score: appRead("runnerScore", 0),
    combo: appRead("runnerCombo", 0),
    maxCombo: appRead("runnerMaxCombo", 0),
    lives: runnerLives,
    distance: Math.floor(runnerDistance/100),
    obstacles: runnerObstacles
  });

  render();
  _runnerAnim=requestAnimationFrame(runnerTick);
}

// ===== COMMUNITY API =====
var COMMUNITY_URL="https://localhost:3456";
if(!COMMUNITY_URL.startsWith("https")&&COMMUNITY_URL.indexOf("localhost")===-1&&COMMUNITY_URL.indexOf("127.0.0.1")===-1)
  console.warn("ChordSpark: Community URL should use HTTPS for non-local servers");

function fetchCommunity(){
  appWrite("communityLoading",true);appWrite("communityError",null);render();
  var url=COMMUNITY_URL+"/api/songs";
  if(appRead("communitySearch",""))url+="?q="+encodeURIComponent(appRead("communitySearch",""))+"&sort="+appRead("communitySort","recent");
  else url+="?sort="+appRead("communitySort","recent");
  fetch(url).then(function(r){return r.json();}).then(function(data){
    appWrite("communitySongs",data);appWrite("communityLoading",false);render();
  }).catch(function(){
    appWrite("communityError","Could not connect to community server");appWrite("communityLoading",false);render();
  });
}

function createEmptyCommunitySubmission(){
  return {title:"",artist:"",chords:[],progression:[],bpm:120,pattern:[],submittedBy:""};
}

function ensureCommunitySubmitSong(){
  var submitSong = appRead("submitSong", null);
  if(!submitSong || typeof submitSong !== "object" || Array.isArray(submitSong)){
    submitSong = createEmptyCommunitySubmission();
    appWrite("submitSong", submitSong);
  }
  if(!Array.isArray(submitSong.chords)) submitSong.chords = [];
  if(!Array.isArray(submitSong.progression)) submitSong.progression = [];
  if(typeof submitSong.title !== "string") submitSong.title = "";
  if(typeof submitSong.artist !== "string") submitSong.artist = "";
  if(typeof submitSong.submittedBy !== "string") submitSong.submittedBy = "";
  if(typeof submitSong.bpm !== "number") submitSong.bpm = parseInt(submitSong.bpm, 10) || 120;
  return submitSong;
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
            if(urlMap[sn])setStemMuted(sn,!appRead(["stemToggles", sn], true));
          }
          setStemVolume(appRead("stemVolume", 1));
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
  clearInterval(T.strum);clearInterval(T.song);clearInterval(T.metro);clearInterval(T.prog);
  if(appRead("metronomeOn", false)){stopMetronome();appWrite("metronomeOn",false);}
  if(appRead("chordDetectOn", false))stopChordDetect();
  appApplyLegacyActivityRuntime({
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
  },function(){
    if(appRead("rhythmActive", false)){appWrite("rhythmActive",false);if(_rhythmAnim)cancelAnimationFrame(_rhythmAnim);}
    if(appRead("runnerActive", false)){appWrite("runnerActive",false);if(_runnerAnim)cancelAnimationFrame(_runnerAnim);}
    if(appRead("progPlaying", false)){appWrite("progPlaying",false);}
    appWrite("timerActive",false);appWrite("strumActive",false);appWrite("songPlaying",false);
    appWrite("stemPlaying",false);
  });
  _rhythmAnim=null;_runnerAnim=null;
  cleanupStems();
  if(!_performStopping&&(appRead("performPlaying", false)||appRead("performPaused", false))){stopPerformance();}
  if(typeof stopSparkRhythmHighway==="function")stopSparkRhythmHighway();
}

// Helper to emit suite events safely
function _sparkEmit(type, payload) {
  if (typeof SparkEvents !== "undefined") SparkEvents.emit(type, payload);
}

function syncPerformanceEditorDocumentState(chart, options) {
  if (!window.sparkCore) return;
  if (typeof window.sparkCore.syncPerformanceEditorDocument === "function") {
    window.sparkCore.syncPerformanceEditorDocument(chart, options || {});
    return;
  }
  if (typeof window.sparkCore.syncPerformanceRuntimeState !== "function") return;

  options = options || {};
  var events = chart && Array.isArray(chart.events) ? chart.events : [];
  var phrases = chart && Array.isArray(chart.phrases) ? chart.phrases : [];
  var selectedEvent = options.selectedEvent || null;
  var selectedPhrase = options.selectedPhrase || null;
  var selectedEventId = Object.prototype.hasOwnProperty.call(options, "selectedEventId")
    ? options.selectedEventId
    : (selectedEvent ? selectedEvent.id : (appRead("performEditorSelectedEventId", null) != null ? appRead("performEditorSelectedEventId", null) : null));
  var selectedPhraseId = Object.prototype.hasOwnProperty.call(options, "selectedPhraseId")
    ? options.selectedPhraseId
    : (selectedPhrase ? selectedPhrase.id : null);

  window.sparkCore.syncPerformanceRuntimeState(options.action || "configure_editor", {
    mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : appRead("performEditorMode", null),
    snap: Object.prototype.hasOwnProperty.call(options, "snap") ? options.snap : appRead("performEditorSnap", null),
    chartId: chart && chart.id ? chart.id : null,
    chartTitle: chart && chart.title ? chart.title : null,
    source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : (chart ? "existing" : "blank"),
    dirty: Object.prototype.hasOwnProperty.call(options, "dirty") ? !!options.dirty : !!appRead("performEditorDirty", false),
    selectedEventId: selectedEventId,
    selectedEventLabel: Object.prototype.hasOwnProperty.call(options, "selectedEventLabel")
      ? options.selectedEventLabel
      : (selectedEvent ? (selectedEvent.laneLabel || selectedEvent.chord || selectedEvent.note || "?") : null),
    selectedEventTime: Object.prototype.hasOwnProperty.call(options, "selectedEventTime")
      ? options.selectedEventTime
      : (selectedEvent ? (selectedEvent.t || 0) : null),
    selectedEventDuration: Object.prototype.hasOwnProperty.call(options, "selectedEventDuration")
      ? options.selectedEventDuration
      : (selectedEvent ? (selectedEvent.dur || 0) : null),
    selectedPhraseId: selectedPhraseId,
    selectedPhraseName: Object.prototype.hasOwnProperty.call(options, "selectedPhraseName")
      ? options.selectedPhraseName
      : (selectedPhrase ? selectedPhrase.name : null),
    selectedPhraseStart: Object.prototype.hasOwnProperty.call(options, "selectedPhraseStart")
      ? options.selectedPhraseStart
      : (selectedPhrase ? selectedPhrase.startSec : null),
    selectedPhraseEnd: Object.prototype.hasOwnProperty.call(options, "selectedPhraseEnd")
      ? options.selectedPhraseEnd
      : (selectedPhrase ? selectedPhrase.endSec : null),
    bpm: Object.prototype.hasOwnProperty.call(options, "bpm")
      ? options.bpm
      : (chart && chart.bpm ? chart.bpm : null),
    eventCount: Object.prototype.hasOwnProperty.call(options, "eventCount")
      ? options.eventCount
      : events.length,
    phraseCount: Object.prototype.hasOwnProperty.call(options, "phraseCount")
      ? options.phraseCount
      : phrases.length
  });
}

function applyPerformanceEditorCoreMutation(action, payload) {
  if (!window.sparkCore || typeof window.sparkCore.applyPerformanceEditorMutation !== "function") return null;
  return window.sparkCore.applyPerformanceEditorMutation(action, payload || {});
}

function syncPerformanceEditorLibraryState(library) {
  var nextLibrary = Array.isArray(library) ? library : [];
  appWrite("performEditorLibrary", nextLibrary);
  return nextLibrary;
}

function getPerformanceEditorExportData() {
  if (window.sparkCore && typeof window.sparkCore.getPerformanceEditorExportData === "function") {
    return window.sparkCore.getPerformanceEditorExportData();
  }
  var chart = appRead("performEditorChart", null);
  if (!chart) return { chart: null, json: "", fileName: "chart.json" };
  return {
    chart: chart,
    json: JSON.stringify(chart, null, 2),
    fileName: (chart.title || "chart").replace(/\s+/g, "_") + ".json"
  };
}

function getPerformanceEditorPreviewChart() {
  if (window.sparkCore && typeof window.sparkCore.getPerformanceEditorPreviewChart === "function") {
    return window.sparkCore.getPerformanceEditorPreviewChart();
  }
  return appRead("performEditorChart", null) || null;
}

function getPerformanceEditorPreviewRequest() {
  if (window.sparkCore && typeof window.sparkCore.startPerformanceEditorPreview === "function") {
    return window.sparkCore.startPerformanceEditorPreview();
  }
  var chart = getPerformanceEditorPreviewChart();
  if (!chart) return null;
  return {
    chart: chart,
    chartId: chart.id || "generated",
    arrangementType: chart.arrangementType || appRead("performArrangementType", "chords") || "chords",
    difficulty: appRead("performDifficulty", "normal") || "normal",
    speed: appRead("performSpeed", 1) || 1,
    mode: appRead("performMode", "midi") || "midi",
    preset: appRead("performPracticePreset", null)
  };
}

function getPerformanceRetryRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.startPerformanceRetrySession === "function") {
    return window.sparkCore.startPerformanceRetrySession(options || {});
  }
  options = options || {};
  return {
    chart: Object.prototype.hasOwnProperty.call(options, "chart") ? options.chart : null,
    chartId: Object.prototype.hasOwnProperty.call(options, "chartId") ? options.chartId : (appRead("performChartId", "generated") || "generated"),
    arrangementType: Object.prototype.hasOwnProperty.call(options, "arrangementType") ? options.arrangementType : appRead("performArrangementType", null),
    difficulty: Object.prototype.hasOwnProperty.call(options, "difficulty") ? options.difficulty : appRead("performDifficulty", "normal"),
    speed: Object.prototype.hasOwnProperty.call(options, "speed") ? options.speed : appRead("performSpeed", 1),
    mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : appRead("performMode", "midi"),
    preset: Object.prototype.hasOwnProperty.call(options, "preset") ? options.preset : appRead("performPracticePreset", null),
    countIn: Object.prototype.hasOwnProperty.call(options, "countIn") ? !!options.countIn : !!appRead("performCountIn", false),
    targetPhraseIndex: Object.prototype.hasOwnProperty.call(options, "targetPhraseIndex") ? options.targetPhraseIndex : null
  };
}

function applyPerformanceCalibrationRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.applyPerformanceCalibrationRequest === "function") {
    return window.sparkCore.applyPerformanceCalibrationRequest(action, options || {});
  }
  options = options || {};
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState(action, {
      source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : (appRead("performCalibrationSource","midi") || "midi"),
      appliedOffsetMs: Object.prototype.hasOwnProperty.call(options, "appliedOffsetMs") ? options.appliedOffsetMs : null,
      globalOffsetMs: Object.prototype.hasOwnProperty.call(options, "globalOffsetMs") ? options.globalOffsetMs : (appRead("performTimingOffsetMs",0) || 0),
      midiOffsetMs: Object.prototype.hasOwnProperty.call(options, "midiOffsetMs") ? options.midiOffsetMs : (appRead("performMidiOffsetMs",0) || 0),
      micOffsetMs: Object.prototype.hasOwnProperty.call(options, "micOffsetMs") ? options.micOffsetMs : (appRead("performMicOffsetMs",0) || 0)
    });
  }
  return options;
}

function applyPerformanceNavigationRequest(target, options) {
  if (window.sparkCore && typeof window.sparkCore.applyPerformanceNavigationRequest === "function") {
    return window.sparkCore.applyPerformanceNavigationRequest(target, options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] applyPerformanceNavigationRequest");
  return null;
}

function openPerformanceStatsRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceStats === "function") {
    return window.sparkCore.openPerformanceStats(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openPerformanceStatsRequest");
  return null;
}

function openPerformanceEditorRequest(chart, options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceEditor === "function") {
    return window.sparkCore.openPerformanceEditor(chart || null, options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openPerformanceEditorRequest");
  return null;
}

function openPerformanceCalibrationRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceCalibration === "function") {
    return window.sparkCore.openPerformanceCalibration(options || {});
  }
  return applyPerformanceCalibrationRequest("open_calibration", options || {});
}

function openPerformanceSongSelectionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceSongSelection === "function") {
    return window.sparkCore.openPerformanceSongSelection(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openPerformanceSongSelectionRequest");
  return null;
}

function startSelectedPerformanceSongRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.startSelectedPerformanceSong === "function") {
    return window.sparkCore.startSelectedPerformanceSong(options || {});
  }
  return getPerformanceRetryRequest(options || {});
}

function openDailyPracticePlanRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openDailyPracticePlan === "function") {
    return window.sparkCore.openDailyPracticePlan(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
    return window.sparkCore.startSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      forceRebuild: !!(options && options.forceRebuild)
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openDailyPracticePlanRequest");
  return null;
}

function openDashboardPracticePlanRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openDashboardPracticePlan === "function") {
    return window.sparkCore.openDashboardPracticePlan(options || {});
  }
  return openDailyPracticePlanRequest(options || {});
}

function openPracticePlanScreenRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPracticePlanScreen === "function") {
    return window.sparkCore.openPracticePlanScreen(options || {});
  }
  return openDashboardPracticePlanRequest(options || {});
}

function resolveModuleExerciseLaunchOptions(rawValue) {
  if (!rawValue) return null;
  if (typeof rawValue === "object") return rawValue;
  try {
    return JSON.parse(String(rawValue));
  } catch (err) {
    if (typeof console !== "undefined") console.warn("[No Handler] openPracticePlanScreenRequest");
    return null;
  }
}

function getInstrumentModuleForLaunch(instrumentId) {
  if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive) {
    var active = SparkInstruments.getActive();
    if (active && (!instrumentId || active.instrument === instrumentId || active.id === instrumentId)) return active;
  }
  var map = {
    bass: window.SparkBassModule,
    ukulele: window.SparkUkuleleModule,
    guitar: window.SparkGuitarModule,
    piano: window.SparkPianoModule
  };
  return instrumentId ? (map[instrumentId] || null) : null;
}

function buildModuleExerciseRhythmPayload(options) {
  options = options || {};
  var module = getInstrumentModuleForLaunch(options.instrument);
  if (!module || typeof module.getRhythmAdapter !== "function") return null;
  var rhythmAdapter = module.getRhythmAdapter();
  if (!rhythmAdapter || typeof rhythmAdapter.createPayload !== "function") return null;
  return rhythmAdapter.createPayload({
    segment: {
      id: options.exerciseId || options.lessonId || "module_rhythm_exercise",
      type: SparkSessionSegmentTypes ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : "rhythm_highway",
      meta: {
        skill: options.exerciseFocus || options.skill || null
      }
    },
    curriculum: {
      nextLessonId: options.lessonId || null
    },
    instrumentContext: {
      instrumentType: options.instrument || null
    }
  });
}

function openLegacyPracticeSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyPracticeSession === "function") {
    return window.sparkCore.openLegacyPracticeSession(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openLegacyPracticeSessionRequest");
  return null;
}

function openLegacyPracticeDrillRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyPracticeDrill === "function") {
    return window.sparkCore.openLegacyPracticeDrill(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openLegacyPracticeDrillRequest");
  return null;
}

function syncLegacyPracticeRuntimeRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyPracticeRuntimeState === "function") {
    return window.sparkCore.syncLegacyPracticeRuntimeState(action, options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncLegacyPracticeRuntimeRequest");
  return null;
}

function repeatLegacyPracticeSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.repeatLegacyPracticeSession === "function") {
    return window.sparkCore.repeatLegacyPracticeSession(options || {});
  }
  return openLegacyPracticeSessionRequest(options || {});
}

function repeatLegacyPracticeDrillRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.repeatLegacyPracticeDrill === "function") {
    return window.sparkCore.repeatLegacyPracticeDrill(options || {});
  }
  return openLegacyPracticeDrillRequest(options || {});
}

function openLegacyDailyChallengeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyDailyChallenge === "function") {
    return window.sparkCore.openLegacyDailyChallenge(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openLegacyDailyChallengeRequest");
  return null;
}

function syncLegacyDailyRuntimeRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyDailyRuntimeState === "function") {
    return window.sparkCore.syncLegacyDailyRuntimeState(action, options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncLegacyDailyRuntimeRequest");
  return null;
}

function completeLegacyDailyChallengeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeLegacyDailyChallenge === "function") {
    return window.sparkCore.completeLegacyDailyChallenge(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] completeLegacyDailyChallengeRequest");
  return null;
}

function openLegacyRunnerGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyRunnerGame === "function") {
    return window.sparkCore.openLegacyRunnerGame(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openLegacyRunnerGameRequest");
  return null;
}

function syncLegacyRunnerRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyRunnerRuntimeState === "function") {
    return window.sparkCore.syncLegacyRunnerRuntimeState(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncLegacyRunnerRuntimeRequest");
  return null;
}

function completeLegacyRunnerGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeLegacyRunnerGame === "function") {
    return window.sparkCore.completeLegacyRunnerGame(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] completeLegacyRunnerGameRequest");
  return null;
}

function syncTunerRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncTunerRuntimeState === "function") {
    return window.sparkCore.syncTunerRuntimeState(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncTunerRuntimeRequest");
  return null;
}

function syncAudioInputRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncAudioInputRuntimeState === "function") {
    return window.sparkCore.syncAudioInputRuntimeState(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncAudioInputRuntimeRequest");
  return null;
}

function syncMetronomeRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncMetronomeRuntimeState === "function") {
    return window.sparkCore.syncMetronomeRuntimeState(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncMetronomeRuntimeRequest");
  return null;
}

function openLegacyRhythmGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyRhythmGame === "function") {
    return window.sparkCore.openLegacyRhythmGame(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openLegacyRhythmGameRequest");
  return null;
}

function syncLegacyRhythmRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyRhythmRuntimeState === "function") {
    return window.sparkCore.syncLegacyRhythmRuntimeState(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncLegacyRhythmRuntimeRequest");
  return null;
}

function completeLegacyRhythmGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeLegacyRhythmGame === "function") {
    return window.sparkCore.completeLegacyRhythmGame(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] completeLegacyRhythmGameRequest");
  return null;
}

function returnFromLegacyDailyChallengeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.returnFromLegacyDailyChallenge === "function") {
    return window.sparkCore.returnFromLegacyDailyChallenge(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "home",
      activeTab: options && options.activeTab ? options.activeTab : "daily",
      legacyDailyTimerActive: false,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] returnFromLegacyDailyChallengeRequest");
  return null;
}

function completeDailyPracticePlanRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeDailyPracticePlan === "function") {
    return window.sparkCore.completeDailyPracticePlan(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
    return window.sparkCore.completeSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      markPlanComplete: true,
      itemId: options && Object.prototype.hasOwnProperty.call(options, "itemId") ? options.itemId : undefined
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] completeDailyPracticePlanRequest");
  return null;
}

function openGuidedSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openGuidedSession === "function") {
    return window.sparkCore.openGuidedSession(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
    return window.sparkCore.startSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      sessionNum: options && Object.prototype.hasOwnProperty.call(options, "sessionNum") ? options.sessionNum : undefined
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openGuidedSessionRequest");
  return null;
}

function openSongSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openSongSession === "function") {
    return window.sparkCore.openSongSession(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: options.targetScreen || "song",
      activeTab: "songs",
      songSessionData: options.songData || null,
      songSessionSource: options.source || "builtin",
      songPlaying: !!options.songPlaying,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat") ? options.songBeat : 0,
      transport: { status: options.songPlaying ? "running" : "ready", positionMs: 0 }
    });
  }
  console.warn("[No Handler] openSongSessionRequest");
  return null;
}

function openCareerSongSelectionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openCareerSongSelection === "function") {
    return window.sparkCore.openCareerSongSelection(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.openPerformanceSongSelection === "function") {
    return window.sparkCore.openPerformanceSongSelection(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openCareerSongSelectionRequest");
  return null;
}

function openPerformanceDailyChallengeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceDailyChallenge === "function") {
    return window.sparkCore.openPerformanceDailyChallenge(options || {});
  }
  return openPerformanceSongSelectionRequest(options || {});
}

function syncSongRuntimeRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncSongRuntimeState === "function") {
    return window.sparkCore.syncSongRuntimeState(action, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: options.targetScreen || (action === "complete" ? "song_done" : "song"),
      activeTab: "songs",
      songSessionData: Object.prototype.hasOwnProperty.call(options, "songData") ? options.songData : window.sparkCore.getRuntimeState().songSessionData,
      songSessionSource: options.source || window.sparkCore.getRuntimeState().songSessionSource || "builtin",
      songPlaying: action === "play" ? true : !!options.songPlaying,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat") ? options.songBeat : 0,
      transport: {
        status: action === "complete" ? "completed" : (action === "play" ? "running" : "ready"),
        positionMs: 0
      }
    });
  }
  console.warn("[No Handler] syncSongRuntimeRequest");
  return null;
}

function applySongNavigationRequest(target, options) {
  if (window.sparkCore && typeof window.sparkCore.applySongNavigationRequest === "function") {
    return window.sparkCore.applySongNavigationRequest(target, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: target === "song_done" ? "song_done" : (target === "song_detail" ? "song" : "home"),
      activeTab: "songs",
      songPlaying: false,
      transport: { status: target === "song_done" ? "completed" : "idle", positionMs: 0 }
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] applySongNavigationRequest");
  return null;
}

function applySongBrowserRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.applySongBrowserRequest === "function") {
    return window.sparkCore.applySongBrowserRequest(action, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      activeTab: "songs",
      songsSubTab: Object.prototype.hasOwnProperty.call(options, "songsSubTab") ? options.songsSubTab : appRead("songsSubTab", null),
      songFilter: Object.prototype.hasOwnProperty.call(options, "songFilter") ? options.songFilter : appRead("songFilter", null),
      songSort: Object.prototype.hasOwnProperty.call(options, "songSort") ? options.songSort : appRead("songSort", null),
      songSortAsc: Object.prototype.hasOwnProperty.call(options, "songSortAsc") ? !!options.songSortAsc : !!appRead("songSortAsc", false),
      communityTab: Object.prototype.hasOwnProperty.call(options, "communityTab") ? options.communityTab : appRead("communityTab", null),
      communitySearch: Object.prototype.hasOwnProperty.call(options, "communitySearch") ? options.communitySearch : appRead("communitySearch", ""),
      communitySort: Object.prototype.hasOwnProperty.call(options, "communitySort") ? options.communitySort : appRead("communitySort", "")
    });
  }
  console.warn("[No Handler] applySongBrowserRequest");
  return null;
}

function applyDashboardRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardRequest === "function") {
    return window.sparkCore.applyDashboardRequest(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      dashboardRecommendations: Object.prototype.hasOwnProperty.call(options, "recommendations") ? options.recommendations : (appRead("recommendations", []) || []),
      dashboardInsights: Object.prototype.hasOwnProperty.call(options, "insights") ? options.insights : (appRead("personalInsights", null) || null),
      dashboardChallenges: Object.prototype.hasOwnProperty.call(options, "challenges") ? options.challenges : (appRead("activeChallenges", []) || []),
      lastDashboardRefreshAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt") ? options.refreshedAt : Date.now()
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] applyDashboardRequest");
  return null;
}

function refreshDashboardSnapshotRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.refreshDashboardSnapshot === "function") {
    return window.sparkCore.refreshDashboardSnapshot(options || {});
  }
  return applyDashboardRequest(options || {});
}

function initializeDashboardChallengesRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.initializeDashboardChallenges === "function") {
    return window.sparkCore.initializeDashboardChallenges(options || {});
  }
  return applyDashboardRequest(options || {});
}

function applyDashboardNavigationRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardNavigationRequest === "function") {
    return window.sparkCore.applyDashboardNavigationRequest(target);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    var screen = "home_dash";
    if (target === "recommendations") screen = "recommendations";
    else if (target === "insights") screen = "insights";
    else if (target === "challenges") screen = "challenges";
    else if (target === "career") screen = "career";
    return window.sparkCore.updateRuntimeState({ activeScreen: screen });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] applyDashboardNavigationRequest");
  return null;
}

function openDashboardSectionRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.openDashboardSection === "function") {
    return window.sparkCore.openDashboardSection(target);
  }
  return applyDashboardNavigationRequest(target);
}

function returnFromHomeFamilyRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.returnFromHomeFamily === "function") {
    return window.sparkCore.returnFromHomeFamily(options || {});
  }
  if (options && options.currentScreen) {
    var currentScreen = options.currentScreen;
    var isDashboardFamily = currentScreen === "recommendations"
      || currentScreen === "insights"
      || currentScreen === "challenges"
      || currentScreen === "career"
      || currentScreen === "home_dash";
    if (isDashboardFamily) return applyDashboardNavigationRequest("dashboard_back");
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: appRead("tab", null),
      transport: { status: "idle", positionMs: 0 }
    });
  }
  console.warn("[No Handler] returnFromHomeFamilyRequest");
  return null;
}

function openUtilityScreenRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.openUtilityScreen === "function") {
    return window.sparkCore.openUtilityScreen(target);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: target || "home",
      activeTab: appRead("tab", null)
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openUtilityScreenRequest");
  return null;
}

function syncSettingsStateRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncSettingsState === "function") {
    return window.sparkCore.syncSettingsState(options || {});
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncSettingsStateRequest");
  return null;
}

function buildMidiSettingsRuntimePayload() {
  var activeDevice = typeof getActiveMidiDevice === "function" ? getActiveMidiDevice() : null;
  var activeProfile = typeof getActiveMidiProfile === "function" ? getActiveMidiProfile() : null;
  var midiProfiles = appRead("midiProfiles", {}) || {};
  var profileIds = midiProfiles ? Object.keys(midiProfiles) : [];
  var profileOptions = [];
  var i;
  for (i = 0; i < profileIds.length; i++) {
    var id = profileIds[i];
    var profile = midiProfiles[id];
    if (!profile) continue;
    profileOptions.push({
      id: id,
      name: profile.name || "Unnamed Profile",
      type: profile.type || "default"
    });
  }
  return {
    midiEnabled: !!appRead("midiEnabled", false),
    activeDeviceId: appRead("activeMidiDeviceId", null),
    activeDeviceName: activeDevice ? (activeDevice.name || null) : null,
    activeProfileId: appRead("activeMidiProfileId", null),
    activeProfileName: activeProfile ? (activeProfile.name || null) : null,
    deviceOptions: Array.isArray(appRead("midiDevices", [])) ? appRead("midiDevices", []).map(function(device) {
      return {
        id: device.id,
        name: device.name || "MIDI Input"
      };
    }) : [],
    profileOptions: profileOptions
  };
}

function syncMidiSettingsStateRequest(options) {
  var payload = buildMidiSettingsRuntimePayload();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.syncMidiSettingsState === "function") {
    return window.sparkCore.syncMidiSettingsState(payload);
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncMidiSettingsStateRequest");
  return null;
}

function buildCloudSettingsRuntimePayload() {
  var cloudAuth = appRead("cloudAuth", null);
  var cloudSync = appRead("cloudSync", null);
  return {
    loggedIn: !!(cloudAuth && cloudAuth.loggedIn && cloudAuth.token),
    email: cloudAuth ? (cloudAuth.email || null) : null,
    lastSyncStatus: cloudSync ? (cloudSync.lastSyncStatus || "idle") : "idle",
    lastSyncAt: cloudSync ? (cloudSync.lastSyncAt || null) : null,
    lastError: appRead("cloudLastError", null)
  };
}

function syncCloudSettingsStateRequest(options) {
  var payload = buildCloudSettingsRuntimePayload();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.syncCloudSettingsState === "function") {
    return window.sparkCore.syncCloudSettingsState(payload);
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncCloudSettingsStateRequest");
  return null;
}

function applyCloudWorkflowRequest(action, options) {
  var payload = buildCloudSettingsRuntimePayload();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.applyCloudWorkflowRequest === "function") {
    return window.sparkCore.applyCloudWorkflowRequest(action, payload);
  }
  if (window.sparkCore && typeof window.sparkCore.syncCloudSettingsState === "function") {
    return window.sparkCore.syncCloudSettingsState(payload);
  }
  if (typeof console !== "undefined") console.warn("[No Handler] applyCloudWorkflowRequest");
  return null;
}

function buildCurriculumRuntimePayload() {
  var curriculums = (window.SparkCurriculum && SparkCurriculum.curriculums) || {};
  var packs = (window.SparkContent && SparkContent.packs) || {};
  var curriculumIds = Object.keys(curriculums);
  var packIds = Object.keys(packs);
  return {
    curriculums: curriculumIds.map(function(id) {
      var cur = curriculums[id] || {};
      return {
        id: id,
        title: cur.title || id,
        trackCount: Array.isArray(cur.tracks) ? cur.tracks.length : 0
      };
    }),
    packs: packIds.map(function(id) {
      var pack = packs[id] || {};
      return {
        id: id,
        title: pack.title || id,
        type: pack.type || "pack"
      };
    })
  };
}

function syncCurriculumStateRequest(options) {
  var payload = buildCurriculumRuntimePayload();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.syncCurriculumState === "function") {
    return window.sparkCore.syncCurriculumState(payload);
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncCurriculumStateRequest");
  return null;
}

function buildMidiImportRuntimePayload(options) {
  var normalizedMidi = (options && Object.prototype.hasOwnProperty.call(options, "normalizedMidi"))
    ? options.normalizedMidi
    : appRead("importedMidi", null);
  var assignments = (options && Object.prototype.hasOwnProperty.call(options, "assignments"))
    ? options.assignments
    : appRead("importedMidiAssignments", null);
  var seedChart = (options && Object.prototype.hasOwnProperty.call(options, "seedChart"))
    ? options.seedChart
    : appRead("importedMidiSeedPreview", null);
  var tracks = normalizedMidi && Array.isArray(normalizedMidi.tracks) ? normalizedMidi.tracks : [];
  return {
    summary: normalizedMidi ? {
      sourceName: normalizedMidi.sourceName || null,
      trackCount: tracks.length,
      tracks: tracks.map(function(track) {
        return {
          id: track.id,
          name: track.name || track.id || "Track",
          noteCount: Array.isArray(track.notes) ? track.notes.length : 0
        };
      })
    } : null,
    assignments: assignments || {},
    seedMode: (options && Object.prototype.hasOwnProperty.call(options, "seedMode")) ? options.seedMode : null,
    seedTitle: seedChart && seedChart.title ? seedChart.title : null
  };
}

function syncMidiImportStateRequest(options) {
  var payload = buildMidiImportRuntimePayload(options || {});
  if (window.sparkCore && typeof window.sparkCore.syncMidiImportState === "function") {
    return window.sparkCore.syncMidiImportState(payload);
  }
  if (typeof console !== "undefined") console.warn("[No Handler] syncMidiImportStateRequest");
  return null;
}

function openSkillTreeRequest() {
  if (window.sparkCore && typeof window.sparkCore.openSkillTree === "function") {
    return window.sparkCore.openSkillTree();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: appRead("tab", null)
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openSkillTreeRequest");
  return null;
}

function setSkillTreeFocusRequest(focus) {
  if (window.sparkCore && typeof window.sparkCore.setSkillTreeFocus === "function") {
    return window.sparkCore.setSkillTreeFocus(focus);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: appRead("tab", null),
      skillTreeFocus: focus || "overview"
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] setSkillTreeFocusRequest");
  return null;
}

function openStemPlayerRequest() {
  if (window.sparkCore && typeof window.sparkCore.openStemPlayer === "function") {
    return window.sparkCore.openStemPlayer();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "stems",
      activeTab: "songs",
      songsSubTab: "stems"
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] openStemPlayerRequest");
  return null;
}

function closeStemPlayerRequest() {
  if (window.sparkCore && typeof window.sparkCore.closeStemPlayer === "function") {
    return window.sparkCore.closeStemPlayer();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: "songs",
      songsSubTab: "stems",
      transport: { status: "idle", positionMs: 0 }
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] closeStemPlayerRequest");
  return null;
}

function returnFromUtilityFamilyRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.returnFromUtilityFamily === "function") {
    return window.sparkCore.returnFromUtilityFamily(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: appRead("tab", null),
      transport: { status: "idle", positionMs: 0 }
    });
  }
  if (typeof console !== "undefined") console.warn("[No Handler] returnFromUtilityFamilyRequest");
  return null;
}

function applyDashboardChallengeRewardRequest(challengeId) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardChallengeReward === "function") {
    return window.sparkCore.applyDashboardChallengeReward(challengeId);
  }
  if (typeof console !== "undefined") console.warn("[No Handler] applyDashboardChallengeRewardRequest");
  return null;
}

function completeSongSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeSongSession === "function") {
    return window.sparkCore.completeSongSession(options || {});
  }
  return syncSongRuntimeRequest("complete", options || {});
}

function completeGuidedSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeGuidedSession === "function") {
    return window.sparkCore.completeGuidedSession(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
    var result = window.sparkCore.completeSession({
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
    return result;
  }
  // Route through contract-based progress path (Phase 6 migration)
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var guidedResult = SparkContracts.createSessionResult({
      mode: "guided",
      instrumentId: typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive().id : null,
      instrumentType: typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive().instrument : null,
      duration: 300,
      accuracy: 0.75,
      completed: true
    });
    var guidedOutcome = SparkProgressOrchestrator.applySessionOutcome(guidedResult);
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[App] Guided ProgressOutcome:", guidedOutcome);
    }
  }
  console.warn("[No Handler] completeGuidedSessionRequest");
  return null;
}

function applyGuidedNavigationRequest(target, options) {
  if (window.sparkCore && typeof window.sparkCore.applyGuidedNavigationRequest === "function") {
    return window.sparkCore.applyGuidedNavigationRequest(target, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function") {
    if (target === "guided_home") {
      return window.sparkCore.syncGuidedRuntimeState({
        activeScreen: "home",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    if (target === "guided_done") {
      return window.sparkCore.syncGuidedRuntimeState({
        activeScreen: "guided_done",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "completed", positionMs: 0 }
      });
    }
  }
  console.warn("[No Handler] applyGuidedNavigationRequest");
  return null;
}

// ===== ACTION DISPATCHER =====
function callPlayAlongHandler(name, arg1, arg2) {
  if (typeof window[name] === "function") return window[name](arg1, arg2);
  return null;
}

window.act=function(a,v){
  // Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;
  // Spotify connect
  if(a==="spotifyConnect"){ callPlayAlongHandler("sparkPlayAlongConnectSpotify"); return; }
  if(a==="playAlongSelect"){ callPlayAlongHandler("sparkPlayAlongSelect", v); return; }
  if(a==="playAlongSearch"){ callPlayAlongHandler("sparkPlayAlongSearch", v); return; }
  if(a==="playAlongLoadFile"){ callPlayAlongHandler("sparkPlayAlongLoadFile", v); return; }
  if(a==="playAlongSaveTrack"){ callPlayAlongHandler("sparkPlayAlongSaveTrack", v); return; }
  if(a==="playAlongSaveClientId"){ callPlayAlongHandler("sparkPlayAlongSaveClientId"); return; }
  if(a==="playAlongResumeRecent"){ callPlayAlongHandler("sparkPlayAlongLaunchRecent", v); return; }
  if(a==="playAlongJumpToWeakSection"){ callPlayAlongHandler("sparkPlayAlongJumpToWeakSection"); return; }
  if(a==="playAlongStartDrill"){ callPlayAlongHandler("sparkPlayAlongStartDrill", v); return; }
  if(a==="playAlongBackHome"){ callPlayAlongHandler("sparkPlayAlongBackToHome"); return; }
  if(a==="playAlongLaunchSaved"){ callPlayAlongHandler("sparkPlayAlongLaunchSaved", v); return; }
  if(a==="playAlongRemoveSaved"){ callPlayAlongHandler("sparkPlayAlongRemoveSaved", v); return; }
  if(a==="playAlongClearSaved"){ callPlayAlongHandler("sparkPlayAlongClearSaved"); return; }
  if(a==="playAlongRemoveRecent"){ callPlayAlongHandler("sparkPlayAlongRemoveRecent", v); return; }
  if(a==="playAlongClearRecent"){ callPlayAlongHandler("sparkPlayAlongClearRecent"); return; }
  if(a==="playAlongLaunchBookmark"){ callPlayAlongHandler("sparkPlayAlongLaunchBookmark", v); return; }
  if(a==="playAlongRemoveBookmark"){ callPlayAlongHandler("sparkPlayAlongRemoveBookmark", v); return; }
  if(a==="playAlongClearBookmarks"){ callPlayAlongHandler("sparkPlayAlongClearBookmarks"); return; }
  if(a==="playAlongLaunchDemo"){ callPlayAlongHandler("sparkPlayAlongLaunchDemo", v); return; }
  if(a==="playAlongSetDifficulty"){ callPlayAlongHandler("sparkPlayAlongSetDifficulty", v); return; }
  if(a==="playAlongStop"){ callPlayAlongHandler("sparkPlayAlongStop"); return; }
  if(a==="playAlongTogglePause"){ callPlayAlongHandler("sparkPlayAlongTogglePause"); return; }
  if(a==="playAlongToggleLoop"){ callPlayAlongHandler("sparkPlayAlongToggleLoop"); return; }
  if(a==="playAlongBookmarkCurrentSection"){ callPlayAlongHandler("sparkPlayAlongBookmarkCurrentSection"); return; }
  if(a==="playAlongPrevSection"){ callPlayAlongHandler("sparkPlayAlongPrevSection"); return; }
  if(a==="playAlongNextSection"){ callPlayAlongHandler("sparkPlayAlongNextSection"); return; }
  if(a==="playAlongSetLoopTarget"){ callPlayAlongHandler("sparkPlayAlongSetLoopTarget", v); return; }
  if(a==="playAlongToggleDebug"){ callPlayAlongHandler("sparkPlayAlongToggleDebug"); return; }
  if(a==="playAlongReplayDrill"){ callPlayAlongHandler("sparkPlayAlongReplayDrill"); return; }
  if(a==="playAlongReplayFullSong"){ callPlayAlongHandler("sparkPlayAlongReplayFullSong"); return; }
  if(a==="playAlongReplay"){ callPlayAlongHandler("sparkPlayAlongReplay"); return; }
  if(a==="playAlongPickNew"){ callPlayAlongHandler("sparkPlayAlongPickNew"); return; }
  if(a==="openPlayAlongHome"){ if(typeof openPlayAlong==="function") openPlayAlong(); return; }
  if(a==="rhythmReplay"){ appWrite("rhythmResults", null); act("startRhythm"); return; }
  if(a==="rhythmResultsBack"){ appWrite("rhythmResults", null); render(); return; }
  if(a==="runnerReplay"){ appWrite("runnerResults", null); act("startRunner"); return; }
  if(a==="runnerResultsBack"){ appWrite("runnerResults", null); render(); return; }
  if(a==="onboardingSetInstrument"){ if(typeof setOnboardingInstrument==="function") setOnboardingInstrument(v); render(); return; }
  if(a==="onboardingSetSkillLevel"){ if(typeof setOnboardingSkillLevel==="function") setOnboardingSkillLevel(v); render(); return; }
  if(a==="onboardingToggleGoal"){ if(typeof toggleOnboardingGoal==="function") toggleOnboardingGoal(v); render(); return; }
  if(a==="onboardingMarkMidiDone"){ if(typeof markOnboardingMidiSetupDone==="function") markOnboardingMidiSetupDone(); render(); return; }
  if(a==="onboardingMarkCalibrationDone"){ if(typeof markOnboardingCalibrationDone==="function") markOnboardingCalibrationDone(); render(); return; }
  if(a==="onboardingUnlockStarterContent"){ if(typeof applyStarterUnlocksFromOnboarding==="function") applyStarterUnlocksFromOnboarding(); render(); return; }
  if(a==="onboardingGeneratePlan"){ if(typeof generateInitialPracticePlanFromOnboarding==="function") generateInitialPracticePlanFromOnboarding(); render(); return; }
  if(a==="onboardingGenerateRecommendations"){ if(typeof generateInitialRecommendationsFromOnboarding==="function") generateInitialRecommendationsFromOnboarding(); render(); return; }
  if(a==="onboardingFinish"){ if(typeof finishOnboardingFlow==="function") finishOnboardingFlow(); return; }
  if(a==="onboardingPrevStep"){ if(typeof goToPreviousOnboardingStep==="function") goToPreviousOnboardingStep(); return; }
  if(a==="onboardingNextStep"){ if(typeof goToNextOnboardingStep==="function") goToNextOnboardingStep(); return; }
  if(a==="refreshMidiDevices"){ if(typeof refreshMidiDevices==="function") refreshMidiDevices(); return; }
  // Switch instrument from v2 dashboard
  if(a==="switchInstrument" && v){
    SparkInstruments.activate(v);
    appWrite("activeInstrument", v);
    appWrite("screen", SCR.HOME);
    appWrite("tab", TAB.PRACTICE);
    saveState();
    render();
    return;
  }
  if(a==="returnToLauncher"){
    if (typeof window.returnToLauncherFromHeader === "function") {
      window.returnToLauncherFromHeader();
    }
    return;
  }
  if(a==="openInstrument" && v){
    if (typeof window.openInstrumentFromLauncher === "function") {
      window.openInstrumentFromLauncher(v);
    }
    return;
  }
  if(a==="goHome"){
    appApplyLegacyActivityRuntime({
      setFields:{tab:TAB.PRACTICE,screen:SCR.HOME,earTrainQ:null,earTrainAns:null,selectedVoicing:0}
    },function(){
      appWrite("tab", TAB.PRACTICE);
      appWrite("screen", SCR.HOME);
      appWrite("earTrainQ", null);
      appWrite("earTrainAns", null);
      appWrite("selectedVoicing", 0);
    });
    if(window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function"){
      window.sparkCore.updateRuntimeState({
        activeScreen: "home",
        activeTab: TAB.PRACTICE,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    stopAllTimers();
    render();
    return;
  }
  if(a==="tab"){
    appApplyLegacyActivityRuntime({
      setFields:{tab:v,screen:SCR.HOME,earTrainQ:null,earTrainAns:null,selectedVoicing:0}
    },function(){
      appWrite("tab",v);appWrite("screen",SCR.HOME);
      appWrite("earTrainQ",null);appWrite("earTrainAns",null);appWrite("selectedVoicing",0);
    });
    if(window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function"){
      window.sparkCore.updateRuntimeState({
        activeScreen: "home",
        activeTab: v || null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    stopAllTimers();
    if(v===TAB.SONGS&&appRead("songsSubTab", null)==="community")fetchCommunity();
    render();return;
  }
  if(a==="toggleSound"){
    appWrite("soundOn", !appRead("soundOn", true));
    saveState();
    render();
    return;
  }
  if(a==="startPracticeItem"){
    if (typeof window.startPracticeItem === "function") {
      window.startPracticeItem(v);
    }
    return;
  }
  if(a==="start_guided_session"){
    act("guidedStart", v);
    return;
  }
  if(a==="startAudioCalibration"){
    if (typeof window.startAudioCalibration === "function") {
      window.startAudioCalibration();
    }
    return;
  }
  if(a==="stopAudioCalibration"){
    if (typeof window.stopAudioCalibration === "function") {
      window.stopAudioCalibration();
    }
    return;
  }
  if(a==="openProgressDashboard"){
    appWrite("screen", SCR.PROGRESS);
    render();
    return;
  }
  if(a==="practiceSkillNow"){
    var reviewSkill = v || null;
    appWrite("reviewSkill", reviewSkill);
    if(reviewSkill && /(switch|transition)/i.test(String(reviewSkill))){
      act("startDrill");
      return;
    }
    act("quickStart");
    return;
  }
  if(a==="resetProgress"){
    if (typeof window.resetProgress === "function") {
      window.resetProgress();
    }
    return;
  }
  if(a==="selLevel"&&parseInt(v)<=appRead("level", 1)){appWrite("selectedLevel",parseInt(v));render();return;}
  if(a==="toggleTimer"){
    var nextTimerActive=!appRead("timerActive", false);
    appWrite("timerActive",nextTimerActive);
    syncLegacyPracticeRuntimeRequest(nextTimerActive ? "resume" : "pause", {
      remainingSec: appRead("timer", 0),
      timerActive: nextTimerActive,
      mode: appRead("lastChordName", "") ? "chord" : "quickStart",
      chordName: appRead("currentChord", null) ? appRead("currentChord", null).name : null,
      durationSec: 120
    });
    if(nextTimerActive)T.session=setTimeout(tickS,1000);else clearTimeout(T.session);
    render();return;
  }
  if(a==="completeSessionHome"){
    if(window.sparkCore && typeof window.sparkCore.returnFromLegacyPracticeFamily === "function"){
      window.sparkCore.returnFromLegacyPracticeFamily({ activeTab: "practice" });
    }
    act("tab","practice");
    return;
  }
  if(a==="drillDoneHome"){
    if(window.sparkCore && typeof window.sparkCore.returnFromLegacyPracticeFamily === "function"){
      window.sparkCore.returnFromLegacyPracticeFamily({ activeTab: "practice" });
    }
    act("tab","drill");
    return;
  }
  if(a==="repeatLegacyPracticeSession"){
    var repeatChord = appRead("currentChord", null);
    var repeatChordName = repeatChord && repeatChord.name ? repeatChord.name : (appRead("lastChordName", null) || null);
    var repeatDurationSec = typeof appRead("timer", null) === "number" ? appRead("timer", null) : 120;
    repeatLegacyPracticeSessionRequest({
      mode: repeatChordName ? "chord" : "quickStart",
      chordName: repeatChordName,
      durationSec: repeatDurationSec
    });
    if(repeatChordName){
      act("startSession", repeatChordName);
      return;
    }
    act("quickStart");
    return;
  }
  if(a==="repeatLegacyPracticeDrill"){
    var repeatDrillChords = appRead("drillChords", null);
    repeatLegacyPracticeDrillRequest({
      durationSec: typeof appRead("drillTimer", null) === "number" ? appRead("drillTimer", null) : 60,
      chordNames: Array.isArray(repeatDrillChords) ? repeatDrillChords.map(function(ch){ return ch && ch.name ? ch.name : ch; }).filter(Boolean) : []
    });
    act("startDrill");
    return;
  }
  if(a==="startDrill"){
    var drillLevel = appRead("level", 1);
    var drillPool = CHORDS[drillLevel] || CHORDS[1] || [];
    if(!drillPool.length) return;
    var drillSelection = drillPool.slice(0, Math.min(2, drillPool.length));
    if(drillSelection.length === 1) drillSelection.push(drillSelection[0]);
    var drillDurationSec = 60;
    openLegacyPracticeDrillRequest({
      durationSec: drillDurationSec,
      chordNames: drillSelection.map(function(ch){ return ch.name; })
    });
    appApplyLegacyActivityRuntime({
      setFields:{
        drillChords: drillSelection,
        drillIdx: 0,
        drillTimer: drillDurationSec,
        drillSwitches: 0,
        drillLastSwitchTime: Date.now(),
        drillAdaptiveBpm: 60,
        drillConsecutiveFast: 0,
        drillConsecutiveSlow: 0,
        screen: SCR.DRILL,
        tab: TAB.DRILL
      }
    }, function(){
      appWrite("drillChords", drillSelection);
      appWrite("drillIdx", 0);
      appWrite("drillTimer", drillDurationSec);
      appWrite("drillSwitches", 0);
      appWrite("drillLastSwitchTime", Date.now());
      appWrite("drillAdaptiveBpm", 60);
      appWrite("drillConsecutiveFast", 0);
      appWrite("drillConsecutiveSlow", 0);
      appWrite("screen", SCR.DRILL);
      appWrite("tab", TAB.DRILL);
    });
    _prevChordKey = drillSelection[0] && drillSelection[0].name ? drillSelection[0].name : "";
    snd("start");
    render();
    return;
  }
  if(a==="drillSwitch"){
    var sharedDrillChords = appRead("drillChords", []);
    if(!Array.isArray(sharedDrillChords) || sharedDrillChords.length < 2) return;
    snd("click");
    var sharedDrillIdx = appRead("drillIdx", 0) || 0;
    var sharedDrillSwitches = appRead("drillSwitches", 0) || 0;
    var sharedDrillLastSwitchTime = appRead("drillLastSwitchTime", Date.now()) || Date.now();
    var sharedDrillAdaptiveBpm = appRead("drillAdaptiveBpm", 60) || 60;
    var sharedDrillConsecutiveFast = appRead("drillConsecutiveFast", 0) || 0;
    var sharedDrillConsecutiveSlow = appRead("drillConsecutiveSlow", 0) || 0;
    var sharedDrillNow = Date.now();
    var sharedFromChord = sharedDrillChords[sharedDrillIdx] && sharedDrillChords[sharedDrillIdx].name;
    var sharedNextDrillIdx = (sharedDrillIdx + 1) % sharedDrillChords.length;
    var sharedToChord = sharedDrillChords[sharedNextDrillIdx] && sharedDrillChords[sharedNextDrillIdx].name;
    var sharedElapsed = (sharedDrillNow - sharedDrillLastSwitchTime) / 1000;
    var sharedTransitionStats = appRead("transitionStats", {});
    if(typeof sharedTransitionStats !== "object" || sharedTransitionStats === null) sharedTransitionStats = {};
    if(sharedFromChord && sharedToChord && sharedElapsed < 15){
      var sharedTransitionKey = sharedFromChord + "->" + sharedToChord;
      if(!sharedTransitionStats[sharedTransitionKey]) sharedTransitionStats[sharedTransitionKey] = { attempts: 0, avgTime: 0, best: 999 };
      var sharedTransition = sharedTransitionStats[sharedTransitionKey];
      sharedTransition.avgTime = (sharedTransition.avgTime * sharedTransition.attempts + sharedElapsed) / (sharedTransition.attempts + 1);
      sharedTransition.attempts++;
      if(sharedElapsed < sharedTransition.best) sharedTransition.best = sharedElapsed;
      var sharedTargetSecs = 60 / sharedDrillAdaptiveBpm;
      if(sharedElapsed < sharedTargetSecs * 0.8){
        sharedDrillConsecutiveFast++;
        sharedDrillConsecutiveSlow = 0;
        if(sharedDrillConsecutiveFast >= 3){
          sharedDrillAdaptiveBpm = Math.min(sharedDrillAdaptiveBpm + 3, 160);
          sharedDrillConsecutiveFast = 0;
          fireMicro("speed_up", "Speeding up!", "&#9654;&#65039;");
        }
      }else if(sharedElapsed > sharedTargetSecs * 1.5){
        sharedDrillConsecutiveSlow++;
        sharedDrillConsecutiveFast = 0;
        if(sharedDrillConsecutiveSlow >= 2){
          sharedDrillAdaptiveBpm = Math.max(sharedDrillAdaptiveBpm - 5, 40);
          sharedDrillConsecutiveSlow = 0;
        }
      }else{
        sharedDrillConsecutiveFast = 0;
        sharedDrillConsecutiveSlow = 0;
      }
    }
    _prevChordKey = sharedFromChord || "";
    sharedDrillSwitches += 1;
    appApplyLegacyActivityRuntime({
      setFields:{
        transitionStats: sharedTransitionStats,
        drillLastSwitchTime: sharedDrillNow,
        drillAdaptiveBpm: sharedDrillAdaptiveBpm,
        drillConsecutiveFast: sharedDrillConsecutiveFast,
        drillConsecutiveSlow: sharedDrillConsecutiveSlow,
        drillIdx: sharedNextDrillIdx,
        drillSwitches: sharedDrillSwitches
      }
    }, function(){
      appWrite("transitionStats", sharedTransitionStats);
      appWrite("drillLastSwitchTime", sharedDrillNow);
      appWrite("drillAdaptiveBpm", sharedDrillAdaptiveBpm);
      appWrite("drillConsecutiveFast", sharedDrillConsecutiveFast);
      appWrite("drillConsecutiveSlow", sharedDrillConsecutiveSlow);
      appWrite("drillIdx", sharedNextDrillIdx);
      appWrite("drillSwitches", sharedDrillSwitches);
    });
    if(sharedDrillSwitches === 1) fireMicro("clean_switch", "Smooth switch!", "&#9889;");
    if(sharedDrillSwitches === 3) fireMicro("three_switches", "On fire!", "&#128293;");
    render();
    return;
  }
  if(a==="start_ear"){
    act("startEarTrain");
    return;
  }
  if(a==="startEarTrain"){
    var sharedEarLevel = appRead("level", 1);
    var sharedEarChords = [];
    for(var sharedLevelIdx = 1; sharedLevelIdx <= sharedEarLevel; sharedLevelIdx++) sharedEarChords = sharedEarChords.concat(CHORDS[sharedLevelIdx] || []);
    if(!sharedEarChords.length) sharedEarChords = CHORDS[1] || [];
    if(!sharedEarChords.length) return;
    var sharedEarQuestion = sharedEarChords[Math.floor(Math.random() * sharedEarChords.length)];
    var sharedEarOptions = [sharedEarQuestion.name];
    var sharedEarAttempts = 0;
    while(sharedEarOptions.length < 4 && sharedEarAttempts < 100){
      var sharedEarRandom = ALL_CHORDS[Math.floor(Math.random() * ALL_CHORDS.length)];
      if(sharedEarOptions.indexOf(sharedEarRandom.name) === -1) sharedEarOptions.push(sharedEarRandom.name);
      sharedEarAttempts++;
    }
    sharedEarOptions = shuffle(sharedEarOptions);
    var sharedEarScore = appRead("earTrainScore", 0) || 0;
    var sharedEarTotal = appRead("earTrainTotal", 0) || 0;
    var sharedEarStreak = appRead("earTrainStreak", 0) || 0;
    if(window.sparkCore && typeof window.sparkCore.openLegacyEarTraining === "function"){
      window.sparkCore.openLegacyEarTraining({
        question: sharedEarQuestion.name,
        options: sharedEarOptions,
        answer: null,
        score: sharedEarScore,
        total: sharedEarTotal,
        streak: sharedEarStreak
      });
    }
    appApplyLegacyActivityRuntime({
      setFields:{
        tab:TAB.EAR,
        screen:SCR.HOME,
        earTrainQ: sharedEarQuestion.name,
        earTrainOpts: sharedEarOptions,
        earTrainAns: null,
        earTrainScore: sharedEarScore,
        earTrainTotal: sharedEarTotal,
        earTrainStreak: sharedEarStreak
      }
    }, function(){
      appWrite("tab", TAB.EAR);
      appWrite("screen", SCR.HOME);
      appWrite("earTrainQ", sharedEarQuestion.name);
      appWrite("earTrainOpts", sharedEarOptions);
      appWrite("earTrainAns", null);
      appWrite("earTrainScore", sharedEarScore);
      appWrite("earTrainTotal", sharedEarTotal);
      appWrite("earTrainStreak", sharedEarStreak);
    });
    render();
    return;
  }
  if(a==="guidedStart"){
    var guidedSessionNum = parseInt(v, 10);
    if(isNaN(guidedSessionNum)) guidedSessionNum = appRead("guidedSession", 1) || 1;
    var guidedPlan = openGuidedSessionRequest({ sessionNum: guidedSessionNum });
    if(guidedPlan){
      appApplyLegacyActivityRuntime({
        setFields:{screen:SCR.GUIDED}
      },function(){
        appWrite("screen",SCR.GUIDED);
      });
      snd("start");
      render();
    }
    return;
  }
  if(a==="doneSession"){
    clearTimeout(T.session);if(appRead("metronomeOn", false))stopMetronome();if(appRead("chordDetectOn", false))stopChordDetect();
    appApplyLegacyActivityRuntime({
      setFields:{timerActive:true,timer:0}
    },function(){
      appWrite("timerActive",true);appWrite("timer",0);
    });
    syncLegacyPracticeRuntimeRequest("set_remaining", {
      remainingSec: 0,
      timerActive: true,
      mode: appRead("lastChordName", "") ? "chord" : "quickStart",
      chordName: appRead("currentChord", null) ? appRead("currentChord", null).name : null,
      durationSec: 120
    });
    tickS();return;
  }
  if(a==="startDaily"&&appRead("dailyChallenge", null)){
    var dailyChallenge=appRead("dailyChallenge", null);
    var t=dailyChallenge.id==="hold"?30:dailyChallenge.id==="marathon"?180:60;
    appApplyLegacyActivityRuntime({
      setFields:{dailyTimer:t,dailyComplete:false,screen:SCR.DAILY}
    },function(){
      appWrite("dailyTimer",t);appWrite("dailyComplete",false);appWrite("screen",SCR.DAILY);
    });
    openLegacyDailyChallengeRequest({
      challengeId: dailyChallenge.id,
      durationSec: t
    });
    snd("start");render();T.daily=setTimeout(tickDy,1000);return;
  }
  if(a==="completeDaily"){
    clearTimeout(T.daily);snd("complete");
    var completeDailyChallenge=appRead("dailyChallenge", null);
    var xp=(completeDailyChallenge&&completeDailyChallenge.xp)||40;
    completeLegacyDailyChallengeRequest({
      challengeId: completeDailyChallenge ? completeDailyChallenge.id : null,
      durationSec: completeDailyChallenge && completeDailyChallenge.id === "hold" ? 30 : completeDailyChallenge && completeDailyChallenge.id === "marathon" ? 180 : 60
    });
    appApplyLegacyActivityCompletion({
      xpDelta:xp,
      setFlags:{dailyComplete:true},
      incrementFields:{dailyDone:1},
      history:{type:"daily",detail:completeDailyChallenge?completeDailyChallenge.title:"Challenge",xp:xp},
      checkBadges:true
    },function(){
      appWrite("dailyComplete",true);appIncrement("dailyDone",1);
      appApplyLegacyReward({xpDelta:xp},function(){appIncrement("xp",xp);});
      logHistory("daily",completeDailyChallenge?completeDailyChallenge.title:"Challenge",xp);
      checkBadges();saveState();
    });
    trigC();render();return;
  }
  if(a==="dailyDoneHome"){
    returnFromLegacyDailyChallengeRequest({ activeTab: "daily" });
    act("tab","daily");
    return;
  }
  if(a==="replayEarTrain"&&appRead("earTrainQ", null)){strumChord(appRead("earTrainQ", null));return;}
  if(a==="answerEarTrain"&&appRead("earTrainAns", null)===null){
    var currentEarTrainQ=appRead("earTrainQ", null);
    var earTrainOk=v===currentEarTrainQ;
    var nextEarTrainTotal=(appRead("earTrainTotal",0)||0)+1;
    var nextEarTrainScore=(appRead("earTrainScore",0)||0)+(earTrainOk?1:0);
    var nextEarTrainStreak=earTrainOk?((appRead("earTrainStreak",0)||0)+1):0;
    if(window.sparkCore&&typeof window.sparkCore.syncLegacyEarTrainingRuntimeState==="function"){
      window.sparkCore.syncLegacyEarTrainingRuntimeState({
        question: currentEarTrainQ,
        options: appRead("earTrainOpts", []),
        answer: v,
        score: nextEarTrainScore,
        total: nextEarTrainTotal,
        streak: nextEarTrainStreak
      });
    }
    appApplyLegacyActivityRuntime({
      setFields:{earTrainAns:v},
      incrementFields:{earTrainTotal:1}
    },function(){
      appWrite("earTrainAns",v);
      appIncrement("earTrainTotal",1);
    });
    var ok=earTrainOk;
    if(ok){
      snd("correct");
      appApplyLegacyActivityCompletion({
        xpDelta:15,
        incrementFields:{earTrainScore:1,earTrainStreak:1},
        history:{type:"ear",detail:currentEarTrainQ,xp:15},
        checkBadges:true
      },function(){
        appIncrement("earTrainScore",1);appIncrement("earTrainStreak",1);
        appApplyLegacyReward({xpDelta:15},function(){appIncrement("xp",15);});logHistory("ear",currentEarTrainQ,15);checkBadges();saveState();
      });
    }
    else{
      snd("wrong");
      appApplyLegacyActivityRuntime({
        setFields:{earTrainStreak:0}
      },function(){
        appWrite("earTrainStreak",0);
      });
    }
    render();
    setTimeout(function(){act("startEarTrain");},1500);
    return;
  }
  // === Sound Preview ===
  if(a==="previewChord"){strumChord(v);return;}
  // === Voicings ===
  if(a==="selectVoicing"){var currentChordForVoicing=appRead("currentChord", null);_prevChordKey=currentChordForVoicing?currentChordForVoicing.name+"_v"+appRead("selectedVoicing",0):"";appWrite("selectedVoicing",parseInt(v));render();return;}
  // === Strum ===
  if(a==="openStrum"){
    var sp;for(var i=0;i<STRUM_PATTERNS.length;i++)if(STRUM_PATTERNS[i].name===v)sp=STRUM_PATTERNS[i];
    if(sp&&sp.level<=appRead("level", 1)){
      if(window.sparkCore && typeof window.sparkCore.openLegacyStrumPattern === "function"){
        window.sparkCore.openLegacyStrumPattern({ pattern: sp });
      }
      appApplyLegacyActivityRuntime({
        setFields:{selectedStrum:sp,strumActive:false,_strumBeat:-1,screen:SCR.STRUM},
        clearIntervals:["strum"]
      },function(){
        appWrite("selectedStrum",sp);appWrite("strumActive",false);appWrite("_strumBeat",-1);clearInterval(T.strum);appWrite("screen",SCR.STRUM);
      });
      render();
    }return;
  }
  if(a==="toggleStrum"){
    snd("click");
    var selectedStrum=appRead("selectedStrum", null);
    var nextStrumActive=!appRead("strumActive", false);
    if(window.sparkCore && typeof window.sparkCore.syncLegacyStrumRuntimeState === "function"){
      window.sparkCore.syncLegacyStrumRuntimeState({
        pattern: selectedStrum,
        active: nextStrumActive,
        beat: nextStrumActive ? 0 : -1
      });
    }
    appApplyLegacyActivityRuntime({
      setFields:nextStrumActive?{strumActive:true,_strumBeat:0}:{strumActive:false,_strumBeat:-1},
      clearIntervals:nextStrumActive?[]:["strum"]
    },function(){
      appWrite("strumActive",nextStrumActive);
      if(!nextStrumActive){clearInterval(T.strum);appWrite("_strumBeat",-1);}
    });
    if(nextStrumActive&&selectedStrum){
      var p=selectedStrum.pattern,ms=60000/selectedStrum.bpm/(p.length>4?2:1);
      var currentStrumChord=appRead("currentChord", null);
      var _strumChordName=currentStrumChord?currentStrumChord.name:"E Major";
      if(p[0]!=="x")strumChord(_strumChordName);render();
      T.strum=setInterval(function(){
        var nextStrumBeat=(appRead("_strumBeat",-1)+1)%p.length;
        appWrite("_strumBeat",nextStrumBeat);
        if(window.sparkCore && typeof window.sparkCore.syncLegacyStrumRuntimeState === "function"){
          window.sparkCore.syncLegacyStrumRuntimeState({
            pattern: appRead("selectedStrum", null),
            active: true,
            beat: nextStrumBeat
          });
        }
        if(p[nextStrumBeat]!=="x")strumChord(_strumChordName);
        render();
      },ms);
    }else{clearInterval(T.strum);appWrite("_strumBeat",-1);render();}return;
  }
  // === Songs ===
  if(a==="songsSubTab"){
    appWrite("songsSubTab",v);
    applySongBrowserRequest("songs_subtab", { songsSubTab: appRead("songsSubTab", null) });
    if(v==="community")fetchCommunity();
    render();return;
  }
  if(a==="toggleSong"){
    snd("click");
    var selectedSongData=appRead("selectedSong", null);
    var nextSongPlaying=!appRead("songPlaying", false);
    syncSongRuntimeRequest(nextSongPlaying ? "play" : "pause", {
      songData: selectedSongData,
      source: window.sparkCore && window.sparkCore.getRuntimeState ? window.sparkCore.getRuntimeState().songSessionSource : "builtin",
      songBeat: nextSongPlaying ? 0 : appRead("songBeat", 0)
    });
    appApplyLegacyActivityRuntime({
      setFields:nextSongPlaying?{songPlaying:true,songBeat:0}:{songPlaying:false},
      clearIntervals:nextSongPlaying?[]:["song"]
    },function(){
      appWrite("songPlaying",nextSongPlaying);
      if(nextSongPlaying)appWrite("songBeat",0);
      else clearInterval(T.song);
    });
    if(nextSongPlaying&&selectedSongData){
      var ms=60000/selectedSongData.bpm;
      var cn=selectedSongData.progression[0];strumChord(CHORD_NAME_MAP[cn]||cn);
      render();
      T.song=setInterval(function(){
        var nextSongBeat=(appRead("songBeat",0)+1)%selectedSongData.progression.length;
        appWrite("songBeat",nextSongBeat);
        syncSongRuntimeRequest("tick", { songBeat: nextSongBeat });
        var cn=selectedSongData.progression[nextSongBeat];strumChord(CHORD_NAME_MAP[cn]||cn);render();
      },ms);
    }else{render();}return;
  }
  if(a==="completeSong"){
    var completeSongData=appRead("selectedSong", null);
    appApplyLegacyActivityRuntime({
      setFields:{songPlaying:false},
      clearIntervals:["song"]
    },function(){
      appWrite("songPlaying",false);clearInterval(T.song);
    });
    snd("complete");
    appApplyLegacyActivityCompletion({
      xpDelta:40,
      incrementFields:{songsPlayed:1},
      history:{type:"song",detail:completeSongData?completeSongData.title:"Song",xp:40},
      emit:{type:"lesson_completed",payload:{ appId: "chordspark", lessonId: "song_" + (completeSongData ? completeSongData.title : ""), xp: 40 }},
      checkBadges:true
    },function(){
      appIncrement("songsPlayed",1);appApplyLegacyReward({xpDelta:40},function(){appIncrement("xp",40);});
      logHistory("song",completeSongData?completeSongData.title:"Song",40);
      _sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "song_" + (completeSongData ? completeSongData.title : ""), xp: 40 });
      checkBadges();saveState();
    });
    completeSongSessionRequest({
      songData: completeSongData,
      source: window.sparkCore && window.sparkCore.getRuntimeState ? window.sparkCore.getRuntimeState().songSessionSource : "builtin",
      songBeat: appRead("songBeat", 0)
    });
    fireMicro("full_song","Rockstar!","&#127908;");
    trigC();appWrite("screen",SCR.SONG_DONE);render();return;
  }
  if(a==="songBack"){
    applySongNavigationRequest("songs_home");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}},function(){
      appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);
    });
    render();return;
  }
  if(a==="songDoneHome"){
    applySongNavigationRequest("songs_home");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}},function(){
      appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);
    });
    render();return;
  }
  // === Tuner ===
  if(a==="startTuner"){
    if(!AC){
      syncTunerRuntimeRequest({ active:false, error:"Audio not supported" });
      appApplyLegacyActivityRuntime({setFields:{tunerErr:"Audio not supported"}},function(){
        appWrite("tunerErr","Audio not supported");
      });
      render();return;
    }
    navigator.mediaDevices.getUserMedia(getAudioConstraint()).then(function(st){
      tunerR.stream=st;var ctx=new AC(),src=ctx.createMediaStreamSource(st),an=ctx.createAnalyser();
      an.fftSize=8192;src.connect(an); // Larger buffer for better low-freq accuracy
      tunerR.ctx=ctx;tunerR.analyser=an;
      syncTunerRuntimeRequest({ active:true, error:null, note:null, freq:0, cents:0 });
      appApplyLegacyActivityRuntime({setFields:{tunerActive:true,tunerErr:null}},function(){
        appWrite("tunerActive",true);appWrite("tunerErr",null);
      });
      _tunerHistory=[];_tunerStableCount=0;_tunerLastStableNote="";
      render();
      var buf=new Float32Array(an.fftSize);
      var _tunerFrameCount=0;
      function det(){
        _tunerFrameCount++;
        // Only process every 2nd frame (~30fps) to save CPU
        if(_tunerFrameCount%2===0){
          an.getFloatTimeDomainData(buf);var f=autoCorrelate(buf,ctx.sampleRate);
          var result=smoothTunerResult(f);
          if(result.note){
            appWrite("tunerNote",result.note);
            appWrite("tunerFreq",result.freq);
            appWrite("tunerCents",result.cents);
            syncTunerRuntimeRequest({ active:true, note: result.note, freq: result.freq, cents: result.cents, error:null });
          }else if(f<0){
            appWrite("tunerNote",null);appWrite("tunerFreq",0);appWrite("tunerCents",0);
            syncTunerRuntimeRequest({ active:true, note:null, freq:0, cents:0, error:null });
          }
          // Targeted UI update instead of full render
          updateTunerUI();
        }
        tunerR.anim=requestAnimationFrame(det);
      }det();
    }).catch(function(){
      syncTunerRuntimeRequest({ active:false, error:"Microphone access denied" });
      appApplyLegacyActivityRuntime({setFields:{tunerErr:"Microphone access denied"}},function(){
        appWrite("tunerErr","Microphone access denied");
      });
      render();
    });return;
  }
  if(a==="stopTuner"){
    if(tunerR.anim)cancelAnimationFrame(tunerR.anim);
    if(tunerR.stream)tunerR.stream.getTracks().forEach(function(t){t.stop();});
    if(tunerR.ctx)tunerR.ctx.close();
    syncTunerRuntimeRequest({ active:false, note:null, freq:0, cents:0, error:null });
    appApplyLegacyActivityRuntime({
      setFields:{tunerActive:false,tunerNote:null,tunerFreq:0,tunerCents:0}
    },function(){
      appWrite("tunerActive",false);
      appWrite("tunerNote",null);appWrite("tunerFreq",0);appWrite("tunerCents",0);
    });
    render();return;
  }
  if(a==="toggleMetro"){if(appRead("metronomeOn", false))stopMetronome();else startMetronome();return;}
  if(a==="metroBpm"){
    var b=parseInt(v);
    if(b>=40&&b<=200){
      appWrite("metronomeBpm",b);
      syncMetronomeRuntimeRequest({
        active: !!appRead("metronomeOn", false),
        bpm: appRead("metronomeBpm", 0),
        beat: appRead("_metroBeat", 0),
        beatsPerBar: appRead("_metroBeats", 4)
      });
      if(appRead("metronomeOn", false)){
        clearTimeout(T.metro);
        T.metro=null;
        if(typeof _metroNextTime==="number"&&audioCtx)_metroNextTime=audioCtx.currentTime;
        _metroSchedule();
      }
      render();
    }return;
  }
  if(a==="toggleChordDetect"){if(appRead("chordDetectOn", false))stopChordDetect();else startChordDetect();return;}
  // Dark mode toggle
  if(a==="toggleDark"){
    appApplyLegacyActivityRuntime({setFields:{darkMode:!appRead("darkMode", false)},save:false},function(){
      appWrite("darkMode",!appRead("darkMode", false));
    });
    saveState();applyTheme();render();return;
  }
  // Onboarding
  if(a==="setIntention"){appWrite("practiceIntention",v||"");return;}
  if(a==="completeOnboarding"){
    appApplyLegacyActivityRuntime({setFields:{onboardingDone:true},save:false},function(){
      appWrite("onboardingDone",true);
    });
    saveState();render();return;
  }
  // New system screens
  if(a==="openRecommendations"){
    openDashboardSectionRequest("recommendations");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.RECOMMENDATIONS}},function(){appWrite("screen",SCR.RECOMMENDATIONS);});
    render();return;
  }
  if(a==="openCareer"){
    openDashboardSectionRequest("career");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.CAREER}},function(){appWrite("screen",SCR.CAREER);});
    render();return;
  }
  if(a==="openCareerSong"){
    var nextSong=null;
    if(typeof getCareerItem==="function")nextSong=getCareerItem("songs",v);
    if(!nextSong){
      render();return;
    }
    openCareerSongSelectionRequest({
      songId: v,
      songData: nextSong,
      songTitle: nextSong.title || null,
      arrangementType: appRead("performArrangementType", "chords") || "chords",
      difficultyId: appRead("performDifficulty", "normal") || "normal"
    });
    appWrite("performSongData",nextSong);
    appWrite("performSongId",v);
    appApplyLegacyActivityRuntime({setFields:{currentSong:nextSong,performSongData:nextSong,performSongId:v,screen:SCR.PERFORM_SONG}},function(){
      appWrite("currentSong",nextSong);
      appWrite("performSongData",nextSong);
      appWrite("performSongId",v);
      appWrite("screen",SCR.PERFORM_SONG);
    });
    render();return;
  }
  if(a==="openInsights"){
    openDashboardSectionRequest("insights");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.INSIGHTS}},function(){appWrite("screen",SCR.INSIGHTS);});
    render();return;
  }
  if(a==="openChallengeHub"){
    if((appRead("activeChallenges", []) || []).length===0 && typeof initializeChallengesForCurrentCycle==="function"){
      initializeChallengesForCurrentCycle();
    }
    openDashboardSectionRequest("challenges");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.CHALLENGES}},function(){appWrite("screen",SCR.CHALLENGES);});
    render();return;
  }
  if(a==="openHomeDash"){
    openDashboardSectionRequest("home_dash");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME_DASH}},function(){appWrite("screen",SCR.HOME_DASH);});
    render();return;
  }
  if(a==="openSettings"){
    openUtilityScreenRequest("settings");
    syncSettingsStateRequest({ theme: appRead(["settings","theme"], null) });
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.SETTINGS}},function(){appWrite("screen",SCR.SETTINGS);});
    render();return;
  }
  if(a==="openChartEditor"){
    if(typeof openEditor==="function"){
      openEditor("chart");
      render();
    }
    return;
  }
  if(a==="openExerciseEditor"){
    if(typeof openEditor==="function"){
      openEditor("exercise");
      render();
    }
    return;
  }
  if(a==="editorClose"){
    appWrite("editorObject", null);
    appWrite("editorDirty", false);
    appWrite("editorSelectedId", null);
    appWrite("screen", SCR.HOME);
    appWrite("tab", TAB.PRACTICE);
    render();
    return;
  }
  if(appRead("screen", null)===SCR.EDITOR){
    if(a==="editorField"){
      var editorFieldSep=String(v||"").indexOf("|");
      if(editorFieldSep>=0&&typeof updateEditorField==="function"){
        updateEditorField(String(v).slice(0, editorFieldSep), String(v).slice(editorFieldSep+1));
        render();
      }
      return;
    }
    if(a==="editorItemField"){
      var editorItemSep=String(v||"").indexOf("|");
      if(editorItemSep>=0&&typeof updateSelectedEditorItemField==="function"){
        updateSelectedEditorItemField(String(v).slice(0, editorItemSep), String(v).slice(editorItemSep+1));
        render();
      }
      return;
    }
    if(a==="editorSelect"){
      if(typeof selectEditorItem==="function"){
        selectEditorItem(v);
        render();
      }
      return;
    }
    if(a==="editorPlayheadLeft"){
      if(typeof moveEditorPlayhead==="function"){
        moveEditorPlayhead("left");
        render();
      }
      return;
    }
    if(a==="editorPlayheadRight"){
      if(typeof moveEditorPlayhead==="function"){
        moveEditorPlayhead("right");
        render();
      }
      return;
    }
    if(a==="editorToggleSnap"){
      appWrite("editorSnapEnabled", !appRead("editorSnapEnabled", false));
      render();
      return;
    }
    if(a==="editorGrid"){
      appWrite("editorGridDivision", v||"1/4");
      render();
      return;
    }
    if(a==="editorZoomOut"){
      appWrite("editorTimelineWindowSec", Math.min(64, (appRead("editorTimelineWindowSec", 16)||16) + 4));
      render();
      return;
    }
    if(a==="editorZoomIn"){
      appWrite("editorTimelineWindowSec", Math.max(4, (appRead("editorTimelineWindowSec", 16)||16) - 4));
      render();
      return;
    }
    if(a==="editorAddAtPlayhead"){
      if(typeof addSeededDefaultEventAtPlayhead==="function"){
        addSeededDefaultEventAtPlayhead();
        render();
      }
      return;
    }
    if(a==="editorAddPhraseAtPlayhead"){
      if(typeof addPhraseAtPlayhead==="function"){
        addPhraseAtPlayhead();
        render();
      }
      return;
    }
    if(a==="editorAddEvent"){
      if(typeof addDefaultEditorEvent==="function"){
        addDefaultEditorEvent();
        render();
      }
      return;
    }
    if(a==="editorAddPhrase"){
      if(typeof addDefaultEditorPhrase==="function"){
        addDefaultEditorPhrase();
        render();
      }
      return;
    }
    if(a==="editorAddStep"){
      if(typeof addDefaultEditorStep==="function"){
        addDefaultEditorStep();
        render();
      }
      return;
    }
    if(a==="editorNudgeLeft"){
      if((typeof nudgeSelectedEditorGroup==="function"&&nudgeSelectedEditorGroup("left"))||(typeof nudgeSelectedEditorItem==="function"&&nudgeSelectedEditorItem("left"))){
        render();
      }
      return;
    }
    if(a==="editorNudgeRight"){
      if((typeof nudgeSelectedEditorGroup==="function"&&nudgeSelectedEditorGroup("right"))||(typeof nudgeSelectedEditorItem==="function"&&nudgeSelectedEditorItem("right"))){
        render();
      }
      return;
    }
    if(a==="editorDuplicate"){
      if((typeof duplicateSelectedEditorGroup==="function"&&duplicateSelectedEditorGroup())||(typeof duplicateSelectedEditorItem==="function"&&duplicateSelectedEditorItem())||(typeof duplicateSelectedPhraseRegion==="function"&&duplicateSelectedPhraseRegion())){
        render();
      }
      return;
    }
    if(a==="editorDeleteSelected"){
      if(typeof deleteSelectedEditorItems==="function"){
        deleteSelectedEditorItems();
        render();
      }
      return;
    }
    if(a==="editorSave"){
      if(typeof saveEditorObjectToLibrary==="function"&&saveEditorObjectToLibrary()){
        render();
      }
      return;
    }
    if(a==="editorExport"){
      if(typeof exportEditorObjectDesktopAware==="function"){
        exportEditorObjectDesktopAware();
      }else if(typeof exportEditorObject==="function"){
        exportEditorObject();
      }
      return;
    }
    if(a==="editorPreview"){
      if(typeof previewEditorObject==="function"){
        previewEditorObject();
      }
      return;
    }
  }
  if(a==="openOnboarding"){if(typeof startOnboarding==="function")startOnboarding();return;}
  if(a==="resumeOnboarding"){if(typeof continueOnboarding==="function")continueOnboarding();return;}
  if(a==="refreshHome"){
    if(typeof generateRecommendations==="function")generateRecommendations();
    if(typeof generatePersonalInsights==="function")generatePersonalInsights();
    refreshDashboardSnapshotRequest({
      recommendations: appRead("recommendations", []) || [],
      insights: appRead("personalInsights", null) || null,
      challenges: appRead("activeChallenges", []) || [],
      refreshedAt: Date.now()
    });
    render();return;
  }
  if(a==="launchRecommendation"){if(typeof launchRecommendationById==="function")launchRecommendationById(v);return;}
  if(a==="launchAnalyticsRecommendation"){
    var analyticsSummary = typeof buildAnalyticsSummary==="function" ? buildAnalyticsSummary() : null;
    var analyticsIndex = parseInt(v, 10);
    var analyticsItems = analyticsSummary && Array.isArray(analyticsSummary.recommendations) ? analyticsSummary.recommendations : [];
    if(analyticsIndex>=0 && analyticsIndex<analyticsItems.length && typeof launchPracticeItem==="function"){
      launchPracticeItem(analyticsItems[analyticsIndex]);
    }
    return;
  }
  if(a==="claimChallengeReward"){
    if(typeof claimChallengeReward==="function")claimChallengeReward(v);
    applyDashboardChallengeRewardRequest(v);
    render();return;
  }
  if(a==="initChallenges"){
    if(typeof initializeChallengesForCurrentCycle==="function")initializeChallengesForCurrentCycle();
    initializeDashboardChallengesRequest({
      recommendations: appRead("recommendations", []) || [],
      insights: appRead("personalInsights", null) || null,
      challenges: appRead("activeChallenges", []) || [],
      refreshedAt: Date.now()
    });
    render();return;
  }
  if(a==="openPracticePlan"){
    openPracticePlanScreenRequest();
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.PLAN}},function(){appWrite("screen",SCR.PLAN);});
    render();return;
  }
  if(a==="setTheme"){if(appRead("settings", null))appWrite(["settings","theme"],v);if(typeof applyThemeSetting==="function")applyThemeSetting();saveState();render();return;}
  if(a==="performHighwayTheme"){
    var performThemeChart = appRead("performChart", null);
    var performThemeInstrument = typeof getPerformanceHighwayInstrument==="function" ? getPerformanceHighwayInstrument(performThemeChart) : "guitar";
    if(typeof setPerformanceHighwayThemeSelection==="function")setPerformanceHighwayThemeSelection(v, performThemeInstrument);
    saveState();render();return;
  }
  // Song sorting
  if(a==="songSort"){
    if(appRead("songSort", null)===v){appWrite("songSortAsc",!appRead("songSortAsc", false));}
    else{appWrite("songSort",v);appWrite("songSortAsc",true);}
    applySongBrowserRequest("song_sort", {
      songSort: appRead("songSort", null),
      songSortAsc: appRead("songSortAsc", false)
    });
    render();return;
  }
  if(a==="songFilter"){appWrite("songFilter",v||"");applySongBrowserRequest("song_filter", { songFilter: appRead("songFilter", "") });render();return;}
  // Stem solo
  if(a==="stemSolo"){
    var stemSoloToggles=appRead("stemToggles", {});
    for(var sk in stemSoloToggles){
      var isSoloStem=(sk===v);
      appWrite(["stemToggles", sk],isSoloStem);
      setStemMuted(sk,!isSoloStem);
    }
    render();return;
  }
  if(a==="stemAll"){
    var stemAllToggles=appRead("stemToggles", {});
    for(var sk in stemAllToggles){appWrite(["stemToggles", sk],true);setStemMuted(sk,false);}
    render();return;
  }
  if(a==="guidedNext"){
    var steps=["spark","review","newMove","songSlice","victoryLap"];
    var guidedStep=appRead("guidedStep", null);
    var idx=steps.indexOf(guidedStep);
    if(idx<steps.length-1){
      guidedStep=steps[idx+1];
      appWrite("guidedStep",guidedStep);
      if(guidedStep==="newMove")appWrite("newMovePhase","watch");
      if(window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function"){
        window.sparkCore.syncGuidedRuntimeState({
          guidedStep: guidedStep,
          guidedNewMovePhase: appRead("newMovePhase", null) || null
        });
      }
    }
    render();return;
  }
  if(a==="guidedAdvancePhase"){
    var phases=["watch","shadow","try","refine"];
    var newMovePhase=appRead("newMovePhase", null);
    var pi=phases.indexOf(newMovePhase);
    if(pi<phases.length-1){
      newMovePhase=phases[pi+1];
      appWrite("newMovePhase",newMovePhase);
      if(window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function"){
        window.sparkCore.syncGuidedRuntimeState({
          guidedStep: appRead("guidedStep", null),
          guidedNewMovePhase: newMovePhase
        });
      }
    }
    else{act("guidedNext");return;} // refine done → advance to songSlice
    render();return;
  }
  if(a==="guidedStop"){
    clearTimeout(T.session);clearTimeout(T.drill);clearTimeout(T.daily);clearInterval(T.metro);clearInterval(T.strum);
    if(appRead("metronomeOn", false))stopMetronome();
    applyGuidedNavigationRequest("guided_home");
    appWrite("screen",SCR.HOME);appWrite("tab",TAB.PRACTICE);render();return;
  }
  // Dual instrument
  if(a==="dualChord"){appWrite("dualChord",v);render();return;}
  if(a==="toggleAnchor"){appWrite("dualAnchorOn",!appRead("dualAnchorOn", false));render();return;}
  if(a==="dualPreview"){
    // Play chord on both instruments
    strumChord(v);
    render();return;
  }
  // Practice Goal
  if(a==="setGoal"){
    var g=parseInt(v);
    if(g>=1&&g<=60){appWrite("dailyGoalMinutes",g);saveState();render();}
    return;
  }
  // === Custom Practice Sets ===
  if(a==="newSet"){appWrite("editingSet",true);appWrite("editingSetIdx",-1);appWrite("customSetName","");appWrite("customSetChords",[]);render();return;}
  if(a==="setName"){appWrite("customSetName",v);return;}
  if(a==="toggleSetChord"){
    var customSetChords=appRead("customSetChords", []);
    var idx=customSetChords.indexOf(v);
    if(idx===-1)customSetChords.push(v);else customSetChords.splice(idx,1);
    appWrite("customSetChords",customSetChords);
    render();return;
  }
  if(a==="saveSet"){
    var saveSetChords=appRead("customSetChords", []);
    var saveSetName=appRead("customSetName", "");
    var customSets=appRead("customSets", []);
    var editingSetIdx=appRead("editingSetIdx", -1);
    if(saveSetChords.length<2||!saveSetName.trim())return;
    var setObj={name:saveSetName.trim(),chords:saveSetChords.slice()};
    if(editingSetIdx>=0&&editingSetIdx<customSets.length){
      customSets[editingSetIdx]=setObj;
    }else{
      customSets.push(setObj);
    }
    appWrite("customSets",customSets);
    appWrite("editingSet",false);appWrite("editingSetIdx",-1);appWrite("customSetName","");appWrite("customSetChords",[]);
    saveState();render();return;
  }
  if(a==="cancelSet"){appWrite("editingSet",false);appWrite("editingSetIdx",-1);appWrite("customSetName","");appWrite("customSetChords",[]);render();return;}
  if(a==="editSet"){
    var editSetIdx=parseInt(v);
    var editCustomSets=appRead("customSets", []);
    if(editSetIdx>=0&&editSetIdx<editCustomSets.length){
      var cs=editCustomSets[editSetIdx];
      appWrite("editingSet",true);appWrite("editingSetIdx",editSetIdx);appWrite("customSetName",cs.name);appWrite("customSetChords",cs.chords.slice());
      render();
    }return;
  }
  if(a==="deleteSet"){
    var deleteSetIdx=parseInt(v);
    var deleteCustomSets=appRead("customSets", []);
    if(deleteSetIdx>=0&&deleteSetIdx<deleteCustomSets.length){
      deleteCustomSets.splice(deleteSetIdx,1);appWrite("customSets",deleteCustomSets);saveState();render();
    }return;
  }
  // === Rhythm Game ===
  if(a==="rhythmBpm"){
    var b=parseInt(v);
    if(b>=60&&b<=200){appWrite("rhythmBpm",b);render();}
    return;
  }
  if(a==="startRhythm"){
    var ms=60000/appRead("rhythmBpm", 90);
    var beats=[];
    var patterns=[["D","U","D","U"],["D","D","U","D"],["D","U","D","U","D","U","D","U"]];
    var pat=patterns[Math.floor(Math.random()*patterns.length)];
    for(var r=0;r<4;r++){
      for(var i=0;i<pat.length;i++){
        beats.push({time:(r*pat.length+i)*ms/2,type:pat[i],hit:false,result:null});
      }
    }
    appApplyLegacyActivityRuntime({
      setFields:{
        rhythmBeats:beats,
        rhythmScore:0,
        rhythmCombo:0,
        rhythmMaxCombo:0,
        rhythmActive:true,
        rhythmResults:null,
        rhythmStartTime:performance.now()
      }
    },function(){
      appWrite("rhythmBeats",beats);appWrite("rhythmScore",0);appWrite("rhythmCombo",0);appWrite("rhythmMaxCombo",0);
      appWrite("rhythmActive",true);appWrite("rhythmResults",null);appWrite("rhythmStartTime",performance.now());
    });
    openLegacyRhythmGameRequest({
      beats: beats,
      score: 0,
      combo: 0,
      maxCombo: 0,
      startTimeMs: appRead("rhythmStartTime", 0)
    });
    render();_rhythmAnim=requestAnimationFrame(rhythmTick);
    return;
  }
  if(a==="rhythmTap"&&appRead("rhythmActive", false)){
    var rhythmBeats=appRead("rhythmBeats", []);
    var rhythmScore=appRead("rhythmScore", 0);
    var rhythmCombo=appRead("rhythmCombo", 0);
    var rhythmMaxCombo=appRead("rhythmMaxCombo", 0);
    var rhythmStartTime=appRead("rhythmStartTime", 0);
    var now=performance.now()-rhythmStartTime;
    var closest=null,closestDiff=999999;
    for(var i=0;i<rhythmBeats.length;i++){
      var b=rhythmBeats[i];
      if(b.hit)continue;
      var diff=Math.abs(now-b.time);
      if(diff<closestDiff){closestDiff=diff;closest=i;}
    }
    if(closest!==null&&closestDiff<300){
      var b=rhythmBeats[closest];
      b.hit=true;
      if(closestDiff<50){b.result="perfect";rhythmScore+=100*(1+Math.floor(rhythmCombo/5));rhythmCombo++;snd("correct");}
      else if(closestDiff<100){b.result="good";rhythmScore+=50*(1+Math.floor(rhythmCombo/5));rhythmCombo++;snd("click");}
      else{b.result="ok";rhythmScore+=25;rhythmCombo=0;}
      if(rhythmCombo>rhythmMaxCombo)rhythmMaxCombo=rhythmCombo;
    }else{
      rhythmCombo=0;snd("wrong");
    }
    appWrite("rhythmBeats",rhythmBeats);
    appWrite("rhythmScore",rhythmScore);
    appWrite("rhythmCombo",rhythmCombo);
    appWrite("rhythmMaxCombo",rhythmMaxCombo);
    syncLegacyRhythmRuntimeRequest({
      active: appRead("rhythmActive", false),
      beats: rhythmBeats,
      score: rhythmScore,
      combo: rhythmCombo,
      maxCombo: rhythmMaxCombo,
      startTimeMs: rhythmStartTime
    });
    render();return;
  }
  // === Progression Builder ===
  if(a==="progPickerToggle"){appWrite("progPickerOpen",!appRead("progPickerOpen", false));render();return;}
  if(a==="progAdd"){var progAddChords=appRead("progChords", []);progAddChords.push(v);appWrite("progChords",progAddChords);appWrite("progPickerOpen",false);render();return;}
  if(a==="progRemove"){
    var progRemoveIdx=parseInt(v);
    var progRemoveChords=appRead("progChords", []);
    if(progRemoveIdx>=0&&progRemoveIdx<progRemoveChords.length){progRemoveChords.splice(progRemoveIdx,1);appWrite("progChords",progRemoveChords);render();}
    return;
  }
  if(a==="progMove"){
    var parts=v.split(":");
    var moveIdx=parseInt(parts[0]),dir=parts[1];
    var moveChords=appRead("progChords", []);
    if(dir==="left"&&moveIdx>0){
      var t=moveChords[moveIdx];moveChords[moveIdx]=moveChords[moveIdx-1];moveChords[moveIdx-1]=t;
    }else if(dir==="right"&&moveIdx<moveChords.length-1){
      var t2=moveChords[moveIdx];moveChords[moveIdx]=moveChords[moveIdx+1];moveChords[moveIdx+1]=t2;
    }
    appWrite("progChords",moveChords);
    render();return;
  }
  if(a==="progTemplate"){
    var templateIdx=parseInt(v);
    if(templateIdx>=0&&templateIdx<COMMON_PROGRESSIONS.length){
      appWrite("progChords",COMMON_PROGRESSIONS[templateIdx].chords.slice());
      render();
    }return;
  }
  if(a==="progBpm"){
    var b=parseInt(v);
    if(b>=40&&b<=200){
      appWrite("progBpm",b);
      if(appRead("progPlaying", false)){
        clearInterval(T.prog);
        var ms=60000/b;
        T.prog=setInterval(function(){
          var progChordsTick=appRead("progChords", []);
          var nextProgBeat=(appRead("progBeat",0)+1)%progChordsTick.length;
          appWrite("progBeat",nextProgBeat);
          strumChord(progChordsTick[nextProgBeat]);
          render();
        },ms);
      }
      render();
    }return;
  }
  if(a==="progPlay"){
    var progPlayChords=appRead("progChords", []);
    if(progPlayChords.length<2)return;
    if(appRead("progPlaying", false)){
      appWrite("progPlaying",false);clearInterval(T.prog);render();
    }else{
      appWrite("progPlaying",true);appWrite("progBeat",0);
      strumChord(progPlayChords[0]);
      var ms=60000/appRead("progBpm", 90);
      T.prog=setInterval(function(){
        var progIntervalChords=appRead("progChords", []);
        var nextProgBeat=(appRead("progBeat",0)+1)%progIntervalChords.length;
        appWrite("progBeat",nextProgBeat);
        strumChord(progIntervalChords[nextProgBeat]);
        render();
      },ms);
      render();
    }return;
  }
  if(a==="progClear"){
    if(appRead("progPlaying", false)){appWrite("progPlaying",false);clearInterval(T.prog);}
    appWrite("progChords",[]);render();return;
  }
  // === Export/Import Progress ===
  if(a==="exportProgress"){
    var data={version:"3.1",exportDate:new Date().toISOString(),data:{}};
    for(var i=0;i<PERSIST_FIELDS.length;i++){
      data.data[PERSIST_FIELDS[i]]=appRead(PERSIST_FIELDS[i], null);
    }
    var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    var url=URL.createObjectURL(blob);
    var a2=document.createElement("a");
    a2.href=url;a2.download="chordspark-backup.json";
    document.body.appendChild(a2);a2.click();document.body.removeChild(a2);
    URL.revokeObjectURL(url);
    appWrite("importMsg",{ok:true,text:"Progress exported!"});render();
    setTimeout(function(){appWrite("importMsg",null);render();},3000);
    return;
  }
  if(a==="importProgress"){
    var input=document.createElement("input");
    input.type="file";input.accept=".json";
    input.onchange=function(e){
      var file=e.target.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(ev){
        try{
          var imported=JSON.parse(ev.target.result);
          if(!imported.data||typeof imported.data!=="object"){throw new Error("Invalid format");}
          // Validate types before assignment
          var typeChecks={
            xp:"number",streak:"number",sessions:"number",drillCount:"number",
            dailyDone:"number",quizCorrect:"number",songsPlayed:"number",
            level:"number",soundOn:"boolean",darkMode:"boolean",
            selectedLevel:"number",earTrainScore:"number",
            dailyGoalMinutes:"number",todayPracticeSeconds:"number",
            goalReachedToday:"boolean",goalStreak:"number",focusMode:"boolean",
            runnerHighScore:"number"
          };
          var arrayFields=["history","customSets","earnedBadges","importedSongs","spotifySavedTracks"];
          var objectFields=["chordProgress","transitionStats"];
          for(var k in imported.data){
            if(PERSIST_FIELDS.indexOf(k)===-1)continue;
            var val=imported.data[k];
            if(typeChecks[k]&&typeof val!==typeChecks[k])continue; // skip wrong type
            if(arrayFields.indexOf(k)!==-1&&!Array.isArray(val))continue;
            if(objectFields.indexOf(k)!==-1&&(typeof val!=="object"||val===null||Array.isArray(val)))continue;
            appWrite(k,val);
          }
          if(!Array.isArray(appRead("history", null)))appWrite("history",[]);
          if(!Array.isArray(appRead("customSets", null)))appWrite("customSets",[]);
          if(!Array.isArray(appRead("importedSongs", null)))appWrite("importedSongs",[]);
          if(!Array.isArray(appRead("spotifySavedTracks", null)))appWrite("spotifySavedTracks",[]);
          if(typeof appRead("transitionStats", null)!=="object"||appRead("transitionStats", null)===null)appWrite("transitionStats",{});
          saveState();
          appWrite("importMsg",{ok:true,text:"Progress imported successfully!"});
        }catch(err){
          appWrite("importMsg",{ok:false,text:"Invalid backup file: "+(err.message||"unknown error")});
        }
        render();
        setTimeout(function(){appWrite("importMsg",null);render();},3000);
      };
      reader.readAsText(file);
    };
    input.click();
    return;
  }
  // === Chord Sheet Import ===
  if(a==="importText"){appWrite("importText",v);return;}
  if(a==="parseImport"){
    var result=parseChordSheet(appRead("importText",""));
    if(result.error){
      appWrite("importedSong",null);appWrite("importError",result.error);
    }else{
      appWrite("importedSong",{title:"Imported Song",artist:"Unknown",chords:result.chords,progression:result.progression,bpm:100,level:1,pattern:["D","D","U","U","D","U"]});
      appWrite("importError",null);
    }
    render();return;
  }
  if(a==="importTitle"){var importedSongTitle=appRead("importedSong", null);if(importedSongTitle){importedSongTitle.title=v;appWrite("importedSong",importedSongTitle);}return;}
  if(a==="importArtist"){var importedSongArtist=appRead("importedSong", null);if(importedSongArtist){importedSongArtist.artist=v;appWrite("importedSong",importedSongArtist);}return;}
  if(a==="importBpm"){var importedSongBpm=appRead("importedSong", null);if(importedSongBpm){importedSongBpm.bpm=parseInt(v)||100;appWrite("importedSong",importedSongBpm);}return;}
  if(a==="saveImport"){
    var importedSongToSave=appRead("importedSong", null);
    if(!importedSongToSave)return;
    var importedSongs=appRead("importedSongs", []);
    importedSongs.push(JSON.parse(JSON.stringify(importedSongToSave)));
    appWrite("importedSongs",importedSongs);
    appWrite("importedSong",null);appWrite("importText","");appWrite("importError",null);
    saveState();render();return;
  }
  if(a==="deleteImport"){
    var idx=parseInt(v);
    var importedSongsList=appRead("importedSongs", []);
    if(idx>=0&&idx<importedSongsList.length){importedSongsList.splice(idx,1);appWrite("importedSongs",importedSongsList);saveState();render();}
    return;
  }
  if(a==="playImport"){
    var idx=parseInt(v);
    var importedSongsPlay=appRead("importedSongs", []);
    if(idx>=0&&idx<importedSongsPlay.length){
      openSongSessionRequest({ songData: importedSongsPlay[idx], source: "imported" });
      appApplyLegacyActivityRuntime({
        setFields:{selectedSong:importedSongsPlay[idx],songPlaying:false,songBeat:0,screen:SCR.SONG},
        clearIntervals:["song"]
      },function(){
        appWrite("selectedSong",importedSongsPlay[idx]);appWrite("songPlaying",false);appWrite("songBeat",0);clearInterval(T.song);
        appWrite("screen",SCR.SONG);
      });
      render();
    }return;
  }
  // === Community ===
  if(a==="communityTab"){appWrite("communityTab",v);if(v==="submit")ensureCommunitySubmitSong();applySongBrowserRequest("community_tab", { communityTab: appRead("communityTab", null) });render();return;}
  if(a==="communitySearch"){appWrite("communitySearch",v);applySongBrowserRequest("community_search", { communitySearch: appRead("communitySearch", "") });fetchCommunity();return;}
  if(a==="communitySort"){appWrite("communitySort",v);applySongBrowserRequest("community_sort", { communitySort: appRead("communitySort", "") });fetchCommunity();return;}
  if(a==="voteSong"){
    fetch(COMMUNITY_URL+"/api/songs/"+v+"/vote",{method:"POST"}).then(function(){fetchCommunity();}).catch(function(){});
    return;
  }
  if(a==="playCommunity"){
    var song=null;
    var communitySongs=appRead("communitySongs", []) || [];
    for(var i=0;i<communitySongs.length;i++)if(communitySongs[i].id==v)song=communitySongs[i];
    if(!song)return;
    try{
      var parsed={
        title:song.title,artist:song.artist,bpm:song.bpm||100,level:1,
        chords:JSON.parse(song.chords),
        progression:JSON.parse(song.progression),
        pattern:JSON.parse(song.pattern||'["D","D","U","U","D","U"]')
      };
      if(!Array.isArray(parsed.chords)||!Array.isArray(parsed.progression)){throw new Error("Invalid song data");}
      openSongSessionRequest({ songData: parsed, source: "community" });
      appApplyLegacyActivityRuntime({
        setFields:{selectedSong:parsed,songPlaying:false,songBeat:0,screen:SCR.SONG},
        clearIntervals:["song"]
      },function(){
        appWrite("selectedSong",parsed);appWrite("songPlaying",false);appWrite("songBeat",0);clearInterval(T.song);
        appWrite("screen",SCR.SONG);
      });
      render();
    }catch(e){
      console.warn("ChordSpark: Failed to parse community song:",e.message);
      appWrite("communityError","Could not load song: invalid data");render();
    }
    return;
  }
  if(a==="submitField"){
    var sep=v.indexOf(":");
    var field=v.substring(0,sep),val=v.substring(sep+1);
    var submitSong=ensureCommunitySubmitSong();
    if(field==="bpm")submitSong.bpm=parseInt(val)||100;
    else submitSong[field]=val;
    return;
  }
  if(a==="submitToggleChord"){
    var submitSong=ensureCommunitySubmitSong();
    var idx=submitSong.chords.indexOf(v);
    if(idx===-1){submitSong.chords.push(v);submitSong.progression.push(v);}
    else{submitSong.chords.splice(idx,1);}
    render();return;
  }
  if(a==="submitClearProg"){ensureCommunitySubmitSong().progression=[];render();return;}
  if(a==="submitSong"){
    var ss=ensureCommunitySubmitSong();
    if(!ss.title.trim()||!ss.artist.trim()||ss.chords.length<2||ss.progression.length<2)return;
    var _title=ss.title.trim().slice(0,100);
    var _artist=ss.artist.trim().slice(0,100);
    var _submittedBy=(ss.submittedBy.trim()||"Anonymous").slice(0,50);
    var _bpm=Math.max(40,Math.min(200,Number(ss.bpm)||100));
    var body={
      title:escHTML(_title),artist:escHTML(_artist),
      chords:JSON.stringify(ss.chords),
      progression:JSON.stringify(ss.progression),
      pattern:JSON.stringify(["D","D","U","U","D","U"]),
      bpm:_bpm,level:1,
      submitted_by:_submittedBy
    };
    fetch(COMMUNITY_URL+"/api/songs",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)
    }).then(function(r){return r.json();}).then(function(){
      appWrite("submitSong",createEmptyCommunitySubmission());
      appWrite("communityTab","browse");
      fetchCommunity();
    }).catch(function(){
      appWrite("communityError","Failed to submit song");render();
    });
    return;
  }
  // === Chord Runner ===
  if(a==="startRunner"){
    var av=CHORDS[appRead("level", 1)]||CHORDS[1];
    var runnerTarget=av[Math.floor(Math.random()*av.length)];
    appApplyLegacyActivityRuntime({
      setFields:{
        runnerTarget:runnerTarget,
        runnerActive:true,
        runnerScore:0,
        runnerCombo:0,
        runnerMaxCombo:0,
        runnerLives:3,
        runnerObstacles:[],
        runnerSpeed:2,
        runnerDistance:0,
        runnerResults:null,
        runnerStartTime:Date.now(),
        runnerLastSpawn:0
      }
    },function(){
      appWrite("runnerTarget",runnerTarget);
      appWrite("runnerActive",true);appWrite("runnerScore",0);appWrite("runnerCombo",0);appWrite("runnerMaxCombo",0);
      appWrite("runnerLives",3);appWrite("runnerObstacles",[]);appWrite("runnerSpeed",2);appWrite("runnerDistance",0);
      appWrite("runnerResults",null);appWrite("runnerStartTime",Date.now());appWrite("runnerLastSpawn",0);
    });
    openLegacyRunnerGameRequest({
      targetName: runnerTarget ? runnerTarget.name : null,
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: 3,
      distance: 0,
      obstacles: []
    });
    _runnerObstId=0;
    snd("start");render();_runnerAnim=requestAnimationFrame(runnerTick);
    return;
  }
  if(a==="runnerStrum"&&appRead("runnerActive", false)){
    var runnerObstacles=appRead("runnerObstacles", []);
    var runnerCombo=appRead("runnerCombo", 0);
    var runnerMaxCombo=appRead("runnerMaxCombo", 0);
    var runnerScore=appRead("runnerScore", 0);
    var runnerLives=appRead("runnerLives", 0);
    var runnerTarget=appRead("runnerTarget", null);
    var closest=null,closestDist=999;
    for(var i=0;i<runnerObstacles.length;i++){
      var o=runnerObstacles[i];
      if(o.hit)continue;
      var dist=Math.abs(o.x-60);
      if(dist<closestDist&&o.x>0&&o.x<140){
        closestDist=dist;closest=i;
      }
    }
    if(closest!==null){
      var o=runnerObstacles[closest];
      o.hit=true;
      if(o.isTarget){
        runnerCombo++;
        if(runnerCombo>runnerMaxCombo)runnerMaxCombo=runnerCombo;
        var pts=100*(1+Math.floor(runnerCombo/5));
        runnerScore+=pts;o.result="correct";
        snd("correct");
        // Change target every 5 correct hits
        if(runnerCombo%5===0&&runnerCombo>0)changeRunnerTarget();
      }else{
        runnerLives--;runnerCombo=0;o.result="wrong";
        snd("wrong");
        if(runnerLives<=0){
          appWrite("runnerObstacles",runnerObstacles);appWrite("runnerLives",runnerLives);appWrite("runnerCombo",runnerCombo);appWrite("runnerScore",runnerScore);appWrite("runnerMaxCombo",runnerMaxCombo);
          finishRunner();return;
        }
      }
    }else{
      runnerCombo=0;
    }
    appWrite("runnerObstacles",runnerObstacles);
    appWrite("runnerCombo",runnerCombo);
    appWrite("runnerMaxCombo",runnerMaxCombo);
    appWrite("runnerScore",runnerScore);
    appWrite("runnerLives",runnerLives);
    syncLegacyRunnerRuntimeRequest({
      active: appRead("runnerActive", false),
      targetName: runnerTarget ? runnerTarget.name : null,
      score: runnerScore,
      combo: runnerCombo,
      maxCombo: runnerMaxCombo,
      lives: runnerLives,
      distance: Math.floor(appRead("runnerDistance",0)/100),
      obstacles: runnerObstacles
    });
    render();return;
  }
  // === Stem Separation ===
  if(a==="stemOpenFile"){
    if(!window.electron)return;
    appApplyLegacyActivityRuntime({setFields:{stemError:null}},function(){
      appWrite("stemError",null);
    });
    render();
    window.electron.stems.openFile().then(function(result){
      if(!result)return;
      appApplyLegacyActivityRuntime({setFields:{stemFile:result,stemError:null,stemStatus:"idle"}},function(){
        appWrite("stemFile",result);appWrite("stemError",null);appWrite("stemStatus","idle");
      });
      render();
      // Check cache first
      window.electron.stems.checkCache(result.filePath).then(function(cached){
        if(cached){
          appApplyLegacyActivityRuntime({setFields:{stemPaths:cached,stemStatus:"ready"}},function(){
            appWrite("stemPaths",cached);appWrite("stemStatus","ready");
          });
          render();
          // Pre-load audio URLs
          _loadStemFileUrls(cached);
        } else {
          act("stemSeparate");
        }
      });
    });
    return;
  }
  if(a==="stemSeparate"){
    var stemFile=appRead("stemFile", null);
    if(!window.electron||!stemFile)return;
    appApplyLegacyActivityRuntime({setFields:{stemStatus:"separating",stemProgress:0,stemError:null}},function(){
      appWrite("stemStatus","separating");appWrite("stemProgress",0);appWrite("stemError",null);
    });
    render();
    // Listen for progress
    var removeProgress=window.electron.stems.onProgress(function(data){
      // Estimate progress from stderr output
      if(data.line){
        // demucs.cpp outputs segment info; rough estimate
        appApplyLegacyActivityRuntime({setFields:{stemProgress:Math.min(95,appRead("stemProgress",0)+2)},save:false},function(){
          appWrite("stemProgress",Math.min(95,appRead("stemProgress",0)+2));
        });
        render();
      }
    });
    window.electron.stems.separate(stemFile.filePath).then(function(result){
      removeProgress();
      appApplyLegacyActivityRuntime({setFields:{stemPaths:result.stemPaths,stemStatus:"ready",stemProgress:100}},function(){
        appWrite("stemPaths",result.stemPaths);appWrite("stemStatus","ready");appWrite("stemProgress",100);
      });
      render();
      _loadStemFileUrls(result.stemPaths);
    }).catch(function(err){
      removeProgress();
      appApplyLegacyActivityRuntime({setFields:{stemStatus:"error",stemError:err.message||"Separation failed"}},function(){
        appWrite("stemStatus","error");appWrite("stemError",err.message||"Separation failed");
      });
      render();
    });
    return;
  }
  if(a==="stemCancel"){
    if(window.electron)window.electron.stems.cancel();
    appApplyLegacyActivityRuntime({setFields:{stemStatus:"idle",stemProgress:0}},function(){
      appWrite("stemStatus","idle");appWrite("stemProgress",0);
    });
    render();return;
  }
  if(a==="stemOpen"){
    openStemPlayerRequest();
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.STEMS}},function(){appWrite("screen",SCR.STEMS);});
    render();return;
  }
  if(a==="stemBack"){
    cleanupStems();
    closeStemPlayerRequest();
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS,songsSubTab:"stems"}},function(){appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);appWrite("songsSubTab","stems");});
    render();return;
  }
  if(a==="stemToggle"){
    var nextStemToggle=!appRead(["stemToggles",v], true);
    appWrite(["stemToggles",v],nextStemToggle);
    setStemMuted(v,!nextStemToggle);
    render();return;
  }
  if(a==="stemPlay"){
    if(appRead("stemPlaying", false)){pauseStems();}
    else{playStems();}
    return;
  }
  if(a==="stemSeek"){
    seekStems(parseFloat(v));render();return;
  }
  if(a==="stemVolume"){
    var stemVolumeValue=parseFloat(v);
    appWrite("stemVolume",stemVolumeValue);
    setStemVolume(stemVolumeValue);
    render();return;
  }
  // === Tone Picker ===
  if(a==="setTone"){
    if(STRUM_TONES[v]||v==="guitar"){appWrite("strumTone",v);saveState();render();}
    return;
  }
  // === Scale Explorer ===
  if(a==="selectScale"){appWrite("selectedScale",v);render();return;}
  // === Audio Input ===
  if(a==="refreshAudioInputs"){refreshAudioInputs();return;}
  if(a==="testAudioInput"){testAudioInput(v);return;}
  if(a==="stopAudioTest"){stopAudioTest();render();return;}
  if(a==="selectAudioInput"){
    stopAudioTest();
    appWrite("audioInputId",v);
    syncAudioInputRuntimeRequest({
      devices: appRead("audioInputDevices", []) || [],
      inputId: appRead("audioInputId", null),
      testingId: "",
      testLevel: 0
    });
    saveState();render();return;
  }
  // === MIDI ===
  if(a==="toggleMidi"){
    var midiEnabled=!appRead("midiEnabled", false);
    appWrite("midiEnabled",midiEnabled);
    if(midiEnabled){initMIDI();}
    else{appWrite("midiOutput",null);appWrite("midiDevices",[]);}
    syncMidiSettingsStateRequest();
    saveState();render();return;
  }
  if(a==="selectMidiDevice"){selectMIDIDevice(v);saveState();render();return;}
  // === Shortcuts ===
  if(a==="toggleFocus"){var nextFocusMode=!appRead("focusMode", false);appWrite("focusMode",nextFocusMode);if(nextFocusMode&&[TAB.PRACTICE,TAB.DRILL,TAB.DAILY,TAB.STATS,TAB.GUIDE].indexOf(appRead("tab", null))===-1){appWrite("tab",TAB.PRACTICE);}saveState();render();return;}
  if(a==="dismissBreak"){appWrite("breakDismissed",true);appWrite("sessionStartTime",Date.now());render();return;}
  if(a==="toggleShortcuts"){appWrite("showShortcuts",!appRead("showShortcuts", false));render();return;}
  // === Undo ===
  if(a==="undoReset"){undoReset();return;}
  // === Performance Mode ===
  if(a==="openPerform"){startPerformance(v);return;}
  if(a==="startPerform"){startPerformance(v);return;}
  if(a==="performSong"){
    var songIdx=parseInt(v);
    if(!isNaN(songIdx)&&SONGS[songIdx]){
      var performSongArrangement = typeof getPreferredPerformanceArrangement === "function"
        ? getPreferredPerformanceArrangement(SONGS[songIdx], "chords")
        : "chords";
      var chart=buildPerformanceChartFromSong(SONGS[songIdx],"builtin",performSongArrangement);
      if(chart){startPerformance(chart);return;}
    }
    return;
  }
  if(a==="performSongRhythm"){
    var songIdx=parseInt(v);
    if(!isNaN(songIdx)&&SONGS[songIdx]){
      var chart=buildPerformanceChartFromSong(SONGS[songIdx],"builtin","rhythm_chords");
      if(chart){
        appApplyLegacyActivityRuntime({setFields:{performArrangementType:"rhythm_chords"}},function(){
          appWrite("performArrangementType","rhythm_chords");
        });
        startPerformance(chart);return;
      }
    }
    return;
  }
  if(a==="openPerformSong"){
    var sgIdx=parseInt(v);
    if(!isNaN(sgIdx)&&SONGS[sgIdx]){
      var selectedSongId=(SONGS[sgIdx].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
      var selectedSongData = SONGS[sgIdx];
      appApplyLegacyActivityRuntime({setFields:{performTargetTechnique:null}},function(){
        appWrite("performTargetTechnique",null);
      });
      var preferredArrangement = typeof getPreferredPerformanceArrangement === "function"
        ? getPreferredPerformanceArrangement(SONGS[sgIdx], appRead("performArrangementType", "chords") || "chords")
        : (appRead("performArrangementType", "chords") || "chords");
      if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
        var sharedSelectionRequest = openPerformanceSongSelectionRequest({
          songIndex: sgIdx,
          songId: selectedSongId,
          songTitle: SONGS[sgIdx].title || null,
          targetTechnique: null,
          arrangementType: preferredArrangement,
          difficultyId: appRead("performDifficulty", "normal") || "normal"
        });
        if (sharedSelectionRequest && sharedSelectionRequest.songData) {
          selectedSongData = sharedSelectionRequest.songData;
          appWrite("performSongData", selectedSongData);
          appWrite("performSongId", sharedSelectionRequest.songId || selectedSongId);
          appWrite("performArrangementType", sharedSelectionRequest.arrangementType || preferredArrangement);
          appWrite("performDifficulty", sharedSelectionRequest.difficultyId || (appRead("performDifficulty", "normal") || "normal"));
        } else {
          appWrite("performSongData", selectedSongData);
          appWrite("performSongId", selectedSongId);
          appWrite("performArrangementType", preferredArrangement);
        }
      } else {
        appWrite("performSongData",selectedSongData);
        appWrite("performSongId",selectedSongId);
        appWrite("performArrangementType",preferredArrangement);
        appWrite("performTargetTechnique",null);
      }
      appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}},function(){
        appWrite("screen",SCR.PERFORM_SONG);
      });
      render();
    }
    return;
  }
  if(a==="planStartPerformanceSong"){
    var parts=String(v||"").split("|");
    var songId=parts[0]||"";
    var arrangementType=parts[1]||"chords";
    var difficultyId=parts[2]||"normal";
    appApplyLegacyActivityRuntime({setFields:{performTargetTechnique:null}},function(){
      appWrite("performTargetTechnique",null);
    });
    if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
      var planSelectionRequest = openPerformanceSongSelectionRequest({
        songId: songId,
        targetTechnique: null,
        arrangementType: arrangementType,
        difficultyId: difficultyId
      });
      if(!planSelectionRequest || !planSelectionRequest.songData){
        render();return;
      }
      if (planSelectionRequest) {
        appWrite("performSongData", planSelectionRequest.songData || null);
        appWrite("performSongId", planSelectionRequest.songId || songId);
        appWrite("performArrangementType", planSelectionRequest.arrangementType || arrangementType);
        appWrite("performDifficulty", planSelectionRequest.difficultyId || difficultyId);
      }
      appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}},function(){
        appWrite("screen",SCR.PERFORM_SONG);
      });
      render();return;
    }
    for(var psi=0;psi<SONGS.length;psi++){
      var planSongId=(SONGS[psi].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
      if(planSongId===songId){
        appWrite("performSongData",SONGS[psi]);
        appWrite("performSongId",songId);
        appWrite("performArrangementType",arrangementType);
        appWrite("performDifficulty",difficultyId);
        appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}},function(){
          appWrite("screen",SCR.PERFORM_SONG);
        });
        render();return;
      }
    }
    return;
  }
  if(a==="planStartPerformancePhrase"){
    var phraseParts=String(v||"").split("|");
    var phraseSongId=phraseParts[0]||"";
    var phraseArrangementType=phraseParts[1]||"chords";
    var phraseDifficultyId=phraseParts[2]||"normal";
    var phraseId=phraseParts[3];
    appApplyLegacyActivityRuntime({setFields:{performTargetPhrase:phraseId!=null&&phraseId!==""?parseInt(phraseId,10):null}},function(){
      appWrite("performTargetPhrase",phraseId!=null&&phraseId!==""?parseInt(phraseId,10):null);
    });
    act("planStartPerformanceSong", phraseSongId + "|" + phraseArrangementType + "|" + phraseDifficultyId);
    return;
  }
  if(a==="planStartPerformanceTechnique"){
    var techniqueParts=String(v||"").split("|");
    var techniqueSongId=techniqueParts[0]||"";
    var techniqueArrangementType=techniqueParts[1]||"imported_chart";
    var techniqueDifficultyId=techniqueParts[2]||"normal";
    var techniqueKey=techniqueParts[3]||null;
    appApplyLegacyActivityRuntime({setFields:{performTargetTechnique:techniqueKey}},function(){
      appWrite("performTargetTechnique",techniqueKey);
    });
    if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
      var techniqueSelectionRequest = openPerformanceSongSelectionRequest({
        songId: techniqueSongId,
        arrangementType: techniqueArrangementType,
        difficultyId: techniqueDifficultyId,
        targetTechnique: techniqueKey
      });
      if(!techniqueSelectionRequest || !techniqueSelectionRequest.songData){
        render();return;
      }
      appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}},function(){
        appWrite("screen",SCR.PERFORM_SONG);
      });
      render();return;
    }
    act("planStartPerformanceSong", techniqueSongId + "|" + techniqueArrangementType + "|" + techniqueDifficultyId);
    return;
  }
  if(a==="openPerfStats"){
    openPerformanceStatsRequest({ focus: "overview" });
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERF_STATS}},function(){appWrite("screen",SCR.PERF_STATS);});
    render();return;
  }
  if(a==="openEditor"){
    appApplyLegacyActivityRuntime({setFields:{performEditorChart:null,performEditorDirty:false,screen:SCR.PERF_EDITOR}},function(){
      appWrite("performEditorChart",null);appWrite("performEditorDirty",false);appWrite("screen",SCR.PERF_EDITOR);
    });
    openPerformanceEditorRequest(null, {
      action: "open_editor",
      source: "blank",
      dirty: false,
      mode: appRead("performEditorMode", "chords") || "chords",
      snap: appRead("performEditorSnap", "1/8") || "1/8",
      selectedEventId: null,
      selectedPhraseId: null
    });
    render();return;
  }
  if(a==="openSkillTree"){
    openSkillTreeRequest();
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.SKILL_TREE}},function(){appWrite("screen",SCR.SKILL_TREE);});
    render();return;
  }
  if(a==="planStartModuleExercise"){
    var moduleExercise = resolveModuleExerciseLaunchOptions(v);
    var modulePayload = buildModuleExerciseRhythmPayload(moduleExercise);
    if(modulePayload && typeof startRhythmHighwayPayload==="function"){
      startRhythmHighwayPayload(modulePayload, appRead("rhythmHighwayPreset", "spark_learning"), {
        source: "module_exercise",
        label: moduleExercise && (moduleExercise.exerciseName || moduleExercise.lessonId || moduleExercise.skill) || "Module exercise",
        instrument: moduleExercise && moduleExercise.instrument || null,
        exerciseId: moduleExercise && moduleExercise.exerciseId || null,
        exerciseFocus: moduleExercise && (moduleExercise.exerciseFocus || moduleExercise.skill) || null
      });
      return;
    }
    act("tab", TAB.PRACTICE);
    return;
  }
  if(a==="planStartRhythmHighway"){
    if(typeof startRhythmHighwaySegment==="function" && startRhythmHighwaySegment(v,appRead("rhythmHighwayPreset", "spark_learning")))return;
    render();return;
  }
  if(a==="planStartWarmup"){
    if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
      window.sparkCore.startSession({flow:"daily_practice",forceRebuild:true});
    }
    appWrite("screen",SCR.SESSION);render();return;
  }
  if(a==="planStartTransition"){
    if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
      window.sparkCore.startSession({flow:"daily_practice",forceRebuild:true});
    }
    appWrite("screen",SCR.SESSION);render();return;
  }
  if(a==="planStartRhythm"){
    appWrite("rhythmBpm",parseInt(v)||90);
    appWrite("tab",TAB.RHYTHM);appWrite("screen",SCR.HOME);render();return;
  }
  if(a==="rhythmHighwayPreset"){
    appWrite("rhythmHighwayPreset",v||"spark_learning");
    if(appRead("activeCoreSegmentId", null)&&typeof startRhythmHighwaySegment==="function"){
      startRhythmHighwaySegment(appRead("activeCoreSegmentId", null),appRead("rhythmHighwayPreset", "spark_learning"));
      return;
    }
    render();return;
  }
  if(a==="skillTreeFocus"){
    appWrite("skillTreeFocus",v||"overview");
    setSkillTreeFocusRequest(appRead("skillTreeFocus", "overview"));
    render();return;
  }
  if(a==="openPlan"){
    if(window.sparkCore){
      openPracticePlanScreenRequest();
    }
    appWrite("screen",SCR.PLAN);render();return;
  }
  if(a==="openCalibration"){
    a = "openPerformCalibration";
  }
  if(a==="openPerformCalibration"){
    openPerformanceCalibrationRequest();
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_CALIBRATE}},function(){appWrite("screen",SCR.PERFORM_CALIBRATE);});
    render();return;
  }
  if(a==="performCalibrateSource"){
    applyPerformanceCalibrationRequest("calibration_source", { source: v||"midi" });
    appApplyLegacyActivityRuntime({setFields:{performCalibrationSource:v||"midi"}},function(){appWrite("performCalibrationSource",v||"midi");});
    render();return;
  }
  if(a==="performCalibrationStart"){
    var calStartSource=typeof getPerformanceCalibrationView==="function"?getPerformanceCalibrationView().source:(appRead("performCalibrationSource","midi")||"midi");
    applyPerformanceCalibrationRequest("calibration_start", { source: calStartSource });
    startPerformanceCalibrationRun();render();return;
  }
  if(a==="performCalibrationStop"){
    applyPerformanceCalibrationRequest("calibration_stop");
    stopPerformanceCalibration();render();return;
  }
  if(a==="performCalibrationApply"){
    var appliedOffset=applyCalibrationOffset();
    applyPerformanceCalibrationRequest("calibration_apply", {
      source: appRead("performCalibrationSource","midi") || "midi",
      appliedOffsetMs: appliedOffset,
      globalOffsetMs: appRead("performTimingOffsetMs",0) || 0,
      midiOffsetMs: appRead("performMidiOffsetMs",0) || 0,
      micOffsetMs: appRead("performMicOffsetMs",0) || 0
    });
    render();return;
  }
  if(a==="performCalibrationReset"){
    var resetSource=typeof getPerformanceCalibrationView==="function"?getPerformanceCalibrationView().source:(appRead("performCalibrationSource","midi")||"midi");
    var resetPatch={performCalibrationHits:[]};
    if(resetSource==="midi")resetPatch.performMidiOffsetMs=0;
    if(resetSource==="mic")resetPatch.performMicOffsetMs=0;
    applyPerformanceCalibrationRequest("calibration_reset", {
      source: resetSource,
      globalOffsetMs: appRead("performTimingOffsetMs",0) || 0,
      midiOffsetMs: resetSource==="midi" ? 0 : (appRead("performMidiOffsetMs",0) || 0),
      micOffsetMs: resetSource==="mic" ? 0 : (appRead("performMicOffsetMs",0) || 0)
    });
    appApplyLegacyActivityRuntime({setFields:resetPatch,save:false},function(){
      if(resetPatch.performMidiOffsetMs===0)appWrite("performMidiOffsetMs",0);
      if(resetPatch.performMicOffsetMs===0)appWrite("performMicOffsetMs",0);
      appWrite("performCalibrationHits",[]);
    });
    saveState();render();return;
  }
  if(a==="performStatsBack"){
    applyPerformanceNavigationRequest("songs_home");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}},function(){
      appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);
    });
    render();return;
  }
  if(a==="performStatsFocus"){
    if(window.sparkCore&&typeof window.sparkCore.syncPerformanceRuntimeState==="function"){
      window.sparkCore.syncPerformanceRuntimeState("configure_stats", {
        focus: v || "overview"
      });
    }
    render();return;
  }
  if(a==="performCalibrationBack"){
    if(typeof stopPerformanceCalibration==="function")stopPerformanceCalibration();
    applyPerformanceNavigationRequest("songs_home", { performanceCalibrationMode: false });
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}},function(){
      appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);
    });
    render();return;
  }
  if(a==="performCalibrateTap"){
    var nowMs=performance.now();
    var beatIdx=typeof getCalibrationBeatIndex==="function"?getCalibrationBeatIndex():0;
    var startMs=typeof getCalibrationStartMs==="function"?getCalibrationStartMs():0;
    var interval=typeof getCalibrationBeatIntervalMs==="function"?getCalibrationBeatIntervalMs():1000;
    var targetMs=startMs+(beatIdx*interval);
    recordCalibrationHit(targetMs,nowMs);render();return;
  }
  if(a==="completePlan"){
    if(window.sparkCore){
      completeDailyPracticePlanRequest();
    } else {
      completePracticePlan();
    }
    render();return;
  }
  if(a==="regeneratePlan"){
    if(window.sparkCore){
      openDailyPracticePlanRequest({ forceRebuild: true });
    } else {
      buildPracticePlan();
    }
    render();return;
  }
  if(a==="editorBack"){
    if(window.sparkCore&&typeof window.sparkCore.syncPerformanceRuntimeState==="function"){
      window.sparkCore.syncPerformanceRuntimeState("close_editor", { screen: "home" });
    }
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}},function(){appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);});
    render();return;
  }
  if(a==="editorMode"){
    var editorModeChart=appRead("performEditorChart", null);
    syncPerformanceEditorDocumentState(editorModeChart, { mode: v });
    appWrite("performEditorMode",v);render();return;
  }
  if(a==="editorSnap"){
    var editorSnapChart=appRead("performEditorChart", null);
    syncPerformanceEditorDocumentState(editorSnapChart, { snap: v });
    appWrite("performEditorSnap",v);render();return;
  }
  if(a==="editorNew"){
    var editorMode=appRead("performEditorMode", "chords");
    var newEditorChartResult=applyPerformanceEditorCoreMutation("new_blank", { mode: editorMode });
    var nextEditorChart=newEditorChartResult&&newEditorChartResult.chart
      ? newEditorChartResult.chart
      : {id:"custom_"+Date.now(),title:"New Chart",artist:"Custom",bpm:90,beatsPerBar:4,arrangementType:editorMode,events:[],phrases:[{id:0,name:"Phrase 1",startSec:0,endSec:8}]};
    appWrite("performEditorChart",nextEditorChart);
    syncPerformanceEditorDocumentState(nextEditorChart, {
      source: "blank",
      dirty: true,
      selectedEventId: null,
      selectedPhraseId: null
    });
    appWrite("performEditorDirty",true);render();return;
  }
  if(a==="editorFromSong"){
    var editorSongData=appRead("performSongData", null);
    if(editorSongData){
      var chart=buildPerformanceChartFromSong(editorSongData,"builtin",appRead("performEditorMode", "chords"));
      if(chart){
        appWrite("performEditorChart",chart);
        syncPerformanceEditorDocumentState(chart, {
          source: "song",
          dirty: true,
          selectedEventId: null,
          selectedPhraseId: null
        });
        appWrite("performEditorDirty",true);render();
      }
    }
    return;
  }
  if(a==="editorTitle"){
    var editorTitleChart=appRead("performEditorChart", null);
    if(editorTitleChart){
      var titleMutation=applyPerformanceEditorCoreMutation("set_title", { title: v });
      editorTitleChart=titleMutation&&titleMutation.chart ? titleMutation.chart : editorTitleChart;
      editorTitleChart.title=v;
      appWrite("performEditorChart",editorTitleChart);
      syncPerformanceEditorDocumentState(editorTitleChart, { source: "existing", dirty: true });
      appWrite("performEditorDirty",true);render();
    }
    return;
  }
  if(a==="editorBpm"){
    var editorBpmChart=appRead("performEditorChart", null);
    if(editorBpmChart){
      var bpmValue=parseInt(v)||90;
      var bpmMutation=applyPerformanceEditorCoreMutation("set_bpm", { bpm: bpmValue });
      editorBpmChart=bpmMutation&&bpmMutation.chart ? bpmMutation.chart : editorBpmChart;
      editorBpmChart.bpm=bpmValue;
      appWrite("performEditorChart",editorBpmChart);
      syncPerformanceEditorDocumentState(editorBpmChart, { source: "existing", dirty: true });
      appWrite("performEditorDirty",true);render();
    }
    return;
  }
  if(a==="editorSelectEvent"){
    var nextSelectedEventId=parseInt(v);
    appWrite("performEditorSelectedEventId",nextSelectedEventId);
    var selectedEventMutation=applyPerformanceEditorCoreMutation("select_event", { id: nextSelectedEventId });
    var selectedEventChart=appRead("performEditorChart", null);
    if(selectedEventMutation&&selectedEventMutation.chart){
      selectedEventChart=selectedEventMutation.chart;
      appWrite("performEditorChart",selectedEventChart);
    }
    var selectedEditorEvent=null;
    if(selectedEventChart&&selectedEventChart.events){
      for(var selectedIdx=0;selectedIdx<selectedEventChart.events.length;selectedIdx++){
        if(selectedEventChart.events[selectedIdx].id===nextSelectedEventId){selectedEditorEvent=selectedEventChart.events[selectedIdx];break;}
      }
    }
    syncPerformanceEditorDocumentState(selectedEventChart, {
      source: selectedEventChart ? "existing" : "blank",
      dirty: !!appRead("performEditorDirty", false),
      selectedEventId: nextSelectedEventId,
      selectedEvent: selectedEditorEvent
    });
    render();return;
  }
  if(a==="editorAddEvent"){
    var addEventChart=appRead("performEditorChart", null);
    if(addEventChart){
      var addEventMutation=applyPerformanceEditorCoreMutation("add_event", { mode: appRead("performEditorMode", "chords") });
      if(addEventMutation&&addEventMutation.chart){
        addEventChart=addEventMutation.chart;
        appWrite("performEditorChart",addEventChart);
      }
      syncPerformanceEditorDocumentState(addEventChart, {
        source: "existing",
        dirty: true,
        selectedEventId: appRead("performEditorSelectedEventId", null) != null ? appRead("performEditorSelectedEventId", null) : null,
        selectedEvent: null
      });
      appWrite("performEditorDirty",true);render();
    }
    return;
  }
  if(a==="editorDeleteEvent"){
    var deleteEventChart=appRead("performEditorChart", null);
    if(deleteEventChart){
      var deleteEventId=parseInt(v);
      var deleteEventMutation=applyPerformanceEditorCoreMutation("delete_event", { id: deleteEventId });
      if(deleteEventMutation&&deleteEventMutation.chart)deleteEventChart=deleteEventMutation.chart;
      else deleteEventChart.events=deleteEventChart.events.filter(function(e){return e.id!==deleteEventId;});
      appWrite("performEditorChart",deleteEventChart);
      if(appRead("performEditorSelectedEventId", null)===parseInt(v))appWrite("performEditorSelectedEventId",null);
      syncPerformanceEditorDocumentState(deleteEventChart, {
        source: "existing",
        dirty: true,
        selectedEventId: appRead("performEditorSelectedEventId", null) != null ? appRead("performEditorSelectedEventId", null) : null,
        selectedEvent: null
      });
      appWrite("performEditorDirty",true);render();
    }
    return;
  }
  if(a==="editorEvt"){
    try{
      var p=JSON.parse(v);
      var editorEventChart=appRead("performEditorChart", null);
      if(editorEventChart){
        var editorMutation=applyPerformanceEditorCoreMutation("update_event", p);
        if(editorMutation&&editorMutation.chart)editorEventChart=editorMutation.chart;
        appWrite("performEditorChart",editorEventChart);
        for(var ee=0;ee<editorEventChart.events.length;ee++){
          if(editorEventChart.events[ee].id===p.id){
            var editedEvent=editorEventChart.events[ee];
            break;
          }
        }
        syncPerformanceEditorDocumentState(editorEventChart, {
          source: "existing",
          dirty: true,
          selectedEventId: appRead("performEditorSelectedEventId", null) != null ? appRead("performEditorSelectedEventId", null) : null,
          selectedEvent: editedEvent || null
        });
        appWrite("performEditorDirty",true);render();
      }
    }catch(e){}
    return;
  }
  if(a==="editorAddPhrase"){
    var addPhraseChart=appRead("performEditorChart", null);
    if(addPhraseChart){
      var addPhraseMutation=applyPerformanceEditorCoreMutation("add_phrase");
      if(addPhraseMutation&&addPhraseMutation.chart)addPhraseChart=addPhraseMutation.chart;
      appWrite("performEditorChart",addPhraseChart);
      var ph=addPhraseChart.phrases;
      var addedPhrase=ph[ph.length-1];
      syncPerformanceEditorDocumentState(addPhraseChart, {
        source: "existing",
        dirty: true,
        selectedPhraseId: addedPhrase.id,
        selectedPhrase: addedPhrase
      });
      appWrite("performEditorDirty",true);render();
    }
    return;
  }
  if(a==="editorSelectPhrase"){
    var selectedPhraseId=parseInt(v,10);
    var selectedPhraseMutation=applyPerformanceEditorCoreMutation("select_phrase", { id: selectedPhraseId });
    var selectedPhraseChart=appRead("performEditorChart", null);
    if(selectedPhraseMutation&&selectedPhraseMutation.chart){
      selectedPhraseChart=selectedPhraseMutation.chart;
      appWrite("performEditorChart",selectedPhraseChart);
    }
    var selectedPhrase=null;
    if(selectedPhraseChart&&selectedPhraseChart.phrases){
      for(var phraseIndex=0;phraseIndex<selectedPhraseChart.phrases.length;phraseIndex++){
        if(selectedPhraseChart.phrases[phraseIndex].id===selectedPhraseId){selectedPhrase=selectedPhraseChart.phrases[phraseIndex];break;}
      }
    }
    syncPerformanceEditorDocumentState(selectedPhraseChart, {
      source: selectedPhraseChart ? "existing" : "blank",
      dirty: !!appRead("performEditorDirty", false),
      selectedPhraseId: selectedPhrase ? selectedPhrase.id : null,
      selectedPhrase: selectedPhrase
    });
    render();return;
  }
  if(a==="editorPhrase"){
    try{
      var phrasePatch=JSON.parse(v);
      var updatedPhrase=null;
      var editorPhraseChart=appRead("performEditorChart", null);
      if(editorPhraseChart&&editorPhraseChart.phrases){
        var phraseMutation=applyPerformanceEditorCoreMutation("update_phrase", phrasePatch);
        if(phraseMutation&&phraseMutation.chart)editorPhraseChart=phraseMutation.chart;
        appWrite("performEditorChart",editorPhraseChart);
        for(var phraseEditIndex=0;phraseEditIndex<editorPhraseChart.phrases.length;phraseEditIndex++){
          if(editorPhraseChart.phrases[phraseEditIndex].id===phrasePatch.id){
            updatedPhrase=editorPhraseChart.phrases[phraseEditIndex];
            break;
          }
        }
        syncPerformanceEditorDocumentState(editorPhraseChart, {
          source: "existing",
          dirty: true,
          selectedPhraseId: updatedPhrase ? updatedPhrase.id : null,
          selectedPhrase: updatedPhrase
        });
        appWrite("performEditorDirty",true);render();
      }
    }catch(e){}
    return;
  }
  if(a==="editorDeletePhrase"){
    var deletePhraseId=parseInt(v,10);
    var deletePhraseChart=appRead("performEditorChart", null);
    if(deletePhraseChart&&deletePhraseChart.phrases){
      var deletePhraseMutation=applyPerformanceEditorCoreMutation("delete_phrase", { id: deletePhraseId });
      if(deletePhraseMutation&&deletePhraseMutation.chart)deletePhraseChart=deletePhraseMutation.chart;
      appWrite("performEditorChart",deletePhraseChart);
      syncPerformanceEditorDocumentState(deletePhraseChart, {
        source: "existing",
        dirty: true,
        selectedPhraseId: null,
        selectedPhrase: null
      });
      appWrite("performEditorDirty",true);render();
    }
    return;
  }
  if(a==="editorSave"){
    var saveEditorChart=appRead("performEditorChart", null);
    if(saveEditorChart){
      var copy=JSON.parse(JSON.stringify(saveEditorChart));
      var saveMutation=applyPerformanceEditorCoreMutation("save_to_library");
      if(saveMutation&&Array.isArray(saveMutation.library))syncPerformanceEditorLibraryState(saveMutation.library);
      else{
        var editorLibrary=appRead("performEditorLibrary", []);
        if(!Array.isArray(editorLibrary))editorLibrary=[];
        var exists=-1;
        for(var si=0;si<editorLibrary.length;si++){
          if(editorLibrary[si].id===saveEditorChart.id){exists=si;break;}
        }
        if(exists>=0)editorLibrary[exists]=copy;
        else editorLibrary.push(copy);
        syncPerformanceEditorLibraryState(editorLibrary);
      }
      syncPerformanceEditorDocumentState(copy, {
        source: "library",
        dirty: false,
        selectedEventId: appRead("performEditorSelectedEventId", null) != null ? appRead("performEditorSelectedEventId", null) : null
      });
      appWrite("performEditorDirty",false);saveState();render();
    }
    return;
  }
  if(a==="editorLoad"){
    var idx=parseInt(v);
    var loadMutation=applyPerformanceEditorCoreMutation("load_from_library", { index: idx });
    if(loadMutation&&Array.isArray(loadMutation.library))syncPerformanceEditorLibraryState(loadMutation.library);
    var performanceEditorLibrary=appRead("performEditorLibrary", []);
    if((loadMutation&&loadMutation.chart) || (performanceEditorLibrary&&performanceEditorLibrary[idx])){
      var loadedEditorChart=loadMutation&&loadMutation.chart ? loadMutation.chart : JSON.parse(JSON.stringify(performanceEditorLibrary[idx]));
      appWrite("performEditorChart",loadedEditorChart);
      syncPerformanceEditorDocumentState(loadedEditorChart, {
        source: "library",
        dirty: false,
        selectedEventId: null,
        selectedPhraseId: null
      });
      appWrite("performEditorDirty",false);appWrite("performEditorSelectedEventId",null);render();
    }
    return;
  }
  if(a==="editorDelete"){
    var di=parseInt(v);
    var deleteMutation=applyPerformanceEditorCoreMutation("delete_from_library", { index: di });
    if(deleteMutation&&Array.isArray(deleteMutation.library)){
      syncPerformanceEditorLibraryState(deleteMutation.library);
      saveState();render();
      return;
    }
    var deleteEditorLibrary=appRead("performEditorLibrary", []);
    if(deleteEditorLibrary&&deleteEditorLibrary[di]){
      deleteEditorLibrary.splice(di,1);
      syncPerformanceEditorLibraryState(deleteEditorLibrary);
      saveState();render();
    }
    return;
  }
  if(a==="editorExport"){
    var exportData=getPerformanceEditorExportData();
    if(exportData.chart){
      var json=exportData.json;
      var blob=new Blob([json],{type:"application/json"});
      var url=URL.createObjectURL(blob);
      var a2=document.createElement("a");a2.href=url;a2.download=exportData.fileName;
      document.body.appendChild(a2);a2.click();document.body.removeChild(a2);URL.revokeObjectURL(url);
    }
    return;
  }
  if(a==="editorPreview"){
    var previewRequest=getPerformanceEditorPreviewRequest();
    if(previewRequest&&previewRequest.chart&&previewRequest.chart.events&&previewRequest.chart.events.length){
      startPerformance(previewRequest.chart,{
        difficulty:previewRequest.difficulty,
        speed:previewRequest.speed,
        preset:previewRequest.preset,
        mode:previewRequest.mode
      });
    }
    return;
  }
  if(a==="openPerformanceDaily"){
    var ch=choosePerformanceDailyChallenge();
    if(!ch){render();return;}
    var defaultArrangement = ch.arrangementType||"chords";
    var defaultDifficulty = ch.difficultyId||"normal";
    if(ch.songId){
      for(var di=0;di<SONGS.length;di++){
        var dsid=(SONGS[di].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
        if(dsid===ch.songId){
          openPerformanceDailyChallengeRequest({
            songId: ch.songId,
            songData: SONGS[di],
            songTitle: SONGS[di].title || null,
            arrangementType: defaultArrangement,
            difficultyId: defaultDifficulty,
            songIndex: di,
            targetTechnique: ch.techniqueKey||null
          });
          appWrite("performSongData",SONGS[di]);appWrite("performSongId",ch.songId);
          appWrite("performArrangementType",defaultArrangement);
          appWrite("performDifficulty",defaultDifficulty);
          appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}},function(){appWrite("screen",SCR.PERFORM_SONG);});
          render();return;
        }
      }
    }
    var fallbackRequest = openPerformanceDailyChallengeRequest({
      arrangementType: defaultArrangement,
      difficultyId: defaultDifficulty,
      targetTechnique: ch.techniqueKey||null
    });
    if(fallbackRequest && fallbackRequest.songData){
      appWrite("performSongData",fallbackRequest.songData);
      appWrite("performSongId",fallbackRequest.songId||null);
      appWrite("performArrangementType",fallbackRequest.arrangementType||defaultArrangement);
      appWrite("performDifficulty",fallbackRequest.difficultyId||defaultDifficulty);
      appApplyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}},function(){appWrite("screen",SCR.PERFORM_SONG);});
    } else {
      appApplyLegacyActivityRuntime({setFields:{tab:TAB.SONGS,screen:SCR.HOME}},function(){appWrite("tab",TAB.SONGS);appWrite("screen",SCR.HOME);});
    }
    render();return;
  }
  if(a==="performArrangement"){
    appWrite("performArrangementType",v||"chords");
    if(window.sparkCore&&typeof window.sparkCore.syncPerformanceRuntimeState==="function"){
      var arrangementState = window.sparkCore.getRuntimeState();
      window.sparkCore.syncPerformanceRuntimeState("configure", {
        arrangementType: appRead("performArrangementType", "chords"),
        songIndex: arrangementState.performanceSongIndex,
        songTitle: arrangementState.performanceSongTitle
      });
    }
    saveState();render();return;
  }
  if(a==="importSongAudio"){
    if(!window.electron||!window.electron.stems){alert("Stem separation requires the desktop app.");return;}
    var importSongId=v;
    window.electron.stems.openFile().then(function(result){
      if(!result)return;
      appApplyLegacyActivityRuntime({setFields:{songAudioImporting:true,songAudioProgress:0,songAudioImportingSongId:importSongId}},function(){
        appWrite("songAudioImporting",true);
        appWrite("songAudioProgress",0);
        appWrite("songAudioImportingSongId",importSongId);
      });
      render();

      var unsubProgress=window.electron.stems.onProgress(function(data){
        if(data&&data.progress!=null){
          appApplyLegacyActivityRuntime({setFields:{songAudioProgress:Math.round(data.progress)},save:false},function(){
            appWrite("songAudioProgress",Math.round(data.progress));
          });
          render();
        }
      });

      window.electron.stems.checkCache(result.filePath).then(function(cached){
        if(cached){
          return cached;
        }
        return window.electron.stems.separate(result.filePath);
      }).then(function(stemPaths){
        unsubProgress();
        if(!stemPaths){
          appApplyLegacyActivityRuntime({setFields:{songAudioImporting:false}},function(){
            appWrite("songAudioImporting",false);
          });
          render();return;
        }

        var stemNames=Object.keys(stemPaths);
        var urlMap={};

        function loadNextUrl(idx){
          if(idx>=stemNames.length){
            var songAudioData=appRead("songAudioData", null);
            if(!songAudioData||typeof songAudioData!=="object"){
              songAudioData={};
              appWrite("songAudioData",songAudioData);
            }
            songAudioData[importSongId]={
              mp3Path:result.filePath,
              detectedBpm:null,
              stemPaths:stemPaths,
              stemUrls:urlMap,
              importedAt:new Date().toISOString()
            };
            appApplyLegacyActivityRuntime({setFields:{songAudioImporting:false,songAudioProgress:0},save:false},function(){
              appWrite("songAudioImporting",false);
              appWrite("songAudioProgress",0);
            });
            saveState();
            render();
            return;
          }
          var name=stemNames[idx];
          window.electron.stems.getFileUrl(stemPaths[name]).then(function(url){
            urlMap[name]=url;
            loadNextUrl(idx+1);
          });
        }
        loadNextUrl(0);
      }).catch(function(err){
        unsubProgress();
        appApplyLegacyActivityRuntime({setFields:{songAudioImporting:false,songAudioProgress:0}},function(){
          appWrite("songAudioImporting",false);
          appWrite("songAudioProgress",0);
        });
        alert("Stem separation failed: "+(err.message||err));
        render();
      });
    });
    return;
  }
  if(a==="removeSongAudio"){
    var songAudioData=appRead("songAudioData", null);
    if(songAudioData&&Object.prototype.hasOwnProperty.call(songAudioData, v))delete songAudioData[v];
    saveState();render();return;
  }
  if(a==="performStartFromSong"){
    var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
      ? window.sparkCore.getActiveSessionView()
      : null;
    var performanceSong = coreView
      && coreView.plan
      && coreView.plan.flow === "performance_song"
      && coreView.plan.context
      ? coreView.plan.context.performanceSong || null
      : null;
    var selectedSong = performanceSong && performanceSong.songData ? performanceSong.songData : appRead("performSongData", null);
    var selectedSongIndex = coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceSongIndex")
      ? coreView.runtimeState.performanceSongIndex
      : null;
    var selectedSongTitle = coreView && coreView.runtimeState && coreView.runtimeState.performanceSongTitle
      ? coreView.runtimeState.performanceSongTitle
      : (selectedSong && selectedSong.title ? selectedSong.title : null);
    var arrangementType = performanceSong && performanceSong.arrangementType ? performanceSong.arrangementType : appRead("performArrangementType", "chords");
    var difficultyId = coreView && coreView.runtimeState && coreView.runtimeState.performanceDifficultyId
      ? coreView.runtimeState.performanceDifficultyId
      : appRead("performDifficulty", "normal");
    var speed = coreView && coreView.runtimeState && coreView.runtimeState.performanceSpeed
      ? coreView.runtimeState.performanceSpeed
      : appRead("performSpeed", 1);
    var selectedSongId = performanceSong && performanceSong.songId
      ? performanceSong.songId
      : appRead("performSongId", null);
    var targetTechnique = coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceTargetTechnique")
      ? coreView.runtimeState.performanceTargetTechnique
      : appRead("performTargetTechnique", null);
    function startSelectedChart(chart, chartId) {
      if (!chart) return;
      var startRequest = startSelectedPerformanceSongRequest({
        chart: chart,
        chartId: chartId || chart.id || null,
        songIndex: selectedSongIndex,
        songTitle: selectedSongTitle,
        difficulty: difficultyId,
        arrangementType: arrangementType,
        speed: speed,
        targetTechnique: targetTechnique,
        preset: appRead("performPracticePreset", null),
        mode: appRead("performMode", "midi"),
        countIn: !!appRead("performCountIn", false)
      });
      startPerformance(chart,{difficulty:startRequest.difficulty,speed:startRequest.speed,preset:startRequest.preset,mode:startRequest.mode});
    }
    if(selectedSong){
      var chart=buildPerformanceChartFromSong(selectedSong,"builtin",arrangementType);
      if(chart){
        startSelectedChart(chart, chart.id || null);
        return;
      }
    }
    if(selectedSongId && typeof loadPerformanceChart === "function"){
      loadPerformanceChart(selectedSongId).then(function(loadedChart){
        startSelectedChart(loadedChart, selectedSongId);
      }).catch(function(err){
        if (typeof console !== "undefined") console.warn("Failed to load performance chart", err);
        if (typeof showToast === "function") showToast("Couldn't load this performance chart.");
      });
    }
    return;
  }
  if(a==="performSongBack"){
    appApplyLegacyActivityRuntime({setFields:{performTargetTechnique:null}},function(){
      appWrite("performTargetTechnique",null);
    });
    applyPerformanceNavigationRequest("songs_home");
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}},function(){
      appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);
    });
    render();return;
  }
  if(a==="pausePerform"){pausePerformance();return;}
  if(a==="resumePerform"){resumePerformance();return;}
  if(a==="stopPerform"){
    stopPerformance();
    var performanceStopState = applyPerformanceNavigationRequest("return_after_stop");
    var shouldReturnToSong = performanceStopState && performanceStopState.activeScreen === "performance_song";
    appApplyLegacyActivityRuntime({setFields:shouldReturnToSong?{screen:SCR.PERFORM_SONG}:{screen:SCR.HOME,tab:TAB.SONGS}},function(){
      if(shouldReturnToSong){appWrite("screen",SCR.PERFORM_SONG);}else{appWrite("screen",SCR.HOME);appWrite("tab",TAB.SONGS);}
    });
    render();return;
  }
  if(a==="performMode"){
    appWrite("performMode",v);appWrite("performInputSource",v);PerformanceInput.start(v);
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", { mode: v });
    }
    saveState();render();return;
  }
  if(a==="performDifficulty"){
    applyPerformanceDifficultyToState(v||"normal");
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", {
        difficulty: appRead("performDifficulty", "normal"),
        songIndex: window.sparkCore.getRuntimeState().performanceSongIndex,
        songTitle: window.sparkCore.getRuntimeState().performanceSongTitle
      });
    }
    saveState();render();return;
  }
  if(a==="performSpeed"){
    appWrite("performSpeed",parseFloat(v));PerformanceTransport.setSpeed(appRead("performSpeed", 1));
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", {
        speed: appRead("performSpeed", 1),
        songIndex: window.sparkCore.getRuntimeState().performanceSongIndex,
        songTitle: window.sparkCore.getRuntimeState().performanceSongTitle
      });
    }
    saveState();render();return;
  }
  if(a==="performLoopPhrase"){
    var ph=getPerformancePhraseForTime(appRead("performChart", null),appRead("performCurrentSec", 0));
    if(ph)setPerformanceLoop({startSec:ph.startSec,endSec:ph.endSec,phraseId:ph.id});
    return;
  }
  if(a==="performClearLoop"){clearPerformanceLoop();return;}
  if(a==="performPracticePreset"){
    applyPerformanceStemPreset(v);
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", { preset: appRead("performPracticePreset", null) });
    }
    render();return;
  }
  if(a==="performCalibrate"){startCalibration();return;}
  if(a==="performCalibrateTap"){recordCalibrationTap();return;}
  if(a==="performCalibrateCancel"){cancelCalibration();return;}
  if(a==="performRetry"){
    var retryRequest=getPerformanceRetryRequest({
      chartId: appRead("performChartId", "generated")
    });
    startPerformance(retryRequest.chartId,{
      difficulty:retryRequest.difficulty,
      speed:retryRequest.speed,
      preset:retryRequest.preset,
      mode:retryRequest.mode,
      targetTechnique: retryRequest.targetTechnique
    });return;
  }
  if(a==="performDebug"){appWrite("performDebug",!appRead("performDebug", false));render();return;}
  if(a==="performRetryPhrase"){
    var performChart=appRead("performChart", null);
    var performResults=appRead("performResults", null);
    if(performChart&&performResults&&performResults.phraseStats){
      var targetTechnique = null;
      if(window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"){
        var coreView = window.sparkCore.getActiveSessionView();
        if(coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceTargetTechnique")){
          targetTechnique = coreView.runtimeState.performanceTargetTechnique;
        }
      }
      if(!targetTechnique) targetTechnique = appRead("performTargetTechnique", null) || null;
      var candidateIndices = null;
      if(targetTechnique && typeof getPerformancePhraseIndicesForTechnique === "function"){
        candidateIndices = getPerformancePhraseIndicesForTechnique(performChart, targetTechnique);
        if(!candidateIndices || !candidateIndices.length) candidateIndices = null;
      }
      var weakIdx=candidateIndices && candidateIndices.length ? candidateIndices[0] : 0,weakAvg=Infinity;
      for(var wi=0;wi<performResults.phraseStats.length;wi++){
        if(candidateIndices && candidateIndices.indexOf(wi) === -1) continue;
        var wp=performResults.phraseStats[wi];
        var wa=wp.total>0?wp.scoreSum/wp.total:0;
        if(wa<weakAvg){weakAvg=wa;weakIdx=wi;}
      }
      var weakPhrase=performChart.phrases[weakIdx];
      if(weakPhrase){
        appWrite("performTargetPhrase",weakIdx);
        var retryPhraseRequest=getPerformanceRetryRequest({
          chart: performChart,
          chartId: appRead("performChartId", null) || (performChart && performChart.id) || "generated",
          targetPhraseIndex: weakIdx
        });
        startPerformance(retryPhraseRequest.chartId||retryPhraseRequest.chart,{
          mode:retryPhraseRequest.mode,
          difficulty:retryPhraseRequest.difficulty,
          speed:retryPhraseRequest.speed,
          targetTechnique: retryPhraseRequest.targetTechnique
        });
        // Set loop after start (chart needs to load first) - use setTimeout to let it resolve
        setTimeout(function(){
          var loadedChart=appRead("performChart", null);
          if(loadedChart&&loadedChart.phrases[weakIdx]){
            var ph=loadedChart.phrases[weakIdx];
            setPerformanceLoop({startSec:ph.startSec,endSec:ph.endSec,phraseId:ph.id});
            render();
          }
        },100);
      }
    }
    return;
  }
  if(a==="performDoneSongs"){
    applyPerformanceNavigationRequest("songs_home");
    act("tab","songs");
    return;
  }
  if(a==="guidedDoneHome"){
    applyGuidedNavigationRequest("guided_home");
    act("tab","practice");
    return;
  }
  if(a==="completePlanItem"){
    if(window.sparkCore){
      completeDailyPracticePlanRequest({ itemId: v });
    } else if(typeof markPracticePlanItem==="function"){
      markPracticePlanItem(v);
    }
    render();return;
  }
  if(a==="rhythmHighwayLane"){
    var laneMask=(1<<parseInt(v,10));
    var heldMask=appRead("rhythmHighwayHeldMask", 0);
    appWrite("rhythmHighwayHeldMask",(heldMask&laneMask)?(heldMask&~laneMask):(heldMask|laneMask));
    render();return;
  }
  if(a==="rhythmHighwayStrum"){
    if(typeof _sparkRhythmHighwayStrum==="function")_sparkRhythmHighwayStrum();
    render();return;
  }
  if(a==="rhythmHighwayLoopWindow"){
    var activeCoreSegmentId=appRead("activeCoreSegmentId", null);
    if(typeof _createRhythmHighwayLoopSpec==="function" && activeCoreSegmentId){
      var payload = typeof _resolveRhythmHighwayPayload==="function" ? _resolveRhythmHighwayPayload(activeCoreSegmentId) : null;
      var loopSpec = _createRhythmHighwayLoopSpec(payload, appRead("rhythmHighwaySnapshot", null));
      if(loopSpec && typeof startRhythmHighwaySegment==="function"){
        appWrite("rhythmHighwayLoop",loopSpec);
        startRhythmHighwaySegment(activeCoreSegmentId,appRead("rhythmHighwayPreset", "spark_learning"),loopSpec);
        return;
      }
    }
    render();return;
  }
  if(a==="rhythmHighwayClearLoop"){
    appWrite("rhythmHighwayLoop",null);
    var clearLoopSegmentId=appRead("activeCoreSegmentId", null);
    if(clearLoopSegmentId&&typeof startRhythmHighwaySegment==="function"){
      startRhythmHighwaySegment(clearLoopSegmentId,appRead("rhythmHighwayPreset", "spark_learning"),null);
      return;
    }
    render();return;
  }
  if(a==="restartRhythmHighway"){
    if(appRead("activeCoreSegmentId", null)&&typeof startRhythmHighwaySegment==="function")startRhythmHighwaySegment(appRead("activeCoreSegmentId", null),appRead("rhythmHighwayPreset", "spark_learning"),appRead("rhythmHighwayLoop", null));
    return;
  }
  // === MIDI Device/Profile Actions ===
  if(a==="setMidiDevice"){appWrite("activeMidiDeviceId",v);syncMidiSettingsStateRequest();saveState();render();return;}
  if(a==="setMidiProfile"){if(typeof setActiveMidiProfile==="function")setActiveMidiProfile(v);syncMidiSettingsStateRequest();render();return;}
  if(a==="createDefaultPianoProfile"){if(typeof createDefaultPianoProfile==="function")createDefaultPianoProfile();syncMidiSettingsStateRequest();render();return;}
  if(a==="createDefaultGuitarProfile"){if(typeof createDefaultGuitarProfile==="function")createDefaultGuitarProfile();syncMidiSettingsStateRequest();render();return;}
  if(a==="openMidiSettings"){
    openUtilityScreenRequest("midi_settings");
    syncMidiSettingsStateRequest();
    appWrite("screen",SCR.MIDI_SETTINGS);render();return;
  }
  // === MIDI Import Actions ===
  if(a==="openMidiImport"){
    openUtilityScreenRequest("midi_import");
    syncMidiImportStateRequest();
    appWrite("screen",SCR.MIDI_IMPORT);render();return;
  }
  if(a==="importMidiFile"){if(typeof handleMidiImport==="function")handleMidiImport(v);return;}
  if(a==="assignMidiTrack"){
    var parts=String(v).split("|");
    if(typeof setMidiTrackAssignment==="function")setMidiTrackAssignment(parts[0],parts[1]);
    syncMidiImportStateRequest();
    render();return;
  }
  if(a==="buildMidiSeedChart"){
    if(typeof buildSeedChartFromImportedMidi==="function"){
      var chart=buildSeedChartFromImportedMidi(appRead("importedMidi", null),appRead("importedMidiAssignments", null),v);
      appWrite("importedMidiSeedPreview",chart);
      syncMidiImportStateRequest({ seedMode: v, seedChart: chart });
      if(chart&&typeof openEditor==="function"){openEditor("chart",chart);render();}
      else{render();}
    }return;
  }
  // === Cloud Sync Actions ===
  if(a==="cloudSync"){appWrite("cloudLastError",null);applyCloudWorkflowRequest("sync_start",{lastSyncStatus:"syncing",lastError:null});if(typeof syncSparkNow==="function")syncSparkNow();return;}
  if(a==="cloudPull"){appWrite("cloudLastError",null);applyCloudWorkflowRequest("pull_start",{lastSyncStatus:"syncing",lastError:null});if(typeof pullSparkCloud==="function")pullSparkCloud();return;}
  if(a==="cloudLogout"){appWrite("cloudLastError",null);if(typeof logoutSpark==="function")logoutSpark();applyCloudWorkflowRequest("logout",{lastError:null});render();return;}
  if(a==="cloudLoginPrompt"){
    var email=prompt("Email:");
    var password=prompt("Password:");
    var loginError;
    if(!email||!password)return;
    appWrite("cloudLastError",null);
    if(typeof loginSpark!=="function"){
      loginError="Cloud login is unavailable right now.";
      appWrite("cloudLastError",loginError);
      applyCloudWorkflowRequest("login_error",{lastSyncStatus:"error",lastError:loginError});
      render();
      return;
    }
    loginSpark(email,password).then(function(){
      appWrite("cloudLastError",null);
      applyCloudWorkflowRequest("login",{lastError:null});
      render();
    }).catch(function(err){
      loginError=String((err&&err.message)||err||"Cloud login failed.");
      appWrite("cloudLastError",loginError);
      applyCloudWorkflowRequest("login_error",{lastSyncStatus:"error",lastError:loginError});
      render();
    });return;
  }
  if(a==="openCloudSettings"){openUtilityScreenRequest("cloud_settings");applyCloudWorkflowRequest("open");appWrite("screen",SCR.CLOUD_SETTINGS);render();return;}
  // === Desktop Actions ===
  if(a==="feedbackDraftText"){
    var feedbackDraft = appRead("feedbackDraft", {}) || {};
    feedbackDraft.text = String(v == null ? "" : v);
    appWrite("feedbackDraft", feedbackDraft);
    return;
  }
  if(a==="checkUpdates"){if(typeof checkForDesktopUpdates==="function")checkForDesktopUpdates();return;}
  if(a==="exportBackup"){if(typeof exportFullBackupDesktopAware==="function")exportFullBackupDesktopAware();return;}
  if(a==="exportFeedback"){if(typeof exportFeedbackDesktopAware==="function")exportFeedbackDesktopAware();return;}
  // === Curriculum ===
  if(a==="openCurriculum"){
    openUtilityScreenRequest("curriculum");
    syncCurriculumStateRequest();
    appApplyLegacyActivityRuntime({setFields:{screen:SCR.CURRICULUM}},function(){appWrite("screen",SCR.CURRICULUM);});
    render();return;
  }
  // === Back ===
  if(a==="back"){
      var currentScreen=appRead("screen", null);
      var currentTab=appRead("tab", null);
      var _dashboardBack = currentScreen===SCR.RECOMMENDATIONS||currentScreen===SCR.INSIGHTS||currentScreen===SCR.CHALLENGES||currentScreen===SCR.CAREER||currentScreen===SCR.HOME_DASH;
      var _utilityBack = currentScreen===SCR.SETTINGS||currentScreen===SCR.CLOUD_SETTINGS||currentScreen===SCR.CURRICULUM||currentScreen===SCR.MIDI_SETTINGS||currentScreen===SCR.MIDI_IMPORT;
      var _dailyBack = currentScreen===SCR.DAILY;
      if(currentScreen===SCR.SONG||currentScreen===SCR.SONG_DONE){
        applySongNavigationRequest("songs_home");
      }
      if(_dailyBack){
        returnFromLegacyDailyChallengeRequest({ activeTab: "daily" });
      }
      if(_utilityBack){
        returnFromUtilityFamilyRequest({
          currentScreen: currentScreen===SCR.SETTINGS ? "settings"
            : currentScreen===SCR.CLOUD_SETTINGS ? "cloud_settings"
            : currentScreen===SCR.CURRICULUM ? "curriculum"
            : currentScreen===SCR.MIDI_SETTINGS ? "midi_settings"
            : "midi_import"
        });
      }else if(!_dailyBack){
        returnFromHomeFamilyRequest({ currentScreen: _dashboardBack ? "home_dash" : "home" });
      }
      stopAllTimers();
      appApplyLegacyActivityRuntime({setFields:{selectedVoicing:0,screen:_dashboardBack?SCR.HOME_DASH:SCR.HOME,tab:_dailyBack?TAB.DAILY:currentTab}},function(){
        appWrite("selectedVoicing",0);appWrite("screen",_dashboardBack?SCR.HOME_DASH:SCR.HOME);
        if(_dailyBack)appWrite("tab",TAB.DAILY);
      });
      render();
    }
};

// ===== RENDER =====
function applyTheme(){
  // Dark is default; light mode is the override
  if(appRead("darkMode", false)){document.body.classList.remove("light");}
  else{document.body.classList.add("light");}
}

var _lastScreen="";
function render(){
  try{_renderInner();}catch(e){
    console.error("Render error:",e);
    document.getElementById("app").innerHTML='<div class="card" style="margin:20px;text-align:center"><h2>Something went wrong</h2><p style="color:var(--text-muted);margin:8px 0">'+escHTML(String(e.message||e))+'</p><button class="btn" onclick="location.reload()" style="background:#FF6B6B;color:#fff;margin-top:12px">Reload</button></div>';
  }
}
function _renderInner(){
  var app=document.getElementById("app");
  var coreSessionView=window.sparkCore&&typeof window.sparkCore.getActiveSessionView==="function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var playerSnapshot=coreSessionView&&coreSessionView.player?coreSessionView.player:null;

  // Launcher gate — if no instrument active, show clean launcher
  if (!appRead("activeInstrument", null)) {
    document.getElementById("header").style.display = "none";
    app.innerHTML = SparkInstruments.renderLauncher();
    return;
  }

  document.getElementById("header").style.display = "";
  var backBtn = document.getElementById("launcher-back");
  if (backBtn) backBtn.style.display = "";
  var logoText = document.querySelector(".logo-text");
  if (logoText) {
    var _inst = SparkInstruments.getActive();
    logoText.textContent = _inst ? _inst.name + "Spark" : "SparkSuite";
  }
  // Apply instrument theme (v2 neon system)
  if (typeof SparkTheme !== "undefined" && _inst) {
    SparkTheme.apply(_inst.instrument || "guitar");
  }

  document.getElementById("hdr-xp").textContent=playerSnapshot&&typeof playerSnapshot.xp==="number"?playerSnapshot.xp:appRead("xp",0);
  document.getElementById("hdr-str").textContent=playerSnapshot&&typeof playerSnapshot.streak==="number"?playerSnapshot.streak:appRead("streak",0);
  document.getElementById("snd-btn").textContent=appRead("soundOn", true)?"\uD83D\uDD0A":"\uD83D\uDD07";
  document.getElementById("snd-btn").style.opacity=appRead("soundOn", true)?1:0.4;
  document.getElementById("dark-btn").textContent=appRead("darkMode", false)?"\uD83C\uDF19":"\u2600\uFE0F";
  var h="";
  if(appRead("showConfetti", false)){
    // Use SparkConfetti if available (v2), else fall back to inline confetti
    if (typeof SparkConfetti !== "undefined") {
      if (!appRead("_confettiFired", false)) {
        appWrite("_confettiFired", true);
        SparkConfetti.burst();
        setTimeout(function() { appWrite("_confettiFired", false); }, 2600);
      }
    } else {
      var cols=["#FF6B6B","#4ECDC4","#45B7D1","#FFE66D","#96CEB4","#FF8A5C"];
      h+='<div style="position:fixed;inset:0;pointer-events:none;z-index:999">';
      for(var i=0;i<40;i++)
        h+='<div style="position:absolute;left:'+Math.random()*100+'%;top:-20px;width:10px;height:10px;border-radius:'+(Math.random()>0.5?"50%":"2px")+';background:'+cols[i%6]+';animation:cF '+(1.5+Math.random())+'s ease-in forwards;animation-delay:'+Math.random()*0.5+'s"></div>';
      h+='</div>';
    }
  }
  var renderNewBadge=appRead("newBadge", null);
  if(renderNewBadge)
    h+='<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:16px 32px;box-shadow:0 8px 30px rgba(255,138,92,.4);animation:sD .5s ease;text-align:center"><div style="font-size:32px">'+renderNewBadge.icon+'</div><div style="font-weight:800;font-size:16px;color:#333">'+renderNewBadge.label+'</div><div style="font-size:12px;color:#555">'+renderNewBadge.desc+'</div></div>';
  if(appRead("showUndoToast", false))
    h+='<div class="undo-toast"><span>Progress reset.</span><button onclick="act(\'undoReset\')">Undo</button><span class="countdown">'+appRead("undoTimer",0)+'</span></div>';
  // XP toast (jackpot gets special fire styling)
  var renderXpToast=appRead("xpToast", null);
  if(renderXpToast&&Date.now()-renderXpToast.time<1500){
    if(renderXpToast.jackpot)
      h+='<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:12px 28px;box-shadow:0 6px 24px rgba(255,138,92,.6);animation:sD .3s ease;font-weight:900;color:#fff;font-size:20px;text-align:center">&#127873; JACKPOT! +'+renderXpToast.amount+' XP!</div>';
    else
      h+='<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#4ECDC4,#45B7D1);border-radius:16px;padding:8px 20px;box-shadow:0 4px 15px rgba(78,205,196,.4);animation:sD .3s ease;font-weight:800;color:#fff;font-size:16px">+'+renderXpToast.amount+' XP!</div>';
  }
  // Micro-achievement toast
  var renderMicroToast=appRead("microToast", null);
  if(renderMicroToast&&Date.now()-renderMicroToast.time<2000)
    h+='<div style="position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:16px;padding:10px 24px;box-shadow:0 4px 15px rgba(255,138,92,.4);animation:sD .3s ease;text-align:center"><span style="font-size:20px;margin-right:6px">'+renderMicroToast.icon+'</span><span style="font-weight:800;color:#333;font-size:15px">'+renderMicroToast.msg+'</span></div>';
  // Break reminder
  var sessionStartTime=appRead("sessionStartTime", 0);
  var _contMin=(Date.now()-sessionStartTime)/60000;
  if(sessionStartTime>0&&_contMin>=20&&!appRead("breakDismissed", false))
    h+='<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#45B7D1,#4ECDC4);border-radius:16px;padding:12px 24px;box-shadow:0 4px 20px rgba(69,183,209,.4);animation:sD .5s ease;text-align:center;max-width:320px"><div style="font-size:20px;margin-bottom:4px">&#9749;</div><div style="font-weight:800;color:#fff;font-size:14px">Nice focus! Take a quick break?</div><div style="font-size:11px;color:rgba(255,255,255,.8);margin:4px 0">You\'ve been practicing for '+Math.floor(_contMin)+' min straight</div><button onclick="act(\'dismissBreak\')" style="margin-top:6px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:10px;padding:6px 16px;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Got it!</button></div>';
  // Shortcut overlay
  if(appRead("showShortcuts", false))h+=shortcutOverlay();

  // Onboarding overlay — shown once on first launch
  if(!appRead("onboardingDone", false) && !appRead("activeInstrument", null)){
    h+='<div style="position:fixed;inset:0;z-index:2000;background:var(--body-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;overflow:auto">';
    h+='<div style="font-size:56px;margin-bottom:12px">&#127930;</div>';
    h+='<h1 style="font-size:24px;font-weight:900;color:var(--text-primary);margin:0 0 8px">Welcome to SparkSuite!</h1>';
    h+='<p style="color:var(--text-dim);font-size:14px;margin:0 0 24px;max-width:300px">People who set a specific practice trigger are 2-3x more likely to follow through. Set yours now.</p>';
    h+='<div class="card" style="width:100%;max-width:340px;text-align:left;margin-bottom:20px">';
    h+='<p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0 0 8px">Complete this sentence:</p>';
    h+='<p style="font-size:14px;color:var(--text-muted);margin:0 0 8px">&#8220;Every day, when I&nbsp;&hellip;</p>';
    h+='<input type="text" id="intention-input" class="set-input" placeholder="finish dinner, make coffee..." value="'+escHTML(appRead("practiceIntention",""))+'" oninput="act(\'setIntention\',this.value)" style="margin-bottom:8px" aria-label="Practice trigger"/>';
    h+='<p style="font-size:14px;color:var(--text-muted);margin:0">&#8230;&nbsp;I will open SparkSuite.&#8221;</p>';
    h+='</div>';
    h+='<button class="btn" onclick="act(\'completeOnboarding\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:14px 40px;font-size:17px;font-weight:800">Let\'s Go!</button>';
    h+='<button onclick="act(\'completeOnboarding\')" style="margin-top:14px;background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer">Skip for now</button>';
    h+='</div>';
  }

  var renderScreen=appRead("screen", null);
  var renderTab=appRead("tab", null);
  var screenKey=String(renderScreen)+String(renderTab);
  var content="";

  // Shared page registry — instrument pages can override any of these
  var _sharedPages = {};
  _sharedPages[SCR.HOME] = typeof homePage === "function" ? homePage : null;
  _sharedPages[SCR.SESSION] = typeof sessionPage === "function" ? sessionPage : null;
  _sharedPages[SCR.COMPLETE] = typeof completePage === "function" ? completePage : null;
  _sharedPages[SCR.DRILL] = typeof drillPage === "function" ? drillPage : null;
  _sharedPages[SCR.DRILL_DONE] = typeof drillDonePage === "function" ? drillDonePage : null;
  _sharedPages[SCR.DAILY] = typeof dailyPage === "function" ? dailyPage : null;
  _sharedPages[SCR.QUIZ] = typeof quizPage === "function" ? quizPage : null;
  _sharedPages[SCR.STRUM] = typeof strumDetailPage === "function" ? strumDetailPage : null;
  _sharedPages[SCR.SONG] = typeof songDetailPage === "function" ? songDetailPage : null;
  _sharedPages[SCR.SONG_DONE] = typeof songDonePage === "function" ? songDonePage : null;
  _sharedPages[SCR.STEMS] = typeof stemsPage === "function" ? stemsPage : null;
  _sharedPages[SCR.GUIDED] = typeof guidedSessionPage === "function" ? guidedSessionPage : null;
  _sharedPages[SCR.GUIDED_DONE] = typeof guidedDonePage === "function" ? guidedDonePage : null;
  _sharedPages[SCR.PERFORM] = typeof performPage === "function" ? performPage : null;
  _sharedPages[SCR.PERFORM_DONE] = typeof performDonePage === "function" ? performDonePage : null;
  _sharedPages[SCR.RHYTHM_HIGHWAY] = typeof rhythmHighwayPage === "function" ? rhythmHighwayPage : null;
  _sharedPages[SCR.PERFORM_SONG] = typeof performSongPage === "function" ? performSongPage : null;
  _sharedPages[SCR.PERF_STATS] = typeof performanceStatsPage === "function" ? performanceStatsPage : null;
  _sharedPages[SCR.PERF_EDITOR] = typeof performanceEditorPage === "function" ? performanceEditorPage : null;
  _sharedPages[SCR.SKILL_TREE] = typeof skillTreePage === "function" ? skillTreePage : null;
  _sharedPages[SCR.PERFORM_CALIBRATE] = typeof performCalibrationPage === "function" ? performCalibrationPage : null;
  _sharedPages[SCR.PLAN] = typeof planPage === "function" ? planPage : null;
  _sharedPages[SCR.EDITOR] = typeof editorPage === "function" ? editorPage : null;
  _sharedPages[SCR.RECOMMENDATIONS] = typeof recommendationsPage === "function" ? recommendationsPage : null;
  _sharedPages[SCR.CAREER] = typeof careerPage === "function" ? careerPage : null;
  _sharedPages[SCR.INSIGHTS] = typeof insightsDashboardPage === "function" ? insightsDashboardPage : null;
  _sharedPages[SCR.CHALLENGES] = typeof challengeHubPage === "function" ? challengeHubPage : null;
  _sharedPages[SCR.HOME_DASH] = typeof homeDashboardPage === "function" ? homeDashboardPage : null;
  _sharedPages[SCR.SETTINGS] = typeof settingsPage === "function" ? settingsPage : null;
  _sharedPages[SCR.ONBOARDING] = typeof onboardingPage === "function" ? onboardingPage : null;
  _sharedPages[SCR.MIDI_SETTINGS] = typeof midiSettingsPage === "function" ? midiSettingsPage : null;
  _sharedPages[SCR.MIDI_IMPORT] = typeof midiImportPage === "function" ? midiImportPage : null;
  _sharedPages[SCR.CLOUD_SETTINGS] = typeof cloudSettingsPage === "function" ? cloudSettingsPage : null;
  _sharedPages[SCR.CURRICULUM] = typeof curriculumPage === "function" ? curriculumPage : null;
  _sharedPages[SCR.PROGRESS] = typeof progressDashboardPage === "function" ? progressDashboardPage : null;
  _sharedPages[SCR.PLAY_ALONG] = typeof playAlongPage === "function" ? playAlongPage : null;
  _sharedPages[SCR.PLAY_ALONG_SESSION] = typeof playAlongSessionPage === "function" ? playAlongSessionPage : null;
  _sharedPages[SCR.PLAY_ALONG_RESULTS] = typeof playAlongResultsPage === "function" ? playAlongResultsPage : null;

  // Instrument override: if active instrument provides a page for this screen, use it
  var _instrumentPage = SparkInstruments.getPage(renderScreen);
  var _renderer = _instrumentPage || _sharedPages[renderScreen] || null;
  if (_renderer) {
    content = _renderer();
  }

  if(screenKey!==_lastScreen){
    h+='<div class="page-transition">'+content+'</div>';
    _lastScreen=screenKey;
  }else{
    h+=content;
  }
  app.innerHTML=h;
  // Focus management for modal overlays
  if(appRead("showShortcuts", false)){var cb=document.getElementById("shortcut-close-btn");if(cb)cb.focus();}
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown",function(e){
  // Ignore when typing in inputs
  var tag=document.activeElement&&document.activeElement.tagName;
  if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;

  var key=e.key;

  // ? - toggle shortcut help
  if(key==="?"){e.preventDefault();act("toggleShortcuts");return;}

  // Escape - close overlay or go back
  if(key==="Escape"){
    if(appRead("showShortcuts", false)){appWrite("showShortcuts",false);render();return;}
    if(appRead("screen", null)!==SCR.HOME){act("back");}
    return;
  }

  // Space - pause/resume
  if(key===" "){
    e.preventDefault();
    var keyScreen=appRead("screen", null);
    var keyTab=appRead("tab", null);
    if(keyScreen===SCR.RHYTHM_HIGHWAY){act("rhythmHighwayStrum");return;}
    if(keyScreen===SCR.SESSION){act("toggleTimer");return;}
    if(keyScreen===SCR.STRUM){act("toggleStrum");return;}
    if(keyScreen===SCR.SONG){act("toggleSong");return;}
    if(keyScreen===SCR.PERFORM){
      if(appRead("performPaused", false)){act("resumePerform");return;}
      // Spacebar = simulate strum hit (injects the exact target notes the scorer expects)
      var performChart=appRead("performChart", null);
      if(appRead("performPlaying", false) && performChart){
        var nowSec=PerformanceTransport.now();
        var chart=performChart;
        for(var si=0;si<chart.events.length;si++){
          var evt=chart.events[si];
          if(evt._scored)continue;
          var delta=Math.abs(nowSec-evt.t)*1000;
          if(delta<(appRead("performWindowMissMs",220)||220)){
            // Use the exact same notes the scorer checks: event.notes
            var tn=evt.notes;
            if(!tn||!tn.length){
              // Try CHORD_NOTES lookup
              if(evt.chord&&typeof CHORD_NOTES!=="undefined"&&CHORD_NOTES[evt.chord]){
                tn=CHORD_NOTES[evt.chord];
              }
            }
            if(!tn||!tn.length) tn=["C","E","G"];
            PerformanceInput.latestPitchClasses=tn.slice();
            // Also inject a fake MIDI attack so cluster-based scoring works
            PerformanceInput.recentMidiNoteOns.push({note:60,tSec:nowSec});
            break;
          }
        }
      }
      return;
    }
    if(keyScreen===SCR.HOME&&keyTab===TAB.RHYTHM&&appRead("rhythmActive", false)){act("rhythmTap");return;}
    if(keyScreen===SCR.HOME&&keyTab===TAB.RUNNER&&appRead("runnerActive", false)){act("runnerStrum");return;}
    if(keyScreen===SCR.HOME&&keyTab===TAB.BUILD&&(appRead("progChords", []).length>=2)){act("progPlay");return;}
    return;
  }

  // Enter - context-sensitive confirm
  if(key==="Enter"){
    var enterScreen=appRead("screen", null);
    if(enterScreen===SCR.RHYTHM_HIGHWAY){act("rhythmHighwayStrum");return;}
    if(enterScreen===SCR.DRILL){act("drillSwitch");return;}
    return;
  }

  if(appRead("screen", null)===SCR.RHYTHM_HIGHWAY&&key>="1"&&key<="5"){
    act("rhythmHighwayLane", String(parseInt(key,10)-1));
    return;
  }

  // Arrow keys - BPM adjustment
  if(key==="ArrowLeft"||key==="ArrowRight"){
    var delta=key==="ArrowRight"?5:-5;
    var arrowScreen=appRead("screen", null);
    var arrowTab=appRead("tab", null);
    if(arrowScreen===SCR.SESSION&&appRead("metronomeOn", false)){act("metroBpm",""+(appRead("metronomeBpm", 0)+delta));return;}
    if(arrowScreen===SCR.HOME&&arrowTab===TAB.RHYTHM&&!appRead("rhythmActive", false)){act("rhythmBpm",""+(appRead("rhythmBpm", 0)+(delta>0?10:-10)));return;}
    if(arrowScreen===SCR.HOME&&arrowTab===TAB.BUILD){act("progBpm",""+(appRead("progBpm", 0)+delta));return;}
    return;
  }

  // Up/Down - level navigation
  if(key==="ArrowUp"||key==="ArrowDown"){
    if(appRead("screen", null)===SCR.HOME&&appRead("tab", null)===TAB.PRACTICE){
      var nl=appRead("selectedLevel", 1)+(key==="ArrowUp"?-1:1);
      if(nl>=1&&nl<=appRead("level", 1)){act("selLevel",""+nl);}
      return;
    }
    return;
  }

  // Perform mode shortcuts
  var performShortcutScreen=appRead("screen", null);
  if(performShortcutScreen===SCR.PERFORM||performShortcutScreen===SCR.PERFORM_DONE){
    if(key==="l"||key==="L"){act("performLoopPhrase");return;}
    if(key==="c"||key==="C"){act("performClearLoop");return;}
    if(key==="r"||key==="R"){act("performRetry");return;}
    if(key==="1"){act("performSpeed",0.5);return;}
    if(key==="2"){act("performSpeed",0.75);return;}
    if(key==="3"){act("performSpeed",1);return;}
    if(key==="4"){act("performSpeed",1.25);return;}
    if(key==="m"||key==="M"){act("performMode","midi");return;}
    if(key==="n"||key==="N"){act("performMode","mic");return;}
    if(key==="p"||key==="P"){act("performRetryPhrase");return;}
    if(key==="Escape"){act("stopPerform");return;}
    if(key==="d"||key==="D"){act("performDebug");return;}
  }

  // M - toggle metronome
  if(key==="m"||key==="M"){
    if(appRead("screen", null)===SCR.SESSION){act("toggleMetro");return;}
    return;
  }

  // S - toggle sound (shift+S to avoid conflict)
  if(key==="S"){
    appWrite("soundOn",!appRead("soundOn", true));saveState();render();return;
  }

  // D - toggle dark mode
  if(key==="d"||key==="D"){
    act("toggleDark");return;
  }

  // Number keys 1-9 for quick tab switching
  if(key>="1"&&key<="9"&&appRead("screen", null)===SCR.HOME){
    var tabList=[TAB.PRACTICE,TAB.DRILL,TAB.DAILY,TAB.QUIZ,TAB.EAR,TAB.STRUM,TAB.SONGS,TAB.RHYTHM,TAB.BUILD];
    var idx=parseInt(key)-1;
    if(idx<tabList.length){act("tab",tabList[idx]);}
    return;
  }
  // 0 for stats, - for tuner, = for guide
  if(key==="0"&&appRead("screen", null)===SCR.HOME){act("tab",TAB.STATS);return;}
});

// ===== INITIALIZATION =====
appWrite("dailyChallenge",DAILY_CHALLENGES[Math.floor(Date.now()/86400000)%DAILY_CHALLENGES.length]);
try{if(typeof generatePracticePlan==="function")generatePracticePlan();}catch(e){}
applyTheme();
// Init MIDI if previously enabled
if(appRead("midiEnabled", false)){try{initMIDI();}catch(e){console.error("ChordSpark: MIDI init failed",e);}}
// Preload guitar WAV samples
try{preloadGuitarAudio();}catch(e){console.error("ChordSpark: guitar audio preload failed",e);}
document.getElementById("no-js").style.display="none";
var persistedActiveInstrument=normalizeActiveInstrumentId(appRead("activeInstrument", null));
if(persistedActiveInstrument!==appRead("activeInstrument", null))appWrite("activeInstrument", persistedActiveInstrument);
document.getElementById("header").style.display=persistedActiveInstrument?"flex":"none";
document.getElementById("app").style.display="block";
// Activate remembered instrument
if(persistedActiveInstrument){try{SparkInstruments.activate(persistedActiveInstrument);}catch(e){console.error("SparkSuite: instrument activate failed",e);}}
try{if(typeof choosePerformanceDailyChallenge==="function")choosePerformanceDailyChallenge();}catch(e){}
// render() moved to index.html after all instrument pages register
