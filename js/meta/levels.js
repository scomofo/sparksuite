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

  function getProgressionState(){
    return {
      level: levelStateRead("playerLevel", levelStateRead("level", 1)) || 1,
      xp: levelStateRead("playerXP", levelStateRead("xp", 0)) || 0
    };
  }

  function writeProgressionLevel(level){
    levelStateWrite("playerLevel", level);
    levelStateWrite("level", level);
    return level;
  }

  function checkLevelUp(){
    var progressState = getProgressionState();
    var playerLevel = progressState.level;
    var playerXP = progressState.xp;
    var nextXP = xpForLevel(playerLevel + 1);
    while(playerXP >= nextXP){
      playerLevel++;
      writeProgressionLevel(playerLevel);
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
    var progressState = getProgressionState();
    var playerLevel = progressState.level;
    var playerXP = progressState.xp;
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
