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
        sessionStatePatch = mergeSessionStatePatch(sessionStatePatch, buildGameplayLearningPatch(payload.gameplayResult.learning));
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

  function buildGameplayLearningPatch(learning) {
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
    return patch;
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

    if (nextPatch.xpToast) basePatch.xpToast = nextPatch.xpToast;
    return basePatch;
  }

  window.SparkSuiteProgressEngine = ProgressEngine;
})();
