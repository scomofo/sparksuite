(function() {
  /**
   * SparkSyncEngine -- hybrid clock for precision audio-chart sync.
   *
   * Strategy:
   *   Spotify API provides ground-truth position (slow, 100-300ms latency)
   *   Local performance.now() provides frame-accurate interpolation
   *   Drift correction smooths divergence (never snaps)
   *
   * ALL timing in the gameplay loop MUST come from this engine.
   */
  function SyncEngine(spotifyClient) {
    this.spotify = spotifyClient;
    this.startTime = 0;          // performance.now() at playback start
    this.spotifyStart = 0;       // Spotify progress_ms at start
    this.drift = 0;              // accumulated drift correction (ms)
    this.chartOffsetMs = 0;      // chart-specific offset
    this._playing = false;
  }

  /**
   * Start sync with a Spotify track.
   * @param {string} trackUri
   * @param {Object} [options] - { deviceId, chartOffsetMs }
   * @returns {Promise}
   */
  SyncEngine.prototype.start = function(trackUri, options) {
    options = options || {};
    var self = this;
    this.chartOffsetMs = options.chartOffsetMs || 0;
    this.drift = 0;

    return this.spotify.play(trackUri, options.deviceId).then(function() {
      return self.spotify.getPlaybackState();
    }).then(function(state) {
      self.spotifyStart = (state && state.progress_ms) || 0;
      self.startTime = performance.now();
      self._playing = true;
    });
  };

  /**
   * Get current playback time in milliseconds.
   * This is THE authoritative time source for gameplay.
   */
  SyncEngine.prototype.getTimeMs = function() {
    if (!this._playing) return 0;
    var localElapsed = performance.now() - this.startTime;
    return this.spotifyStart + localElapsed + this.drift - this.chartOffsetMs;
  };

  /**
   * Get current playback time in seconds.
   * Pass this to RhythmGameplayEngine.update(songTimeSec).
   */
  SyncEngine.prototype.getTimeSec = function() {
    return this.getTimeMs() / 1000;
  };

  /**
   * Get input-adjusted time (factors out latency calibration).
   * @param {number} latencyOffsetMs - from LatencyCalibrator
   */
  SyncEngine.prototype.getInputTimeMs = function(latencyOffsetMs) {
    return this.getTimeMs() - (latencyOffsetMs || 0);
  };

  /**
   * Get render time with visual compensation (notes appear slightly early).
   * @param {number} visualOffsetMs - typically 80-120ms
   */
  SyncEngine.prototype.getRenderTimeMs = function(visualOffsetMs) {
    return this.getTimeMs() + (visualOffsetMs || 100);
  };

  SyncEngine.prototype.isPlaying = function() {
    return this._playing;
  };

  SyncEngine.prototype.stop = function() {
    this._playing = false;
    return this.spotify.pause();
  };

  SyncEngine.prototype.seekTo = function(positionMs) {
    var self = this;
    return this.spotify.seek(positionMs).then(function() {
      self.spotifyStart = positionMs;
      self.startTime = performance.now();
      self.drift = 0;
    });
  };

  window.SparkSyncEngine = SyncEngine;
})();
