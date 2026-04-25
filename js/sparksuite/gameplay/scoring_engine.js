(function() {
  function GameplayScoringEngine(config) {
    this.config = config || (typeof SparkGameplayTiming !== "undefined" ? SparkGameplayTiming : {
      hitWindowMs: 150,
      perfectWindowMs: 50,
      goodWindowMs: 90,
      inputLatencyOffsetMs: 0
    });
  }

  GameplayScoringEngine.prototype.judge = function(input) {
    input = input || {};
    var delta = Math.abs(
      (input.inputTimeMs || 0) -
      (input.expectedTimeMs || 0) -
      (this.config.inputLatencyOffsetMs || 0)
    );

    if (delta <= this.config.perfectWindowMs) return { result: "perfect", delta: delta };
    if (delta <= this.config.goodWindowMs) return { result: "good", delta: delta };
    if (delta <= this.config.hitWindowMs) return { result: "hit", delta: delta };
    return { result: "miss", delta: delta };
  };

  if (typeof window !== "undefined") {
    window.SparkGameplayScoringEngine = GameplayScoringEngine;
  }
  if (typeof module !== "undefined") {
    module.exports = GameplayScoringEngine;
  }
})();
