// ===== TIMERS =====
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
    if(window.sparkCore && typeof window.sparkCore.completeLegacyPracticeSession === "function"){
      window.sparkCore.completeLegacyPracticeSession({
        mode: S.lastChordName ? "chord" : "quickStart",
        chordName: S.currentChord ? S.currentChord.name : null,
        durationSec: 120
      });
    }
    // Delegate all completion logic to SparkSession
    var outcome=SparkSession.processResults({
      type:"session",
      chordName:S.currentChord?S.currentChord.name:null,
      duration:120
    });
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
    if(window.sparkCore && typeof window.sparkCore.completeLegacyPracticeDrill === "function"){
      window.sparkCore.completeLegacyPracticeDrill({
        durationSec: 60,
        chordNames: S.drillChords.map(function(c){return c.name;})
      });
    }
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:20,
        toastAmount:20,
        incrementFields:{drillCount:1},
        history:{type:"drill",detail:detail,xp:20},
        emit:{type:"practice_session_completed",payload:{ appId: "chordspark", type: "drill", xp: 20, detail: detail }},
        checkBadges:true
      });
    }else{
      S.drillCount++;if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:20,toastAmount:20});else{S.xp+=20;S.xpToast={amount:20,time:Date.now()};}
      logHistory("drill",detail,20);
      _sparkEmit("practice_session_completed", { appId: "chordspark", type: "drill", xp: 20, detail: detail });
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
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
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
  S.quizQ=q;S.quizOpts=opts;S.quizAns=null;render();
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
  var xp=Math.round(S.rhythmScore/10);
  if(xp>0){
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
  var xp=Math.round(S.runnerScore/20);
  if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
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

// ===== COMMUNITY API =====
var COMMUNITY_URL="https://localhost:3456";
if(!COMMUNITY_URL.startsWith("https")&&COMMUNITY_URL.indexOf("localhost")===-1&&COMMUNITY_URL.indexOf("127.0.0.1")===-1)
  console.warn("ChordSpark: Community URL should use HTTPS for non-local servers");

function fetchCommunity(){
  S.communityLoading=true;S.communityError=null;render();
  var url=COMMUNITY_URL+"/api/songs";
  if(S.communitySearch)url+="?q="+encodeURIComponent(S.communitySearch)+"&sort="+S.communitySort;
  else url+="?sort="+S.communitySort;
  fetch(url).then(function(r){return r.json();}).then(function(data){
    S.communitySongs=data;S.communityLoading=false;render();
  }).catch(function(){
    S.communityError="Could not connect to community server";S.communityLoading=false;render();
  });
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
  clearInterval(T.strum);clearInterval(T.song);clearInterval(T.metro);clearInterval(T.prog);
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
    : (selectedEvent ? selectedEvent.id : (S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null));
  var selectedPhraseId = Object.prototype.hasOwnProperty.call(options, "selectedPhraseId")
    ? options.selectedPhraseId
    : (selectedPhrase ? selectedPhrase.id : null);

  window.sparkCore.syncPerformanceRuntimeState(options.action || "configure_editor", {
    mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : S.performEditorMode,
    snap: Object.prototype.hasOwnProperty.call(options, "snap") ? options.snap : S.performEditorSnap,
    chartId: chart && chart.id ? chart.id : null,
    chartTitle: chart && chart.title ? chart.title : null,
    source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : (chart ? "existing" : "blank"),
    dirty: Object.prototype.hasOwnProperty.call(options, "dirty") ? !!options.dirty : !!S.performEditorDirty,
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
  S.performEditorLibrary = nextLibrary;
  return nextLibrary;
}

function getPerformanceEditorExportData() {
  if (window.sparkCore && typeof window.sparkCore.getPerformanceEditorExportData === "function") {
    return window.sparkCore.getPerformanceEditorExportData();
  }
  if (!S.performEditorChart) return { chart: null, json: "", fileName: "chart.json" };
  return {
    chart: S.performEditorChart,
    json: JSON.stringify(S.performEditorChart, null, 2),
    fileName: (S.performEditorChart.title || "chart").replace(/\s+/g, "_") + ".json"
  };
}

function getPerformanceEditorPreviewChart() {
  if (window.sparkCore && typeof window.sparkCore.getPerformanceEditorPreviewChart === "function") {
    return window.sparkCore.getPerformanceEditorPreviewChart();
  }
  return S.performEditorChart || null;
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
    arrangementType: chart.arrangementType || S.performArrangementType || "chords",
    difficulty: S.performDifficulty || "normal",
    speed: S.performSpeed || 1,
    mode: S.performMode || "midi",
    preset: S.performPracticePreset || null
  };
}

function getPerformanceRetryRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.startPerformanceRetrySession === "function") {
    return window.sparkCore.startPerformanceRetrySession(options || {});
  }
  options = options || {};
  return {
    chart: Object.prototype.hasOwnProperty.call(options, "chart") ? options.chart : null,
    chartId: Object.prototype.hasOwnProperty.call(options, "chartId") ? options.chartId : (S.performChartId || "generated"),
    arrangementType: Object.prototype.hasOwnProperty.call(options, "arrangementType") ? options.arrangementType : S.performArrangementType,
    difficulty: Object.prototype.hasOwnProperty.call(options, "difficulty") ? options.difficulty : S.performDifficulty,
    speed: Object.prototype.hasOwnProperty.call(options, "speed") ? options.speed : S.performSpeed,
    mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : S.performMode,
    preset: Object.prototype.hasOwnProperty.call(options, "preset") ? options.preset : S.performPracticePreset,
    countIn: Object.prototype.hasOwnProperty.call(options, "countIn") ? !!options.countIn : !!S.performCountIn,
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
      source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : (S.performCalibrationSource || "midi"),
      appliedOffsetMs: Object.prototype.hasOwnProperty.call(options, "appliedOffsetMs") ? options.appliedOffsetMs : null,
      globalOffsetMs: Object.prototype.hasOwnProperty.call(options, "globalOffsetMs") ? options.globalOffsetMs : (S.performTimingOffsetMs || 0),
      midiOffsetMs: Object.prototype.hasOwnProperty.call(options, "midiOffsetMs") ? options.midiOffsetMs : (S.performMidiOffsetMs || 0),
      micOffsetMs: Object.prototype.hasOwnProperty.call(options, "micOffsetMs") ? options.micOffsetMs : (S.performMicOffsetMs || 0)
    });
  }
  return options;
}

function applyPerformanceNavigationRequest(target, options) {
  if (window.sparkCore && typeof window.sparkCore.applyPerformanceNavigationRequest === "function") {
    return window.sparkCore.applyPerformanceNavigationRequest(target, options || {});
  }
  return null;
}

function openPerformanceStatsRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceStats === "function") {
    return window.sparkCore.openPerformanceStats(options || {});
  }
  return null;
}

function openPerformanceEditorRequest(chart, options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceEditor === "function") {
    return window.sparkCore.openPerformanceEditor(chart || null, options || {});
  }
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
  return null;
}

function openLegacyPracticeDrillRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyPracticeDrill === "function") {
    return window.sparkCore.openLegacyPracticeDrill(options || {});
  }
  return null;
}

function syncLegacyPracticeRuntimeRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyPracticeRuntimeState === "function") {
    return window.sparkCore.syncLegacyPracticeRuntimeState(action, options || {});
  }
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
  return null;
}

function syncLegacyDailyRuntimeRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyDailyRuntimeState === "function") {
    return window.sparkCore.syncLegacyDailyRuntimeState(action, options || {});
  }
  return null;
}

function completeLegacyDailyChallengeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeLegacyDailyChallenge === "function") {
    return window.sparkCore.completeLegacyDailyChallenge(options || {});
  }
  return null;
}

function openLegacyRunnerGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyRunnerGame === "function") {
    return window.sparkCore.openLegacyRunnerGame(options || {});
  }
  return null;
}

function syncLegacyRunnerRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyRunnerRuntimeState === "function") {
    return window.sparkCore.syncLegacyRunnerRuntimeState(options || {});
  }
  return null;
}

function completeLegacyRunnerGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeLegacyRunnerGame === "function") {
    return window.sparkCore.completeLegacyRunnerGame(options || {});
  }
  return null;
}

function syncTunerRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncTunerRuntimeState === "function") {
    return window.sparkCore.syncTunerRuntimeState(options || {});
  }
  return null;
}

function syncAudioInputRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncAudioInputRuntimeState === "function") {
    return window.sparkCore.syncAudioInputRuntimeState(options || {});
  }
  return null;
}

function syncMetronomeRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncMetronomeRuntimeState === "function") {
    return window.sparkCore.syncMetronomeRuntimeState(options || {});
  }
  return null;
}

function openLegacyRhythmGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openLegacyRhythmGame === "function") {
    return window.sparkCore.openLegacyRhythmGame(options || {});
  }
  return null;
}

function syncLegacyRhythmRuntimeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncLegacyRhythmRuntimeState === "function") {
    return window.sparkCore.syncLegacyRhythmRuntimeState(options || {});
  }
  return null;
}

function completeLegacyRhythmGameRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeLegacyRhythmGame === "function") {
    return window.sparkCore.completeLegacyRhythmGame(options || {});
  }
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
  return null;
}

function openCareerSongSelectionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openCareerSongSelection === "function") {
    return window.sparkCore.openCareerSongSelection(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.openPerformanceSongSelection === "function") {
    return window.sparkCore.openPerformanceSongSelection(options || {});
  }
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
      songsSubTab: Object.prototype.hasOwnProperty.call(options, "songsSubTab") ? options.songsSubTab : S.songsSubTab,
      songFilter: Object.prototype.hasOwnProperty.call(options, "songFilter") ? options.songFilter : S.songFilter,
      songSort: Object.prototype.hasOwnProperty.call(options, "songSort") ? options.songSort : S.songSort,
      songSortAsc: Object.prototype.hasOwnProperty.call(options, "songSortAsc") ? !!options.songSortAsc : !!S.songSortAsc,
      communityTab: Object.prototype.hasOwnProperty.call(options, "communityTab") ? options.communityTab : S.communityTab,
      communitySearch: Object.prototype.hasOwnProperty.call(options, "communitySearch") ? options.communitySearch : S.communitySearch,
      communitySort: Object.prototype.hasOwnProperty.call(options, "communitySort") ? options.communitySort : S.communitySort
    });
  }
  return null;
}

function applyDashboardRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardRequest === "function") {
    return window.sparkCore.applyDashboardRequest(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      dashboardRecommendations: Object.prototype.hasOwnProperty.call(options, "recommendations") ? options.recommendations : (S.recommendations || []),
      dashboardInsights: Object.prototype.hasOwnProperty.call(options, "insights") ? options.insights : (S.personalInsights || null),
      dashboardChallenges: Object.prototype.hasOwnProperty.call(options, "challenges") ? options.challenges : (S.activeChallenges || []),
      lastDashboardRefreshAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt") ? options.refreshedAt : Date.now()
    });
  }
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
      activeTab: S.tab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function openUtilityScreenRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.openUtilityScreen === "function") {
    return window.sparkCore.openUtilityScreen(target);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: target || "home",
      activeTab: S.tab || null
    });
  }
  return null;
}

function syncSettingsStateRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncSettingsState === "function") {
    return window.sparkCore.syncSettingsState(options || {});
  }
  return null;
}

function buildMidiSettingsRuntimePayload() {
  var activeDevice = typeof getActiveMidiDevice === "function" ? getActiveMidiDevice() : null;
  var activeProfile = typeof getActiveMidiProfile === "function" ? getActiveMidiProfile() : null;
  var profileIds = S.midiProfiles ? Object.keys(S.midiProfiles) : [];
  var profileOptions = [];
  var i;
  for (i = 0; i < profileIds.length; i++) {
    var id = profileIds[i];
    var profile = S.midiProfiles[id];
    if (!profile) continue;
    profileOptions.push({
      id: id,
      name: profile.name || "Unnamed Profile",
      type: profile.type || "default"
    });
  }
  return {
    midiEnabled: !!S.midiEnabled,
    activeDeviceId: S.activeMidiDeviceId || null,
    activeDeviceName: activeDevice ? (activeDevice.name || null) : null,
    activeProfileId: S.activeMidiProfileId || null,
    activeProfileName: activeProfile ? (activeProfile.name || null) : null,
    deviceOptions: Array.isArray(S.midiDevices) ? S.midiDevices.map(function(device) {
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
  return null;
}

function buildCloudSettingsRuntimePayload() {
  return {
    loggedIn: !!(S.cloudAuth && S.cloudAuth.loggedIn && S.cloudAuth.token),
    email: S.cloudAuth ? (S.cloudAuth.email || null) : null,
    lastSyncStatus: S.cloudSync ? (S.cloudSync.lastSyncStatus || "idle") : "idle",
    lastSyncAt: S.cloudSync ? (S.cloudSync.lastSyncAt || null) : null
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
  return null;
}

function buildMidiImportRuntimePayload(options) {
  var normalizedMidi = (options && Object.prototype.hasOwnProperty.call(options, "normalizedMidi"))
    ? options.normalizedMidi
    : S.importedMidi;
  var assignments = (options && Object.prototype.hasOwnProperty.call(options, "assignments"))
    ? options.assignments
    : S.importedMidiAssignments;
  var seedChart = (options && Object.prototype.hasOwnProperty.call(options, "seedChart"))
    ? options.seedChart
    : S.importedMidiSeedPreview;
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
  return null;
}

function openSkillTreeRequest() {
  if (window.sparkCore && typeof window.sparkCore.openSkillTree === "function") {
    return window.sparkCore.openSkillTree();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: S.tab || null
    });
  }
  return null;
}

function setSkillTreeFocusRequest(focus) {
  if (window.sparkCore && typeof window.sparkCore.setSkillTreeFocus === "function") {
    return window.sparkCore.setSkillTreeFocus(focus);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: S.tab || null,
      skillTreeFocus: focus || "overview"
    });
  }
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
  return null;
}

function returnFromUtilityFamilyRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.returnFromUtilityFamily === "function") {
    return window.sparkCore.returnFromUtilityFamily(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: S.tab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function applyDashboardChallengeRewardRequest(challengeId) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardChallengeReward === "function") {
    return window.sparkCore.applyDashboardChallengeReward(challengeId);
  }
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
  return null;
}

// ===== ACTION DISPATCHER =====
window.act=function(a,v){
  // Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;
  if(a==="tab"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{tab:v,screen:SCR.HOME,earTrainQ:null,earTrainAns:null,selectedVoicing:0}
      });
    }else{
      S.tab=v;S.screen=SCR.HOME;
      S.earTrainQ=null;S.earTrainAns=null;S.selectedVoicing=0;
    }
    if(window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function"){
      window.sparkCore.updateRuntimeState({
        activeScreen: "home",
        activeTab: v || null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    stopAllTimers();
    if(v===TAB.SONGS&&S.songsSubTab==="community")fetchCommunity();
    render();return;
  }
  if(a==="selLevel"&&parseInt(v)<=S.level){S.selectedLevel=parseInt(v);render();return;}
  if(a==="toggleTimer"){
    S.timerActive=!S.timerActive;
    syncLegacyPracticeRuntimeRequest(S.timerActive ? "resume" : "pause", {
      remainingSec: S.timer,
      timerActive: S.timerActive,
      mode: S.lastChordName ? "chord" : "quickStart",
      chordName: S.currentChord ? S.currentChord.name : null,
      durationSec: 120
    });
    if(S.timerActive)T.session=setTimeout(tickS,1000);else clearTimeout(T.session);
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
  if(a==="doneSession"){
    clearTimeout(T.session);if(S.metronomeOn)stopMetronome();if(S.chordDetectOn)stopChordDetect();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{timerActive:true,timer:0}
      });
    }else{
      S.timerActive=true;S.timer=0;
    }
    syncLegacyPracticeRuntimeRequest("set_remaining", {
      remainingSec: 0,
      timerActive: true,
      mode: S.lastChordName ? "chord" : "quickStart",
      chordName: S.currentChord ? S.currentChord.name : null,
      durationSec: 120
    });
    tickS();return;
  }
  if(a==="startDaily"&&S.dailyChallenge){
    var t=S.dailyChallenge.id==="hold"?30:S.dailyChallenge.id==="marathon"?180:60;
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{dailyTimer:t,dailyComplete:false,screen:SCR.DAILY}
      });
    }else{
      S.dailyTimer=t;S.dailyComplete=false;S.screen=SCR.DAILY;
    }
    openLegacyDailyChallengeRequest({
      challengeId: S.dailyChallenge.id,
      durationSec: t
    });
    snd("start");render();T.daily=setTimeout(tickDy,1000);return;
  }
  if(a==="completeDaily"){
    clearTimeout(T.daily);snd("complete");
    var xp=(S.dailyChallenge&&S.dailyChallenge.xp)||40;
    completeLegacyDailyChallengeRequest({
      challengeId: S.dailyChallenge ? S.dailyChallenge.id : null,
      durationSec: S.dailyChallenge && S.dailyChallenge.id === "hold" ? 30 : S.dailyChallenge && S.dailyChallenge.id === "marathon" ? 180 : 60
    });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:xp,
        setFlags:{dailyComplete:true},
        incrementFields:{dailyDone:1},
        history:{type:"daily",detail:S.dailyChallenge?S.dailyChallenge.title:"Challenge",xp:xp},
        checkBadges:true
      });
    }else{
      S.dailyComplete=true;S.dailyDone++;
      if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:xp});else S.xp+=xp;
      logHistory("daily",S.dailyChallenge?S.dailyChallenge.title:"Challenge",xp);
      checkBadges();saveState();
    }
    trigC();render();return;
  }
  if(a==="dailyDoneHome"){
    returnFromLegacyDailyChallengeRequest({ activeTab: "daily" });
    act("tab","daily");
    return;
  }
  if(a==="replayEarTrain"&&S.earTrainQ){strumChord(S.earTrainQ);return;}
  if(a==="answerEarTrain"&&S.earTrainAns===null){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{earTrainAns:v},
        incrementFields:{earTrainTotal:1}
      });
    }else{
      S.earTrainAns=v;
      S.earTrainTotal++;
    }
    var ok=v===S.earTrainQ;
    if(ok){
      snd("correct");
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
        SparkProgressBridge.applyLegacyActivityCompletion({
          xpDelta:15,
          incrementFields:{earTrainScore:1,earTrainStreak:1},
          history:{type:"ear",detail:S.earTrainQ,xp:15},
          checkBadges:true
        });
      }else{
        S.earTrainScore++;S.earTrainStreak++;
        if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:15});else S.xp+=15;logHistory("ear",S.earTrainQ,15);checkBadges();saveState();
      }
    }
    else{
      snd("wrong");
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields:{earTrainStreak:0}
        });
      }else{
        S.earTrainStreak=0;
      }
    }
    render();
    setTimeout(function(){act("startEarTrain");},1500);
    return;
  }
  // === Sound Preview ===
  if(a==="previewChord"){strumChord(v);return;}
  // === Voicings ===
  if(a==="selectVoicing"){_prevChordKey=S.currentChord?S.currentChord.name+"_v"+S.selectedVoicing:"";S.selectedVoicing=parseInt(v);render();return;}
  // === Strum ===
  if(a==="openStrum"){
    var sp;for(var i=0;i<STRUM_PATTERNS.length;i++)if(STRUM_PATTERNS[i].name===v)sp=STRUM_PATTERNS[i];
    if(sp&&sp.level<=S.level){
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields:{selectedStrum:sp,strumActive:false,_strumBeat:-1,screen:SCR.STRUM},
          clearIntervals:["strum"]
        });
      }else{
        S.selectedStrum=sp;S.strumActive=false;S._strumBeat=-1;clearInterval(T.strum);S.screen=SCR.STRUM;
      }
      render();
    }return;
  }
  if(a==="toggleStrum"){
    snd("click");
    var nextStrumActive=!S.strumActive;
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:nextStrumActive?{strumActive:true,_strumBeat:0}:{strumActive:false,_strumBeat:-1},
        clearIntervals:nextStrumActive?[]:["strum"]
      });
    }else{
      S.strumActive=nextStrumActive;
      if(!S.strumActive){clearInterval(T.strum);S._strumBeat=-1;}
    }
    if(S.strumActive){
      var p=S.selectedStrum.pattern,ms=60000/S.selectedStrum.bpm/(p.length>4?2:1);
      var _strumChordName=S.currentChord?S.currentChord.name:"E Major";
      if(p[0]!=="x")strumChord(_strumChordName);render();
      T.strum=setInterval(function(){S._strumBeat=(S._strumBeat+1)%p.length;if(p[S._strumBeat]!=="x")strumChord(_strumChordName);render();},ms);
    }else{clearInterval(T.strum);S._strumBeat=-1;render();}return;
  }
  // === Songs ===
  if(a==="songsSubTab"){
    S.songsSubTab=v;
    applySongBrowserRequest("songs_subtab", { songsSubTab: S.songsSubTab });
    if(v==="community")fetchCommunity();
    render();return;
  }
  if(a==="toggleSong"){
    snd("click");
    var nextSongPlaying=!S.songPlaying;
    syncSongRuntimeRequest(nextSongPlaying ? "play" : "pause", {
      songData: S.selectedSong,
      source: window.sparkCore && window.sparkCore.getRuntimeState ? window.sparkCore.getRuntimeState().songSessionSource : "builtin",
      songBeat: nextSongPlaying ? 0 : S.songBeat
    });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:nextSongPlaying?{songPlaying:true,songBeat:0}:{songPlaying:false},
        clearIntervals:nextSongPlaying?[]:["song"]
      });
    }else{
      S.songPlaying=nextSongPlaying;
      if(S.songPlaying)S.songBeat=0;
      else clearInterval(T.song);
    }
    if(S.songPlaying){
      var ms=60000/S.selectedSong.bpm;
      var cn=S.selectedSong.progression[0];strumChord(CHORD_NAME_MAP[cn]||cn);
      render();
      T.song=setInterval(function(){
        S.songBeat=(S.songBeat+1)%S.selectedSong.progression.length;
        syncSongRuntimeRequest("tick", { songBeat: S.songBeat });
        var cn=S.selectedSong.progression[S.songBeat];strumChord(CHORD_NAME_MAP[cn]||cn);render();
      },ms);
    }else{render();}return;
  }
  if(a==="completeSong"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{songPlaying:false},
        clearIntervals:["song"]
      });
    }else{
      S.songPlaying=false;clearInterval(T.song);
    }
    snd("complete");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:40,
        incrementFields:{songsPlayed:1},
        history:{type:"song",detail:S.selectedSong?S.selectedSong.title:"Song",xp:40},
        emit:{type:"lesson_completed",payload:{ appId: "chordspark", lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 }},
        checkBadges:true
      });
    }else{
      S.songsPlayed++;if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:40});else S.xp+=40;
      logHistory("song",S.selectedSong?S.selectedSong.title:"Song",40);
      _sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 });
      checkBadges();saveState();
    }
    completeSongSessionRequest({
      songData: S.selectedSong,
      source: window.sparkCore && window.sparkCore.getRuntimeState ? window.sparkCore.getRuntimeState().songSessionSource : "builtin",
      songBeat: S.songBeat
    });
    fireMicro("full_song","Rockstar!","&#127908;");
    trigC();S.screen=SCR.SONG_DONE;render();return;
  }
  if(a==="songBack"){
    applySongNavigationRequest("songs_home");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}});
    }else{
      S.screen=SCR.HOME;S.tab=TAB.SONGS;
    }
    render();return;
  }
  if(a==="songDoneHome"){
    applySongNavigationRequest("songs_home");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}});
    }else{
      S.screen=SCR.HOME;S.tab=TAB.SONGS;
    }
    render();return;
  }
  // === Tuner ===
  if(a==="startTuner"){
    if(!AC){
      syncTunerRuntimeRequest({ active:false, error:"Audio not supported" });
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{tunerErr:"Audio not supported"}});
      }else{
        S.tunerErr="Audio not supported";
      }
      render();return;
    }
    navigator.mediaDevices.getUserMedia(getAudioConstraint()).then(function(st){
      tunerR.stream=st;var ctx=new AC(),src=ctx.createMediaStreamSource(st),an=ctx.createAnalyser();
      an.fftSize=8192;src.connect(an); // Larger buffer for better low-freq accuracy
      tunerR.ctx=ctx;tunerR.analyser=an;
      syncTunerRuntimeRequest({ active:true, error:null, note:null, freq:0, cents:0 });
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{tunerActive:true,tunerErr:null}});
      }else{
        S.tunerActive=true;S.tunerErr=null;
      }
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
            S.tunerNote=result.note;
            S.tunerFreq=result.freq;
            S.tunerCents=result.cents;
            syncTunerRuntimeRequest({ active:true, note: result.note, freq: result.freq, cents: result.cents, error:null });
          }else if(f<0){
            S.tunerNote=null;S.tunerFreq=0;S.tunerCents=0;
            syncTunerRuntimeRequest({ active:true, note:null, freq:0, cents:0, error:null });
          }
          // Targeted UI update instead of full render
          updateTunerUI();
        }
        tunerR.anim=requestAnimationFrame(det);
      }det();
    }).catch(function(){
      syncTunerRuntimeRequest({ active:false, error:"Microphone access denied" });
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{tunerErr:"Microphone access denied"}});
      }else{
        S.tunerErr="Microphone access denied";
      }
      render();
    });return;
  }
  if(a==="stopTuner"){
    if(tunerR.anim)cancelAnimationFrame(tunerR.anim);
    if(tunerR.stream)tunerR.stream.getTracks().forEach(function(t){t.stop();});
    if(tunerR.ctx)tunerR.ctx.close();
    syncTunerRuntimeRequest({ active:false, note:null, freq:0, cents:0, error:null });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{tunerActive:false,tunerNote:null,tunerFreq:0,tunerCents:0}
      });
    }else{
      S.tunerActive=false;
      S.tunerNote=null;S.tunerFreq=0;S.tunerCents=0;
    }
    render();return;
  }
  if(a==="toggleMetro"){if(S.metronomeOn)stopMetronome();else startMetronome();return;}
  if(a==="metroBpm"){
    var b=parseInt(v);
    if(b>=40&&b<=200){
      S.metronomeBpm=b;
      syncMetronomeRuntimeRequest({
        active: !!S.metronomeOn,
        bpm: S.metronomeBpm,
        beat: S._metroBeat,
        beatsPerBar: S._metroBeats
      });
      if(S.metronomeOn){
        clearTimeout(T.metro);
        T.metro=null;
        if(typeof _metroNextTime==="number"&&audioCtx)_metroNextTime=audioCtx.currentTime;
        _metroSchedule();
      }
      render();
    }return;
  }
  if(a==="toggleChordDetect"){if(S.chordDetectOn)stopChordDetect();else startChordDetect();return;}
  // Dark mode toggle
  if(a==="toggleDark"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{darkMode:!S.darkMode},save:false});
    }else{
      S.darkMode=!S.darkMode;
    }
    saveState();applyTheme();render();return;
  }
  // Onboarding
  if(a==="setIntention"){S.practiceIntention=v||"";return;}
  if(a==="completeOnboarding"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{onboardingDone:true},save:false});
    }else{
      S.onboardingDone=true;
    }
    saveState();render();return;
  }
  // New system screens
  if(a==="openRecommendations"){
    openDashboardSectionRequest("recommendations");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.RECOMMENDATIONS}});
    else S.screen=SCR.RECOMMENDATIONS;
    render();return;
  }
  if(a==="openCareer"){
    openDashboardSectionRequest("career");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.CAREER}});
    else S.screen=SCR.CAREER;
    render();return;
  }
  if(a==="openCareerSong"){
    var nextSong=null;
    if(typeof getCareerItem==="function")nextSong=getCareerItem("songs",v);
    if(nextSong){
      openCareerSongSelectionRequest({
        songId: v,
        songData: nextSong,
        songTitle: nextSong.title || null,
        arrangementType: S.performArrangementType || "chords",
        difficultyId: S.performDifficulty || "normal"
      });
      S.performSongData = nextSong;
      S.performSongId = v;
    }
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{currentSong:nextSong,performSongData:nextSong,performSongId:v,screen:SCR.PERFORM_SONG}});
    }else{
      S.currentSong=nextSong;
      S.performSongData=nextSong;
      S.performSongId=v;
      S.screen=SCR.PERFORM_SONG;
    }
    render();return;
  }
  if(a==="openInsights"){
    openDashboardSectionRequest("insights");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.INSIGHTS}});
    else S.screen=SCR.INSIGHTS;
    render();return;
  }
  if(a==="openChallengeHub"){
    openDashboardSectionRequest("challenges");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.CHALLENGES}});
    else S.screen=SCR.CHALLENGES;
    render();return;
  }
  if(a==="openHomeDash"){
    openDashboardSectionRequest("home_dash");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME_DASH}});
    else S.screen=SCR.HOME_DASH;
    render();return;
  }
  if(a==="openSettings"){
    openUtilityScreenRequest("settings");
    syncSettingsStateRequest({ theme: S.settings ? S.settings.theme : null });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.SETTINGS}});
    else S.screen=SCR.SETTINGS;
    render();return;
  }
  if(a==="openOnboarding"){if(typeof startOnboarding==="function")startOnboarding();return;}
  if(a==="resumeOnboarding"){if(typeof continueOnboarding==="function")continueOnboarding();return;}
  if(a==="refreshHome"){
    if(typeof generateRecommendations==="function")generateRecommendations();
    if(typeof generatePersonalInsights==="function")generatePersonalInsights();
    refreshDashboardSnapshotRequest({
      recommendations: S.recommendations || [],
      insights: S.personalInsights || null,
      challenges: S.activeChallenges || [],
      refreshedAt: Date.now()
    });
    render();return;
  }
  if(a==="launchRecommendation"){if(typeof launchRecommendationById==="function")launchRecommendationById(v);return;}
  if(a==="claimChallengeReward"){
    if(typeof claimChallengeReward==="function")claimChallengeReward(v);
    applyDashboardChallengeRewardRequest(v);
    render();return;
  }
  if(a==="initChallenges"){
    if(typeof initializeChallengesForCurrentCycle==="function")initializeChallengesForCurrentCycle();
    initializeDashboardChallengesRequest({
      recommendations: S.recommendations || [],
      insights: S.personalInsights || null,
      challenges: S.activeChallenges || [],
      refreshedAt: Date.now()
    });
    render();return;
  }
  if(a==="openPracticePlan"){
    openPracticePlanScreenRequest();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PLAN}});
    else S.screen=SCR.PLAN;
    render();return;
  }
  if(a==="setTheme"){if(S.settings)S.settings.theme=v;if(typeof applyThemeSetting==="function")applyThemeSetting();saveState();render();return;}
  // Song sorting
  if(a==="songSort"){
    if(S.songSort===v){S.songSortAsc=!S.songSortAsc;}
    else{S.songSort=v;S.songSortAsc=true;}
    applySongBrowserRequest("song_sort", {
      songSort: S.songSort,
      songSortAsc: S.songSortAsc
    });
    render();return;
  }
  if(a==="songFilter"){S.songFilter=v||"";applySongBrowserRequest("song_filter", { songFilter: S.songFilter });render();return;}
  // Stem solo
  if(a==="stemSolo"){
    for(var sk in S.stemToggles)S.stemToggles[sk]=(sk===v);
    for(var sk in S.stemToggles)setStemMuted(sk,!S.stemToggles[sk]);
    render();return;
  }
  if(a==="stemAll"){
    for(var sk in S.stemToggles){S.stemToggles[sk]=true;setStemMuted(sk,false);}
    render();return;
  }
  if(a==="guidedNext"){
    var steps=["spark","review","newMove","songSlice","victoryLap"];
    var idx=steps.indexOf(S.guidedStep);
    if(idx<steps.length-1){
      S.guidedStep=steps[idx+1];
      if(S.guidedStep==="newMove")S.newMovePhase="watch";
      if(window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function"){
        window.sparkCore.syncGuidedRuntimeState({
          guidedStep: S.guidedStep,
          guidedNewMovePhase: S.newMovePhase || null
        });
      }
    }
    render();return;
  }
  if(a==="guidedAdvancePhase"){
    var phases=["watch","shadow","try","refine"];
    var pi=phases.indexOf(S.newMovePhase);
    if(pi<phases.length-1){
      S.newMovePhase=phases[pi+1];
      if(window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function"){
        window.sparkCore.syncGuidedRuntimeState({
          guidedStep: S.guidedStep,
          guidedNewMovePhase: S.newMovePhase
        });
      }
    }
    else{act("guidedNext");return;} // refine done → advance to songSlice
    render();return;
  }
  if(a==="guidedStop"){
    if(S.metronomeOn)stopMetronome();
    applyGuidedNavigationRequest("guided_home");
    S.screen=SCR.HOME;S.tab=TAB.PRACTICE;render();return;
  }
  // Dual instrument
  if(a==="dualChord"){S.dualChord=v;render();return;}
  if(a==="toggleAnchor"){S.dualAnchorOn=!S.dualAnchorOn;render();return;}
  if(a==="dualPreview"){
    // Play chord on both instruments
    strumChord(v);
    render();return;
  }
  // Practice Goal
  if(a==="setGoal"){
    var g=parseInt(v);
    if(g>=1&&g<=60){S.dailyGoalMinutes=g;saveState();render();}
    return;
  }
  // === Custom Practice Sets ===
  if(a==="newSet"){S.editingSet=true;S.editingSetIdx=-1;S.customSetName="";S.customSetChords=[];render();return;}
  if(a==="setName"){S.customSetName=v;return;}
  if(a==="toggleSetChord"){
    var idx=S.customSetChords.indexOf(v);
    if(idx===-1)S.customSetChords.push(v);else S.customSetChords.splice(idx,1);
    render();return;
  }
  if(a==="saveSet"){
    if(S.customSetChords.length<2||!S.customSetName.trim())return;
    var setObj={name:S.customSetName.trim(),chords:S.customSetChords.slice()};
    if(S.editingSetIdx>=0&&S.editingSetIdx<S.customSets.length){
      S.customSets[S.editingSetIdx]=setObj;
    }else{
      S.customSets.push(setObj);
    }
    S.editingSet=false;S.editingSetIdx=-1;S.customSetName="";S.customSetChords=[];
    saveState();render();return;
  }
  if(a==="cancelSet"){S.editingSet=false;S.editingSetIdx=-1;S.customSetName="";S.customSetChords=[];render();return;}
  if(a==="editSet"){
    var idx=parseInt(v);
    if(idx>=0&&idx<S.customSets.length){
      var cs=S.customSets[idx];
      S.editingSet=true;S.editingSetIdx=idx;S.customSetName=cs.name;S.customSetChords=cs.chords.slice();
      render();
    }return;
  }
  if(a==="deleteSet"){
    var idx=parseInt(v);
    if(idx>=0&&idx<S.customSets.length){
      S.customSets.splice(idx,1);saveState();render();
    }return;
  }
  // === Rhythm Game ===
  if(a==="rhythmBpm"){
    var b=parseInt(v);
    if(b>=60&&b<=200){S.rhythmBpm=b;render();}
    return;
  }
  if(a==="startRhythm"){
    var ms=60000/S.rhythmBpm;
    var beats=[];
    var patterns=[["D","U","D","U"],["D","D","U","D"],["D","U","D","U","D","U","D","U"]];
    var pat=patterns[Math.floor(Math.random()*patterns.length)];
    for(var r=0;r<4;r++){
      for(var i=0;i<pat.length;i++){
        beats.push({time:(r*pat.length+i)*ms/2,type:pat[i],hit:false,result:null});
      }
    }
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{
          rhythmBeats:beats,
          rhythmScore:0,
          rhythmCombo:0,
          rhythmMaxCombo:0,
          rhythmActive:true,
          rhythmResults:null,
          rhythmStartTime:performance.now()
        }
      });
    }else{
      S.rhythmBeats=beats;S.rhythmScore=0;S.rhythmCombo=0;S.rhythmMaxCombo=0;
      S.rhythmActive=true;S.rhythmResults=null;S.rhythmStartTime=performance.now();
    }
    openLegacyRhythmGameRequest({
      beats: beats,
      score: 0,
      combo: 0,
      maxCombo: 0,
      startTimeMs: S.rhythmStartTime
    });
    render();_rhythmAnim=requestAnimationFrame(rhythmTick);
    return;
  }
  if(a==="rhythmTap"&&S.rhythmActive){
    var now=performance.now()-S.rhythmStartTime;
    var closest=null,closestDiff=999999;
    for(var i=0;i<S.rhythmBeats.length;i++){
      var b=S.rhythmBeats[i];
      if(b.hit)continue;
      var diff=Math.abs(now-b.time);
      if(diff<closestDiff){closestDiff=diff;closest=i;}
    }
    if(closest!==null&&closestDiff<300){
      var b=S.rhythmBeats[closest];
      b.hit=true;
      if(closestDiff<50){b.result="perfect";S.rhythmScore+=100*(1+Math.floor(S.rhythmCombo/5));S.rhythmCombo++;snd("correct");}
      else if(closestDiff<100){b.result="good";S.rhythmScore+=50*(1+Math.floor(S.rhythmCombo/5));S.rhythmCombo++;snd("click");}
      else{b.result="ok";S.rhythmScore+=25;S.rhythmCombo=0;}
      if(S.rhythmCombo>S.rhythmMaxCombo)S.rhythmMaxCombo=S.rhythmCombo;
    }else{
      S.rhythmCombo=0;snd("wrong");
    }
    syncLegacyRhythmRuntimeRequest({
      active: S.rhythmActive,
      beats: S.rhythmBeats,
      score: S.rhythmScore,
      combo: S.rhythmCombo,
      maxCombo: S.rhythmMaxCombo,
      startTimeMs: S.rhythmStartTime
    });
    render();return;
  }
  // === Progression Builder ===
  if(a==="progPickerToggle"){S.progPickerOpen=!S.progPickerOpen;render();return;}
  if(a==="progAdd"){S.progChords.push(v);S.progPickerOpen=false;render();return;}
  if(a==="progRemove"){
    var idx=parseInt(v);
    if(idx>=0&&idx<S.progChords.length){S.progChords.splice(idx,1);render();}
    return;
  }
  if(a==="progMove"){
    var parts=v.split(":");
    var idx=parseInt(parts[0]),dir=parts[1];
    if(dir==="left"&&idx>0){
      var t=S.progChords[idx];S.progChords[idx]=S.progChords[idx-1];S.progChords[idx-1]=t;
    }else if(dir==="right"&&idx<S.progChords.length-1){
      var t=S.progChords[idx];S.progChords[idx]=S.progChords[idx+1];S.progChords[idx+1]=t;
    }
    render();return;
  }
  if(a==="progTemplate"){
    var idx=parseInt(v);
    if(idx>=0&&idx<COMMON_PROGRESSIONS.length){
      S.progChords=COMMON_PROGRESSIONS[idx].chords.slice();
      render();
    }return;
  }
  if(a==="progBpm"){
    var b=parseInt(v);
    if(b>=40&&b<=200){
      S.progBpm=b;
      if(S.progPlaying){
        clearInterval(T.prog);
        var ms=60000/b;
        T.prog=setInterval(function(){
          S.progBeat=(S.progBeat+1)%S.progChords.length;
          strumChord(S.progChords[S.progBeat]);
          render();
        },ms);
      }
      render();
    }return;
  }
  if(a==="progPlay"){
    if(S.progChords.length<2)return;
    if(S.progPlaying){
      S.progPlaying=false;clearInterval(T.prog);render();
    }else{
      S.progPlaying=true;S.progBeat=0;
      strumChord(S.progChords[0]);
      var ms=60000/S.progBpm;
      T.prog=setInterval(function(){
        S.progBeat=(S.progBeat+1)%S.progChords.length;
        strumChord(S.progChords[S.progBeat]);
        render();
      },ms);
      render();
    }return;
  }
  if(a==="progClear"){
    if(S.progPlaying){S.progPlaying=false;clearInterval(T.prog);}
    S.progChords=[];render();return;
  }
  // === Export/Import Progress ===
  if(a==="exportProgress"){
    var data={version:"3.1",exportDate:new Date().toISOString(),data:{}};
    for(var i=0;i<PERSIST_FIELDS.length;i++){
      data.data[PERSIST_FIELDS[i]]=S[PERSIST_FIELDS[i]];
    }
    var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    var url=URL.createObjectURL(blob);
    var a2=document.createElement("a");
    a2.href=url;a2.download="chordspark-backup.json";
    document.body.appendChild(a2);a2.click();document.body.removeChild(a2);
    URL.revokeObjectURL(url);
    S.importMsg={ok:true,text:"Progress exported!"};render();
    setTimeout(function(){S.importMsg=null;render();},3000);
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
          var arrayFields=["history","customSets","earnedBadges","importedSongs"];
          var objectFields=["chordProgress","transitionStats"];
          for(var k in imported.data){
            if(PERSIST_FIELDS.indexOf(k)===-1)continue;
            var val=imported.data[k];
            if(typeChecks[k]&&typeof val!==typeChecks[k])continue; // skip wrong type
            if(arrayFields.indexOf(k)!==-1&&!Array.isArray(val))continue;
            if(objectFields.indexOf(k)!==-1&&(typeof val!=="object"||val===null||Array.isArray(val)))continue;
            S[k]=val;
          }
          if(!Array.isArray(S.history))S.history=[];
          if(!Array.isArray(S.customSets))S.customSets=[];
          if(!Array.isArray(S.importedSongs))S.importedSongs=[];
          if(typeof S.transitionStats!=="object"||S.transitionStats===null)S.transitionStats={};
          saveState();
          S.importMsg={ok:true,text:"Progress imported successfully!"};
        }catch(err){
          S.importMsg={ok:false,text:"Invalid backup file: "+(err.message||"unknown error")};
        }
        render();
        setTimeout(function(){S.importMsg=null;render();},3000);
      };
      reader.readAsText(file);
    };
    input.click();
    return;
  }
  // === Chord Sheet Import ===
  if(a==="importText"){S.importText=v;return;}
  if(a==="parseImport"){
    var result=parseChordSheet(S.importText);
    if(result.error){
      S.importedSong=null;S.importError=result.error;
    }else{
      S.importedSong={title:"Imported Song",artist:"Unknown",chords:result.chords,progression:result.progression,bpm:100,level:1,pattern:["D","D","U","U","D","U"]};
      S.importError=null;
    }
    render();return;
  }
  if(a==="importTitle"){if(S.importedSong)S.importedSong.title=v;return;}
  if(a==="importArtist"){if(S.importedSong)S.importedSong.artist=v;return;}
  if(a==="importBpm"){if(S.importedSong)S.importedSong.bpm=parseInt(v)||100;return;}
  if(a==="saveImport"){
    if(!S.importedSong)return;
    S.importedSongs.push(JSON.parse(JSON.stringify(S.importedSong)));
    S.importedSong=null;S.importText="";S.importError=null;
    saveState();render();return;
  }
  if(a==="deleteImport"){
    var idx=parseInt(v);
    if(idx>=0&&idx<S.importedSongs.length){S.importedSongs.splice(idx,1);saveState();render();}
    return;
  }
  if(a==="playImport"){
    var idx=parseInt(v);
    if(idx>=0&&idx<S.importedSongs.length){
      openSongSessionRequest({ songData: S.importedSongs[idx], source: "imported" });
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields:{selectedSong:S.importedSongs[idx],songPlaying:false,songBeat:0,screen:SCR.SONG},
          clearIntervals:["song"]
        });
      }else{
        S.selectedSong=S.importedSongs[idx];S.songPlaying=false;S.songBeat=0;clearInterval(T.song);
        S.screen=SCR.SONG;
      }
      render();
    }return;
  }
  // === Community ===
  if(a==="communityTab"){S.communityTab=v;applySongBrowserRequest("community_tab", { communityTab: S.communityTab });render();return;}
  if(a==="communitySearch"){S.communitySearch=v;applySongBrowserRequest("community_search", { communitySearch: S.communitySearch });fetchCommunity();return;}
  if(a==="communitySort"){S.communitySort=v;applySongBrowserRequest("community_sort", { communitySort: S.communitySort });fetchCommunity();return;}
  if(a==="voteSong"){
    fetch(COMMUNITY_URL+"/api/songs/"+v+"/vote",{method:"POST"}).then(function(){fetchCommunity();}).catch(function(){});
    return;
  }
  if(a==="playCommunity"){
    var song=null;
    for(var i=0;i<S.communitySongs.length;i++)if(S.communitySongs[i].id==v)song=S.communitySongs[i];
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
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({
          setFields:{selectedSong:parsed,songPlaying:false,songBeat:0,screen:SCR.SONG},
          clearIntervals:["song"]
        });
      }else{
        S.selectedSong=parsed;S.songPlaying=false;S.songBeat=0;clearInterval(T.song);
        S.screen=SCR.SONG;
      }
      render();
    }catch(e){
      console.warn("ChordSpark: Failed to parse community song:",e.message);
      S.communityError="Could not load song: invalid data";render();
    }
    return;
  }
  if(a==="submitField"){
    var sep=v.indexOf(":");
    var field=v.substring(0,sep),val=v.substring(sep+1);
    if(field==="bpm")S.submitSong.bpm=parseInt(val)||100;
    else S.submitSong[field]=val;
    return;
  }
  if(a==="submitToggleChord"){
    var idx=S.submitSong.chords.indexOf(v);
    if(idx===-1){S.submitSong.chords.push(v);S.submitSong.progression.push(v);}
    else{S.submitSong.chords.splice(idx,1);}
    render();return;
  }
  if(a==="submitClearProg"){S.submitSong.progression=[];render();return;}
  if(a==="submitSong"){
    var ss=S.submitSong;
    if(!ss.title.trim()||!ss.artist.trim()||ss.chords.length<2||ss.progression.length<2)return;
    var body={
      title:ss.title.trim(),artist:ss.artist.trim(),
      chords:JSON.stringify(ss.chords),
      progression:JSON.stringify(ss.progression),
      pattern:JSON.stringify(["D","D","U","U","D","U"]),
      bpm:ss.bpm,level:1,
      submitted_by:ss.submittedBy.trim()||"Anonymous"
    };
    fetch(COMMUNITY_URL+"/api/songs",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)
    }).then(function(r){return r.json();}).then(function(){
      S.submitSong={title:"",artist:"",chords:[],progression:[],bpm:100,pattern:[],submittedBy:""};
      S.communityTab="browse";
      fetchCommunity();
    }).catch(function(){
      S.communityError="Failed to submit song";render();
    });
    return;
  }
  // === Chord Runner ===
  if(a==="startRunner"){
    var av=CHORDS[S.level]||CHORDS[1];
    var runnerTarget=av[Math.floor(Math.random()*av.length)];
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
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
      });
    }else{
      S.runnerTarget=runnerTarget;
      S.runnerActive=true;S.runnerScore=0;S.runnerCombo=0;S.runnerMaxCombo=0;
      S.runnerLives=3;S.runnerObstacles=[];S.runnerSpeed=2;S.runnerDistance=0;
      S.runnerResults=null;S.runnerStartTime=Date.now();S.runnerLastSpawn=0;
    }
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
  if(a==="runnerStrum"&&S.runnerActive){
    var closest=null,closestDist=999;
    for(var i=0;i<S.runnerObstacles.length;i++){
      var o=S.runnerObstacles[i];
      if(o.hit)continue;
      var dist=Math.abs(o.x-60);
      if(dist<closestDist&&o.x>0&&o.x<140){
        closestDist=dist;closest=i;
      }
    }
    if(closest!==null){
      var o=S.runnerObstacles[closest];
      o.hit=true;
      if(o.isTarget){
        S.runnerCombo++;
        if(S.runnerCombo>S.runnerMaxCombo)S.runnerMaxCombo=S.runnerCombo;
        var pts=100*(1+Math.floor(S.runnerCombo/5));
        S.runnerScore+=pts;o.result="correct";
        snd("correct");
        // Change target every 5 correct hits
        if(S.runnerCombo%5===0&&S.runnerCombo>0)changeRunnerTarget();
      }else{
        S.runnerLives--;S.runnerCombo=0;o.result="wrong";
        snd("wrong");
        if(S.runnerLives<=0){finishRunner();return;}
      }
    }else{
      S.runnerCombo=0;
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
    render();return;
  }
  // === Stem Separation ===
  if(a==="stemOpenFile"){
    if(!window.electron)return;
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemError:null}});
    }else{
      S.stemError=null;
    }
    render();
    window.electron.stems.openFile().then(function(result){
      if(!result)return;
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemFile:result,stemError:null,stemStatus:"idle"}});
      }else{
        S.stemFile=result;S.stemError=null;S.stemStatus="idle";
      }
      render();
      // Check cache first
      window.electron.stems.checkCache(result.filePath).then(function(cached){
        if(cached){
          if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
            SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemPaths:cached,stemStatus:"ready"}});
          }else{
            S.stemPaths=cached;S.stemStatus="ready";
          }
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
    if(!window.electron||!S.stemFile)return;
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemStatus:"separating",stemProgress:0,stemError:null}});
    }else{
      S.stemStatus="separating";S.stemProgress=0;S.stemError=null;
    }
    render();
    // Listen for progress
    var removeProgress=window.electron.stems.onProgress(function(data){
      // Estimate progress from stderr output
      if(data.line){
        // demucs.cpp outputs segment info; rough estimate
        if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
          SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemProgress:Math.min(95,S.stemProgress+2)},save:false});
        }else{
          S.stemProgress=Math.min(95,S.stemProgress+2);
        }
        render();
      }
    });
    window.electron.stems.separate(S.stemFile.filePath).then(function(result){
      removeProgress();
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemPaths:result.stemPaths,stemStatus:"ready",stemProgress:100}});
      }else{
        S.stemPaths=result.stemPaths;S.stemStatus="ready";S.stemProgress=100;
      }
      render();
      _loadStemFileUrls(result.stemPaths);
    }).catch(function(err){
      removeProgress();
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemStatus:"error",stemError:err.message||"Separation failed"}});
      }else{
        S.stemStatus="error";S.stemError=err.message||"Separation failed";
      }
      render();
    });
    return;
  }
  if(a==="stemCancel"){
    if(window.electron)window.electron.stems.cancel();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{stemStatus:"idle",stemProgress:0}});
    }else{
      S.stemStatus="idle";S.stemProgress=0;
    }
    render();return;
  }
  if(a==="stemOpen"){
    openStemPlayerRequest();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.STEMS}});
    else S.screen=SCR.STEMS;
    render();return;
  }
  if(a==="stemBack"){
    cleanupStems();
    closeStemPlayerRequest();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS,songsSubTab:"stems"}});
    else {S.screen=SCR.HOME;S.tab=TAB.SONGS;S.songsSubTab="stems";}
    render();return;
  }
  if(a==="stemToggle"){
    S.stemToggles[v]=!S.stemToggles[v];
    setStemMuted(v,!S.stemToggles[v]);
    render();return;
  }
  if(a==="stemPlay"){
    if(S.stemPlaying){pauseStems();}
    else{playStems();}
    return;
  }
  if(a==="stemSeek"){
    seekStems(parseFloat(v));render();return;
  }
  if(a==="stemVolume"){
    S.stemVolume=parseFloat(v);
    setStemVolume(S.stemVolume);
    render();return;
  }
  // === Tone Picker ===
  if(a==="setTone"){
    if(STRUM_TONES[v]||v==="guitar"){S.strumTone=v;saveState();render();}
    return;
  }
  // === Scale Explorer ===
  if(a==="selectScale"){S.selectedScale=v;render();return;}
  // === Audio Input ===
  if(a==="refreshAudioInputs"){refreshAudioInputs();return;}
  if(a==="testAudioInput"){testAudioInput(v);return;}
  if(a==="stopAudioTest"){stopAudioTest();render();return;}
  if(a==="selectAudioInput"){
    stopAudioTest();
    S.audioInputId=v;
    syncAudioInputRuntimeRequest({
      devices: S.audioInputDevices || [],
      inputId: S.audioInputId || null,
      testingId: "",
      testLevel: 0
    });
    saveState();render();return;
  }
  // === MIDI ===
  if(a==="toggleMidi"){
    S.midiEnabled=!S.midiEnabled;
    if(S.midiEnabled){initMIDI();}
    else{S.midiOutput=null;S.midiDevices=[];}
    syncMidiSettingsStateRequest();
    saveState();render();return;
  }
  if(a==="selectMidiDevice"){selectMIDIDevice(v);saveState();render();return;}
  // === Shortcuts ===
  if(a==="toggleFocus"){S.focusMode=!S.focusMode;if(S.focusMode&&[TAB.PRACTICE,TAB.DRILL,TAB.DAILY,TAB.STATS,TAB.GUIDE].indexOf(S.tab)===-1){S.tab=TAB.PRACTICE;}saveState();render();return;}
  if(a==="dismissBreak"){S.breakDismissed=true;S.sessionStartTime=Date.now();render();return;}
  if(a==="toggleShortcuts"){S.showShortcuts=!S.showShortcuts;render();return;}
  // === Undo ===
  if(a==="undoReset"){undoReset();return;}
  // === Performance Mode ===
  if(a==="openPerform"){startPerformance(v);return;}
  if(a==="startPerform"){startPerformance(v);return;}
  if(a==="performSong"){
    var songIdx=parseInt(v);
    if(!isNaN(songIdx)&&SONGS[songIdx]){
      var chart=buildPerformanceChartFromSong(SONGS[songIdx],"builtin");
      if(chart){startPerformance(chart);return;}
    }
    return;
  }
  if(a==="performSongRhythm"){
    var songIdx=parseInt(v);
    if(!isNaN(songIdx)&&SONGS[songIdx]){
      var chart=buildPerformanceChartFromSong(SONGS[songIdx],"builtin","rhythm_chords");
      if(chart){
        if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
          SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performArrangementType:"rhythm_chords"}});
        }else{
          S.performArrangementType="rhythm_chords";
        }
        startPerformance(chart);return;
      }
    }
    return;
  }
  if(a==="openPerformSong"){
    var sgIdx=parseInt(v);
    if(!isNaN(sgIdx)&&SONGS[sgIdx]){
      var selectedSongId=(SONGS[sgIdx].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performTargetTechnique:null}});
      }else{
        S.performTargetTechnique=null;
      }
      if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
        openPerformanceSongSelectionRequest({
          songIndex: sgIdx,
          songId: selectedSongId,
          songTitle: SONGS[sgIdx].title || null,
          targetTechnique: null,
          arrangementType: S.performArrangementType || "chords",
          difficultyId: S.performDifficulty || "normal"
        });
      } else {
        S.performSongData=SONGS[sgIdx];
        S.performSongId=selectedSongId;
        S.performTargetTechnique=null;
      }
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}});
      }else{
        S.screen=SCR.PERFORM_SONG;
      }
      render();
    }
    return;
  }
  if(a==="planStartPerformanceSong"){
    var parts=String(v||"").split("|");
    var songId=parts[0]||"";
    var arrangementType=parts[1]||"chords";
    var difficultyId=parts[2]||"normal";
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performTargetTechnique:null}});
    }else{
      S.performTargetTechnique=null;
    }
    if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
      openPerformanceSongSelectionRequest({
        songId: songId,
        targetTechnique: null,
        arrangementType: arrangementType,
        difficultyId: difficultyId
      });
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}});
      }else{
        S.screen=SCR.PERFORM_SONG;
      }
      render();return;
    }
    for(var psi=0;psi<SONGS.length;psi++){
      var planSongId=(SONGS[psi].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
      if(planSongId===songId){
        S.performSongData=SONGS[psi];
        S.performSongId=songId;
        S.performArrangementType=arrangementType;
        S.performDifficulty=difficultyId;
        if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
          SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}});
        }else{
          S.screen=SCR.PERFORM_SONG;
        }
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
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performTargetPhrase:phraseId!=null&&phraseId!==""?parseInt(phraseId,10):null}});
    }else{
      S.performTargetPhrase=phraseId!=null&&phraseId!==""?parseInt(phraseId,10):null;
    }
    act("planStartPerformanceSong", phraseSongId + "|" + phraseArrangementType + "|" + phraseDifficultyId);
    return;
  }
  if(a==="planStartPerformanceTechnique"){
    var techniqueParts=String(v||"").split("|");
    var techniqueSongId=techniqueParts[0]||"";
    var techniqueArrangementType=techniqueParts[1]||"imported_chart";
    var techniqueDifficultyId=techniqueParts[2]||"normal";
    var techniqueKey=techniqueParts[3]||null;
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performTargetTechnique:techniqueKey}});
    }else{
      S.performTargetTechnique=techniqueKey;
    }
    if(window.sparkCore && typeof window.sparkCore.startSession==="function"){
      openPerformanceSongSelectionRequest({
        songId: techniqueSongId,
        arrangementType: techniqueArrangementType,
        difficultyId: techniqueDifficultyId,
        targetTechnique: techniqueKey
      });
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}});
      }else{
        S.screen=SCR.PERFORM_SONG;
      }
      render();return;
    }
    act("planStartPerformanceSong", techniqueSongId + "|" + techniqueArrangementType + "|" + techniqueDifficultyId);
    return;
  }
  if(a==="openPerfStats"){
    openPerformanceStatsRequest({ focus: "overview" });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERF_STATS}});
    else S.screen=SCR.PERF_STATS;
    render();return;
  }
  if(a==="openEditor"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performEditorChart:null,performEditorDirty:false,screen:SCR.PERF_EDITOR}});
    }else{
      S.performEditorChart=null;S.performEditorDirty=false;S.screen=SCR.PERF_EDITOR;
    }
    openPerformanceEditorRequest(null, {
      action: "open_editor",
      source: "blank",
      dirty: false,
      mode: S.performEditorMode || "chords",
      snap: S.performEditorSnap || "1/8",
      selectedEventId: null,
      selectedPhraseId: null
    });
    render();return;
  }
  if(a==="openSkillTree"){
    openSkillTreeRequest();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.SKILL_TREE}});
    else S.screen=SCR.SKILL_TREE;
    render();return;
  }
  if(a==="planStartModuleExercise"){
    var moduleExercise = resolveModuleExerciseLaunchOptions(v);
    var modulePayload = buildModuleExerciseRhythmPayload(moduleExercise);
    if(modulePayload && typeof startRhythmHighwayPayload==="function"){
      startRhythmHighwayPayload(modulePayload, S.rhythmHighwayPreset, {
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
    if(typeof startRhythmHighwaySegment==="function" && startRhythmHighwaySegment(v,S.rhythmHighwayPreset))return;
    render();return;
  }
  if(a==="rhythmHighwayPreset"){
    S.rhythmHighwayPreset=v||"spark_learning";
    if(S.activeCoreSegmentId&&typeof startRhythmHighwaySegment==="function"){
      startRhythmHighwaySegment(S.activeCoreSegmentId,S.rhythmHighwayPreset);
      return;
    }
    render();return;
  }
  if(a==="skillTreeFocus"){
    S.skillTreeFocus=v||"overview";
    setSkillTreeFocusRequest(S.skillTreeFocus);
    render();return;
  }
  if(a==="openPlan"){
    if(window.sparkCore){
      openPracticePlanScreenRequest();
    }
    S.screen=SCR.PLAN;render();return;
  }
  if(a==="openPerformCalibration"){
    openPerformanceCalibrationRequest();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_CALIBRATE}});
    else S.screen=SCR.PERFORM_CALIBRATE;
    render();return;
  }
  if(a==="performCalibrateSource"){
    applyPerformanceCalibrationRequest("calibration_source", { source: v||"midi" });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performCalibrationSource:v||"midi"}});
    else S.performCalibrationSource=v||"midi";
    render();return;
  }
  if(a==="performCalibrationStart"){
    var calStartSource=typeof getPerformanceCalibrationView==="function"?getPerformanceCalibrationView().source:(S.performCalibrationSource||"midi");
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
      source: S.performCalibrationSource || "midi",
      appliedOffsetMs: appliedOffset,
      globalOffsetMs: S.performTimingOffsetMs || 0,
      midiOffsetMs: S.performMidiOffsetMs || 0,
      micOffsetMs: S.performMicOffsetMs || 0
    });
    render();return;
  }
  if(a==="performCalibrationReset"){
    var resetSource=typeof getPerformanceCalibrationView==="function"?getPerformanceCalibrationView().source:(S.performCalibrationSource||"midi");
    var resetPatch={performCalibrationHits:[]};
    if(resetSource==="midi")resetPatch.performMidiOffsetMs=0;
    if(resetSource==="mic")resetPatch.performMicOffsetMs=0;
    applyPerformanceCalibrationRequest("calibration_reset", {
      source: resetSource,
      globalOffsetMs: S.performTimingOffsetMs || 0,
      midiOffsetMs: resetSource==="midi" ? 0 : (S.performMidiOffsetMs || 0),
      micOffsetMs: resetSource==="mic" ? 0 : (S.performMicOffsetMs || 0)
    });
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:resetPatch,save:false});
    }else{
      if(resetPatch.performMidiOffsetMs===0)S.performMidiOffsetMs=0;
      if(resetPatch.performMicOffsetMs===0)S.performMicOffsetMs=0;
      S.performCalibrationHits=[];
    }
    saveState();render();return;
  }
  if(a==="performStatsBack"){
    applyPerformanceNavigationRequest("songs_home");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}});
    }else{
      S.screen=SCR.HOME;S.tab=TAB.SONGS;
    }
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
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}});
    }else{
      S.screen=SCR.HOME;S.tab=TAB.SONGS;
    }
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
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}});
    else {S.screen=SCR.HOME;S.tab=TAB.SONGS;}
    render();return;
  }
  if(a==="editorMode"){
    syncPerformanceEditorDocumentState(S.performEditorChart, { mode: v });
    S.performEditorMode=v;render();return;
  }
  if(a==="editorSnap"){
    syncPerformanceEditorDocumentState(S.performEditorChart, { snap: v });
    S.performEditorSnap=v;render();return;
  }
  if(a==="editorNew"){
    var newEditorChartResult=applyPerformanceEditorCoreMutation("new_blank", { mode: S.performEditorMode });
    S.performEditorChart=newEditorChartResult&&newEditorChartResult.chart
      ? newEditorChartResult.chart
      : {id:"custom_"+Date.now(),title:"New Chart",artist:"Custom",bpm:90,beatsPerBar:4,arrangementType:S.performEditorMode,events:[],phrases:[{id:0,name:"Phrase 1",startSec:0,endSec:8}]};
    syncPerformanceEditorDocumentState(S.performEditorChart, {
      source: "blank",
      dirty: true,
      selectedEventId: null,
      selectedPhraseId: null
    });
    S.performEditorDirty=true;render();return;
  }
  if(a==="editorFromSong"){
    if(S.performSongData){
      var chart=buildPerformanceChartFromSong(S.performSongData,"builtin",S.performEditorMode);
      if(chart){
        S.performEditorChart=chart;
        syncPerformanceEditorDocumentState(chart, {
          source: "song",
          dirty: true,
          selectedEventId: null,
          selectedPhraseId: null
        });
        S.performEditorDirty=true;render();
      }
    }
    return;
  }
  if(a==="editorTitle"){
    if(S.performEditorChart){
      var titleMutation=applyPerformanceEditorCoreMutation("set_title", { title: v });
      S.performEditorChart=titleMutation&&titleMutation.chart ? titleMutation.chart : S.performEditorChart;
      S.performEditorChart.title=v;
      syncPerformanceEditorDocumentState(S.performEditorChart, { source: "existing", dirty: true });
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorBpm"){
    if(S.performEditorChart){
      var bpmValue=parseInt(v)||90;
      var bpmMutation=applyPerformanceEditorCoreMutation("set_bpm", { bpm: bpmValue });
      S.performEditorChart=bpmMutation&&bpmMutation.chart ? bpmMutation.chart : S.performEditorChart;
      S.performEditorChart.bpm=bpmValue;
      syncPerformanceEditorDocumentState(S.performEditorChart, { source: "existing", dirty: true });
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorSelectEvent"){
    S.performEditorSelectedEventId=parseInt(v);
    var selectedEventMutation=applyPerformanceEditorCoreMutation("select_event", { id: S.performEditorSelectedEventId });
    if(selectedEventMutation&&selectedEventMutation.chart)S.performEditorChart=selectedEventMutation.chart;
    var selectedEditorEvent=null;
    if(S.performEditorChart&&S.performEditorChart.events){
      for(var selectedIdx=0;selectedIdx<S.performEditorChart.events.length;selectedIdx++){
        if(S.performEditorChart.events[selectedIdx].id===S.performEditorSelectedEventId){selectedEditorEvent=S.performEditorChart.events[selectedIdx];break;}
      }
    }
    syncPerformanceEditorDocumentState(S.performEditorChart, {
      source: S.performEditorChart ? "existing" : "blank",
      dirty: !!S.performEditorDirty,
      selectedEventId: S.performEditorSelectedEventId,
      selectedEvent: selectedEditorEvent
    });
    render();return;
  }
  if(a==="editorAddEvent"){
    if(S.performEditorChart){
      var addEventMutation=applyPerformanceEditorCoreMutation("add_event", { mode: S.performEditorMode });
      if(addEventMutation&&addEventMutation.chart)S.performEditorChart=addEventMutation.chart;
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: "existing",
        dirty: true,
        selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
        selectedEvent: null
      });
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorDeleteEvent"){
    if(S.performEditorChart){
      var deleteEventId=parseInt(v);
      var deleteEventMutation=applyPerformanceEditorCoreMutation("delete_event", { id: deleteEventId });
      if(deleteEventMutation&&deleteEventMutation.chart)S.performEditorChart=deleteEventMutation.chart;
      else S.performEditorChart.events=S.performEditorChart.events.filter(function(e){return e.id!==deleteEventId;});
      if(S.performEditorSelectedEventId===parseInt(v))S.performEditorSelectedEventId=null;
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: "existing",
        dirty: true,
        selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
        selectedEvent: null
      });
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorEvt"){
    try{
      var p=JSON.parse(v);
      if(S.performEditorChart){
        var editorMutation=applyPerformanceEditorCoreMutation("update_event", p);
        if(editorMutation&&editorMutation.chart)S.performEditorChart=editorMutation.chart;
        for(var ee=0;ee<S.performEditorChart.events.length;ee++){
          if(S.performEditorChart.events[ee].id===p.id){
            var editedEvent=S.performEditorChart.events[ee];
            break;
          }
        }
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "existing",
          dirty: true,
          selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null,
          selectedEvent: editedEvent || null
        });
        S.performEditorDirty=true;render();
      }
    }catch(e){}
    return;
  }
  if(a==="editorAddPhrase"){
    if(S.performEditorChart){
      var addPhraseMutation=applyPerformanceEditorCoreMutation("add_phrase");
      if(addPhraseMutation&&addPhraseMutation.chart)S.performEditorChart=addPhraseMutation.chart;
      var ph=S.performEditorChart.phrases;
      var addedPhrase=ph[ph.length-1];
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: "existing",
        dirty: true,
        selectedPhraseId: addedPhrase.id,
        selectedPhrase: addedPhrase
      });
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorSelectPhrase"){
    var selectedPhraseId=parseInt(v,10);
    var selectedPhraseMutation=applyPerformanceEditorCoreMutation("select_phrase", { id: selectedPhraseId });
    if(selectedPhraseMutation&&selectedPhraseMutation.chart)S.performEditorChart=selectedPhraseMutation.chart;
    var selectedPhrase=null;
    if(S.performEditorChart&&S.performEditorChart.phrases){
      for(var phraseIndex=0;phraseIndex<S.performEditorChart.phrases.length;phraseIndex++){
        if(S.performEditorChart.phrases[phraseIndex].id===selectedPhraseId){selectedPhrase=S.performEditorChart.phrases[phraseIndex];break;}
      }
    }
    syncPerformanceEditorDocumentState(S.performEditorChart, {
      source: S.performEditorChart ? "existing" : "blank",
      dirty: !!S.performEditorDirty,
      selectedPhraseId: selectedPhrase ? selectedPhrase.id : null,
      selectedPhrase: selectedPhrase
    });
    render();return;
  }
  if(a==="editorPhrase"){
    try{
      var phrasePatch=JSON.parse(v);
      var updatedPhrase=null;
      if(S.performEditorChart&&S.performEditorChart.phrases){
        var phraseMutation=applyPerformanceEditorCoreMutation("update_phrase", phrasePatch);
        if(phraseMutation&&phraseMutation.chart)S.performEditorChart=phraseMutation.chart;
        for(var phraseEditIndex=0;phraseEditIndex<S.performEditorChart.phrases.length;phraseEditIndex++){
          if(S.performEditorChart.phrases[phraseEditIndex].id===phrasePatch.id){
            updatedPhrase=S.performEditorChart.phrases[phraseEditIndex];
            break;
          }
        }
        syncPerformanceEditorDocumentState(S.performEditorChart, {
          source: "existing",
          dirty: true,
          selectedPhraseId: updatedPhrase ? updatedPhrase.id : null,
          selectedPhrase: updatedPhrase
        });
        S.performEditorDirty=true;render();
      }
    }catch(e){}
    return;
  }
  if(a==="editorDeletePhrase"){
    var deletePhraseId=parseInt(v,10);
    if(S.performEditorChart&&S.performEditorChart.phrases){
      var deletePhraseMutation=applyPerformanceEditorCoreMutation("delete_phrase", { id: deletePhraseId });
      if(deletePhraseMutation&&deletePhraseMutation.chart)S.performEditorChart=deletePhraseMutation.chart;
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: "existing",
        dirty: true,
        selectedPhraseId: null,
        selectedPhrase: null
      });
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorSave"){
    if(S.performEditorChart){
      var copy=JSON.parse(JSON.stringify(S.performEditorChart));
      var saveMutation=applyPerformanceEditorCoreMutation("save_to_library");
      if(saveMutation&&Array.isArray(saveMutation.library))syncPerformanceEditorLibraryState(saveMutation.library);
      else{
        if(!Array.isArray(S.performEditorLibrary))S.performEditorLibrary=[];
        var exists=-1;
        for(var si=0;si<S.performEditorLibrary.length;si++){
          if(S.performEditorLibrary[si].id===S.performEditorChart.id){exists=si;break;}
        }
        if(exists>=0)S.performEditorLibrary[exists]=copy;
        else S.performEditorLibrary.push(copy);
      }
      syncPerformanceEditorDocumentState(copy, {
        source: "library",
        dirty: false,
        selectedEventId: S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null
      });
      S.performEditorDirty=false;saveState();render();
    }
    return;
  }
  if(a==="editorLoad"){
    var idx=parseInt(v);
    var loadMutation=applyPerformanceEditorCoreMutation("load_from_library", { index: idx });
    if(loadMutation&&Array.isArray(loadMutation.library))syncPerformanceEditorLibraryState(loadMutation.library);
    if((loadMutation&&loadMutation.chart) || (S.performEditorLibrary&&S.performEditorLibrary[idx])){
      S.performEditorChart=loadMutation&&loadMutation.chart ? loadMutation.chart : JSON.parse(JSON.stringify(S.performEditorLibrary[idx]));
      syncPerformanceEditorDocumentState(S.performEditorChart, {
        source: "library",
        dirty: false,
        selectedEventId: null,
        selectedPhraseId: null
      });
      S.performEditorDirty=false;S.performEditorSelectedEventId=null;render();
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
    if(S.performEditorLibrary&&S.performEditorLibrary[di]){
      S.performEditorLibrary.splice(di,1);saveState();render();
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
    if(ch.songId){
      for(var di=0;di<SONGS.length;di++){
        var dsid=(SONGS[di].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
        if(dsid===ch.songId){
          openPerformanceDailyChallengeRequest({
            songId: ch.songId,
            songData: SONGS[di],
            songTitle: SONGS[di].title || null,
            arrangementType: ch.arrangementType||"chords",
            difficultyId: ch.difficultyId||"normal",
            songIndex: di,
            targetTechnique: ch.techniqueKey||null
          });
          S.performSongData=SONGS[di];S.performSongId=ch.songId;
          S.performArrangementType=ch.arrangementType||"chords";
          S.performDifficulty=ch.difficultyId||"normal";
          if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.PERFORM_SONG}});
          else S.screen=SCR.PERFORM_SONG;
          render();return;
        }
      }
    }
    openPerformanceDailyChallengeRequest({});
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{tab:TAB.SONGS,screen:SCR.HOME}});
    else {S.tab=TAB.SONGS;S.screen=SCR.HOME;}
    render();return;
  }
  if(a==="performArrangement"){
    S.performArrangementType=v||"chords";
    if(window.sparkCore&&typeof window.sparkCore.syncPerformanceRuntimeState==="function"){
      var arrangementState = window.sparkCore.getRuntimeState();
      window.sparkCore.syncPerformanceRuntimeState("configure", {
        arrangementType: S.performArrangementType,
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
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{songAudioImporting:true,songAudioProgress:0,songAudioImportingSongId:importSongId}});
      }else{
        S.songAudioImporting=true;
        S.songAudioProgress=0;
        S.songAudioImportingSongId=importSongId;
      }
      render();

      var unsubProgress=window.electron.stems.onProgress(function(data){
        if(data&&data.progress!=null){
          if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
            SparkProgressBridge.applyLegacyActivityRuntime({setFields:{songAudioProgress:Math.round(data.progress)},save:false});
          }else{
            S.songAudioProgress=Math.round(data.progress);
          }
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
          if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
            SparkProgressBridge.applyLegacyActivityRuntime({setFields:{songAudioImporting:false}});
          }else{
            S.songAudioImporting=false;
          }
          render();return;
        }

        var stemNames=Object.keys(stemPaths);
        var urlMap={};

        function loadNextUrl(idx){
          if(idx>=stemNames.length){
            S.songAudioData[importSongId]={
              mp3Path:result.filePath,
              detectedBpm:null,
              stemPaths:stemPaths,
              stemUrls:urlMap,
              importedAt:new Date().toISOString()
            };
            if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
              SparkProgressBridge.applyLegacyActivityRuntime({setFields:{songAudioImporting:false,songAudioProgress:0},save:false});
            }else{
              S.songAudioImporting=false;
              S.songAudioProgress=0;
            }
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
        if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
          SparkProgressBridge.applyLegacyActivityRuntime({setFields:{songAudioImporting:false,songAudioProgress:0}});
        }else{
          S.songAudioImporting=false;
          S.songAudioProgress=0;
        }
        alert("Stem separation failed: "+(err.message||err));
        render();
      });
    });
    return;
  }
  if(a==="removeSongAudio"){
    delete S.songAudioData[v];
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
    var selectedSong = performanceSong && performanceSong.songData ? performanceSong.songData : S.performSongData;
    var selectedSongIndex = coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceSongIndex")
      ? coreView.runtimeState.performanceSongIndex
      : null;
    var selectedSongTitle = coreView && coreView.runtimeState && coreView.runtimeState.performanceSongTitle
      ? coreView.runtimeState.performanceSongTitle
      : (selectedSong && selectedSong.title ? selectedSong.title : null);
    var arrangementType = performanceSong && performanceSong.arrangementType ? performanceSong.arrangementType : S.performArrangementType;
    var difficultyId = coreView && coreView.runtimeState && coreView.runtimeState.performanceDifficultyId
      ? coreView.runtimeState.performanceDifficultyId
      : S.performDifficulty;
    var speed = coreView && coreView.runtimeState && coreView.runtimeState.performanceSpeed
      ? coreView.runtimeState.performanceSpeed
      : S.performSpeed;
    var targetTechnique = coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceTargetTechnique")
      ? coreView.runtimeState.performanceTargetTechnique
      : S.performTargetTechnique;
    if(selectedSong){
      var chart=buildPerformanceChartFromSong(selectedSong,"builtin",arrangementType);
      if(chart){
        var startRequest = startSelectedPerformanceSongRequest({
          chart: chart,
          chartId: chart.id || null,
          songIndex: selectedSongIndex,
          songTitle: selectedSongTitle,
          difficulty: difficultyId,
          arrangementType: arrangementType,
          speed: speed,
          targetTechnique: targetTechnique,
          preset: S.performPracticePreset,
          mode: S.performMode,
          countIn: !!S.performCountIn
        });
        startPerformance(chart,{difficulty:startRequest.difficulty,speed:startRequest.speed,preset:startRequest.preset,mode:startRequest.mode});
      }
    }
    return;
  }
  if(a==="performSongBack"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{performTargetTechnique:null}});
    }else{
      S.performTargetTechnique=null;
    }
    applyPerformanceNavigationRequest("songs_home");
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.HOME,tab:TAB.SONGS}});
    }else{
      S.screen=SCR.HOME;S.tab=TAB.SONGS;
    }
    render();return;
  }
  if(a==="pausePerform"){pausePerformance();return;}
  if(a==="resumePerform"){resumePerformance();return;}
  if(a==="stopPerform"){
    stopPerformance();
    var performanceStopState = applyPerformanceNavigationRequest("return_after_stop");
    var shouldReturnToSong = performanceStopState && performanceStopState.activeScreen === "performance_song";
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({setFields:shouldReturnToSong?{screen:SCR.PERFORM_SONG}:{screen:SCR.HOME,tab:TAB.SONGS}});
    }else{
      if(shouldReturnToSong){S.screen=SCR.PERFORM_SONG;}else{S.screen=SCR.HOME;S.tab=TAB.SONGS;}
    }
    render();return;
  }
  if(a==="performMode"){
    S.performMode=v;S.performInputSource=v;PerformanceInput.start(v);
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", { mode: v });
    }
    saveState();render();return;
  }
  if(a==="performDifficulty"){
    applyPerformanceDifficultyToState(v||"normal");
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", {
        difficulty: S.performDifficulty,
        songIndex: window.sparkCore.getRuntimeState().performanceSongIndex,
        songTitle: window.sparkCore.getRuntimeState().performanceSongTitle
      });
    }
    saveState();render();return;
  }
  if(a==="performSpeed"){
    S.performSpeed=parseFloat(v);PerformanceTransport.setSpeed(S.performSpeed);
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", {
        speed: S.performSpeed,
        songIndex: window.sparkCore.getRuntimeState().performanceSongIndex,
        songTitle: window.sparkCore.getRuntimeState().performanceSongTitle
      });
    }
    saveState();render();return;
  }
  if(a==="performLoopPhrase"){
    var ph=getPerformancePhraseForTime(S.performChart,S.performCurrentSec);
    if(ph)setPerformanceLoop({startSec:ph.startSec,endSec:ph.endSec,phraseId:ph.id});
    return;
  }
  if(a==="performClearLoop"){clearPerformanceLoop();return;}
  if(a==="performPracticePreset"){
    applyPerformanceStemPreset(v);
    if(window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function"){
      window.sparkCore.syncPerformanceRuntimeState("configure", { preset: S.performPracticePreset });
    }
    render();return;
  }
  if(a==="performCalibrate"){startCalibration();return;}
  if(a==="performCalibrateTap"){recordCalibrationTap();return;}
  if(a==="performRetry"){
    var retryRequest=getPerformanceRetryRequest({
      chartId: S.performChartId
    });
    startPerformance(retryRequest.chartId,{
      difficulty:retryRequest.difficulty,
      speed:retryRequest.speed,
      preset:retryRequest.preset,
      mode:retryRequest.mode,
      targetTechnique: retryRequest.targetTechnique
    });return;
  }
  if(a==="performDebug"){S.performDebug=!S.performDebug;render();return;}
  if(a==="performRetryPhrase"){
    if(S.performChart&&S.performResults&&S.performResults.phraseStats){
      var targetTechnique = null;
      if(window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"){
        var coreView = window.sparkCore.getActiveSessionView();
        if(coreView && coreView.runtimeState && Object.prototype.hasOwnProperty.call(coreView.runtimeState, "performanceTargetTechnique")){
          targetTechnique = coreView.runtimeState.performanceTargetTechnique;
        }
      }
      if(!targetTechnique) targetTechnique = S.performTargetTechnique || null;
      var candidateIndices = null;
      if(targetTechnique && typeof getPerformancePhraseIndicesForTechnique === "function"){
        candidateIndices = getPerformancePhraseIndicesForTechnique(S.performChart, targetTechnique);
        if(!candidateIndices || !candidateIndices.length) candidateIndices = null;
      }
      var weakIdx=candidateIndices && candidateIndices.length ? candidateIndices[0] : 0,weakAvg=Infinity;
      for(var wi=0;wi<S.performResults.phraseStats.length;wi++){
        if(candidateIndices && candidateIndices.indexOf(wi) === -1) continue;
        var wp=S.performResults.phraseStats[wi];
        var wa=wp.total>0?wp.scoreSum/wp.total:0;
        if(wa<weakAvg){weakAvg=wa;weakIdx=wi;}
      }
      var weakPhrase=S.performChart.phrases[weakIdx];
      if(weakPhrase){
        S.performTargetPhrase=weakIdx;
        var retryPhraseRequest=getPerformanceRetryRequest({
          chart: S.performChart,
          chartId: S.performChartId || (S.performChart && S.performChart.id) || "generated",
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
          if(S.performChart&&S.performChart.phrases[weakIdx]){
            var ph=S.performChart.phrases[weakIdx];
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
    S.rhythmHighwayHeldMask=(S.rhythmHighwayHeldMask&laneMask)?(S.rhythmHighwayHeldMask&~laneMask):(S.rhythmHighwayHeldMask|laneMask);
    render();return;
  }
  if(a==="rhythmHighwayStrum"){
    if(typeof _sparkRhythmHighwayStrum==="function")_sparkRhythmHighwayStrum();
    render();return;
  }
  if(a==="rhythmHighwayLoopWindow"){
    if(typeof _createRhythmHighwayLoopSpec==="function" && S.activeCoreSegmentId){
      var segment = window.sparkCore && typeof window.sparkCore.getSegmentById==="function" ? window.sparkCore.getSegmentById(S.activeCoreSegmentId) : null;
      var payload = segment && segment.meta ? segment.meta.gameplayPayload : null;
      var loopSpec = _createRhythmHighwayLoopSpec(payload, S.rhythmHighwaySnapshot);
      if(loopSpec && typeof startRhythmHighwaySegment==="function"){
        S.rhythmHighwayLoop=loopSpec;
        startRhythmHighwaySegment(S.activeCoreSegmentId,S.rhythmHighwayPreset,loopSpec);
        return;
      }
    }
    render();return;
  }
  if(a==="rhythmHighwayClearLoop"){
    S.rhythmHighwayLoop=null;
    if(S.activeCoreSegmentId&&typeof startRhythmHighwaySegment==="function"){
      startRhythmHighwaySegment(S.activeCoreSegmentId,S.rhythmHighwayPreset,null);
      return;
    }
    render();return;
  }
  if(a==="restartRhythmHighway"){
    if(S.activeCoreSegmentId&&typeof startRhythmHighwaySegment==="function")startRhythmHighwaySegment(S.activeCoreSegmentId,S.rhythmHighwayPreset,S.rhythmHighwayLoop);
    return;
  }
  // === MIDI Device/Profile Actions ===
  if(a==="setMidiDevice"){S.activeMidiDeviceId=v;syncMidiSettingsStateRequest();saveState();render();return;}
  if(a==="setMidiProfile"){if(typeof setActiveMidiProfile==="function")setActiveMidiProfile(v);syncMidiSettingsStateRequest();render();return;}
  if(a==="createDefaultPianoProfile"){if(typeof createDefaultPianoProfile==="function")createDefaultPianoProfile();syncMidiSettingsStateRequest();render();return;}
  if(a==="createDefaultGuitarProfile"){if(typeof createDefaultGuitarProfile==="function")createDefaultGuitarProfile();syncMidiSettingsStateRequest();render();return;}
  if(a==="openMidiSettings"){
    openUtilityScreenRequest("midi_settings");
    syncMidiSettingsStateRequest();
    S.screen=SCR.MIDI_SETTINGS;render();return;
  }
  // === MIDI Import Actions ===
  if(a==="openMidiImport"){
    openUtilityScreenRequest("midi_import");
    syncMidiImportStateRequest();
    S.screen=SCR.MIDI_IMPORT;render();return;
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
      var chart=buildSeedChartFromImportedMidi(S.importedMidi,S.importedMidiAssignments,v);
      S.importedMidiSeedPreview=chart;
      syncMidiImportStateRequest({ seedMode: v, seedChart: chart });
      if(chart&&typeof openEditor==="function"){openEditor("chart",chart);}
      else{render();}
    }return;
  }
  // === Cloud Sync Actions ===
  if(a==="cloudSync"){applyCloudWorkflowRequest("sync_start",{lastSyncStatus:"syncing"});if(typeof syncSparkNow==="function")syncSparkNow();return;}
  if(a==="cloudPull"){applyCloudWorkflowRequest("pull_start",{lastSyncStatus:"syncing"});if(typeof pullSparkCloud==="function")pullSparkCloud();return;}
  if(a==="cloudLogout"){if(typeof logoutSpark==="function")logoutSpark();applyCloudWorkflowRequest("logout");render();return;}
  if(a==="cloudLoginPrompt"){
    var email=prompt("Email:");
    var password=prompt("Password:");
    if(email&&password&&typeof loginSpark==="function"){
      loginSpark(email,password).then(function(){applyCloudWorkflowRequest("login");render();});
    }return;
  }
  if(a==="openCloudSettings"){openUtilityScreenRequest("cloud_settings");applyCloudWorkflowRequest("open");S.screen=SCR.CLOUD_SETTINGS;render();return;}
  // === Desktop Actions ===
  if(a==="checkUpdates"){if(typeof checkForDesktopUpdates==="function")checkForDesktopUpdates();return;}
  if(a==="exportBackup"){if(typeof exportFullBackupDesktopAware==="function")exportFullBackupDesktopAware();return;}
  if(a==="exportFeedback"){if(typeof exportFeedbackDesktopAware==="function")exportFeedbackDesktopAware();return;}
  // === Curriculum ===
  if(a==="openCurriculum"){
    openUtilityScreenRequest("curriculum");
    syncCurriculumStateRequest();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function")SparkProgressBridge.applyLegacyActivityRuntime({setFields:{screen:SCR.CURRICULUM}});
    else S.screen=SCR.CURRICULUM;
    render();return;
  }
  // === Back ===
  if(a==="back"){
      var _dashboardBack = S.screen===SCR.RECOMMENDATIONS||S.screen===SCR.INSIGHTS||S.screen===SCR.CHALLENGES||S.screen===SCR.CAREER||S.screen===SCR.HOME_DASH;
      var _utilityBack = S.screen===SCR.SETTINGS||S.screen===SCR.CLOUD_SETTINGS||S.screen===SCR.CURRICULUM||S.screen===SCR.MIDI_SETTINGS||S.screen===SCR.MIDI_IMPORT;
      var _dailyBack = S.screen===SCR.DAILY;
      if(S.screen===SCR.SONG||S.screen===SCR.SONG_DONE){
        applySongNavigationRequest("songs_home");
      }
      if(_dailyBack){
        returnFromLegacyDailyChallengeRequest({ activeTab: "daily" });
      }
      if(_utilityBack){
        returnFromUtilityFamilyRequest({
          currentScreen: S.screen===SCR.SETTINGS ? "settings"
            : S.screen===SCR.CLOUD_SETTINGS ? "cloud_settings"
            : S.screen===SCR.CURRICULUM ? "curriculum"
            : S.screen===SCR.MIDI_SETTINGS ? "midi_settings"
            : "midi_import"
        });
      }else if(!_dailyBack){
        returnFromHomeFamilyRequest({ currentScreen: _dashboardBack ? "home_dash" : "home" });
      }
      stopAllTimers();
      if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
        SparkProgressBridge.applyLegacyActivityRuntime({setFields:{selectedVoicing:0,screen:_dashboardBack?SCR.HOME_DASH:SCR.HOME,tab:_dailyBack?TAB.DAILY:S.tab}});
      }else{
        S.selectedVoicing=0;S.screen=_dashboardBack?SCR.HOME_DASH:SCR.HOME;
        if(_dailyBack)S.tab=TAB.DAILY;
      }
      render();
    }
};

// ===== RENDER =====
function applyTheme(){
  // Dark is default; light mode is the override
  if(S.darkMode){document.body.classList.remove("light");}
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

  // Launcher gate — if no instrument active, show clean launcher
  if (!S.activeInstrument) {
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

  document.getElementById("hdr-xp").textContent=S.xp;
  document.getElementById("hdr-str").textContent=S.streak;
  document.getElementById("snd-btn").textContent=S.soundOn?"\uD83D\uDD0A":"\uD83D\uDD07";
  document.getElementById("snd-btn").style.opacity=S.soundOn?1:0.4;
  document.getElementById("dark-btn").textContent=S.darkMode?"\uD83C\uDF19":"\u2600\uFE0F";
  var h="";
  if(S.showConfetti){
    var cols=["#FF6B6B","#4ECDC4","#45B7D1","#FFE66D","#96CEB4","#FF8A5C"];
    h+='<div style="position:fixed;inset:0;pointer-events:none;z-index:999">';
    for(var i=0;i<40;i++)
      h+='<div style="position:absolute;left:'+Math.random()*100+'%;top:-20px;width:10px;height:10px;border-radius:'+(Math.random()>0.5?"50%":"2px")+';background:'+cols[i%6]+';animation:cF '+(1.5+Math.random())+'s ease-in forwards;animation-delay:'+Math.random()*0.5+'s"></div>';
    h+='</div>';
  }
  if(S.newBadge)
    h+='<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:16px 32px;box-shadow:0 8px 30px rgba(255,138,92,.4);animation:sD .5s ease;text-align:center"><div style="font-size:32px">'+S.newBadge.icon+'</div><div style="font-weight:800;font-size:16px;color:#333">'+S.newBadge.label+'</div><div style="font-size:12px;color:#555">'+S.newBadge.desc+'</div></div>';
  if(S.showUndoToast)
    h+='<div class="undo-toast"><span>Progress reset.</span><button onclick="act(\'undoReset\')">Undo</button><span class="countdown">'+S.undoTimer+'</span></div>';
  // XP toast (jackpot gets special fire styling)
  if(S.xpToast&&Date.now()-S.xpToast.time<1500){
    if(S.xpToast.jackpot)
      h+='<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:12px 28px;box-shadow:0 6px 24px rgba(255,138,92,.6);animation:sD .3s ease;font-weight:900;color:#fff;font-size:20px;text-align:center">&#127873; JACKPOT! +'+S.xpToast.amount+' XP!</div>';
    else
      h+='<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#4ECDC4,#45B7D1);border-radius:16px;padding:8px 20px;box-shadow:0 4px 15px rgba(78,205,196,.4);animation:sD .3s ease;font-weight:800;color:#fff;font-size:16px">+'+S.xpToast.amount+' XP!</div>';
  }
  // Micro-achievement toast
  if(S.microToast&&Date.now()-S.microToast.time<2000)
    h+='<div style="position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:16px;padding:10px 24px;box-shadow:0 4px 15px rgba(255,138,92,.4);animation:sD .3s ease;text-align:center"><span style="font-size:20px;margin-right:6px">'+S.microToast.icon+'</span><span style="font-weight:800;color:#333;font-size:15px">'+S.microToast.msg+'</span></div>';
  // Break reminder
  var _contMin=(Date.now()-S.sessionStartTime)/60000;
  if(S.sessionStartTime>0&&_contMin>=20&&!S.breakDismissed)
    h+='<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#45B7D1,#4ECDC4);border-radius:16px;padding:12px 24px;box-shadow:0 4px 20px rgba(69,183,209,.4);animation:sD .5s ease;text-align:center;max-width:320px"><div style="font-size:20px;margin-bottom:4px">&#9749;</div><div style="font-weight:800;color:#fff;font-size:14px">Nice focus! Take a quick break?</div><div style="font-size:11px;color:rgba(255,255,255,.8);margin:4px 0">You\'ve been practicing for '+Math.floor(_contMin)+' min straight</div><button onclick="act(\'dismissBreak\')" style="margin-top:6px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:10px;padding:6px 16px;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Got it!</button></div>';
  // Shortcut overlay
  if(S.showShortcuts)h+=shortcutOverlay();

  // Onboarding overlay — shown once on first launch
  if(!S.onboardingDone){
    h+='<div style="position:fixed;inset:0;z-index:2000;background:var(--body-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;overflow:auto">';
    h+='<div style="font-size:56px;margin-bottom:12px">&#127930;</div>';
    h+='<h1 style="font-size:24px;font-weight:900;color:var(--text-primary);margin:0 0 8px">Welcome to SparkSuite!</h1>';
    h+='<p style="color:var(--text-dim);font-size:14px;margin:0 0 24px;max-width:300px">People who set a specific practice trigger are 2-3x more likely to follow through. Set yours now.</p>';
    h+='<div class="card" style="width:100%;max-width:340px;text-align:left;margin-bottom:20px">';
    h+='<p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0 0 8px">Complete this sentence:</p>';
    h+='<p style="font-size:14px;color:var(--text-muted);margin:0 0 8px">&#8220;Every day, when I&nbsp;&hellip;</p>';
    h+='<input type="text" id="intention-input" class="set-input" placeholder="finish dinner, make coffee..." value="'+escHTML(S.practiceIntention)+'" oninput="act(\'setIntention\',this.value)" style="margin-bottom:8px" aria-label="Practice trigger"/>';
    h+='<p style="font-size:14px;color:var(--text-muted);margin:0">&#8230;&nbsp;I will open SparkSuite.&#8221;</p>';
    h+='</div>';
    h+='<button class="btn" onclick="act(\'completeOnboarding\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:14px 40px;font-size:17px;font-weight:800">Let\'s Go!</button>';
    h+='<button onclick="act(\'completeOnboarding\')" style="margin-top:14px;background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer">Skip for now</button>';
    h+='</div>';
  }

  var screenKey=S.screen+S.tab;
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

  // Instrument override: if active instrument provides a page for this screen, use it
  var _instrumentPage = SparkInstruments.getPage(S.screen);
  var _renderer = _instrumentPage || _sharedPages[S.screen] || null;
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
  if(S.showShortcuts){var cb=document.getElementById("shortcut-close-btn");if(cb)cb.focus();}
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
    if(S.showShortcuts){S.showShortcuts=false;render();return;}
    if(S.screen!==SCR.HOME){act("back");}
    return;
  }

  // Space - pause/resume
  if(key===" "){
    e.preventDefault();
    if(S.screen===SCR.RHYTHM_HIGHWAY){act("rhythmHighwayStrum");return;}
    if(S.screen===SCR.SESSION){act("toggleTimer");return;}
    if(S.screen===SCR.STRUM){act("toggleStrum");return;}
    if(S.screen===SCR.SONG){act("toggleSong");return;}
    if(S.screen===SCR.PERFORM){
      if(S.performPaused){act("resumePerform");return;}
      // Spacebar = simulate strum hit (injects the exact target notes the scorer expects)
      if(S.performPlaying && S.performChart){
        var nowSec=PerformanceTransport.now();
        var chart=S.performChart;
        for(var si=0;si<chart.events.length;si++){
          var evt=chart.events[si];
          if(evt._scored)continue;
          var delta=Math.abs(nowSec-evt.t)*1000;
          if(delta<(S.performWindowMissMs||220)){
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
    if(S.screen===SCR.HOME&&S.tab===TAB.RHYTHM&&S.rhythmActive){act("rhythmTap");return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.RUNNER&&S.runnerActive){act("runnerStrum");return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.BUILD&&S.progChords.length>=2){act("progPlay");return;}
    return;
  }

  // Enter - context-sensitive confirm
  if(key==="Enter"){
    if(S.screen===SCR.RHYTHM_HIGHWAY){act("rhythmHighwayStrum");return;}
    if(S.screen===SCR.DRILL){act("drillSwitch");return;}
    return;
  }

  if(S.screen===SCR.RHYTHM_HIGHWAY&&key>="1"&&key<="5"){
    act("rhythmHighwayLane", String(parseInt(key,10)-1));
    return;
  }

  // Arrow keys - BPM adjustment
  if(key==="ArrowLeft"||key==="ArrowRight"){
    var delta=key==="ArrowRight"?5:-5;
    if(S.screen===SCR.SESSION&&S.metronomeOn){act("metroBpm",""+(S.metronomeBpm+delta));return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.RHYTHM&&!S.rhythmActive){act("rhythmBpm",""+(S.rhythmBpm+(delta>0?10:-10)));return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.BUILD){act("progBpm",""+(S.progBpm+delta));return;}
    return;
  }

  // Up/Down - level navigation
  if(key==="ArrowUp"||key==="ArrowDown"){
    if(S.screen===SCR.HOME&&S.tab===TAB.PRACTICE){
      var nl=S.selectedLevel+(key==="ArrowUp"?-1:1);
      if(nl>=1&&nl<=S.level){act("selLevel",""+nl);}
      return;
    }
    return;
  }

  // Perform mode shortcuts
  if(S.screen===SCR.PERFORM||S.screen===SCR.PERFORM_DONE){
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
    if(S.screen===SCR.SESSION){act("toggleMetro");return;}
    return;
  }

  // S - toggle sound (shift+S to avoid conflict)
  if(key==="S"){
    S.soundOn=!S.soundOn;saveState();render();return;
  }

  // D - toggle dark mode
  if(key==="d"||key==="D"){
    act("toggleDark");return;
  }

  // Number keys 1-9 for quick tab switching
  if(key>="1"&&key<="9"&&S.screen===SCR.HOME){
    var tabList=[TAB.PRACTICE,TAB.DRILL,TAB.DAILY,TAB.QUIZ,TAB.EAR,TAB.STRUM,TAB.SONGS,TAB.RHYTHM,TAB.BUILD];
    var idx=parseInt(key)-1;
    if(idx<tabList.length){act("tab",tabList[idx]);}
    return;
  }
  // 0 for stats, - for tuner, = for guide
  if(key==="0"&&S.screen===SCR.HOME){act("tab",TAB.STATS);return;}
});

// ===== INITIALIZATION =====
S.dailyChallenge=DAILY_CHALLENGES[Math.floor(Date.now()/86400000)%DAILY_CHALLENGES.length];
try{if(typeof generatePracticePlan==="function")generatePracticePlan();}catch(e){}
applyTheme();
// Init MIDI if previously enabled
if(S.midiEnabled){try{initMIDI();}catch(e){console.error("ChordSpark: MIDI init failed",e);}}
// Preload guitar WAV samples
try{preloadGuitarAudio();}catch(e){console.error("ChordSpark: guitar audio preload failed",e);}
document.getElementById("no-js").style.display="none";
document.getElementById("header").style.display=S.activeInstrument?"flex":"none";
document.getElementById("app").style.display="block";
// Activate remembered instrument
if(S.activeInstrument){try{SparkInstruments.activate(S.activeInstrument);}catch(e){console.error("SparkSuite: instrument activate failed",e);}}
try{if(typeof choosePerformanceDailyChallenge==="function")choosePerformanceDailyChallenge();}catch(e){}
render();
