// ===== TIMERS =====
// Variable reinforcement schedule: reward density thins as sessions accumulate
// (Stretching the Ratios — builds extinction-resistant practice habits)
function shouldFireReward(){
  var n=S.sessions;
  if(n<=5)return true;          // Phase 1: continuous (sessions 1-5)
  if(n<=14)return Math.random()<0.33; // Phase 2: VR-3 (sessions 6-14)
  if(n<=30)return Math.random()<0.14; // Phase 3: VR-7 (sessions 15-30)
  return Math.random()<0.10;    // Phase 4: VR-10 (sessions 30+)
}

function tickS(){
  if(S.timerActive&&S.timer>0){
    S.timer--;
    if(S.timer%30===0&&S.timer>0&&shouldFireReward()){snd("tick");S.xp+=5;S.xpToast={amount:5,time:Date.now()};saveState();}
    else if(S.timer%30===0&&S.timer>0){S.xp+=5;} // silent XP accrual when toast skipped
    if(S.timer===60)fireMicro("halfway","Halfway there!","&#128170;");
    addPracticeSecond();
    render();T.session=setTimeout(tickS,1000);
  } else if(S.timerActive&&S.timer<=0){
    S.timerActive=false;clearTimeout(T.session);
    if(S.metronomeOn)stopMetronome();
    if(S.chordDetectOn)stopChordDetect();
    var today=new Date().toISOString().slice(0,10);
    if(S.lastSessionDate!==today){S.streak++;S.lastSessionDate=today;}
    S.sessions++;
    // Jackpot: 1-in-15 chance of surprise XP bonus (RPE optimisation)
    var jackpot=Math.random()<(1/15);
    var xpEarned=jackpot?50:10;
    S.xp+=xpEarned;
    S.xpToast={amount:xpEarned,time:Date.now(),jackpot:jackpot};
    if(jackpot){snd("levelup");}else{snd("complete");}
    var k=S.currentChord.name;
    S.chordProgress[k]=Math.min((S.chordProgress[k]||0)+34,100);
    var a=true;var ch=CHORDS[S.level]||[];
    for(var i=0;i<ch.length;i++)if((S.chordProgress[ch[i].name]||0)<100)a=false;
    if(a&&S.level<8){S.level++;snd("levelup");}
    logHistory("session",k,xpEarned);
    _sparkEmit("practice_session_completed", { appId: "chordspark", type: "session", xp: xpEarned, chord: k });
    checkBadges();saveState();trigC();S.screen=SCR.COMPLETE;render();
  }
}

function tickD(){
  if(S.screen===SCR.DRILL&&S.drillTimer>0){
    S.drillTimer--;
    if(S.drillTimer%30===0&&S.drillTimer>0&&shouldFireReward()){snd("tick");S.xp+=5;S.xpToast={amount:5,time:Date.now()};saveState();}
    else if(S.drillTimer%30===0&&S.drillTimer>0){S.xp+=5;}
    addPracticeSecond();
    if(!updateDrillTimerUI())render(); // partial update if elements exist
    T.drill=setTimeout(tickD,1000);
  } else if(S.screen===SCR.DRILL&&S.drillTimer<=0){
    clearTimeout(T.drill);snd("complete");S.drillCount++;S.xp+=20;
    S.xpToast={amount:20,time:Date.now()};
    var detail=S.drillChords.map(function(c){return c.name;}).join(" / ");
    logHistory("drill",detail,20);
    _sparkEmit("practice_session_completed", { appId: "chordspark", type: "drill", xp: 20, detail: detail });
    checkBadges();saveState();trigC();S.screen=SCR.DRILL_DONE;render();
  }
}

function tickDy(){
  if(S.screen===SCR.DAILY&&S.dailyTimer>0&&!S.dailyComplete){
    S.dailyTimer--;addPracticeSecond();
    if(!updateDailyTimerUI())render(); // partial update if elements exist
    T.daily=setTimeout(tickDy,1000);
  } else if(S.screen===SCR.DAILY&&S.dailyTimer<=0&&!S.dailyComplete){
    clearTimeout(T.daily);snd("complete");S.dailyComplete=true;S.dailyDone++;
    var xp=(S.dailyChallenge&&S.dailyChallenge.xp)||40;
    S.xp+=xp;S.xpToast={amount:xp,time:Date.now()};
    logHistory("daily",S.dailyChallenge?S.dailyChallenge.title:"Challenge",xp);
    checkBadges();saveState();trigC();render();
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
  render();
  _rhythmAnim=requestAnimationFrame(rhythmTick);
}

function finishRhythm(){
  S.rhythmActive=false;
  if(_rhythmAnim)cancelAnimationFrame(_rhythmAnim);
  var total=S.rhythmBeats.length,hits=0;
  for(var i=0;i<total;i++)if(S.rhythmBeats[i].result==="perfect"||S.rhythmBeats[i].result==="good")hits++;
  var acc=total>0?Math.round((hits/total)*100):0;
  S.rhythmResults={score:S.rhythmScore,accuracy:acc,maxCombo:S.rhythmMaxCombo,total:total,hits:hits};
  var xp=Math.round(S.rhythmScore/10);
  if(xp>0){S.xp+=xp;logHistory("rhythm","Score: "+S.rhythmScore,xp);saveState();}
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
}

function finishRunner(){
  S.runnerActive=false;
  if(_runnerAnim)cancelAnimationFrame(_runnerAnim);
  if(S.runnerScore>S.runnerHighScore)S.runnerHighScore=S.runnerScore;
  S.runnerResults={score:S.runnerScore,maxCombo:S.runnerMaxCombo,distance:Math.floor(S.runnerDistance/100)};
  var xp=Math.round(S.runnerScore/20);
  if(xp>0){S.xp+=xp;logHistory("runner","Score: "+S.runnerScore,xp);saveState();}
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
  if(S.rhythmActive){S.rhythmActive=false;if(_rhythmAnim)cancelAnimationFrame(_rhythmAnim);}
  if(S.runnerActive){S.runnerActive=false;if(_runnerAnim)cancelAnimationFrame(_runnerAnim);}
  if(S.progPlaying){S.progPlaying=false;}
  cleanupStems();S.stemPlaying=false;
  S.timerActive=false;S.strumActive=false;S.songPlaying=false;
  if(!_performStopping&&(S.performPlaying||S.performPaused)){stopPerformance();}
}

// Helper to emit suite events safely
function _sparkEmit(type, payload) {
  if (typeof SparkEvents !== "undefined") SparkEvents.emit(type, payload);
}

// ===== ACTION DISPATCHER =====
window.act=function(a,v){
  if(a==="tab"){
    S.tab=v;S.screen=SCR.HOME;
    stopAllTimers();
    S.earTrainQ=null;S.earTrainAns=null;S.selectedVoicing=0;
    if(v===TAB.SONGS&&S.songsSubTab==="community")fetchCommunity();
    render();return;
  }
  if(a==="selLevel"&&parseInt(v)<=S.level){S.selectedLevel=parseInt(v);render();return;}
  if(a==="quickStart"){
    var avail=CHORDS[S.level]||CHORDS[1];
    var ch=avail[Math.floor(Math.random()*avail.length)];
    S.sessionMicros=[];S.lastChordName=ch.name;
    snd("start");S.currentChord=ch;S.timer=120;S.timerActive=true;S.selectedVoicing=0;S.screen=SCR.SESSION;render();clearTimeout(T.session);T.session=setTimeout(tickS,1000);saveState();
    return;
  }
  if(a==="resumeSession"){
    var ch=null;for(var i=0;i<ALL_CHORDS.length;i++)if(ALL_CHORDS[i].name===S.lastChordName)ch=ALL_CHORDS[i];
    if(!ch){act("quickStart");return;}
    S.sessionMicros=[];
    snd("start");S.currentChord=ch;S.timer=120;S.timerActive=true;S.selectedVoicing=0;_prevChordKey=ch.name;S.screen=SCR.SESSION;render();clearTimeout(T.session);T.session=setTimeout(tickS,1000);
    return;
  }
  if(a==="startSession"){
    var ch;for(var i=0;i<ALL_CHORDS.length;i++)if(ALL_CHORDS[i].name===v)ch=ALL_CHORDS[i];
    if(ch){S.sessionMicros=[];S.lastChordName=ch.name;snd("start");S.currentChord=ch;S.timer=120;S.timerActive=true;S.selectedVoicing=0;_prevChordKey=ch.name;S.screen=SCR.SESSION;render();clearTimeout(T.session);T.session=setTimeout(tickS,1000);saveState();}
    return;
  }
  if(a==="toggleTimer"){
    S.timerActive=!S.timerActive;
    if(S.timerActive)T.session=setTimeout(tickS,1000);else clearTimeout(T.session);
    render();return;
  }
  if(a==="doneSession"){
    clearTimeout(T.session);if(S.metronomeOn)stopMetronome();if(S.chordDetectOn)stopChordDetect();
    S.timerActive=true;S.timer=0;tickS();return;
  }
  if(a==="startDrill"){
    var av=CHORDS[S.level]||CHORDS[1];
    var c1=av[Math.floor(Math.random()*av.length)],c2=c1,n=0;
    while(c2.name===c1.name&&av.length>1&&n<20){c2=av[Math.floor(Math.random()*av.length)];n++;}
    S.drillChords=[c1,c2];S.drillIdx=0;S.drillTimer=60;S.drillSwitches=0;S.drillLastSwitchTime=Date.now();
    S.drillAdaptiveBpm=60;S.drillConsecutiveFast=0;S.drillConsecutiveSlow=0;
    _prevChordKey=c1.name;
    snd("start");S.screen=SCR.DRILL;render();T.drill=setTimeout(tickD,1000);return;
  }
  if(a==="drillSwitch"){
    snd("click");
    var now=Date.now();
    var fromChord=S.drillChords[S.drillIdx].name;
    var toChord=S.drillChords[(S.drillIdx+1)%2].name;
    var elapsed=(now-S.drillLastSwitchTime)/1000;
    S.drillLastSwitchTime=now;
    if(elapsed<15){
      var key=fromChord+"->"+toChord;
      if(!S.transitionStats[key])S.transitionStats[key]={attempts:0,avgTime:0,best:999};
      var ts=S.transitionStats[key];
      ts.avgTime=(ts.avgTime*ts.attempts+elapsed)/(ts.attempts+1);
      ts.attempts++;
      if(elapsed<ts.best)ts.best=elapsed;
      // Adaptive BPM: adjust target tempo based on switch speed performance
      var targetSecs=60/S.drillAdaptiveBpm;
      if(elapsed<targetSecs*0.8){
        S.drillConsecutiveFast++;S.drillConsecutiveSlow=0;
        if(S.drillConsecutiveFast>=3){
          S.drillAdaptiveBpm=Math.min(S.drillAdaptiveBpm+3,160);
          S.drillConsecutiveFast=0;
          fireMicro("speed_up","Speeding up!","&#9654;&#65039;");
        }
      }else if(elapsed>targetSecs*1.5){
        S.drillConsecutiveSlow++;S.drillConsecutiveFast=0;
        if(S.drillConsecutiveSlow>=2){
          S.drillAdaptiveBpm=Math.max(S.drillAdaptiveBpm-5,40);
          S.drillConsecutiveSlow=0;
        }
      }else{S.drillConsecutiveFast=0;S.drillConsecutiveSlow=0;}
    }
    _prevChordKey=fromChord;
    S.drillIdx=(S.drillIdx+1)%2;S.drillSwitches++;
    if(S.drillSwitches===1)fireMicro("clean_switch","Smooth switch!","&#9889;");
    if(S.drillSwitches===3)fireMicro("three_switches","On fire!","&#128293;");
    render();return;
  }
  if(a==="drillTransition"){
    var parts=v.split("|");
    var c1=null,c2=null;
    for(var i=0;i<ALL_CHORDS.length;i++){
      if(ALL_CHORDS[i].name===parts[0])c1=ALL_CHORDS[i];
      if(ALL_CHORDS[i].name===parts[1])c2=ALL_CHORDS[i];
    }
    if(c1&&c2){
      S.drillChords=[c1,c2];S.drillIdx=0;S.drillTimer=60;S.drillSwitches=0;S.drillLastSwitchTime=Date.now();
      S.drillAdaptiveBpm=60;S.drillConsecutiveFast=0;S.drillConsecutiveSlow=0;
      _prevChordKey=c1.name;
      snd("start");S.screen=SCR.DRILL;render();T.drill=setTimeout(tickD,1000);
    }return;
  }
  if(a==="startDaily"&&S.dailyChallenge){
    var t=S.dailyChallenge.id==="hold"?30:S.dailyChallenge.id==="marathon"?180:60;
    S.dailyTimer=t;S.dailyComplete=false;snd("start");S.screen=SCR.DAILY;render();T.daily=setTimeout(tickDy,1000);return;
  }
  if(a==="completeDaily"){
    clearTimeout(T.daily);snd("complete");S.dailyComplete=true;S.dailyDone++;
    var xp=(S.dailyChallenge&&S.dailyChallenge.xp)||40;
    S.xp+=xp;
    logHistory("daily",S.dailyChallenge?S.dailyChallenge.title:"Challenge",xp);
    checkBadges();saveState();trigC();render();return;
  }
  if(a==="startQuiz"){S.quizScore=0;S.quizTotal=0;S.quizStreak=0;genQ();S.screen=SCR.QUIZ;return;}
  if(a==="answerQuiz"&&S.quizAns===null){
    var ch;for(var i=0;i<ALL_CHORDS.length;i++)if(ALL_CHORDS[i].name===v)ch=ALL_CHORDS[i];
    if(ch){
      var ok=ch.name===S.quizQ.name;S.quizAns=ch.name;
      if(ok){snd("correct");S.quizCorrect++;S.quizScore++;S.quizStreak++;S.xp+=10;logHistory("quiz",S.quizQ.name,10);_sparkEmit("drill_answered", { appId: "chordspark", skillId: S.quizQ.name, correct: true, xp: 10 });checkBadges();saveState();if(S.quizStreak===3)fireMicro("quiz_streak","Hat trick!","&#127913;");}
      else{snd("wrong");S.quizStreak=0;}
      S.quizTotal++;render();setTimeout(genQ,1200);
    }return;
  }
  // === Ear Training ===
  if(a==="startEarTrain"){
    var av=[];for(var _l=1;_l<=S.level;_l++)av=av.concat(CHORDS[_l]||[]);if(!av.length)av=CHORDS[1];
    var q=av[Math.floor(Math.random()*av.length)];
    var opts=[q.name];
    var attempts=0;
    while(opts.length<4&&attempts<100){
      var r=ALL_CHORDS[Math.floor(Math.random()*ALL_CHORDS.length)];
      if(opts.indexOf(r.name)===-1)opts.push(r.name);
      attempts++;
    }
    opts=shuffle(opts);
    S.earTrainQ=q.name;S.earTrainOpts=opts;S.earTrainAns=null;
    S.earTrainScore=S.earTrainScore||0;S.earTrainTotal=S.earTrainTotal||0;S.earTrainStreak=S.earTrainStreak||0;
    strumChord(q.name);render();return;
  }
  if(a==="replayEarTrain"&&S.earTrainQ){strumChord(S.earTrainQ);return;}
  if(a==="answerEarTrain"&&S.earTrainAns===null){
    S.earTrainAns=v;
    var ok=v===S.earTrainQ;
    if(ok){snd("correct");S.earTrainScore++;S.earTrainStreak++;S.xp+=15;logHistory("ear",S.earTrainQ,15);checkBadges();saveState();}
    else{snd("wrong");S.earTrainStreak=0;}
    S.earTrainTotal++;render();
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
    if(sp&&sp.level<=S.level){S.selectedStrum=sp;S.strumActive=false;S._strumBeat=-1;clearInterval(T.strum);S.screen=SCR.STRUM;render();}return;
  }
  if(a==="toggleStrum"){
    snd("click");S.strumActive=!S.strumActive;
    if(S.strumActive){
      var p=S.selectedStrum.pattern,ms=60000/S.selectedStrum.bpm/(p.length>4?2:1);
      var _strumChordName=S.currentChord?S.currentChord.name:"E Major";
      S._strumBeat=0;if(p[0]!=="x")strumChord(_strumChordName);render();
      T.strum=setInterval(function(){S._strumBeat=(S._strumBeat+1)%p.length;if(p[S._strumBeat]!=="x")strumChord(_strumChordName);render();},ms);
    }else{clearInterval(T.strum);S._strumBeat=-1;render();}return;
  }
  // === Songs ===
  if(a==="songsSubTab"){
    S.songsSubTab=v;
    if(v==="community")fetchCommunity();
    render();return;
  }
  if(a==="openSong"){
    var sg=typeof v==="number"?SONGS[v]:null;
    if(!sg){for(var i=0;i<SONGS.length;i++)if(SONGS[i].title===v){sg=SONGS[i];break;}}
    if(sg&&sg.level<=S.level){S.selectedSong=sg;S.songPlaying=false;S.songBeat=0;clearInterval(T.song);S.screen=SCR.SONG;render();}return;
  }
  if(a==="toggleSong"){
    snd("click");S.songPlaying=!S.songPlaying;
    if(S.songPlaying){
      var ms=60000/S.selectedSong.bpm;S.songBeat=0;
      var cn=S.selectedSong.progression[0];strumChord(CHORD_NAME_MAP[cn]||cn);
      render();
      T.song=setInterval(function(){S.songBeat=(S.songBeat+1)%S.selectedSong.progression.length;var cn=S.selectedSong.progression[S.songBeat];strumChord(CHORD_NAME_MAP[cn]||cn);render();},ms);
    }else{clearInterval(T.song);render();}return;
  }
  if(a==="completeSong"){
    S.songPlaying=false;clearInterval(T.song);snd("complete");S.songsPlayed++;S.xp+=40;
    logHistory("song",S.selectedSong?S.selectedSong.title:"Song",40);
    _sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 });
    fireMicro("full_song","Rockstar!","&#127908;");
    checkBadges();saveState();trigC();S.screen=SCR.SONG_DONE;render();return;
  }
  // === Tuner ===
  if(a==="startTuner"){
    if(!AC){S.tunerErr="Audio not supported";render();return;}
    navigator.mediaDevices.getUserMedia(getAudioConstraint()).then(function(st){
      tunerR.stream=st;var ctx=new AC(),src=ctx.createMediaStreamSource(st),an=ctx.createAnalyser();
      an.fftSize=8192;src.connect(an); // Larger buffer for better low-freq accuracy
      tunerR.ctx=ctx;tunerR.analyser=an;S.tunerActive=true;S.tunerErr=null;
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
          }else if(f<0){
            S.tunerNote=null;S.tunerFreq=0;S.tunerCents=0;
          }
          // Targeted UI update instead of full render
          updateTunerUI();
        }
        tunerR.anim=requestAnimationFrame(det);
      }det();
    }).catch(function(){S.tunerErr="Microphone access denied";render();});return;
  }
  if(a==="stopTuner"){
    S.tunerActive=false;
    if(tunerR.anim)cancelAnimationFrame(tunerR.anim);
    if(tunerR.stream)tunerR.stream.getTracks().forEach(function(t){t.stop();});
    if(tunerR.ctx)tunerR.ctx.close();
    S.tunerNote=null;S.tunerFreq=0;S.tunerCents=0;render();return;
  }
  if(a==="toggleMetro"){if(S.metronomeOn)stopMetronome();else startMetronome();return;}
  if(a==="metroBpm"){
    var b=parseInt(v);
    if(b>=40&&b<=200){
      S.metronomeBpm=b;
      if(S.metronomeOn){clearInterval(T.metro);var ms=60000/b;T.metro=setInterval(function(){S._metroBeat=(S._metroBeat+1)%S._metroBeats;metroClick(S._metroBeat===0);render();},ms);}
      render();
    }return;
  }
  if(a==="toggleChordDetect"){if(S.chordDetectOn)stopChordDetect();else startChordDetect();return;}
  // Dark mode toggle
  if(a==="toggleDark"){S.darkMode=!S.darkMode;saveState();applyTheme();render();return;}
  // Onboarding
  if(a==="setIntention"){S.practiceIntention=v||"";return;}
  if(a==="completeOnboarding"){S.onboardingDone=true;saveState();render();return;}
  // New system screens
  if(a==="openRecommendations"){S.screen=SCR.RECOMMENDATIONS;render();return;}
  if(a==="openCareer"){S.screen=SCR.CAREER;render();return;}
  if(a==="openCareerSong"){
    if(typeof getContent==="function")S.currentSong=getContent("songs",v);
    S.screen=SCR.PERFORM_SONG;render();return;
  }
  if(a==="openInsights"){S.screen=SCR.INSIGHTS;render();return;}
  if(a==="openChallengeHub"){S.screen=SCR.CHALLENGES;render();return;}
  if(a==="openHomeDash"){S.screen=SCR.HOME_DASH;render();return;}
  if(a==="openSettings"){S.screen=SCR.SETTINGS;render();return;}
  if(a==="openOnboarding"){if(typeof startOnboarding==="function")startOnboarding();return;}
  if(a==="resumeOnboarding"){if(typeof continueOnboarding==="function")continueOnboarding();return;}
  if(a==="refreshHome"){
    if(typeof generateRecommendations==="function")generateRecommendations();
    if(typeof generatePersonalInsights==="function")generatePersonalInsights();
    render();return;
  }
  if(a==="launchRecommendation"){if(typeof launchRecommendationById==="function")launchRecommendationById(v);return;}
  if(a==="claimChallengeReward"){if(typeof claimChallengeReward==="function")claimChallengeReward(v);render();return;}
  if(a==="initChallenges"){if(typeof initializeChallengesForCurrentCycle==="function")initializeChallengesForCurrentCycle();render();return;}
  if(a==="openPracticePlan"){S.screen=SCR.PLAN;render();return;}
  if(a==="setTheme"){if(S.settings)S.settings.theme=v;if(typeof applyThemeSetting==="function")applyThemeSetting();saveState();render();return;}
  // Song sorting
  if(a==="songSort"){
    if(S.songSort===v){S.songSortAsc=!S.songSortAsc;}
    else{S.songSort=v;S.songSortAsc=true;}
    render();return;
  }
  if(a==="songFilter"){S.songFilter=v||"";render();return;}
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
  // Finger exercises
  if(a==="startFingerEx"){
    var ex=null;
    for(var fi=0;fi<FINGER_EXERCISES.length;fi++)if(FINGER_EXERCISES[fi].id===v){ex=FINGER_EXERCISES[fi];break;}
    if(!ex)return;
    S.fingerExId=v;S.fingerExTimer=ex.duration;S.fingerExActive=true;S.fingerExCount=0;
    snd("start");
    clearInterval(T.fingerEx);
    T.fingerEx=setInterval(function(){
      if(!S.fingerExActive)return;
      S.fingerExTimer--;
      addPracticeSecond();
      if(S.fingerExTimer<=0){
        clearInterval(T.fingerEx);S.fingerExActive=false;
        snd("complete");S.xp+=10;
        if(typeof S.fingerStats!=="object"||S.fingerStats===null)S.fingerStats={};
        S.fingerStats[v]=(S.fingerStats[v]||0)+1;
        S.xpToast={amount:10,time:Date.now()};
        saveState();
      }
      render();
    },1000);
    render();return;
  }
  if(a==="stopFingerEx"){
    clearInterval(T.fingerEx);S.fingerExActive=false;S.fingerExId=null;render();return;
  }
  // Guided sessions
  if(a==="guidedStart"){
    var plan=GUITAR_SESSIONS[S.guidedSession-1];
    if(!plan){S.guidedSession=1;plan=GUITAR_SESSIONS[0];}
    S.guidedPlan=plan;S.guidedStep="spark";S.newMovePhase=null;S.guidedPaused=false;
    S.screen=SCR.GUIDED;snd("start");render();return;
  }
  if(a==="guidedNext"){
    var steps=["spark","review","newMove","songSlice","victoryLap"];
    var idx=steps.indexOf(S.guidedStep);
    if(idx<steps.length-1){
      S.guidedStep=steps[idx+1];
      if(S.guidedStep==="newMove")S.newMovePhase="watch";
    }
    render();return;
  }
  if(a==="guidedAdvancePhase"){
    var phases=["watch","shadow","try","refine"];
    var pi=phases.indexOf(S.newMovePhase);
    if(pi<phases.length-1){S.newMovePhase=phases[pi+1];}
    else{act("guidedNext");return;} // refine done → advance to songSlice
    render();return;
  }
  if(a==="guidedComplete"){
    if(S.metronomeOn)stopMetronome();
    var plan=S.guidedPlan;
    if(plan){
      if(!Array.isArray(S.completedGuidedSessions))S.completedGuidedSessions=[];
      if(S.completedGuidedSessions.indexOf(plan.num)<0)S.completedGuidedSessions.push(plan.num);
      S.xp+=30;S.sessions++;
      var today=new Date().toISOString().split("T")[0];
      if(S.lastSessionDate!==today){S.streak++;S.lastSessionDate=today;}
      if(plan.newMove&&plan.newMove.chord){
        var k=plan.newMove.chord;
        S.chordProgress[k]=Math.min((S.chordProgress[k]||0)+25,100);
      }
      S.guidedSession=Math.min(GUITAR_SESSIONS.length,plan.num+1);
      logHistory("guided","Session "+plan.num+": "+plan.title,30);
      _sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "guided_" + plan.num, xp: 30 });
      checkBadges();
    }
    S.xpToast={amount:30,time:Date.now()};
    saveState();trigC();S.screen=SCR.GUIDED_DONE;render();return;
  }
  if(a==="guidedStop"){
    if(S.metronomeOn)stopMetronome();
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
  if(a==="drillCustomSet"){
    var idx=parseInt(v);
    if(idx>=0&&idx<S.customSets.length){
      var cs=S.customSets[idx];
      var pool=[];
      for(var i=0;i<cs.chords.length;i++){
        for(var j=0;j<ALL_CHORDS.length;j++){
          if(ALL_CHORDS[j].name===cs.chords[i]){pool.push(ALL_CHORDS[j]);break;}
        }
      }
      if(pool.length<2)return;
      var c1=pool[Math.floor(Math.random()*pool.length)],c2=c1,n=0;
      while(c2.name===c1.name&&pool.length>1&&n<20){c2=pool[Math.floor(Math.random()*pool.length)];n++;}
      S.drillChords=[c1,c2];S.drillIdx=0;S.drillTimer=60;S.drillSwitches=0;S.drillLastSwitchTime=Date.now();
      S.drillAdaptiveBpm=60;S.drillConsecutiveFast=0;S.drillConsecutiveSlow=0;
      _prevChordKey=c1.name;
      snd("start");S.screen=SCR.DRILL;render();T.drill=setTimeout(tickD,1000);
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
    S.rhythmBeats=beats;S.rhythmScore=0;S.rhythmCombo=0;S.rhythmMaxCombo=0;
    S.rhythmActive=true;S.rhythmResults=null;S.rhythmStartTime=performance.now();
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
      S.selectedSong=S.importedSongs[idx];S.songPlaying=false;S.songBeat=0;clearInterval(T.song);
      S.screen=SCR.SONG;render();
    }return;
  }
  // === Community ===
  if(a==="communityTab"){S.communityTab=v;render();return;}
  if(a==="communitySearch"){S.communitySearch=v;fetchCommunity();return;}
  if(a==="communitySort"){S.communitySort=v;fetchCommunity();return;}
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
      S.selectedSong=parsed;S.songPlaying=false;S.songBeat=0;clearInterval(T.song);
      S.screen=SCR.SONG;render();
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
    S.runnerTarget=av[Math.floor(Math.random()*av.length)];
    S.runnerActive=true;S.runnerScore=0;S.runnerCombo=0;S.runnerMaxCombo=0;
    S.runnerLives=3;S.runnerObstacles=[];S.runnerSpeed=2;S.runnerDistance=0;
    S.runnerResults=null;S.runnerStartTime=Date.now();S.runnerLastSpawn=0;
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
    render();return;
  }
  // === Stem Separation ===
  if(a==="stemOpenFile"){
    if(!window.electron)return;
    S.stemError=null;render();
    window.electron.stems.openFile().then(function(result){
      if(!result)return;
      S.stemFile=result;S.stemError=null;S.stemStatus="idle";render();
      // Check cache first
      window.electron.stems.checkCache(result.filePath).then(function(cached){
        if(cached){
          S.stemPaths=cached;S.stemStatus="ready";render();
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
    S.stemStatus="separating";S.stemProgress=0;S.stemError=null;render();
    // Listen for progress
    var removeProgress=window.electron.stems.onProgress(function(data){
      // Estimate progress from stderr output
      if(data.line){
        // demucs.cpp outputs segment info; rough estimate
        S.stemProgress=Math.min(95,S.stemProgress+2);
        render();
      }
    });
    window.electron.stems.separate(S.stemFile.filePath).then(function(result){
      removeProgress();
      S.stemPaths=result.stemPaths;S.stemStatus="ready";S.stemProgress=100;render();
      _loadStemFileUrls(result.stemPaths);
    }).catch(function(err){
      removeProgress();
      S.stemStatus="error";S.stemError=err.message||"Separation failed";render();
    });
    return;
  }
  if(a==="stemCancel"){
    if(window.electron)window.electron.stems.cancel();
    S.stemStatus="idle";S.stemProgress=0;render();return;
  }
  if(a==="stemOpen"){
    S.screen=SCR.STEMS;render();return;
  }
  if(a==="stemBack"){
    cleanupStems();S.screen=SCR.HOME;S.tab=TAB.SONGS;S.songsSubTab="stems";render();return;
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
  if(a==="selectAudioInput"){stopAudioTest();S.audioInputId=v;saveState();render();return;}
  // === MIDI ===
  if(a==="toggleMidi"){
    S.midiEnabled=!S.midiEnabled;
    if(S.midiEnabled){initMIDI();}
    else{S.midiOutput=null;S.midiDevices=[];}
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
      if(chart){S.performArrangementType="rhythm_chords";startPerformance(chart);return;}
    }
    return;
  }
  if(a==="openPerformSong"){
    var sgIdx=parseInt(v);
    if(!isNaN(sgIdx)&&SONGS[sgIdx]){
      S.performSongData=SONGS[sgIdx];
      S.performSongId=SONGS[sgIdx].title.toLowerCase().replace(/[^a-z0-9]+/g,"_");
      S.screen=SCR.PERFORM_SONG;render();
    }
    return;
  }
  if(a==="openPerfStats"){S.screen=SCR.PERF_STATS;render();return;}
  if(a==="openEditor"){S.performEditorChart=null;S.performEditorDirty=false;S.screen=SCR.PERF_EDITOR;render();return;}
  if(a==="openSkillTree"){S.screen=SCR.SKILL_TREE;render();return;}
  if(a==="skillTreeFocus"){S.skillTreeFocus=v||"overview";render();return;}
  if(a==="openPlan"){S.screen=SCR.PLAN;render();return;}
  if(a==="openPerformCalibration"){S.screen=SCR.PERFORM_CALIBRATE;render();return;}
  if(a==="performCalibrateSource"){S.performCalibrationSource=v||"midi";render();return;}
  if(a==="performCalibrationStart"){startPerformanceCalibrationRun();render();return;}
  if(a==="performCalibrationStop"){stopPerformanceCalibration();render();return;}
  if(a==="performCalibrationApply"){applyCalibrationOffset();render();return;}
  if(a==="performCalibrationReset"){
    if(S.performCalibrationSource==="midi")S.performMidiOffsetMs=0;
    if(S.performCalibrationSource==="mic")S.performMicOffsetMs=0;
    S.performCalibrationHits=[];saveState();render();return;
  }
  if(a==="performCalibrateTap"){
    var nowMs=performance.now();
    var beatIdx=typeof getCalibrationBeatIndex==="function"?getCalibrationBeatIndex():0;
    var startMs=typeof getCalibrationStartMs==="function"?getCalibrationStartMs():0;
    var interval=typeof getCalibrationBeatIntervalMs==="function"?getCalibrationBeatIntervalMs():1000;
    var targetMs=startMs+(beatIdx*interval);
    recordCalibrationHit(targetMs,nowMs);render();return;
  }
  if(a==="completePlan"){completePracticePlan();render();return;}
  if(a==="regeneratePlan"){buildPracticePlan();render();return;}
  if(a==="editorBack"){S.screen=SCR.HOME;S.tab=TAB.SONGS;render();return;}
  if(a==="editorMode"){S.performEditorMode=v;render();return;}
  if(a==="editorSnap"){S.performEditorSnap=v;render();return;}
  if(a==="editorNew"){
    S.performEditorChart={id:"custom_"+Date.now(),title:"New Chart",artist:"Custom",bpm:90,beatsPerBar:4,arrangementType:S.performEditorMode,events:[],phrases:[{id:0,name:"Phrase 1",startSec:0,endSec:8}]};
    S.performEditorDirty=true;render();return;
  }
  if(a==="editorFromSong"){
    if(S.performSongData){
      var chart=buildPerformanceChartFromSong(S.performSongData,"builtin",S.performEditorMode);
      if(chart){S.performEditorChart=chart;S.performEditorDirty=true;render();}
    }
    return;
  }
  if(a==="editorTitle"){if(S.performEditorChart){S.performEditorChart.title=v;S.performEditorDirty=true;render();}return;}
  if(a==="editorBpm"){if(S.performEditorChart){S.performEditorChart.bpm=parseInt(v)||90;S.performEditorDirty=true;render();}return;}
  if(a==="editorSelectEvent"){S.performEditorSelectedEventId=parseInt(v);render();return;}
  if(a==="editorAddEvent"){
    if(S.performEditorChart){
      var evts=S.performEditorChart.events;
      var maxId=0;for(var ei=0;ei<evts.length;ei++)if(evts[ei].id>maxId)maxId=evts[ei].id;
      var lastT=evts.length?evts[evts.length-1].t+evts[evts.length-1].dur:0;
      var beatDur=60/(S.performEditorChart.bpm||90);
      evts.push({id:maxId+1,t:lastT,dur:beatDur,type:S.performEditorMode==="lead"?"note":"chord",chord:"",laneLabel:"?",notes:[],strum:"down"});
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorDeleteEvent"){
    if(S.performEditorChart){
      S.performEditorChart.events=S.performEditorChart.events.filter(function(e){return e.id!==parseInt(v);});
      if(S.performEditorSelectedEventId===parseInt(v))S.performEditorSelectedEventId=null;
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorEvt"){
    try{
      var p=JSON.parse(v);
      if(S.performEditorChart){
        for(var ee=0;ee<S.performEditorChart.events.length;ee++){
          if(S.performEditorChart.events[ee].id===p.id){
            if(p.prop==="label"){S.performEditorChart.events[ee].laneLabel=p.val;S.performEditorChart.events[ee].chord=p.val;}
            if(p.prop==="t")S.performEditorChart.events[ee].t=parseFloat(p.val)||0;
            if(p.prop==="dur")S.performEditorChart.events[ee].dur=parseFloat(p.val)||0;
            break;
          }
        }
        S.performEditorDirty=true;render();
      }
    }catch(e){}
    return;
  }
  if(a==="editorAddPhrase"){
    if(S.performEditorChart){
      var ph=S.performEditorChart.phrases;
      var lastEnd=ph.length?ph[ph.length-1].endSec:0;
      ph.push({id:ph.length,name:"Phrase "+(ph.length+1),startSec:lastEnd,endSec:lastEnd+8});
      S.performEditorDirty=true;render();
    }
    return;
  }
  if(a==="editorSave"){
    if(S.performEditorChart){
      if(!Array.isArray(S.performEditorLibrary))S.performEditorLibrary=[];
      var exists=-1;
      for(var si=0;si<S.performEditorLibrary.length;si++){
        if(S.performEditorLibrary[si].id===S.performEditorChart.id){exists=si;break;}
      }
      var copy=JSON.parse(JSON.stringify(S.performEditorChart));
      if(exists>=0)S.performEditorLibrary[exists]=copy;
      else S.performEditorLibrary.push(copy);
      S.performEditorDirty=false;saveState();render();
    }
    return;
  }
  if(a==="editorLoad"){
    var idx=parseInt(v);
    if(S.performEditorLibrary&&S.performEditorLibrary[idx]){
      S.performEditorChart=JSON.parse(JSON.stringify(S.performEditorLibrary[idx]));
      S.performEditorDirty=false;S.performEditorSelectedEventId=null;render();
    }
    return;
  }
  if(a==="editorDelete"){
    var di=parseInt(v);
    if(S.performEditorLibrary&&S.performEditorLibrary[di]){
      S.performEditorLibrary.splice(di,1);saveState();render();
    }
    return;
  }
  if(a==="editorExport"){
    if(S.performEditorChart){
      var json=JSON.stringify(S.performEditorChart,null,2);
      var blob=new Blob([json],{type:"application/json"});
      var url=URL.createObjectURL(blob);
      var a2=document.createElement("a");a2.href=url;a2.download=(S.performEditorChart.title||"chart").replace(/\s+/g,"_")+".json";
      document.body.appendChild(a2);a2.click();document.body.removeChild(a2);URL.revokeObjectURL(url);
    }
    return;
  }
  if(a==="editorPreview"){
    if(S.performEditorChart&&S.performEditorChart.events&&S.performEditorChart.events.length){
      startPerformance(S.performEditorChart);
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
          S.performSongData=SONGS[di];S.performSongId=ch.songId;
          S.performArrangementType=ch.arrangementType||"chords";
          S.performDifficulty=ch.difficultyId||"normal";
          S.screen=SCR.PERFORM_SONG;render();return;
        }
      }
    }
    S.tab=TAB.SONGS;S.screen=SCR.HOME;render();return;
  }
  if(a==="performArrangement"){S.performArrangementType=v||"chords";saveState();render();return;}
  if(a==="importSongAudio"){
    if(!window.electron||!window.electron.stems){alert("Stem separation requires the desktop app.");return;}
    var importSongId=v;
    window.electron.stems.openFile().then(function(result){
      if(!result)return;
      S.songAudioImporting=true;
      S.songAudioProgress=0;
      S.songAudioImportingSongId=importSongId;
      render();

      var unsubProgress=window.electron.stems.onProgress(function(data){
        if(data&&data.progress!=null){
          S.songAudioProgress=Math.round(data.progress);
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
        if(!stemPaths){S.songAudioImporting=false;render();return;}

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
            S.songAudioImporting=false;
            S.songAudioProgress=0;
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
        S.songAudioImporting=false;
        S.songAudioProgress=0;
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
    if(S.performSongData){
      var chart=buildPerformanceChartFromSong(S.performSongData,"builtin",S.performArrangementType);
      if(chart)startPerformance(chart,{difficulty:S.performDifficulty,speed:S.performSpeed});
    }
    return;
  }
  if(a==="pausePerform"){pausePerformance();return;}
  if(a==="resumePerform"){resumePerformance();return;}
  if(a==="stopPerform"){stopPerformance();if(S.performSongData){S.screen=SCR.PERFORM_SONG;}else{S.screen=SCR.HOME;S.tab=TAB.SONGS;}render();return;}
  if(a==="performMode"){S.performMode=v;S.performInputSource=v;PerformanceInput.start(v);saveState();render();return;}
  if(a==="performDifficulty"){applyPerformanceDifficultyToState(v||"normal");saveState();render();return;}
  if(a==="performSpeed"){
    S.performSpeed=parseFloat(v);PerformanceTransport.setSpeed(S.performSpeed);saveState();render();return;
  }
  if(a==="performLoopPhrase"){
    var ph=getPerformancePhraseForTime(S.performChart,S.performCurrentSec);
    if(ph)setPerformanceLoop({startSec:ph.startSec,endSec:ph.endSec,phraseId:ph.id});
    return;
  }
  if(a==="performClearLoop"){clearPerformanceLoop();return;}
  if(a==="performPracticePreset"){applyPerformanceStemPreset(v);render();return;}
  if(a==="performCalibrate"){startCalibration();return;}
  if(a==="performCalibrateTap"){recordCalibrationTap();return;}
  if(a==="performRetry"){startPerformance(S.performChartId);return;}
  if(a==="performDebug"){S.performDebug=!S.performDebug;render();return;}
  if(a==="performRetryPhrase"){
    if(S.performChart&&S.performResults&&S.performResults.phraseStats){
      var weakIdx=0,weakAvg=Infinity;
      for(var wi=0;wi<S.performResults.phraseStats.length;wi++){
        var wp=S.performResults.phraseStats[wi];
        var wa=wp.total>0?wp.scoreSum/wp.total:0;
        if(wa<weakAvg){weakAvg=wa;weakIdx=wi;}
      }
      var weakPhrase=S.performChart.phrases[weakIdx];
      if(weakPhrase){
        S.performTargetPhrase=weakIdx;
        startPerformance(S.performChartId||S.performChart,{
          mode:S.performMode,
          difficulty:S.performDifficulty,
          speed:S.performSpeed
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
  if(a==="completePlanItem"){if(typeof markPracticePlanItem==="function")markPracticePlanItem(v);render();return;}
  // === MIDI Device/Profile Actions ===
  if(a==="setMidiDevice"){S.activeMidiDeviceId=v;saveState();render();return;}
  if(a==="setMidiProfile"){if(typeof setActiveMidiProfile==="function")setActiveMidiProfile(v);render();return;}
  if(a==="createDefaultPianoProfile"){if(typeof createDefaultPianoProfile==="function")createDefaultPianoProfile();render();return;}
  if(a==="createDefaultGuitarProfile"){if(typeof createDefaultGuitarProfile==="function")createDefaultGuitarProfile();render();return;}
  if(a==="openMidiSettings"){S.screen=SCR.MIDI_SETTINGS;render();return;}
  // === MIDI Import Actions ===
  if(a==="openMidiImport"){S.screen=SCR.MIDI_IMPORT;render();return;}
  if(a==="importMidiFile"){if(typeof handleMidiImport==="function")handleMidiImport(v);return;}
  if(a==="assignMidiTrack"){
    var parts=String(v).split("|");
    if(typeof setMidiTrackAssignment==="function")setMidiTrackAssignment(parts[0],parts[1]);
    render();return;
  }
  if(a==="buildMidiSeedChart"){
    if(typeof buildSeedChartFromImportedMidi==="function"){
      var chart=buildSeedChartFromImportedMidi(S.importedMidi,S.importedMidiAssignments,v);
      S.importedMidiSeedPreview=chart;
      if(chart&&typeof openEditor==="function"){openEditor("chart",chart);}
      else{render();}
    }return;
  }
  // === Cloud Sync Actions ===
  if(a==="cloudSync"){if(typeof syncSparkNow==="function")syncSparkNow();return;}
  if(a==="cloudPull"){if(typeof pullSparkCloud==="function")pullSparkCloud();return;}
  if(a==="cloudLogout"){if(typeof logoutSpark==="function")logoutSpark();render();return;}
  if(a==="cloudLoginPrompt"){
    var email=prompt("Email:");
    var password=prompt("Password:");
    if(email&&password&&typeof loginSpark==="function"){
      loginSpark(email,password).then(function(){render();});
    }return;
  }
  if(a==="openCloudSettings"){S.screen=SCR.CLOUD_SETTINGS;render();return;}
  // === Desktop Actions ===
  if(a==="checkUpdates"){if(typeof checkForDesktopUpdates==="function")checkForDesktopUpdates();return;}
  if(a==="exportBackup"){if(typeof exportFullBackupDesktopAware==="function")exportFullBackupDesktopAware();return;}
  if(a==="exportFeedback"){if(typeof exportFeedbackDesktopAware==="function")exportFeedbackDesktopAware();return;}
  // === Curriculum ===
  if(a==="openCurriculum"){S.screen=SCR.CURRICULUM;render();return;}
  // === Back ===
  if(a==="back"){
    stopAllTimers();
    S.selectedVoicing=0;S.screen=SCR.HOME;render();
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
  document.getElementById("hdr-xp").textContent=S.xp;
  document.getElementById("hdr-str").textContent=S.streak;
  document.getElementById("snd-btn").textContent=S.soundOn?"\uD83D\uDD0A":"\uD83D\uDD07";
  document.getElementById("snd-btn").style.opacity=S.soundOn?1:0.4;
  document.getElementById("dark-btn").textContent=S.darkMode?"\uD83C\uDF19":"\u2600\uFE0F";
  var app=document.getElementById("app"),h="";
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

  // Launcher gate — if no instrument active, show launcher
  if (!S.activeInstrument) {
    h += SparkInstruments.renderLauncher();
    app.innerHTML = h;
    document.getElementById("header").style.display = "none";
    return;
  } else {
    document.getElementById("header").style.display = "";
  }
  var backBtn = document.getElementById("launcher-back");
  if (backBtn) backBtn.style.display = S.activeInstrument ? "" : "none";
  var logoText = document.querySelector(".logo-text");
  if (logoText) {
    var _inst = SparkInstruments.getActive();
    logoText.textContent = _inst ? _inst.name + "Spark" : "SparkSuite";
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
    if(S.screen===SCR.DRILL){act("drillSwitch");return;}
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
