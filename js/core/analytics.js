(function(){
  function coreAnalyticsRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function coreAnalyticsRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = coreAnalyticsRoot();
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

  function coreAnalyticsWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = coreAnalyticsRoot();
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

  function recordPerformanceAnalytics(result){
    var analytics = coreAnalyticsRead("analytics", null);
    if(!analytics || typeof analytics !== "object") analytics = { performances: [] };
    if(!Array.isArray(analytics.performances)) analytics.performances = [];
    analytics.performances.push(result);
    coreAnalyticsWrite("analytics", analytics);
    if(typeof saveState === "function") saveState();
  }

  function getAverageAccuracy(){
    var arr = ((coreAnalyticsRead("analytics", {}) || {}).performances) || [];
    if(!arr.length) return 0;
    var total = 0;
    for(var i=0;i<arr.length;i++){
      total += arr[i].accuracy || 0;
    }
    return total / arr.length;
  }

  window.recordPerformanceAnalytics = recordPerformanceAnalytics;
  window.getAverageAccuracy = getAverageAccuracy;
})();
