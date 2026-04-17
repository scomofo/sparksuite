(function(){

  function analyticsStateRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      return SparkState.getRoot();
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function analyticsStateRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = analyticsStateRoot();
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

  function analyticsStateWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = analyticsStateRoot();
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

  function analyticsEnsureArray(path){
    var current = analyticsStateRead(path, null);
    if(Array.isArray(current)) return current;
    current = [];
    analyticsStateWrite(path, current);
    return current;
  }

  function _ensureAnalytics(){
    var analytics = analyticsStateRead("analytics", null);
    if(!analytics || typeof analytics !== "object"){
      analytics = {};
      analyticsStateWrite("analytics", analytics);
    }
    analyticsEnsureArray(["analytics","performanceHistory"]);
    analyticsEnsureArray(["analytics","accuracyHistory"]);
    analyticsEnsureArray(["analytics","practiceHistory"]);
    analyticsEnsureArray(["analytics","xpHistory"]);
    analyticsEnsureArray(["analytics","streakHistory"]);
  }

  function recordPerformanceStats(result){
    if(!result) return;
    _ensureAnalytics();
    analyticsEnsureArray(["analytics","performanceHistory"]).push({
      ts: Date.now(),
      accuracy: result.accuracy || 0,
      score: result.score || 0,
      songId: result.songId,
      arrangementType: result.arrangementType
    });
    analyticsEnsureArray(["analytics","accuracyHistory"]).push({
      ts: Date.now(),
      accuracy: result.accuracy || 0
    });
    saveState();
  }

  function recordPracticeStats(minutes){
    _ensureAnalytics();
    analyticsEnsureArray(["analytics","practiceHistory"]).push({
      ts: Date.now(),
      minutes: minutes
    });
    saveState();
  }

  function recordXPStats(xp){
    _ensureAnalytics();
    analyticsEnsureArray(["analytics","xpHistory"]).push({
      ts: Date.now(),
      xp: xp
    });
  }

  function recordStreakStats(streak){
    _ensureAnalytics();
    analyticsEnsureArray(["analytics","streakHistory"]).push({
      ts: Date.now(),
      streak: streak
    });
  }


  window.recordPerformanceStats = recordPerformanceStats;
  window.recordPracticeStats = recordPracticeStats;
  window.recordXPStats = recordXPStats;
  window.recordStreakStats = recordStreakStats;

})();
