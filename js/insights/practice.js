(function(){

  function practiceInsightRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function practiceInsightRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = practiceInsightRoot();
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

  function buildPracticeInsights(){
    return {
      avgMinutes: typeof getAveragePracticeMinutes === "function" ? getAveragePracticeMinutes() : 0,
      currentStreak: practiceInsightRead("practiceStreak", 0) || 0,
      totalMinutes: practiceInsightRead("totalPracticeMinutes", 0) || 0,
      sessionCount: (practiceInsightRead("practiceHistory", []) || []).length,
      recentAccuracyTrend: typeof getRecentAccuracyTrend === "function" ? getRecentAccuracyTrend() : 0
    };
  }

  function buildPracticeTrendSeries(){
    var snaps = practiceInsightRead("insightSnapshots", []) || [];
    return {
      minutes: extractPracticeSeries(snaps, "totalMinutes"),
      streak: extractPracticeSeries(snaps, "streak"),
      accuracy: extractPracticeSeries(snaps, "avgAccuracy")
    };
  }

  function extractPracticeSeries(snaps, field){
    var out = [];
    for(var i=0;i<snaps.length;i++){
      out.push({
        ts: snaps[i].ts,
        value: snaps[i].practice ? (snaps[i].practice[field] || 0) : 0
      });
    }
    return out;
  }

  window.buildPracticeInsights = buildPracticeInsights;
  window.buildPracticeTrendSeries = buildPracticeTrendSeries;

})();
