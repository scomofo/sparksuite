(function(){

  function analyticsReportRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function analyticsReportRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = analyticsReportRoot();
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

  function generatePracticeReport(){
    return {
      totalPracticeMinutes: analyticsReportRead("totalPracticeMinutes", 0) || 0,
      sessions: (analyticsReportRead("practiceHistory", []) || []).length,
      avgAccuracy: getAverageAccuracy(),
      currentStreak: analyticsReportRead("practiceStreak", 0) || 0,
      level: analyticsReportRead("playerLevel", 1) || 1
    };
  }

  function generatePerformanceReport(){
    var stats = analyticsReportRead("playerStats", {}) || {};
    return {
      songsPlayed: stats.songsCompleted || 0,
      avgAccuracy: getAverageAccuracy(),
      bestStreak: stats.streakBest || 0
    };
  }

  window.generatePracticeReport = generatePracticeReport;
  window.generatePerformanceReport = generatePerformanceReport;

})();
