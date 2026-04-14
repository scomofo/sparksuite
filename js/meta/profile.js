function profileStateRoot(){
  if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
    return SparkState.getRoot();
  }
  return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
}

function profileStateRead(path, fallback){
  if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
    return SparkState.read(path, fallback);
  }
  var root = profileStateRoot();
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

function profilePage(){
  var ps = profileStateRead("playerStats", {}) || {};
  var h = '<div class="card">';
  h += '<div><b>Player Profile</b></div>';
  h += '<div>Level: '+(profileStateRead("playerLevel", 1) || 1)+'</div>';
  h += '<div>XP: '+(profileStateRead("playerXP", 0) || 0)+'</div>';
  h += '<div>Songs Completed: '+(ps.songsCompleted || 0)+'</div>';
  h += '<div>Practice Minutes: '+(ps.totalPracticeMinutes || 0)+'</div>';
  h += '<div>Lessons Completed: '+(ps.lessonsCompleted || 0)+'</div>';
  h += '<div>Exercises Completed: '+(ps.exercisesCompleted || 0)+'</div>';
  h += '<div>Best Streak: '+(ps.streakBest || 0)+'</div>';
  h += '</div>';
  return h;
}
