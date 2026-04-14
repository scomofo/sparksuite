(function() {
  function CalibrationEngine() {}

  function calibrationEngineRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    return fallback;
  }

  CalibrationEngine.prototype.getOffsetMs = function(instrumentType) {
    if (instrumentType === "guitar") return calibrationEngineRead(["performAudioOffsetMs"], 0);
    return 0;
  };

  CalibrationEngine.prototype.applyOffsetSec = function(songTimeSec, instrumentType) {
    return songTimeSec + (this.getOffsetMs(instrumentType) / 1000);
  };

  window.SparkCalibrationEngine = CalibrationEngine;
})();
