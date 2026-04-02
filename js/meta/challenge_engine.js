(function(){

  function initializeChallengesForCurrentCycle(){
    var appType = inferChallengeEngineAppType();
    S.activeChallenges = [];
    S.activeChallenges = S.activeChallenges
      .concat(typeof buildDefaultDailyChallenges === "function" ? buildDefaultDailyChallenges(appType) : [])
      .concat(typeof buildDefaultWeeklyChallenges === "function" ? buildDefaultWeeklyChallenges(appType) : []);
    saveState();
    return S.activeChallenges;
  }

  function updateChallengeProgressByType(type, amount){
    var arr = S.activeChallenges || [];
    for(var i=0;i<arr.length;i++){
      var ch = arr[i];
      if(ch.type === type && !ch.completed){
        ch.progress += amount || 1;
        if(ch.progress >= ch.target){
          ch.progress = ch.target;
          ch.completed = true;
        }
      }
    }
    if(typeof updateSeasonalChallengeProgress === "function"){
      updateSeasonalChallengeProgress(type, amount);
    }
    saveState();
  }

  function inferChallengeEngineAppType(){
    return /piano/i.test(typeof APP_NAME !== "undefined" ? APP_NAME : "") ? "piano" : "guitar";
  }

  function getIncompleteChallenges(limit){
    var arr = (S.activeChallenges || []).filter(function(ch){
      return !ch.completed || (ch.completed && !ch.claimed);
    });
    return arr.slice(0, limit || 10);
  }

  window.initializeChallengesForCurrentCycle = initializeChallengesForCurrentCycle;
  window.updateChallengeProgressByType = updateChallengeProgressByType;
  window.getIncompleteChallenges = getIncompleteChallenges;

})();
