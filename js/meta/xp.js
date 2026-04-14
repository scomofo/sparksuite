(function(){

  function xpStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function xpStateRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = xpStateRoot();
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

  function xpStateWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = xpStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function awardXP(amount, reason){
    if(!amount) return;
    xpStateWrite("playerXP", (xpStateRead("playerXP", 0) || 0) + amount);
    checkLevelUp();
    logXPEvent(amount, reason);
    saveState();
  }

  function logXPEvent(amount, reason){
    var xpLog = xpStateRead("xpLog", []);
    if(!Array.isArray(xpLog)) xpLog = [];
    xpLog.push({
      xp: amount,
      reason: reason,
      ts: Date.now()
    });
    xpStateWrite("xpLog", xpLog);
  }

  function awardPracticeXP(minutes){
    awardXP(Math.round(minutes * 2), "practice");
  }

  function awardSongXP(accuracy){
    awardXP(20 + Math.round(accuracy * 20), "song");
  }

  function awardLessonXP(){
    awardXP(40, "lesson");
  }

  function awardStreakXP(days){
    awardXP(days * 5, "streak");
  }

  window.awardXP = awardXP;
  window.awardPracticeXP = awardPracticeXP;
  window.awardSongXP = awardSongXP;
  window.awardLessonXP = awardLessonXP;
  window.awardStreakXP = awardStreakXP;

})();
