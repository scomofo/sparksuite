(function() {
  function performanceRewardRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function performanceRewardRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = performanceRewardRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (!root) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function summarizePerformanceSessionResults(chart, results) {
    var summary = {
      timingScore: 0,
      maxCombo: results && typeof results.maxCombo === "number" ? results.maxCombo : 0,
      milestones: 0,
      streak: performanceRewardRead("streak", performanceRewardRead("practiceStreak", 0) || 0),
      sessionBonus: 0
    };

    if (chart && Array.isArray(chart.events)) {
      for (var i = 0; i < chart.events.length; i++) {
        var evt = chart.events[i];
        var evtResult = evt && evt._result ? evt._result : null;
        if (!evtResult) continue;
        if (typeof evtResult.points === "number") summary.timingScore += evtResult.points;
        if (evtResult.milestoneHit) summary.milestones++;
      }
    }

    if (results && results.totalEvents > 0) summary.sessionBonus = 25;

    return summary;
  }

  function buildPerformanceSessionRewardSummary(chart, results, options) {
    options = options || {};
    var summary = summarizePerformanceSessionResults(chart, results);
    var currentXP = typeof options.currentXP === "number"
      ? options.currentXP
      : performanceRewardRead("playerXP", performanceRewardRead("xp", 0) || 0);
    var previousLevel = typeof getProgressionLevelFromXP === "function"
      ? getProgressionLevelFromXP(currentXP)
      : 1;

    if (typeof options.sessionBonus === "number") summary.sessionBonus = options.sessionBonus;

    var xpGained = typeof calculateSessionXP === "function"
        ? calculateSessionXP({
          timingScore: summary.timingScore,
          combo: summary.maxCombo,
          milestones: summary.milestones,
          streak: summary.streak,
          sessionBonus: summary.sessionBonus
        })
      : 0;
    var totalXP = currentXP + xpGained;
    var level = typeof getProgressionLevelFromXP === "function"
      ? getProgressionLevelFromXP(totalXP)
      : previousLevel;

    return {
      xpGained: xpGained,
      totalXP: totalXP,
      level: level,
      previousLevel: previousLevel,
      leveledUp: level > previousLevel,
      nextLevelXP: typeof getNextProgressionLevelXP === "function"
        ? getNextProgressionLevelXP(level)
        : totalXP,
      summary: summary
    };
  }

  window.summarizePerformanceSessionResults = summarizePerformanceSessionResults;
  window.buildPerformanceSessionRewardSummary = buildPerformanceSessionRewardSummary;
})();
