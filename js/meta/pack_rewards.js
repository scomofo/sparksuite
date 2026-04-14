(function(){

  function packRewardRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function packRewardRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = packRewardRoot();
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

  function packRewardWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = packRewardRoot();
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

  function ensurePackCompletionState(){
    var state = packRewardRead("packCompletion", null);
    if(!state || typeof state !== "object" || Array.isArray(state)) state = { packs: {} };
    if(!state.packs || typeof state.packs !== "object" || Array.isArray(state.packs)) state.packs = {};
    packRewardWrite("packCompletion", state);
    return state;
  }

  function ensurePackRewardClaims(){
    var rewards = packRewardRead("challengeRewards", null);
    if(!rewards || typeof rewards !== "object" || Array.isArray(rewards)) rewards = { packClaimed: {} };
    if(!rewards.packClaimed || typeof rewards.packClaimed !== "object" || Array.isArray(rewards.packClaimed)) rewards.packClaimed = {};
    packRewardWrite("challengeRewards", rewards);
    return rewards.packClaimed;
  }

  function updatePackCompletion(packId, progress){
    var packCompletion = ensurePackCompletionState();
    if(!packCompletion.packs[packId]){
      packCompletion.packs[packId] = {
        progress: 0,
        completed: false
      };
    }
    packCompletion.packs[packId].progress = progress;
    if(progress >= 1 && !packCompletion.packs[packId].completed){
      packCompletion.packs[packId].completed = true;
      grantPackCompletionReward(packId);
    }
    packRewardWrite("packCompletion", packCompletion);
    saveState();
  }

  function grantPackCompletionReward(packId){
    var claimed = ensurePackRewardClaims();
    var reward = typeof getPackReward === "function" ? getPackReward(packId) : null;
    if(!reward) return;
    if(claimed[packId]) return;
    if(reward.xp){
      if(typeof awardXP === "function") awardXP(reward.xp, "pack_completion");
    }
    if(reward.achievementId && typeof unlockAchievement === "function"){
      unlockAchievement(reward.achievementId);
    }
    if(reward.skillPoints && typeof awardSkillPoint === "function"){
      for(var i=0;i<reward.skillPoints;i++) awardSkillPoint();
    }
    claimed[packId] = true;
    packRewardWrite(["challengeRewards", "packClaimed"], claimed);
    saveState();
  }

  function getPackCompletionRatio(packId){
    var row = packRewardRead(["packCompletion", "packs", packId], null);
    return row ? row.progress || 0 : 0;
  }

  window.updatePackCompletion = updatePackCompletion;
  window.grantPackCompletionReward = grantPackCompletionReward;
  window.getPackCompletionRatio = getPackCompletionRatio;

})();
