(function() {
  var DefaultPracticeAssist = Object.freeze({
    speedMultiplier: 1,
    loopRange: null,
    showGhostNotes: false,
    metronome: false,
    noFailMode: true,
    leftHanded: false,
    noStrumMode: false
  });

  function normalizePracticeAssist(config) {
    var source = config || {};
    return {
      speedMultiplier: normalizeSpeedMultiplier(source.speedMultiplier),
      loopRange: normalizeLoopRange(source.loopRange),
      showGhostNotes: !!source.showGhostNotes,
      metronome: !!source.metronome,
      noFailMode: source.noFailMode !== false,
      leftHanded: !!source.leftHanded,
      noStrumMode: !!source.noStrumMode
    };
  }

  function getEffectiveTravelTimeMs(baseTravelTimeMs, assistConfig) {
    var config = normalizePracticeAssist(assistConfig);
    var base = numberOr(baseTravelTimeMs, 0);
    if (!base) return 0;
    return Math.round(base / config.speedMultiplier);
  }

  function resolveLoopedPositionMs(positionMs, assistConfig) {
    var config = normalizePracticeAssist(assistConfig);
    var range = config.loopRange;
    var position = Math.max(0, numberOr(positionMs, 0));
    var span;
    if (!range) return position;
    if (position < range.startMs) return range.startMs;
    if (position <= range.endMs) return position;
    span = range.endMs - range.startMs;
    if (span <= 0) return range.startMs;
    return range.startMs + ((position - range.startMs) % span);
  }

  function shouldAllowFailure(assistConfig) {
    return !normalizePracticeAssist(assistConfig).noFailMode;
  }

  function normalizeSpeedMultiplier(value) {
    var numeric = numberOr(value, DefaultPracticeAssist.speedMultiplier);
    if (numeric <= 0) numeric = DefaultPracticeAssist.speedMultiplier;
    if (numeric < 0.675) return 0.6;
    if (numeric < 0.825) return 0.75;
    if (numeric < 0.95) return 0.9;
    return 1;
  }

  function normalizeLoopRange(loopRange) {
    if (!loopRange || typeof loopRange !== "object") return null;
    var startMs = Math.max(0, Math.round(numberOr(loopRange.startMs, 0)));
    var endMs = Math.max(startMs, Math.round(numberOr(loopRange.endMs, startMs)));
    if (endMs <= startMs) return null;
    return {
      startMs: startMs,
      endMs: endMs
    };
  }

  function numberOr(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  if (typeof window !== "undefined") {
    window.SparkDefaultPracticeAssist = DefaultPracticeAssist;
    window.SparkNormalizePracticeAssist = normalizePracticeAssist;
    window.SparkGetEffectiveTravelTimeMs = getEffectiveTravelTimeMs;
    window.SparkResolveLoopedPositionMs = resolveLoopedPositionMs;
    window.SparkShouldAllowFailure = shouldAllowFailure;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkDefaultPracticeAssist = DefaultPracticeAssist;
    globalThis.SparkNormalizePracticeAssist = normalizePracticeAssist;
    globalThis.SparkGetEffectiveTravelTimeMs = getEffectiveTravelTimeMs;
    globalThis.SparkResolveLoopedPositionMs = resolveLoopedPositionMs;
    globalThis.SparkShouldAllowFailure = shouldAllowFailure;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      DefaultPracticeAssist: DefaultPracticeAssist,
      normalizePracticeAssist: normalizePracticeAssist,
      getEffectiveTravelTimeMs: getEffectiveTravelTimeMs,
      resolveLoopedPositionMs: resolveLoopedPositionMs,
      shouldAllowFailure: shouldAllowFailure
    };
  }
})();
