(function() {
  function GameplayScoringEngine(config) {
    var defaults = typeof SparkGameplayTiming !== "undefined" ? SparkGameplayTiming : {
      hitWindowMs: 140,
      perfectWindowMs: 50,
      goodWindowMs: 90,
      noteSpeed: 0.32,
      inputLatencyOffsetMs: 0
    };
    this.config = typeof SparkNormalizeTimingConfig === "function"
      ? SparkNormalizeTimingConfig(config || defaults)
      : (config || defaults);
  }

  GameplayScoringEngine.prototype.judge = function(input) {
    input = input || {};
    var rawDelta = (input.inputTimeMs || 0) - (input.expectedTimeMs || 0);
    var delta = Math.abs(rawDelta - (this.config.inputLatencyOffsetMs || 0));
    var result = typeof SparkScoreTimingDelta === "function"
      ? SparkScoreTimingDelta(rawDelta, this.config)
      : "miss";

    if (typeof SparkScoreTimingDelta !== "function") {
      if (delta <= this.config.perfectWindowMs) result = "perfect";
      else if (delta <= this.config.goodWindowMs) result = "good";
      else if (delta <= this.config.hitWindowMs) result = "hit";
    }

    return { result: result, delta: delta };
  };

  if (typeof window !== "undefined") {
    window.SparkGameplayScoringEngine = GameplayScoringEngine;
  }
  if (typeof module !== "undefined") {
    module.exports = GameplayScoringEngine;
  }
})();
