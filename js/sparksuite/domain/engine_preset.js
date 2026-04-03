(function() {
  var PRESETS = {
    gh_like: {
      name: "gh_like",
      hitWindowMs: { perfect: 45, good: 90, miss: 140 },
      extraFretTolerance: false,
      comboStep: 10,
      maxMultiplier: 4
    },
    rb_like: {
      name: "rb_like",
      hitWindowMs: { perfect: 55, good: 100, miss: 150 },
      extraFretTolerance: true,
      comboStep: 10,
      maxMultiplier: 4
    },
    clone_hero_like: {
      name: "clone_hero_like",
      hitWindowMs: { perfect: 40, good: 85, miss: 135 },
      extraFretTolerance: false,
      comboStep: 10,
      maxMultiplier: 4
    },
    spark_learning: {
      name: "spark_learning",
      hitWindowMs: { perfect: 70, good: 130, miss: 220 },
      extraFretTolerance: true,
      comboStep: 10,
      maxMultiplier: 4,
      feedback: {
        earlyLateText: true,
        mistakeReason: true
      }
    }
  };

  window.SparkEnginePresetRegistry = {
    get: function(name) {
      return PRESETS[name] || PRESETS.spark_learning;
    },
    all: function() {
      return PRESETS;
    }
  };
})();
