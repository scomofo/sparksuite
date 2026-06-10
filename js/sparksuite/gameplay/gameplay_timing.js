(function() {
  var GameplayTiming = typeof SparkNormalizeTimingConfig === "function"
    ? SparkNormalizeTimingConfig(typeof SparkDefaultGameplayTiming !== "undefined" ? SparkDefaultGameplayTiming : {})
    : {
        hitWindowMs: 140,
        perfectWindowMs: 50,
        goodWindowMs: 90,
        noteSpeed: 0.32,
        inputLatencyOffsetMs: 0
      };

  function ExerciseClock(now) {
    this.now = typeof now === "function" ? now : function() {
      return typeof performance !== "undefined" && performance && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    };
    this.startedAt = null;
  }

  ExerciseClock.prototype.start = function() {
    this.startedAt = this.now();
    return this.startedAt;
  };

  ExerciseClock.prototype.elapsedMs = function() {
    if (this.startedAt == null) {
      throw new Error("ExerciseClock has not started");
    }
    return this.now() - this.startedAt;
  };

  if (typeof window !== "undefined") {
    window.SparkGameplayTiming = GameplayTiming;
    window.SparkExerciseClock = ExerciseClock;
  }
  if (typeof module !== "undefined") {
    module.exports = {
      GameplayTiming: GameplayTiming,
      ExerciseClock: ExerciseClock
    };
  }
})();
