(function() {
  /**
   * SparkPracticeIntelligence — adaptive practice engine.
   * Analyzes session results and recommends adjustments:
   *   Struggle → simplify
   *   Success → increase challenge
   *   Mistake → target practice
   */
  function PracticeIntelligence() {}

  /**
   * Analyze gameplay results and return adaptation recommendations.
   * @param {Object} results - from ScoringEngine.toSummary()
   * @returns {Object} { struggling, strong, weakLanes, recommendation, adaptations }
   */
  PracticeIntelligence.prototype.analyze = function(results) {
    results = results || {};
    var gameplay = results.gameplay || results;
    var accuracy = gameplay.accuracy || 0;
    var timing = gameplay.timing || {};
    var mistakes = gameplay.mistakes || {};

    var weakLanes = this._findWeakLanes(mistakes);
    var struggling = accuracy < 0.6;
    var strong = accuracy > 0.85;

    var recommendation = "continue";
    if (struggling) recommendation = "simplify";
    else if (strong) recommendation = "challenge";
    else if (weakLanes.length) recommendation = "focus";

    return {
      struggling: struggling,
      strong: strong,
      accuracy: accuracy,
      weakLanes: weakLanes,
      recommendation: recommendation,
      adaptations: this._buildAdaptations(recommendation, weakLanes, accuracy)
    };
  };

  /**
   * Suggest a practice mode based on analysis.
   * @returns {string} "LOOP_SECTION" | "SLOW_MODE" | "FOCUS_MODE" | "NORMAL"
   */
  PracticeIntelligence.prototype.suggestMode = function(analysis) {
    if (!analysis) return "NORMAL";
    if (analysis.struggling) return "SLOW_MODE";
    if (analysis.weakLanes && analysis.weakLanes.length) return "FOCUS_MODE";
    if (analysis.strong) return "NORMAL";
    return "LOOP_SECTION";
  };

  /**
   * Suggest playback speed adjustment.
   * @returns {number} speed multiplier (0.5 - 1.0)
   */
  PracticeIntelligence.prototype.suggestSpeed = function(analysis) {
    if (!analysis) return 1.0;
    if (analysis.accuracy < 0.4) return 0.5;
    if (analysis.accuracy < 0.6) return 0.75;
    if (analysis.accuracy < 0.8) return 0.9;
    return 1.0;
  };

  /**
   * Suggest next difficulty level.
   */
  PracticeIntelligence.prototype.suggestDifficulty = function(currentDifficulty, analysis) {
    if (!analysis) return currentDifficulty;
    if (analysis.struggling && currentDifficulty !== "easy") return "easy";
    if (analysis.strong && currentDifficulty === "easy") return "normal";
    if (analysis.strong && currentDifficulty === "normal") return "hard";
    return currentDifficulty;
  };

  PracticeIntelligence.prototype._findWeakLanes = function(mistakes) {
    var lanes = [];
    if (!mistakes || !mistakes.laneErrors) return lanes;
    var laneErrors = mistakes.laneErrors;
    for (var lane in laneErrors) {
      if (laneErrors[lane] > 2) lanes.push(parseInt(lane, 10));
    }
    return lanes;
  };

  PracticeIntelligence.prototype._buildAdaptations = function(recommendation, weakLanes, accuracy) {
    var adaptations = [];
    if (recommendation === "simplify") {
      adaptations.push({ type: "reduce_density", factor: 0.5 });
      adaptations.push({ type: "slow_tempo", factor: 0.75 });
    }
    if (recommendation === "focus" && weakLanes.length) {
      adaptations.push({ type: "focus_lanes", lanes: weakLanes });
    }
    if (recommendation === "challenge") {
      adaptations.push({ type: "increase_density", factor: 1.5 });
    }
    return adaptations;
  };

  window.SparkPracticeIntelligence = PracticeIntelligence;
})();
