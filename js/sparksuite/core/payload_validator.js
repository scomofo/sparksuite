(function() {

  function validateGameplayPayload(payload) {
    var errors = [];
    if (!payload) { errors.push("Missing gameplay payload"); return { valid: false, errors: errors }; }
    if (!payload.chartId && !payload.payload) errors.push("Missing chartId");
    if (!payload.notes && !(payload.payload && payload.payload.notes)) {
      // Only warn for missing notes — some payloads are chart references
    }
    if (payload.notes && Array.isArray(payload.notes)) {
      for (var i = 0; i < payload.notes.length; i++) {
        if (typeof payload.notes[i].lane !== "number") {
          errors.push("Note " + i + " missing lane");
          break; // Only report first
        }
      }
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function validateLaneDistribution(notes) {
    if (!notes || !notes.length) return { valid: true, laneCount: 0, collapsed: false };
    var lanes = {};
    for (var i = 0; i < notes.length; i++) {
      var lane = notes[i].lane;
      if (lane != null) lanes[lane] = (lanes[lane] || 0) + 1;
    }
    var uniqueLanes = Object.keys(lanes).length;
    var collapsed = notes.length > 1 && uniqueLanes <= 1;
    if (collapsed) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[SparkValidator] Lane distribution collapsed to", Object.keys(lanes));
      }
    }
    return { valid: !collapsed, laneCount: uniqueLanes, collapsed: collapsed, distribution: lanes };
  }

  function summarizeEvents(events) {
    if (!events || !events.length) return { total: 0, perfect: 0, good: 0, miss: 0, accuracy: 0, precision: 0, missRate: 0, avgDeltaMs: 0 };
    var total = events.length;
    var perfect = 0, good = 0, miss = 0, deltaSum = 0, deltaCount = 0;
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.result === "perfect") perfect++;
      else if (e.result === "good") good++;
      else miss++;
      if (typeof e.deltaMs === "number") { deltaSum += Math.abs(e.deltaMs); deltaCount++; }
    }
    return {
      total: total,
      perfect: perfect,
      good: good,
      miss: miss,
      accuracy: total > 0 ? (perfect + good) / total : 0,
      precision: total > 0 ? perfect / total : 0,
      missRate: total > 0 ? miss / total : 0,
      avgDeltaMs: deltaCount > 0 ? Math.round(deltaSum / deltaCount) : 0
    };
  }

  var SparkPayloadValidator = {
    validateGameplayPayload: validateGameplayPayload,
    validateLaneDistribution: validateLaneDistribution,
    summarizeEvents: summarizeEvents
  };

  if (typeof window !== "undefined") window.SparkPayloadValidator = SparkPayloadValidator;
  if (typeof module !== "undefined") module.exports = SparkPayloadValidator;
})();
