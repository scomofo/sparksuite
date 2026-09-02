/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Session state machine: states, transitions, completion guards
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  var _internal = SparkCore._internal;
  var getSparkErrorApi = _internal.getSparkErrorApi;
  var createCoreError = _internal.createCoreError;

  SparkCore.prototype.getSessionRuntimeHandle = function() {
    if (typeof window !== "undefined" && window.SparkSessionRuntime) return window.SparkSessionRuntime;
    if (typeof SparkSessionRuntime !== "undefined") return SparkSessionRuntime;
    return null;
  };

  SparkCore.prototype.getSessionStates = function() {
    if (typeof SparkSessionStates !== "undefined") return SparkSessionStates;
    return {
      CREATED: "created",
      READY: "ready",
      RUNNING: "running",
      SEGMENT_COMPLETE: "segment_complete",
      COMPLETED: "completed",
      FAILED: "failed",
      CANCELLED: "cancelled"
    };
  };

  SparkCore.prototype.createSessionStateMachine = function(plan) {
    var sessionStates = this.getSessionStates();
    if (typeof SparkSessionStateMachine === "undefined" || !plan || !plan.id) return null;
    this.currentStateMachine = new SparkSessionStateMachine({
      sessionId: plan.id
    });
    this.currentStateMachine.transition(sessionStates.READY, {
      reason: "session_built",
      flow: plan.flow || null
    });
    return this.currentStateMachine;
  };

  SparkCore.prototype.getSessionStateMachineSnapshot = function() {
    if (!this.currentStateMachine || typeof this.currentStateMachine.snapshot !== "function") return null;
    return this.currentStateMachine.snapshot();
  };

  SparkCore.prototype.transitionSessionState = function(nextState, meta) {
    if (!this.currentStateMachine || typeof this.currentStateMachine.transition !== "function") return null;
    return this.currentStateMachine.transition(nextState, meta || {});
  };

  SparkCore.prototype.ensureCompletionFlowState = function(meta) {
    var sessionStates = this.getSessionStates();
    var snapshot = this.getSessionStateMachineSnapshot();
    if (!snapshot || !snapshot.state) return null;
    if (snapshot.state === sessionStates.READY || snapshot.state === sessionStates.SEGMENT_COMPLETE) {
      return this.transitionSessionState(sessionStates.RUNNING, Object.assign({
        reason: "completion_flow_started"
      }, meta || {}));
    }
    return snapshot.state;
  };

  SparkCore.prototype.assertCanCompleteSession = function() {
    var sessionStates = this.getSessionStates();
    var snapshot = this.getSessionStateMachineSnapshot();
    if (!snapshot || !snapshot.state) return true;
    if (snapshot.state !== sessionStates.READY
      && snapshot.state !== sessionStates.RUNNING
      && snapshot.state !== sessionStates.SEGMENT_COMPLETE) {
      throw createCoreError(
        getSparkErrorApi().SparkErrorCodes.SESSION_STATE_INVALID_TRANSITION,
        "Cannot complete session from state " + snapshot.state,
        {
          state: snapshot.state,
          sessionId: snapshot.sessionId || (this.currentPlan && this.currentPlan.id) || null
        }
      );
    }
    return true;
  };
})();
