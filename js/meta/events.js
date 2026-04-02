(function(){

  function activateSeasonalEvent(eventId){
    var ev = typeof getSeasonalEvent === "function" ? getSeasonalEvent(eventId) : null;
    if(!ev) return false;
    S.activeEventId = eventId;
    S.seasonalEvents = [cloneEventForState(ev)];
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
    if(!S.activeEventId) return null;
    var arr = S.seasonalEvents || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === S.activeEventId) return arr[i];
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
    if(S.challengeRewards.eventClaimed[ev.id]) return;
    if(ev.rewards && ev.rewards.xp){
      if(typeof awardXP === "function") awardXP(ev.rewards.xp, "seasonal_event");
    }
    if(ev.rewards && ev.rewards.skillPoints && typeof awardSkillPoint === "function"){
      for(var i=0;i<ev.rewards.skillPoints;i++) awardSkillPoint();
    }
    S.challengeRewards.eventClaimed[ev.id] = true;
    saveState();
  }

  window.activateSeasonalEvent = activateSeasonalEvent;
  window.getActiveSeasonalEvent = getActiveSeasonalEvent;
  window.updateSeasonalChallengeProgress = updateSeasonalChallengeProgress;
  window.isSeasonalEventComplete = isSeasonalEventComplete;

})();
