(function(){
  var PERFORMANCE_DIFFICULTIES = {
    easy: {
      id: "easy",
      label: "Easy",
      perfectMs: 100,
      goodMs: 180,
      missMs: 280,
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
      perfectMs: 70,
      goodMs: 140,
      missMs: 220,
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
      perfectMs: 45,
      goodMs: 90,
      missMs: 160,
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
