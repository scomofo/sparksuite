function dashboardStateRead(path, fallback){
  if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
    return SparkState.read(path, fallback);
  }
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if(!root && typeof globalThis !== "undefined"){
    root = globalThis.__sparkState || globalThis.S || null;
  }
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

function dashboardPage(){
  var playerLevel = dashboardStateRead("playerLevel", dashboardStateRead("level", 0)) || 0;
  var playerXP = dashboardStateRead("playerXP", dashboardStateRead("xp", 0)) || 0;
  var h = '<div class="card">';
  h += '<div><b>Progress Dashboard</b></div>';
  h += '<div>Level: '+playerLevel+'</div>';
  h += '<div>XP: '+playerXP+'</div>';
  h += '<div>Challenges Completed: '+(dashboardStateRead(["metaProgress", "challengesCompleted"], 0) || 0)+'</div>';
  h += '<div>Weekly Goals Completed: '+(dashboardStateRead(["metaProgress", "goalsCompleted"], 0) || 0)+'</div>';
  h += '<div>Skill Points: '+(dashboardStateRead(["metaProgress", "skillPoints"], 0) || 0)+'</div>';
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Daily Challenges</b></div>';
  var arr = dashboardStateRead("dailyChallenges", []) || [];
  for(var i=0;i<arr.length;i++){
    var c = arr[i];
    var status = c.completed ? ' [DONE]' : '';
    h += '<div>'+c.type+' '+c.progress+'/'+c.target+status+'</div>';
  }
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Weekly Goals</b></div>';
  var wg = dashboardStateRead("weeklyGoals", []) || [];
  for(var j=0;j<wg.length;j++){
    var g = wg[j];
    var wStatus = g.completed ? ' [DONE]' : '';
    h += '<div>'+g.type+' '+g.progress+'/'+g.target+wStatus+'</div>';
  }
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Skill Tree</b></div>';
  var tree = dashboardStateRead("skillTree", {}) || {};
  for(var sk in tree){
    var node = tree[sk];
    var label = node.unlocked ? '[UNLOCKED]' : '(cost: '+node.cost+' SP)';
    h += '<div>'+sk+' '+label+'</div>';
  }
  h += '</div>';

  return h;
}
