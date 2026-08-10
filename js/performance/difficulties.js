(function(){
  // Hit windows come from the single source of truth,
  // SparkEnginePresetRegistry (js/sparksuite/domain/engine_preset.js) —
  // each difficulty names its preset. Scoring weights and behavior flags
  // are performance-mode policy and stay here.
  function windowsFrom(presetName, fallback) {
    if (typeof SparkEnginePresetRegistry !== "undefined") {
      var preset = SparkEnginePresetRegistry.get(presetName);
      if (preset && preset.hitWindowMs) {
        return { perfectMs: preset.hitWindowMs.perfect, goodMs: preset.hitWindowMs.good, missMs: preset.hitWindowMs.miss };
      }
    }
    return fallback;
  }

  var EASY_WINDOWS = windowsFrom("spark_gentle", { perfectMs: 100, goodMs: 180, missMs: 280 });
  var NORMAL_WINDOWS = windowsFrom("spark_learning", { perfectMs: 70, goodMs: 140, missMs: 220 });
  var PRO_WINDOWS = windowsFrom("spark_pro", { perfectMs: 45, goodMs: 90, missMs: 160 });

  var PERFORMANCE_DIFFICULTIES = {
    easy: {
      id: "easy",
      label: "Easy",
      enginePreset: "spark_gentle",
      perfectMs: EASY_WINDOWS.perfectMs,
      goodMs: EASY_WINDOWS.goodMs,
      missMs: EASY_WINDOWS.missMs,
      noteWeight: 0.85,
      timingWeight: 0.15,
      partialCreditFloor: 0.25,
      requireAttackCluster: false,
      showHints: true,
      checkStrumDirection: false,
      directionWeight: 0.0
    },
    normal: {
      id: "normal",
      label: "Normal",
      enginePreset: "spark_learning",
      perfectMs: NORMAL_WINDOWS.perfectMs,
      goodMs: NORMAL_WINDOWS.goodMs,
      missMs: NORMAL_WINDOWS.missMs,
      noteWeight: 0.75,
      timingWeight: 0.25,
      partialCreditFloor: 0.35,
      requireAttackCluster: true,
      showHints: true,
      checkStrumDirection: true,
      directionWeight: 0.15
    },
    pro: {
      id: "pro",
      label: "Pro",
      enginePreset: "spark_pro",
      perfectMs: PRO_WINDOWS.perfectMs,
      goodMs: PRO_WINDOWS.goodMs,
      missMs: PRO_WINDOWS.missMs,
      noteWeight: 0.65,
      timingWeight: 0.35,
      partialCreditFloor: 0.45,
      requireAttackCluster: true,
      showHints: false,
      checkStrumDirection: true,
      directionWeight: 0.25
    }
  };

  function getPerformanceDifficulty(id) {
    if (!id || !PERFORMANCE_DIFFICULTIES[id]) return PERFORMANCE_DIFFICULTIES.normal;
    return PERFORMANCE_DIFFICULTIES[id];
  }

  function applyPerformanceDifficultyToState(id) {
    var diff = getPerformanceDifficulty(id);
    if (typeof S !== "undefined") {
      S.performDifficulty = diff.id;
      S.performWindowPerfectMs = diff.perfectMs;
      S.performWindowGoodMs = diff.goodMs;
      S.performWindowMissMs = diff.missMs;
    }
    return diff;
  }

  window.PERFORMANCE_DIFFICULTIES = PERFORMANCE_DIFFICULTIES;
  window.getPerformanceDifficulty = getPerformanceDifficulty;
  window.applyPerformanceDifficultyToState = applyPerformanceDifficultyToState;
})();
