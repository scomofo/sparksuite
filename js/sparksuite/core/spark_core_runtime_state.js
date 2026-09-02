/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Runtime state: construction, projection and derived views
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  var _internal = SparkCore._internal;
  var getGuidedBlockTypeForStep = _internal.getGuidedBlockTypeForStep;

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
      lastError: null,
      recoveryActions: [],
      recoveryContext: null,
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

  SparkCore.prototype.buildShellTabChangeRequest = function(tabId, options) {
    var shellEffects = [{ type: "scrollToTop" }];
    options = options || {};
    if (tabId === "songs" && options.songsSubTab === "community") {
      shellEffects.push({ type: "fetchCommunity" });
    }
    return {
      runtimeState: {
        activeScreen: "home",
        activeTab: tabId || null,
        transport: { status: "idle", positionMs: 0 },
        shellEffects: shellEffects
      }
    };
  };

  SparkCore.prototype.clearShowroomRoutingState = function(state) {
    if (typeof SparkShowroomRoutingState !== "undefined" && SparkShowroomRoutingState && typeof SparkShowroomRoutingState.clear === "function") {
      return SparkShowroomRoutingState.clear(state || this.runtimeState || {});
    }
    return false;
  };

  // Gameplay-timing-config and practice-assist accessors were removed with
  // the third (never-loaded) timing system in js/sparksuite/{runtime,gameplay}
  // — hit windows are owned by SparkEnginePresetRegistry, latency by the
  // timing core / calibration engine.

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

  // Phase 2 convergence: engine-owned runtime-state -> legacy-shell field
  // projection. Call sites in js/actions/*_family.js used to hand-copy a
  // handful of runtimeState fields onto S themselves (one bespoke "mirror"
  // function per flow, each free to drift from what the engine actually
  // considers canonical). Projections defined here are the single source of
  // truth for that field mapping per domain; bridges call
  // projectRuntimeStateFields(domain, ...) instead of re-deriving it.
  SparkCore.RUNTIME_STATE_PROJECTIONS = {
    guided: function(runtimeState) {
      runtimeState = runtimeState || {};
      return {
        guidedActivityId: runtimeState.guidedActivityId || null,
        guidedActivityKind: runtimeState.guidedActivityKind || null,
        guidedBlockType: runtimeState.guidedBlockType || null
      };
    },
    // Performance/song launch call sites (js/actions/performance_family.js)
    // each re-derived "prefer the engine's runtime state, else fall back to
    // the legacy S value" per field, with a different presence check per
    // field (some fields treat "" or 0 as unset, some don't) copy-pasted at
    // every call site. Centralizing the per-field check here means a call
    // site only supplies its fallback values — the field-by-field precedence
    // rule itself is engine-owned and can't drift between call sites.
    performanceSongContext: function(runtimeState, fallback) {
      runtimeState = runtimeState || {};
      fallback = fallback || {};
      return {
        performanceSongIndex: Object.prototype.hasOwnProperty.call(runtimeState, "performanceSongIndex")
          ? runtimeState.performanceSongIndex
          : (fallback.performanceSongIndex != null ? fallback.performanceSongIndex : null),
        performanceSongTitle: runtimeState.performanceSongTitle
          ? runtimeState.performanceSongTitle
          : (fallback.performanceSongTitle || null),
        performanceDifficultyId: runtimeState.performanceDifficultyId
          ? runtimeState.performanceDifficultyId
          : (fallback.performanceDifficultyId || null),
        performanceSpeed: runtimeState.performanceSpeed
          ? runtimeState.performanceSpeed
          : (fallback.performanceSpeed || null),
        performanceTargetTechnique: Object.prototype.hasOwnProperty.call(runtimeState, "performanceTargetTechnique")
          ? runtimeState.performanceTargetTechnique
          : (fallback.performanceTargetTechnique || null)
      };
    }
  };

  SparkCore.prototype.projectRuntimeStateFields = function(domain, runtimeState, fallback) {
    var projection = SparkCore.RUNTIME_STATE_PROJECTIONS[domain];
    if (typeof projection !== "function") return null;
    return projection(runtimeState || this.runtimeState || {}, fallback || {});
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

  SparkCore.prototype.resolveGuidedSessionViewState = function(plan, runtimeState) {
    runtimeState = runtimeState || this.runtimeState || {};
    var guidedStep = runtimeState.guidedStep || "spark";
    var guidedActivity = this.resolveGuidedRuntimeActivity(guidedStep, plan);
    var blockType = runtimeState.guidedBlockType || guidedActivity.guidedBlockType || getGuidedBlockTypeForStep(guidedStep);
    var segments = plan && Array.isArray(plan.segments) ? plan.segments : [];
    var activeSegmentId = runtimeState.activeSegmentId || null;
    var activeSegment = null;
    var i;

    if (activeSegmentId && blockType) {
      for (i = 0; i < segments.length; i++) {
        if (segments[i] && segments[i].id === activeSegmentId) {
          if (segments[i].meta && segments[i].meta.guidedBlockType && segments[i].meta.guidedBlockType !== blockType) {
            activeSegmentId = null;
          }
          break;
        }
      }
    }
    if (!activeSegmentId && blockType) {
      for (i = 0; i < segments.length; i++) {
        if (segments[i] && segments[i].meta && segments[i].meta.guidedBlockType === blockType) {
          activeSegmentId = segments[i].id;
          break;
        }
      }
    }
    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === activeSegmentId) {
        activeSegment = segments[i];
        if (!blockType && activeSegment.meta) blockType = activeSegment.meta.guidedBlockType || null;
        break;
      }
    }

    return {
      guidedStep: guidedStep,
      guidedActivityId: guidedActivity.guidedActivityId || runtimeState.guidedActivityId || null,
      guidedActivityKind: guidedActivity.guidedActivityKind || runtimeState.guidedActivityKind || null,
      guidedBlockType: blockType || null,
      activeSegmentId: activeSegmentId,
      activeSegment: activeSegment
    };
  };

  SparkCore.prototype.getNextGuidedStep = function(step) {
    var steps = ["spark", "review", "newMove", "songSlice", "victoryLap"];
    var idx = steps.indexOf(step);
    if (idx === -1) return steps[0];
    if (idx >= steps.length - 1) return null;
    return steps[idx + 1];
  };
})();
