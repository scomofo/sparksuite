(function() {
  function noop() {}

  function safeCall(fn, fallback) {
    try {
      return typeof fn === "function" ? fn() : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function SparkRhythmRuntimeBridge(options) {
    options = options || {};
    this.runtimeSync = options.runtimeSync || (typeof SparkRuntimeSyncEngine !== "undefined" ? new SparkRuntimeSyncEngine(options.runtime || {}) : null);
    this.gameplay = options.gameplay || null;
    this.metronome = options.metronome || (typeof SparkMetronomeRuntimeAdapter !== "undefined" ? new SparkMetronomeRuntimeAdapter(options.metronome || {}) : null);
    this.waveform = options.waveform || (typeof SparkWaveformRuntimeAdapter !== "undefined" ? new SparkWaveformRuntimeAdapter(options.waveform || {}) : null);
    this.unsubscribers = [];
  }

  SparkRhythmRuntimeBridge.prototype.load = function(payload, options) {
    payload = payload || {};
    options = options || {};
    if (!this.runtimeSync) return null;

    var chart = payload.songChart || options.chart || null;
    var durationSec = options.durationSec || (chart && chart.song && chart.song.durationSec) || 0;
    var beatGrid = options.beatGrid || payload.beatGrid || {
      bpm: payload.tempo_bpm || payload.bpm || 120,
      time_signature: payload.time_signature || "4/4",
      downbeats_s: [0]
    };

    for (var _u = 0; _u < this.unsubscribers.length; _u++) {
      safeCall(this.unsubscribers[_u], null);
    }
    this.unsubscribers = [];

    if (this.gameplay && typeof this.gameplay.bindRuntimeSync === "function") {
      this.unsubscribers.push(this.gameplay.bindRuntimeSync(this.runtimeSync));
    }
    if (this.metronome && typeof this.metronome.bindRuntimeSync === "function") {
      this.unsubscribers.push(this.metronome.bindRuntimeSync(this.runtimeSync));
    }
    if (this.waveform && typeof this.waveform.bindRuntimeSync === "function") {
      this.unsubscribers.push(this.waveform.bindRuntimeSync(this.runtimeSync));
    }

    if (this.waveform && options.waveform && typeof this.waveform.loadWaveform === "function") {
      this.waveform.loadWaveform(options.waveform);
    }

    return this.runtimeSync.load({
      id: options.id || payload.chartId || null,
      durationSec: durationSec,
      beatGrid: beatGrid,
      captions: options.captions || payload.captions || [],
      cues: options.cues || payload.cues || []
    });
  };

  SparkRhythmRuntimeBridge.prototype.play = function(options) {
    return this.runtimeSync && typeof this.runtimeSync.play === "function" ? this.runtimeSync.play(options || {}) : null;
  };

  SparkRhythmRuntimeBridge.prototype.pause = function() {
    return this.runtimeSync && typeof this.runtimeSync.pause === "function" ? this.runtimeSync.pause() : null;
  };

  SparkRhythmRuntimeBridge.prototype.stop = function() {
    return this.runtimeSync && typeof this.runtimeSync.stop === "function" ? this.runtimeSync.stop() : null;
  };

  SparkRhythmRuntimeBridge.prototype.seek = function(positionSec) {
    return this.runtimeSync && typeof this.runtimeSync.seek === "function" ? this.runtimeSync.seek(positionSec) : null;
  };

  SparkRhythmRuntimeBridge.prototype.tick = function(nowMs) {
    return this.runtimeSync && typeof this.runtimeSync.tick === "function" ? this.runtimeSync.tick(nowMs) : null;
  };

  SparkRhythmRuntimeBridge.prototype.getState = function() {
    return this.runtimeSync && typeof this.runtimeSync.getState === "function" ? this.runtimeSync.getState() : null;
  };

  SparkRhythmRuntimeBridge.prototype.destroy = function() {
    for (var i = 0; i < this.unsubscribers.length; i++) {
      safeCall(this.unsubscribers[i], null);
    }
    this.unsubscribers = [];
    if (this.gameplay && typeof this.gameplay.unbindRuntimeSync === "function") {
      this.gameplay.unbindRuntimeSync();
    }
  };

  if (typeof window !== "undefined") window.SparkRhythmRuntimeBridge = SparkRhythmRuntimeBridge;
  if (typeof module !== "undefined") module.exports = SparkRhythmRuntimeBridge;
})();
