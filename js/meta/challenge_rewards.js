(function(){

  function claimChallengeReward(challengeId){
    var ch = findActiveChallengeById(challengeId);
    if(!ch || !ch.completed || ch.claimed) return false;
    applyChallengeRewards(ch);
    ch.claimed = true;
    S.challengeRewards.claimed[ch.id] = true;
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
    var arr = S.activeChallenges || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].id === id) return arr[i];
    }
    return null;
  }

  window.claimChallengeReward = claimChallengeReward;
  window.applyChallengeRewards = applyChallengeRewards;
  window.findActiveChallengeById = findActiveChallengeById;

})();
