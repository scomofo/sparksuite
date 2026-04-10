(function() {
  /**
   * SparkPlaybackEngine — synchronizes Spotify playback with the gameplay loop.
   *
   * Uses a dual-clock approach:
   *   - Local clock (performance.now()) for frame-to-frame smoothness
   *   - Spotify polling for drift correction
   *
   * Exposes getTimeSec() for RhythmGameplayEngine.update(songTimeSec).
   */
  var POLL_INTERVAL_MS = 2000;
  var MAX_DRIFT_MS = 100;

  function PlaybackEngine(spotifyClient) {
    this.spotify = spotifyClient;
    this._localStartTime = null;
    this._spotifyOffsetMs = 0;
    this._calibrationOffsetMs = 0;
    this._playing = false;
    this._trackUri = null;
    this._pollTimer = null;
    this._lastSpotifyMs = 0;
    this._onSync = null;
  }

  PlaybackEngine.prototype.start = function(trackUri, options) {
    options = options || {};
    var self = this;
    this._trackUri = trackUri;
    this._calibrationOffsetMs = options.audioOffsetMs || 0;

    return this.spotify.play(trackUri, options.deviceId).then(function() {
      self._localStartTime = performance.now();
      self._spotifyOffsetMs = 0;
      self._playing = true;
      self._startPolling();
      return true;
    });
  };

  PlaybackEngine.prototype.stop = function() {
    this._playing = false;
    this._stopPolling();
    return this.spotify.pause();
  };

  PlaybackEngine.prototype.pause = function() {
    return this.stop();
  };

  PlaybackEngine.prototype.seekTo = function(positionMs) {
    var self = this;
    return this.spotify.seek(positionMs).then(function() {
      self._localStartTime = performance.now();
      self._spotifyOffsetMs = positionMs;
    });
  };

  PlaybackEngine.prototype.getTimeSec = function() {
    if (!this._playing || this._localStartTime == null) return 0;
    var localElapsed = performance.now() - this._localStartTime;
    return (this._spotifyOffsetMs + localElapsed + this._calibrationOffsetMs) / 1000;
  };

  PlaybackEngine.prototype.getTimeMs = function() {
    return this.getTimeSec() * 1000;
  };

  PlaybackEngine.prototype.getLocalTime = function() {
    if (this._localStartTime == null) return 0;
    return performance.now() - this._localStartTime + this._spotifyOffsetMs + this._calibrationOffsetMs;
  };

  PlaybackEngine.prototype.isPlaying = function() {
    return this._playing;
  };

  PlaybackEngine.prototype.resume = function(positionMs, options) {
    options = options || {};
    positionMs = positionMs || this._lastSpotifyMs || 0;
    if (!this._trackUri) return Promise.resolve(false);
    var self = this;
    return this.start(this._trackUri, options).then(function() {
      return self.seekTo(positionMs).then(function() {
        return true;
      });
    });
  };

  PlaybackEngine.prototype.onSync = function(callback) {
    this._onSync = callback;
  };

  PlaybackEngine.prototype._startPolling = function() {
    var self = this;
    this._stopPolling();
    this._pollTimer = setInterval(function() {
      if (!self._playing) return;
      self.spotify.getPlaybackState().then(function(state) {
        if (!state || !state.is_playing) return;
        var spotifyMs = state.progress_ms || 0;
        var localMs = self.getTimeMs();
        var drift = localMs - spotifyMs;
        if (Math.abs(drift) > MAX_DRIFT_MS) {
          self._localStartTime = performance.now();
          self._spotifyOffsetMs = spotifyMs;
        }
        self._lastSpotifyMs = spotifyMs;
        if (typeof self._onSync === "function") self._onSync(drift);
      }).catch(function() { /* polling failure is non-fatal */ });
    }, POLL_INTERVAL_MS);
  };

  PlaybackEngine.prototype._stopPolling = function() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  };

  PlaybackEngine.prototype.destroy = function() {
    this._stopPolling();
    this._playing = false;
    this._localStartTime = null;
  };

  window.SparkPlaybackEngine = PlaybackEngine;
})();
