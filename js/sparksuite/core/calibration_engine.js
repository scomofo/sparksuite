(function() {
  function CalibrationEngine() {}

  CalibrationEngine.prototype.getOffsetMs = function(instrumentType) {
    if (instrumentType === "guitar") {
      if (typeof S.performMicOffsetMs === "number" && isFinite(S.performMicOffsetMs)) return S.performMicOffsetMs;
      return 0;
    }
    return 0;
  };

  CalibrationEngine.prototype.applyOffsetSec = function(songTimeSec, instrumentType) {
    return songTimeSec + (this.getOffsetMs(instrumentType) / 1000);
  };

  window.SparkCalibrationEngine = CalibrationEngine;
})();
