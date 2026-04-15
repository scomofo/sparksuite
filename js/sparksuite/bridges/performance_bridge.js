(function() {
  function performanceBridgeRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function performanceBridgeRead(path, fallback) {
    var root = performanceBridgeRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function performanceBridgeWrite(path, value) {
    var root = performanceBridgeRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    if (!cursor || !parts.length) return value;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function performanceBridgeIncrement(path, delta) {
    delta = typeof delta === "number" ? delta : 0;
    return performanceBridgeWrite(path, (performanceBridgeRead(path, 0) || 0) + delta);
  }

  function performanceBridgeEnsureArray(path) {
    var current = performanceBridgeRead(path, null);
    if (!Array.isArray(current)) {
      current = [];
      performanceBridgeWrite(path, current);
    }
    return current;
  }

  function performanceBridgeEnsureObject(path) {
    var current = performanceBridgeRead(path, null);
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      current = {};
      performanceBridgeWrite(path, current);
    }
    return current;
  }

  function performanceBridgePatch(fields) {
    fields = fields || {};
    for (var key in fields) {
      performanceBridgeWrite(key, fields[key]);
    }
  }

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

    var performSongStats = performanceBridgeEnsureObject("performSongStats");
    if (!performSongStats[chartId]) {
      performSongStats[chartId] = {
        bestScore: 0,
        bestAccuracy: 0,
        bestStars: 0,
        runs: 0,
        phrases: {}
      };
    }

    var songStats = performSongStats[chartId];
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
      performanceBridgePatch({
        performChart: payload.chart || null,
        performChartId: payload.chartId || "",
        performPlaying: true,
        performPaused: false,
        performCurrentSec: 0,
        performStartSec: 0,
        performScore: 0,
        performCombo: 0,
        performMaxCombo: 0,
        performMultiplier: 1,
        performAccuracy: 0,
        performPhraseIdx: 0,
        performResults: null,
        performStarRating: 0,
        performLoop: null,
        performLastHitLabel: "",
        performLastHitTime: 0,
        screen: payload.screen || SCR.PERFORM
      });
      if (payload.phraseStats) performanceBridgeWrite("performPhraseStats", payload.phraseStats);
      if (payload.mode) performanceBridgeWrite("performMode", payload.mode);
      if (payload.difficulty) performanceBridgeWrite("performDifficulty", payload.difficulty);
      if (payload.speed) performanceBridgeWrite("performSpeed", payload.speed);
      if (payload.preset) performanceBridgeWrite("performPracticePreset", payload.preset);
      performanceBridgeWrite("performInputSource", performanceBridgeRead("performMode", null));
      return;
    }

    if (action === "start_failed") {
      performanceBridgeWrite("screen", payload.screen || SCR.HOME);
      if (payload.tab != null) performanceBridgeWrite("tab", payload.tab);
      return;
    }

    if (action === "stop") {
      performanceBridgePatch({
        performPlaying: false,
        performPaused: false
      });
      if (payload.screen) performanceBridgeWrite("screen", payload.screen);
      if (payload.tab != null) performanceBridgeWrite("tab", payload.tab);
      return;
    }

    if (action === "pause") {
      performanceBridgePatch({
        performPaused: true,
        performPlaying: false
      });
      return;
    }

    if (action === "resume") {
      performanceBridgePatch({
        performPaused: false,
        performPlaying: true
      });
      return;
    }

    if (action === "seek") {
      performanceBridgeWrite("performCurrentSec", payload.sec || 0);
      return;
    }

    if (action === "set_loop") {
      performanceBridgeWrite("performLoop", payload.loop || null);
      return;
    }

    if (action === "clear_loop") {
      performanceBridgeWrite("performLoop", null);
      return;
    }

    if (action === "finish") {
      if (payload.results) {
        performanceBridgeWrite("performResults", payload.results);
        performanceBridgeWrite("performStarRating", payload.results.stars || 0);
      }
      performanceBridgePatch({
        performPlaying: false,
        performPaused: false,
        screen: payload.screen || SCR.PERFORM_DONE
      });
    }
  }

  function applyPerformanceDailyChallenge(summary, chart, results) {
    if (!performanceBridgeRead("performanceDailyChallenge", null) || performanceBridgeRead("performanceDailyComplete", false)) return 0;
    var dc = performanceBridgeRead("performanceDailyChallenge", null);
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
    var earnedBadges = performanceBridgeEnsureArray("earnedBadges");
    var performanceStats = performanceBridgeEnsureObject("performanceStats");
    var awarded = [];

    function award(id) {
      if (earnedBadges.indexOf(id) >= 0) return;
      earnedBadges.push(id);
      awarded.push(id);
      performanceBridgeWrite("newBadge", null);
      if (typeof BADGES !== "undefined" && Array.isArray(BADGES)) {
        for (var bi = 0; bi < BADGES.length; bi++) {
          if (BADGES[bi].id === id) {
            performanceBridgeWrite("newBadge", BADGES[bi]);
            break;
          }
        }
      }
    }

    award("perf_first");
    if (summary.stars >= 3) award("perf_3star");
    if (summary.stars >= 5) award("perf_5star");

    var totalRuns = 0;
    for (var key in performanceStats) {
      if (performanceStats[key] && performanceStats[key].runs) totalRuns += performanceStats[key].runs;
    }
    if (totalRuns >= 10) award("perf_10runs");

    for (var masteryKey in performanceStats) {
      if (performanceStats[masteryKey] && performanceStats[masteryKey].mastery === "mastered") {
        award("perf_mastered");
        break;
      }
    }

    if (chart && chart.arrangementType === "rhythm_chords") award("perf_rhythm");
    if (summary.difficultyId === "pro" && summary.stars >= 3) award("perf_pro");
    if (performanceBridgeRead("performanceDailyComplete", false)) award("perf_daily");
    if (performanceBridgeEnsureArray("performanceDailyHistory").length >= 3) award("perf_streak3");

    if (typeof SONGS !== "undefined" && Array.isArray(SONGS)) {
      var playedSongs = 0;
      var totalSongs = 0;
      for (var si = 0; si < SONGS.length; si++) {
        if (!SONGS[si].progression || !SONGS[si].progression.length) continue;
        totalSongs++;
        var sid = (SONGS[si].title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        for (var pk in performanceStats) {
          if (pk.indexOf(sid) === 0 && performanceStats[pk].runs > 0) {
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
    if (window.sparkCore && typeof window.sparkCore.applyLegacyReward === "function") {
      return window.sparkCore.applyLegacyReward(reward);
    }
    reward = reward || {};
    if (reward.xpDelta) performanceBridgeIncrement("xp", reward.xpDelta);
    if (reward.toastAmount) {
      performanceBridgeWrite("xpToast", {
        amount: reward.toastAmount,
        time: Date.now()
      });
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
