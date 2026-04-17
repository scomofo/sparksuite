(function(){

  function challengeEngineRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function challengeEngineRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = challengeEngineRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function challengeEngineWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = challengeEngineRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function initializeChallengesForCurrentCycle(){
    var appType = inferChallengeEngineAppType();
    var nextChallenges = []
      .concat(typeof buildDefaultDailyChallenges === "function" ? buildDefaultDailyChallenges(appType) : [])
      .concat(typeof buildDefaultWeeklyChallenges === "function" ? buildDefaultWeeklyChallenges(appType) : []);
    challengeEngineWrite("activeChallenges", nextChallenges);
    saveState();
    return nextChallenges;
  }

  function updateChallengeProgressByType(type, amount){
    var arr = challengeEngineRead("activeChallenges", []) || [];
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
    challengeEngineWrite("activeChallenges", arr);
    saveState();
  }

  function inferChallengeEngineAppType(){
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function"
      ? SparkInstruments.getActive()
      : null;
    var activeHints = [
      active ? active.instrument : null,
      active ? active.id : null,
      challengeEngineRead("activeInstrument", null)
    ];
    var i;
    for(i = 0; i < activeHints.length; i++){
      if(/piano/i.test(String(activeHints[i] || ""))) return "piano";
      if(activeHints[i]) return "guitar";
    }
    return /piano/i.test(typeof APP_NAME !== "undefined" ? APP_NAME : "") ? "piano" : "guitar";
  }

  function getIncompleteChallenges(limit){
    var arr = (challengeEngineRead("activeChallenges", []) || []).filter(function(ch){
      return !ch.completed || (ch.completed && !ch.claimed);
    });
    return arr.slice(0, limit || 10);
  }

  window.initializeChallengesForCurrentCycle = initializeChallengesForCurrentCycle;
  window.updateChallengeProgressByType = updateChallengeProgressByType;
  window.getIncompleteChallenges = getIncompleteChallenges;

})();
