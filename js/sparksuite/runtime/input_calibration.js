(function() {
  function InputCalibrationSession(options) {
    options = options || {};
    this.beatsRequired = Math.max(1, Math.round(numberOr(options.beatsRequired, 8)));
    this.samples = [];
  }

  InputCalibrationSession.prototype.recordTap = function(sample) {
    sample = sample || {};
    this.samples.push(numberOr(sample.actualTimeMs, 0) - numberOr(sample.expectedTimeMs, 0));
  };

  InputCalibrationSession.prototype.isComplete = function() {
    return this.samples.length >= this.beatsRequired;
  };

  InputCalibrationSession.prototype.getOffsetMs = function() {
    if (!this.samples.length) return 0;
    var sorted = this.samples.slice().sort(function(a, b) { return a - b; });
    var trimmed = sorted.length > 2 ? sorted.slice(1, -1) : sorted.slice();
    var sum = 0;
    var i;
    for (i = 0; i < trimmed.length; i++) {
      sum += trimmed[i];
    }
    return Math.round(sum / trimmed.length);
  };

  function numberOr(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  if (typeof window !== "undefined") {
    window.SparkInputCalibrationSession = InputCalibrationSession;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SparkInputCalibrationSession = InputCalibrationSession;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      InputCalibrationSession: InputCalibrationSession
    };
  }
})();
