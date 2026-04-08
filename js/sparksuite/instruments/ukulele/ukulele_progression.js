(function() {
  function normalizeMetric(value) {
    if (typeof value !== "number" || !isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function computeUkuleleSkillProgress(input) {
    input = input || {};
    var accuracy = normalizeMetric(input.accuracy);
    var timing = normalizeMetric(input.timing);
    var speed = normalizeMetric(input.speed);
    var consistency = normalizeMetric(input.consistency);
    var mastery = Math.round(((accuracy + timing + speed + consistency) / 4) * 100) / 100;
    return {
      skill: input.skill || "",
      accuracy: accuracy,
      timing: timing,
      speed: speed,
      consistency: consistency,
      mastery: mastery,
      unlocked: mastery > 0.75
    };
  }

  function getUkuleleSkillProgressEntry(skill, state) {
    state = state || {};
    var skillMap = state.ukuleleSkillProgress || state.skillProgress || {};
    return skillMap && skill ? (skillMap[skill] || null) : null;
  }

  function summarizeUkuleleSkillProgress(skill, state) {
    var entry = getUkuleleSkillProgressEntry(skill, state);
    if (!entry) return null;
    var summary = computeUkuleleSkillProgress({
      skill: skill,
      accuracy: entry.accuracy,
      timing: entry.timing,
      speed: entry.speed,
      consistency: entry.consistency
    });
    var weakestMetric = "accuracy";
    var weakestValue = summary.accuracy;
    var metrics = ["timing", "speed", "consistency"];
    for (var i = 0; i < metrics.length; i++) {
      if (summary[metrics[i]] < weakestValue) {
        weakestMetric = metrics[i];
        weakestValue = summary[metrics[i]];
      }
    }
    summary.weakestMetric = weakestMetric;
    summary.stage = summary.mastery >= 0.85
      ? "ready"
      : summary.mastery >= 0.7
        ? "steady"
        : "developing";
    return summary;
  }

  window.computeUkuleleSkillProgress = computeUkuleleSkillProgress;
  window.summarizeUkuleleSkillProgress = summarizeUkuleleSkillProgress;
})();
