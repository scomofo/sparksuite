(function() {
  var LANE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFE66D", "#96CEB4"];
  var HIT_LINE_X = 100;
  var PX_PER_MS = 0.3;
  var NOTE_WIDTH = 30;
  var NOTE_HEIGHT = 50;
  var LANE_HEIGHT = 60;
  var LANE_OFFSET_Y = 10;

  function defaultGetCore() {
    return typeof window !== "undefined" ? window.sparkCore || null : null;
  }

  function SparkPlayAlongRenderer(options) {
    options = options || {};
    this.stateService = options.stateService || null;
    this.getCore = options.getCore || defaultGetCore;
  }

  SparkPlayAlongRenderer.prototype.renderFrame = function(result, options) {
    options = options || {};
    this.renderHighway(result);
    this.renderFretboard(result);
    this.renderSessionTelemetry(result, options.chart || null);
    this.updateDebugState(result);
  };

  SparkPlayAlongRenderer.prototype.renderHighway = function(result) {
    var canvas = document.getElementById("play-along-canvas");
    var ctx;
    var w;
    var h;
    var notes;
    var currentTimeMs;
    var i;
    var note;
    var x;
    var lane;
    var y;
    var color;

    if (!canvas) return;
    ctx = canvas.getContext("2d");
    if (!ctx) return;

    w = canvas.width;
    h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HIT_LINE_X, 0);
    ctx.lineTo(HIT_LINE_X, h);
    ctx.stroke();

    notes = result.visibleNotes || result.notes || [];
    currentTimeMs = result.timeMs != null ? result.timeMs : (result.currentTimeMs != null ? result.currentTimeMs : (result.time || 0));

    for (i = 0; i < notes.length; i++) {
      note = notes[i];
      x = HIT_LINE_X + (note.time - currentTimeMs) * PX_PER_MS;
      lane = typeof note.lane === "number" ? note.lane : 0;
      y = lane * LANE_HEIGHT + LANE_OFFSET_Y;
      color = LANE_COLORS[lane] || LANE_COLORS[0];

      ctx.fillStyle = color;
      ctx.fillRect(x, y, NOTE_WIDTH, NOTE_HEIGHT);
    }
  };

  SparkPlayAlongRenderer.prototype.renderFretboard = function(result) {
    var canvas = document.getElementById("play-along-fretboard");
    if (!canvas) return;
    if (window.sparkFretboardRenderer && typeof window.sparkFretboardRenderer.draw === "function") {
      window.sparkFretboardRenderer.draw(canvas, result);
    }
  };

  SparkPlayAlongRenderer.prototype.updateDebugState = function(result) {
    if (typeof SparkDebugState !== "undefined" && SparkDebugState.update) {
      SparkDebugState.update(result);
    }
  };

  SparkPlayAlongRenderer.prototype.renderSessionTelemetry = function(result, chart) {
    var core = this.getCore();
    var timeMs = result && result.timeMs != null ? result.timeMs : (core && typeof core.getPlaybackTimeMs === "function" ? core.getPlaybackTimeMs() : 0);
    var accuracy = core && core.performanceTracker && typeof core.performanceTracker.getAccuracy === "function"
      ? core.performanceTracker.getAccuracy()
      : null;
    var telemetry = this.stateService && typeof this.stateService.updateSessionTelemetry === "function"
      ? this.stateService.updateSessionTelemetry(chart, timeMs, accuracy)
      : null;
    var timeEl;
    var sectionEl;
    var repsEl;
    var progressEl;
    var hintEl;

    if (!telemetry) return;

    timeEl = document.getElementById("play-along-session-time");
    if (timeEl) timeEl.textContent = telemetry.timeLabel;

    sectionEl = document.getElementById("play-along-session-section");
    if (sectionEl) sectionEl.textContent = telemetry.sectionLabel || "Section: Intro";

    repsEl = document.getElementById("play-along-loop-reps");
    if (repsEl) repsEl.textContent = telemetry.repStatus;

    progressEl = document.getElementById("play-along-loop-progress");
    if (progressEl) progressEl.textContent = telemetry.loopProgressLabel;

    hintEl = document.getElementById("play-along-coach-hint");
    if (hintEl) hintEl.textContent = telemetry.coachHint;
  };

  window.SparkPlayAlongRenderer = SparkPlayAlongRenderer;
})();
