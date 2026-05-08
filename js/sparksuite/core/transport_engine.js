(function() {
  /**
   * SparkTransportEngine
   *
   * Engine-owned transport lifecycle for lesson playback, rhythm gameplay,
   * captions, metronome, and future sync subscribers.
   *
   * UI should render snapshots from this engine; UI should not own transport math.
   */

  function _num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function _clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function _nowMs(clock) {
    if (clock && typeof clock.nowMs === "function") return clock.nowMs();
    if (typeof performance !== "undefined" && performance && typeof performance.now === "function") return performance.now();
    return Date.now();
  }

  function SparkTransportEngine(options) {
    options = options || {};
    this.timingCore = options.timingCore || (typeof SparkTimingCore !== "undefined" ? new SparkTimingCore(options.timing || {}) : null);
    this.clock = options.clock || null;
    this.subscribers = [];
    this.cues = [];
    this._lastTickMs = null;
    this._snapshot = this._createSnapshot({ status: "idle", positionSec: 0, durationSec: 0 });
  }

  SparkTransportEngine.prototype._createSnapshot = function(options) {
    options = options || {};
    var durationSec = Math.max(0, _num(options.durationSec, 0));
    var positionSec = Math.max(0, _num(options.positionSec, 0));
    if (durationSec > 0) positionSec = Math.min(positionSec, durationSec);

    var base = this.timingCore && typeof this.timingCore.createTransport === "function"
      ? this.timingCore.createTransport({
        status: options.status || "idle",
        durationSec: durationSec,
        positionSec: positionSec,
        beatGrid: options.beatGrid || (this._snapshot && this._snapshot.beatGrid) || null
      })
      : {
        status: options.status || "idle",
        durationSec: durationSec,
        positionSec: positionSec,
        positionMs: Math.round(positionSec * 1000)
      };

    base.sourceId = options.sourceId || (this._snapshot && this._snapshot.sourceId) || null;
    base.reason = options.reason || null;
    base.updatedAtMs = _nowMs(this.clock);
    return base;
  };

  SparkTransportEngine.prototype._emit = function(reason) {
    var snapshot = this.getSnapshot();
    snapshot.reason = reason || snapshot.reason || null;
    for (var i = 0; i < this.subscribers.length; i++) {
      try {
        this.subscribers[i](snapshot);
      } catch (err) {}
    }
    return snapshot;
  };

  SparkTransportEngine.prototype.subscribe = function(listener) {
    if (typeof listener !== "function") return function() {};
    this.subscribers.push(listener);
    var self = this;
    return function unsubscribe() {
      self.subscribers = self.subscribers.filter(function(entry) { return entry !== listener; });
    };
  };

  SparkTransportEngine.prototype.load = function(source) {
    source = source || {};
    var lessonTiming = null;
    if (this.timingCore && typeof this.timingCore.createLessonTiming === "function" && source.manifest) {
      lessonTiming = this.timingCore.createLessonTiming(source.manifest);
    }

    var beatGrid = source.beatGrid || (lessonTiming && lessonTiming.beatGrid) || null;
    var durationSec = _num(source.durationSec, lessonTiming ? lessonTiming.durationSec : 0);

    this.cues = Array.isArray(source.cues) ? source.cues.slice() : [];
    this._lastTickMs = null;
    this._snapshot = this._createSnapshot({
      status: "ready",
      sourceId: source.id || source.sourceId || (lessonTiming && lessonTiming.lessonId) || null,
      durationSec: durationSec,
      positionSec: _num(source.positionSec, 0),
      beatGrid: beatGrid,
      reason: "load"
    });

    return this._emit("load");
  };

  SparkTransportEngine.prototype.play = function(options) {
    options = options || {};
    this._lastTickMs = _nowMs(this.clock);
    this._snapshot = this._createSnapshot({
      status: "running",
      sourceId: this._snapshot.sourceId,
      durationSec: this._snapshot.durationSec,
      positionSec: Object.prototype.hasOwnProperty.call(options, "positionSec") ? options.positionSec : this._snapshot.positionSec,
      beatGrid: this._snapshot.beatGrid,
      reason: "play"
    });
    return this._emit("play");
  };

  SparkTransportEngine.prototype.pause = function() {
    this.tick();
    this._lastTickMs = null;
    this._snapshot = this._createSnapshot({
      status: "paused",
      sourceId: this._snapshot.sourceId,
      durationSec: this._snapshot.durationSec,
      positionSec: this._snapshot.positionSec,
      beatGrid: this._snapshot.beatGrid,
      reason: "pause"
    });
    return this._emit("pause");
  };

  SparkTransportEngine.prototype.stop = function() {
    this._lastTickMs = null;
    this._snapshot = this._createSnapshot({
      status: "stopped",
      sourceId: this._snapshot.sourceId,
      durationSec: this._snapshot.durationSec,
      positionSec: 0,
      beatGrid: this._snapshot.beatGrid,
      reason: "stop"
    });
    return this._emit("stop");
  };

  SparkTransportEngine.prototype.seek = function(positionSec) {
    this._snapshot = this._createSnapshot({
      status: this._snapshot.status,
      sourceId: this._snapshot.sourceId,
      durationSec: this._snapshot.durationSec,
      positionSec: positionSec,
      beatGrid: this._snapshot.beatGrid,
      reason: "seek"
    });
    this._lastTickMs = this._snapshot.status === "running" ? _nowMs(this.clock) : null;
    return this._emit("seek");
  };

  SparkTransportEngine.prototype.tick = function(nowMs) {
    nowMs = _num(nowMs, _nowMs(this.clock));
    if (this._snapshot.status !== "running") return this.getSnapshot();

    if (this._lastTickMs == null) {
      this._lastTickMs = nowMs;
      return this.getSnapshot();
    }

    var deltaSec = Math.max(0, (nowMs - this._lastTickMs) / 1000);
    this._lastTickMs = nowMs;

    var next = this.timingCore && typeof this.timingCore.advanceTransport === "function"
      ? this.timingCore.advanceTransport(this._snapshot, deltaSec)
      : this._createSnapshot({
        status: "running",
        sourceId: this._snapshot.sourceId,
        durationSec: this._snapshot.durationSec,
        positionSec: this._snapshot.positionSec + deltaSec,
        beatGrid: this._snapshot.beatGrid
      });

    next.sourceId = this._snapshot.sourceId;
    this._snapshot = next;
    this._emit(this._snapshot.status === "completed" ? "complete" : "tick");
    return this.getSnapshot();
  };

  SparkTransportEngine.prototype.getDueCues = function(options) {
    if (!this.timingCore || typeof this.timingCore.scheduleCues !== "function") return [];
    return this.timingCore.scheduleCues(this.cues, this._snapshot, options || {});
  };

  SparkTransportEngine.prototype.getSnapshot = function() {
    return _clone(this._snapshot);
  };

  SparkTransportEngine.prototype.isRunning = function() {
    return this._snapshot.status === "running";
  };

  if (typeof window !== "undefined") window.SparkTransportEngine = SparkTransportEngine;
  if (typeof module !== "undefined") module.exports = SparkTransportEngine;
})();
