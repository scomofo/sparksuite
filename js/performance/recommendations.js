(function(){

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
    if(!S.performanceStats)return recs;
    // Check all keys that start with this songId
    for(var key in S.performanceStats){
      if(key.indexOf(songId)!==0)continue;
      var st=S.performanceStats[key];
      if(!st||!st.runs)continue;
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
    for(var i=0;i<ids.length;i++){
      recs=recs.concat(buildPerformanceRecommendationsForSong(ids[i]));
    }
    // Suggest rhythm for mastered chord songs
    for(var key in(S.performanceStats||{})){
      var st=S.performanceStats[key];
      if(st&&st.arrangement==="chords"&&st.mastery==="mastered"){
        var rhythmKey=key.replace("_chords_","_rhythm_chords_");
        if(!S.performanceStats[rhythmKey]){
          recs.push({type:"try_rhythm",priority:85,songId:st.songId,arrangementType:"rhythm_chords",difficultyId:"easy",label:"Try rhythm arrangement",reason:"Chord mode mastered"});
        }
      }
    }
    return recs.sort(function(a,b){return b.priority-a.priority;}).slice(0,8);
  }

  function choosePerformanceDailyChallenge(){
    var today=getTodayPerfDateKey();
    if(S.performanceDailyChallenge&&S.performanceDailyChallenge.date===today)return S.performanceDailyChallenge;
    var recs=buildGlobalPerformanceRecommendations();
    var challenge;
    if(recs.length){
      var top=recs[0];
      challenge={id:"perf_"+today,date:today,type:top.type,songId:top.songId,arrangementType:top.arrangementType||"chords",difficultyId:top.difficultyId||"normal",phraseId:null,target:{accuracy:85,stars:3},label:top.label,xp:35,reason:top.reason};
    }else{
      challenge={id:"perf_"+today,date:today,type:"full_run",songId:null,arrangementType:"chords",difficultyId:"easy",phraseId:null,target:{accuracy:75,stars:2},label:"Complete a performance run today",xp:25,reason:"Build consistency"};
    }
    S.performanceDailyChallenge=challenge;
    S.performanceDailyComplete=false;
    return challenge;
  }

  function markPerformanceDailyComplete(){
    if(!S.performanceDailyChallenge||S.performanceDailyComplete)return 0;
    S.performanceDailyComplete=true;
    if(!Array.isArray(S.performanceDailyHistory))S.performanceDailyHistory=[];
    S.performanceDailyHistory.push({id:S.performanceDailyChallenge.id,date:S.performanceDailyChallenge.date,type:S.performanceDailyChallenge.type,xp:S.performanceDailyChallenge.xp,completedAt:Date.now()});
    saveState();
    return S.performanceDailyChallenge.xp||0;
  }

  window.buildPerformanceRecommendationsForSong=buildPerformanceRecommendationsForSong;
  window.buildGlobalPerformanceRecommendations=buildGlobalPerformanceRecommendations;
  window.choosePerformanceDailyChallenge=choosePerformanceDailyChallenge;
  window.markPerformanceDailyComplete=markPerformanceDailyComplete;

})();
