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
    this.currentStateMachine = null;
    this.lastSessionOutcome = null;
    this.performanceEditorDocument = null;
    this.performanceEditorLibrary = [];
    this.spotifyClient = null;
    this.trackAnalyzer = null;
    this.chartService = null;
    this.playbackEngine = null;
    this.practiceIntelligence = options.practiceIntelligence || (typeof SparkPracticeIntelligence !== "undefined" ? new SparkPracticeIntelligence() : null);
    this.runtimeState = this.createInitialRuntimeState();
  }

  SparkCore.prototype.cloneValue = function(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  };

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
      throw new Error("Cannot complete session from state " + snapshot.state);
    }
    return true;
  };

  SparkCore.prototype.createInitialRuntimeState = function() {
    var gameplayTimingConfig = typeof SparkNormalizeTimingConfig === "function"
      ? SparkNormalizeTimingConfig()
      : {
          hitWindowMs: 140,
          perfectWindowMs: 50,
          goodWindowMs: 90,
          noteSpeed: 0.32,
          inputLatencyOffsetMs: 0
        };
    var practiceAssistConfig = typeof SparkNormalizePracticeAssist === "function"
      ? SparkNormalizePracticeAssist()
      : {
          speedMultiplier: 1,
          loopRange: null,
          showGhostNotes: false,
          metronome: false,
          noFailMode: true,
          leftHanded: false,
          noStrumMode: false
        };
    var accessibilitySettings = typeof SparkNormalizeAccessibilitySettings === "function"
      ? SparkNormalizeAccessibilitySettings({})
      : {
          reducedMotion: false,
          highContrast: false,
          noteSize: "normal",
          laneLabels: true,
          colorblindSafeLanes: false,
          metronomeVisualOnly: false,
          disableFailureAnimations: false,
          keyboardRemapping: {},
          leftHandedLayout: false,
          slowerDefaultSpeed: false,
          audioCueVolume: 0.8,
          metronomeVolume: 0.6
        };
    return {
      activeFlow: null,
      activeInstrumentId: null,
      activeInstrumentType: null,
      activePlanId: null,
      activeSegmentId: null,
      activeScreen: null,
      activeTab: null,
      songSessionData: null,
      songSessionSource: null,
      songPlaying: false,
      songBeat: 0,
      stemPlaying: false,
      stemCurrentTime: 0,
      stemDuration: 0,
      songsSubTab: "builtin",
      songFilter: "",
      songSort: "level",
      songSortAsc: true,
      communityTab: "browse",
      communitySearch: "",
      communitySort: "votes",
      legacyPracticeMode: null,
      legacyPracticeChordName: null,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: null,
      legacyPracticeRemainingSec: null,
      legacyFingerExerciseId: null,
      legacyFingerExerciseActive: false,
      legacyFingerExerciseCount: 0,
      legacyStrumPattern: null,
      legacyStrumActive: false,
      legacyStrumBeat: -1,
      legacyQuizQuestion: null,
      legacyQuizOptions: [],
      legacyQuizAnswer: null,
      legacyQuizScore: 0,
      legacyQuizTotal: 0,
      legacyQuizStreak: 0,
      legacyEarTrainQuestion: null,
      legacyEarTrainOptions: [],
      legacyEarTrainAnswer: null,
      legacyEarTrainScore: 0,
      legacyEarTrainTotal: 0,
      legacyEarTrainStreak: 0,
      legacyDrillChordNames: null,
      legacyDailyChallengeId: null,
      legacyDailyTimerActive: false,
      legacyDailyDurationSec: null,
      legacyDailyRemainingSec: null,
      legacyDailyComplete: false,
      legacyRunnerActive: false,
      legacyRunnerTargetName: null,
      legacyRunnerScore: 0,
      legacyRunnerCombo: 0,
      legacyRunnerMaxCombo: 0,
      spotifyConnected: false,
      spotifyTrackId: null,
      spotifyPlaying: false,
      spotifyDifficulty: "easy",
      spotifyPlaylistConnected: false,
      spotifyPlaylistPlaylists: [],
      spotifyPlaylistLastSyncAt: null,
      spotifyPlaylistLastResult: null,
      spotifyPlaylistUnresolvedTracks: [],
      spotifyPlaylistSyncStatus: "idle",
      spotifyPlaylistError: null,
      legacyRunnerLives: 0,
      legacyRunnerDistance: 0,
      legacyRunnerObstacles: [],
      legacyRunnerResults: null,
      legacyRhythmActive: false,
      legacyRhythmBeats: [],
      legacyRhythmScore: 0,
      legacyRhythmCombo: 0,
      legacyRhythmMaxCombo: 0,
      legacyRhythmStartTimeMs: 0,
      legacyRhythmResults: null,
      dashboardRecommendations: [],
      dashboardInsights: null,
      dashboardChallenges: [],
      lastDashboardRecommendationId: null,
      lastDashboardRefreshAt: null,
      settingsTheme: null,
      tunerActive: false,
      tunerNote: null,
      tunerFreq: 0,
      tunerCents: 0,
      tunerError: null,
      metronomeActive: false,
      metronomeBpm: 80,
      metronomeBeat: 0,
      metronomeBeatsPerBar: 4,
      chordDetectActive: false,
      chordDetectNotes: [],
      chordDetectMatch: -1,
      chordDetectError: null,
      audioInputDevices: [],
      audioInputId: null,
      audioTestingId: null,
      audioTestLevel: 0,
      midiEnabled: false,
      midiActiveDeviceId: null,
      midiActiveDeviceName: null,
      midiActiveProfileId: null,
      midiActiveProfileName: null,
      midiDeviceOptions: [],
      midiProfileOptions: [],
      midiImportSummary: null,
      midiImportAssignments: {},
      midiImportSeedMode: null,
      midiImportSeedTitle: null,
      cloudLoggedIn: false,
      cloudEmail: null,
      cloudLastSyncStatus: "idle",
      cloudLastSyncAt: null,
      curriculumSummaries: [],
      curriculumPackSummaries: [],
      curriculumLoading: false,
      curriculumLastManifestPath: null,
      curriculumLastLoadStatus: "idle",
      contentLoading: false,
      contentLastManifestPath: null,
      contentLastLoadStatus: "idle",
      guidedStep: null,
      guidedNewMovePhase: null,
      guidedActivityId: null,
      guidedActivityKind: null,
      guidedBlockType: null,
      performanceChartId: null,
      performanceSongData: null,
      performanceSongIndex: null,
      performanceSongTitle: null,
      performanceDifficultyId: null,
      performanceArrangementType: null,
      performanceSpeed: null,
      performancePracticePreset: null,
      performanceLoop: null,
      performanceInputMode: null,
      performanceEditorMode: null,
      performanceEditorSnap: null,
      performanceEditorChartId: null,
      performanceEditorChartTitle: null,
      performanceEditorSource: null,
      performanceEditorDirty: false,
      performanceEditorSelectedEventId: null,
      performanceEditorSelectedEventLabel: null,
      performanceEditorSelectedEventTime: null,
      performanceEditorSelectedEventDuration: null,
      performanceEditorSelectedPhraseId: null,
      performanceEditorSelectedPhraseName: null,
      performanceEditorSelectedPhraseStart: null,
      performanceEditorSelectedPhraseEnd: null,
      performanceEditorBpm: null,
      performanceEditorEventCount: 0,
      performanceEditorPhraseCount: 0,
      skillTreeFocus: "overview",
      performanceStatsFocus: null,
      performanceDailyChallenge: null,
      performanceDailyComplete: false,
      performanceCalibrationSource: null,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: 0,
      performanceMidiOffsetMs: 0,
      performanceMicOffsetMs: 0,
      gameplayTimingConfig: gameplayTimingConfig,
      practiceAssistConfig: practiceAssistConfig,
      accessibilitySettings: accessibilitySettings,
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

  SparkCore.prototype.getGameplayTimingConfig = function() {
    var config = this.runtimeState && this.runtimeState.gameplayTimingConfig
      ? this.runtimeState.gameplayTimingConfig
      : null;
    if (typeof SparkNormalizeTimingConfig === "function") {
      return SparkNormalizeTimingConfig(config || {});
    }
    return this.cloneValue(config);
  };

  SparkCore.prototype.syncGameplayTimingConfig = function(patch) {
    var next = typeof SparkNormalizeTimingConfig === "function"
      ? SparkNormalizeTimingConfig(Object.assign({}, this.getGameplayTimingConfig() || {}, patch || {}))
      : Object.assign({}, this.getGameplayTimingConfig() || {}, patch || {});
    this.updateRuntimeState({ gameplayTimingConfig: next });
    return next;
  };

  SparkCore.prototype.applyInputCalibrationOffset = function(offsetMs) {
    return this.syncGameplayTimingConfig({
      inputLatencyOffsetMs: Math.round(typeof offsetMs === "number" && isFinite(offsetMs) ? offsetMs : 0)
    });
  };

  SparkCore.prototype.getPracticeAssistConfig = function() {
    var config = this.runtimeState && this.runtimeState.practiceAssistConfig
      ? this.runtimeState.practiceAssistConfig
      : null;
    if (typeof SparkNormalizePracticeAssist === "function") {
      return SparkNormalizePracticeAssist(config || {});
    }
    return this.cloneValue(config);
  };

  SparkCore.prototype.syncPracticeAssistConfig = function(patch) {
    var next = typeof SparkNormalizePracticeAssist === "function"
      ? SparkNormalizePracticeAssist(Object.assign({}, this.getPracticeAssistConfig() || {}, patch || {}))
      : Object.assign({}, this.getPracticeAssistConfig() || {}, patch || {});
    this.updateRuntimeState({ practiceAssistConfig: next });
    return next;
  };

  SparkCore.prototype.getAccessibilitySettings = function() {
    var settings = this.runtimeState && this.runtimeState.accessibilitySettings
      ? this.runtimeState.accessibilitySettings
      : null;
    if (typeof SparkNormalizeAccessibilitySettings === "function") {
      return SparkNormalizeAccessibilitySettings(settings || {});
    }
    return this.cloneValue(settings);
  };

  SparkCore.prototype.syncAccessibilitySettings = function(patch) {
    var next = typeof SparkNormalizeAccessibilitySettings === "function"
      ? SparkNormalizeAccessibilitySettings(Object.assign({}, this.getAccessibilitySettings() || {}, patch || {}))
      : Object.assign({}, this.getAccessibilitySettings() || {}, patch || {});
    this.updateRuntimeState({ accessibilitySettings: next });
    return next;
  };


  function _normalizeSegType(type) {
    if (!type) return "practice";
    if (type === "rhythm_highway" || type === "rhythm" || type === "finger" || type === "warmup" || type === "transition" || type === "guided_session") return "practice";
    if (type === "performance_song" || type === "performance_phrase") return "song";
    if (type === "challenge") return "challenge";
    return "practice";
  }
  SparkCore.prototype.deriveRuntimeScreen = function(flow) {
    if (flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return "guided_session";
    if (flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return "performance_song";
    if (flow === SparkSessionTypes.FLOW_DAILY_PRACTICE) return "daily_practice";
    if (flow === "legacy_practice_session") return "session";
    if (flow === "legacy_practice_drill") return "drill";
    return flow || null;
  };

  SparkCore.prototype.resolveGuidedRuntimeActivity = function(step, plan) {
    var guidedPlan = plan && plan.context ? plan.context.guidedPlan : null;
    var blockActivities = guidedPlan && guidedPlan.blockActivities ? guidedPlan.blockActivities : null;
    var activity = null;
    if (!blockActivities) {
      return {
        guidedActivityId: null,
        guidedActivityKind: null,
        guidedBlockType: null
      };
    }
    if (step === "spark") activity = blockActivities.warm_engine || null;
    else if (step === "review" || step === "newMove") activity = blockActivities.drill || null;
    else if (step === "songSlice") activity = blockActivities.song || null;
    else if (step === "victoryLap") activity = blockActivities.cooldown || null;
    return {
      guidedActivityId: activity && activity.id ? activity.id : null,
      guidedActivityKind: activity && activity.kind ? activity.kind : null,
      guidedBlockType: activity && activity.block_type ? activity.block_type : null
    };
  };

  SparkCore.prototype.resolveGuidedRuntimeSegmentId = function(step, plan) {
    var guidedActivity = this.resolveGuidedRuntimeActivity(step, plan);
    var blockType = guidedActivity.guidedBlockType;
    var segments;
    var i;
    if (!plan || !Array.isArray(plan.segments) || !blockType) return null;
    segments = plan.segments;
    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].meta && segments[i].meta.guidedBlockType === blockType) {
        return segments[i].id;
      }
    }
    return null;
  };

  SparkCore.prototype.getNextGuidedStep = function(step) {
    var steps = ["spark", "review", "newMove", "songSlice", "victoryLap"];
    var idx = steps.indexOf(step);
    if (idx === -1) return steps[0];
    if (idx >= steps.length - 1) return null;
    return steps[idx + 1];
  };

  SparkCore.prototype.startSession = function(input) {
    input = input || {};
    if (!input.flow && input.mode) return this.startLegacyPracticeSession(input);
    var flow = input.flow || this.aiEngine.suggestNextFlow();
    var today = new Date().toISOString().slice(0, 10);
    // The cached plan is also keyed by the active instrument — switching
    // instruments invalidates yesterday's cache even on the same day, so a
    // bass user doesn't see ukulele segments. When currentInstrumentType is
    // null (e.g. tests without an InstrumentManager) the check is a no-op.
    var currentInstrumentType = this.instrumentManager && typeof this.instrumentManager.getActiveContext === "function"
      ? (this.instrumentManager.getActiveContext() || {}).instrumentType || null
      : null;
    var cacheInstrumentMatches = !currentInstrumentType
      || !this.currentPlan
      || !this.currentPlan.instrumentType
      || this.currentPlan.instrumentType === currentInstrumentType;
    if (!input.forceRebuild && flow === SparkSessionTypes.FLOW_DAILY_PRACTICE && this.currentPlan && this.currentPlan.generatedDate === today && cacheInstrumentMatches) {
      if (!this.currentStateMachine || this.currentStateMachine.sessionId !== this.currentPlan.id) {
        this.createSessionStateMachine(this.currentPlan);
      }
      this.updateRuntimeState({
        activeFlow: this.currentPlan.flow,
        activeInstrumentId: this.currentPlan.instrumentId || this.currentPlan.instrumentType || null,
        activeInstrumentType: this.runtimeState.activeInstrumentType,
        activePlanId: this.currentPlan.id,
        activeSegmentId: this.currentPlan.segments && this.currentPlan.segments.length ? this.currentPlan.segments[0].id : null,
        activeScreen: this.deriveRuntimeScreen(this.currentPlan.flow),
        activeTab: this.runtimeState.activeTab,
        guidedStep: this.currentPlan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION ? "spark" : null,
      guidedNewMovePhase: null,
      performanceChartId: this.runtimeState.performanceChartId,
      performanceSongData: this.runtimeState.performanceSongData,
      performanceSongIndex: this.runtimeState.performanceSongIndex,
      performanceSongTitle: this.runtimeState.performanceSongTitle,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceTargetTechnique: this.runtimeState.performanceTargetTechnique,
      performanceLoop: this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
      performanceResults: this.runtimeState.performanceResults,
      transport: { status: "ready", positionMs: 0 }
    });
      SparkProgressBridge.syncPlanToState(this.currentPlan);
      this.syncSessionRuntime({
        autoAdvance: this.currentPlan.flow !== SparkSessionTypes.FLOW_GUIDED_SESSION,
        scheduleTick: false,
        syncState: false
      });
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
    // Validate session plan contract
    if (plan && !plan.exercises) {
      // Legacy V1 plan — normalize it
      plan.exercises = (plan.segments || []).map(function(seg, i) {
        var exerciseId = seg.id || ("ex_" + i);
        return {
          id: exerciseId,
          type: _normalizeSegType(seg.type),
          difficulty: seg.difficulty || "normal",
          data: {
            core: {
              skill: (seg.meta && seg.meta.skill) || null,
              chords: (seg.meta && seg.meta.chords) || null,
              pattern: (seg.meta && seg.meta.pattern) || null,
              instrument: (seg.meta && seg.meta.instrument) || null,
              durationSec: seg.durationSec || 60
            },
            gameplay: {
              payload: (seg.meta && seg.meta.gameplayPayload) || null,
              preset: (seg.meta && seg.meta.enginePreset) || null,
              chartId: (seg.meta && seg.meta.chartId) || null
            }
          }
        };
      });
      plan.segments = (plan.segments || []).map(function(seg, i) {
        var exerciseId = seg.id || ("ex_" + i);
        return {
          id: seg.id || ("seg_" + i),
          type: _normalizeSegType(seg.type),
          label: seg.label || seg.type || "practice",
          desc: seg.desc || seg.description || "",
          durationSec: seg.durationSec || 60,
          completed: !!seg.completed,
          meta: seg.meta || {},
          exerciseIds: [exerciseId]
        };
      });
    }
    this.currentPlan = plan;
    this.createSessionStateMachine(plan);
    this.storage.setCurrentPlanId(plan.id);
    var guidedRuntimeActivity = plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION
      ? this.resolveGuidedRuntimeActivity("spark", plan)
      : { guidedActivityId: null, guidedActivityKind: null, guidedBlockType: null };
    this.updateRuntimeState({
      activeFlow: plan.flow,
      activeInstrumentId: plan.instrumentId || plan.instrumentType || null,
      activeInstrumentType: instrumentContext.instrumentType || null,
      activePlanId: plan.id,
      activeSegmentId: plan.segments && plan.segments.length ? plan.segments[0].id : null,
      activeScreen: this.deriveRuntimeScreen(plan.flow),
      activeTab: this.runtimeState.activeTab,
      guidedStep: plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION ? "spark" : null,
      guidedNewMovePhase: null,
      guidedActivityId: guidedRuntimeActivity.guidedActivityId,
      guidedActivityKind: guidedRuntimeActivity.guidedActivityKind,
      guidedBlockType: guidedRuntimeActivity.guidedBlockType,
      performanceChartId: null,
      performanceSongData: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.songData || null) : null,
      performanceSongIndex: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.songIndex != null ? plan.context.performanceSong.songIndex : null) : null,
      performanceSongTitle: plan.context && plan.context.performanceSong && plan.context.performanceSong.songData
        ? (plan.context.performanceSong.songData.title || null)
        : null,
      performanceDifficultyId: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.difficultyId || null) : null,
      performanceArrangementType: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.arrangementType || null) : null,
      performanceSpeed: null,
      performancePracticePreset: null,
      performanceLoop: null,
      performanceInputMode: null,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
      performanceResults: null,
      transport: { status: "ready", positionMs: 0 }
    });
    SparkProgressBridge.syncPlanToState(plan);
    this.syncSessionRuntime({
      autoAdvance: plan.flow !== SparkSessionTypes.FLOW_GUIDED_SESSION,
      scheduleTick: false,
      syncState: false
    });
    return plan;
  };

  SparkCore.prototype.startLegacyPracticeSession = function(input) {
    input = input || {};
    var instrumentContext = this.instrumentManager.getActiveContext();
    var plan = input.mode === "drill"
      ? this.sessionEngine.buildLegacyPracticeDrill({
        instrumentContext: instrumentContext,
        level: input.level,
        chordNames: input.chordNames
      })
      : this.sessionEngine.buildLegacyPracticeSession({
        instrumentContext: instrumentContext,
        level: input.level,
        mode: input.mode,
        chordName: input.chordName
      });
    var legacy = plan.context && plan.context.legacyPractice ? plan.context.legacyPractice : {};

    this.currentPlan = plan;
    this.createSessionStateMachine(plan);
    this.storage.setCurrentPlanId(plan.id);
    this.updateRuntimeState({
      activeFlow: plan.flow,
      activeInstrumentId: plan.instrumentId || plan.instrumentType || null,
      activeInstrumentType: instrumentContext.instrumentType || null,
      activePlanId: plan.id,
      activeSegmentId: plan.segments && plan.segments.length ? plan.segments[0].id : null,
      activeScreen: this.deriveRuntimeScreen(plan.flow),
      activeTab: "practice",
      legacyPracticeMode: legacy.mode || null,
      legacyPracticeChordName: Object.prototype.hasOwnProperty.call(legacy, "chordName") ? legacy.chordName : null,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: legacy.durationSec || null,
      legacyPracticeRemainingSec: legacy.durationSec || null,
      legacyDrillChordNames: this.cloneValue(legacy.chordNames || null),
      transport: { status: "ready", positionMs: 0 }
    });
    return plan;
  };

  SparkCore.prototype.openDailyPracticePlan = function(options) {
    options = options || {};
    return this.startSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      forceRebuild: !!options.forceRebuild
    });
  };

  SparkCore.prototype.openDashboardPracticePlan = function(options) {
    return this.openDailyPracticePlan(options || {});
  };

  SparkCore.prototype.openPracticePlanScreen = function(options) {
    var plan = this.openDashboardPracticePlan(options || {});
    this.updateRuntimeState({
      activeScreen: "practice_plan",
      activeTab: "practice"
    });
    return plan;
  };

  SparkCore.prototype.openLegacyPracticeSession = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_session",
      activeScreen: "session",
      activeTab: "practice",
      legacyPracticeMode: options.mode || "chord",
      legacyPracticeChordName: Object.prototype.hasOwnProperty.call(options, "chordName") ? options.chordName : null,
      legacyPracticeTimerActive: true,
      legacyPracticeDurationSec: durationSec,
      legacyPracticeRemainingSec: durationSec,
      legacyDrillChordNames: null,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyPracticeDrill = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_drill",
      activeScreen: "drill",
      activeTab: "practice",
      legacyPracticeMode: "drill",
      legacyPracticeChordName: null,
      legacyPracticeTimerActive: true,
      legacyPracticeDurationSec: durationSec,
      legacyPracticeRemainingSec: durationSec,
      legacyDrillChordNames: this.cloneValue(options.chordNames || null),
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyPracticeRuntimeState = function(action, options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_practice_session",
      activeScreen: runtimeState.activeScreen || "session",
      activeTab: runtimeState.activeTab || "practice",
      legacyPracticeMode: runtimeState.legacyPracticeMode || "chord",
      legacyPracticeChordName: runtimeState.legacyPracticeChordName,
      legacyPracticeTimerActive: !!runtimeState.legacyPracticeTimerActive,
      legacyPracticeDurationSec: runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: runtimeState.legacyPracticeRemainingSec,
      legacyFingerExerciseId: runtimeState.legacyFingerExerciseId,
      legacyFingerExerciseActive: !!runtimeState.legacyFingerExerciseActive,
      legacyFingerExerciseCount: runtimeState.legacyFingerExerciseCount || 0,
      legacyDrillChordNames: this.cloneValue(runtimeState.legacyDrillChordNames),
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "remainingSec")) next.legacyPracticeRemainingSec = options.remainingSec;
    if (Object.prototype.hasOwnProperty.call(options, "durationSec")) next.legacyPracticeDurationSec = options.durationSec;
    if (Object.prototype.hasOwnProperty.call(options, "timerActive")) next.legacyPracticeTimerActive = !!options.timerActive;
    if (Object.prototype.hasOwnProperty.call(options, "mode")) next.legacyPracticeMode = options.mode || next.legacyPracticeMode;
    if (Object.prototype.hasOwnProperty.call(options, "chordName")) next.legacyPracticeChordName = options.chordName;
    if (Object.prototype.hasOwnProperty.call(options, "chordNames")) next.legacyDrillChordNames = this.cloneValue(options.chordNames || null);
    if (Object.prototype.hasOwnProperty.call(options, "fingerExerciseId")) next.legacyFingerExerciseId = options.fingerExerciseId;
    if (Object.prototype.hasOwnProperty.call(options, "fingerExerciseActive")) next.legacyFingerExerciseActive = !!options.fingerExerciseActive;
    if (Object.prototype.hasOwnProperty.call(options, "fingerExerciseCount")) next.legacyFingerExerciseCount = options.fingerExerciseCount;

    if (action === "tick") {
      if (typeof next.legacyPracticeRemainingSec === "number") {
        next.legacyPracticeRemainingSec = Math.max(0, next.legacyPracticeRemainingSec);
      }
      next.legacyPracticeTimerActive = true;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "pause") {
      next.legacyPracticeTimerActive = false;
      next.transport = { status: "paused", positionMs: 0 };
    } else if (action === "resume") {
      next.legacyPracticeTimerActive = true;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "set_remaining") {
      next.transport = { status: next.legacyPracticeTimerActive ? "running" : "paused", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyPracticeSession = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_session",
      activeScreen: "complete",
      activeTab: "practice",
      legacyPracticeMode: options.mode || this.runtimeState.legacyPracticeMode || "chord",
      legacyPracticeChordName: Object.prototype.hasOwnProperty.call(options, "chordName") ? options.chordName : this.runtimeState.legacyPracticeChordName,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : this.runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: 0,
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.completeLegacyPracticeDrill = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_drill",
      activeScreen: "drill_done",
      activeTab: "practice",
      legacyPracticeMode: "drill",
      legacyPracticeChordName: null,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : this.runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: 0,
      legacyDrillChordNames: Object.prototype.hasOwnProperty.call(options, "chordNames")
        ? this.cloneValue(options.chordNames || null)
        : this.cloneValue(this.runtimeState.legacyDrillChordNames),
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.returnFromLegacyPracticeFamily = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: options.activeTab || "practice",
      legacyPracticeTimerActive: false,
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.repeatLegacyPracticeSession = function(options) {
    return this.openLegacyPracticeSession(options || {});
  };

  SparkCore.prototype.repeatLegacyPracticeDrill = function(options) {
    return this.openLegacyPracticeDrill(options || {});
  };

  SparkCore.prototype.openLegacyFingerExercise = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_finger_exercise",
      activeScreen: "home",
      activeTab: "practice",
      legacyPracticeMode: "finger_exercise",
      legacyPracticeTimerActive: true,
      legacyPracticeDurationSec: durationSec,
      legacyPracticeRemainingSec: durationSec,
      legacyFingerExerciseId: Object.prototype.hasOwnProperty.call(options, "exerciseId") ? options.exerciseId : null,
      legacyFingerExerciseActive: true,
      legacyFingerExerciseCount: Object.prototype.hasOwnProperty.call(options, "exerciseCount") ? options.exerciseCount : 0,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.completeLegacyFingerExercise = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_finger_exercise",
      activeScreen: "home",
      activeTab: "practice",
      legacyPracticeMode: "finger_exercise",
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec")
        ? options.durationSec
        : this.runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: 0,
      legacyFingerExerciseId: Object.prototype.hasOwnProperty.call(options, "exerciseId")
        ? options.exerciseId
        : this.runtimeState.legacyFingerExerciseId,
      legacyFingerExerciseActive: false,
      legacyFingerExerciseCount: Object.prototype.hasOwnProperty.call(options, "exerciseCount")
        ? options.exerciseCount
        : this.runtimeState.legacyFingerExerciseCount,
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyStrumPattern = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_strum_pattern",
      activeScreen: "strum",
      activeTab: "strum",
      legacyStrumPattern: Object.prototype.hasOwnProperty.call(options, "pattern")
        ? this.cloneValue(options.pattern)
        : null,
      legacyStrumActive: false,
      legacyStrumBeat: -1,
      transport: { status: "ready", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyStrumRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || "legacy_strum_pattern",
      activeScreen: this.runtimeState.activeScreen || "strum",
      activeTab: "strum",
      legacyStrumPattern: Object.prototype.hasOwnProperty.call(options, "pattern")
        ? this.cloneValue(options.pattern)
        : this.cloneValue(this.runtimeState.legacyStrumPattern),
      legacyStrumActive: Object.prototype.hasOwnProperty.call(options, "active")
        ? !!options.active
        : !!this.runtimeState.legacyStrumActive,
      legacyStrumBeat: Object.prototype.hasOwnProperty.call(options, "beat")
        ? options.beat
        : this.runtimeState.legacyStrumBeat,
      transport: {
        status: Object.prototype.hasOwnProperty.call(options, "active")
          ? (options.active ? "running" : "idle")
          : ((this.runtimeState.transport && this.runtimeState.transport.status) || "idle"),
        positionMs: 0
      }
    });
  };

  SparkCore.prototype.syncLegacyQuizRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || "legacy_quiz",
      activeScreen: this.runtimeState.activeScreen || "quiz",
      activeTab: "quiz",
      legacyQuizQuestion: Object.prototype.hasOwnProperty.call(options, "question")
        ? this.cloneValue(options.question)
        : this.cloneValue(this.runtimeState.legacyQuizQuestion),
      legacyQuizOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyQuizOptions || []),
      legacyQuizAnswer: Object.prototype.hasOwnProperty.call(options, "answer")
        ? options.answer
        : this.runtimeState.legacyQuizAnswer,
      legacyQuizScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : this.runtimeState.legacyQuizScore,
      legacyQuizTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : this.runtimeState.legacyQuizTotal,
      legacyQuizStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : this.runtimeState.legacyQuizStreak
    });
  };

  SparkCore.prototype.openLegacyQuiz = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_quiz",
      activeScreen: "quiz",
      activeTab: "quiz",
      legacyQuizQuestion: Object.prototype.hasOwnProperty.call(options, "question")
        ? this.cloneValue(options.question)
        : this.cloneValue(this.runtimeState.legacyQuizQuestion),
      legacyQuizOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyQuizOptions || []),
      legacyQuizAnswer: Object.prototype.hasOwnProperty.call(options, "answer")
        ? options.answer
        : null,
      legacyQuizScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : 0,
      legacyQuizTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : 0,
      legacyQuizStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : 0
    });
  };

  SparkCore.prototype.syncLegacyEarTrainingRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || "legacy_ear_training",
      activeScreen: this.runtimeState.activeScreen || "home",
      activeTab: "ear",
      legacyEarTrainQuestion: Object.prototype.hasOwnProperty.call(options, "question") ? options.question : this.runtimeState.legacyEarTrainQuestion,
      legacyEarTrainOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyEarTrainOptions || []),
      legacyEarTrainAnswer: Object.prototype.hasOwnProperty.call(options, "answer") ? options.answer : this.runtimeState.legacyEarTrainAnswer,
      legacyEarTrainScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : this.runtimeState.legacyEarTrainScore,
      legacyEarTrainTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : this.runtimeState.legacyEarTrainTotal,
      legacyEarTrainStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : this.runtimeState.legacyEarTrainStreak
    });
  };

  SparkCore.prototype.openLegacyEarTraining = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_ear_training",
      activeScreen: "home",
      activeTab: "ear",
      legacyEarTrainQuestion: Object.prototype.hasOwnProperty.call(options, "question")
        ? options.question
        : this.runtimeState.legacyEarTrainQuestion,
      legacyEarTrainOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyEarTrainOptions || []),
      legacyEarTrainAnswer: Object.prototype.hasOwnProperty.call(options, "answer")
        ? options.answer
        : null,
      legacyEarTrainScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : (this.runtimeState.legacyEarTrainScore || 0),
      legacyEarTrainTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : (this.runtimeState.legacyEarTrainTotal || 0),
      legacyEarTrainStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : (this.runtimeState.legacyEarTrainStreak || 0)
    });
  };

  SparkCore.prototype.openLegacyDailyChallenge = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "daily",
      activeTab: "daily",
      legacyDailyChallengeId: Object.prototype.hasOwnProperty.call(options, "challengeId") ? options.challengeId : null,
      legacyDailyTimerActive: true,
      legacyDailyDurationSec: durationSec,
      legacyDailyRemainingSec: durationSec,
      legacyDailyComplete: false,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyDailyRuntimeState = function(action, options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_daily_challenge",
      activeScreen: runtimeState.activeScreen || "daily",
      activeTab: runtimeState.activeTab || "daily",
      legacyDailyChallengeId: runtimeState.legacyDailyChallengeId,
      legacyDailyTimerActive: !!runtimeState.legacyDailyTimerActive,
      legacyDailyDurationSec: runtimeState.legacyDailyDurationSec,
      legacyDailyRemainingSec: runtimeState.legacyDailyRemainingSec,
      legacyDailyComplete: !!runtimeState.legacyDailyComplete,
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "challengeId")) next.legacyDailyChallengeId = options.challengeId;
    if (Object.prototype.hasOwnProperty.call(options, "remainingSec")) next.legacyDailyRemainingSec = options.remainingSec;
    if (Object.prototype.hasOwnProperty.call(options, "durationSec")) next.legacyDailyDurationSec = options.durationSec;
    if (Object.prototype.hasOwnProperty.call(options, "timerActive")) next.legacyDailyTimerActive = !!options.timerActive;
    if (Object.prototype.hasOwnProperty.call(options, "dailyComplete")) next.legacyDailyComplete = !!options.dailyComplete;

    if (action === "tick") {
      if (typeof next.legacyDailyRemainingSec === "number") {
        next.legacyDailyRemainingSec = Math.max(0, next.legacyDailyRemainingSec);
      }
      next.legacyDailyTimerActive = true;
      next.legacyDailyComplete = false;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "pause") {
      next.legacyDailyTimerActive = false;
      next.transport = { status: "paused", positionMs: 0 };
    } else if (action === "resume") {
      next.legacyDailyTimerActive = true;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "set_remaining") {
      next.transport = { status: next.legacyDailyTimerActive ? "running" : "paused", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyDailyChallenge = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "daily",
      activeTab: "daily",
      legacyDailyChallengeId: Object.prototype.hasOwnProperty.call(options, "challengeId") ? options.challengeId : this.runtimeState.legacyDailyChallengeId,
      legacyDailyTimerActive: false,
      legacyDailyDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : this.runtimeState.legacyDailyDurationSec,
      legacyDailyRemainingSec: 0,
      legacyDailyComplete: true,
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.returnFromLegacyDailyChallenge = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "home",
      activeTab: options.activeTab || "daily",
      legacyDailyTimerActive: false,
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyRunnerGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_runner_game",
      activeScreen: "home",
      activeTab: "runner",
      legacyRunnerActive: true,
      legacyRunnerTargetName: Object.prototype.hasOwnProperty.call(options, "targetName") ? options.targetName : null,
      legacyRunnerScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : 0,
      legacyRunnerCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : 0,
      legacyRunnerMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : 0,
      legacyRunnerLives: Object.prototype.hasOwnProperty.call(options, "lives") ? options.lives : 3,
      legacyRunnerDistance: Object.prototype.hasOwnProperty.call(options, "distance") ? options.distance : 0,
      legacyRunnerObstacles: this.cloneValue(options.obstacles || []),
      legacyRunnerResults: null,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyRunnerRuntimeState = function(options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_runner_game",
      activeScreen: runtimeState.activeScreen || "home",
      activeTab: runtimeState.activeTab || "runner",
      legacyRunnerActive: !!runtimeState.legacyRunnerActive,
      legacyRunnerTargetName: runtimeState.legacyRunnerTargetName,
      legacyRunnerScore: runtimeState.legacyRunnerScore || 0,
      legacyRunnerCombo: runtimeState.legacyRunnerCombo || 0,
      legacyRunnerMaxCombo: runtimeState.legacyRunnerMaxCombo || 0,
      legacyRunnerLives: runtimeState.legacyRunnerLives || 0,
      legacyRunnerDistance: runtimeState.legacyRunnerDistance || 0,
      legacyRunnerObstacles: this.cloneValue(runtimeState.legacyRunnerObstacles || []),
      legacyRunnerResults: this.cloneValue(runtimeState.legacyRunnerResults || null),
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "active")) next.legacyRunnerActive = !!options.active;
    if (Object.prototype.hasOwnProperty.call(options, "targetName")) next.legacyRunnerTargetName = options.targetName;
    if (Object.prototype.hasOwnProperty.call(options, "score")) next.legacyRunnerScore = options.score;
    if (Object.prototype.hasOwnProperty.call(options, "combo")) next.legacyRunnerCombo = options.combo;
    if (Object.prototype.hasOwnProperty.call(options, "maxCombo")) next.legacyRunnerMaxCombo = options.maxCombo;
    if (Object.prototype.hasOwnProperty.call(options, "lives")) next.legacyRunnerLives = options.lives;
    if (Object.prototype.hasOwnProperty.call(options, "distance")) next.legacyRunnerDistance = options.distance;
    if (Object.prototype.hasOwnProperty.call(options, "obstacles")) next.legacyRunnerObstacles = this.cloneValue(options.obstacles || []);
    if (Object.prototype.hasOwnProperty.call(options, "results")) next.legacyRunnerResults = this.cloneValue(options.results || null);

    next.transport = { status: next.legacyRunnerActive ? "running" : "idle", positionMs: 0 };
    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyRunnerGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_runner_game",
      activeScreen: "home",
      activeTab: "runner",
      legacyRunnerActive: false,
      legacyRunnerTargetName: Object.prototype.hasOwnProperty.call(options, "targetName") ? options.targetName : this.runtimeState.legacyRunnerTargetName,
      legacyRunnerScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : this.runtimeState.legacyRunnerScore,
      legacyRunnerCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : this.runtimeState.legacyRunnerCombo,
      legacyRunnerMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : this.runtimeState.legacyRunnerMaxCombo,
      legacyRunnerLives: Object.prototype.hasOwnProperty.call(options, "lives") ? options.lives : this.runtimeState.legacyRunnerLives,
      legacyRunnerDistance: Object.prototype.hasOwnProperty.call(options, "distance") ? options.distance : this.runtimeState.legacyRunnerDistance,
      legacyRunnerObstacles: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "obstacles") ? (options.obstacles || []) : (this.runtimeState.legacyRunnerObstacles || [])),
      legacyRunnerResults: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "results") ? (options.results || null) : null),
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyRhythmGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_rhythm_game",
      activeScreen: "home",
      activeTab: "rhythm",
      legacyRhythmActive: true,
      legacyRhythmBeats: this.cloneValue(options.beats || []),
      legacyRhythmScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : 0,
      legacyRhythmCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : 0,
      legacyRhythmMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : 0,
      legacyRhythmStartTimeMs: Object.prototype.hasOwnProperty.call(options, "startTimeMs") ? options.startTimeMs : 0,
      legacyRhythmResults: null,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyRhythmRuntimeState = function(options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_rhythm_game",
      activeScreen: runtimeState.activeScreen || "home",
      activeTab: runtimeState.activeTab || "rhythm",
      legacyRhythmActive: !!runtimeState.legacyRhythmActive,
      legacyRhythmBeats: this.cloneValue(runtimeState.legacyRhythmBeats || []),
      legacyRhythmScore: runtimeState.legacyRhythmScore || 0,
      legacyRhythmCombo: runtimeState.legacyRhythmCombo || 0,
      legacyRhythmMaxCombo: runtimeState.legacyRhythmMaxCombo || 0,
      legacyRhythmStartTimeMs: runtimeState.legacyRhythmStartTimeMs || 0,
      legacyRhythmResults: this.cloneValue(runtimeState.legacyRhythmResults || null),
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "active")) next.legacyRhythmActive = !!options.active;
    if (Object.prototype.hasOwnProperty.call(options, "beats")) next.legacyRhythmBeats = this.cloneValue(options.beats || []);
    if (Object.prototype.hasOwnProperty.call(options, "score")) next.legacyRhythmScore = options.score;
    if (Object.prototype.hasOwnProperty.call(options, "combo")) next.legacyRhythmCombo = options.combo;
    if (Object.prototype.hasOwnProperty.call(options, "maxCombo")) next.legacyRhythmMaxCombo = options.maxCombo;
    if (Object.prototype.hasOwnProperty.call(options, "startTimeMs")) next.legacyRhythmStartTimeMs = options.startTimeMs;
    if (Object.prototype.hasOwnProperty.call(options, "results")) next.legacyRhythmResults = this.cloneValue(options.results || null);

    next.transport = { status: next.legacyRhythmActive ? "running" : "idle", positionMs: 0 };
    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyRhythmGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_rhythm_game",
      activeScreen: "home",
      activeTab: "rhythm",
      legacyRhythmActive: false,
      legacyRhythmBeats: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "beats") ? (options.beats || []) : (this.runtimeState.legacyRhythmBeats || [])),
      legacyRhythmScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : this.runtimeState.legacyRhythmScore,
      legacyRhythmCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : this.runtimeState.legacyRhythmCombo,
      legacyRhythmMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : this.runtimeState.legacyRhythmMaxCombo,
      legacyRhythmStartTimeMs: Object.prototype.hasOwnProperty.call(options, "startTimeMs") ? options.startTimeMs : this.runtimeState.legacyRhythmStartTimeMs,
      legacyRhythmResults: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "results") ? (options.results || null) : null),
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncTunerRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      tunerActive: Object.prototype.hasOwnProperty.call(options, "active") ? !!options.active : this.runtimeState.tunerActive,
      tunerNote: Object.prototype.hasOwnProperty.call(options, "note") ? options.note : this.runtimeState.tunerNote,
      tunerFreq: Object.prototype.hasOwnProperty.call(options, "freq") ? options.freq : this.runtimeState.tunerFreq,
      tunerCents: Object.prototype.hasOwnProperty.call(options, "cents") ? options.cents : this.runtimeState.tunerCents,
      tunerError: Object.prototype.hasOwnProperty.call(options, "error") ? options.error : this.runtimeState.tunerError
    });
  };

  SparkCore.prototype.syncStemPlayerRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      stemPlaying: Object.prototype.hasOwnProperty.call(options, "playing") ? !!options.playing : this.runtimeState.stemPlaying,
      stemCurrentTime: Object.prototype.hasOwnProperty.call(options, "currentTime") ? options.currentTime : this.runtimeState.stemCurrentTime,
      stemDuration: Object.prototype.hasOwnProperty.call(options, "duration") ? options.duration : this.runtimeState.stemDuration
    });
  };

  SparkCore.prototype.syncAudioInputRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      audioInputDevices: Object.prototype.hasOwnProperty.call(options, "devices")
        ? this.cloneValue(options.devices || [])
        : this.cloneValue(this.runtimeState.audioInputDevices || []),
      audioInputId: Object.prototype.hasOwnProperty.call(options, "inputId") ? options.inputId : this.runtimeState.audioInputId,
      audioTestingId: Object.prototype.hasOwnProperty.call(options, "testingId") ? options.testingId : this.runtimeState.audioTestingId,
      audioTestLevel: Object.prototype.hasOwnProperty.call(options, "testLevel") ? options.testLevel : this.runtimeState.audioTestLevel
    });
  };

  SparkCore.prototype.syncMetronomeRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      metronomeActive: Object.prototype.hasOwnProperty.call(options, "active") ? !!options.active : this.runtimeState.metronomeActive,
      metronomeBpm: Object.prototype.hasOwnProperty.call(options, "bpm") ? options.bpm : this.runtimeState.metronomeBpm,
      metronomeBeat: Object.prototype.hasOwnProperty.call(options, "beat") ? options.beat : this.runtimeState.metronomeBeat,
      metronomeBeatsPerBar: Object.prototype.hasOwnProperty.call(options, "beatsPerBar") ? options.beatsPerBar : this.runtimeState.metronomeBeatsPerBar
    });
  };

  SparkCore.prototype.syncChordDetectRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      chordDetectActive: Object.prototype.hasOwnProperty.call(options, "active") ? !!options.active : this.runtimeState.chordDetectActive,
      chordDetectNotes: Object.prototype.hasOwnProperty.call(options, "notes")
        ? this.cloneValue(options.notes || [])
        : this.cloneValue(this.runtimeState.chordDetectNotes || []),
      chordDetectMatch: Object.prototype.hasOwnProperty.call(options, "match") ? options.match : this.runtimeState.chordDetectMatch,
      chordDetectError: Object.prototype.hasOwnProperty.call(options, "error") ? options.error : this.runtimeState.chordDetectError
    });
  };

  SparkCore.prototype.completeDailyPracticePlan = function(options) {
    options = options || {};
    return this.completeSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      markPlanComplete: true,
      itemId: Object.prototype.hasOwnProperty.call(options, "itemId") ? options.itemId : undefined
    });
  };

  SparkCore.prototype.openGuidedSession = function(options) {
    options = options || {};
    return this.startSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      sessionNum: Object.prototype.hasOwnProperty.call(options, "sessionNum") ? options.sessionNum : undefined
    });
  };

  SparkCore.prototype.buildSongSessionRequest = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    var songData = Object.prototype.hasOwnProperty.call(options, "songData")
      ? this.cloneValue(options.songData)
      : this.cloneValue(runtimeState.songSessionData);
    return {
      songData: songData,
      source: Object.prototype.hasOwnProperty.call(options, "source")
        ? options.source
        : (runtimeState.songSessionSource || "builtin"),
      songPlaying: Object.prototype.hasOwnProperty.call(options, "songPlaying")
        ? !!options.songPlaying
        : false,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat")
        ? Math.max(0, Math.round(options.songBeat || 0))
        : 0,
      targetScreen: Object.prototype.hasOwnProperty.call(options, "targetScreen")
        ? options.targetScreen
        : "song"
    };
  };

  SparkCore.prototype.openSongSession = function(options) {
    var request = this.buildSongSessionRequest(options);
    this.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: request.targetScreen,
      activeTab: "songs",
      songSessionData: request.songData,
      songSessionSource: request.source,
      songPlaying: !!request.songPlaying,
      songBeat: request.songBeat,
      transport: {
        status: request.songPlaying ? "running" : "ready",
        positionMs: 0
      }
    });
    return request;
  };

  SparkCore.prototype.syncSongRuntimeState = function(action, options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "song_session",
      activeScreen: runtimeState.activeScreen || "song",
      activeTab: runtimeState.activeTab || "songs",
      songSessionData: this.cloneValue(runtimeState.songSessionData),
      songSessionSource: runtimeState.songSessionSource || "builtin",
      songPlaying: !!runtimeState.songPlaying,
      songBeat: runtimeState.songBeat || 0,
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "songData")) {
      next.songSessionData = this.cloneValue(options.songData);
    }
    if (Object.prototype.hasOwnProperty.call(options, "source")) {
      next.songSessionSource = options.source || next.songSessionSource;
    }
    if (Object.prototype.hasOwnProperty.call(options, "songPlaying")) {
      next.songPlaying = !!options.songPlaying;
    }
    if (Object.prototype.hasOwnProperty.call(options, "songBeat")) {
      next.songBeat = Math.max(0, Math.round(options.songBeat || 0));
    }
    if (Object.prototype.hasOwnProperty.call(options, "targetScreen")) {
      next.activeScreen = options.targetScreen || next.activeScreen;
    }

    if (action === "play") {
      next.songPlaying = true;
      next.songBeat = Object.prototype.hasOwnProperty.call(options, "songBeat") ? next.songBeat : 0;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "pause") {
      next.songPlaying = false;
      next.transport = { status: "ready", positionMs: 0 };
    } else if (action === "tick") {
      next.transport = { status: next.songPlaying ? "running" : "ready", positionMs: 0 };
    } else if (action === "complete") {
      next.songPlaying = false;
      next.activeScreen = "song_done";
      next.transport = { status: "completed", positionMs: 0 };
    } else if (action === "open_song") {
      next.songPlaying = false;
      next.songBeat = Object.prototype.hasOwnProperty.call(options, "songBeat") ? next.songBeat : 0;
      next.activeScreen = options.targetScreen || "song";
      next.transport = { status: "ready", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.buildSongNavigationRequest = function(target, options) {
    var runtimeState = this.getRuntimeState();
    var request = {
      target: target || "songs_home",
      activeFlow: runtimeState.activeFlow || "song_session",
      activeScreen: runtimeState.activeScreen || "song",
      activeTab: "songs",
      songPlaying: false,
      songBeat: runtimeState.songBeat || 0,
      transport: { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (request.target === "songs_home") {
      request.activeScreen = "home";
    } else if (request.target === "song_detail") {
      request.activeScreen = "song";
      request.transport.status = runtimeState.songPlaying ? "running" : "ready";
      request.songPlaying = !!runtimeState.songPlaying;
    } else if (request.target === "song_done") {
      request.activeScreen = "song_done";
      request.transport.status = "completed";
    }

    if (Object.prototype.hasOwnProperty.call(options, "songBeat")) {
      request.songBeat = Math.max(0, Math.round(options.songBeat || 0));
    }

    return request;
  };

  SparkCore.prototype.applySongNavigationRequest = function(target, options) {
    var request = this.buildSongNavigationRequest(target, options);
    return this.updateRuntimeState({
      activeFlow: request.activeFlow,
      activeScreen: request.activeScreen,
      activeTab: request.activeTab,
      songPlaying: request.songPlaying,
      songBeat: request.songBeat,
      transport: request.transport
    });
  };

  SparkCore.prototype.completeSongSession = function(options) {
    options = options || {};
    this.syncSongRuntimeState("complete", {
      songData: Object.prototype.hasOwnProperty.call(options, "songData") ? options.songData : this.runtimeState.songSessionData,
      source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : this.runtimeState.songSessionSource,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat") ? options.songBeat : this.runtimeState.songBeat
    });
    return this.buildSongNavigationRequest("song_done", options);
  };

  SparkCore.prototype.buildSongBrowserRequest = function(action, options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      action: action || "songs_subtab",
      songsSubTab: Object.prototype.hasOwnProperty.call(options, "songsSubTab")
        ? options.songsSubTab
        : runtimeState.songsSubTab,
      songFilter: Object.prototype.hasOwnProperty.call(options, "songFilter")
        ? options.songFilter
        : runtimeState.songFilter,
      songSort: Object.prototype.hasOwnProperty.call(options, "songSort")
        ? options.songSort
        : runtimeState.songSort,
      songSortAsc: Object.prototype.hasOwnProperty.call(options, "songSortAsc")
        ? !!options.songSortAsc
        : runtimeState.songSortAsc,
      communityTab: Object.prototype.hasOwnProperty.call(options, "communityTab")
        ? options.communityTab
        : runtimeState.communityTab,
      communitySearch: Object.prototype.hasOwnProperty.call(options, "communitySearch")
        ? options.communitySearch
        : runtimeState.communitySearch,
      communitySort: Object.prototype.hasOwnProperty.call(options, "communitySort")
        ? options.communitySort
        : runtimeState.communitySort
    };
  };

  SparkCore.prototype.applySongBrowserRequest = function(action, options) {
    var request = this.buildSongBrowserRequest(action, options);
    return this.updateRuntimeState({
      activeTab: "songs",
      songsSubTab: request.songsSubTab,
      songFilter: request.songFilter,
      songSort: request.songSort,
      songSortAsc: request.songSortAsc,
      communityTab: request.communityTab,
      communitySearch: request.communitySearch,
      communitySort: request.communitySort
    });
  };

  SparkCore.prototype.buildDashboardRequest = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      recommendations: Object.prototype.hasOwnProperty.call(options, "recommendations")
        ? this.cloneValue(options.recommendations)
        : this.cloneValue(runtimeState.dashboardRecommendations || []),
      insights: Object.prototype.hasOwnProperty.call(options, "insights")
        ? this.cloneValue(options.insights)
        : this.cloneValue(runtimeState.dashboardInsights),
      challenges: Object.prototype.hasOwnProperty.call(options, "challenges")
        ? this.cloneValue(options.challenges)
        : this.cloneValue(runtimeState.dashboardChallenges || []),
      refreshedAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt")
        ? options.refreshedAt
        : Date.now()
    };
  };

  SparkCore.prototype.applyDashboardRequest = function(options) {
    var request = this.buildDashboardRequest(options);
    return this.updateRuntimeState({
      dashboardRecommendations: request.recommendations || [],
      dashboardInsights: request.insights || null,
      dashboardChallenges: request.challenges || [],
      lastDashboardRefreshAt: request.refreshedAt || null
    });
  };

  SparkCore.prototype.refreshDashboardSnapshot = function(options) {
    return this.applyDashboardRequest(options || {});
  };

  SparkCore.prototype.initializeDashboardChallenges = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return this.applyDashboardRequest({
      recommendations: Object.prototype.hasOwnProperty.call(options, "recommendations")
        ? options.recommendations
        : (runtimeState.dashboardRecommendations || []),
      insights: Object.prototype.hasOwnProperty.call(options, "insights")
        ? options.insights
        : (runtimeState.dashboardInsights || null),
      challenges: Object.prototype.hasOwnProperty.call(options, "challenges")
        ? options.challenges
        : (runtimeState.dashboardChallenges || []),
      refreshedAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt")
        ? options.refreshedAt
        : Date.now()
    });
  };

  SparkCore.prototype.buildDashboardNavigationRequest = function(target) {
    var request = {
      target: target || "home_dash",
      activeScreen: "home_dash",
      activeTab: this.runtimeState.activeTab || null
    };

    if (request.target === "dashboard_back") request.activeScreen = "home_dash";
    else if (request.target === "recommendations") request.activeScreen = "recommendations";
    else if (request.target === "insights") request.activeScreen = "insights";
    else if (request.target === "challenges") request.activeScreen = "challenges";
    else if (request.target === "career") request.activeScreen = "career";
    else request.activeScreen = "home_dash";

    return request;
  };

  SparkCore.prototype.applyDashboardNavigationRequest = function(target) {
    var request = this.buildDashboardNavigationRequest(target);
    return this.updateRuntimeState({
      activeScreen: request.activeScreen,
      activeTab: request.activeTab
    });
  };

  SparkCore.prototype.openDashboardSection = function(target) {
    return this.applyDashboardNavigationRequest(target || "home_dash");
  };

  SparkCore.prototype.returnFromHomeFamily = function(options) {
    options = options || {};
    var currentScreen = options.currentScreen || this.runtimeState.activeScreen || "home";
    var isDashboardFamily = currentScreen === "recommendations"
      || currentScreen === "insights"
      || currentScreen === "challenges"
      || currentScreen === "career"
      || currentScreen === "home_dash";
    if (isDashboardFamily) {
      return this.applyDashboardNavigationRequest("dashboard_back");
    }
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: this.runtimeState.activeTab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.openUtilityScreen = function(target) {
    var activeScreen = "home";
    if (target === "settings") activeScreen = "settings";
    else if (target === "curriculum") activeScreen = "curriculum";
    else if (target === "cloud_settings") activeScreen = "cloud_settings";
    else if (target === "midi_settings") activeScreen = "midi_settings";
    else if (target === "midi_import") activeScreen = "midi_import";
    return this.updateRuntimeState({
      activeScreen: activeScreen,
      activeTab: this.runtimeState.activeTab || null
    });
  };

  SparkCore.prototype.syncSettingsState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      settingsTheme: Object.prototype.hasOwnProperty.call(options, "theme")
        ? options.theme
        : this.runtimeState.settingsTheme
    });
  };

  SparkCore.prototype.syncMidiSettingsState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      midiEnabled: Object.prototype.hasOwnProperty.call(options, "midiEnabled")
        ? !!options.midiEnabled
        : this.runtimeState.midiEnabled,
      midiActiveDeviceId: Object.prototype.hasOwnProperty.call(options, "activeDeviceId")
        ? options.activeDeviceId
        : this.runtimeState.midiActiveDeviceId,
      midiActiveDeviceName: Object.prototype.hasOwnProperty.call(options, "activeDeviceName")
        ? options.activeDeviceName
        : this.runtimeState.midiActiveDeviceName,
      midiActiveProfileId: Object.prototype.hasOwnProperty.call(options, "activeProfileId")
        ? options.activeProfileId
        : this.runtimeState.midiActiveProfileId,
      midiActiveProfileName: Object.prototype.hasOwnProperty.call(options, "activeProfileName")
        ? options.activeProfileName
        : this.runtimeState.midiActiveProfileName,
      midiDeviceOptions: Object.prototype.hasOwnProperty.call(options, "deviceOptions")
        ? this.cloneValue(options.deviceOptions || [])
        : this.cloneValue(this.runtimeState.midiDeviceOptions || []),
      midiProfileOptions: Object.prototype.hasOwnProperty.call(options, "profileOptions")
        ? this.cloneValue(options.profileOptions || [])
        : this.cloneValue(this.runtimeState.midiProfileOptions || [])
    });
  };

  SparkCore.prototype.syncMidiImportState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      midiImportSummary: Object.prototype.hasOwnProperty.call(options, "summary")
        ? this.cloneValue(options.summary || null)
        : this.cloneValue(this.runtimeState.midiImportSummary),
      midiImportAssignments: Object.prototype.hasOwnProperty.call(options, "assignments")
        ? this.cloneValue(options.assignments || {})
        : this.cloneValue(this.runtimeState.midiImportAssignments || {}),
      midiImportSeedMode: Object.prototype.hasOwnProperty.call(options, "seedMode")
        ? options.seedMode
        : this.runtimeState.midiImportSeedMode,
      midiImportSeedTitle: Object.prototype.hasOwnProperty.call(options, "seedTitle")
        ? options.seedTitle
        : this.runtimeState.midiImportSeedTitle
    });
  };

  SparkCore.prototype.syncCloudSettingsState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      cloudLoggedIn: Object.prototype.hasOwnProperty.call(options, "loggedIn")
        ? !!options.loggedIn
        : this.runtimeState.cloudLoggedIn,
      cloudEmail: Object.prototype.hasOwnProperty.call(options, "email")
        ? options.email
        : this.runtimeState.cloudEmail,
      cloudLastSyncStatus: Object.prototype.hasOwnProperty.call(options, "lastSyncStatus")
        ? options.lastSyncStatus
        : this.runtimeState.cloudLastSyncStatus,
      cloudLastSyncAt: Object.prototype.hasOwnProperty.call(options, "lastSyncAt")
        ? options.lastSyncAt
        : this.runtimeState.cloudLastSyncAt
    });
  };

  SparkCore.prototype.openCloudSettings = function(options) {
    options = options || {};
    this.openUtilityScreen("cloud_settings");
    return this.syncCloudSettingsState(options);
  };

  SparkCore.prototype.applyCloudWorkflowRequest = function(action, options) {
    options = options || {};
    if (action === "open") {
      return this.openCloudSettings(options);
    }
    if (action === "login" || action === "logout") {
      return this.syncCloudSettingsState(options);
    }
    if (action === "sync_start" || action === "pull_start") {
      return this.syncCloudSettingsState({
        loggedIn: Object.prototype.hasOwnProperty.call(options, "loggedIn") ? options.loggedIn : this.runtimeState.cloudLoggedIn,
        email: Object.prototype.hasOwnProperty.call(options, "email") ? options.email : this.runtimeState.cloudEmail,
        lastSyncStatus: options.lastSyncStatus || "syncing",
        lastSyncAt: Object.prototype.hasOwnProperty.call(options, "lastSyncAt") ? options.lastSyncAt : this.runtimeState.cloudLastSyncAt
      });
    }
    if (action === "sync_done" || action === "pull_done" || action === "sync_error" || action === "pull_error") {
      return this.syncCloudSettingsState(options);
    }
    return this.syncCloudSettingsState(options);
  };

  SparkCore.prototype.syncCurriculumState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      curriculumSummaries: Object.prototype.hasOwnProperty.call(options, "curriculums")
        ? this.cloneValue(options.curriculums || [])
        : this.cloneValue(this.runtimeState.curriculumSummaries || []),
      curriculumPackSummaries: Object.prototype.hasOwnProperty.call(options, "packs")
        ? this.cloneValue(options.packs || [])
        : this.cloneValue(this.runtimeState.curriculumPackSummaries || [])
    });
  };

  SparkCore.prototype.applyCurriculumWorkflowRequest = function(action, options) {
    options = options || {};
    if (action === "curriculum_load_start") {
      return this.updateRuntimeState({
        curriculumLoading: true,
        curriculumLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.curriculumLastManifestPath,
        curriculumLastLoadStatus: "loading"
      });
    }
    if (action === "curriculum_load_done" || action === "curriculum_load_error") {
      return this.updateRuntimeState({
        curriculumLoading: false,
        curriculumLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.curriculumLastManifestPath,
        curriculumLastLoadStatus: options.status || (action === "curriculum_load_done" ? "ok" : "error")
      });
    }
    if (action === "content_load_start") {
      return this.updateRuntimeState({
        contentLoading: true,
        contentLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.contentLastManifestPath,
        contentLastLoadStatus: "loading"
      });
    }
    if (action === "content_load_done" || action === "content_load_error") {
      return this.updateRuntimeState({
        contentLoading: false,
        contentLastManifestPath: Object.prototype.hasOwnProperty.call(options, "manifestPath")
          ? options.manifestPath
          : this.runtimeState.contentLastManifestPath,
        contentLastLoadStatus: options.status || (action === "content_load_done" ? "ok" : "error")
      });
    }
    return this.updateRuntimeState({});
  };

  SparkCore.prototype.openSkillTree = function() {
    return this.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: this.runtimeState.activeTab || null,
      skillTreeFocus: this.runtimeState.skillTreeFocus || "overview"
    });
  };

  SparkCore.prototype.setSkillTreeFocus = function(focus) {
    return this.updateRuntimeState({
      activeScreen: this.runtimeState.activeScreen || "skill_tree",
      activeTab: this.runtimeState.activeTab || null,
      skillTreeFocus: focus || "overview"
    });
  };

  SparkCore.prototype.openStemPlayer = function() {
    return this.updateRuntimeState({
      activeScreen: "stems",
      activeTab: "songs",
      songsSubTab: "stems"
    });
  };

  SparkCore.prototype.closeStemPlayer = function() {
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: "songs",
      songsSubTab: "stems",
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.returnFromUtilityFamily = function(options) {
    options = options || {};
    var currentScreen = options.currentScreen || this.runtimeState.activeScreen || "home";
    var isUtilityFamily = currentScreen === "settings"
      || currentScreen === "curriculum"
      || currentScreen === "cloud_settings"
      || currentScreen === "midi_settings"
      || currentScreen === "midi_import";
    if (isUtilityFamily) {
      return this.updateRuntimeState({
        activeScreen: "home",
        activeTab: this.runtimeState.activeTab || null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    return this.getRuntimeState();
  };

  SparkCore.prototype.getDashboardRecommendationById = function(id) {
    var arr = this.runtimeState.dashboardRecommendations || [];
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === id) return this.cloneValue(arr[i]);
    }
    return null;
  };

  SparkCore.prototype.buildDashboardRecommendationLaunchRequest = function(id) {
    return {
      recommendationId: id || null,
      recommendation: id ? this.getDashboardRecommendationById(id) : null
    };
  };

  SparkCore.prototype.launchDashboardRecommendation = function(id) {
    var request = this.buildDashboardRecommendationLaunchRequest(id);
    if (request.recommendation) {
      this.updateRuntimeState({
        activeScreen: "recommendations",
        lastDashboardRecommendationId: request.recommendationId
      });
    }
    return request;
  };

  SparkCore.prototype.applyDashboardChallengeReward = function(challengeId) {
    var arr = this.cloneValue(this.runtimeState.dashboardChallenges || []);
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === challengeId) {
        arr[i].claimed = true;
        break;
      }
    }
    return this.updateRuntimeState({
      dashboardChallenges: arr
    });
  };

  SparkCore.prototype.completeGuidedSession = function(options) {
    options = options || {};
    var activeSegmentId = Object.prototype.hasOwnProperty.call(options, "itemId")
      ? options.itemId
      : (this.runtimeState.activeSegmentId || this.resolveGuidedRuntimeSegmentId(this.runtimeState.guidedStep, this.currentPlan));
    var result = this.completeSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      itemId: activeSegmentId || undefined,
      markPlanComplete: true
    });
    this.applyGuidedNavigationRequest("guided_done");
    return result;
  };

  SparkCore.prototype.advanceGuidedSession = function(options) {
    options = options || {};
    var currentStep = options.currentStep || this.runtimeState.guidedStep || "spark";
    var nextStep = Object.prototype.hasOwnProperty.call(options, "nextStep")
      ? options.nextStep
      : this.getNextGuidedStep(currentStep);
    var nextPhase = Object.prototype.hasOwnProperty.call(options, "guidedNewMovePhase")
      ? options.guidedNewMovePhase
      : this.runtimeState.guidedNewMovePhase;
    var currentActivity = this.resolveGuidedRuntimeActivity(currentStep, this.currentPlan);
    var nextActivity = this.resolveGuidedRuntimeActivity(nextStep, this.currentPlan);
    var currentSegmentId = this.resolveGuidedRuntimeSegmentId(currentStep, this.currentPlan) || this.runtimeState.activeSegmentId;
    var shouldCompleteCurrentBlock = !!(
      this.currentPlan
      && this.currentPlan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION
      && currentSegmentId
      && currentActivity.guidedBlockType
      && nextActivity.guidedBlockType
      && currentActivity.guidedBlockType !== nextActivity.guidedBlockType
    );
    var completion = null;
    var runtimeState;

    if (!nextStep) {
      completion = this.completeGuidedSession();
      return {
        runtimeState: this.getRuntimeState(),
        completion: completion
      };
    }

    if (shouldCompleteCurrentBlock) {
      completion = this.completeSession({
        flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
        itemId: currentSegmentId
      });
      if (completion && completion.planCompleted) {
        this.applyGuidedNavigationRequest("guided_done");
        return {
          runtimeState: this.getRuntimeState(),
          completion: completion
        };
      }
    }

    runtimeState = this.syncGuidedRuntimeState({
      guidedStep: nextStep,
      guidedNewMovePhase: nextPhase,
      transport: shouldCompleteCurrentBlock
        ? { status: "running", positionMs: 0 }
        : this.runtimeState.transport
    });
    this.syncSessionRuntime({
      autoAdvance: false,
      scheduleTick: nextStep !== currentStep,
      syncState: false
    });

    return {
      runtimeState: runtimeState,
      completion: completion
    };
  };

  SparkCore.prototype.skipGuidedBlock = function(options) {
    options = options || {};
    var currentStep = options.currentStep || this.runtimeState.guidedStep || "spark";
    var targetStep = null;
    if (currentStep === "spark") targetStep = "review";
    else if (currentStep === "review" || currentStep === "newMove") targetStep = "songSlice";
    else if (currentStep === "songSlice") targetStep = "victoryLap";
    else if (currentStep === "victoryLap") {
      return {
        runtimeState: this.completeGuidedSession(options)
      };
    }
    if (!targetStep) {
      return {
        runtimeState: this.getRuntimeState(),
        completion: null
      };
    }
    return this.advanceGuidedSession({
      currentStep: currentStep,
      nextStep: targetStep,
      guidedNewMovePhase: null
    });
  };

  SparkCore.prototype.extendGuidedBlock = function(options) {
    options = options || {};
    var extensionSec = Math.max(60, Math.round(options.extensionSec || 300));
    var currentStep = options.currentStep || this.runtimeState.guidedStep || "spark";
    var segmentId = options.itemId
      || this.runtimeState.activeSegmentId
      || this.resolveGuidedRuntimeSegmentId(currentStep, this.currentPlan);
    var segments;
    var context;
    var guidedPlan;
    var blockActivities;
    var activity;
    var runtimeState;
    var i;

    if (!this.currentPlan || this.currentPlan.flow !== SparkSessionTypes.FLOW_GUIDED_SESSION || currentStep !== "victoryLap" || !segmentId) {
      return {
        runtimeState: this.getRuntimeState(),
        extended: false
      };
    }

    segments = Array.isArray(this.currentPlan.segments) ? this.currentPlan.segments : [];
    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === segmentId) {
        if (!segments[i].meta || typeof segments[i].meta !== "object") segments[i].meta = {};
        segments[i].meta.guidedExtensionSec = Math.max(0, Math.round(segments[i].meta.guidedExtensionSec || 0)) + extensionSec;
        segments[i].meta.guidedExtensionCount = Math.max(0, Math.round(segments[i].meta.guidedExtensionCount || 0)) + 1;
        segments[i].durationSec = Math.max(0, Math.round(segments[i].durationSec || 0)) + extensionSec;
        break;
      }
    }

    context = this.currentPlan.context || {};
    context.guidedShellExtensionSec = Math.max(0, Math.round(context.guidedShellExtensionSec || 0)) + extensionSec;
    context.guidedShellExtensionCount = Math.max(0, Math.round(context.guidedShellExtensionCount || 0)) + 1;
    context.guidedShellDurationSec = Math.max(0, Math.round(context.guidedShellDurationSec || 0)) + extensionSec;
    guidedPlan = context.guidedPlan || null;
    blockActivities = guidedPlan && guidedPlan.blockActivities ? guidedPlan.blockActivities : null;
    activity = blockActivities && blockActivities.cooldown ? blockActivities.cooldown : null;
    if (activity) {
      activity.duration_sec = Math.max(0, Math.round(activity.duration_sec || 0)) + extensionSec;
    }

    runtimeState = this.syncGuidedRuntimeState({
      guidedStep: "victoryLap",
      guidedNewMovePhase: null,
      transport: {
        status: "running",
        positionMs: 0
      }
    });
    this.syncSessionRuntime({
      autoAdvance: false,
      scheduleTick: true,
      syncState: false
    });

    return {
      runtimeState: runtimeState,
      extended: true,
      extensionSec: extensionSec
    };
  };

  SparkCore.prototype.completeSession = function(payload) {
    var sessionStates = this.getSessionStates();
    payload = payload || {};
    if (!this.currentPlan || (payload.sessionId && this.currentPlan.id !== payload.sessionId)) {
      this.startSession({ flow: payload.flow || SparkSessionTypes.FLOW_DAILY_PRACTICE });
    }

    this.assertCanCompleteSession();
    this.ensureCompletionFlowState({
      itemId: payload.itemId || null,
      flow: payload.flow || (this.currentPlan ? this.currentPlan.flow : null)
    });

    var result = this.progressEngine.completeSession(this.currentPlan, payload);
    var performance = payload.gameplayResult || payload.result || null;
    var nextRecommendedSkill = this.curriculumEngine && typeof this.curriculumEngine.peekNextSkill === "function"
      ? this.curriculumEngine.peekNextSkill({
          session: this.currentPlan,
          instrumentType: this.currentPlan ? this.currentPlan.instrumentType : null
        })
      : null;
    if (this.aiEngine && typeof this.aiEngine.generateCoachingNote === "function") {
      result.coaching = this.aiEngine.generateCoachingNote({
        session: this.currentPlan,
        performance: performance,
        mastery: result.mastery || null,
        nextRecommendedSkill: nextRecommendedSkill
      });
    }
    this.lastSessionOutcome = result;
    this.transitionSessionState(result.planCompleted ? sessionStates.COMPLETED : sessionStates.SEGMENT_COMPLETE, {
      reason: result.planCompleted ? "session_completed" : "segment_completed",
      itemId: payload.itemId || null
    });
    this.updateRuntimeState({
      activeFlow: this.currentPlan ? this.currentPlan.flow : (payload.flow || null),
      activeInstrumentId: this.currentPlan && (this.currentPlan.instrumentId || this.currentPlan.instrumentType)
        ? (this.currentPlan.instrumentId || this.currentPlan.instrumentType)
        : this.runtimeState.activeInstrumentId,
      activeInstrumentType: this.runtimeState.activeInstrumentType,
      activePlanId: this.currentPlan ? this.currentPlan.id : this.runtimeState.activePlanId,
      activeSegmentId: payload.itemId || this.runtimeState.activeSegmentId,
      activeScreen: this.currentPlan ? this.deriveRuntimeScreen(this.currentPlan.flow) : this.runtimeState.activeScreen,
      activeTab: this.runtimeState.activeTab,
      guidedStep: result.planCompleted ? null : this.runtimeState.guidedStep,
      guidedNewMovePhase: result.planCompleted ? null : this.runtimeState.guidedNewMovePhase,
      guidedActivityId: result.planCompleted ? null : this.runtimeState.guidedActivityId,
      guidedActivityKind: result.planCompleted ? null : this.runtimeState.guidedActivityKind,
      guidedBlockType: result.planCompleted ? null : this.runtimeState.guidedBlockType,
      performanceChartId: result.planCompleted ? this.runtimeState.performanceChartId : this.runtimeState.performanceChartId,
      performanceSongData: this.runtimeState.performanceSongData,
      performanceSongIndex: this.runtimeState.performanceSongIndex,
      performanceSongTitle: this.runtimeState.performanceSongTitle,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceLoop: result.planCompleted ? null : this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
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
    var segment = null;
    var exercise = null;
    var runtime = this.getSessionRuntimeHandle();
    var segments;
    var i;
    if (runtime && typeof runtime.getActiveSession === "function" && runtime.getActiveSession() === this.currentPlan) {
      if (typeof runtime.getActiveSegment === "function") segment = runtime.getActiveSegment();
      if (typeof runtime.getActiveExercise === "function") exercise = runtime.getActiveExercise();
    }
    if (!segment && this.currentPlan && Array.isArray(this.currentPlan.segments)) {
      segments = this.currentPlan.segments;
      for (i = 0; i < segments.length; i++) {
        if (segments[i] && segments[i].id === this.runtimeState.activeSegmentId) {
          segment = segments[i];
          break;
        }
      }
    }
    if (!exercise && segment && Array.isArray(segment.exerciseIds) && Array.isArray(this.currentPlan && this.currentPlan.exercises)) {
      for (i = 0; i < this.currentPlan.exercises.length; i++) {
        if (this.currentPlan.exercises[i] && this.currentPlan.exercises[i].id === segment.exerciseIds[0]) {
          exercise = this.currentPlan.exercises[i];
          break;
        }
      }
    }
    return {
      plan: this.currentPlan,
      activeSegment: segment,
      activeExercise: exercise,
      stateMachine: this.getSessionStateMachineSnapshot(),
      runtimeState: this.getRuntimeState(),
      lastSessionOutcome: this.getLastSessionOutcome()
    };
  };

  SparkCore.prototype.syncSessionRuntime = function(options) {
    var runtime = this.getSessionRuntimeHandle();
    var view;
    var runtimeState;
    options = options || {};
    if (!runtime || typeof runtime.attachSession !== "function" || !this.currentPlan) return false;
    view = this.getActiveSessionView();
    runtimeState = view && view.runtimeState ? view.runtimeState : this.runtimeState;
    runtime.attachSession(this.currentPlan, {
      segmentId: Object.prototype.hasOwnProperty.call(options, "segmentId")
        ? options.segmentId
        : (runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null),
      status: Object.prototype.hasOwnProperty.call(options, "status")
        ? options.status
        : ((runtimeState && runtimeState.transport && runtimeState.transport.status) || "ready"),
      positionMs: Object.prototype.hasOwnProperty.call(options, "positionMs")
        ? options.positionMs
        : ((runtimeState && runtimeState.transport && runtimeState.transport.positionMs) || 0),
      autoAdvance: !!options.autoAdvance,
      scheduleTick: options.scheduleTick !== false,
      syncState: options.syncState === true
    });
    return true;
  };

  SparkCore.prototype.getPerformanceEditorDocumentView = function() {
    var runtimeState = this.getRuntimeState();
    return {
      chart: this.cloneValue(this.performanceEditorDocument),
      library: this.cloneValue(this.performanceEditorLibrary),
      chartId: runtimeState.performanceEditorChartId,
      title: runtimeState.performanceEditorChartTitle,
      source: runtimeState.performanceEditorSource,
      dirty: !!runtimeState.performanceEditorDirty,
      mode: runtimeState.performanceEditorMode,
      snap: runtimeState.performanceEditorSnap,
      bpm: runtimeState.performanceEditorBpm,
      eventCount: runtimeState.performanceEditorEventCount,
      phraseCount: runtimeState.performanceEditorPhraseCount,
      selectedEvent: {
        id: runtimeState.performanceEditorSelectedEventId,
        label: runtimeState.performanceEditorSelectedEventLabel,
        time: runtimeState.performanceEditorSelectedEventTime,
        duration: runtimeState.performanceEditorSelectedEventDuration
      },
      selectedPhrase: {
        id: runtimeState.performanceEditorSelectedPhraseId,
        name: runtimeState.performanceEditorSelectedPhraseName,
        start: runtimeState.performanceEditorSelectedPhraseStart,
        end: runtimeState.performanceEditorSelectedPhraseEnd
      }
    };
  };

  SparkCore.prototype.buildPerformanceEditorDocumentState = function(chart, options) {
    var runtimeState = this.getRuntimeState();
    var payload = {};
    var events = chart && Array.isArray(chart.events) ? chart.events : [];
    var phrases = chart && Array.isArray(chart.phrases) ? chart.phrases : [];
    var selectedEventId;
    var selectedPhraseId;
    var selectedEvent = null;
    var selectedPhrase = null;
    var i;

    options = options || {};

    payload.mode = Object.prototype.hasOwnProperty.call(options, "mode")
      ? options.mode
      : runtimeState.performanceEditorMode;
    payload.snap = Object.prototype.hasOwnProperty.call(options, "snap")
      ? options.snap
      : runtimeState.performanceEditorSnap;
    payload.chartId = chart && Object.prototype.hasOwnProperty.call(chart, "id")
      ? chart.id
      : null;
    payload.chartTitle = chart && Object.prototype.hasOwnProperty.call(chart, "title")
      ? chart.title
      : null;
    payload.source = Object.prototype.hasOwnProperty.call(options, "source")
      ? options.source
      : (chart ? "existing" : "blank");
    payload.dirty = Object.prototype.hasOwnProperty.call(options, "dirty")
      ? !!options.dirty
      : !!runtimeState.performanceEditorDirty;
    payload.bpm = Object.prototype.hasOwnProperty.call(options, "bpm")
      ? options.bpm
      : (chart && Object.prototype.hasOwnProperty.call(chart, "bpm") ? chart.bpm : null);
    payload.eventCount = Object.prototype.hasOwnProperty.call(options, "eventCount")
      ? options.eventCount
      : events.length;
    payload.phraseCount = Object.prototype.hasOwnProperty.call(options, "phraseCount")
      ? options.phraseCount
      : phrases.length;

    selectedEventId = Object.prototype.hasOwnProperty.call(options, "selectedEventId")
      ? options.selectedEventId
      : runtimeState.performanceEditorSelectedEventId;
    if (Object.prototype.hasOwnProperty.call(options, "selectedEvent")) {
      selectedEvent = options.selectedEvent;
    } else if (selectedEventId != null) {
      for (i = 0; i < events.length; i++) {
        if (events[i] && events[i].id === selectedEventId) {
          selectedEvent = events[i];
          break;
        }
      }
    }
    payload.selectedEventId = selectedEventId != null ? selectedEventId : null;
    payload.selectedEventLabel = Object.prototype.hasOwnProperty.call(options, "selectedEventLabel")
      ? options.selectedEventLabel
      : (selectedEvent ? (selectedEvent.laneLabel || selectedEvent.chord || selectedEvent.note || "?") : null);
    payload.selectedEventTime = Object.prototype.hasOwnProperty.call(options, "selectedEventTime")
      ? options.selectedEventTime
      : (selectedEvent ? (selectedEvent.t || 0) : null);
    payload.selectedEventDuration = Object.prototype.hasOwnProperty.call(options, "selectedEventDuration")
      ? options.selectedEventDuration
      : (selectedEvent ? (selectedEvent.dur || 0) : null);

    selectedPhraseId = Object.prototype.hasOwnProperty.call(options, "selectedPhraseId")
      ? options.selectedPhraseId
      : runtimeState.performanceEditorSelectedPhraseId;
    if (Object.prototype.hasOwnProperty.call(options, "selectedPhrase")) {
      selectedPhrase = options.selectedPhrase;
    } else if (selectedPhraseId != null) {
      for (i = 0; i < phrases.length; i++) {
        if (phrases[i] && phrases[i].id === selectedPhraseId) {
          selectedPhrase = phrases[i];
          break;
        }
      }
    }
    payload.selectedPhraseId = selectedPhraseId != null ? selectedPhraseId : null;
    payload.selectedPhraseName = Object.prototype.hasOwnProperty.call(options, "selectedPhraseName")
      ? options.selectedPhraseName
      : (selectedPhrase ? selectedPhrase.name : null);
    payload.selectedPhraseStart = Object.prototype.hasOwnProperty.call(options, "selectedPhraseStart")
      ? options.selectedPhraseStart
      : (selectedPhrase ? selectedPhrase.startSec : null);
    payload.selectedPhraseEnd = Object.prototype.hasOwnProperty.call(options, "selectedPhraseEnd")
      ? options.selectedPhraseEnd
      : (selectedPhrase ? selectedPhrase.endSec : null);

    return payload;
  };

  SparkCore.prototype.syncPerformanceEditorDocument = function(chart, options) {
    var action;
    options = options || {};
    this.performanceEditorDocument = chart ? this.cloneValue(chart) : null;
    action = options.action || (this.runtimeState.activeScreen === "performance_editor" ? "configure_editor" : "open_editor");
    return this.syncPerformanceRuntimeState(action, this.buildPerformanceEditorDocumentState(chart, options));
  };

  SparkCore.prototype.applyPerformanceEditorMutation = function(action, payload) {
    var chart = this.performanceEditorDocument ? this.cloneValue(this.performanceEditorDocument) : null;
    var library = this.cloneValue(this.performanceEditorLibrary) || [];
    var i;
    var phrases;
    var events;
    var maxId;
    var lastEnd;
    var lastT;
    var beatDur;
    var libraryIndex;
    var result = {
      chart: chart,
      library: library,
      selectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      selectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId
    };

    payload = payload || {};

    if (action === "new_blank") {
      chart = {
        id: "custom_" + Date.now(),
        title: "New Chart",
        artist: "Custom",
        bpm: 90,
        beatsPerBar: 4,
        arrangementType: payload.mode || this.runtimeState.performanceEditorMode || "chords",
        events: [],
        phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }]
      };
      result.chart = chart;
      result.selectedEventId = null;
      result.selectedPhraseId = null;
      return result;
    }

    if (action === "save_to_library") {
      if (!chart) return result;
      libraryIndex = -1;
      for (i = 0; i < library.length; i++) {
        if (library[i] && library[i].id === chart.id) {
          libraryIndex = i;
          break;
        }
      }
      if (libraryIndex >= 0) library[libraryIndex] = this.cloneValue(chart);
      else library.push(this.cloneValue(chart));
      this.performanceEditorLibrary = library;
      result.library = this.cloneValue(library);
      return result;
    }

    if (action === "load_from_library") {
      libraryIndex = payload.index;
      if (library[libraryIndex]) {
        chart = this.cloneValue(library[libraryIndex]);
        result.chart = chart;
        result.library = this.cloneValue(library);
        result.selectedEventId = null;
        result.selectedPhraseId = null;
      }
      return result;
    }

    if (action === "delete_from_library") {
      libraryIndex = payload.index;
      if (library[libraryIndex]) {
        library.splice(libraryIndex, 1);
        this.performanceEditorLibrary = library;
        result.library = this.cloneValue(library);
      }
      return result;
    }

    if (!chart) return result;

    if (action === "set_title") {
      chart.title = payload.title;
    } else if (action === "set_bpm") {
      chart.bpm = payload.bpm;
    } else if (action === "add_phrase") {
      phrases = Array.isArray(chart.phrases) ? chart.phrases : [];
      lastEnd = phrases.length ? phrases[phrases.length - 1].endSec : 0;
      phrases.push({
        id: phrases.length,
        name: "Phrase " + (phrases.length + 1),
        startSec: lastEnd,
        endSec: lastEnd + 8
      });
      chart.phrases = phrases;
      result.selectedPhraseId = phrases[phrases.length - 1].id;
    } else if (action === "update_phrase") {
      phrases = Array.isArray(chart.phrases) ? chart.phrases : [];
      for (i = 0; i < phrases.length; i++) {
        if (phrases[i].id === payload.id) {
          if (payload.prop === "name") phrases[i].name = payload.val;
          if (payload.prop === "startSec") phrases[i].startSec = parseFloat(payload.val) || 0;
          if (payload.prop === "endSec") phrases[i].endSec = parseFloat(payload.val) || 0;
          result.selectedPhraseId = phrases[i].id;
          break;
        }
      }
    } else if (action === "delete_phrase") {
      phrases = Array.isArray(chart.phrases) ? chart.phrases : [];
      chart.phrases = phrases.filter(function(phrase) { return phrase.id !== payload.id; });
      result.selectedPhraseId = null;
    } else if (action === "select_phrase") {
      result.selectedPhraseId = payload.id;
    } else if (action === "add_event") {
      events = Array.isArray(chart.events) ? chart.events : [];
      maxId = 0;
      for (i = 0; i < events.length; i++) {
        if (events[i].id > maxId) maxId = events[i].id;
      }
      lastT = events.length ? events[events.length - 1].t + events[events.length - 1].dur : 0;
      beatDur = 60 / (chart.bpm || 90);
      events.push({
        id: maxId + 1,
        t: lastT,
        dur: beatDur,
        type: (payload.mode || this.runtimeState.performanceEditorMode) === "lead" ? "note" : "chord",
        chord: "",
        laneLabel: "?",
        notes: [],
        strum: "down"
      });
      chart.events = events;
    } else if (action === "select_event") {
      result.selectedEventId = payload.id;
    } else if (action === "update_event") {
      events = Array.isArray(chart.events) ? chart.events : [];
      for (i = 0; i < events.length; i++) {
        if (events[i].id === payload.id) {
          if (payload.prop === "label") {
            events[i].laneLabel = payload.val;
            events[i].chord = payload.val;
          }
          if (payload.prop === "t") events[i].t = parseFloat(payload.val) || 0;
          if (payload.prop === "dur") events[i].dur = parseFloat(payload.val) || 0;
          result.selectedEventId = events[i].id;
          break;
        }
      }
      chart.events = events;
    } else if (action === "delete_event") {
      events = Array.isArray(chart.events) ? chart.events : [];
      chart.events = events.filter(function(event) { return event.id !== payload.id; });
      result.selectedEventId = null;
    }

    result.chart = chart;
    return result;
  };

  SparkCore.prototype.getPerformanceEditorExportData = function() {
    var chart = this.performanceEditorDocument ? this.cloneValue(this.performanceEditorDocument) : null;
    var title = chart && chart.title ? chart.title : "chart";
    return {
      chart: chart,
      json: chart ? JSON.stringify(chart, null, 2) : "",
      fileName: String(title).replace(/\s+/g, "_") + ".json"
    };
  };

  SparkCore.prototype.getPerformanceEditorPreviewChart = function() {
    return this.performanceEditorDocument ? this.cloneValue(this.performanceEditorDocument) : null;
  };

  SparkCore.prototype.getPerformanceEditorPreviewRequest = function() {
    var chart = this.getPerformanceEditorPreviewChart();
    var runtimeState = this.getRuntimeState();
    return {
      chart: chart,
      chartId: chart && chart.id ? chart.id : "generated",
      arrangementType: chart && chart.arrangementType
        ? chart.arrangementType
        : (runtimeState.performanceArrangementType || runtimeState.performanceEditorMode || "chords"),
      difficulty: runtimeState.performanceDifficultyId || "normal",
      speed: runtimeState.performanceSpeed || 1,
      mode: runtimeState.performanceInputMode || "midi",
      preset: runtimeState.performancePracticePreset || null
    };
  };

  SparkCore.prototype.startPerformanceEditorPreview = function() {
    var request = this.getPerformanceEditorPreviewRequest();
    if (!request.chart || !request.chart.events || !request.chart.events.length) return null;
    this.syncPerformanceRuntimeState("start", {
      chartId: request.chartId,
      difficulty: request.difficulty,
      arrangementType: request.arrangementType,
      speed: request.speed,
      mode: request.mode,
      preset: request.preset,
      countIn: false
    });
    return request;
  };

  SparkCore.prototype.openPerformanceStats = function(options) {
    options = options || {};
    var request = {
      focus: Object.prototype.hasOwnProperty.call(options, "focus")
        ? options.focus
        : "overview"
    };
    this.syncPerformanceRuntimeState("open_stats", request);
    return request;
  };

  SparkCore.prototype.openPerformanceEditor = function(chart, options) {
    options = options || {};
    var request = {
      action: options.action || "open_editor",
      source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : "blank",
      dirty: Object.prototype.hasOwnProperty.call(options, "dirty") ? !!options.dirty : false,
      mode: Object.prototype.hasOwnProperty.call(options, "mode")
        ? options.mode
        : (this.runtimeState.performanceEditorMode || "chords"),
      snap: Object.prototype.hasOwnProperty.call(options, "snap")
        ? options.snap
        : (this.runtimeState.performanceEditorSnap || "1/8"),
      selectedEventId: Object.prototype.hasOwnProperty.call(options, "selectedEventId")
        ? options.selectedEventId
        : null,
      selectedPhraseId: Object.prototype.hasOwnProperty.call(options, "selectedPhraseId")
        ? options.selectedPhraseId
        : null
    };
    this.syncPerformanceEditorDocument(chart || null, request);
    return request;
  };

  SparkCore.prototype.openPerformanceCalibration = function(options) {
    return this.applyPerformanceCalibrationRequest("open_calibration", options || {});
  };

  SparkCore.prototype.openPerformanceSongSelection = function(options) {
    options = options || {};
    var request = {
      songId: Object.prototype.hasOwnProperty.call(options, "songId") ? options.songId : null,
      songData: Object.prototype.hasOwnProperty.call(options, "songData") ? this.cloneValue(options.songData) : null,
      songIndex: Object.prototype.hasOwnProperty.call(options, "songIndex") ? options.songIndex : null,
      songTitle: Object.prototype.hasOwnProperty.call(options, "songTitle") ? options.songTitle : null,
      targetTechnique: Object.prototype.hasOwnProperty.call(options, "targetTechnique") ? options.targetTechnique : null,
      arrangementType: Object.prototype.hasOwnProperty.call(options, "arrangementType")
        ? options.arrangementType
        : (this.runtimeState.performanceArrangementType || "chords"),
      difficultyId: Object.prototype.hasOwnProperty.call(options, "difficultyId")
        ? options.difficultyId
        : (this.runtimeState.performanceDifficultyId || "normal")
    };
    if (!request.songId && request.songData && request.songData.title) {
      request.songId = String(request.songData.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }
    if (!request.songTitle && request.songData && request.songData.title) {
      request.songTitle = request.songData.title;
    }
    if (request.songId) {
      this.startSession({
        flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
        songIndex: request.songIndex,
        songId: request.songId,
        arrangementType: request.arrangementType,
        difficultyId: request.difficultyId
      });
    }
    this.syncPerformanceRuntimeState("select_song", {
      chartId: request.songId,
      songData: request.songData,
      songIndex: request.songIndex,
      songTitle: request.songTitle,
      targetTechnique: request.targetTechnique,
      arrangementType: request.arrangementType,
      difficulty: request.difficultyId
    });
    return request;
  };

  SparkCore.prototype.openCareerSongSelection = function(options) {
    return this.openPerformanceSongSelection(options || {});
  };

  SparkCore.prototype.openPerformanceDailyChallenge = function(options) {
    options = options || {};
    if (options.songData || options.songId) {
      return this.openPerformanceSongSelection(options);
    }
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: "songs",
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncPerformanceDailyChallengeState = function(challenge, isComplete) {
    return this.updateRuntimeState({
      performanceDailyChallenge: challenge ? this.cloneValue(challenge) : null,
      performanceDailyComplete: !!isComplete
    });
  };

  SparkCore.prototype.buildPerformanceStartRequest = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      chart: Object.prototype.hasOwnProperty.call(options, "chart") ? options.chart : null,
      chartId: Object.prototype.hasOwnProperty.call(options, "chartId")
        ? options.chartId
        : (runtimeState.performanceChartId || "generated"),
      arrangementType: Object.prototype.hasOwnProperty.call(options, "arrangementType")
        ? options.arrangementType
        : (runtimeState.performanceArrangementType || "chords"),
      difficulty: Object.prototype.hasOwnProperty.call(options, "difficulty")
        ? options.difficulty
        : (runtimeState.performanceDifficultyId || "normal"),
      speed: Object.prototype.hasOwnProperty.call(options, "speed")
        ? options.speed
        : (runtimeState.performanceSpeed || 1),
      mode: Object.prototype.hasOwnProperty.call(options, "mode")
        ? options.mode
        : (runtimeState.performanceInputMode || "midi"),
      preset: Object.prototype.hasOwnProperty.call(options, "preset")
        ? options.preset
        : (runtimeState.performancePracticePreset || null),
      countIn: Object.prototype.hasOwnProperty.call(options, "countIn")
        ? !!options.countIn
        : false,
      songIndex: Object.prototype.hasOwnProperty.call(options, "songIndex")
        ? options.songIndex
        : runtimeState.performanceSongIndex,
      songTitle: Object.prototype.hasOwnProperty.call(options, "songTitle")
        ? options.songTitle
        : runtimeState.performanceSongTitle,
      targetTechnique: Object.prototype.hasOwnProperty.call(options, "targetTechnique")
        ? options.targetTechnique
        : (runtimeState.performanceTargetTechnique || null),
      targetPhraseIndex: Object.prototype.hasOwnProperty.call(options, "targetPhraseIndex")
        ? options.targetPhraseIndex
        : null
    };
  };

  SparkCore.prototype.startPerformanceRetrySession = function(options) {
    var request = this.buildPerformanceStartRequest(options);
    this.syncPerformanceRuntimeState("start", {
      chartId: request.chartId,
      difficulty: request.difficulty,
      arrangementType: request.arrangementType,
      speed: request.speed,
      mode: request.mode,
      preset: request.preset,
      countIn: request.countIn,
      songIndex: request.songIndex,
      songTitle: request.songTitle,
      targetTechnique: request.targetTechnique
    });
    return request;
  };

  SparkCore.prototype.startSelectedPerformanceSong = function(options) {
    var request = this.buildPerformanceStartRequest(options);
    this.syncPerformanceRuntimeState("start", {
      chartId: request.chartId,
      difficulty: request.difficulty,
      arrangementType: request.arrangementType,
      speed: request.speed,
      mode: request.mode,
      preset: request.preset,
      countIn: request.countIn,
      songIndex: request.songIndex,
      songTitle: request.songTitle,
      targetTechnique: request.targetTechnique
    });
    return request;
  };

  SparkCore.prototype.buildPerformanceCalibrationRequest = function(action, options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      action: action || "open_calibration",
      source: Object.prototype.hasOwnProperty.call(options, "source")
        ? options.source
        : (runtimeState.performanceCalibrationSource || "midi"),
      globalOffsetMs: Object.prototype.hasOwnProperty.call(options, "globalOffsetMs")
        ? options.globalOffsetMs
        : (runtimeState.performanceTimingOffsetMs || 0),
      midiOffsetMs: Object.prototype.hasOwnProperty.call(options, "midiOffsetMs")
        ? options.midiOffsetMs
        : (runtimeState.performanceMidiOffsetMs || 0),
      micOffsetMs: Object.prototype.hasOwnProperty.call(options, "micOffsetMs")
        ? options.micOffsetMs
        : (runtimeState.performanceMicOffsetMs || 0),
      appliedOffsetMs: Object.prototype.hasOwnProperty.call(options, "appliedOffsetMs")
        ? options.appliedOffsetMs
        : null
    };
  };

  SparkCore.prototype.applyPerformanceCalibrationRequest = function(action, options) {
    var request = this.buildPerformanceCalibrationRequest(action, options);
    this.syncPerformanceRuntimeState(request.action, request);
    return request;
  };

  SparkCore.prototype.buildPerformanceCompletionRequest = function(options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    return {
      flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
      markPlanComplete: true,
      performanceResults: Object.prototype.hasOwnProperty.call(options, "performanceResults")
        ? options.performanceResults
        : (runtimeState.performanceResults || null),
      xpAwarded: Object.prototype.hasOwnProperty.call(options, "xpAwarded")
        ? options.xpAwarded
        : 0,
      chartId: Object.prototype.hasOwnProperty.call(options, "chartId")
        ? options.chartId
        : (runtimeState.performanceChartId || null),
      arrangementType: Object.prototype.hasOwnProperty.call(options, "arrangementType")
        ? options.arrangementType
        : (runtimeState.performanceArrangementType || null),
      difficultyId: Object.prototype.hasOwnProperty.call(options, "difficultyId")
        ? options.difficultyId
        : (runtimeState.performanceDifficultyId || null),
      songIndex: Object.prototype.hasOwnProperty.call(options, "songIndex")
        ? options.songIndex
        : runtimeState.performanceSongIndex,
      songTitle: Object.prototype.hasOwnProperty.call(options, "songTitle")
        ? options.songTitle
        : runtimeState.performanceSongTitle
    };
  };

  SparkCore.prototype.buildPerformanceNavigationRequest = function(target, options) {
    var runtimeState = this.getRuntimeState();
    options = options || {};
    var request = {
      target: target || "songs_home",
      activeFlow: runtimeState.activeFlow || SparkSessionTypes.FLOW_PERFORMANCE_SONG,
      activeScreen: runtimeState.activeScreen,
      activeTab: runtimeState.activeTab || "songs",
      transport: { status: "idle", positionMs: 0 },
      performanceCalibrationMode: false
    };

    if (request.target === "return_after_stop") {
      if (runtimeState.performanceChartId || runtimeState.performanceSongTitle || runtimeState.performanceSongIndex != null) {
        request.target = "song_detail";
      } else {
        request.target = "songs_home";
      }
    }

    if (request.target === "songs_home") {
      request.activeScreen = "home";
      request.activeTab = "songs";
    } else if (request.target === "song_detail") {
      request.activeScreen = "performance_song";
      request.activeTab = "songs";
    } else if (request.target === "stats") {
      request.activeScreen = "performance_stats";
      request.activeTab = "songs";
    } else if (request.target === "calibration") {
      request.activeScreen = "perform_calibration";
      request.activeTab = "songs";
    }

    if (Object.prototype.hasOwnProperty.call(options, "positionMs")) {
      request.transport.positionMs = Math.max(0, Math.round(options.positionMs || 0));
    }
    if (Object.prototype.hasOwnProperty.call(options, "status")) {
      request.transport.status = options.status || "idle";
    }
    if (Object.prototype.hasOwnProperty.call(options, "performanceCalibrationMode")) {
      request.performanceCalibrationMode = !!options.performanceCalibrationMode;
    }
    return request;
  };

  SparkCore.prototype.applyPerformanceNavigationRequest = function(target, options) {
    var request = this.buildPerformanceNavigationRequest(target, options);
    return this.updateRuntimeState({
      activeFlow: request.activeFlow,
      activeScreen: request.activeScreen,
      activeTab: request.activeTab,
      performanceCalibrationMode: request.performanceCalibrationMode,
      transport: request.transport
    });
  };

  SparkCore.prototype.syncGuidedRuntimeState = function(patch) {
    patch = patch || {};
    var nextGuidedStep = Object.prototype.hasOwnProperty.call(patch, "guidedStep")
      ? patch.guidedStep
      : this.runtimeState.guidedStep;
    var guidedActivity = this.resolveGuidedRuntimeActivity(nextGuidedStep, this.currentPlan);
    var guidedSegmentId = this.resolveGuidedRuntimeSegmentId(nextGuidedStep, this.currentPlan);
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_GUIDED_SESSION,
      activeScreen: patch.activeScreen || this.runtimeState.activeScreen || "guided_session",
      activeSegmentId: Object.prototype.hasOwnProperty.call(patch, "activeSegmentId")
        ? patch.activeSegmentId
        : (guidedSegmentId || this.runtimeState.activeSegmentId),
      guidedStep: nextGuidedStep,
      guidedNewMovePhase: Object.prototype.hasOwnProperty.call(patch, "guidedNewMovePhase")
        ? patch.guidedNewMovePhase
        : this.runtimeState.guidedNewMovePhase,
      guidedActivityId: Object.prototype.hasOwnProperty.call(patch, "guidedActivityId")
        ? patch.guidedActivityId
        : guidedActivity.guidedActivityId,
      guidedActivityKind: Object.prototype.hasOwnProperty.call(patch, "guidedActivityKind")
        ? patch.guidedActivityKind
        : guidedActivity.guidedActivityKind,
      guidedBlockType: Object.prototype.hasOwnProperty.call(patch, "guidedBlockType")
        ? patch.guidedBlockType
        : guidedActivity.guidedBlockType,
      transport: patch.transport || this.runtimeState.transport
    });
  };

  SparkCore.prototype.buildGuidedNavigationRequest = function(target, options) {
    options = options || {};
    var request = {
      target: target || "guided_home",
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_GUIDED_SESSION,
      activeScreen: this.runtimeState.activeScreen || "guided_session",
      activeTab: this.runtimeState.activeTab || "practice",
      activeSegmentId: this.runtimeState.activeSegmentId,
      guidedStep: this.runtimeState.guidedStep,
      guidedNewMovePhase: this.runtimeState.guidedNewMovePhase,
      guidedActivityId: this.runtimeState.guidedActivityId,
      guidedActivityKind: this.runtimeState.guidedActivityKind,
      guidedBlockType: this.runtimeState.guidedBlockType,
      transport: { status: "idle", positionMs: 0 }
    };

    if (request.target === "guided_home") {
      request.activeScreen = "home";
      request.activeTab = "practice";
      request.activeSegmentId = null;
      request.guidedStep = null;
      request.guidedNewMovePhase = null;
      request.guidedActivityId = null;
      request.guidedActivityKind = null;
      request.guidedBlockType = null;
    } else if (request.target === "guided_done") {
      request.activeScreen = "guided_done";
      request.activeSegmentId = null;
      request.guidedStep = null;
      request.guidedNewMovePhase = null;
      request.guidedActivityId = null;
      request.guidedActivityKind = null;
      request.guidedBlockType = null;
      request.transport.status = "completed";
    }

    if (Object.prototype.hasOwnProperty.call(options, "positionMs")) {
      request.transport.positionMs = Math.max(0, Math.round(options.positionMs || 0));
    }
    if (Object.prototype.hasOwnProperty.call(options, "status")) {
      request.transport.status = options.status || request.transport.status;
    }
    return request;
  };

  SparkCore.prototype.applyGuidedNavigationRequest = function(target, options) {
    var request = this.buildGuidedNavigationRequest(target, options);
    return this.updateRuntimeState({
      activeFlow: request.activeFlow,
      activeScreen: request.activeScreen,
      activeTab: request.activeTab,
      activeSegmentId: request.activeSegmentId,
      guidedStep: request.guidedStep,
      guidedNewMovePhase: request.guidedNewMovePhase,
      guidedActivityId: request.guidedActivityId,
      guidedActivityKind: request.guidedActivityKind,
      guidedBlockType: request.guidedBlockType,
      transport: request.transport
    });
  };

  SparkCore.prototype.syncPerformanceRuntimeState = function(action, payload) {
    payload = payload || {};
    var next = {
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_PERFORMANCE_SONG,
      activeScreen: this.runtimeState.activeScreen,
      performanceChartId: this.runtimeState.performanceChartId,
      performanceSongIndex: this.runtimeState.performanceSongIndex,
      performanceSongTitle: this.runtimeState.performanceSongTitle,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceLoop: this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: this.runtimeState.performanceCalibrationMode,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
      performanceResults: this.runtimeState.performanceResults,
      transport: this.runtimeState.transport
    };

    if (action === "start") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "perform";
      next.performanceChartId = payload.chartId || this.runtimeState.performanceChartId;
      next.performanceSongData = Object.prototype.hasOwnProperty.call(payload, "songData")
        ? this.cloneValue(payload.songData)
        : this.runtimeState.performanceSongData;
      next.performanceSongIndex = Object.prototype.hasOwnProperty.call(payload, "songIndex")
        ? payload.songIndex
        : this.runtimeState.performanceSongIndex;
      next.performanceSongTitle = Object.prototype.hasOwnProperty.call(payload, "songTitle")
        ? payload.songTitle
        : this.runtimeState.performanceSongTitle;
      next.performanceDifficultyId = payload.difficulty || this.runtimeState.performanceDifficultyId;
      next.performanceArrangementType = payload.arrangementType || this.runtimeState.performanceArrangementType;
      next.performanceSpeed = payload.speed || this.runtimeState.performanceSpeed || 1;
      next.performancePracticePreset = payload.preset || this.runtimeState.performancePracticePreset;
      if (Object.prototype.hasOwnProperty.call(payload, "targetTechnique")) next.performanceTargetTechnique = payload.targetTechnique;
      next.performanceLoop = null;
      next.performanceInputMode = payload.mode || this.runtimeState.performanceInputMode;
      next.performanceCalibrationMode = false;
      next.performanceResults = null;
      next.transport = { status: payload.countIn ? "count_in" : "running", positionMs: 0 };
    } else if (action === "select_song") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "performance_song";
      if (Object.prototype.hasOwnProperty.call(payload, "chartId")) next.performanceChartId = payload.chartId;
      if (Object.prototype.hasOwnProperty.call(payload, "songData")) next.performanceSongData = this.cloneValue(payload.songData);
      if (Object.prototype.hasOwnProperty.call(payload, "songIndex")) next.performanceSongIndex = payload.songIndex;
      if (Object.prototype.hasOwnProperty.call(payload, "songTitle")) next.performanceSongTitle = payload.songTitle;
      if (Object.prototype.hasOwnProperty.call(payload, "targetTechnique")) next.performanceTargetTechnique = payload.targetTechnique;
      if (Object.prototype.hasOwnProperty.call(payload, "difficulty")) next.performanceDifficultyId = payload.difficulty;
      if (Object.prototype.hasOwnProperty.call(payload, "arrangementType")) next.performanceArrangementType = payload.arrangementType;
      next.performanceCalibrationMode = false;
      next.performanceResults = null;
      next.transport = { status: "ready", positionMs: 0 };
    } else if (action === "open_stats") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "performance_stats";
      if (Object.prototype.hasOwnProperty.call(payload, "focus")) next.performanceStatsFocus = payload.focus;
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "configure_stats") {
      next.activeScreen = this.runtimeState.activeScreen || "performance_stats";
      if (Object.prototype.hasOwnProperty.call(payload, "focus")) next.performanceStatsFocus = payload.focus;
    } else if (action === "open_editor") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "performance_editor";
      if (Object.prototype.hasOwnProperty.call(payload, "mode")) next.performanceEditorMode = payload.mode;
      if (Object.prototype.hasOwnProperty.call(payload, "snap")) next.performanceEditorSnap = payload.snap;
      if (Object.prototype.hasOwnProperty.call(payload, "chartId")) next.performanceEditorChartId = payload.chartId;
      if (Object.prototype.hasOwnProperty.call(payload, "chartTitle")) next.performanceEditorChartTitle = payload.chartTitle;
      if (Object.prototype.hasOwnProperty.call(payload, "source")) next.performanceEditorSource = payload.source;
      if (Object.prototype.hasOwnProperty.call(payload, "dirty")) next.performanceEditorDirty = !!payload.dirty;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventId")) next.performanceEditorSelectedEventId = payload.selectedEventId;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventLabel")) next.performanceEditorSelectedEventLabel = payload.selectedEventLabel;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventTime")) next.performanceEditorSelectedEventTime = payload.selectedEventTime;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventDuration")) next.performanceEditorSelectedEventDuration = payload.selectedEventDuration;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseId")) next.performanceEditorSelectedPhraseId = payload.selectedPhraseId;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseName")) next.performanceEditorSelectedPhraseName = payload.selectedPhraseName;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseStart")) next.performanceEditorSelectedPhraseStart = payload.selectedPhraseStart;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseEnd")) next.performanceEditorSelectedPhraseEnd = payload.selectedPhraseEnd;
      if (Object.prototype.hasOwnProperty.call(payload, "bpm")) next.performanceEditorBpm = payload.bpm;
      if (Object.prototype.hasOwnProperty.call(payload, "eventCount")) next.performanceEditorEventCount = payload.eventCount;
      if (Object.prototype.hasOwnProperty.call(payload, "phraseCount")) next.performanceEditorPhraseCount = payload.phraseCount;
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "close_editor") {
      next.activeScreen = payload.screen || "home";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "configure_editor") {
      next.activeScreen = this.runtimeState.activeScreen || "performance_editor";
      if (Object.prototype.hasOwnProperty.call(payload, "mode")) next.performanceEditorMode = payload.mode;
      if (Object.prototype.hasOwnProperty.call(payload, "snap")) next.performanceEditorSnap = payload.snap;
      if (Object.prototype.hasOwnProperty.call(payload, "chartId")) next.performanceEditorChartId = payload.chartId;
      if (Object.prototype.hasOwnProperty.call(payload, "chartTitle")) next.performanceEditorChartTitle = payload.chartTitle;
      if (Object.prototype.hasOwnProperty.call(payload, "source")) next.performanceEditorSource = payload.source;
      if (Object.prototype.hasOwnProperty.call(payload, "dirty")) next.performanceEditorDirty = !!payload.dirty;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventId")) next.performanceEditorSelectedEventId = payload.selectedEventId;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventLabel")) next.performanceEditorSelectedEventLabel = payload.selectedEventLabel;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventTime")) next.performanceEditorSelectedEventTime = payload.selectedEventTime;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedEventDuration")) next.performanceEditorSelectedEventDuration = payload.selectedEventDuration;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseId")) next.performanceEditorSelectedPhraseId = payload.selectedPhraseId;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseName")) next.performanceEditorSelectedPhraseName = payload.selectedPhraseName;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseStart")) next.performanceEditorSelectedPhraseStart = payload.selectedPhraseStart;
      if (Object.prototype.hasOwnProperty.call(payload, "selectedPhraseEnd")) next.performanceEditorSelectedPhraseEnd = payload.selectedPhraseEnd;
      if (Object.prototype.hasOwnProperty.call(payload, "bpm")) next.performanceEditorBpm = payload.bpm;
      if (Object.prototype.hasOwnProperty.call(payload, "eventCount")) next.performanceEditorEventCount = payload.eventCount;
      if (Object.prototype.hasOwnProperty.call(payload, "phraseCount")) next.performanceEditorPhraseCount = payload.phraseCount;
    } else if (action === "open_calibration") {
      next.activeFlow = SparkSessionTypes.FLOW_PERFORMANCE_SONG;
      next.activeScreen = "perform_calibration";
      next.performanceCalibrationMode = false;
      if (Object.prototype.hasOwnProperty.call(payload, "source")) {
        next.performanceCalibrationSource = payload.source;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "globalOffsetMs")) next.performanceTimingOffsetMs = payload.globalOffsetMs;
      if (Object.prototype.hasOwnProperty.call(payload, "midiOffsetMs")) next.performanceMidiOffsetMs = payload.midiOffsetMs;
      if (Object.prototype.hasOwnProperty.call(payload, "micOffsetMs")) next.performanceMicOffsetMs = payload.micOffsetMs;
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
      if (Object.prototype.hasOwnProperty.call(payload, "globalOffsetMs")) next.performanceTimingOffsetMs = payload.globalOffsetMs;
      if (Object.prototype.hasOwnProperty.call(payload, "midiOffsetMs")) next.performanceMidiOffsetMs = payload.midiOffsetMs;
      if (Object.prototype.hasOwnProperty.call(payload, "micOffsetMs")) next.performanceMicOffsetMs = payload.micOffsetMs;
      next.performanceResults = this.runtimeState.performanceResults;
      next.transport = { status: "idle", positionMs: 0 };
    } else if (action === "calibration_apply") {
      next.activeScreen = "perform_calibration";
      next.performanceCalibrationMode = false;
      next.performanceCalibrationSource = payload.source || this.runtimeState.performanceCalibrationSource;
      if (Object.prototype.hasOwnProperty.call(payload, "globalOffsetMs")) next.performanceTimingOffsetMs = payload.globalOffsetMs;
      if (Object.prototype.hasOwnProperty.call(payload, "midiOffsetMs")) next.performanceMidiOffsetMs = payload.midiOffsetMs;
      if (Object.prototype.hasOwnProperty.call(payload, "micOffsetMs")) next.performanceMicOffsetMs = payload.micOffsetMs;
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
      if (Object.prototype.hasOwnProperty.call(payload, "songData")) next.performanceSongData = this.cloneValue(payload.songData);
      if (Object.prototype.hasOwnProperty.call(payload, "songIndex")) next.performanceSongIndex = payload.songIndex;
      if (Object.prototype.hasOwnProperty.call(payload, "songTitle")) next.performanceSongTitle = payload.songTitle;
      if (Object.prototype.hasOwnProperty.call(payload, "targetTechnique")) next.performanceTargetTechnique = payload.targetTechnique;
      if (Object.prototype.hasOwnProperty.call(payload, "arrangementType")) next.performanceArrangementType = payload.arrangementType;
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
      if (Object.prototype.hasOwnProperty.call(payload, "targetTechnique")) next.performanceTargetTechnique = payload.targetTechnique;
      next.performanceResults = payload.results || this.runtimeState.performanceResults;
      next.transport = { status: "completed", positionMs: this.runtimeState.transport.positionMs || 0 };
    } else if (action === "start_failed") {
      next.activeScreen = payload.screen || "home";
      next.performanceCalibrationMode = false;
      next.transport = { status: "idle", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.startPracticeFromLesson = function(lesson) {
    if (!lesson) return false;
    var payload = {
      chartId: lesson.type + "_drill",
      chart: {
        chartId: lesson.type,
        tempo: lesson.tempo,
        lanes: [],
        notes: []
      },
      mode: "practice"
    };
    if (typeof startPlayableRhythmHighwayPayload === "function") {
      return startPlayableRhythmHighwayPayload(payload, {
        source: "lesson_generator",
        label: lesson.label,
        instrument: this.runtimeState.activeInstrumentType || this.runtimeState.activeInstrumentId || "guitar"
      });
    }
    return false;
  };

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

  window.SparkCoreRuntime = SparkCore;
  window.createDefaultSparkCore = createDefaultSparkCore;
  window.sparkCore = createDefaultSparkCore();
  mountDefaultSparkDebugOverlay(window.sparkCore);
})();
