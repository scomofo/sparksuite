(function(){

  function challengeRewardRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function challengeRewardRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = challengeRewardRoot();
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

  function challengeRewardWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = challengeRewardRoot();
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

  function claimChallengeReward(challengeId){
    var ch = findActiveChallengeById(challengeId);
    if(!ch || !ch.completed || ch.claimed) return false;
    applyChallengeRewards(ch);
    ch.claimed = true;
    var challengeRewards = challengeRewardRead("challengeRewards", null);
    if(!challengeRewards || typeof challengeRewards !== "object") challengeRewards = { claimed: {}, packClaimed: {}, eventClaimed: {} };
    if(!challengeRewards.claimed) challengeRewards.claimed = {};
    challengeRewards.claimed[ch.id] = true;
    challengeRewardWrite("challengeRewards", challengeRewards);
    saveState();
    return true;
  }

  function applyChallengeRewards(ch){
    if(!ch || !ch.rewards) return;
    if(ch.rewards.xp){
      if(typeof awardXP === "function") awardXP(ch.rewards.xp, "challenge_reward");
    }
    if(ch.rewards.skillPoints){
      for(var i=0;i<ch.rewards.skillPoints;i++){
        if(typeof awardSkillPoint === "function"){
          awardSkillPoint();
        }
      }
    }
    if(Array.isArray(ch.rewards.unlockIds)){
      for(var j=0;j<ch.rewards.unlockIds.length;j++){
        if(typeof unlockContent === "function"){
          unlockContent("lessons", ch.rewards.unlockIds[j]);
        }
      }
    }
    if(typeof evaluateAchievements === "function"){
      evaluateAchievements();
    }
  }

  function findActiveChallengeById(id){
    var arr = challengeRewardRead("activeChallenges", []) || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === id) return arr[i];
    }
    return null;
  }

  window.claimChallengeReward = claimChallengeReward;
  window.applyChallengeRewards = applyChallengeRewards;
  window.findActiveChallengeById = findActiveChallengeById;

})();
