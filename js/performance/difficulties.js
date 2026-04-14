(function(){
  function performanceDifficultyRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function performanceDifficultyWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = performanceDifficultyRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (!cursor || !parts.length) return value;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

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
    performanceDifficultyWrite("performDifficulty", diff.id);
    performanceDifficultyWrite("performWindowPerfectMs", diff.perfectMs);
    performanceDifficultyWrite("performWindowGoodMs", diff.goodMs);
    performanceDifficultyWrite("performWindowMissMs", diff.missMs);
    return diff;
  }

  window.PERFORMANCE_DIFFICULTIES = PERFORMANCE_DIFFICULTIES;
  window.getPerformanceDifficulty = getPerformanceDifficulty;
  window.applyPerformanceDifficultyToState = applyPerformanceDifficultyToState;
})();
