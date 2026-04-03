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
  }

  SparkCore.prototype.startSession = function(input) {
    input = input || {};
    var flow = input.flow || this.aiEngine.suggestNextFlow();
    var today = new Date().toISOString().slice(0, 10);
    if (!input.forceRebuild && flow === SparkSessionTypes.FLOW_DAILY_PRACTICE && this.currentPlan && this.currentPlan.generatedDate === today) {
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
