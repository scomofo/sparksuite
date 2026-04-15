/* ===== ChordSpark Performance: Combo + Multiplier ===== */

window.getPerformanceMultiplier = function(combo) {
  combo = typeof combo === "number" ? combo : 0;
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
};
