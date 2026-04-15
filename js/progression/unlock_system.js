(function() {
  function isSkillUnlocked(mastery, threshold) {
    mastery = typeof mastery === "number" && isFinite(mastery) ? mastery : 0;
    threshold = typeof threshold === "number" && isFinite(threshold) ? threshold : 0.75;
    return mastery >= threshold;
  }

  window.isSkillUnlocked = isSkillUnlocked;
})();
