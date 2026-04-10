(function() {
  /**
   * SparkAudioTransport -- playback control: speed, seek, loop.
   * Wraps AudioEngine with transport-level operations.
   */
  function AudioTransport(audioEngine) {
    this.engine = audioEngine;
    this.speed = 1.0;
    this._loopStart = null;
    this._loopEnd = null;
    this._looping = false;
  }

  /**
   * Set playback speed (0.25 - 2.0).
   */
  AudioTransport.prototype.setSpeed = function(rate) {
    rate = Math.max(0.25, Math.min(2.0, rate));
    this.speed = rate;
    this.engine._speed = rate;
    if (this.engine.source) {
      this.engine.source.playbackRate.value = rate;
    }
  };

  /**
   * Seek to a position in seconds.
   */
  AudioTransport.prototype.seek = function(timeSec) {
    var wasPlaying = this.engine.isPlaying();
    this.engine.stop();
    if (wasPlaying) {
      this.engine.play(timeSec);
      if (this._looping) this._applyLoop();
    } else {
      this.engine.offset = timeSec;
    }
  };

  /**
   * Set loop points (seconds).
   */
  AudioTransport.prototype.loop = function(startSec, endSec) {
    this._loopStart = startSec;
    this._loopEnd = endSec;
    this._looping = true;
    if (this.engine.source) this._applyLoop();
  };

  AudioTransport.prototype.clearLoop = function() {
    this._looping = false;
    this._loopStart = null;
    this._loopEnd = null;
    if (this.engine.source) {
      this.engine.source.loop = false;
    }
  };

  AudioTransport.prototype._applyLoop = function() {
    if (!this.engine.source) return;
    this.engine.source.loop = true;
    if (this._loopStart != null) this.engine.source.loopStart = this._loopStart;
    if (this._loopEnd != null) this.engine.source.loopEnd = this._loopEnd;
  };

  AudioTransport.prototype.isLooping = function() {
    return this._looping;
  };

  AudioTransport.prototype.getSpeed = function() {
    return this.speed;
  };

  window.SparkAudioTransport = AudioTransport;
})();
