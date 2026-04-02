(function(){

  function generateWeeklyGoals(){
    var goals = [];
    goals.push({
      id: generateId("goal"),
      type: "practice_minutes",
      target: 120,
      progress: 0,
      xp: 150
    });
    goals.push({
      id: generateId("goal"),
      type: "songs_completed",
      target: 2,
      progress: 0,
      xp: 200
    });
    goals.push({
      id: generateId("goal"),
      type: "practice_days",
      target: 5,
      progress: 0,
      xp: 180
    });
    S.weeklyGoals = goals;
    saveState();
  }

  function updateWeeklyGoal(type, amount){
    var arr = S.weeklyGoals || [];
    for(var i=0;i<arr.length;i++){
      if(arr[i].type === type && !arr[i].completed){
        arr[i].progress += amount || 1;
        if(arr[i].progress >= arr[i].target){
          completeWeeklyGoal(arr[i]);
        }
      }
    }
  }

  function completeWeeklyGoal(goal){
    goal.completed = true;
    awardXP(goal.xp, "weekly_goal");
    S.metaProgress.goalsCompleted++;
    saveState();
  }

  window.generateWeeklyGoals = generateWeeklyGoals;
  window.updateWeeklyGoal = updateWeeklyGoal;

})();
