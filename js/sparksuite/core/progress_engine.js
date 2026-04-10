(function() {
  function ProgressEngine() {}

  ProgressEngine.prototype.completeSession = function(plan, payload) {
    payload = payload || {};
    if (!plan) return { completedItems: 0, totalItems: 0, planCompleted: false, xpAwarded: 0 };
    if (plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return completeGuidedSession(plan, payload);
    if (plan.flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return completePerformanceSong(plan, payload);

    var progress = payload.itemId ? SparkProgressBridge.completePlanItem(plan, payload.itemId, payload.result) : {
      completedItems: plan.segments.length,
      totalItems: plan.segments.length,
      planCompleted: true
    };

    if (payload.markPlanComplete) {
      for (var i = 0; i < plan.segments.length; i++) plan.segments[i].completed = true;
      progress.completedItems = plan.segments.length;
      progress.totalItems = plan.segments.length;
      progress.planCompleted = true;
      SparkProgressBridge.syncPlanToState(plan);
    }

    if (progress.planCompleted) {
      var summary = SparkPerformanceBridge.buildPerformanceSummary(plan);
      var xpAwarded = 20;
      var sessionStatePatch = {
        xpToast: { amount: 20, time: Date.now() }
      };
      if (payload.gameplayResult) {
        xpAwarded += Math.max(0, Math.round(((payload.gameplayResult.gameplay && payload.gameplayResult.gameplay.accuracy) || 0) * 20));
        sessionStatePatch = mergeSessionStatePatch(sessionStatePatch, buildGameplayLearningPatch(payload.gameplayResult.learning, payload.gameplayContext, payload.gameplayResult.gameplay));
        sessionStatePatch.xpToast.amount = xpAwarded;
      }
      var completionSummary = buildCompletionSummary(plan, xpAwarded, summary.durationSec);
      if (typeof SparkProgressOrchestrator !== "undefined") {
        SparkProgressOrchestrator.evaluateAll({
          type: "session",
          xpAwarded: xpAwarded,
          duration: summary.durationSec,
          streakUpdated: false
        });
      }
      SparkProgressBridge.finalizePlan(plan, {
        xpAwarded: xpAwarded,
        sessionStatePatch: sessionStatePatch,
        completionSummary: completionSummary
      });
      progress.xpAwarded = xpAwarded;
      progress.sessionStatePatch = sessionStatePatch;
      progress.completionSummary = completionSummary;
    } else if (typeof saveState === "function") {
      saveState();
    }

    return progress;
  };

  function completeGuidedSession(plan, payload) {
    var progress = payload.itemId ? SparkProgressBridge.completePlanItem(plan, payload.itemId, payload.result) : {
      completedItems: plan.segments.length,
      totalItems: plan.segments.length,
      planCompleted: true
    };
    var guidedPlan = plan.context ? plan.context.guidedPlan : null;
    var totalGuidedSessions = plan.context && plan.context.totalGuidedSessions ? plan.context.totalGuidedSessions : 1;
    var outcome = null;
    var sessionStatePatch = {
      guided: {
        completedSessionNums: [],
        nextGuidedSession: null,
        chordProgress: {}
      }
    };

    if (guidedPlan) {
      sessionStatePatch.guided.completedSessionNums.push(guidedPlan.num);
      if (guidedPlan.newMove && guidedPlan.newMove.chord) {
        sessionStatePatch.guided.chordProgress[guidedPlan.newMove.chord] = 25;
      }
      sessionStatePatch.guided.nextGuidedSession = Math.min(totalGuidedSessions || guidedPlan.num + 1, guidedPlan.num + 1);
      if (typeof SparkSession !== "undefined" && typeof SparkSession.processResults === "function") {
        outcome = SparkSession.processResults({
          type: "guided",
          chordName: guidedPlan.newMove ? guidedPlan.newMove.chord : null,
          duration: 300
        });
      }
    }

    if (outcome) {
      sessionStatePatch.xpToast = { amount: outcome.xpEarned, time: Date.now(), jackpot: outcome.jackpot };
      progress.xpAwarded = outcome.xpEarned || 0;
      progress.audioCue = outcome.jackpot || outcome.leveledUp ? "levelup" : "complete";
    } else {
      sessionStatePatch.xpToast = { amount: 30, time: Date.now() };
      progress.xpAwarded = 30;
      progress.audioCue = "complete";
    }

    SparkProgressBridge.applySessionStatePatch(sessionStatePatch);
    progress.sessionStatePatch = sessionStatePatch;
    if (typeof saveState === "function") saveState();
    return progress;
  }

  function completePerformanceSong(plan, payload) {
    var progress = payload.itemId ? SparkProgressBridge.completePlanItem(plan, payload.itemId, payload.result) : {
      completedItems: plan.segments.length,
      totalItems: plan.segments.length,
      planCompleted: true
    };

    if (payload.markPlanComplete && Array.isArray(plan.segments)) {
      for (var i = 0; i < plan.segments.length; i++) plan.segments[i].completed = true;
      progress.completedItems = plan.segments.length;
      progress.totalItems = plan.segments.length;
      progress.planCompleted = true;
    }

    if (progress.planCompleted) {
      var performanceResults = payload.performanceResults || {};
      var xpAwarded = typeof payload.xpAwarded === "number"
        ? payload.xpAwarded
        : Math.max(5, Math.round((performanceResults.accuracy || 0) / 10));
      SparkProgressBridge.applyLegacyReward({
        xpDelta: xpAwarded,
        toastAmount: xpAwarded
      });
      progress.xpAwarded = xpAwarded;
      progress.sessionStatePatch = {
        xpToast: {
          amount: xpAwarded,
          time: Date.now()
        }
      };
      progress.performanceSummary = buildPerformanceCompletionSummary(plan, performanceResults, xpAwarded);
    }

    if (typeof saveState === "function") saveState();
    return progress;
  }

  function buildGameplayLearningPatch(learning, gameplayContext, gameplay) {
    learning = learning || {};
    var patch = {
      mastery: {
        rhythm: {}
      },
      weakSpots: {}
    };
    var skills = Array.isArray(learning.skills) ? learning.skills : [];
    for (var i = 0; i < skills.length; i++) {
      patch.mastery.rhythm[skills[i].id] = Math.round((skills[i].delta || 0) * 100);
    }
    if (Array.isArray(learning.weakAreas)) {
      patch.weakSpots.rhythmHighway = learning.weakAreas.slice();
    }
    var instrumentSkillPatch = buildInstrumentSkillProgressPatch(gameplayContext, learning, gameplay);
    if (instrumentSkillPatch) {
      if (instrumentSkillPatch.bassSkillProgress) patch.bassSkillProgress = instrumentSkillPatch.bassSkillProgress;
      if (instrumentSkillPatch.ukuleleSkillProgress) patch.ukuleleSkillProgress = instrumentSkillPatch.ukuleleSkillProgress;
    }
    return patch;
  }

  function buildInstrumentSkillProgressPatch(gameplayContext, learning, gameplay) {
    gameplayContext = gameplayContext || {};
    var instrument = gameplayContext.instrument || null;
    var focus = gameplayContext.exerciseFocus || null;
    if (!instrument || !focus) return null;

    var accuracy = typeof gameplay.accuracy === "number" ? Math.max(0, Math.min(1, gameplay.accuracy)) : 0;
    var maxCombo = typeof gameplay.maxCombo === "number" ? gameplay.maxCombo : 0;
    var comboFactor = Math.max(0, Math.min(1, maxCombo / 20));
    var weakAreas = Array.isArray(learning.weakAreas) ? learning.weakAreas : [];
    var latePenalty = weakAreas.indexOf("late") >= 0 || weakAreas.indexOf("late_strums") >= 0 ? 0.18 : 0;
    var fretPenalty = weakAreas.indexOf("wrong_fret") >= 0 ? 0.18 : 0;
    var groove = clampUnit(accuracy * 0.7 + comboFactor * 0.3 - latePenalty / 2);
    var timing = clampUnit(accuracy - latePenalty);
    var movement = clampUnit(accuracy - fretPenalty);
    var control = clampUnit((accuracy + groove) / 2 - (fretPenalty / 2));
    var entry = {
      groove: groove,
      timing: timing,
      accuracy: accuracy,
      movement: instrument === "bass" ? movement : control
    };

    if (instrument === "bass") {
      return { bassSkillProgress: buildSkillProgressMap(focus, entry) };
    }
    if (instrument === "ukulele") {
      return { ukuleleSkillProgress: buildSkillProgressMap(focus, entry) };
    }
    return null;
  }

  function buildSkillProgressMap(skill, entry) {
    var out = {};
    out[skill] = entry;
    return out;
  }

  function clampUnit(value) {
    return Math.max(0, Math.min(1, value || 0));
  }

  function buildCompletionSummary(plan, xpAwarded, durationSec) {
    var legacyPlan = plan && typeof plan.toLegacyPracticePlan === "function" ? plan.toLegacyPracticePlan() : null;
    return {
      sessionId: plan ? plan.id : null,
      flow: plan ? plan.flow : null,
      date: plan ? plan.generatedDate : null,
      focus: plan ? plan.focus : "",
      itemCount: legacyPlan ? legacyPlan.totalItems : (plan && plan.segments ? plan.segments.length : 0),
      durationSec: durationSec || 0,
      xpAwarded: xpAwarded || 0,
      completedAt: Date.now()
    };
  }

  function buildPerformanceCompletionSummary(plan, performanceResults, xpAwarded) {
    var performanceSong = plan && plan.context ? plan.context.performanceSong : null;
    return {
      sessionId: plan ? plan.id : null,
      flow: plan ? plan.flow : null,
      songId: performanceSong ? performanceSong.songId : "",
      arrangementType: performanceSong ? performanceSong.arrangementType : "",
      difficultyId: performanceSong ? performanceSong.difficultyId : "",
      accuracy: performanceResults.accuracy || 0,
      stars: performanceResults.stars || 0,
      score: performanceResults.score || 0,
      xpAwarded: xpAwarded || 0,
      completedAt: Date.now()
    };
  }

  function mergeSessionStatePatch(basePatch, nextPatch) {
    basePatch = basePatch || {};
    nextPatch = nextPatch || {};

    if (nextPatch.guided) basePatch.guided = nextPatch.guided;

    if (nextPatch.mastery) {
      if (!basePatch.mastery) basePatch.mastery = {};
      if (nextPatch.mastery.rhythm) {
        if (!basePatch.mastery.rhythm) basePatch.mastery.rhythm = {};
        for (var skillId in nextPatch.mastery.rhythm) {
          basePatch.mastery.rhythm[skillId] = nextPatch.mastery.rhythm[skillId];
        }
      }
    }

    if (nextPatch.weakSpots) {
      if (!basePatch.weakSpots) basePatch.weakSpots = {};
      for (var weakSpotKey in nextPatch.weakSpots) {
        basePatch.weakSpots[weakSpotKey] = Array.isArray(nextPatch.weakSpots[weakSpotKey])
          ? nextPatch.weakSpots[weakSpotKey].slice()
          : nextPatch.weakSpots[weakSpotKey];
      }
    }

    if (nextPatch.bassSkillProgress) {
      if (!basePatch.bassSkillProgress) basePatch.bassSkillProgress = {};
      mergeNamedSkillPatch(basePatch.bassSkillProgress, nextPatch.bassSkillProgress);
    }

    if (nextPatch.ukuleleSkillProgress) {
      if (!basePatch.ukuleleSkillProgress) basePatch.ukuleleSkillProgress = {};
      mergeNamedSkillPatch(basePatch.ukuleleSkillProgress, nextPatch.ukuleleSkillProgress);
    }

    if (nextPatch.xpToast) basePatch.xpToast = nextPatch.xpToast;
    return basePatch;
  }

  function mergeNamedSkillPatch(target, incoming) {
    for (var skillId in incoming) {
      target[skillId] = incoming[skillId];
    }
  }


  /**
   * Update mastery for a specific skill based on session performance.
   * Stores per-skill mastery in S.skillGraph (or creates it).
   * Uses exponential moving average to smooth over sessions.
   *
   * @param {string} skillId - e.g. "chord_switching", "timing", "rhythm"
   * @param {Object} performance - { accuracy, timing, consistency }
   * @returns {Object} { skillId, mastery, delta, previous }
   */
  ProgressEngine.prototype.updateMastery = function(skillId, performance) {
    performance = performance || {};
    var alpha = 0.2; // learning rate
    var graph = (typeof S !== "undefined" && S.skillGraph) ? S.skillGraph : {};

    var prev = graph[skillId] || 0;
    var sessionMastery = (
      (performance.accuracy || 0) * 0.4 +
      (performance.timing || 0) * 0.3 +
      (performance.consistency || 0) * 0.3
    );
    sessionMastery = Math.max(0, Math.min(1, sessionMastery));

    var updated = prev * (1 - alpha) + sessionMastery * alpha;
    updated = Math.round(updated * 1000) / 1000;

    // Persist
    if (typeof S !== "undefined") {
      if (!S.skillGraph) S.skillGraph = {};
      S.skillGraph[skillId] = updated;
      if (typeof saveState === "function") saveState();
    }

    return {
      skillId: skillId,
      mastery: updated,
      delta: Math.round((updated - prev) * 1000) / 1000,
      previous: prev,
      accuracy: performance.accuracy || 0,
      timing: performance.timing || 0,
      consistency: performance.consistency || 0
    };
  };

  /**
   * Update mastery for multiple skills from a session outcome.
   * @param {Array} skills - [{ id, accuracy, timing, consistency }]
   * @returns {Array} mastery results
   */
  ProgressEngine.prototype.updateMasteryBatch = function(skills) {
    if (!Array.isArray(skills)) return [];
    var results = [];
    for (var i = 0; i < skills.length; i++) {
      results.push(this.updateMastery(skills[i].id, skills[i]));
    }
    return results;
  };

  /**
   * Get current mastery for a skill.
   * @param {string} skillId
   * @returns {number} 0-1
   */
  ProgressEngine.prototype.getMastery = function(skillId) {
    return (typeof S !== "undefined" && S.skillGraph && S.skillGraph[skillId]) || 0;
  };

  /**
   * Get full skill graph.
   * @returns {Object} { skillId: mastery }
   */
  ProgressEngine.prototype.getSkillGraph = function() {
    return (typeof S !== "undefined" && S.skillGraph) ? JSON.parse(JSON.stringify(S.skillGraph)) : {};
  };

  window.SparkSuiteProgressEngine = ProgressEngine;
})();
