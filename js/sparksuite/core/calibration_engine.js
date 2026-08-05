(function() {
  function CalibrationEngine() {}

  // Instrument-agnostic: an instrument opts into the mic-latency offset by
  // declaring getCapabilities().micCalibration on its adapter.
  function supportsMicCalibration(instrumentType) {
    var registry = typeof window !== "undefined" ? window.SparkSuiteInstrumentAdapters : null;
    var factory = registry && instrumentType ? registry[instrumentType] : null;
    if (typeof factory !== "function") return false;
    try {
      var adapter = factory();
      var caps = adapter && typeof adapter.getCapabilities === "function" ? adapter.getCapabilities() : null;
      return !!(caps && caps.micCalibration);
    } catch (err) {
      return false;
    }
  }

  CalibrationEngine.prototype.getOffsetMs = function(instrumentType) {
    if (!supportsMicCalibration(instrumentType)) return 0;
    if (typeof S.performMicOffsetMs === "number" && isFinite(S.performMicOffsetMs)) return S.performMicOffsetMs;
    return 0;
  };

  CalibrationEngine.prototype.applyOffsetSec = function(songTimeSec, instrumentType) {
    return songTimeSec + (this.getOffsetMs(instrumentType) / 1000);
  };

  window.SparkCalibrationEngine = CalibrationEngine;
})();
