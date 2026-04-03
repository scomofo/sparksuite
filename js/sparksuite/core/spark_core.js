(function() {
  function SparkCore(options) {
    options = options || {};
    this.storage = options.storage || new SparkSuiteStorage();
    this.aiEngine = options.aiEngine || new SparkAIEngine();
    this.instrumentManager = options.instrumentManager || new SparkInstrumentManager();
    this.psychologyEngine = options.psychologyEngine || new SparkSuitePsychologyEngine();
    this.curriculumEngine = options.curriculumEngine || new SparkSuiteCurriculumEngine();
    this.practiceEngine = options.practiceEngine || new SparkSuitePracticeEngine(this.psychologyEngine);
    this.progressEngine = options.progressEngine || new SparkSuiteProgressEngine();
    this.sessionEngine = options.sessionEngine || new SparkSuiteSessionEngine(this.practiceEngine, this.curriculumEngine);
    this.currentPlan = null;
    this.lastSessionOutcome = null;
    this.runtimeState = this.createInitialRuntimeState();
  }

  SparkCore.prototype.createInitialRuntimeState = function() {
    return {
      activeFlow: null,
      activeInstrumentId: null,
      activeInstrumentType: null,
      activePlanId: null,
      activeSegmentId: null,
      activeScreen: null,
      activeTab: null,
      guidedStep: null,
      guidedNewMovePhase: null,
      performanceChartId: null,
      performanceDifficultyId: null,
      performanceArrangementType: null,
      performanceSpeed: null,
      performancePracticePreset: null,
      performanceLoop: null,
      performanceInputMode: null,
      performanceCalibrationSource: null,
      performanceCalibrationMode: false,
      performanceResults: null,
      transport: {
        status: "idle",
        positionMs: 0
      },
      lastCompletedSessionId: null,
      lastCompletedFlow: null,
      lastOutcomeSummary: null
    };
  };

  SparkCore.prototype.getRuntimeState = function() {
    return this.runtimeState;
  };

  SparkCore.prototype.updateRuntimeState = function(patch) {
    var key;
    var next = {};
    patch = patch || {};

    for (key in this.runtimeState) {
      if (Object.prototype.hasOwnProperty.call(this.runtimeState, key)) {
        next[key] = this.runtimeState[key];
      }
    }

    for (key in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
      if (key === "transport" && patch.transport && typeof patch.transport === "object") {
        next.transport = {};
        var transportKey;
        for (transportKey in this.runtimeState.transport) {
          if (Object.prototype.hasOwnProperty.call(this.runtimeState.transport, transportKey)) {
            next.transport[transportKey] = this.runtimeState.transport[transportKey];
          }
        }
        for (transportKey in patch.transport) {
          if (Object.prototype.hasOwnProperty.call(patch.transport, transportKey)) {
            next.transport[transportKey] = patch.transport[transportKey];
          }
        }
      } else {
        next[key] = patch[key];
      }
    }

    this.runtimeState = next;
    return this.runtimeState;
  };

  SparkCore.prototype.deriveRuntimeScreen = function(flow) {
    if (flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return "guided_session";
    if (flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return "performance_song";
    if (flow === SparkSessionTypes.FLOW_DAILY_PRACTICE) return "daily_practice";
    return flow || null;
  };

  SparkCore.prototype.startSession = function(input) {
    input = input || {};
    var flow = input.flow || this.aiEngine.suggestNextFlow();
    var today = new Date().toISOString().slice(0, 10);
    if (!input.forceRebuild && flow === SparkSessionTypes.FLOW_DAILY_PRACTICE && this.currentPlan && this.currentPlan.generatedDate === today) {
      this.updateRuntimeState({
        activeFlow: this.currentPlan.flow,
        activeInstrumentId: this.currentPlan.instrumentType || this.currentPlan.instrumentId || null,
        activeInstrumentType: this.runtimeState.activeInstrumentType,
        activePlanId: this.currentPlan.id,
        activeSegmentId: this.currentPlan.segments && this.currentPlan.segments.length ? this.currentPlan.segments[0].id : null,
        activeScreen: this.deriveRuntimeScreen(this.currentPlan.flow),
        activeTab: this.runtimeState.activeTab,
        guidedStep: this.currentPlan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION ? "spark" : null,
      guidedNewMovePhase: null,
      performanceChartId: this.runtimeState.performanceChartId,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceLoop: this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceResults: this.runtimeState.performanceResults,
      transport: { status: "ready", positionMs: 0 }
    });
      SparkProgressBridge.syncPlanToState(this.currentPlan);
      return this.currentPlan;
    }

    var instrumentContext = this.instrumentManager.getActiveContext();
    var plan = this.sessionEngine.buildSession(flow, {
      instrumentContext: instrumentContext,
      userProfile: input.userProfile || null,
      sessionNum: input.sessionNum,
      songIndex: input.songIndex,
      songId: input.songId,
      arrangementType: input.arrangementType,
      difficultyId: input.difficultyId
    });
    this.currentPlan = plan;
    this.storage.setCurrentPlanId(plan.id);
    this.updateRuntimeState({
      activeFlow: plan.flow,
      activeInstrumentId: plan.instrumentType || plan.instrumentId || null,
      activeInstrumentType: instrumentContext.instrumentType || null,
      activePlanId: plan.id,
      activeSegmentId: plan.segments && plan.segments.length ? plan.segments[0].id : null,
      activeScreen: this.deriveRuntimeScreen(plan.flow),
      activeTab: this.runtimeState.activeTab,
      guidedStep: plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION ? "spark" : null,
      guidedNewMovePhase: null,
      performanceChartId: null,
      performanceDifficultyId: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.difficultyId || null) : null,
      performanceArrangementType: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.arrangementType || null) : null,
      performanceSpeed: null,
      performancePracticePreset: null,
      performanceLoop: null,
      performanceInputMode: null,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceResults: null,
      transport: { status: "ready", positionMs: 0 }
    });
    SparkProgressBridge.syncPlanToState(plan);
    return plan;
  };

  SparkCore.prototype.completeSession = function(payload) {
    payload = payload || {};
    if (!this.currentPlan || (payload.sessionId && this.currentPlan.id !== payload.sessionId)) {
      this.startSession({ flow: payload.flow || SparkSessionTypes.FLOW_DAILY_PRACTICE });
    }

    var result = this.progressEngine.completeSession(this.currentPlan, payload);
    this.lastSessionOutcome = result;
    this.updateRuntimeState({
      activeFlow: this.currentPlan ? this.currentPlan.flow : (payload.flow || null),
      activeInstrumentId: this.currentPlan && (this.currentPlan.instrumentType || this.currentPlan.instrumentId)
        ? (this.currentPlan.instrumentType || this.currentPlan.instrumentId)
        : this.runtimeState.activeInstrumentId,
      activeInstrumentType: this.runtimeState.activeInstrumentType,
      activePlanId: this.currentPlan ? this.currentPlan.id : this.runtimeState.activePlanId,
      activeSegmentId: payload.itemId || this.runtimeState.activeSegmentId,
      activeScreen: this.currentPlan ? this.deriveRuntimeScreen(this.currentPlan.flow) : this.runtimeState.activeScreen,
      activeTab: this.runtimeState.activeTab,
      guidedStep: result.planCompleted ? null : this.runtimeState.guidedStep,
      guidedNewMovePhase: result.planCompleted ? null : this.runtimeState.guidedNewMovePhase,
      performanceChartId: result.planCompleted ? this.runtimeState.performanceChartId : this.runtimeState.performanceChartId,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceLoop: result.planCompleted ? null : this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceResults: result.performanceSummary || this.runtimeState.performanceResults,
      transport: { status: result.planCompleted ? "completed" : "ready" },
      lastCompletedSessionId: result.planCompleted && this.currentPlan ? this.currentPlan.id : this.runtimeState.lastCompletedSessionId,
      lastCompletedFlow: result.planCompleted && this.currentPlan ? this.currentPlan.flow : this.runtimeState.lastCompletedFlow,
      lastOutcomeSummary: result.completionSummary || result.performanceSummary || result.itemResultSummary || null
    });
    if (result.planCompleted) this.storage.setCurrentPlanId(this.currentPlan.id);
    return result;
  };

  SparkCore.prototype.getCurrentPlan = function() {
    return this.currentPlan;
  };

  SparkCore.prototype.getSegmentById = function(segmentId) {
    if (!this.currentPlan || !Array.isArray(this.currentPlan.segments)) return null;
    for (var i = 0; i < this.currentPlan.segments.length; i++) {
      if (this.currentPlan.segments[i].id === segmentId) return this.currentPlan.segments[i];
    }
    return null;
  };

  SparkCore.prototype.getLastSessionOutcome = function() {
    return this.lastSessionOutcome;
  };

  SparkCore.prototype.getActiveSessionView = function() {
    return {
      plan: this.currentPlan,
      runtimeState: this.getRuntimeState(),
      lastSessionOutcome: this.getLastSessionOutcome()
    };
  };

  SparkCore.prototype.syncGuidedRuntimeState = function(patch) {
    patch = patch || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_GUIDED_SESSION,
      activeScreen: patch.activeScreen || this.runtimeState.activeScreen || "guided_session",
      guidedStep: Object.prototype.hasOwnProperty.call(patch, "guidedStep")
        ? patch.guidedStep
        : this.runtimeState.guidedStep,
      guidedNewMovePhase: Object.prototype.hasOwnProperty.call(patch, "guidedNewMovePhase")
        ? patch.guidedNewMovePhase
        : this.runtimeState.guidedNewMovePhase,
      transport: patch.transport || this.runtimeState.transport
    });
  };

  SparkCore.prototype.syncPerformanceRuntimeState = function(action, payload) {
    payload = payload || {};
    var next = {
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_PERFORMANCE_SONG,
      activeScreen: this.runtimeState.activeScreen,
      performanceChartId: this.runtimeState.performanceChartId,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceLoop: this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: this.runtimeState.performanceCalibrationMode,
      performanceResults: this.runtimeState.performanceResults,
      transport: this.runtimeState.transport
    };

    if (action === "start") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "perform";
      next.performanceChartId = payload.chartId || this.runtimeState.performanceChartId;
      next.performanceDifficultyId = payload.difficulty || this.runtimeState.performanceDifficultyId;
      next.performanceArrangementType = payload.arrangementType || this.runtimeState.performanceArrangementType;
      next.performanceSpeed = payload.speed || this.runtimeState.performanceSpeed || 1;
      next.performancePracticePreset = payload.preset || this.runtimeState.performancePracticePreset;
      next.performanceLoop = null;
      next.performanceInputMode = payload.mode || this.runtimeState.performanceInputMode;
      next.performanceCalibrationMode = false;
      next.performanceResults = null;
      next.transport = { status: payload.countIn ? "count_in" : "running", positionMs: 0 };
    } else if (action === "select_song") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "performance_song";
      if (Object.prototype.hasOwnProperty.call(payload, "chartId")) next.performanceChartId = payload.chartId;
      if (Object.prototype.hasOwnProperty.call(payload, "difficulty")) next.performanceDifficultyId = payload.difficulty;
      if (Object.prototype.hasOwnProperty.call(payload, "arrangementType")) next.performanceArrangementType = payload.arrangementType;
      next.performanceCalibrationMode = false;
      next.performanceResults = null;
      next.transport = { status: "ready", positionMs: 0 };
    } else if (action === "open_stats") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "performance_stats";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "open_editor") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "performance_editor";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "close_editor") {
      next.activeScreen = payload.screen || "home";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "open_calibration") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "perform_calibration";
      next.performanceCalibrationMode = false;
      if (Object.prototype.hasOwnProperty.call(payload, "source")) {
        next.performanceCalibrationSource = payload.source;
      }
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "calibration_source") {
      next.performanceCalibrationSource = Object.prototype.hasOwnProperty.call(payload, "source")
        ? payload.source
        : (this.runtimeState.performanceCalibrationSource || "midi");
    } else if (action === "calibration_start") {
      next.activeScreen = "perform_calibration";
      next.performanceCalibrationMode = true;
      if (Object.prototype.hasOwnProperty.call(payload, "source")) {
        next.performanceCalibrationSource = payload.source;
      }
      next.transport = { status: "calibrating", positionMs: 0 };
    } else if (action === "calibration_stop") {
      next.activeScreen = "perform_calibration";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "calibration_reset") {
      next.activeScreen = "perform_calibration";
      next.performanceCalibrationMode = false;
      next.performanceCalibrationSource = this.runtimeState.performanceCalibrationSource;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "pause") {
      next.transport = { status: "paused" };
    } else if (action === "resume") {
      next.transport = { status: "running" };
    } else if (action === "seek") {
      next.transport = { positionMs: Math.max(0, Math.round((payload.sec || 0) * 1000)) };
    } else if (action === "tick") {
      next.transport = { status: payload.status || "running", positionMs: Math.max(0, Math.round((payload.sec || 0) * 1000)) };
    } else if (action === "set_loop") {
      next.performanceLoop = payload.loop || null;
    } else if (action === "clear_loop") {
      next.performanceLoop = null;
    } else if (action === "configure") {
      if (Object.prototype.hasOwnProperty.call(payload, "difficulty")) next.performanceDifficultyId = payload.difficulty;
      if (Object.prototype.hasOwnProperty.call(payload, "speed")) next.performanceSpeed = payload.speed;
      if (Object.prototype.hasOwnProperty.call(payload, "mode")) next.performanceInputMode = payload.mode;
      if (Object.prototype.hasOwnProperty.call(payload, "preset")) next.performancePracticePreset = payload.preset;
    } else if (action === "stop") {
      next.activeScreen = payload.screen || "performance_song";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: this.runtimeState.transport.positionMs || 0 };
    } else if (action === "finish") {
      next.activeScreen = payload.screen || "perform_done";
      next.performanceLoop = null;
      next.performanceCalibrationMode = false;
      next.performanceResults = payload.results || this.runtimeState.performanceResults;
      next.transport = { status: "completed", positionMs: this.runtimeState.transport.positionMs || 0 };
    } else if (action === "start_failed") {
      next.activeScreen = payload.screen || "home";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  function createDefaultSparkCore() {
    var instrumentManager = new SparkInstrumentManager();
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
    return new SparkCore({
      instrumentManager: instrumentManager
    });
  }

  window.SparkCoreRuntime = SparkCore;
  window.createDefaultSparkCore = createDefaultSparkCore;
  window.sparkCore = createDefaultSparkCore();
})();
