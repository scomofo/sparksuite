(function() {
  function SparkCore(options) {
    options = options || {};
    this.storage = options.storage || new SparkSuiteStorage();
    this.aiEngine = options.aiEngine || new SparkAIEngine();
    this.instrumentManager = options.instrumentManager || new SparkInstrumentManager();
    this.psychologyEngine = options.psychologyEngine || new SparkSuitePsychologyEngine();
    this.curriculumEngine = options.curriculumEngine || new SparkSuiteCurriculumEngine();
    this.practiceEngine = options.practiceEngine || new SparkSuitePracticeEngine(this.psychologyEngine);
    this.progressEngine = options.progressEngine || new SparkSuiteProgressEngine(null, this.psychologyEngine);
    this.sessionEngine = options.sessionEngine || new SparkSuiteSessionEngine(this.practiceEngine, this.curriculumEngine);
    this.currentPlan = null;
    this.currentStateMachine = null;
    this.lastSessionOutcome = null;
    this.performanceEditorDocument = null;
    this.performanceEditorLibrary = [];
    this.spotifyClient = null;
    this.trackAnalyzer = null;
    this.chartService = null;
    this.playbackEngine = null;
    // Injectable only. The SparkPracticeIntelligence global it used to
    // construct was never loaded by index.html, so this was always null in
    // the app; the module has been removed with the rest of the unshipped
    // Spotify practice feature that consumed it.
    this.practiceIntelligence = options.practiceIntelligence || null;
    this.runtimeState = this.createInitialRuntimeState();
    this.eventBus = options.eventBus || (typeof SparkEventBus !== "undefined" ? new SparkEventBus({ maxEvents: 1000 }) : null);
    this.performanceMonitor = options.performanceMonitor || (
      typeof SparkPerformanceMonitor !== "undefined"
        ? new SparkPerformanceMonitor({
            eventBus: this.eventBus,
            budgets: typeof SparkPerformanceBudgets !== "undefined" ? SparkPerformanceBudgets : {}
          })
        : null
    );
    this.lastRecoveryRequest = null;
    this.errorBoundary = options.errorBoundary || this.createErrorBoundary();
    if (this.progressEngine && typeof this.progressEngine.setEventBus === "function") {
      this.progressEngine.setEventBus(this.eventBus);
    }
    if (this.progressEngine && typeof this.progressEngine.setPsychologyEngine === "function") {
      this.progressEngine.setPsychologyEngine(this.psychologyEngine);
    }
    if (this.storage && typeof this.storage.setPerformanceMonitor === "function") {
      this.storage.setPerformanceMonitor(this.performanceMonitor);
    }
    if (this.sessionEngine && typeof this.sessionEngine.setPerformanceMonitor === "function") {
      this.sessionEngine.setPerformanceMonitor(this.performanceMonitor);
    }
  }

  function getSparkErrorApi() {
    function SparkFallbackError(code, message, context) {
      this.name = "SparkError";
      this.code = code;
      this.message = message || code;
      this.context = context || {};
    }
    SparkFallbackError.prototype = Object.create(Error.prototype);
    SparkFallbackError.prototype.constructor = SparkFallbackError;
    SparkFallbackError.prototype.toString = function() {
      return this.name + ": " + this.message;
    };
    if (typeof SparkError !== "undefined" && typeof SparkErrorCodes !== "undefined") {
      return {
        SparkError: SparkError,
        SparkErrorCodes: SparkErrorCodes,
        normalizeSparkError: typeof normalizeSparkError === "function" ? normalizeSparkError : null
      };
    }
    if (typeof window !== "undefined" && window.SparkError && window.SparkErrorCodes) {
      return {
        SparkError: window.SparkError,
        SparkErrorCodes: window.SparkErrorCodes,
        normalizeSparkError: typeof window.normalizeSparkError === "function" ? window.normalizeSparkError : null
      };
    }
    if (typeof require === "function") {
      try {
        return {
          SparkError: require("./spark_error.js").SparkError,
          SparkErrorCodes: require("./error_codes.js").SparkErrorCodes,
          normalizeSparkError: require("./spark_error.js").normalizeSparkError
        };
      } catch (error) {}
    }
    return {
      SparkError: SparkFallbackError,
      SparkErrorCodes: {
        UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
        SESSION_STATE_INVALID_TRANSITION: "SESSION_STATE_INVALID_TRANSITION"
      },
      normalizeSparkError: null
    };
  }

  function createCoreError(code, message, context) {
    var api = getSparkErrorApi();
    return new api.SparkError(code, message, context || {});
  }

  function _normalizeSegType(type) {
    if (!type) return "practice";
    if (type === "rhythm_highway" || type === "rhythm" || type === "finger" || type === "warmup" || type === "transition" || type === "guided_session") return "practice";
    if (type === "performance_song" || type === "performance_phrase") return "song";
    if (type === "challenge") return "challenge";
    return "practice";
  }

  function getGuidedBlockTypeForStep(step) {
    if (step === "spark") return "warm_engine";
    if (step === "review" || step === "newMove") return "drill";
    if (step === "songSlice") return "song";
    if (step === "victoryLap") return "cooldown";
    return null;
  }

  // Shared with the lifecycle modules, which alias these locally so the
  // method bodies they hold read exactly as they did in one file.
  SparkCore._internal = {
    getSparkErrorApi: getSparkErrorApi,
    createCoreError: createCoreError,
    _normalizeSegType: _normalizeSegType,
    getGuidedBlockTypeForStep: getGuidedBlockTypeForStep
  };

  window.SparkCoreRuntime = SparkCore;
})();
