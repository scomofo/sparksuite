(function() {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function mountSparkDebugOverlay(debugState) {
    if (!debugState || typeof document === "undefined" || !document.body || typeof document.createElement !== "function") {
      return function() {};
    }

    var root = document.createElement("div");
    root.id = "spark-debug-overlay";
    root.style.cssText =
      "position:fixed;" +
      "right:12px;" +
      "bottom:12px;" +
      "width:360px;" +
      "max-height:60vh;" +
      "overflow:auto;" +
      "z-index:99999;" +
      "background:rgba(0,0,0,0.82);" +
      "color:#fff;" +
      "font:12px/1.4 monospace;" +
      "padding:12px;" +
      "border-radius:8px;" +
      "pointer-events:auto;";

    document.body.appendChild(root);

    function render() {
      var session = debugState.getCurrentSession ? debugState.getCurrentSession() : null;
      var exercise = debugState.getCurrentExercise ? debugState.getCurrentExercise() : null;
      var payload = {
        sessionId: session && session.id ? session.id : null,
        instrument: debugState.getCurrentInstrument ? debugState.getCurrentInstrument() : null,
        lessonId: debugState.getCurrentLesson ? debugState.getCurrentLesson() : null,
        segment: debugState.getCurrentSegment ? debugState.getCurrentSegment() : null,
        exerciseId: exercise && exercise.id ? exercise.id : null,
        state: debugState.getSessionState ? debugState.getSessionState() : null,
        lastAction: debugState.getLastAction ? debugState.getLastAction() : null,
        lastResult: debugState.getLastResult ? debugState.getLastResult() : null,
        missing: debugState.getMissingHandlers ? debugState.getMissingHandlers() : {},
        timing: debugState.getTimingConfig ? debugState.getTimingConfig() : null,
        score: debugState.getScore ? debugState.getScore() : null
      };

      root.innerHTML =
        "<strong>Spark Debug</strong>" +
        "<pre>" + escapeHtml(JSON.stringify(payload, null, 2)) + "</pre>";
    }

    render();
    var interval = setInterval(render, 500);

    return function unmountSparkDebugOverlay() {
      clearInterval(interval);
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
    };
  }

  if (typeof window !== "undefined") {
    window.mountSparkDebugOverlay = mountSparkDebugOverlay;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      mountSparkDebugOverlay: mountSparkDebugOverlay
    };
  }
})();
