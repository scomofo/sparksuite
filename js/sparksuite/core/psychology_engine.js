(function() {
  function PsychologyEngine() {}

  function clampUnit(value) {
    return Math.max(0, Math.min(1, typeof value === "number" && isFinite(value) ? value : 0));
  }

  function parseSessionDate(value) {
    if (!value) return null;
    if (typeof value === "number" && isFinite(value)) return value;
    var parsed = Date.parse(value);
    return isNaN(parsed) ? null : parsed;
  }

  function isoToday() {
    return new Date().toISOString().slice(0, 10);
  }

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


  /**
   * Analyze user state. Pass-through to LearningBrain.
   * New code MUST call this instead of SparkLearningBrain directly.
   */
  PsychologyEngine.prototype.analyzeUser = function(skillGraph, flowState, weakSpots) {
    if (typeof SparkLearningBrain !== "undefined") {
      return SparkLearningBrain.analyzeUser(skillGraph, flowState, weakSpots || null);
    }
    return null;
  };

  /**
   * Generate targeted practice from weakness analysis.
   * Pass-through to LearningBrain.
   */
  PsychologyEngine.prototype.generatePracticeFromWeakness = function(analysis, skillGraph) {
    if (typeof SparkLearningBrain !== "undefined") {
      return SparkLearningBrain.generatePracticeFromWeakness(analysis, skillGraph);
    }
    return null;
  };

  PsychologyEngine.prototype.getDaysAway = function(lastPlayed) {
    var timestamp = parseSessionDate(lastPlayed);
    if (!timestamp) return 0;
    return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
  };

  PsychologyEngine.prototype.updateStreak = function(user) {
    var next = {};
    var key;
    var lastDate;
    var daysAway;
    var nextDate = isoToday();

    user = user || {};
    for (key in user) {
      if (Object.prototype.hasOwnProperty.call(user, key)) next[key] = user[key];
    }

    lastDate = next.lastSessionDate || next.lastPracticeDate || next.lastPlayed || null;
    daysAway = this.getDaysAway(lastDate);
    next.daysAway = daysAway;
    next.comeback = false;

    if (!lastDate) {
      next.streak = 1;
    } else if ((next.lastSessionDate || next.lastPracticeDate) === nextDate) {
      next.streak = typeof next.streak === "number" && next.streak > 0 ? next.streak : 1;
    } else if (daysAway === 1) {
      next.streak = (typeof next.streak === "number" && next.streak > 0 ? next.streak : 0) + 1;
    } else {
      next.streak = 1;
      next.comeback = daysAway > 1;
    }

    next.lastSessionDate = nextDate;
    next.lastPracticeDate = nextDate;
    next.lastPlayed = Date.now();
    return next;
  };

  PsychologyEngine.prototype.getRewardMultiplier = function(user) {
    user = user || {};
    if (user.comeback) return 2;
    if ((user.streak || 0) >= 7) return 1.5;
    return 1;
  };

  PsychologyEngine.prototype.buildSessionShaping = function(user, options) {
    var nextUser = this.updateStreak(user);
    var performance = options && options.performance ? options.performance : {};
    var accuracy = clampUnit(performance.accuracy);
    var structure = ["spark", "review", "challenge", "song", "victory"];
    var sessionType = "normal";
    var recommendedDifficulty = options && options.recommendedDifficulty
      ? options.recommendedDifficulty
      : (nextUser.skillLevel || "normal");
    var difficulty = recommendedDifficulty || "normal";

    if (nextUser.comeback) {
      sessionType = "comeback";
      structure = ["easy_win", "review", "reward"];
      difficulty = "easy";
    } else if (accuracy < 0.6) {
      sessionType = "recovery";
      structure = ["easy", "review", "victory"];
      difficulty = "easy";
    } else if (accuracy > 0.9) {
      sessionType = "challenge";
      difficulty = "hard";
    }

    nextUser.rewardMultiplier = this.getRewardMultiplier(nextUser);
    return {
      streak: nextUser.streak || 0,
      daysAway: nextUser.daysAway || 0,
      comeback: !!nextUser.comeback,
      rewardMultiplier: nextUser.rewardMultiplier,
      sessionType: sessionType,
      structure: structure,
      difficulty: difficulty,
      userState: nextUser
    };
  };

  PsychologyEngine.prototype.applyRewardMultiplier = function(rewardSummary, user) {
    var currentXP;
    var next = rewardSummary ? JSON.parse(JSON.stringify(rewardSummary)) : null;
    var summary;
    if (!next) return null;

    summary = {
      streak: user && typeof user.streak === "number" ? user.streak : 0,
      daysAway: user && typeof user.daysAway === "number" ? user.daysAway : 0,
      comeback: !!(user && user.comeback),
      rewardMultiplier: this.getRewardMultiplier(user || {})
    };

    if (summary.rewardMultiplier === 1) {
      if (!next.summary || typeof next.summary !== "object") next.summary = {};
      next.summary.streak = summary.streak;
      next.summary.daysAway = summary.daysAway;
      next.summary.rewardMultiplier = summary.rewardMultiplier;
      next.psychology = summary;
      return next;
    }

    next.baseXpGained = typeof next.xpGained === "number" ? next.xpGained : 0;
    next.xpGained = Math.floor(next.baseXpGained * summary.rewardMultiplier);
    currentXP = Math.max(0, (next.totalXP || 0) - (next.baseXpGained || 0));
    next.totalXP = currentXP + next.xpGained;
    if (typeof getProgressionLevelFromXP === "function") {
      next.previousLevel = getProgressionLevelFromXP(currentXP);
      next.level = getProgressionLevelFromXP(next.totalXP);
      next.leveledUp = next.level > next.previousLevel;
      next.nextLevelXP = typeof getNextProgressionLevelXP === "function"
        ? getNextProgressionLevelXP(next.level)
        : next.totalXP;
    }
    if (!next.summary || typeof next.summary !== "object") next.summary = {};
    next.summary.streak = summary.streak;
    next.summary.daysAway = summary.daysAway;
    next.summary.rewardMultiplier = summary.rewardMultiplier;
    next.psychology = summary;
    return next;
  };

  window.SparkSuitePsychologyEngine = PsychologyEngine;
})();
