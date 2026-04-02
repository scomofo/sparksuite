function dashboardPage(){
  var h = '<div class="card">';
  h += '<div><b>Progress Dashboard</b></div>';
  h += '<div>Level: '+S.playerLevel+'</div>';
  h += '<div>XP: '+S.playerXP+'</div>';
  h += '<div>Challenges Completed: '+S.metaProgress.challengesCompleted+'</div>';
  h += '<div>Weekly Goals Completed: '+S.metaProgress.goalsCompleted+'</div>';
  h += '<div>Skill Points: '+S.metaProgress.skillPoints+'</div>';
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Daily Challenges</b></div>';
  var arr = S.dailyChallenges || [];
  for(var i=0;i<arr.length;i++){
    var c = arr[i];
    var status = c.completed ? ' [DONE]' : '';
    h += '<div>'+c.type+' '+c.progress+'/'+c.target+status+'</div>';
  }
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Weekly Goals</b></div>';
  var wg = S.weeklyGoals || [];
  for(var j=0;j<wg.length;j++){
    var g = wg[j];
    var wStatus = g.completed ? ' [DONE]' : '';
    h += '<div>'+g.type+' '+g.progress+'/'+g.target+wStatus+'</div>';
  }
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Skill Tree</b></div>';
  var tree = S.skillTree || {};
  for(var sk in tree){
    var node = tree[sk];
    var label = node.unlocked ? '[UNLOCKED]' : '(cost: '+node.cost+' SP)';
    h += '<div>'+sk+' '+label+'</div>';
  }
  h += '</div>';

  return h;
}
