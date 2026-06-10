(function() {
  function defaultEmit(eventName, payload) {
    if (typeof SparkEventLogger !== "undefined" && SparkEventLogger && typeof SparkEventLogger.log === "function") {
      SparkEventLogger.log(eventName, payload);
    }
  }

  function SparkErrorBoundary(options) {
    options = options || {};
    this.eventBus = options.eventBus || null;
    this.debugBundleFactory = options.debugBundleFactory || null;
    this.onError = typeof options.onError === "function" ? options.onError : null;
  }

  SparkErrorBoundary.prototype.emit = function(eventName, payload) {
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      this.eventBus.emit(eventName, payload);
      return;
    }
    defaultEmit(eventName, payload);
  };

  SparkErrorBoundary.prototype.run = function(label, fn, context) {
    try {
      return fn();
    } catch (error) {
      this.handle(error, Object.assign({ label: label }, context || {}));
      return null;
    }
  };

  SparkErrorBoundary.prototype.runAsync = async function(label, fn, context) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, Object.assign({ label: label }, context || {}));
      return null;
    }
  };

  SparkErrorBoundary.prototype.handle = function(error, context) {
    var normalized = typeof normalizeSparkError === "function"
      ? normalizeSparkError(error, (typeof SparkErrorCodes !== "undefined" && SparkErrorCodes.UNEXPECTED_ERROR) || "UNEXPECTED_ERROR", context || {})
      : error;
    var payload = {
      error: normalized && typeof normalized.toJSON === "function"
        ? normalized.toJSON()
        : {
            name: normalized && normalized.name ? normalized.name : "Error",
            code: normalized && normalized.code ? normalized.code : "UNEXPECTED_ERROR",
            message: normalized && normalized.message ? normalized.message : String(normalized),
            context: normalized && normalized.context ? normalized.context : (context || {}),
            stack: normalized && normalized.stack ? normalized.stack : null
          },
      context: context || {},
      debugBundle: this.debugBundleFactory && typeof this.debugBundleFactory === "function"
        ? this.debugBundleFactory()
        : null
    };

    this.emit("error.captured", payload);
    if (typeof console !== "undefined" && console.error) {
      console.error("[Spark Error]", payload);
    }
    if (this.onError) this.onError(payload);
    return payload;
  };

  if (typeof window !== "undefined") {
    window.SparkErrorBoundary = SparkErrorBoundary;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkErrorBoundary: SparkErrorBoundary
    };
  }
})();
