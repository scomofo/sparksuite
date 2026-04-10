(function() {
  /**
   * SparkAudioEngine -- Web Audio API playback with sample-accurate timing.
   *
   * This is THE master clock for gameplay when local audio is available.
   * Web Audio provides <5ms jitter vs 100-300ms from Spotify API.
   *
   * AudioContext is created once and reused (never recreated).
   */
  var _sharedCtx = null;

  function getSharedContext() {
    if (!_sharedCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      _sharedCtx = new AC();
    }
    return _sharedCtx;
  }

  function AudioEngine() {
    this.ctx = getSharedContext();
    this.buffer = null;
    this.source = null;
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);

    this.startTime = 0;
    this.offset = 0;
    this._playing = false;
    this._speed = 1.0;
    this._onEnded = null;
  }

  /**
   * Ensure AudioContext is running (required after user gesture).
   */
  AudioEngine.prototype.resume = function() {
    if (this.ctx.state === "suspended") {
      return this.ctx.resume();
    }
    return Promise.resolve();
  };

  /**
   * Decode and load audio from an ArrayBuffer.
   * @param {ArrayBuffer} arrayBuffer
   * @returns {Promise}
   */
  AudioEngine.prototype.load = function(arrayBuffer) {
    var self = this;
    return this.resume().then(function() {
      return self.ctx.decodeAudioData(arrayBuffer);
    }).then(function(decoded) {
      self.buffer = decoded;
    });
  };

  /**
   * Start playback from a given offset (seconds).
   * @param {number} [offsetSec=0]
   */
  AudioEngine.prototype.play = function(offsetSec) {
    if (!this.buffer) return;
    this.stop();

    offsetSec = offsetSec || 0;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this._speed;
    this.source.connect(this.gainNode);

    this.startTime = this.ctx.currentTime;
    this.offset = offsetSec;
    this._playing = true;

    var self = this;
    this.source.onended = function() {
      self._playing = false;
      if (typeof self._onEnded === "function") self._onEnded();
    };

    this.source.start(0, offsetSec);
  };

  /**
   * Stop playback.
   */
  AudioEngine.prototype.stop = function() {
    if (this.source) {
      try { this.source.stop(); } catch (e) { /* already stopped */ }
      this.source.disconnect();
      this.source = null;
    }
    this._playing = false;
  };

  /**
   * Get current playback position in seconds.
   * THIS IS THE MASTER CLOCK -- use for all gameplay timing.
   */
  AudioEngine.prototype.getTimeSec = function() {
    if (!this._playing) return this.offset;
    return (this.ctx.currentTime - this.startTime) * this._speed + this.offset;
  };

  /**
   * Get current playback position in milliseconds.
   */
  AudioEngine.prototype.getTimeMs = function() {
    return this.getTimeSec() * 1000;
  };

  AudioEngine.prototype.isPlaying = function() {
    return this._playing;
  };

  AudioEngine.prototype.getDurationSec = function() {
    return this.buffer ? this.buffer.duration : 0;
  };

  /**
   * Set volume (0.0 - 1.0).
   */
  AudioEngine.prototype.setVolume = function(vol) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, vol));
  };

  AudioEngine.prototype.onEnded = function(callback) {
    this._onEnded = callback;
  };

  AudioEngine.getSharedContext = getSharedContext;

  window.SparkAudioEngine = AudioEngine;
})();
