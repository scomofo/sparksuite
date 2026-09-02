/*
 * SparkCore composition root. Runs last, after every lifecycle module has
 * attached its methods to the prototype, because the constructor calls
 * createInitialRuntimeState() and createErrorBoundary() — both of which now
 * live in lifecycle modules.
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  function createDefaultSparkCore() {
    var instrumentManager = new SparkInstrumentManager();
    var gateway;
    var core;
    if (window.SparkSuiteInstrumentAdapters && window.SparkSuiteInstrumentAdapters.guitar) {
      instrumentManager.register("guitar", window.SparkSuiteInstrumentAdapters.guitar);
    }
    if (window.SparkSuiteInstrumentAdapters && window.SparkSuiteInstrumentAdapters.bass) {
      instrumentManager.register("bass", window.SparkSuiteInstrumentAdapters.bass);
    }
    if (window.SparkSuiteInstrumentAdapters && window.SparkSuiteInstrumentAdapters.piano) {
      instrumentManager.register("piano", window.SparkSuiteInstrumentAdapters.piano);
    }
    if (window.SparkSuiteInstrumentAdapters && window.SparkSuiteInstrumentAdapters.ukulele) {
      instrumentManager.register("ukulele", window.SparkSuiteInstrumentAdapters.ukulele);
    }
    core = new SparkCore({
      instrumentManager: instrumentManager
    });
    gateway = window.SparkExecutionGateway || (typeof SparkExecutionGateway !== "undefined" ? SparkExecutionGateway : null);
    if (gateway && typeof gateway.installDefaultHandlers === "function") {
      gateway.installDefaultHandlers({
        sparkCore: core,
        force: true
      });
    } else if (gateway && typeof gateway.setSparkCoreHandle === "function") {
      gateway.setSparkCoreHandle(core);
    }
    return core;
  }

  function shouldMountSparkDebugOverlay() {
    if (window.SPARK_DEBUG === true) return true;
    if (!window.location || typeof window.location.search !== "string") return false;
    return window.location.search.indexOf("debug=true") >= 0;
  }

  function mountDefaultSparkDebugOverlay(core) {
    var gateway;
    var runtime;
    var debugState;

    if (!shouldMountSparkDebugOverlay()) return false;
    if (typeof window.createSparkDebugState !== "function" || typeof window.mountSparkDebugOverlay !== "function") {
      return false;
    }

    gateway = window.SparkExecutionGateway || (typeof SparkExecutionGateway !== "undefined" ? SparkExecutionGateway : null);
    runtime = window.SparkSessionRuntime || null;
    debugState = window.createSparkDebugState({
      sparkCore: core,
      gateway: gateway,
      runtime: runtime
    });

    if (typeof window.__unmountSparkDebugOverlay === "function") {
      window.__unmountSparkDebugOverlay();
    }

    window.SparkDebug = debugState;
    window.__unmountSparkDebugOverlay = window.mountSparkDebugOverlay(debugState);
    return true;
  }

  window.createDefaultSparkCore = createDefaultSparkCore;
  window.sparkCore = createDefaultSparkCore();
  window.sparkEventBus = window.sparkCore && typeof window.sparkCore.getEventBus === "function"
    ? window.sparkCore.getEventBus()
    : null;
  mountDefaultSparkDebugOverlay(window.sparkCore);
})();
