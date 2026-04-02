/* ===== ChordSpark Performance: Transport Clock ===== */

var PerformanceTransport = {
  _playing: false,
  _startedPerfMs: 0,
  _offsetSec: 0,
  _speed: 1,
  _pausedSec: 0,
  _audioSource: null,

  start: function(fromSec, speed) {
    this._offsetSec = fromSec || 0;
    this._speed = speed || 1;
    this._startedPerfMs = performance.now();
    this._playing = true;
    this._pausedSec = 0;
  },

  pause: function() {
    if (!this._playing) return;
    this._pausedSec = this.now();
    this._playing = false;
  },

  resume: function() {
    if (this._playing) return;
    this._offsetSec = this._pausedSec;
    this._startedPerfMs = performance.now();
    this._playing = true;
  },

  stop: function() {
    this._playing = false;
    this._pausedSec = 0;
    this._offsetSec = 0;
    this._audioSource = null;
  },

  seek: function(sec) {
    this._offsetSec = sec;
    this._startedPerfMs = performance.now();
    if (!this._playing) this._pausedSec = sec;
  },

  setSpeed: function(speed) {
    if (this._playing) {
      var cur = this.now();
      this._offsetSec = cur;
      this._startedPerfMs = performance.now();
    }
    this._speed = speed;
    if (typeof setStemPlaybackRate === "function") {
      setStemPlaybackRate(speed);
    }
  },

  setAudioSource: function(audioEl) {
    this._audioSource = audioEl;
  },

  now: function() {
    if (this._audioSource && !this._audioSource.paused && !this._audioSource.ended) {
      return this._audioSource.currentTime;
    }
    if (!this._playing) return this._pausedSec;
    var elapsedMs = performance.now() - this._startedPerfMs;
    return this._offsetSec + (elapsedMs / 1000) * this._speed;
  },

  isPlaying: function() {
    return this._playing;
  }
};
