(function() {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function buildSparkDebugBundle(options) {
    options = options || {};
    var sparkCore = options.sparkCore || null;
    var gateway = options.gateway || null;
    var eventBus = options.eventBus || (sparkCore && typeof sparkCore.getEventBus === "function" ? sparkCore.getEventBus() : null);
    var storage = options.storage || (sparkCore && sparkCore.storage ? sparkCore.storage : null);
    var performanceMonitor = options.performanceMonitor || (sparkCore && sparkCore.performanceMonitor ? sparkCore.performanceMonitor : null);
    var sessionView = sparkCore && typeof sparkCore.getActiveSessionView === "function"
      ? sparkCore.getActiveSessionView()
      : null;
    var recentEvents = eventBus && typeof eventBus.getRecent === "function" ? eventBus.getRecent(200) : [];

    return {
      exportedAt: new Date().toISOString(),
      appVersion: options.appVersion
        || (typeof S !== "undefined" && S.releaseInfo && S.releaseInfo.version)
        || "dev",
      schemaVersion: storage && typeof storage.getCurrentSchemaVersion === "function"
        ? storage.getCurrentSchemaVersion()
        : null,
      session: sessionView && sessionView.plan ? {
        id: sessionView.plan.id || null,
        flow: sessionView.plan.flow || null,
        lessonId: sessionView.plan.lessonId || null,
        instrumentType: sessionView.plan.instrumentType || null,
        activeSegmentId: sessionView.runtimeState ? sessionView.runtimeState.activeSegmentId : null,
        activeExerciseId: sessionView.activeExercise ? sessionView.activeExercise.id : null
      } : null,
      recentEvents: recentEvents,
      missingHandlers: gateway && typeof gateway.getMissingHandlerReport === "function"
        ? gateway.getMissingHandlerReport()
        : {},
      recentErrors: recentEvents.filter(function(event) { return event.type === "error.captured"; }).slice(-20),
      performanceBudgetWarnings: recentEvents.filter(function(event) { return event.type === "performance.budget_exceeded"; }).slice(-20),
      runtimeState: sparkCore && typeof sparkCore.getRuntimeState === "function" ? clone(sparkCore.getRuntimeState()) : null,
      settings: storage && typeof storage.getSettings === "function" ? clone(storage.getSettings()) : null,
      performanceBudgets: performanceMonitor && performanceMonitor.budgets ? clone(performanceMonitor.budgets) : null
    };
  }

  if (typeof window !== "undefined") {
    window.buildSparkDebugBundle = buildSparkDebugBundle;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      buildSparkDebugBundle: buildSparkDebugBundle
    };
  }
})();
