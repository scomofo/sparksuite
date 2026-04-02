(function(){

  function buildPracticeInsights(){
    return {
      avgMinutes: typeof getAveragePracticeMinutes === "function" ? getAveragePracticeMinutes() : 0,
      currentStreak: S.practiceStreak || 0,
      totalMinutes: S.totalPracticeMinutes || 0,
      sessionCount: (S.practiceHistory || []).length,
      recentAccuracyTrend: typeof getRecentAccuracyTrend === "function" ? getRecentAccuracyTrend() : 0
    };
  }

  function buildPracticeTrendSeries(){
    var snaps = S.insightSnapshots || [];
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
