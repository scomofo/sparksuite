(function() {
  function selectNextSkill(skills, options) {
    var lowestScore = Infinity;
    var selected = null;
    var selectedMeta = null;
    var skillId;
    var data;
    var score;
    var now;
    var daysSincePractice;

    skills = skills || {};
    options = options || {};
    now = typeof options.now === "number" && isFinite(options.now) ? options.now : Date.now();

    for (skillId in skills) {
      if (!Object.prototype.hasOwnProperty.call(skills, skillId)) continue;
      data = skills[skillId] || {};
      score = typeof getAdaptiveReviewScore === "function"
        ? getAdaptiveReviewScore({
            mastery: data.mastery,
            lastPracticed: data.lastPracticed,
            now: now
          })
        : 0;
      if (score < lowestScore) {
        lowestScore = score;
        daysSincePractice = data.lastPracticed
          ? Math.max(0, (now - data.lastPracticed) / (1000 * 60 * 60 * 24))
          : 0;
        selected = skillId;
        selectedMeta = {
          skillId: skillId,
          score: score,
          mastery: typeof data.mastery === "number" ? data.mastery : 0,
          lastPracticed: data.lastPracticed || now,
          daysSincePractice: daysSincePractice
        };
      }
    }

    if (options.returnMeta) return selectedMeta;
    return selected;
  }

  window.selectAdaptiveNextSkill = selectNextSkill;
})();
