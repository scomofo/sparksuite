(function(){

  function xpForLevel(level){
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  function checkLevelUp(){
    var nextXP = xpForLevel(S.playerLevel + 1);
    while(S.playerXP >= nextXP){
      S.playerLevel++;
      onLevelUp(S.playerLevel);
      nextXP = xpForLevel(S.playerLevel + 1);
    }
  }

  function onLevelUp(level){
    if(typeof showToast === "function") showToast("Level Up! Level " + level);
    if(typeof evaluateAchievements === "function") evaluateAchievements();
    if(typeof awardSkillPoint === "function") awardSkillPoint();
  }

  function getLevelProgress(){
    var current = xpForLevel(S.playerLevel);
    var next = xpForLevel(S.playerLevel + 1);
    var progress = (S.playerXP - current) / (next - current);
    return Math.max(0, Math.min(1, progress));
  }

  window.xpForLevel = xpForLevel;
  window.checkLevelUp = checkLevelUp;
  window.getLevelProgress = getLevelProgress;

})();
