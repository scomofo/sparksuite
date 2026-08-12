// js/sparksuite/domain/completion_xp.js
// Single completion-XP policy for gameplay runs, shared by every mode
// (rhythm highway, performance mode, legacy rhythm tap game): completing
// a run earns a base 20 XP plus up to 20 XP scaled by note accuracy.
// Before this policy the modes disagreed wildly (performance paid 5-10,
// the tap game paid raw score/10) — one formula keeps progression fair
// across modes. Presentation-layer scoring (points, combos, stars) stays
// per-mode; only the progression currency is normalized.
(function() {
  var SparkCompletionXp = {
    // accuracyPct: 0-100 note accuracy (hits over chart note events).
    forAccuracy: function(accuracyPct) {
      var pct = typeof accuracyPct === "number" && isFinite(accuracyPct) ? accuracyPct : 0;
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
      return 20 + Math.round(pct / 5);
    }
  };

  if (typeof window !== "undefined") window.SparkCompletionXp = SparkCompletionXp;
  if (typeof module !== "undefined") {
    module.exports = { SparkCompletionXp: SparkCompletionXp };
  }
})();
