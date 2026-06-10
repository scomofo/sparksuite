(function() {
  // Holds transient session state on the global S object. This is NOT a
  // persistence layer (the canonical profile store is SparkStorage, which
  // writes to localStorage); it only tracks the active session plan id.
  function SparkSuiteSessionState() {}

  SparkSuiteSessionState.prototype.getCurrentPlanId = function() {
    return S.activeSessionPlanId || null;
  };

  SparkSuiteSessionState.prototype.setCurrentPlanId = function(planId) {
    S.activeSessionPlanId = planId || null;
  };

  window.SparkSuiteSessionState = SparkSuiteSessionState;
})();
