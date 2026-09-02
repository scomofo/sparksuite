/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Error boundary, structured errors, recovery and the event bus
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  var _internal = SparkCore._internal;
  var getSparkErrorApi = _internal.getSparkErrorApi;
  var createCoreError = _internal.createCoreError;

  SparkCore.prototype.cloneValue = function(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  };

  SparkCore.prototype.createErrorBoundary = function() {
    var self = this;
    if (typeof SparkErrorBoundary === "undefined") return null;
    return new SparkErrorBoundary({
      eventBus: this.eventBus || {
        emit: function(eventName, payload) {
          if (typeof SparkEventLogger !== "undefined" && SparkEventLogger && typeof SparkEventLogger.log === "function") {
            SparkEventLogger.log(eventName, payload);
          }
        }
      },
      onError: function(payload) {
        self.captureStructuredError(payload.error, payload.context);
      }
    });
  };

  SparkCore.prototype.getEventBus = function() {
    return this.eventBus;
  };

  SparkCore.prototype.emitEvent = function(type, payload) {
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      return this.eventBus.emit(type, payload || {});
    }
    if (typeof SparkEventLogger !== "undefined" && SparkEventLogger && typeof SparkEventLogger.log === "function") {
      SparkEventLogger.log(type, payload || {});
    }
    return null;
  };

  SparkCore.prototype.normalizeStructuredError = function(error, fallbackCode, context) {
    var api = getSparkErrorApi();
    if (typeof api.normalizeSparkError === "function") {
      return api.normalizeSparkError(error, fallbackCode || api.SparkErrorCodes.UNEXPECTED_ERROR, context || {});
    }
    if (error && typeof error.code === "string" && typeof error.message === "string") return error;
    return createCoreError(
      fallbackCode || api.SparkErrorCodes.UNEXPECTED_ERROR,
      error && error.message ? error.message : String(error || "SparkSuite error"),
      context || {}
    );
  };

  SparkCore.prototype.buildRecoveryActions = function() {
    return [
      { id: "retry_current_action", label: "Retry current action" },
      { id: "return_to_lesson_select", label: "Return to lesson select" },
      { id: "return_to_instrument_select", label: "Return to instrument select" },
      { id: "restart_session", label: "Restart session" },
      { id: "export_debug_bundle", label: "Export debug bundle" }
    ];
  };

  SparkCore.prototype.captureStructuredError = function(error, context) {
    var normalized = this.normalizeStructuredError(error, getSparkErrorApi().SparkErrorCodes.UNEXPECTED_ERROR, context || {});
    var serialized = typeof normalized.toJSON === "function"
      ? normalized.toJSON()
      : {
          name: normalized.name || "Error",
          code: normalized.code || getSparkErrorApi().SparkErrorCodes.UNEXPECTED_ERROR,
          message: normalized.message || String(normalized),
          context: normalized.context || {},
          createdAt: normalized.createdAt || new Date().toISOString(),
          stack: normalized.stack || null
        };
    this.updateRuntimeState({
      activeScreen: "spark_error",
      lastError: serialized,
      recoveryActions: this.buildRecoveryActions(serialized),
      recoveryContext: this.cloneValue(context || {}),
      transport: { status: "error", positionMs: this.runtimeState.transport && this.runtimeState.transport.positionMs || 0 }
    });
    return serialized;
  };

  SparkCore.prototype.clearStructuredError = function() {
    this.lastRecoveryRequest = null;
    return this.updateRuntimeState({
      lastError: null,
      recoveryActions: [],
      recoveryContext: null
    });
  };

  SparkCore.prototype.runWithErrorRecovery = function(label, recoveryContext, fn) {
    var normalized;
    this.lastRecoveryRequest = {
      label: label,
      context: this.cloneValue(recoveryContext || {}),
      retry: function() {
        return fn();
      }
    };
    try {
      var result = fn();
      this.clearStructuredError();
      return result;
    } catch (error) {
      normalized = this.normalizeStructuredError(
        error,
        getSparkErrorApi().SparkErrorCodes.UNEXPECTED_ERROR,
        Object.assign({ label: label }, recoveryContext || {})
      );
      if (this.errorBoundary && typeof this.errorBoundary.handle === "function") {
        this.errorBoundary.handle(normalized, Object.assign({ label: label }, recoveryContext || {}));
      } else {
        this.captureStructuredError(normalized, Object.assign({ label: label }, recoveryContext || {}));
      }
      throw normalized;
    }
  };

  SparkCore.prototype.getRecoveryState = function() {
    return {
      error: this.cloneValue(this.runtimeState.lastError),
      actions: this.cloneValue(this.runtimeState.recoveryActions || []),
      context: this.cloneValue(this.runtimeState.recoveryContext || null)
    };
  };

  SparkCore.prototype.buildRecoveryDebugBundle = function() {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("debug.export_bundle", "debugBundleExportMs", function() {
        return self._buildRecoveryDebugBundleInternal();
      });
    }
    return this._buildRecoveryDebugBundleInternal();
  };

  SparkCore.prototype._buildRecoveryDebugBundleInternal = function() {
    if (typeof buildSparkDebugBundle === "function") {
      return buildSparkDebugBundle({
        sparkCore: this,
        gateway: typeof SparkExecutionGateway !== "undefined" ? SparkExecutionGateway : null,
        eventBus: this.eventBus,
        storage: this.storage,
        performanceMonitor: this.performanceMonitor
      });
    }
    return {
      exportedAt: new Date().toISOString(),
      error: this.cloneValue(this.runtimeState.lastError),
      recoveryContext: this.cloneValue(this.runtimeState.recoveryContext),
      currentPlan: this.cloneValue(this.currentPlan),
      runtimeState: this.cloneValue(this.runtimeState),
      lastSessionOutcome: this.cloneValue(this.lastSessionOutcome),
      missingHandlers: typeof SparkExecutionGateway !== "undefined" && SparkExecutionGateway && typeof SparkExecutionGateway.getMissingHandlerReport === "function"
        ? SparkExecutionGateway.getMissingHandlerReport()
        : {}
    };
  };

  SparkCore.prototype.applyRecoveryAction = function(actionId) {
    var request;
    if (actionId === "retry_current_action") {
      request = this.lastRecoveryRequest;
      if (!request || typeof request.retry !== "function") return false;
      return request.retry();
    }
    if (actionId === "return_to_lesson_select") {
      this.clearStructuredError();
      return this.updateRuntimeState({
        activeScreen: "lesson_select",
        transport: { status: "idle", positionMs: 0 }
      });
    }
    if (actionId === "return_to_instrument_select") {
      this.clearStructuredError();
      return this.updateRuntimeState({
        activeScreen: "instrument_select",
        activePlanId: null,
        activeSegmentId: null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    if (actionId === "restart_session") {
      if (!this.currentPlan) return false;
      this.clearStructuredError();
      return this.startSession({
        flow: this.currentPlan.flow,
        forceRebuild: true,
        sessionNum: this.currentPlan.context && this.currentPlan.context.guidedSession
          ? this.currentPlan.context.guidedSession
          : null
      });
    }
    if (actionId === "export_debug_bundle") {
      return this.buildRecoveryDebugBundle();
    }
    return false;
  };
})();
