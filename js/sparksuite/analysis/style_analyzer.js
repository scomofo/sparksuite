(function() {
  function StyleAnalyzer() {}

  StyleAnalyzer.prototype.analyze = function(user, reference) {
    user = user || {};
    reference = reference || {};
    return {
      timingMatch: this._compareTiming(user, reference),
      dynamicsMatch: this._compareDynamics(user, reference),
      groove: this._calculateGroove(user),
      overall: 0
    };
  };

  StyleAnalyzer.prototype.analyzeWithFeedback = function(user, reference) {
    var result = this.analyze(user, reference);
    result.overall = (result.timingMatch + result.dynamicsMatch + result.groove) / 3;
    result.overall = Math.round(result.overall * 100) / 100;
    result.feedback = this._generateFeedback(result, user);
    return result;
  };

  StyleAnalyzer.prototype._compareTiming = function(user, ref) {
    var uAvg = user.avgTiming || 0;
    var rAvg = ref.avgTiming || 0;
    return Math.max(0, Math.round((1 - Math.abs(uAvg - rAvg) / 200) * 100) / 100);
  };

  StyleAnalyzer.prototype._compareDynamics = function(user, ref) {
    var uVel = user.avgVelocity != null ? user.avgVelocity : 0.5;
    var rVel = ref.avgVelocity != null ? ref.avgVelocity : 0.5;
    return Math.max(0, Math.round((1 - Math.abs(uVel - rVel)) * 100) / 100);
  };

  StyleAnalyzer.prototype._calculateGroove = function(user) {
    return Math.max(0, Math.min(1, Math.round((user.consistency || 0) * 100) / 100));
  };

  StyleAnalyzer.prototype._generateFeedback = function(result, user) {
    var msgs = [];
    if (result.timingMatch < 0.7) {
      msgs.push((user.avgTiming || 0) > 0 ? "Rushing slightly - relax into the groove" : "Dragging a bit - push forward");
    }
    if (result.dynamicsMatch < 0.7) msgs.push("Uneven dynamics - aim for consistent attack");
    if (result.groove > 0.85) msgs.push("Great groove feel!");
    if (result.overall > 0.9) msgs.push("Excellent style match!");
    return msgs;
  };

  window.SparkStyleAnalyzer = StyleAnalyzer;
})();
