(function(){

  function audioTimingRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function audioTimingRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = audioTimingRoot();
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

  function getTimingRating(errorMs){
    var abs = Math.abs(errorMs);
    var timingWindows = audioTimingRead("timingWindows", {}) || {};
    if(abs <= (timingWindows.perfect || 0)) return "perfect";
    if(abs <= (timingWindows.good || 0)) return "good";
    if(abs <= (timingWindows.ok || 0)) return "ok";
    return "miss";
  }

  function getTimingScore(errorMs){
    var r = getTimingRating(errorMs);
    if(r==="perfect") return 1.0;
    if(r==="good") return 0.75;
    if(r==="ok") return 0.4;
    return 0;
  }

  window.getTimingRating = getTimingRating;
  window.getTimingScore = getTimingScore;

})();
