(function() {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.SparkDrumsProgression = {
    masteryWeights: {
      timing: 0.4,
      laneAccuracy: 0.25,
      grooveConsistency: 0.2,
      recovery: 0.1,
      dynamics: 0.05
    },
    softUnlockThreshold: 0.55,
    defaultMasteryRequired: 0.75,
    adaptiveDifficulty: {
      same_pattern: { minAccuracy: 0, bpmDelta: 0, assist: "full" },
      same_pattern_shorter: { minAccuracy: 0.65, bpmDelta: 0, assist: "reduced" },
      next_variation: { minAccuracy: 0.82, bpmDelta: 4, assist: "timing" }
    },
    applyDrumResultToMastery: function(skillId, result) {
      result = result || {};
      var gameplay = result.gameplay || {};
      var learning = result.learning || {};
      var accuracy = typeof gameplay.accuracy === "number" ? gameplay.accuracy : 0;
      if (accuracy > 1) accuracy = accuracy / 100;
      var comboBonus = clamp((gameplay.maxCombo || 0) / 32, 0, 0.2);
      var weakPenalty = Array.isArray(learning.weakAreas) && learning.weakAreas.length ? 0.04 : 0;
      return {
        skillId: skillId,
        delta: clamp((accuracy * 0.12) + comboBonus - weakPenalty, 0.01, 0.18),
        accuracy: accuracy,
        nextAssist: accuracy >= 0.82 ? "timing" : accuracy >= 0.65 ? "reduced" : "full"
      };
    }
  };
})();
