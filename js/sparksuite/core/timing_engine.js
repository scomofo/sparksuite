(function() {
  function TimingEngine(calibrationEngine) {
    this.calibrationEngine = calibrationEngine || new SparkCalibrationEngine();
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

  window.SparkTimingEngine = TimingEngine;
})();
