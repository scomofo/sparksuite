(function() {
  function SparkSuiteStorage() {}

  SparkSuiteStorage.prototype.getCurrentPlanId = function() {
    return S.activeSessionPlanId || null;
  };

  SparkSuiteStorage.prototype.setCurrentPlanId = function(planId) {
    S.activeSessionPlanId = planId || null;
  };

  window.SparkSuiteStorage = SparkSuiteStorage;
})();
