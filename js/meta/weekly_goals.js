(function(){

  function weeklyGoalRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function weeklyGoalRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = weeklyGoalRoot();
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

  function weeklyGoalWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = weeklyGoalRoot();
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
    weeklyGoalWrite("weeklyGoals", goals);
    saveState();
  }

  function updateWeeklyGoal(type, amount){
    var arr = weeklyGoalRead("weeklyGoals", []) || [];
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
    var metaProgress = weeklyGoalRead("metaProgress", null);
    if(!metaProgress || typeof metaProgress !== "object") metaProgress = { goalsCompleted: 0, challengesCompleted: 0 };
    metaProgress.goalsCompleted++;
    weeklyGoalWrite("metaProgress", metaProgress);
    saveState();
  }

  window.generateWeeklyGoals = generateWeeklyGoals;
  window.updateWeeklyGoal = updateWeeklyGoal;

})();
