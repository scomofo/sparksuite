(function() {

  var TIERS = [
    { id: "gold", label: "Gold", threshold: 0.8, color: "#FFE66D" },
    { id: "silver", label: "Silver", threshold: 0.6, color: "#C0C0C0" },
    { id: "bronze", label: "Bronze", threshold: 0.4, color: "#CD7F32" }
  ];

  function getTier(value) {
    for (var i = 0; i < TIERS.length; i++) {
      if (value >= TIERS[i].threshold) return TIERS[i];
    }
    return null;
  }

  function getMasteryLevels(skillGraph) {
    if (!skillGraph) return {};
    return {
      timing: getTier(skillGraph.timing),
      rhythm: getTier(skillGraph.rhythm),
      chordAccuracy: getTier(skillGraph.chordAccuracy)
    };
  }

  function getUnlocks(skillGraph) {
    if (!skillGraph) return [];
    var unlocks = [];
    if (skillGraph.timing >= 0.8) unlocks.push({ id: "advanced_timing_tracks", label: "Advanced Timing Tracks" });
    if (skillGraph.rhythm >= 0.8) unlocks.push({ id: "complex_rhythm_patterns", label: "Complex Rhythm Patterns" });
    if (skillGraph.chordAccuracy >= 0.8) unlocks.push({ id: "advanced_chord_progressions", label: "Advanced Chord Progressions" });
    if (skillGraph.timing >= 0.6 && skillGraph.rhythm >= 0.6 && skillGraph.chordAccuracy >= 0.6) {
      unlocks.push({ id: "challenge_mode", label: "Challenge Mode" });
    }
    if (skillGraph.timing >= 0.8 && skillGraph.rhythm >= 0.8 && skillGraph.chordAccuracy >= 0.8) {
      unlocks.push({ id: "master_mode", label: "Master Mode" });
    }
    return unlocks;
  }

  function renderMasteryBadge(tier) {
    if (!tier) return "";
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;background:' + tier.color + '22;color:' + tier.color + '">' + escHTML(tier.label) + '</span>';
  }

  var SparkMasteryEngine = {
    getTier: getTier,
    getMasteryLevels: getMasteryLevels,
    getUnlocks: getUnlocks,
    renderBadge: renderMasteryBadge,
    TIERS: TIERS
  };

  if (typeof window !== "undefined") window.SparkMasteryEngine = SparkMasteryEngine;
  if (typeof module !== "undefined") module.exports = SparkMasteryEngine;
})();
