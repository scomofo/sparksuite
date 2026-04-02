(function(){

  function buildHomeDashboardData(){
    return {
      profile: buildHomeProfileSummary(),
      practice: buildHomePracticeSummary(),
      recommendations: buildHomeRecommendationSummary(),
      challenges: buildHomeChallengeSummary(),
      career: buildHomeCareerSummary(),
      packs: buildHomePackSummary(),
      insights: buildHomeInsightSummary(),
      event: buildHomeEventSummary(),
      system: buildHomeSystemSummary()
    };
  }

  function buildHomeProfileSummary(){
    return {
      level: S.playerLevel || 1,
      xp: S.playerXP || 0,
      streak: S.practiceStreak || 0
    };
  }

  function buildHomePracticeSummary(){
    return {
      todayPlan: S.dailyPracticePlan || [],
      totalMinutes: S.totalPracticeMinutes || 0
    };
  }

  function buildHomeRecommendationSummary(){
    return S.recommendations || [];
  }

  function buildHomeChallengeSummary(){
    return typeof getIncompleteChallenges === "function" ? getIncompleteChallenges(3) : [];
  }

  function buildHomeCareerSummary(){
    return {
      nextSong: typeof getRecommendedCareerSong === "function" ? getRecommendedCareerSong() : null
    };
  }

  function buildHomePackSummary(){
    return S.packCompletion || {};
  }

  function buildHomeInsightSummary(){
    return S.personalInsights || {};
  }

  function buildHomeEventSummary(){
    return typeof getActiveSeasonalEvent === "function" ? getActiveSeasonalEvent() : null;
  }

  function buildHomeSystemSummary(){
    return {
      cloudStatus: (S.cloudSync && S.cloudSync.lastSyncStatus) || "offline",
      version: (S.releaseInfo && S.releaseInfo.version) || "dev"
    };
  }

  window.buildHomeDashboardData = buildHomeDashboardData;

})();
