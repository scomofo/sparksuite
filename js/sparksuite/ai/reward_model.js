(function() {
  var WEIGHTS = { accuracy: 0.5, timing: 0.3, consistency: 0.2 };

  function RewardModel() {}

  RewardModel.prototype.compute = function(performance) {
    performance = performance || {};
    var reward = 0;
    reward += (performance.accuracy || 0) * WEIGHTS.accuracy;
    reward += (performance.timing || 0) * WEIGHTS.timing;
    reward += (performance.consistency || 0) * WEIGHTS.consistency;
    return Math.round(reward * 100) / 100;
  };

  RewardModel.prototype.computeDetailed = function(performance) {
    performance = performance || {};
    var acc = (performance.accuracy || 0) * WEIGHTS.accuracy;
    var tim = (performance.timing || 0) * WEIGHTS.timing;
    var con = (performance.consistency || 0) * WEIGHTS.consistency;
    var total = acc + tim + con;
    return {
      total: Math.round(total * 100) / 100,
      accuracy: Math.round(acc * 100) / 100,
      timing: Math.round(tim * 100) / 100,
      consistency: Math.round(con * 100) / 100,
      improvementBonus: performance.improved ? 0.1 : 0
    };
  };

  window.SparkRewardModel = RewardModel;
})();
