(function() {
  /**
   * SparkLatencyCalibrator -- measures and stores user-specific audio latency.
   *
   * Calibration mode: play metronome clicks, user taps along,
   * measure the delta between expected and actual tap times.
   *
   * The offset is subtracted from input timing so hit detection
   * accounts for the user's device + audio latency.
   */
  var STORAGE_KEY = "sparksuite_latency_offset";

  function LatencyCalibrator() {
    this.offset = this._loadOffset();
    this._samples = [];
  }

  /**
   * Record a calibration sample.
   * @param {number} expectedMs - when the beat should have been
   * @param {number} actualMs - when the user actually tapped
   */
  LatencyCalibrator.prototype.recordSample = function(expectedMs, actualMs) {
    this._samples.push(actualMs - expectedMs);
  };

  /**
   * Calculate and store the calibrated offset from collected samples.
   * Call after a calibration session (8-16 taps recommended).
   * @returns {number} the computed offset in ms
   */
  LatencyCalibrator.prototype.calibrate = function() {
    if (!this._samples.length) return this.offset;

    // Use median (more robust than mean against outliers)
    var sorted = this._samples.slice().sort(function(a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    this.offset = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    this.offset = Math.round(this.offset);
    this._saveOffset();
    this._samples = [];
    return this.offset;
  };

  LatencyCalibrator.prototype.getOffset = function() {
    return this.offset;
  };

  LatencyCalibrator.prototype.setOffset = function(ms) {
    this.offset = Math.round(ms);
    this._saveOffset();
  };

  LatencyCalibrator.prototype.reset = function() {
    this._samples = [];
    this.offset = 0;
    this._saveOffset();
  };

  LatencyCalibrator.prototype._loadOffset = function() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch (e) { return 0; }
  };

  LatencyCalibrator.prototype._saveOffset = function() {
    try { localStorage.setItem(STORAGE_KEY, String(this.offset)); } catch (e) {}
  };

  /**
   * Hit windows for timing judgment.
   */
  LatencyCalibrator.HIT_WINDOWS = {
    PERFECT: 40,
    GOOD: 80,
    OK: 120
  };

  window.SparkLatencyCalibrator = LatencyCalibrator;
})();
