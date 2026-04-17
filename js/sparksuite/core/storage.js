(function() {
  function SparkSuiteStorage() {}

  function getSparkSuiteStorageRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined" && globalThis.__sparkState) return globalThis.__sparkState;
    if (typeof globalThis !== "undefined" && globalThis.S) return globalThis.S;
    return null;
  }

  SparkSuiteStorage.prototype.getCurrentPlanId = function() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getCurrentPlanId === "function") {
      return SparkState.getCurrentPlanId();
    }
    var root = getSparkSuiteStorageRoot();
    return root ? (root.activeSessionPlanId || null) : null;
  };

  SparkSuiteStorage.prototype.setCurrentPlanId = function(planId) {
    if (typeof SparkState !== "undefined" && typeof SparkState.setCurrentPlanId === "function") {
      return SparkState.setCurrentPlanId(planId || null);
    }
    var root = getSparkSuiteStorageRoot();
    if (!root) return planId || null;
    root.activeSessionPlanId = planId || null;
    return root.activeSessionPlanId;
  };

  window.SparkSuiteStorage = SparkSuiteStorage;
})();
