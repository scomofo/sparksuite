/**
 * SparkDebugOverlay - Real-time debug information overlay
 * Displays timing, detection, and RL diagnostics in a fixed overlay panel.
 */
(function () {
  "use strict";

  function SparkDebugOverlay(container) {
    this._container = container;
    this._el = null;
    this._data = {};
  }

  SparkDebugOverlay.prototype.show = function () {
    if (this._el) {
      this._el.style.display = "block";
      return;
    }

    var el = document.createElement("div");
    el.id = "spark-debug-overlay";
    el.style.cssText = [
      "position:fixed",
      "top:10px",
      "right:10px",
      "z-index:99999",
      "background:rgba(0,0,0,0.92)",
      "color:#00ff88",
      "font-family:monospace",
      "font-size:12px",
      "padding:12px 16px",
      "border-radius:6px",
      "min-width:260px",
      "pointer-events:none",
      "line-height:1.6",
      "white-space:pre"
    ].join(";");

    this._el = el;

    if (this._container) {
      this._container.appendChild(el);
    } else {
      document.body.appendChild(el);
    }

    this._render();
  };

  SparkDebugOverlay.prototype.hide = function () {
    if (this._el) {
      this._el.style.display = "none";
    }
  };

  /**
   * Update the overlay with new data.
   * @param {Object} data - Object with keys: time, expected, detected,
   *   confidence, latency, accuracy, bpm, drift, rlAction, mode
   */
  SparkDebugOverlay.prototype.update = function (data) {
    if (!data) return;
    this._data = data;
    this._render();
  };

  SparkDebugOverlay.prototype._render = function () {
    if (!this._el) return;

    var d = this._data;
    var lines = [
      "TIME:       " + (d.time !== undefined ? d.time : "--"),
      "EXPECTED:   " + (d.expected !== undefined ? d.expected : "--"),
      "DETECTED:   " + (d.detected !== undefined ? d.detected : "--"),
      "NOTES:      " + (d.detectedNotes && d.detectedNotes.length ? d.detectedNotes.join(", ") : "--"),
      "CHORD:      " + (d.detectedChord !== undefined ? d.detectedChord : (d.chord !== undefined ? d.chord : "--")),
      "CONFIDENCE: " + (d.confidence !== undefined ? d.confidence : "--"),
      "TIMING:     " + (d.timing !== undefined ? d.timing : "--"),
      "SCORE:      " + (d.score !== undefined ? d.score : "--"),
      "LATENCY:    " + (d.latencyMs !== undefined ? d.latencyMs : (d.latency !== undefined ? d.latency : "--")),
      "ACCURACY:   " + (d.accuracy !== undefined ? d.accuracy : "--"),
      "BPM:        " + (d.bpm !== undefined ? d.bpm : "--"),
      "DRIFT:      " + (d.syncError !== undefined ? d.syncError : (d.drift !== undefined ? d.drift : "--")),
      "RL ACTION:  " + (d.rlAction !== undefined ? d.rlAction : "--"),
      "MODE:       " + (d.audioMode !== undefined ? d.audioMode : (d.mode !== undefined ? d.mode : "--"))
    ];

    this._el.textContent = lines.join("\n");
  };

  window.SparkDebugOverlay = SparkDebugOverlay;
})();
