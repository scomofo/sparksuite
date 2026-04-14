(function(){

  function levelStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function levelStateRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = levelStateRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function levelStateWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = levelStateRoot();
    if(root) root[path] = value;
    return value;
  }

  function xpForLevel(level){
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  function checkLevelUp(){
    var playerLevel = levelStateRead("playerLevel", 1) || 1;
    var playerXP = levelStateRead("playerXP", 0) || 0;
    var nextXP = xpForLevel(playerLevel + 1);
    while(playerXP >= nextXP){
      playerLevel++;
      levelStateWrite("playerLevel", playerLevel);
      onLevelUp(playerLevel);
      nextXP = xpForLevel(playerLevel + 1);
    }
  }

  function onLevelUp(level){
    if(typeof showToast === "function") showToast("Level Up! Level " + level);
    if(typeof evaluateAchievements === "function") evaluateAchievements();
    if(typeof awardSkillPoint === "function") awardSkillPoint();
  }

  function getLevelProgress(){
    var playerLevel = levelStateRead("playerLevel", 1) || 1;
    var playerXP = levelStateRead("playerXP", 0) || 0;
    var current = xpForLevel(playerLevel);
    var next = xpForLevel(playerLevel + 1);
    var denom = (next - current) || 1;
    var progress = (playerXP - current) / denom;
    return Math.max(0, Math.min(1, progress));
  }

  window.xpForLevel = xpForLevel;
  window.checkLevelUp = checkLevelUp;
  window.getLevelProgress = getLevelProgress;

})();
