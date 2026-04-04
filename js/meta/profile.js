function profilePage(){
  var ps = S.playerStats || {};
  var h = '<div class="card">';
  h += '<div><b>Player Profile</b></div>';
  h += '<div>Level: '+(S.playerLevel || 1)+'</div>';
  h += '<div>XP: '+(S.playerXP || 0)+'</div>';
  h += '<div>Songs Completed: '+(ps.songsCompleted || 0)+'</div>';
  h += '<div>Practice Minutes: '+(ps.totalPracticeMinutes || 0)+'</div>';
  h += '<div>Lessons Completed: '+(ps.lessonsCompleted || 0)+'</div>';
  h += '<div>Exercises Completed: '+(ps.exercisesCompleted || 0)+'</div>';
  h += '<div>Best Streak: '+(ps.streakBest || 0)+'</div>';
  h += '</div>';
  return h;
}
