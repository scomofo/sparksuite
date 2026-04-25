(function() {
  var SessionStates = Object.freeze({
    CREATED: "created",
    READY: "ready",
    RUNNING: "running",
    SEGMENT_COMPLETE: "segment_complete",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled"
  });

  if (typeof window !== "undefined") {
    window.SparkSessionStates = SessionStates;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkSessionStates: SessionStates
    };
  }
})();
