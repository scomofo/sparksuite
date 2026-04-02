(function(){

  function generateDailyChallenges(){
    var challenges = [];
    challenges.push({
      id: generateId("challenge"),
      type: "practice_minutes",
      target: 15,
      progress: 0,
      xp: 40
    });
    challenges.push({
      id: generateId("challenge"),
      type: "complete_song",
      target: 1,
      progress: 0,
      xp: 60
    });
    challenges.push({
      id: generateId("challenge"),
      type: "weak_spot",
      target: 1,
      progress: 0,
      xp: 50
    });
    S.dailyChallenges = challenges;
    saveState();
  }

  function updateChallengeProgress(type, amount){
    var arr = S.dailyChallenges || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].type === type && !arr[i].completed){
        arr[i].progress += amount || 1;
        if(arr[i].progress >= arr[i].target){
          completeChallenge(arr[i]);
        }
      }
    }
  }

  function completeChallenge(ch){
    ch.completed = true;
    awardXP(ch.xp, "challenge");
    S.metaProgress.challengesCompleted++;
    S.challengeHistory.push(ch);
    saveState();
  }

  window.generateDailyChallenges = generateDailyChallenges;
  window.updateChallengeProgress = updateChallengeProgress;

})();
