(function() {
  // THE single source of truth for hit windows across every gameplay surface
  // (rhythm highway assist presets AND performance-mode difficulties — see
  // js/performance/difficulties.js, which derives its windows from here).
  // Historical homage presets (gh_like/rb_like/clone_hero_like) had zero
  // consumers and were removed; spark_gentle and spark_pro were added so the
  // performance difficulties reference named presets instead of duplicating
  // drifting numbers.
  var PRESETS = {
    spark_gentle: {
      name: "spark_gentle",
      hitWindowMs: { perfect: 100, good: 180, miss: 280 },
      extraFretTolerance: true,
      comboStep: 10,
      maxMultiplier: 4,
      feedback: {
        earlyLateText: true,
        mistakeReason: true
      }
    },
    spark_learning: {
      name: "spark_learning",
      // good was 130 here and 140 in performance "normal" — unified on the
      // more forgiving 140 when the duplicate table was retired.
      hitWindowMs: { perfect: 70, good: 140, miss: 220 },
      extraFretTolerance: true,
      comboStep: 10,
      maxMultiplier: 4,
      feedback: {
        earlyLateText: true,
        mistakeReason: true
      }
    },
    spark_balanced: {
      name: "spark_balanced",
      hitWindowMs: { perfect: 60, good: 115, miss: 185 },
      extraFretTolerance: true,
      comboStep: 10,
      maxMultiplier: 4,
      feedback: {
        earlyLateText: true,
        mistakeReason: true
      }
    },
    spark_challenge: {
      name: "spark_challenge",
      hitWindowMs: { perfect: 48, good: 92, miss: 145 },
      extraFretTolerance: false,
      comboStep: 12,
      maxMultiplier: 4,
      feedback: {
        earlyLateText: true,
        mistakeReason: true
      }
    },
    spark_pro: {
      name: "spark_pro",
      hitWindowMs: { perfect: 45, good: 90, miss: 160 },
      extraFretTolerance: false,
      comboStep: 12,
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
