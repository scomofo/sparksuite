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
    payload = payload || {};
    var chartId = payload.chartId || "unknown";
    var chart = payload.chart || {};
    var results = payload.results || {};
    var difficulty = payload.difficulty || "normal";
    var arrangementType = chart.arrangementType || payload.arrangementType || "chords";

    if (!S.performSongStats || typeof S.performSongStats !== "object") S.performSongStats = {};
    if (!S.performSongStats[chartId]) {
      S.performSongStats[chartId] = {
        bestScore: 0,
        bestAccuracy: 0,
        bestStars: 0,
        runs: 0,
        phrases: {}
      };
    }

    var songStats = S.performSongStats[chartId];
    songStats.runs++;
    if (results.score > songStats.bestScore) songStats.bestScore = results.score;
    if (results.accuracy > songStats.bestAccuracy) songStats.bestAccuracy = results.accuracy;
    if (results.stars > songStats.bestStars) songStats.bestStars = results.stars;

    if (Array.isArray(results.phraseStats)) {
      for (var pi = 0; pi < results.phraseStats.length; pi++) {
        var ps = results.phraseStats[pi];
        var phraseKey = String(ps.phraseId);
        if (!songStats.phrases[phraseKey]) songStats.phrases[phraseKey] = { bestScore: 0, attempts: 0 };
        songStats.phrases[phraseKey].attempts++;
        var avg = ps.total > 0 ? ps.scoreSum / ps.total : 0;
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
    payload = payload || {};

    if (action === "start") {
      S.performChart = payload.chart || null;
      S.performChartId = payload.chartId || "";
      S.performPlaying = true;
      S.performPaused = false;
      S.performCurrentSec = 0;
      S.performStartSec = 0;
      S.performScore = 0;
      S.performCombo = 0;
      S.performMaxCombo = 0;
      S.performAccuracy = 0;
      S.performPhraseIdx = 0;
      S.performResults = null;
      S.performStarRating = 0;
      S.performLoop = null;
      S.performLastHitLabel = "";
      S.performLastHitTime = 0;
      if (payload.phraseStats) S.performPhraseStats = payload.phraseStats;
      if (payload.mode) S.performMode = payload.mode;
      if (payload.difficulty) S.performDifficulty = payload.difficulty;
      if (payload.speed) S.performSpeed = payload.speed;
      if (payload.preset) S.performPracticePreset = payload.preset;
      S.performInputSource = S.performMode;
      S.screen = payload.screen || SCR.PERFORM;
      return;
    }

    if (action === "start_failed") {
      S.screen = payload.screen || SCR.HOME;
      if (payload.tab != null) S.tab = payload.tab;
      return;
    }

    if (action === "stop") {
      S.performPlaying = false;
      S.performPaused = false;
      if (payload.screen) S.screen = payload.screen;
      if (payload.tab != null) S.tab = payload.tab;
      return;
    }

    if (action === "pause") {
      S.performPaused = true;
      S.performPlaying = false;
      return;
    }

    if (action === "resume") {
      S.performPaused = false;
      S.performPlaying = true;
      return;
    }

    if (action === "seek") {
      S.performCurrentSec = payload.sec || 0;
      return;
    }

    if (action === "set_loop") {
      S.performLoop = payload.loop || null;
      return;
    }

    if (action === "clear_loop") {
      S.performLoop = null;
      return;
    }

    if (action === "finish") {
      if (payload.results) {
        S.performResults = payload.results;
        S.performStarRating = payload.results.stars || 0;
      }
      S.performPlaying = false;
      S.performPaused = false;
      S.screen = payload.screen || SCR.PERFORM_DONE;
    }
  }

  function applyPerformanceDailyChallenge(summary, chart, results) {
    if (!S.performanceDailyChallenge || S.performanceDailyComplete) return 0;
    var dc = S.performanceDailyChallenge;
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
    if (!Array.isArray(S.earnedBadges)) return [];
    var awarded = [];

    function award(id) {
      if (S.earnedBadges.indexOf(id) >= 0) return;
      S.earnedBadges.push(id);
      awarded.push(id);
      S.newBadge = null;
      if (typeof BADGES !== "undefined" && Array.isArray(BADGES)) {
        for (var bi = 0; bi < BADGES.length; bi++) {
          if (BADGES[bi].id === id) {
            S.newBadge = BADGES[bi];
            break;
          }
        }
      }
    }

    award("perf_first");
    if (summary.stars >= 3) award("perf_3star");
    if (summary.stars >= 5) award("perf_5star");

    var totalRuns = 0;
    for (var key in S.performanceStats) {
      if (S.performanceStats[key] && S.performanceStats[key].runs) totalRuns += S.performanceStats[key].runs;
    }
    if (totalRuns >= 10) award("perf_10runs");

    for (var masteryKey in S.performanceStats) {
      if (S.performanceStats[masteryKey] && S.performanceStats[masteryKey].mastery === "mastered") {
        award("perf_mastered");
        break;
      }
    }

    if (chart && chart.arrangementType === "rhythm_chords") award("perf_rhythm");
    if (summary.difficultyId === "pro" && summary.stars >= 3) award("perf_pro");
    if (S.performanceDailyComplete) award("perf_daily");
    if (Array.isArray(S.performanceDailyHistory) && S.performanceDailyHistory.length >= 3) award("perf_streak3");

    if (typeof SONGS !== "undefined" && Array.isArray(SONGS)) {
      var playedSongs = 0;
      var totalSongs = 0;
      for (var si = 0; si < SONGS.length; si++) {
        if (!SONGS[si].progression || !SONGS[si].progression.length) continue;
        totalSongs++;
        var sid = (SONGS[si].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        for (var pk in S.performanceStats) {
          if (pk.indexOf(sid) === 0 && S.performanceStats[pk].runs > 0) {
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
    if (window.SparkProgressBridge && typeof window.SparkProgressBridge.applyLegacyReward === "function") {
      return window.SparkProgressBridge.applyLegacyReward(reward);
    }
    reward = reward || {};
    if (reward.xpDelta) {
      if (typeof SparkInstrumentProgress !== "undefined") {
        SparkInstrumentProgress.addXp(reward.xpDelta);
      } else {
        S.xp = (S.xp || 0) + reward.xpDelta;
      }
    }
    if (reward.toastAmount) {
      S.xpToast = {
        amount: reward.toastAmount,
        time: Date.now()
      };
    }
    return reward;
  }

  window.SparkPerformanceBridge = {
    buildPerformanceSummary: buildPerformanceSummary,
    applyPerformanceRunOutcome: applyPerformanceRunOutcome,
    applyPerformanceRunFollowOns: applyPerformanceRunFollowOns,
    syncPerformanceRuntimeState: syncPerformanceRuntimeState
  };
})();
