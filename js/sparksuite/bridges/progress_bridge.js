(function() {
  // ---------------------------------------------------------------------------
  // progress_bridge.js -- thin forwarding layer
  // All logic now lives in SparkCore.prototype (spark_core.js).
  // Each function delegates to window.sparkCore, keeping the same public API
  // so existing callers do not break.
  // ---------------------------------------------------------------------------

  function sc() { return window.sparkCore; }

  function syncPlanToState(plan) { return sc().syncPlanToState(plan); }
  function syncDailyPracticePlanToState(plan) { return sc().syncDailyPracticePlanToState(plan); }
  function syncGuidedSessionToState(plan) { return sc().syncGuidedSessionToState(plan); }
  function syncPerformanceSongToState(plan) { return sc().syncPerformanceSongToState(plan); }

  function completePlanItem(plan, itemId, result) { return sc().completePlanItem(plan, itemId, result); }
  function finalizePlan(plan, summary) { return sc().finalizePlan(plan, summary); }

  function applySessionStatePatch(patch) { return sc().applySessionStatePatch(patch); }

  function applyLegacyReward(reward) { return sc().applyReward(reward); }
  function applyLegacySessionOutcome(update) { return sc().applySessionOutcome(update); }
  function applyLegacyActivityCompletion(update) { return sc().applyActivityCompletion(update); }
  function applyLegacyActivityRuntime(update) { return sc().applyActivityRuntime(update); }

  function applyPracticeSessionRecord(result) { return sc().applyPracticeSessionRecord(result); }

  function applyWeakSpotUpdate(update) { return sc().applyWeakSpotUpdate(update); }
  function applyAdaptiveUpdate(update) { return sc().applyAdaptiveUpdate(update); }

  function buildLegacyCompletionSummary(plan, xpAwarded) { return sc().buildLegacyCompletionSummary(plan, xpAwarded); }
  function buildLegacyItemResultSummary(result) { return sc().buildLegacyItemResultSummary(result); }
  function applyItemResultSummary(summary) { return sc().applyItemResultSummary(summary); }

  window.SparkProgressBridge = {
    syncPlanToState: syncPlanToState,
    syncDailyPracticePlanToState: syncDailyPracticePlanToState,
    syncGuidedSessionToState: syncGuidedSessionToState,
    syncPerformanceSongToState: syncPerformanceSongToState,
    applySessionStatePatch: applySessionStatePatch,
    applyLegacyReward: applyLegacyReward,
    applyLegacySessionOutcome: applyLegacySessionOutcome,
    applyLegacyActivityCompletion: applyLegacyActivityCompletion,
    applyLegacyActivityRuntime: applyLegacyActivityRuntime,
    applyPracticeSessionRecord: applyPracticeSessionRecord,
    applyWeakSpotUpdate: applyWeakSpotUpdate,
    applyAdaptiveUpdate: applyAdaptiveUpdate,
    buildLegacyCompletionSummary: buildLegacyCompletionSummary,
    buildLegacyItemResultSummary: buildLegacyItemResultSummary,
    applyItemResultSummary: applyItemResultSummary,
    completePlanItem: completePlanItem,
    finalizePlan: finalizePlan
  };
})();
