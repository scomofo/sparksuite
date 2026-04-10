(function() {

  // Detect player emotional state from behavioral signals
  function detectEmotion(state) {
    if (state.missStreak > 8) return "frustrated";
    if (state.accuracy > 0.95 && state.combo > 30) return "bored";
    if (state.accuracy < 0.6 || state.missStreak > 5) return "struggling";
    return "engaged";
  }

  // Determine difficulty adjustment direction
  function adjustDifficulty(state) {
    if (state.accuracy > 0.9 && state.timingConsistency > 0.85) return "increase";
    if (state.accuracy < 0.6 || state.missStreak > 5) return "decrease";
    return "maintain";
  }

  // Main flow controller: combines emotion + difficulty
  function flowController(state) {
    var emotion = detectEmotion(state);
    var difficulty = adjustDifficulty(state);

    if (emotion === "frustrated") {
      return { action: "reduce_difficulty", emotion: emotion, tempoMultiplier: 0.9 };
    }
    if (emotion === "bored") {
      return { action: "increase_difficulty", emotion: emotion, tempoMultiplier: 1.05 };
    }
    if (difficulty === "increase") {
      return { action: "increase_difficulty", emotion: emotion, tempoMultiplier: 1.05 };
    }
    if (difficulty === "decrease") {
      return { action: "reduce_difficulty", emotion: emotion, tempoMultiplier: 0.9 };
    }
    return { action: "maintain", emotion: emotion, tempoMultiplier: 1.0 };
  }

  // Build state snapshot from current gameplay data
  function buildFlowState(performState) {
    return {
      accuracy: performState.accuracy || 0,
      combo: performState.combo || 0,
      missStreak: performState.missStreak || 0,
      retryCount: performState.retryCount || 0,
      timingConsistency: performState.timingConsistency || 0
    };
  }

  // Generate encouragement text (subtle, never mentions difficulty change)
  function getEncouragement(flowResult) {
    if (flowResult.emotion === "frustrated") return "Take your time.";
    if (flowResult.emotion === "struggling") return "Getting closer!";
    if (flowResult.emotion === "bored") return "Let's push it.";
    return "";
  }

  var SparkFlowEngine = {
    detectEmotion: detectEmotion,
    adjustDifficulty: adjustDifficulty,
    flowController: flowController,
    buildFlowState: buildFlowState,
    getEncouragement: getEncouragement
  };

  if (typeof window !== "undefined") window.SparkFlowEngine = SparkFlowEngine;
  if (typeof module !== "undefined") module.exports = SparkFlowEngine;
})();
