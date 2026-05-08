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

  PsychologyEngine.prototype.getSessionDifficulty = function(user) {
    return this.adjustDifficulty({
      recentPerformances: user && user.recentPerformances,
      currentDifficulty: user && user.currentDifficulty
    }).difficulty;
  };

  PsychologyEngine.prototype.getDifficulty = function(user) {
    return this.getSessionDifficulty(user);
  };

  PsychologyEngine.prototype.adjustDifficulty = function(context) {
    context = context || {};
    var recent = Array.isArray(context.recentPerformances) ? context.recentPerformances.slice(-3) : [];
    var currentDifficulty = context.currentDifficulty || "normal";
    var avgAccuracy = 0;
    var i;

    if (recent.length < 3) {
      return {
        difficulty: currentDifficulty,
        reason: "insufficient_history",
        confidence: recent.length ? 0.45 : 0.25
      };
    }

    for (i = 0; i < recent.length; i++) {
      avgAccuracy += typeof recent[i].accuracy === "number" ? recent[i].accuracy : 0;
    }
    avgAccuracy = avgAccuracy / recent.length;

    if (avgAccuracy > 0.92 && currentDifficulty !== "hard") {
      return {
        difficulty: "hard",
        reason: "accuracy_stable_high",
        confidence: 0.82
      };
    }

    if (avgAccuracy < 0.65 && currentDifficulty !== "easy") {
      return {
        difficulty: "easy",
        reason: "accuracy_support_needed",
        confidence: 0.82
      };
    }

    return {
      difficulty: currentDifficulty,
      reason: "accuracy_stable",
      confidence: 0.7
    };
  };

  PsychologyEngine.prototype.getSessionStructure = function(instrumentType) {
    if (typeof SparkPsychology !== "undefined" && typeof SparkPsychology.getSessionStructure === "function") {
      return SparkPsychology.getSessionStructure(instrumentType);
    }
    if (instrumentType === "bass") {
      return ["spark", "reviewGroove", "technique", "grooveDrill", "songGroove", "victoryGroove"];
    }
    return ["spark", "review", "newMove", "songSlice", "victoryLap"];
  };

  PsychologyEngine.prototype.shouldReward = function(sessionCount) {
    return typeof SparkPsychology !== "undefined" ? SparkPsychology.shouldReward(sessionCount) : false;
  };

  PsychologyEngine.prototype.getPerformancePhraseRating = function(accuracy) {
    accuracy = typeof accuracy === "number" && isFinite(accuracy) ? accuracy : 0;
    if (accuracy > 1) accuracy = accuracy / 100;
    if (accuracy >= 0.9) return "excellent";
    if (accuracy >= 0.7) return "good";
    return "poor";
  };

  PsychologyEngine.prototype.getSessionCompletionRewards = function(context) {
    context = context || {};
    var performanceScore = typeof context.performanceScore === "number" && isFinite(context.performanceScore)
      ? Math.max(0, Math.min(1, context.performanceScore > 1 ? context.performanceScore / 100 : context.performanceScore))
      : null;
    var difficultyLevel = context.difficultyLevel || context.difficulty || "normal";
    var difficultyBonus = difficultyLevel === "hard" || difficultyLevel === "pro" ? 10 : (difficultyLevel === "easy" ? -5 : 0);
    var explicitXp = Number(context.xpAwarded);
    var explicitChordIncrement = Number(context.chordProgressIncrement);
    var earnedXp = isFinite(explicitXp)
      ? Math.max(0, Math.min(1000, explicitXp))
      : Math.max(20, 50 + difficultyBonus + (performanceScore == null ? 0 : Math.round(performanceScore * 10)));
    var chordIncrement = isFinite(explicitChordIncrement)
      ? Math.max(0, Math.min(100, explicitChordIncrement))
      : Math.max(10, Math.min(25, 15 + (performanceScore == null ? 0 : Math.round(performanceScore * 5))));
    return {
      rewardTrigger: context.rewardTrigger || "session_complete",
      audioCue: context.audioCue || (performanceScore != null && performanceScore >= 0.95 ? "levelup" : "complete"),
      xpAwarded: earnedXp,
      chordProgressIncrement: chordIncrement
    };
  };

  PsychologyEngine.prototype.isIntenseFlowState = function(sessionState) {
    sessionState = sessionState || {};
    return sessionState.mode === "drill"
      || (sessionState.mode === "daily" && sessionState.type === "daily");
  };

  window.SparkSuitePsychologyEngine = PsychologyEngine;
})();
