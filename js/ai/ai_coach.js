(function() {
  "use strict";

  function normalizeOffset(offsetMs) {
    return typeof offsetMs === "number" && isFinite(offsetMs) ? offsetMs : 0;
  }

  function generateRealtimeAICoachFeedback(input) {
    input = input || {};

    var expected = input.expected || null;
    var detected = input.detected || null;
    var offsetMs = normalizeOffset(input.offsetMs);
    var absOffset = Math.abs(offsetMs);

    if (!expected || !detected) return null;

    if (expected !== detected) {
      return "Wrong chord";
    }

    if (absOffset > 120) {
      return offsetMs > 0 ? "Too slow" : "Too early";
    }

    if (absOffset > 60) {
      return "Adjust timing";
    }

    return null;
  }

  window.generateRealtimeAICoachFeedback = generateRealtimeAICoachFeedback;
})();
