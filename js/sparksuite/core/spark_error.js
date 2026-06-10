(function() {
  function getErrorCodes() {
    if (typeof SparkErrorCodes !== "undefined") return SparkErrorCodes;
    if (typeof window !== "undefined" && window.SparkErrorCodes) return window.SparkErrorCodes;
    if (typeof require === "function") {
      try {
        return require("./error_codes.js").SparkErrorCodes;
      } catch (error) {}
    }
    return {
      UNEXPECTED_ERROR: "UNEXPECTED_ERROR"
    };
  }

  function cloneContext(context) {
    if (!context || typeof context !== "object") return {};
    return JSON.parse(JSON.stringify(context));
  }

  function SparkError(code, message, context) {
    this.name = "SparkError";
    this.code = code || getErrorCodes().UNEXPECTED_ERROR;
    this.message = message || "SparkSuite error";
    this.context = cloneContext(context);
    this.createdAt = new Date().toISOString();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SparkError);
    } else {
      this.stack = (new Error(this.message)).stack;
    }
  }

  SparkError.prototype = Object.create(Error.prototype);
  SparkError.prototype.constructor = SparkError;

  SparkError.prototype.toJSON = function() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: cloneContext(this.context),
      createdAt: this.createdAt,
      stack: this.stack || null
    };
  };

  function isSparkError(error) {
    return !!(error && (
      error instanceof SparkError ||
      (typeof error.code === "string" && typeof error.message === "string" && error.context && typeof error.context === "object")
    ));
  }

  function normalizeSparkError(error, fallbackCode, fallbackContext) {
    var mergedContext = cloneContext(fallbackContext);
    var normalized;
    var key;
    if (isSparkError(error)) {
      normalized = error instanceof SparkError
        ? error
        : new SparkError(
            error.code || fallbackCode || getErrorCodes().UNEXPECTED_ERROR,
            error.message,
            error.context || {}
          );
      for (key in mergedContext) {
        if (Object.prototype.hasOwnProperty.call(mergedContext, key)
          && !Object.prototype.hasOwnProperty.call(normalized.context, key)) {
          normalized.context[key] = mergedContext[key];
        }
      }
      return normalized;
    }

    if (error && error.name && !Object.prototype.hasOwnProperty.call(mergedContext, "originalName")) {
      mergedContext.originalName = error.name;
    }
    if (error && error.stack && !Object.prototype.hasOwnProperty.call(mergedContext, "originalStack")) {
      mergedContext.originalStack = error.stack;
    }

    return new SparkError(
      fallbackCode || getErrorCodes().UNEXPECTED_ERROR,
      error && error.message ? error.message : String(error || "SparkSuite error"),
      mergedContext
    );
  }

  if (typeof window !== "undefined") {
    window.SparkError = SparkError;
    window.isSparkError = isSparkError;
    window.normalizeSparkError = normalizeSparkError;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkError: SparkError,
      isSparkError: isSparkError,
      normalizeSparkError: normalizeSparkError
    };
  }
})();
