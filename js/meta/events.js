(function(){

  function seasonalEventRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function seasonalEventRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = seasonalEventRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function seasonalEventWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = seasonalEventRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function ensureSeasonalRewardClaims(){
    var challengeRewards = seasonalEventRead("challengeRewards", null);
    if(!challengeRewards || typeof challengeRewards !== "object" || Array.isArray(challengeRewards)){
      challengeRewards = { packClaimed: {}, eventClaimed: {} };
    }
    if(!challengeRewards.packClaimed || typeof challengeRewards.packClaimed !== "object") challengeRewards.packClaimed = {};
    if(!challengeRewards.eventClaimed || typeof challengeRewards.eventClaimed !== "object") challengeRewards.eventClaimed = {};
    seasonalEventWrite("challengeRewards", challengeRewards);
    return challengeRewards.eventClaimed;
  }

  function activateSeasonalEvent(eventId){
    var ev = typeof getSeasonalEvent === "function" ? getSeasonalEvent(eventId) : null;
    if(!ev) return false;
    seasonalEventWrite("activeEventId", eventId);
    seasonalEventWrite("seasonalEvents", [cloneEventForState(ev)]);
    saveState();
    return true;
  }

  function cloneEventForState(ev){
    return {
      id: ev.id,
      title: ev.title,
      startsAt: ev.startsAt || null,
      endsAt: ev.endsAt || null,
      active: true,
      challenges: (ev.challenges || []).map(function(ch){
        return typeof makeChallenge === "function" ? makeChallenge(ch) : ch;
      }),
      rewards: ev.rewards || {}
    };
  }

  function getActiveSeasonalEvent(){
    var activeEventId = seasonalEventRead("activeEventId", null);
    if(!activeEventId) return null;
    var arr = seasonalEventRead("seasonalEvents", []) || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === activeEventId) return arr[i];
    }
    return null;
  }

  function updateSeasonalChallengeProgress(type, amount){
    var ev = getActiveSeasonalEvent();
    if(!ev) return;
    var arr = ev.challenges || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].type === type && !arr[i].completed){
        arr[i].progress += amount || 1;
        if(arr[i].progress >= arr[i].target){
          arr[i].completed = true;
        }
      }
    }
    if(isSeasonalEventComplete(ev)){
      grantSeasonalEventRewards(ev);
    }
    saveState();
  }

  function isSeasonalEventComplete(ev){
    var arr = ev.challenges || [];
    if(!arr.length) return false;
    for(var i=0;i<arr.length;i++){
      if(!arr[i].completed) return false;
    }
    return true;
  }

  function grantSeasonalEventRewards(ev){
    var eventClaimed = ensureSeasonalRewardClaims();
    if(eventClaimed[ev.id]) return;
    if(ev.rewards && ev.rewards.xp){
      if(typeof awardXP === "function") awardXP(ev.rewards.xp, "seasonal_event");
    }
    if(ev.rewards && ev.rewards.skillPoints && typeof awardSkillPoint === "function"){
      for(var i=0;i<ev.rewards.skillPoints;i++) awardSkillPoint();
    }
    eventClaimed[ev.id] = true;
    seasonalEventWrite(["challengeRewards", "eventClaimed"], eventClaimed);
    saveState();
  }

  window.activateSeasonalEvent = activateSeasonalEvent;
  window.getActiveSeasonalEvent = getActiveSeasonalEvent;
  window.updateSeasonalChallengeProgress = updateSeasonalChallengeProgress;
  window.isSeasonalEventComplete = isSeasonalEventComplete;

})();
