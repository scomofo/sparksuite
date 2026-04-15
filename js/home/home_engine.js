(function(){
  function homeStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function homeStateRead(path, fallback){
    var root = homeStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function getCoreView() {
    return window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
      ? window.sparkCore.getActiveSessionView()
      : null;
  }

  function getPlayAlongView() {
    var core = window.sparkCore || null;
    if (core && typeof core.getPlayAlongDashboardView === "function") {
      return core.getPlayAlongDashboardView();
    }
    return null;
  }

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
    var player = window.sparkCore && typeof window.sparkCore.getLegacyPlayerSnapshot === "function"
      ? window.sparkCore.getLegacyPlayerSnapshot()
      : null;
    return {
      level: player && typeof player.level === "number" ? player.level : homeStateRead("playerLevel", homeStateRead("level", 1)),
      xp: player && typeof player.xp === "number" ? player.xp : homeStateRead("playerXP", homeStateRead("xp", 0)),
      streak: player && typeof player.streak === "number" ? player.streak : homeStateRead("practiceStreak", homeStateRead("streak", 0))
    };
  }

  function buildHomePracticeSummary(){
    return {
      todayPlan: homeStateRead("dailyPracticePlan", []),
      totalMinutes: homeStateRead("totalPracticeMinutes", homeStateRead(["profile", "totalPracticeMinutes"], 0))
    };
  }

  function buildHomeRecommendationSummary(){
    var coreView = getCoreView();
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    return (runtimeState && runtimeState.dashboardRecommendations) || homeStateRead("recommendations", []);
  }

  function buildHomeChallengeSummary(){
    var coreView = getCoreView();
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    if (runtimeState && Array.isArray(runtimeState.dashboardChallenges) && runtimeState.dashboardChallenges.length) {
      return (runtimeState.dashboardChallenges || []).slice(0, 3);
    }
    var incomplete = typeof getIncompleteChallenges === "function" ? getIncompleteChallenges(3) : [];
    if (incomplete.length) return incomplete;
    if (typeof initializeChallengesForCurrentCycle === "function") {
      initializeChallengesForCurrentCycle();
      return typeof getIncompleteChallenges === "function" ? getIncompleteChallenges(3) : [];
    }
    return [];
  }

  function buildHomeCareerSummary(){
    return {
      nextSong: typeof getRecommendedCareerSong === "function" ? getRecommendedCareerSong() : null
    };
  }

  function buildHomePackSummary(){
    return homeStateRead("packCompletion", {});
  }

  function buildHomeInsightSummary(){
    var coreView = getCoreView();
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    return (runtimeState && runtimeState.dashboardInsights) || homeStateRead("personalInsights", {});
  }

  function buildHomeEventSummary(){
    return typeof getActiveSeasonalEvent === "function" ? getActiveSeasonalEvent() : null;
  }

  function buildHomeSystemSummary(){
    var coreView = getCoreView();
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : (window.sparkCore && window.sparkCore.runtimeState ? window.sparkCore.runtimeState : null);
    var playAlongView = coreView && coreView.playAlong ? coreView.playAlong : getPlayAlongView();
    return {
      cloudStatus: homeStateRead(["cloudSync", "lastSyncStatus"], "offline"),
      version: homeStateRead(["releaseInfo", "version"], "dev"),
      executionTrace: runtimeState && runtimeState.lastExecutionTrace ? runtimeState.lastExecutionTrace : (window.__sparkExecutionTrace || null),
      transportMode: runtimeState && runtimeState.playAlongTransportMode ? runtimeState.playAlongTransportMode : null,
      recentPlayAlong: playAlongView && Array.isArray(playAlongView.recent)
        ? playAlongView.recent.slice(0, 2)
        : homeStateRead("playAlongRecent", []).slice(0, 2)
    };
  }

  function buildHomePlayAlongSummary(){
    var playAlongView = getPlayAlongView();
    var recent = playAlongView && Array.isArray(playAlongView.recent)
      ? playAlongView.recent.slice(0, 1)
      : homeStateRead("playAlongRecent", []).slice(0, 1);
    var bookmarks = playAlongView && Array.isArray(playAlongView.bookmarks)
      ? playAlongView.bookmarks.slice(0, 2)
      : homeStateRead("playAlongBookmarks", []).slice(0, 2);
    var outcome = playAlongView && Object.prototype.hasOwnProperty.call(playAlongView, "outcome")
      ? playAlongView.outcome
      : (window.sparkCore && typeof window.sparkCore.getLastSessionOutcome === "function"
        ? window.sparkCore.getLastSessionOutcome()
        : (window.sparkCore ? window.sparkCore.lastSessionOutcome : null));
    return {
      recent: recent,
      bookmarks: bookmarks,
      outcome: outcome,
      transportMode: playAlongView && playAlongView.transportMode != null
        ? playAlongView.transportMode
        : (window.sparkCore && window.sparkCore.runtimeState ? window.sparkCore.runtimeState.playAlongTransportMode : null),
      weakAreas: playAlongView && Array.isArray(playAlongView.weakAreas)
        ? playAlongView.weakAreas.slice(0, 3)
        : (outcome && outcome.performance && Array.isArray(outcome.performance.weakAreas) ? outcome.performance.weakAreas.slice(0, 3) : []),
      hasDrill: playAlongView ? !!playAlongView.hasDrill : !!(outcome && Array.isArray(outcome.drills) && outcome.drills.length),
      weakSection: playAlongView && playAlongView.weakSection
        ? playAlongView.weakSection
        : (outcome && outcome.sectionSummary ? outcome.sectionSummary : null)
    };
  }

  window.buildHomeDashboardData = buildHomeDashboardData;

})();
