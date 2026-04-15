(function() {
  var LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900];

  function getProgressionLevelFromXP(xp) {
    xp = typeof xp === "number" && isFinite(xp) ? xp : 0;
    for (var i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  function getNextProgressionLevelXP(level) {
    level = typeof level === "number" && isFinite(level) ? level : 1;
    return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  }

  window.PERFORMANCE_LEVEL_THRESHOLDS = LEVEL_THRESHOLDS.slice();
  window.getProgressionLevelFromXP = getProgressionLevelFromXP;
  window.getNextProgressionLevelXP = getNextProgressionLevelXP;
})();
