(function(){

  var ACHIEVEMENTS = [
    { id:"first_song", name:"First Song", check:()=>S.playerStats.songsCompleted >= 1 },
    { id:"practice_100", name:"100 Minutes", check:()=>S.playerStats.totalPracticeMinutes >= 100 },
    { id:"streak_7", name:"7 Day Streak", check:()=>S.practiceStreak >= 7 },
    { id:"level_5", name:"Level 5", check:()=>S.playerLevel >= 5 }
  ];

  function evaluateAchievements(){
    for(var i=0;i<ACHIEVEMENTS.length;i++){
      var a = ACHIEVEMENTS[i];
      if(!S.playerAchievements[a.id] && a.check()){
        unlockAchievement(a);
      }
    }
  }

  function unlockAchievement(a){
    S.playerAchievements[a.id] = true;
    if(typeof showToast === "function") showToast("Achievement Unlocked: " + a.name);
    awardXP(50, "achievement");
    saveState();
  }

  window.evaluateAchievements = evaluateAchievements;

})();
