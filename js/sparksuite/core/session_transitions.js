(function() {
  var states = typeof SparkSessionStates !== "undefined" ? SparkSessionStates : null;
  var AllowedSessionTransitions = states ? Object.freeze({
    created: [states.READY, states.FAILED, states.CANCELLED],
    ready: [states.RUNNING, states.FAILED, states.CANCELLED],
    running: [states.SEGMENT_COMPLETE, states.COMPLETED, states.FAILED, states.CANCELLED],
    segment_complete: [states.RUNNING, states.COMPLETED, states.FAILED, states.CANCELLED],
    completed: [],
    failed: [states.READY],
    cancelled: []
  }) : Object.freeze({});

  if (typeof window !== "undefined") {
    window.SparkAllowedSessionTransitions = AllowedSessionTransitions;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkAllowedSessionTransitions: AllowedSessionTransitions
    };
  }
})();
