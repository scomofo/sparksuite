(function() {
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function SparkWaveformRuntimeAdapter(options) {
    options = options || {};
    this.windowSec = Math.max(0.1, num(options.windowSec, 8));
    this.leadSec = Math.max(0, num(options.leadSec, 2));
    this.zoom = Math.max(0.1, num(options.zoom, 1));
    this.waveform = null;
    this.lastState = this.createState({ positionSec: 0, durationSec: 0, status: "idle" });
  }

  SparkWaveformRuntimeAdapter.prototype.loadWaveform = function(waveform) {
    this.waveform = waveform || null;
    return this.getState();
  };

  SparkWaveformRuntimeAdapter.prototype.createState = function(transport) {
    transport = transport || {};
    var durationSec = Math.max(0, num(transport.durationSec, 0));
    var positionSec = clamp(num(transport.positionSec, 0), 0, durationSec || Number.MAX_SAFE_INTEGER);
    var effectiveWindowSec = this.windowSec / this.zoom;
    var startSec = clamp(positionSec - this.leadSec, 0, Math.max(0, durationSec - effectiveWindowSec));
    var endSec = durationSec > 0
      ? Math.min(durationSec, startSec + effectiveWindowSec)
      : startSec + effectiveWindowSec;

    return {
      status: transport.status || "idle",
      durationSec: durationSec,
      positionSec: positionSec,
      progress: durationSec > 0 ? positionSec / durationSec : 0,
      windowStartSec: startSec,
      windowEndSec: endSec,
      windowSec: effectiveWindowSec,
      leadSec: this.leadSec,
      zoom: this.zoom,
      cursorRatio: endSec > startSec ? (positionSec - startSec) / (endSec - startSec) : 0,
      waveform: this.waveform
    };
  };

  SparkWaveformRuntimeAdapter.prototype.update = function(runtimeState) {
    runtimeState = runtimeState || {};
    this.lastState = this.createState(runtimeState.transport || {});
    return this.getState();
  };

  SparkWaveformRuntimeAdapter.prototype.bindRuntimeSync = function(runtimeSyncEngine) {
    if (!runtimeSyncEngine || typeof runtimeSyncEngine.bind !== "function") return function() {};
    return runtimeSyncEngine.bind("waveform", this);
  };

  SparkWaveformRuntimeAdapter.prototype.setWindowSec = function(windowSec) {
    this.windowSec = Math.max(0.1, num(windowSec, this.windowSec));
    return this.getState();
  };

  SparkWaveformRuntimeAdapter.prototype.setZoom = function(zoom) {
    this.zoom = Math.max(0.1, num(zoom, this.zoom));
    return this.getState();
  };

  SparkWaveformRuntimeAdapter.prototype.getState = function() {
    return clone(this.lastState);
  };

  if (typeof window !== "undefined") window.SparkWaveformRuntimeAdapter = SparkWaveformRuntimeAdapter;
  if (typeof module !== "undefined") module.exports = SparkWaveformRuntimeAdapter;
})();
