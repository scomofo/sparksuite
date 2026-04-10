(function(){

  function buildHomeDashboardData(){
    return {
      profile: buildHomeProfileSummary(),
      practice: buildHomePracticeSummary(),
      playAlong: buildHomePlayAlongSummary(),
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
    var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
      ? window.sparkCore.getActiveSessionView()
      : null;
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    return (runtimeState && runtimeState.dashboardRecommendations) || S.recommendations || [];
  }

  function buildHomeChallengeSummary(){
    var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
      ? window.sparkCore.getActiveSessionView()
      : null;
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    if (runtimeState && runtimeState.dashboardChallenges) {
      return (runtimeState.dashboardChallenges || []).slice(0, 3);
    }
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
    var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
      ? window.sparkCore.getActiveSessionView()
      : null;
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    return (runtimeState && runtimeState.dashboardInsights) || S.personalInsights || {};
  }

  function buildHomeEventSummary(){
    return typeof getActiveSeasonalEvent === "function" ? getActiveSeasonalEvent() : null;
  }

  function buildHomeSystemSummary(){
    var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
      ? window.sparkCore.getActiveSessionView()
      : null;
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : (window.sparkCore && window.sparkCore.runtimeState ? window.sparkCore.runtimeState : null);
    return {
      cloudStatus: (S.cloudSync && S.cloudSync.lastSyncStatus) || "offline",
      version: (S.releaseInfo && S.releaseInfo.version) || "dev",
      executionTrace: runtimeState && runtimeState.lastExecutionTrace ? runtimeState.lastExecutionTrace : (window.__sparkExecutionTrace || null),
      transportMode: runtimeState && runtimeState.playAlongTransportMode ? runtimeState.playAlongTransportMode : null,
      recentPlayAlong: Array.isArray(S.playAlongRecent) ? S.playAlongRecent.slice(0, 2) : []
    };
  }

  function buildHomePlayAlongSummary(){
    var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent.slice(0, 1) : [];
    var bookmarks = Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks.slice(0, 2) : [];
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome ? window.sparkCore.lastSessionOutcome : null;
    return {
      recent: recent,
      bookmarks: bookmarks,
      outcome: outcome,
      transportMode: window.sparkCore && window.sparkCore.runtimeState ? window.sparkCore.runtimeState.playAlongTransportMode : null,
      weakAreas: outcome && outcome.performance && Array.isArray(outcome.performance.weakAreas) ? outcome.performance.weakAreas.slice(0, 3) : [],
      hasDrill: !!(outcome && Array.isArray(outcome.drills) && outcome.drills.length),
      weakSection: outcome && outcome.sectionSummary ? outcome.sectionSummary : null
    };
  }

  window.buildHomeDashboardData = buildHomeDashboardData;

})();
