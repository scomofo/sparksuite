(function() {
  /**
   * SparkAudioScheduler -- schedules callbacks at precise audio-clock times.
   * Uses Web Audio clock for accuracy, with setTimeout as fallback wake-up.
   */
  var LOOKAHEAD_MS = 25;
  var SCHEDULE_AHEAD = 0.1;

  function AudioScheduler(audioEngine) {
    this.engine = audioEngine;
    this._queue = [];
    this._timer = null;
    this._running = false;
  }

  /**
   * Schedule a callback at a specific audio time (seconds).
   */
  AudioScheduler.prototype.schedule = function(timeSec, callback) {
    this._queue.push({ timeSec: timeSec, callback: callback, fired: false });
  };

  AudioScheduler.prototype.start = function() {
    if (this._running) return;
    this._running = true;
    this._tick();
  };

  AudioScheduler.prototype.stop = function() {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  };

  AudioScheduler.prototype.clear = function() {
    this._queue = [];
  };

  AudioScheduler.prototype._tick = function() {
    if (!this._running) return;
    var currentTime = this.engine.getTimeSec();
    var horizon = currentTime + SCHEDULE_AHEAD;

    for (var i = 0; i < this._queue.length; i++) {
      var item = this._queue[i];
      if (!item.fired && item.timeSec <= horizon) {
        item.fired = true;
        var delaySec = item.timeSec - currentTime;
        if (delaySec <= 0) {
          item.callback();
        } else {
          setTimeout(item.callback, delaySec * 1000);
        }
      }
    }

    if (this._queue.length > 100) {
      this._queue = this._queue.filter(function(item) { return !item.fired; });
    }

    var self = this;
    this._timer = setTimeout(function() { self._tick(); }, LOOKAHEAD_MS);
  };

  window.SparkAudioScheduler = AudioScheduler;
})();
