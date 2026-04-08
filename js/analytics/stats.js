(function(){

  function _ensureAnalytics(){
    if(!S.analytics) S.analytics = {};
    if(!S.analytics.performanceHistory) S.analytics.performanceHistory = [];
    if(!S.analytics.accuracyHistory) S.analytics.accuracyHistory = [];
    if(!S.analytics.practiceHistory) S.analytics.practiceHistory = [];
    if(!S.analytics.xpHistory) S.analytics.xpHistory = [];
    if(!S.analytics.streakHistory) S.analytics.streakHistory = [];
  }

  function recordPerformanceStats(result){
    if(!result) return;
    _ensureAnalytics();
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
    _ensureAnalytics();
    S.analytics.practiceHistory.push({
      ts: Date.now(),
      minutes: minutes
    });
    saveState();
  }

  function recordXPStats(xp){
    _ensureAnalytics();
    S.analytics.xpHistory.push({
      ts: Date.now(),
      xp: xp
    });
  }

  function recordStreakStats(streak){
    _ensureAnalytics();
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
