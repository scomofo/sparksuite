(function() {
  function TimingEngine(calibrationEngine, timingCore) {
    this.calibrationEngine = calibrationEngine || new SparkCalibrationEngine();
    this.timingCore = timingCore || (typeof SparkTimingCore !== "undefined" ? new SparkTimingCore() : null);
  }

  TimingEngine.prototype.createClock = function(instrumentType) {
    var calibrationEngine = this.calibrationEngine;
    var ctx = null;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {}

    var startPerf = performance.now();
    var startAudio = ctx ? ctx.currentTime : 0;

    return {
      getSongTime: function() {
        var base = ctx ? (ctx.currentTime - startAudio) : ((performance.now() - startPerf) / 1000);
        return Math.max(0, calibrationEngine.applyOffsetSec(base, instrumentType));
      },
      close: function() {
        if (ctx && typeof ctx.close === "function") {
          try { ctx.close(); } catch (err) {}
        }
      }
    };
  };

  TimingEngine.prototype.tickToSeconds = function(tempoMap, tick) {
    return tempoMap ? tempoMap.tickToSeconds(tick) : 0;
  };

  TimingEngine.prototype.createBeatGrid = function(input) {
    if (this.timingCore && typeof this.timingCore.createBeatGrid === "function") {
      return this.timingCore.createBeatGrid(input || {});
    }
    return {
      bpm: (input && (input.bpm || input.tempo_bpm)) || 120,
      timeSignature: (input && (input.time_signature || input.timeSignature)) || "4/4",
      beatsPerBar: 4,
      beatUnit: 4,
      secondsPerBeat: 0.5,
      secondsPerBar: 2,
      downbeats: [0]
    };
  };

  TimingEngine.prototype.createTransport = function(options) {
    if (this.timingCore && typeof this.timingCore.createTransport === "function") {
      return this.timingCore.createTransport(options || {});
    }
    options = options || {};
    return {
      status: options.status || "idle",
      durationSec: options.durationSec || 0,
      positionSec: options.positionSec || 0,
      positionMs: Math.round((options.positionSec || 0) * 1000)
    };
  };

  TimingEngine.prototype.advanceTransport = function(transport, deltaSec) {
    if (this.timingCore && typeof this.timingCore.advanceTransport === "function") {
      return this.timingCore.advanceTransport(transport, deltaSec);
    }
    transport = transport || this.createTransport({});
    return this.createTransport({
      status: transport.status || "running",
      durationSec: transport.durationSec || 0,
      positionSec: (transport.positionSec || 0) + Math.max(0, deltaSec || 0)
    });
  };

  TimingEngine.prototype.createLessonTiming = function(manifest) {
    if (this.timingCore && typeof this.timingCore.createLessonTiming === "function") {
      return this.timingCore.createLessonTiming(manifest || {});
    }
    manifest = manifest || {};
    return {
      lessonId: manifest.lesson_id || null,
      title: manifest.title || null,
      durationSec: manifest.duration_s || 0,
      tempoBpm: manifest.tempo_bpm || 120,
      timeSignature: manifest.time_signature || "4/4",
      transport: this.createTransport({ durationSec: manifest.duration_s || 0, status: "ready" })
    };
  };

  window.SparkTimingEngine = TimingEngine;
  if (typeof module !== "undefined") module.exports = TimingEngine;
})();
