(function() {
  function calculateRetention(daysSincePractice) {
    daysSincePractice = typeof daysSincePractice === "number" && isFinite(daysSincePractice)
      ? daysSincePractice
      : 0;
    if (daysSincePractice <= 0) return 1;
    return Math.exp(-daysSincePractice / 5);
  }

  function getReviewScore(input) {
    input = input || {};
    var mastery = typeof input.mastery === "number" && isFinite(input.mastery) ? input.mastery : 0;
    var lastPracticed = typeof input.lastPracticed === "number" && isFinite(input.lastPracticed)
      ? input.lastPracticed
      : Date.now();
    var now = typeof input.now === "number" && isFinite(input.now) ? input.now : Date.now();
    var days = Math.max(0, (now - lastPracticed) / (1000 * 60 * 60 * 24));
    var retention = calculateRetention(days);
    return mastery * retention;
  }

  window.calculateSpacedRetention = calculateRetention;
  window.getAdaptiveReviewScore = getReviewScore;
})();
