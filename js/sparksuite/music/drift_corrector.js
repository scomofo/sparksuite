(function() {
  /**
   * SparkDriftCorrector -- smooth drift correction between local and Spotify clocks.
   *
   * Key design: NEVER snap/jump. Always apply a fraction of the error.
   * Optionally anchors to nearest beat for musical precision.
   */
  var CORRECTION_FACTOR = 0.1;  // Apply 10% of error per correction
  var POLL_INTERVAL_MS = 2000;
  var BEAT_ANCHOR_FACTOR = 0.05;

  function DriftCorrector(syncEngine, spotifyClient) {
    this.sync = syncEngine;
    this.spotify = spotifyClient;
    this._timer = null;
    this._bpm = null;
    this._lastError = 0;
    this._onDrift = null;
  }

  /**
   * Start periodic drift correction.
   * @param {Object} [options] - { bpm, intervalMs, onDrift }
   */
  DriftCorrector.prototype.start = function(options) {
    options = options || {};
    this._bpm = options.bpm || null;
    var intervalMs = options.intervalMs || POLL_INTERVAL_MS;
    this._onDrift = options.onDrift || null;
    this.stop();

    var self = this;
    this._timer = setInterval(function() {
      self.correct();
    }, intervalMs);
  };

  /**
   * Perform one drift correction cycle.
   */
  DriftCorrector.prototype.correct = function() {
    var self = this;
    if (!this.sync || !this.sync.isPlaying()) return;

    this.spotify.getPlaybackState().then(function(state) {
      if (!state || !state.is_playing) return;

      var spotifyTime = state.progress_ms || 0;
      var localTime = self.sync.getTimeMs();
      var error = spotifyTime - localTime;

      // Smooth correction -- never jump
      self.sync.drift += error * CORRECTION_FACTOR;
      self._lastError = error;

      // Beat anchoring (optional, if BPM is known)
      if (self._bpm && self._bpm > 0) {
        var beatMs = 60000 / self._bpm;
        var currentTime = self.sync.getTimeMs();
        var nearestBeat = Math.round(currentTime / beatMs) * beatMs;
        var beatError = nearestBeat - currentTime;
        self.sync.drift += beatError * BEAT_ANCHOR_FACTOR;
      }

      if (typeof self._onDrift === "function") {
        self._onDrift(error, self.sync.drift);
      }
    }).catch(function() { /* polling failure is non-fatal */ });
  };

  DriftCorrector.prototype.stop = function() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  };

  DriftCorrector.prototype.getLastError = function() {
    return this._lastError;
  };

  window.SparkDriftCorrector = DriftCorrector;
})();
