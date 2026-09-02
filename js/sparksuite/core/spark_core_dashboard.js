/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Dashboard and home: snapshots, challenges, recommendations
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.buildDashboardRequest = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      recommendations: Object.prototype.hasOwnProperty.call(options, "recommendations")
        ? this.cloneValue(options.recommendations)
        : this.cloneValue(runtimeState.dashboardRecommendations || []),
      insights: Object.prototype.hasOwnProperty.call(options, "insights")
        ? this.cloneValue(options.insights)
        : this.cloneValue(runtimeState.dashboardInsights),
      challenges: Object.prototype.hasOwnProperty.call(options, "challenges")
        ? this.cloneValue(options.challenges)
        : this.cloneValue(runtimeState.dashboardChallenges || []),
      refreshedAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt")
        ? options.refreshedAt
        : Date.now()
    };
  };

  SparkCore.prototype.applyDashboardRequest = function(options) {
    var request = this.buildDashboardRequest(options);
    return this.updateRuntimeState({
      dashboardRecommendations: request.recommendations || [],
      dashboardInsights: request.insights || null,
      dashboardChallenges: request.challenges || [],
      lastDashboardRefreshAt: request.refreshedAt || null
    });
  };

  SparkCore.prototype.refreshDashboardSnapshot = function(options) {
    return this.applyDashboardRequest(options || {});
  };

  SparkCore.prototype.initializeDashboardChallenges = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return this.applyDashboardRequest({
      recommendations: Object.prototype.hasOwnProperty.call(options, "recommendations")
        ? options.recommendations
        : (runtimeState.dashboardRecommendations || []),
      insights: Object.prototype.hasOwnProperty.call(options, "insights")
        ? options.insights
        : (runtimeState.dashboardInsights || null),
      challenges: Object.prototype.hasOwnProperty.call(options, "challenges")
        ? options.challenges
        : (runtimeState.dashboardChallenges || []),
      refreshedAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt")
        ? options.refreshedAt
        : Date.now()
    });
  };

  SparkCore.prototype.buildDashboardNavigationRequest = function(target) {
    var request = {
      target: target || "home_dash",
      activeScreen: "home_dash",
      activeTab: this.runtimeState.activeTab || null
    };

    if (request.target === "dashboard_back") request.activeScreen = "home_dash";
    else if (request.target === "recommendations") request.activeScreen = "recommendations";
    else if (request.target === "insights") request.activeScreen = "insights";
    else if (request.target === "challenges") request.activeScreen = "challenges";
    else if (request.target === "career") request.activeScreen = "career";
    else request.activeScreen = "home_dash";

    return request;
  };

  SparkCore.prototype.applyDashboardNavigationRequest = function(target) {
    var request = this.buildDashboardNavigationRequest(target);
    return this.updateRuntimeState({
      activeScreen: request.activeScreen,
      activeTab: request.activeTab
    });
  };

  SparkCore.prototype.openDashboardSection = function(target) {
    return this.applyDashboardNavigationRequest(target || "home_dash");
  };

  SparkCore.prototype.returnFromHomeFamily = function(options) {
    options = options || {};
    var currentScreen = options.currentScreen || this.runtimeState.activeScreen || "home";
    var isDashboardFamily = currentScreen === "recommendations"
      || currentScreen === "insights"
      || currentScreen === "challenges"
      || currentScreen === "career"
      || currentScreen === "home_dash";
    if (isDashboardFamily) {
      return this.applyDashboardNavigationRequest("dashboard_back");
    }
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: this.runtimeState.activeTab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.getDashboardRecommendationById = function(id) {
    var arr = this.runtimeState.dashboardRecommendations || [];
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === id) return this.cloneValue(arr[i]);
    }
    return null;
  };

  SparkCore.prototype.buildDashboardRecommendationLaunchRequest = function(id) {
    return {
      recommendationId: id || null,
      recommendation: id ? this.getDashboardRecommendationById(id) : null
    };
  };

  SparkCore.prototype.launchDashboardRecommendation = function(id) {
    var request = this.buildDashboardRecommendationLaunchRequest(id);
    if (request.recommendation) {
      this.updateRuntimeState({
        activeScreen: "recommendations",
        lastDashboardRecommendationId: request.recommendationId
      });
    }
    return request;
  };

  SparkCore.prototype.applyDashboardChallengeReward = function(challengeId) {
    var arr = this.cloneValue(this.runtimeState.dashboardChallenges || []);
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === challengeId) {
        arr[i].claimed = true;
        break;
      }
    }
    return this.updateRuntimeState({
      dashboardChallenges: arr
    });
  };
})();
