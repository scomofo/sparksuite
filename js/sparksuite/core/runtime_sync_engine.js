(function() {
  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function noop() {}

  function SparkRuntimeSyncEngine(options) {
    options = options || {};
    this.timingCore = options.timingCore || (typeof SparkTimingCore !== "undefined" ? new SparkTimingCore(options.timing || {}) : null);
    this.transportEngine = options.transportEngine || (typeof SparkTransportEngine !== "undefined" ? new SparkTransportEngine({ timingCore: this.timingCore }) : null);
    this.captionSyncEngine = options.captionSyncEngine || (typeof SparkCaptionSyncEngine !== "undefined" ? new SparkCaptionSyncEngine(options.captions || {}) : null);
    this.subscribers = [];
    this.bindings = [];
    this.state = this.createState("idle", null);
  }

  SparkRuntimeSyncEngine.prototype.createState = function(status, reason) {
    var transport = this.transportEngine && typeof this.transportEngine.getSnapshot === "function"
      ? this.transportEngine.getSnapshot()
      : { status: status || "idle", positionSec: 0, positionMs: 0 };

    var captions = this.captionSyncEngine && typeof this.captionSyncEngine.getState === "function"
      ? this.captionSyncEngine.getState(transport)
      : null;

    return {
      status: status || transport.status || "idle",
      reason: reason || null,
      transport: transport,
      captions: captions,
      gameplay: null,
      metronome: null,
      waveform: null
    };
  };

  SparkRuntimeSyncEngine.prototype.emit = function(reason, prebuiltState) {
    this.state = prebuiltState || this.createState((this.state && this.state.status) || "idle", reason || null);
    var snapshot = this.getState();
    for (var i = 0; i < this.subscribers.length; i++) {
      try { this.subscribers[i](snapshot); } catch (err) {}
    }
    return snapshot;
  };

  SparkRuntimeSyncEngine.prototype.subscribe = function(listener) {
    if (typeof listener !== "function") return noop;
    this.subscribers.push(listener);
    var self = this;
    return function unsubscribe() {
      self.subscribers = self.subscribers.filter(function(entry) { return entry !== listener; });
    };
  };

  SparkRuntimeSyncEngine.prototype.bind = function(name, adapter) {
    if (!name || !adapter) return noop;
    var binding = { name: name, adapter: adapter };
    this.bindings.push(binding);
    var self = this;
    return function unbind() {
      self.bindings = self.bindings.filter(function(entry) { return entry !== binding; });
    };
  };

  SparkRuntimeSyncEngine.prototype.load = function(source) {
    source = source || {};
    if (this.captionSyncEngine && source.captions) {
      this.captionSyncEngine.loadCues(source.captions);
    }
    if (this.transportEngine && typeof this.transportEngine.load === "function") {
      this.transportEngine.load(source);
    }
    this.state = this.createState("ready", "load");
    return this.emit("load");
  };

  SparkRuntimeSyncEngine.prototype.play = function(options) {
    if (this.transportEngine && typeof this.transportEngine.play === "function") {
      this.transportEngine.play(options || {});
    }
    this.state.status = "running";
    return this.emit("play");
  };

  SparkRuntimeSyncEngine.prototype.pause = function() {
    if (this.transportEngine && typeof this.transportEngine.pause === "function") {
      this.transportEngine.pause();
    }
    this.state.status = "paused";
    return this.emit("pause");
  };

  SparkRuntimeSyncEngine.prototype.stop = function() {
    if (this.transportEngine && typeof this.transportEngine.stop === "function") {
      this.transportEngine.stop();
    }
    this.state.status = "stopped";
    return this.emit("stop");
  };

  SparkRuntimeSyncEngine.prototype.seek = function(positionSec) {
    if (this.transportEngine && typeof this.transportEngine.seek === "function") {
      this.transportEngine.seek(positionSec);
    }
    var seekTransport = this.transportEngine && typeof this.transportEngine.getSnapshot === "function"
      ? this.transportEngine.getSnapshot() : null;
    if (this.captionSyncEngine && seekTransport) {
      this.captionSyncEngine.update(seekTransport);
    }
    return this.emit("seek");
  };

  SparkRuntimeSyncEngine.prototype.tick = function(nowMs) {
    var transport = this.transportEngine && typeof this.transportEngine.tick === "function"
      ? this.transportEngine.tick(nowMs)
      : null;

    if (this.captionSyncEngine && transport) {
      this.captionSyncEngine.update(transport);
    }

    // Rebuild state with fresh transport before notifying bindings
    this.state = this.createState(transport ? transport.status : this.state.status, "tick");

    for (var i = 0; i < this.bindings.length; i++) {
      var binding = this.bindings[i];
      if (binding.adapter && typeof binding.adapter.update === "function") {
        try {
          // Merge each adapter's derived state into the emitted runtime state
          // under its binding name — otherwise the gameplay/metronome/waveform
          // slots stay permanently null and a dumb-renderer UI has nothing to
          // draw from.
          var produced = binding.adapter.update(this.getState());
          if (typeof produced === "undefined" && typeof binding.adapter.getState === "function") {
            produced = binding.adapter.getState();
          }
          if (typeof produced !== "undefined") {
            this.state[binding.name] = produced;
            // The gameplay engine binds as "rhythm_gameplay"; mirror it into
            // the canonical declared slot as well.
            if (binding.name === "rhythm_gameplay") this.state.gameplay = produced;
          }
        } catch (err) {}
      }
    }

    this.state.status = transport ? transport.status : this.state.status;
    return this.emit("tick", this.state);
  };

  SparkRuntimeSyncEngine.prototype.getState = function() {
    return clone(this.state);
  };

  if (typeof window !== "undefined") window.SparkRuntimeSyncEngine = SparkRuntimeSyncEngine;
  if (typeof module !== "undefined") module.exports = SparkRuntimeSyncEngine;
})();
