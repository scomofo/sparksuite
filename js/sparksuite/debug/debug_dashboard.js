(function() {
  "use strict";

  function SparkDebugDashboard(container) {
    var self = this;
    self._alive = true;
    self._lastFrameCount = 0;
    self._lastFpsTime = performance.now();
    self._fps = 0;

    self._el = document.createElement("div");
    self._el.className = "debug-panel";
    self._el.id = "spark-debug-dashboard";
    self._el.setAttribute("style",
      "position:fixed;" +
      "top:10px;" +
      "right:10px;" +
      "background:rgba(0,0,0,0.85);" +
      "color:#0f0;" +
      "font:11px monospace;" +
      "padding:10px 14px;" +
      "z-index:99999;" +
      "border-radius:6px;" +
      "min-width:220px;" +
      "pointer-events:none"
    );

    container.appendChild(self._el);

    self.render = function() {
      if (!self._alive) return;

      var s = window.SparkDebugState;
      if (!s) {
        requestAnimationFrame(self.render);
        return;
      }

      var now = performance.now();
      var elapsed = now - self._lastFpsTime;
      if (elapsed >= 1000) {
        var frameDiff = s.frameCount - self._lastFrameCount;
        self._fps = Math.round((frameDiff / elapsed) * 1000);
        self._lastFrameCount = s.frameCount;
        self._lastFpsTime = now;
      }

      var lines = [];
      lines.push("<div><b>TIME:</b> " + s.time + "</div>");
      lines.push("<div><b>EXPECTED:</b> " + (s.expected !== null ? s.expected : "--") + "</div>");
      lines.push("<div><b>DETECTED:</b> " + (s.detected !== null ? s.detected : "--") + "</div>");
      lines.push("<div><b>DELTA:</b> " + s.delta + "</div>");
      lines.push("<div><b>CONFIDENCE:</b> " + s.confidence + "</div>");
      lines.push("<div><b>CHORD:</b> " + (s.chord !== null ? s.chord : "--") + "</div>");
      lines.push("<div><b>ACCURACY:</b> " + s.accuracy + "</div>");
      lines.push("<div><b>SYNC ERR:</b> " + s.syncError + "</div>");
      lines.push("<div><b>BPM:</b> " + s.bpm + "</div>");
      lines.push("<div><b>LATENCY:</b> " + s.latencyMs + "ms</div>");
      lines.push("<div><b>RL:</b> " + (s.rlAction !== null ? s.rlAction : "--") + "</div>");
      lines.push("<div><b>MODE:</b> " + (s.audioMode !== null ? s.audioMode : "--") + "</div>");
      lines.push("<div><b>FPS:</b> " + self._fps + "</div>");

      self._el.innerHTML = lines.join("");

      requestAnimationFrame(self.render);
    };

    requestAnimationFrame(self.render);
  }

  SparkDebugDashboard.prototype.show = function() {
    if (this._el) {
      this._el.style.display = "";
    }
  };

  SparkDebugDashboard.prototype.hide = function() {
    if (this._el) {
      this._el.style.display = "none";
    }
  };

  SparkDebugDashboard.prototype.destroy = function() {
    this._alive = false;
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
  };

  window.SparkDebugDashboard = SparkDebugDashboard;
})();
