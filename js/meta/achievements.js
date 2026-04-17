(function(){

  function achievementRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function achievementRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = achievementRoot();
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

  function achievementWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = achievementRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  var ACHIEVEMENTS = [
    { id:"first_song", name:"First Song", check:function(){return (achievementRead(["playerStats", "songsCompleted"], 0) || 0) >= 1;} },
    { id:"practice_100", name:"100 Minutes", check:function(){return (achievementRead(["playerStats", "totalPracticeMinutes"], 0) || 0) >= 100;} },
    { id:"streak_7", name:"7 Day Streak", check:function(){return (achievementRead("practiceStreak", 0) || 0) >= 7;} },
    { id:"level_5", name:"Level 5", check:function(){return (achievementRead("playerLevel", achievementRead("level", 0)) || 0) >= 5;} }
  ];

  function evaluateAchievements(){
    var playerAchievements = achievementRead("playerAchievements", null);
    if(!playerAchievements || typeof playerAchievements !== "object" || Array.isArray(playerAchievements)){
      playerAchievements = {};
      achievementWrite("playerAchievements", playerAchievements);
    }
    for(var i=0;i<ACHIEVEMENTS.length;i++){
      var a = ACHIEVEMENTS[i];
      if(!playerAchievements[a.id] && a.check()){
        unlockAchievement(a);
      }
    }
  }

  function unlockAchievement(a){
    var playerAchievements = achievementRead("playerAchievements", null);
    if(!playerAchievements || typeof playerAchievements !== "object" || Array.isArray(playerAchievements)){
      playerAchievements = {};
    }
    playerAchievements[a.id] = true;
    achievementWrite("playerAchievements", playerAchievements);
    if(typeof showToast === "function") showToast("Achievement Unlocked: " + a.name);
    awardXP(50, "achievement");
    saveState();
  }

  window.evaluateAchievements = evaluateAchievements;

})();
