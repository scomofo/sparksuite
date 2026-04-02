function profilePage(){
  var h = '<div class="card">';
  h += '<div><b>Player Profile</b></div>';
  h += '<div>Level: '+S.playerLevel+'</div>';
  h += '<div>XP: '+S.playerXP+'</div>';
  h += '<div>Songs Completed: '+S.playerStats.songsCompleted+'</div>';
  h += '<div>Practice Minutes: '+S.playerStats.totalPracticeMinutes+'</div>';
  h += '<div>Lessons Completed: '+S.playerStats.lessonsCompleted+'</div>';
  h += '<div>Exercises Completed: '+S.playerStats.exercisesCompleted+'</div>';
  h += '<div>Best Streak: '+S.playerStats.streakBest+'</div>';
  h += '</div>';
  return h;
}
