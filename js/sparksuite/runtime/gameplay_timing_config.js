(function() {
  var DefaultGameplayTiming = Object.freeze({
    hitWindowMs: 140,
    perfectWindowMs: 50,
    goodWindowMs: 90,
    noteSpeed: 0.32,
    inputLatencyOffsetMs: 0
  });

  function normalizeTimingConfig(config) {
    var source = config || {};
    return {
      hitWindowMs: finiteNumber(source.hitWindowMs, DefaultGameplayTiming.hitWindowMs),
      perfectWindowMs: finiteNumber(source.perfectWindowMs, DefaultGameplayTiming.perfectWindowMs),
      goodWindowMs: finiteNumber(source.goodWindowMs, DefaultGameplayTiming.goodWindowMs),
      noteSpeed: clamp(finiteNumber(source.noteSpeed, DefaultGameplayTiming.noteSpeed), 0.1, 4),
      inputLatencyOffsetMs: Math.round(finiteNumber(source.inputLatencyOffsetMs, DefaultGameplayTiming.inputLatencyOffsetMs))
    };
  }

  function scoreTimingDelta(rawDeltaMs, timingConfig) {
    var config = normalizeTimingConfig(timingConfig);
    var delta = Math.abs(finiteNumber(rawDeltaMs, 0) - config.inputLatencyOffsetMs);

    if (delta <= config.perfectWindowMs) return "perfect";
    if (delta <= config.goodWindowMs) return "good";
    if (delta <= config.hitWindowMs) return "hit";
    return "miss";
  }

  function finiteNumber(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  if (typeof window !== "undefined") {
    window.SparkDefaultGameplayTiming = DefaultGameplayTiming;
    window.SparkNormalizeTimingConfig = normalizeTimingConfig;
    window.SparkScoreTimingDelta = scoreTimingDelta;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkDefaultGameplayTiming = DefaultGameplayTiming;
    globalThis.SparkNormalizeTimingConfig = normalizeTimingConfig;
    globalThis.SparkScoreTimingDelta = scoreTimingDelta;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      DefaultGameplayTiming: DefaultGameplayTiming,
      normalizeTimingConfig: normalizeTimingConfig,
      scoreTimingDelta: scoreTimingDelta
    };
  }
})();
