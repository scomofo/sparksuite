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
    var sessionView = sparkCore && typeof sparkCore.getActiveSessionView === "function"
      ? sparkCore.getActiveSessionView()
      : null;

    return {
      exportedAt: new Date().toISOString(),
      session: sessionView && sessionView.plan ? {
        id: sessionView.plan.id || null,
        flow: sessionView.plan.flow || null,
        lessonId: sessionView.plan.lessonId || null,
        instrumentType: sessionView.plan.instrumentType || null,
        activeSegmentId: sessionView.runtimeState ? sessionView.runtimeState.activeSegmentId : null,
        activeExerciseId: sessionView.activeExercise ? sessionView.activeExercise.id : null
      } : null,
      recentEvents: eventBus && typeof eventBus.getRecent === "function" ? eventBus.getRecent(200) : [],
      missingHandlers: gateway && typeof gateway.getMissingHandlerReport === "function"
        ? gateway.getMissingHandlerReport()
        : {},
      recentErrors: eventBus && typeof eventBus.getRecent === "function"
        ? eventBus.getRecent(200).filter(function(event) { return event.type === "error.captured"; }).slice(-20)
        : [],
      runtimeState: sparkCore && typeof sparkCore.getRuntimeState === "function" ? clone(sparkCore.getRuntimeState()) : null,
      settings: storage && typeof storage.getSettings === "function" ? clone(storage.getSettings()) : null
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
