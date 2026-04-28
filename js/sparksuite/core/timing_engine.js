(function() {
  function TimingEngine(calibrationEngine) {
    this.calibrationEngine = calibrationEngine || new SparkCalibrationEngine();
  }

  TimingEngine.prototype.createExerciseClock = function(now) {
    if (typeof SparkExerciseClock !== "undefined") {
      return new SparkExerciseClock(now);
    }
    return {
      startedAt: null,
      now: typeof now === "function" ? now : function() {
        return typeof performance !== "undefined" && performance && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      },
      start: function() {
        this.startedAt = this.now();
        return this.startedAt;
      },
      elapsedMs: function() {
        if (this.startedAt == null) throw new Error("ExerciseClock has not started");
        return this.now() - this.startedAt;
      }
    };
  };

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
