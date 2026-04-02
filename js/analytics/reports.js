(function(){

  function generatePracticeReport(){
    return {
      totalPracticeMinutes: S.totalPracticeMinutes || 0,
      sessions: (S.practiceHistory || []).length,
      avgAccuracy: getAverageAccuracy(),
      currentStreak: S.practiceStreak || 0,
      level: S.playerLevel || 1
    };
  }

  function generatePerformanceReport(){
    return {
      songsPlayed: S.playerStats.songsCompleted || 0,
      avgAccuracy: getAverageAccuracy(),
      bestStreak: S.playerStats.streakBest || 0
    };
  }

  window.generatePracticeReport = generatePracticeReport;
  window.generatePerformanceReport = generatePerformanceReport;

})();
