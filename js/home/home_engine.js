(function(){

  function getHomeEngineCoreView(){
    var core = (typeof window !== "undefined" && window.sparkCore)
      || (typeof sparkCore !== "undefined" ? sparkCore : null);
    return core && typeof core.getActiveSessionView === "function" ? core.getActiveSessionView() : null;
  }

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
      totalMinutes: S.totalPracticeMinutes || 0,
      activeInstrumentType: getHomeActiveInstrumentType()
    };
  }

  function getHomeActiveInstrumentType(){
    var active;
    if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function") {
      active = SparkInstruments.getActive();
      if (active) return String(active.instrument || active.instrumentType || active.id || active.appId || "").toLowerCase();
    }
    return String(S.activeInstrument || (S.profile && S.profile.instrumentPrimary) || "").toLowerCase();
  }

  function buildHomeRecommendationSummary(){
    var coreView = getHomeEngineCoreView();
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    return (runtimeState && runtimeState.dashboardRecommendations) || S.recommendations || [];
  }

  function buildHomeChallengeSummary(){
    var coreView = getHomeEngineCoreView();
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
    var coreView = getHomeEngineCoreView();
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    return (runtimeState && runtimeState.dashboardInsights) || S.personalInsights || {};
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
