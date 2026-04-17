(function(){

  function analyticsTrendRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function analyticsTrendRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = analyticsTrendRoot();
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

  function average(arr, field){
    if(!arr.length) return 0;
    var total = 0;
    for(var i=0;i<arr.length;i++){
      total += arr[i][field] || 0;
    }
    return total / arr.length;
  }

  function getAverageAccuracy(){
    return average((analyticsTrendRead(["analytics","accuracyHistory"], []) || []), "accuracy");
  }

  function getAveragePracticeMinutes(){
    return average((analyticsTrendRead(["analytics","practiceHistory"], []) || []), "minutes");
  }

  function getRecentAccuracyTrend(){
    var arr = analyticsTrendRead(["analytics","accuracyHistory"], []) || [];
    if(arr.length < 2) return 0;
    return arr[arr.length-1].accuracy - arr[arr.length-2].accuracy;
  }

  function getXPTrend(){
    var arr = analyticsTrendRead(["analytics","xpHistory"], []) || [];
    if(arr.length < 2) return 0;
    return arr[arr.length-1].xp - arr[arr.length-2].xp;
  }

  window.getAverageAccuracy = getAverageAccuracy;
  window.getAveragePracticeMinutes = getAveragePracticeMinutes;
  window.getRecentAccuracyTrend = getRecentAccuracyTrend;
  window.getXPTrend = getXPTrend;

})();
