(function() {
  function clampUnit(value) {
    if (typeof value !== "number" || !isFinite(value)) return 0;
    if (value > 1) value = value / 100;
    return Math.max(0, Math.min(1, value));
  }

  function calculateSkillMastery(metrics) {
    metrics = metrics || {};
    var accuracy = clampUnit(metrics.accuracy);
    var timing = clampUnit(metrics.timing);
    var combo = typeof metrics.combo === "number" && isFinite(metrics.combo) ? metrics.combo : 0;
    var comboFactor = Math.min(Math.max(combo, 0) / 20, 1);
    var mastery = (accuracy * 0.5) + (timing * 0.3) + (comboFactor * 0.2);
    return Math.min(1, mastery);
  }

  window.calculateSkillMastery = calculateSkillMastery;
})();
