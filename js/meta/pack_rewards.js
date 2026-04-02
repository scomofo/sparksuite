(function(){

  function updatePackCompletion(packId, progress){
    if(!S.packCompletion.packs[packId]){
      S.packCompletion.packs[packId] = {
        progress: 0,
        completed: false
      };
    }
    S.packCompletion.packs[packId].progress = progress;
    if(progress >= 1 && !S.packCompletion.packs[packId].completed){
      S.packCompletion.packs[packId].completed = true;
      grantPackCompletionReward(packId);
    }
    saveState();
  }

  function grantPackCompletionReward(packId){
    var reward = typeof getPackReward === "function" ? getPackReward(packId) : null;
    if(!reward) return;
    if(S.challengeRewards.packClaimed[packId]) return;
    if(reward.xp){
      if(typeof awardXP === "function") awardXP(reward.xp, "pack_completion");
    }
    if(reward.achievementId && typeof unlockAchievement === "function"){
      unlockAchievement(reward.achievementId);
    }
    if(reward.skillPoints && typeof awardSkillPoint === "function"){
      for(var i=0;i<reward.skillPoints;i++) awardSkillPoint();
    }
    S.challengeRewards.packClaimed[packId] = true;
    saveState();
  }

  function getPackCompletionRatio(packId){
    var row = S.packCompletion.packs[packId];
    return row ? row.progress || 0 : 0;
  }

  window.updatePackCompletion = updatePackCompletion;
  window.grantPackCompletionReward = grantPackCompletionReward;
  window.getPackCompletionRatio = getPackCompletionRatio;

})();
