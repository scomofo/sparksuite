(function() {
  function AIEngine() {}

  AIEngine.prototype.suggestNextFlow = function() {
    return SparkSessionTypes.FLOW_DAILY_PRACTICE;
  };

  window.SparkAIEngine = AIEngine;
})();
