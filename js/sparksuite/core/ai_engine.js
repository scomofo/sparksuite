(function() {
  function AIEngine() {}

  AIEngine.prototype.suggestNextFlow = function() {
    return SparkSessionTypes.FLOW_DAILY_PRACTICE;
  };

  AIEngine.prototype.generateCoachingNote = function(payload) {
    payload = payload || {};
    var session = payload.session || {};
    var performance = clone(payload.performance || {});
    var mastery = clone(payload.mastery || null);
    var nextRecommendedSkill = payload.nextRecommendedSkill || null;
    var weakness = detectWeakness(performance);

    return {
      type: "coaching_note",
      sessionId: session.id || null,
      message: buildMessage({
        weakness: weakness,
        nextRecommendedSkill: nextRecommendedSkill
      }),
      suggestedFocus: weakness,
      nextRecommendedSkill: nextRecommendedSkill,
      authority: "advisory_only",
      signals: {
        weakness: weakness,
        accuracy: typeof performance.accuracy === "number" ? performance.accuracy : 0,
        mastery: mastery
      }
    };
  };

  function detectWeakness(performance) {
    var timing = performance && performance.timing ? performance.timing : {};
    var late = typeof timing.late === "number"
      ? timing.late
      : (typeof timing.lateCount === "number" ? timing.lateCount : 0);
    var early = typeof timing.early === "number"
      ? timing.early
      : (typeof timing.earlyCount === "number" ? timing.earlyCount : 0);
    var accuracy = typeof performance.accuracy === "number"
      ? performance.accuracy
      : inferAccuracyFromCounts(performance);

    if (late > early && late > 0) return "timing_late";
    if (accuracy < 0.7) return "accuracy";
    return "consistency";
  }

  function inferAccuracyFromCounts(performance) {
    var hits = typeof performance.hits === "number" ? performance.hits : 0;
    var total = typeof performance.total === "number" ? performance.total : 0;
    if (total <= 0) return 0;
    return hits / total;
  }

  function buildMessage(context) {
    if (context.weakness === "timing_late") {
      return "You are slightly late on the beat. Try one slower loop before returning to full speed.";
    }
    if (context.weakness === "accuracy") {
      return "Focus on clean hits first. Speed can come later.";
    }
    return "Nice progress. Your next focus is " + (context.nextRecommendedSkill || "steady consistency") + ".";
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  if (typeof window !== "undefined") {
    window.SparkAIEngine = AIEngine;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkAIEngine = AIEngine;
  }
  if (typeof module !== "undefined") {
    module.exports = {
      AIEngine: AIEngine
    };
  }
})();
