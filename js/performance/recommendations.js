(function(){

  function performanceRecommendationRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      return SparkState.getRoot();
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function performanceRecommendationRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = performanceRecommendationRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function performanceRecommendationWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = performanceRecommendationRoot();
    if(root) root[path]=value;
    return value;
  }

  function getPerformanceStatsSnapshot(){
    if(window.sparkCore&&typeof window.sparkCore.getLegacyPracticeAnalyticsSnapshot==="function"){
      var analytics=window.sparkCore.getLegacyPracticeAnalyticsSnapshot();
      if(analytics&&analytics.performanceStats)return analytics.performanceStats;
    }
    return performanceRecommendationRead("performanceStats", {})||{};
  }

  function syncPerformanceDailyStateWithCore(challenge, isComplete){
    if(!window.sparkCore||typeof window.sparkCore.syncPerformanceDailyChallengeState!=="function")return;
    window.sparkCore.syncPerformanceDailyChallengeState(challenge||null, !!isComplete);
  }

  function getTechniqueAccuracy(bucket){
    if(!bucket||!bucket.total)return 100;
    return Math.round(((bucket.hits||0)/bucket.total)*100);
  }

  function getImportedTechniqueRecommendation(songId, st){
    if(!st||!st.importedTechniqueTotals)return null;
    var labels={
      open:"Open-note timing",
      tap:"Tap-note consistency",
      forced:"Forced-note transitions",
      specialPhrase:"Phrase section control"
    };
    var focusedKey = st.lastFocusedTechnique || null;
    if(focusedKey && st.importedTechniqueTotals[focusedKey] && st.importedTechniqueTotals[focusedKey].total){
      var focusedBucket = st.importedTechniqueTotals[focusedKey];
      var focusedAccuracy = getTechniqueAccuracy(focusedBucket);
      if(focusedAccuracy < 90){
        return {
          type:"imported_technique_focus",
          priority:205-Math.min(focusedAccuracy,100),
          songId:songId,
          arrangementType:st.arrangement,
          difficultyId:st.difficulty,
          techniqueKey:focusedKey,
          label:"Stay on " + (labels[focusedKey]||"imported technique"),
          reason:(labels[focusedKey]||"Imported technique") + " is still only at " + focusedAccuracy + "% during the current focus block"
        };
      }
    }
    var weakestKey=null;
    var weakestAccuracy=101;
    for(var key in st.importedTechniqueTotals){
      if(!Object.prototype.hasOwnProperty.call(st.importedTechniqueTotals,key))continue;
      var bucket=st.importedTechniqueTotals[key];
      if(!bucket||!bucket.total)continue;
      var acc=getTechniqueAccuracy(bucket);
      if(acc<weakestAccuracy){
        weakestAccuracy=acc;
        weakestKey=key;
      }
    }
    if(!weakestKey||weakestAccuracy>=85)return null;
    return {
      type:"imported_technique_focus",
      priority:140-Math.min(weakestAccuracy,100),
      songId:songId,
      arrangementType:st.arrangement,
      difficultyId:st.difficulty,
      techniqueKey:weakestKey,
      label:"Focus " + (labels[weakestKey]||"imported technique"),
      reason:(labels[weakestKey]||"Imported technique") + " is at " + weakestAccuracy + "% accuracy"
    };
  }

  function getTodayPerfDateKey(){
    return new Date().toISOString().split("T")[0];
  }

  function getAllPerformanceSongIds(){
    if(typeof SONGS==="undefined"||!Array.isArray(SONGS))return[];
    var ids=[];
    for(var i=0;i<SONGS.length;i++){
      if(SONGS[i].progression&&SONGS[i].progression.length>0)
        ids.push((SONGS[i].title||"song").toLowerCase().replace(/[^a-z0-9]+/g,"_"));
    }
    return ids;
  }

  function buildPerformanceRecommendationsForSong(songId){
    var recs=[];
    var performanceStats=getPerformanceStatsSnapshot();
    // Check all keys that start with this songId
    for(var key in performanceStats){
      if(key.indexOf(songId)!==0)continue;
      var st=performanceStats[key];
      if(!st||!st.runs)continue;
      var techniqueRec=getImportedTechniqueRecommendation(songId,st);
      if(techniqueRec)recs.push(techniqueRec);
      if(st.bestAccuracy<70){
        recs.push({type:"retry_run",priority:90,songId:songId,arrangementType:st.arrangement,difficultyId:st.difficulty,label:"Retry this run",reason:"Accuracy below 70%"});
      }else if(st.bestAccuracy<90){
        recs.push({type:"weakest_phrase",priority:100,songId:songId,arrangementType:st.arrangement,difficultyId:st.difficulty,label:"Practice weakest phrase",reason:"Close to mastery"});
      }else if(st.bestAccuracy>=90&&st.bestStars>=4){
        recs.push({type:"promote_difficulty",priority:80,songId:songId,arrangementType:st.arrangement,difficultyId:st.difficulty,label:"Try harder difficulty",reason:"Strong enough to level up"});
      }
    }
    return recs.sort(function(a,b){return b.priority-a.priority;});
  }

  function buildGlobalPerformanceRecommendations(){
    var recs=[];
    var ids=getAllPerformanceSongIds();
    var performanceStats=getPerformanceStatsSnapshot();
    for(var i=0;i<ids.length;i++){
      recs=recs.concat(buildPerformanceRecommendationsForSong(ids[i]));
    }
    // Suggest rhythm for mastered chord songs
    for(var key in performanceStats){
      var st=performanceStats[key];
      if(st&&st.arrangement==="chords"&&st.mastery==="mastered"){
        var rhythmKey=key.replace("_chords_","_rhythm_chords_");
        if(!performanceStats[rhythmKey]){
          recs.push({type:"try_rhythm",priority:85,songId:st.songId,arrangementType:"rhythm_chords",difficultyId:"easy",label:"Try rhythm arrangement",reason:"Chord mode mastered"});
        }
      }
    }
    return recs.sort(function(a,b){return b.priority-a.priority;}).slice(0,8);
  }

  function choosePerformanceDailyChallenge(){
    var today=getTodayPerfDateKey();
    var activeChallenge = performanceRecommendationRead("performanceDailyChallenge", null);
    var isComplete = !!performanceRecommendationRead("performanceDailyComplete", false);
    if(activeChallenge&&activeChallenge.date===today){
      syncPerformanceDailyStateWithCore(activeChallenge, isComplete);
      return activeChallenge;
    }
    var recs=buildGlobalPerformanceRecommendations();
    var challenge;
    if(recs.length){
      var top=recs[0];
      challenge={
        id:"perf_"+today,
        date:today,
        type:top.type,
        songId:top.songId,
        arrangementType:top.arrangementType||"chords",
        difficultyId:top.difficultyId||"normal",
        phraseId:null,
        techniqueKey:top.techniqueKey||null,
        target:{accuracy:top.type==="imported_technique_focus"?90:85,stars:3},
        label:top.label,
        xp:35,
        reason:top.reason
      };
    }else{
      challenge={id:"perf_"+today,date:today,type:"full_run",songId:null,arrangementType:"chords",difficultyId:"easy",phraseId:null,target:{accuracy:75,stars:2},label:"Complete a performance run today",xp:25,reason:"Build consistency"};
    }
    performanceRecommendationWrite("performanceDailyChallenge", challenge);
    performanceRecommendationWrite("performanceDailyComplete", false);
    syncPerformanceDailyStateWithCore(challenge, false);
    return challenge;
  }

  function markPerformanceDailyComplete(){
    var challenge = performanceRecommendationRead("performanceDailyChallenge", null);
    var isComplete = !!performanceRecommendationRead("performanceDailyComplete", false);
    var history = Array.isArray(performanceRecommendationRead("performanceDailyHistory", [])) ? performanceRecommendationRead("performanceDailyHistory", []) : [];
    if(!challenge||isComplete)return 0;
    performanceRecommendationWrite("performanceDailyComplete", true);
    history.push({id:challenge.id,date:challenge.date,type:challenge.type,xp:challenge.xp,completedAt:Date.now()});
    performanceRecommendationWrite("performanceDailyHistory", history);
    syncPerformanceDailyStateWithCore(challenge, true);
    saveState();
    return challenge.xp||0;
  }

  window.buildPerformanceRecommendationsForSong=buildPerformanceRecommendationsForSong;
  window.buildGlobalPerformanceRecommendations=buildGlobalPerformanceRecommendations;
  window.choosePerformanceDailyChallenge=choosePerformanceDailyChallenge;
  window.markPerformanceDailyComplete=markPerformanceDailyComplete;
  window.getImportedTechniqueRecommendation=getImportedTechniqueRecommendation;
  window.getTechniqueAccuracy=getTechniqueAccuracy;

})();
