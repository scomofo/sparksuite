/* ===== ChordSpark Performance: Combo Decay + Grace ===== */

window.PERFORMANCE_GRACE_WINDOW_MS = 120;

window.getPerformanceComboDecayAmount = function(combo) {
  combo = typeof combo === "number" ? combo : 0;
  if (combo <= 5) return combo;
  if (combo <= 15) return 3;
  if (combo <= 30) return 5;
  return 8;
};
