(function() {
  function PsychologyEngine() {}

  PsychologyEngine.prototype.getFocusLabel = function(segments) {
    segments = segments || [];
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].type === SparkSessionSegmentTypes.TRANSITION) return "Smooth chord transitions";
      if (segments[i].type === SparkSessionSegmentTypes.PERFORMANCE_SONG || segments[i].type === SparkSessionSegmentTypes.PERFORMANCE_PHRASE) return "Song mastery";
      if (segments[i].type === SparkSessionSegmentTypes.RHYTHM) return "Rhythm accuracy";
    }
    return "Well-rounded practice";
  };

  PsychologyEngine.prototype.shouldReward = function(sessionCount) {
    return typeof SparkPsychology !== "undefined" ? SparkPsychology.shouldReward(sessionCount) : false;
  };

  /**
   * Get recommended difficulty for a user.
   * Delegates to LearningBrain if available, else derives from skillGraph.
   */
  PsychologyEngine.prototype.getDifficulty = function(skillGraph, flowState) {
    if (typeof SparkLearningBrain !== "undefined") {
      var analysis = SparkLearningBrain.analyzeUser(skillGraph, flowState, null);
      if (analysis && analysis.recommendedDifficultyId) return analysis.recommendedDifficultyId;
    }
    if (!skillGraph) return "easy";
    var avg = ((skillGraph.timing || 0) + (skillGraph.rhythm || 0) + (skillGraph.chordAccuracy || 0)) / 3;
    return avg > 0.8 ? "hard" : avg > 0.6 ? "normal" : "easy";
  };

  /**
   * Adjust difficulty based on session performance.
   * Returns updated difficulty string.
   */
  PsychologyEngine.prototype.adjustDifficulty = function(currentDifficulty, performance) {
    if (!performance) return currentDifficulty;
    var accuracy = performance.accuracy || 0;
    if (accuracy < 0.5 && currentDifficulty !== "easy") return "easy";
    if (accuracy > 0.9 && currentDifficulty === "easy") return "normal";
    if (accuracy > 0.9 && currentDifficulty === "normal") return "hard";
    if (accuracy < 0.6 && currentDifficulty === "hard") return "normal";
    return currentDifficulty;
  };

  /**
   * Get session structure recommendation.
   * Returns analysis object from LearningBrain if available.
   */
  PsychologyEngine.prototype.getSessionStructure = function(skillGraph, flowState, weakSpots) {
    if (typeof SparkLearningBrain !== "undefined") {
      return SparkLearningBrain.analyzeUser(skillGraph, flowState, weakSpots);
    }
    return null;
  };

  window.SparkSuitePsychologyEngine = PsychologyEngine;
})();
