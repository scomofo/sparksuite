(function() {
  var SessionStates = typeof SparkSessionStates !== "undefined" ? SparkSessionStates : null;
  var AllowedSessionTransitions = typeof SparkAllowedSessionTransitions !== "undefined" ? SparkAllowedSessionTransitions : {};

  function SessionStateMachine(options) {
    options = options || {};
    this.sessionId = options.sessionId || null;
    this.state = options.initialState || (SessionStates ? SessionStates.CREATED : "created");
    this.history = [{
      state: this.state,
      at: new Date().toISOString(),
      reason: "init"
    }];
  }

  SessionStateMachine.prototype.getState = function() {
    return this.state;
  };

  SessionStateMachine.prototype.canTransition = function(nextState) {
    var allowed = AllowedSessionTransitions[this.state] || [];
    return allowed.indexOf(nextState) >= 0;
  };

  SessionStateMachine.prototype.transition = function(nextState, meta) {
    if (!this.canTransition(nextState)) {
      throw new Error("Invalid session transition for " + (this.sessionId || "session") + ": " + this.state + " -> " + nextState);
    }

    this.state = nextState;
    this.history.push(Object.assign({
      state: nextState,
      at: new Date().toISOString()
    }, meta || {}));
    return this.state;
  };

  SessionStateMachine.prototype.snapshot = function() {
    return {
      sessionId: this.sessionId,
      state: this.state,
      history: JSON.parse(JSON.stringify(this.history || []))
    };
  };

  if (typeof window !== "undefined") {
    window.SparkSessionStateMachine = SessionStateMachine;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkSessionStateMachine: SessionStateMachine
    };
  }
})();
