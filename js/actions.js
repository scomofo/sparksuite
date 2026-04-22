// js/actions.js
// The legacy `window.act(action, value)` dispatcher extracted from
// js/app.js. This is the single entry point that page-rendered
// `onclick="act('foo', 'bar')"` handlers funnel through. It owns
// every interactive transition in the app: instrument switching, tab
// changes, session/drill/daily lifecycle, song picking, performance
// gameplay launches, settings toggles, etc.
//
// Pure relocation — no behavioral changes. The `window.act` global is
// preserved so HTML onclick handlers and the active-instrument
// `_inst.act(a, v)` delegation in instrument modules find it unchanged.
//
// Pre-conditions (load order): this file must load AFTER everything
// it calls — page renderers, performance modules, _sparkEmit and the
// orchestrator-request helpers, the Showroom modules, etc. — and AFTER
// js/state.js (uses S, T). See <script> ordering in index.html.

// ===== ACTION DISPATCHER =====
window.act=function(a,v){
  // Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;
  // Switch instrument from v2 dashboard
  if(a==="switchInstrument" && v){
    SparkInstruments.activate(v);
    S.activeInstrument = v;
    S.screen = SCR.HOME;
    S.tab = TAB.PRACTICE;
    saveState();
    render();
    return;
  }
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
    var earTrainOk=v===S.earTrainQ;
    var nextEarTrainTotal=(S.earTrainTotal||0)+1;
    var nextEarTrainScore=(S.earTrainScore||0)+(earTrainOk?1:0);
    var nextEarTrainStreak=earTrainOk?((S.earTrainStreak||0)+1):0;
    if(window.sparkCore&&typeof window.sparkCore.syncLegacyEarTrainingRuntimeState==="function"){
      window.sparkCore.syncLegacyEarTrainingRuntimeState({
        question: S.earTrainQ,
        options: S.earTrainOpts,
        answer: v,
        score: nextEarTrainScore,
        total: nextEarTrainTotal,
        streak: nextEarTrainStreak
      });
    }
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{earTrainAns:v},
        incrementFields:{earTrainTotal:1}
      });
    }else{
      S.earTrainAns=v;
      S.earTrainTotal++;
    }
    var ok=earTrainOk;
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
      if(window.sparkCore && typeof window.sparkCore.openLegacyStrumPattern === "function"){
        window.sparkCore.openLegacyStrumPattern({ pattern: sp });
      }
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
    if(window.sparkCore && typeof window.sparkCore.syncLegacyStrumRuntimeState === "function"){
      window.sparkCore.syncLegacyStrumRuntimeState({
        pattern: S.selectedStrum,
        active: nextStrumActive,
        beat: nextStrumActive ? 0 : -1
      });
    }
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
      T.strum=setInterval(function(){
        S._strumBeat=(S._strumBeat+1)%p.length;
        if(window.sparkCore && typeof window.sparkCore.syncLegacyStrumRuntimeState === "function"){
          window.sparkCore.syncLegacyStrumRuntimeState({
            pattern: S.selectedStrum,
            active: true,
            beat: S._strumBeat
          });
        }
        if(p[S._strumBeat]!=="x")strumChord(_strumChordName);
        render();
      },ms);
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
    var songActivityInstrument = getActiveInstrumentIdentityForActivity();
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityCompletion==="function"){
      SparkProgressBridge.applyLegacyActivityCompletion({
        xpDelta:40,
        incrementFields:{songsPlayed:1},
        history:{type:"song",detail:S.selectedSong?S.selectedSong.title:"Song",xp:40},
        emit:{type:"lesson_completed",payload:{ appId: songActivityInstrument.appId, lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 }},
        checkBadges:true
      });
    }else{
      S.songsPlayed++;if(window.SparkProgressBridge)SparkProgressBridge.applyLegacyReward({xpDelta:40});else S.xp+=40;
      logHistory("song",S.selectedSong?S.selectedSong.title:"Song",40);
      _sparkEmit("lesson_completed", { appId: songActivityInstrument.appId, lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 });
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
    clearTimeout(T.session);clearTimeout(T.drill);clearTimeout(T.daily);clearInterval(T.metro);clearInterval(T.strum);
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
  // Showroom "Start Performance" / "Replay Session" CTA. Picks the best
  // available chart in priority order so each call site launches the
  // thing the user is actually looking at:
  //   1. v (explicit chart id/object — future-proofing)
  //   2. S.performChart (the just-played chart, for Replay Session)
  //   3. S.selectedSong (the imported song backing SCR.SONG)
  // Falls back to the practice home if none of those are set, matching
  // the pre-wiring nav("performance") behavior.
  if(a==="showroomStartPerf"){
    if(v&&typeof startPerformance==="function"){startPerformance(v);return;}
    if(S.performChart&&typeof startPerformance==="function"){startPerformance(S.performChart);return;}
    if(S.selectedSong&&typeof buildPerformanceChartFromSong==="function"){
      var _ssChart=buildPerformanceChartFromSong(S.selectedSong,"imported");
      if(_ssChart){startPerformance(_ssChart);return;}
    }
    S.screen=SCR.HOME;S.tab=TAB.PRACTICE;render();return;
  }
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
