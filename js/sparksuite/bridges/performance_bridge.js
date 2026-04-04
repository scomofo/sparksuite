(function() {
  function buildPerformanceSummary(plan) {
    if (!plan || !Array.isArray(plan.segments)) return { durationSec: 0 };

    var durationSec = 0;
    for (var i = 0; i < plan.segments.length; i++) {
      durationSec += plan.segments[i].durationSec || 0;
    }

    return {
      durationSec: durationSec
    };
  }

  function applyPerformanceRunOutcome(payload) {
    var ps = window.sparkCore.persistedState;
    payload = payload || {};
    var chartId = payload.chartId || "unknown";
    var chart = payload.chart || {};
    var results = payload.results || {};
    var difficulty = payload.difficulty || "normal";
    var arrangementType = chart.arrangementType || payload.arrangementType || "chords";

    if (!ps.performSongStats || typeof ps.performSongStats !== "object") ps.performSongStats = {};
    if (!ps.performSongStats[chartId]) {
      ps.performSongStats[chartId] = {
        bestScore: 0,
        bestAccuracy: 0,
        bestStars: 0,
        runs: 0,
        phrases: {}
      };
    }

    var songStats = ps.performSongStats[chartId];
    songStats.runs++;
    if (results.score > songStats.bestScore) songStats.bestScore = results.score;
    if (results.accuracy > songStats.bestAccuracy) songStats.bestAccuracy = results.accuracy;
    if (results.stars > songStats.bestStars) songStats.bestStars = results.stars;

    if (Array.isArray(results.phraseStats)) {
      for (var pi = 0; pi < results.phraseStats.length; pi++) {
        var phr = results.phraseStats[pi];
        var phraseKey = String(phr.phraseId);
        if (!songStats.phrases[phraseKey]) songStats.phrases[phraseKey] = { bestScore: 0, attempts: 0 };
        songStats.phrases[phraseKey].attempts++;
        var avg = phr.total > 0 ? phr.scoreSum / phr.total : 0;
        if (avg > songStats.phrases[phraseKey].bestScore) songStats.phrases[phraseKey].bestScore = avg;
      }
    }

    var progressionStats = null;
    var unlocks = [];
    if (typeof updatePerformanceStats === "function") {
      progressionStats = updatePerformanceStats(chartId, arrangementType, difficulty, results);
      if (typeof checkPerformanceUnlocks === "function") {
        unlocks = checkPerformanceUnlocks(chartId, arrangementType, difficulty, progressionStats) || [];
      }
      if (unlocks.length > 0) results.unlocks = unlocks;
    }

    return {
      chartId: chartId,
      arrangementType: arrangementType,
      difficulty: difficulty,
      songStats: songStats,
      progressionStats: progressionStats,
      unlocks: unlocks
    };
  }

  function applyPerformanceRunFollowOns(payload) {
    payload = payload || {};
    var chartId = payload.chartId || "unknown";
    var chart = payload.chart || {};
    var results = payload.results || {};
    var difficulty = payload.difficulty || "normal";
    var progressionStats = payload.progressionStats || null;
    var songStats = payload.songStats || null;

    var summary = {
      songId: chartId,
      arrangementType: chart.arrangementType || payload.arrangementType || "chords",
      difficultyId: difficulty,
      totalEvents: results.totalEvents || 0,
      stars: results.stars || 0,
      accuracy: results.accuracy || 0
    };

    var dailyXp = applyPerformanceDailyChallenge(summary, chart, results);
    var builtInBadges = applyLegacyPerformanceBadges(summary, chart);
    var standaloneBadges = applyStandalonePerformanceBadges(summary, progressionStats, songStats);
    var unlockResult = applyStandalonePerformanceUnlocks(summary, progressionStats, songStats);

    return {
      dailyXp: dailyXp,
      builtInBadges: builtInBadges,
      standaloneBadges: standaloneBadges,
      unlockResult: unlockResult
    };
  }

  function syncPerformanceRuntimeState(action, payload) {
    var ps = window.sparkCore.persistedState;
    payload = payload || {};

    if (action === "start") {
      ps.performChart = payload.chart || null;
      ps.performChartId = payload.chartId || "";
      ps.performPlaying = true;
      ps.performPaused = false;
      ps.performCurrentSec = 0;
      ps.performStartSec = 0;
      ps.performScore = 0;
      ps.performCombo = 0;
      ps.performMaxCombo = 0;
      ps.performAccuracy = 0;
      ps.performPhraseIdx = 0;
      ps.performResults = null;
      ps.performStarRating = 0;
      ps.performLoop = null;
      ps.performLastHitLabel = "";
      ps.performLastHitTime = 0;
      if (payload.phraseStats) ps.performPhraseStats = payload.phraseStats;
      if (payload.mode) ps.performMode = payload.mode;
      if (payload.difficulty) ps.performDifficulty = payload.difficulty;
      if (payload.speed) ps.performSpeed = payload.speed;
      if (payload.preset) ps.performPracticePreset = payload.preset;
      ps.performInputSource = ps.performMode;
      ps.screen = payload.screen || SCR.PERFORM;
      return;
    }

    if (action === "start_failed") {
      ps.screen = payload.screen || SCR.HOME;
      if (payload.tab != null) ps.tab = payload.tab;
      return;
    }

    if (action === "stop") {
      ps.performPlaying = false;
      ps.performPaused = false;
      if (payload.screen) ps.screen = payload.screen;
      if (payload.tab != null) ps.tab = payload.tab;
      return;
    }

    if (action === "pause") {
      ps.performPaused = true;
      ps.performPlaying = false;
      return;
    }

    if (action === "resume") {
      ps.performPaused = false;
      ps.performPlaying = true;
      return;
    }

    if (action === "seek") {
      ps.performCurrentSec = payload.sec || 0;
      return;
    }

    if (action === "set_loop") {
      ps.performLoop = payload.loop || null;
      return;
    }

    if (action === "clear_loop") {
      ps.performLoop = null;
      return;
    }

    if (action === "finish") {
      if (payload.results) {
        ps.performResults = payload.results;
        ps.performStarRating = payload.results.stars || 0;
      }
      ps.performPlaying = false;
      ps.performPaused = false;
      ps.screen = payload.screen || SCR.PERFORM_DONE;
    }
  }

  function applyPerformanceDailyChallenge(summary, chart, results) {
    var ps = window.sparkCore.persistedState;
    if (!ps.performanceDailyChallenge || ps.performanceDailyComplete) return 0;
    var dc = ps.performanceDailyChallenge;
    var completed = false;
    if (dc.type === "full_run" && summary.totalEvents > 0) completed = true;
    if (dc.type === "retry_run" && summary.accuracy >= 70) completed = true;
    if (dc.type === "weakest_phrase" && summary.accuracy >= (((dc.target && dc.target.accuracy) || 85))) completed = true;
    if (dc.type === "imported_technique_focus") {
      var focusedSummary = results && results.importedTechniqueSummary && dc.techniqueKey
        ? results.importedTechniqueSummary[dc.techniqueKey]
        : null;
      var focusedAccuracy = focusedSummary && focusedSummary.total
        ? Math.round(((focusedSummary.hits || 0) / focusedSummary.total) * 100)
        : 0;
      completed = focusedAccuracy >= (((dc.target && dc.target.accuracy) || 90));
    }
    if (dc.type === "promote_difficulty" && summary.stars >= (((dc.target && dc.target.stars) || 3))) completed = true;
    if (dc.type === "try_rhythm" && chart && chart.arrangementType === "rhythm_chords") completed = true;
    if (!completed || typeof markPerformanceDailyComplete !== "function") return 0;

    var bonusXp = markPerformanceDailyComplete();
    if (bonusXp > 0) applyReward({ xpDelta: bonusXp, toastAmount: bonusXp });
    return bonusXp;
  }

  function applyLegacyPerformanceBadges(summary, chart) {
    var ps = window.sparkCore.persistedState;
    if (!Array.isArray(ps.earnedBadges)) return [];
    var awarded = [];

    function award(id) {
      if (ps.earnedBadges.indexOf(id) >= 0) return;
      ps.earnedBadges.push(id);
      awarded.push(id);
      ps.newBadge = null;
      if (typeof BADGES !== "undefined" && Array.isArray(BADGES)) {
        for (var bi = 0; bi < BADGES.length; bi++) {
          if (BADGES[bi].id === id) {
            ps.newBadge = BADGES[bi];
            break;
          }
        }
      }
    }

    award("perf_first");
    if (summary.stars >= 3) award("perf_3star");
    if (summary.stars >= 5) award("perf_5star");

    var totalRuns = 0;
    for (var key in ps.performanceStats) {
      if (ps.performanceStats[key] && ps.performanceStats[key].runs) totalRuns += ps.performanceStats[key].runs;
    }
    if (totalRuns >= 10) award("perf_10runs");

    for (var masteryKey in ps.performanceStats) {
      if (ps.performanceStats[masteryKey] && ps.performanceStats[masteryKey].mastery === "mastered") {
        award("perf_mastered");
        break;
      }
    }

    if (chart && chart.arrangementType === "rhythm_chords") award("perf_rhythm");
    if (summary.difficultyId === "pro" && summary.stars >= 3) award("perf_pro");
    if (ps.performanceDailyComplete) award("perf_daily");
    if (Array.isArray(ps.performanceDailyHistory) && ps.performanceDailyHistory.length >= 3) award("perf_streak3");

    if (typeof SONGS !== "undefined" && Array.isArray(SONGS)) {
      var playedSongs = 0;
      var totalSongs = 0;
      for (var si = 0; si < SONGS.length; si++) {
        if (!SONGS[si].progression || !SONGS[si].progression.length) continue;
        totalSongs++;
        var sid = (SONGS[si].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        for (var pk in ps.performanceStats) {
          if (pk.indexOf(sid) === 0 && ps.performanceStats[pk].runs > 0) {
            playedSongs++;
            break;
          }
        }
      }
      if (totalSongs > 0 && playedSongs >= totalSongs) award("perf_allsongs");
    }

    return awarded;
  }

  function applyStandalonePerformanceBadges(summary, progressionStats, songStats) {
    if (typeof evaluatePerformanceBadges !== "function") return [];
    var stats = progressionStats || songStats || null;
    var badges = evaluatePerformanceBadges(summary, stats) || [];
    if (badges.length > 0) applyReward({ xpDelta: badges.length * 10 });
    return badges;
  }

  function applyStandalonePerformanceUnlocks(summary, progressionStats, songStats) {
    if (typeof applyPerformanceUnlocks !== "function") return { xp: 0, events: [] };
    var stats = progressionStats || songStats || null;
    var unlockResult = applyPerformanceUnlocks(summary, stats) || { xp: 0, events: [] };
    if (unlockResult.xp > 0) applyReward({ xpDelta: unlockResult.xp });
    return unlockResult;
  }

  function applyReward(reward) {
    return window.sparkCore.applyReward(reward);
  }

  window.SparkPerformanceBridge = {
    buildPerformanceSummary: buildPerformanceSummary,
    applyPerformanceRunOutcome: applyPerformanceRunOutcome,
    applyPerformanceRunFollowOns: applyPerformanceRunFollowOns,
    syncPerformanceRuntimeState: syncPerformanceRuntimeState
  };
})();
