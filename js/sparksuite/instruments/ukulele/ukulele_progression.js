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

  window.computeUkuleleSkillProgress = computeUkuleleSkillProgress;
})();
