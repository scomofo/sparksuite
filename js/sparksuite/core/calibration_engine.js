(function() {
  function CalibrationEngine() {}

  CalibrationEngine.prototype.getOffsetMs = function(instrumentType) {
    if (instrumentType === "guitar") return S.performAudioOffsetMs || 0;
    return 0;
  };

  CalibrationEngine.prototype.applyOffsetSec = function(songTimeSec, instrumentType) {
    return songTimeSec + (this.getOffsetMs(instrumentType) / 1000);
  };

  window.SparkCalibrationEngine = CalibrationEngine;
})();
