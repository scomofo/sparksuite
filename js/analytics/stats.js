(function(){

  function recordPerformanceStats(result){
    if(!result) return;
    S.analytics.performanceHistory.push({
      ts: Date.now(),
      accuracy: result.accuracy || 0,
      score: result.score || 0,
      songId: result.songId,
      arrangementType: result.arrangementType
    });
    S.analytics.accuracyHistory.push({
      ts: Date.now(),
      accuracy: result.accuracy || 0
    });
    saveState();
  }

  function recordPracticeStats(minutes){
    S.analytics.practiceHistory.push({
      ts: Date.now(),
      minutes: minutes
    });
    saveState();
  }

  function recordXPStats(xp){
    S.analytics.xpHistory.push({
      ts: Date.now(),
      xp: xp
    });
  }

  function recordStreakStats(streak){
    S.analytics.streakHistory.push({
      ts: Date.now(),
      streak: streak
    });
  }

  window.recordPerformanceStats = recordPerformanceStats;
  window.recordPracticeStats = recordPracticeStats;
  window.recordXPStats = recordXPStats;
  window.recordStreakStats = recordStreakStats;

})();
