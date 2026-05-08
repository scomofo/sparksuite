(function() {
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function nowMs(clock) {
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
    this.lastTickMs = null;
    this.snapshot = this.createSnapshot({ status: "idle", positionSec: 0, durationSec: 0 });
  }

  SparkTransportEngine.prototype.createSnapshot = function(options) {
    options = options || {};
    var durationSec = Math.max(0, num(options.durationSec, 0));
    var positionSec = Math.max(0, num(options.positionSec, 0));
    if (durationSec > 0) positionSec = Math.min(positionSec, durationSec);

    var base = this.timingCore && typeof this.timingCore.createTransport === "function"
      ? this.timingCore.createTransport({
        status: options.status || "idle",
        durationSec: durationSec,
        positionSec: positionSec,
        beatGrid: options.beatGrid || (this.snapshot && this.snapshot.beatGrid) || null
      })
      : {
        status: options.status || "idle",
        durationSec: durationSec,
        positionSec: positionSec,
        positionMs: Math.round(positionSec * 1000)
      };

    base.sourceId = options.sourceId || (this.snapshot && this.snapshot.sourceId) || null;
    base.reason = options.reason || null;
    base.updatedAtMs = nowMs(this.clock);
    return base;
  };

  SparkTransportEngine.prototype.emit = function(reason) {
    var snapshot = this.getSnapshot();
    snapshot.reason = reason || snapshot.reason || null;
    for (var i = 0; i < this.subscribers.length; i++) {
      try { this.subscribers[i](snapshot); } catch (err) {}
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

    this.cues = Array.isArray(source.cues) ? source.cues.slice() : [];
    this.lastTickMs = null;
    this.snapshot = this.createSnapshot({
      status: "ready",
      sourceId: source.id || source.sourceId || (lessonTiming && lessonTiming.lessonId) || null,
      durationSec: num(source.durationSec, lessonTiming ? lessonTiming.durationSec : 0),
      positionSec: num(source.positionSec, 0),
      beatGrid: source.beatGrid || (lessonTiming && lessonTiming.beatGrid) || null,
      reason: "load"
    });

    return this.emit("load");
  };

  SparkTransportEngine.prototype.play = function(options) {
    options = options || {};
    this.lastTickMs = nowMs(this.clock);
    this.snapshot = this.createSnapshot({
      status: "running",
      sourceId: this.snapshot.sourceId,
      durationSec: this.snapshot.durationSec,
      positionSec: Object.prototype.hasOwnProperty.call(options, "positionSec") ? options.positionSec : this.snapshot.positionSec,
      beatGrid: this.snapshot.beatGrid,
      reason: "play"
    });
    return this.emit("play");
  };

  SparkTransportEngine.prototype.pause = function() {
    this.tick();
    this.lastTickMs = null;
    this.snapshot = this.createSnapshot({
      status: "paused",
      sourceId: this.snapshot.sourceId,
      durationSec: this.snapshot.durationSec,
      positionSec: this.snapshot.positionSec,
      beatGrid: this.snapshot.beatGrid,
      reason: "pause"
    });
    return this.emit("pause");
  };

  SparkTransportEngine.prototype.stop = function() {
    this.lastTickMs = null;
    this.snapshot = this.createSnapshot({
      status: "stopped",
      sourceId: this.snapshot.sourceId,
      durationSec: this.snapshot.durationSec,
      positionSec: 0,
      beatGrid: this.snapshot.beatGrid,
      reason: "stop"
    });
    return this.emit("stop");
  };

  SparkTransportEngine.prototype.seek = function(positionSec) {
    this.snapshot = this.createSnapshot({
      status: this.snapshot.status,
      sourceId: this.snapshot.sourceId,
      durationSec: this.snapshot.durationSec,
      positionSec: positionSec,
      beatGrid: this.snapshot.beatGrid,
      reason: "seek"
    });
    this.lastTickMs = this.snapshot.status === "running" ? nowMs(this.clock) : null;
    return this.emit("seek");
  };

  SparkTransportEngine.prototype.tick = function(tickMs) {
    tickMs = num(tickMs, nowMs(this.clock));
    if (this.snapshot.status !== "running") return this.getSnapshot();
    if (this.lastTickMs == null) {
      this.lastTickMs = tickMs;
      return this.getSnapshot();
    }

    var deltaSec = Math.max(0, (tickMs - this.lastTickMs) / 1000);
    this.lastTickMs = tickMs;

    var next = this.timingCore && typeof this.timingCore.advanceTransport === "function"
      ? this.timingCore.advanceTransport(this.snapshot, deltaSec)
      : this.createSnapshot({
        status: "running",
        sourceId: this.snapshot.sourceId,
        durationSec: this.snapshot.durationSec,
        positionSec: this.snapshot.positionSec + deltaSec,
        beatGrid: this.snapshot.beatGrid
      });

    next.sourceId = this.snapshot.sourceId;
    this.snapshot = next;
    this.emit(this.snapshot.status === "completed" ? "complete" : "tick");
    return this.getSnapshot();
  };

  SparkTransportEngine.prototype.getDueCues = function(options) {
    if (!this.timingCore || typeof this.timingCore.scheduleCues !== "function") return [];
    return this.timingCore.scheduleCues(this.cues, this.snapshot, options || {});
  };

  SparkTransportEngine.prototype.getSnapshot = function() {
    return clone(this.snapshot);
  };

  SparkTransportEngine.prototype.isRunning = function() {
    return this.snapshot.status === "running";
  };

  if (typeof window !== "undefined") window.SparkTransportEngine = SparkTransportEngine;
  if (typeof module !== "undefined") module.exports = SparkTransportEngine;
})();
