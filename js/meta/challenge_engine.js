(function(){

  function inferChallengeInstrumentFromName(name) {
    var value = String(name || "").toLowerCase();
    if (value.indexOf("piano") >= 0) return "piano";
    if (value.indexOf("ukulele") >= 0 || value.indexOf("uke") >= 0) return "ukulele";
    if (value.indexOf("bass") >= 0) return "bass";
    if (value.indexOf("drum") >= 0) return "drums";
    return "guitar";
  }

  function rehydrateChallengeInstrument(active) {
    if (!active) return null;
    var key = active.id || active.appId || active.instrumentId || active.instrument || null;
    if (!key || typeof SparkInstruments === "undefined" || typeof SparkInstruments.getAll !== "function") {
      return active;
    }
    var entries = SparkInstruments.getAll() || [];
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i] || {};
      if (entry.id === key || entry.appId === key || entry.instrument === key) return entry;
    }
    return active;
  }

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
    if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function") {
      var active = rehydrateChallengeInstrument(SparkInstruments.getActive());
      if (active && (active.instrument || active.instrumentType)) {
        return active.instrument || active.instrumentType;
      }
    }
    return inferChallengeInstrumentFromName(typeof APP_NAME !== "undefined" ? APP_NAME : "");
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
