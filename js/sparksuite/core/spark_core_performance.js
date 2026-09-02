/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Performance sessions: selection, calibration, start, completion and navigation
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

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
      if (runtimeState.performanceSongData || runtimeState.performanceSongTitle || runtimeState.performanceSongIndex != null) {
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
})();
