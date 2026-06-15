// js/orchestrator-requests.js
// Suite-level orchestration helpers extracted from js/app.js.
// Owns the long block of `*Request` / `apply*` / `sync*` / `open*` /
// `complete*` / `return*` helpers that bridge between the legacy `act()`
// dispatcher (still in js/app.js) and the SparkCore runtime — plus the
// _sparkEmit shim used to emit `SparkEvents` events safely.
//
// All functions remain global so the action dispatcher in js/app.js (and
// any other caller) finds them on `window`. No behavioral changes — pure
// relocation. See <script> ordering in index.html.

// Helper to emit suite events safely
function _sparkEmit(type, payload) {
  if (typeof SparkEvents !== "undefined") SparkEvents.emit(type, payload);
}

function getOrchestratorCore() {
  return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
}

function syncPerformanceEditorDocumentState(chart, options) {
  var core = getOrchestratorCore();
  if (!core) return;
  if (typeof core.syncPerformanceEditorDocument === "function") {
    core.syncPerformanceEditorDocument(chart, options || {});
    return;
  }
  if (typeof core.syncPerformanceRuntimeState !== "function") return;

  options = options || {};
  var events = chart && Array.isArray(chart.events) ? chart.events : [];
  var phrases = chart && Array.isArray(chart.phrases) ? chart.phrases : [];
  var selectedEvent = options.selectedEvent || null;
  var selectedPhrase = options.selectedPhrase || null;
  var selectedEventId = Object.prototype.hasOwnProperty.call(options, "selectedEventId")
    ? options.selectedEventId
    : (selectedEvent ? selectedEvent.id : (S.performEditorSelectedEventId != null ? S.performEditorSelectedEventId : null));
  var selectedPhraseId = Object.prototype.hasOwnProperty.call(options, "selectedPhraseId")
    ? options.selectedPhraseId
    : (selectedPhrase ? selectedPhrase.id : null);

  core.syncPerformanceRuntimeState(options.action || "configure_editor", {
    mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : S.performEditorMode,
    snap: Object.prototype.hasOwnProperty.call(options, "snap") ? options.snap : S.performEditorSnap,
    chartId: chart && chart.id ? chart.id : null,
    chartTitle: chart && chart.title ? chart.title : null,
    source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : (chart ? "existing" : "blank"),
    dirty: Object.prototype.hasOwnProperty.call(options, "dirty") ? !!options.dirty : !!S.performEditorDirty,
    selectedEventId: selectedEventId,
    selectedEventLabel: Object.prototype.hasOwnProperty.call(options, "selectedEventLabel")
      ? options.selectedEventLabel
      : (selectedEvent ? (selectedEvent.laneLabel || selectedEvent.chord || selectedEvent.note || "?") : null),
    selectedEventTime: Object.prototype.hasOwnProperty.call(options, "selectedEventTime")
      ? options.selectedEventTime
      : (selectedEvent ? (selectedEvent.t || 0) : null),
    selectedEventDuration: Object.prototype.hasOwnProperty.call(options, "selectedEventDuration")
      ? options.selectedEventDuration
      : (selectedEvent ? (selectedEvent.dur || 0) : null),
    selectedPhraseId: selectedPhraseId,
    selectedPhraseName: Object.prototype.hasOwnProperty.call(options, "selectedPhraseName")
      ? options.selectedPhraseName
      : (selectedPhrase ? selectedPhrase.name : null),
    selectedPhraseStart: Object.prototype.hasOwnProperty.call(options, "selectedPhraseStart")
      ? options.selectedPhraseStart
      : (selectedPhrase ? selectedPhrase.startSec : null),
    selectedPhraseEnd: Object.prototype.hasOwnProperty.call(options, "selectedPhraseEnd")
      ? options.selectedPhraseEnd
      : (selectedPhrase ? selectedPhrase.endSec : null),
    bpm: Object.prototype.hasOwnProperty.call(options, "bpm")
      ? options.bpm
      : (chart && chart.bpm ? chart.bpm : null),
    eventCount: Object.prototype.hasOwnProperty.call(options, "eventCount")
      ? options.eventCount
      : events.length,
    phraseCount: Object.prototype.hasOwnProperty.call(options, "phraseCount")
      ? options.phraseCount
      : phrases.length
  });
}

function applyPerformanceEditorCoreMutation(action, payload) {
  var core = getOrchestratorCore();
  if (!core || typeof core.applyPerformanceEditorMutation !== "function") return null;
  return core.applyPerformanceEditorMutation(action, payload || {});
}

function syncPerformanceEditorLibraryState(library) {
  var nextLibrary = Array.isArray(library) ? library : [];
  S.performEditorLibrary = nextLibrary;
  return nextLibrary;
}

function getPerformanceEditorExportData() {
  var core = getOrchestratorCore();
  if (core && typeof core.getPerformanceEditorExportData === "function") {
    return core.getPerformanceEditorExportData();
  }
  if (!S.performEditorChart) return { chart: null, json: "", fileName: "chart.json" };
  return {
    chart: S.performEditorChart,
    json: JSON.stringify(S.performEditorChart, null, 2),
    fileName: (S.performEditorChart.title || "chart").replace(/\s+/g, "_") + ".json"
  };
}

function getPerformanceEditorPreviewChart() {
  var core = getOrchestratorCore();
  if (core && typeof core.getPerformanceEditorPreviewChart === "function") {
    return core.getPerformanceEditorPreviewChart();
  }
  return S.performEditorChart || null;
}

function getPerformanceEditorPreviewRequest() {
  var core = getOrchestratorCore();
  if (core && typeof core.startPerformanceEditorPreview === "function") {
    return core.startPerformanceEditorPreview();
  }
  var chart = getPerformanceEditorPreviewChart();
  if (!chart) return null;
  return {
    chart: chart,
    chartId: chart.id || "generated",
    arrangementType: chart.arrangementType || S.performArrangementType || "chords",
    difficulty: S.performDifficulty || "normal",
    speed: S.performSpeed || 1,
    mode: S.performMode || "midi",
    preset: S.performPracticePreset || null
  };
}

function getPerformanceRetryRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.startPerformanceRetrySession === "function") {
    return core.startPerformanceRetrySession(options || {});
  }
  options = options || {};
  return {
    chart: Object.prototype.hasOwnProperty.call(options, "chart") ? options.chart : null,
    chartId: Object.prototype.hasOwnProperty.call(options, "chartId") ? options.chartId : (S.performChartId || "generated"),
    arrangementType: Object.prototype.hasOwnProperty.call(options, "arrangementType") ? options.arrangementType : S.performArrangementType,
    difficulty: Object.prototype.hasOwnProperty.call(options, "difficulty") ? options.difficulty : S.performDifficulty,
    speed: Object.prototype.hasOwnProperty.call(options, "speed") ? options.speed : S.performSpeed,
    mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : S.performMode,
    preset: Object.prototype.hasOwnProperty.call(options, "preset") ? options.preset : S.performPracticePreset,
    countIn: Object.prototype.hasOwnProperty.call(options, "countIn") ? !!options.countIn : !!S.performCountIn,
    targetPhraseIndex: Object.prototype.hasOwnProperty.call(options, "targetPhraseIndex") ? options.targetPhraseIndex : null
  };
}

function applyPerformanceCalibrationRequest(action, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.applyPerformanceCalibrationRequest === "function") {
    return core.applyPerformanceCalibrationRequest(action, options || {});
  }
  options = options || {};
  if (core && typeof core.syncPerformanceRuntimeState === "function") {
    core.syncPerformanceRuntimeState(action, {
      source: Object.prototype.hasOwnProperty.call(options, "source") ? options.source : (S.performCalibrationSource || "midi"),
      appliedOffsetMs: Object.prototype.hasOwnProperty.call(options, "appliedOffsetMs") ? options.appliedOffsetMs : null,
      globalOffsetMs: Object.prototype.hasOwnProperty.call(options, "globalOffsetMs") ? options.globalOffsetMs : (S.performTimingOffsetMs || 0),
      midiOffsetMs: Object.prototype.hasOwnProperty.call(options, "midiOffsetMs") ? options.midiOffsetMs : (S.performMidiOffsetMs || 0),
      micOffsetMs: Object.prototype.hasOwnProperty.call(options, "micOffsetMs")
        ? options.micOffsetMs
        : ((typeof S.performMicOffsetMs === "number" && isFinite(S.performMicOffsetMs)) ? S.performMicOffsetMs : 0)
    });
  }
  return options;
}

function applyPerformanceNavigationRequest(target, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.applyPerformanceNavigationRequest === "function") {
    return core.applyPerformanceNavigationRequest(target, options || {});
  }
  return null;
}

function openPerformanceStatsRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openPerformanceStats === "function") {
    return core.openPerformanceStats(options || {});
  }
  return null;
}

function openPerformanceEditorRequest(chart, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openPerformanceEditor === "function") {
    return core.openPerformanceEditor(chart || null, options || {});
  }
  return null;
}

function openPerformanceCalibrationRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openPerformanceCalibration === "function") {
    return core.openPerformanceCalibration(options || {});
  }
  return applyPerformanceCalibrationRequest("open_calibration", options || {});
}

function openPerformanceSongSelectionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openPerformanceSongSelection === "function") {
    return core.openPerformanceSongSelection(options || {});
  }
  return null;
}

function startSelectedPerformanceSongRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.startSelectedPerformanceSong === "function") {
    return core.startSelectedPerformanceSong(options || {});
  }
  return getPerformanceRetryRequest(options || {});
}

function openDailyPracticePlanRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openDailyPracticePlan === "function") {
    return core.openDailyPracticePlan(options || {});
  }
  if (core && typeof core.startSession === "function") {
    return core.startSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      forceRebuild: !!(options && (options.forceRebuild || options.lessonId || options.practiceTemplateId || options.ukuleleMiniSessionId)),
      lessonId: options && options.lessonId ? options.lessonId : null,
      practiceTemplateId: options && options.practiceTemplateId ? options.practiceTemplateId : null,
      ukuleleMiniSessionId: options && options.ukuleleMiniSessionId ? options.ukuleleMiniSessionId : null,
      favoriteSongs: options && options.favoriteSongs ? options.favoriteSongs : []
    });
  }
  return null;
}

function openDashboardPracticePlanRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openDashboardPracticePlan === "function") {
    return core.openDashboardPracticePlan(options || {});
  }
  return openDailyPracticePlanRequest(options || {});
}

function openPracticePlanScreenRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openPracticePlanScreen === "function") {
    return core.openPracticePlanScreen(options || {});
  }
  return openDashboardPracticePlanRequest(options || {});
}

function resolveModuleExerciseLaunchOptions(rawValue) {
  if (!rawValue) return null;
  if (typeof rawValue === "object") return rawValue;
  try {
    return JSON.parse(String(rawValue));
  } catch (err) {
    return null;
  }
}

function getInstrumentModuleForLaunch(instrumentId) {
  if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive) {
    var active = SparkInstruments.getActive();
    if (active && (!instrumentId || active.instrument === instrumentId || active.id === instrumentId)) return active;
  }
  var map = {
    bass: window.SparkBassModule,
    ukulele: window.SparkUkuleleModule,
    guitar: window.SparkGuitarModule,
    piano: window.SparkPianoModule
  };
  return instrumentId ? (map[instrumentId] || null) : null;
}

function getActiveInstrumentIdentityForActivity() {
  var active;
  var candidate;
  var all;
  var i;
  var entry;
  if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
    active = SparkInstruments.getActive();
    if (active) {
      if (!active.instrument && !active.instrumentType) {
        candidate = active.id || active.appId || active.instrumentId || null;
        if (candidate && typeof SparkInstruments.getAll === "function") {
          all = SparkInstruments.getAll() || [];
          for (i = 0; i < all.length; i++) {
            entry = all[i] || {};
            if (entry.id === candidate || entry.appId === candidate) {
              active = entry;
              break;
            }
          }
        }
      }
      return {
        appId: active.id || active.appId || active.instrumentId || "chordspark",
        instrumentType: active.instrument || active.instrumentType || null
      };
    }
  }
  return {
    appId: "chordspark",
    instrumentType: null
  };
}

function buildModuleExerciseRhythmPayload(options) {
  options = options || {};
  var module = getInstrumentModuleForLaunch(options.instrument);
  if (!module || typeof module.getRhythmAdapter !== "function") return null;
  var rhythmAdapter = module.getRhythmAdapter();
  if (!rhythmAdapter || typeof rhythmAdapter.createPayload !== "function") return null;
  return rhythmAdapter.createPayload({
    segment: {
      id: options.exerciseId || options.lessonId || "module_rhythm_exercise",
      type: SparkSessionSegmentTypes ? SparkSessionSegmentTypes.RHYTHM_HIGHWAY : "rhythm_highway",
      meta: {
        skill: options.exerciseFocus || options.skill || null
      }
    },
    curriculum: {
      nextLessonId: options.lessonId || null
    },
    instrumentContext: {
      instrumentType: options.instrument || null
    }
  });
}

function openLegacyPracticeSessionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openLegacyPracticeSession === "function") {
    return core.openLegacyPracticeSession(options || {});
  }
  return null;
}

function openLegacyPracticeDrillRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openLegacyPracticeDrill === "function") {
    return core.openLegacyPracticeDrill(options || {});
  }
  return null;
}

function syncLegacyPracticeRuntimeRequest(action, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncLegacyPracticeRuntimeState === "function") {
    return core.syncLegacyPracticeRuntimeState(action, options || {});
  }
  return null;
}

function repeatLegacyPracticeSessionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.repeatLegacyPracticeSession === "function") {
    return core.repeatLegacyPracticeSession(options || {});
  }
  return openLegacyPracticeSessionRequest(options || {});
}

function repeatLegacyPracticeDrillRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.repeatLegacyPracticeDrill === "function") {
    return core.repeatLegacyPracticeDrill(options || {});
  }
  return openLegacyPracticeDrillRequest(options || {});
}

function openLegacyDailyChallengeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openLegacyDailyChallenge === "function") {
    return core.openLegacyDailyChallenge(options || {});
  }
  return null;
}

function syncLegacyDailyRuntimeRequest(action, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncLegacyDailyRuntimeState === "function") {
    return core.syncLegacyDailyRuntimeState(action, options || {});
  }
  return null;
}

function completeLegacyDailyChallengeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.completeLegacyDailyChallenge === "function") {
    return core.completeLegacyDailyChallenge(options || {});
  }
  return null;
}

function openLegacyRunnerGameRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openLegacyRunnerGame === "function") {
    return core.openLegacyRunnerGame(options || {});
  }
  return null;
}

function syncLegacyRunnerRuntimeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncLegacyRunnerRuntimeState === "function") {
    return core.syncLegacyRunnerRuntimeState(options || {});
  }
  return null;
}

function completeLegacyRunnerGameRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.completeLegacyRunnerGame === "function") {
    return core.completeLegacyRunnerGame(options || {});
  }
  return null;
}

function syncTunerRuntimeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncTunerRuntimeState === "function") {
    return core.syncTunerRuntimeState(options || {});
  }
  return null;
}

function syncAudioInputRuntimeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncAudioInputRuntimeState === "function") {
    return core.syncAudioInputRuntimeState(options || {});
  }
  return null;
}

function syncMetronomeRuntimeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncMetronomeRuntimeState === "function") {
    return core.syncMetronomeRuntimeState(options || {});
  }
  return null;
}

function openLegacyRhythmGameRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openLegacyRhythmGame === "function") {
    return core.openLegacyRhythmGame(options || {});
  }
  return null;
}

function syncLegacyRhythmRuntimeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncLegacyRhythmRuntimeState === "function") {
    return core.syncLegacyRhythmRuntimeState(options || {});
  }
  return null;
}

function completeLegacyRhythmGameRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.completeLegacyRhythmGame === "function") {
    return core.completeLegacyRhythmGame(options || {});
  }
  return null;
}

function returnFromLegacyDailyChallengeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.returnFromLegacyDailyChallenge === "function") {
    return core.returnFromLegacyDailyChallenge(options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "home",
      activeTab: options && options.activeTab ? options.activeTab : "daily",
      legacyDailyTimerActive: false,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function completeDailyPracticePlanRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.completeDailyPracticePlan === "function") {
    return core.completeDailyPracticePlan(options || {});
  }
  if (core && typeof core.completeSession === "function") {
    return core.completeSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      markPlanComplete: true,
      itemId: options && Object.prototype.hasOwnProperty.call(options, "itemId") ? options.itemId : undefined
    });
  }
  return null;
}

function openGuidedSessionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openGuidedSession === "function") {
    return core.openGuidedSession(options || {});
  }
  if (core && typeof core.startSession === "function") {
    return core.startSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      sessionNum: options && Object.prototype.hasOwnProperty.call(options, "sessionNum") ? options.sessionNum : undefined
    });
  }
  return null;
}

function openSongSessionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openSongSession === "function") {
    return core.openSongSession(options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    options = options || {};
    return core.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: options.targetScreen || "song",
      activeTab: "songs",
      songSessionData: options.songData || null,
      songSessionSource: options.source || "builtin",
      songPlaying: !!options.songPlaying,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat") ? options.songBeat : 0,
      transport: { status: options.songPlaying ? "running" : "ready", positionMs: 0 }
    });
  }
  return null;
}

function openCareerSongSelectionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openCareerSongSelection === "function") {
    return core.openCareerSongSelection(options || {});
  }
  if (core && typeof core.openPerformanceSongSelection === "function") {
    return core.openPerformanceSongSelection(options || {});
  }
  return null;
}

function openPerformanceDailyChallengeRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.openPerformanceDailyChallenge === "function") {
    return core.openPerformanceDailyChallenge(options || {});
  }
  return openPerformanceSongSelectionRequest(options || {});
}

function syncSongRuntimeRequest(action, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncSongRuntimeState === "function") {
    return core.syncSongRuntimeState(action, options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    options = options || {};
    var runtimeState = typeof core.getRuntimeState === "function" ? core.getRuntimeState() : {};
    return core.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: options.targetScreen || (action === "complete" ? "song_done" : "song"),
      activeTab: "songs",
      songSessionData: Object.prototype.hasOwnProperty.call(options, "songData") ? options.songData : runtimeState.songSessionData,
      songSessionSource: options.source || runtimeState.songSessionSource || "builtin",
      songPlaying: action === "play" ? true : !!options.songPlaying,
      songBeat: Object.prototype.hasOwnProperty.call(options, "songBeat") ? options.songBeat : 0,
      transport: {
        status: action === "complete" ? "completed" : (action === "play" ? "running" : "ready"),
        positionMs: 0
      }
    });
  }
  return null;
}

function applySongNavigationRequest(target, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.applySongNavigationRequest === "function") {
    return core.applySongNavigationRequest(target, options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: target === "song_done" ? "song_done" : (target === "song_detail" ? "song" : "home"),
      activeTab: "songs",
      songPlaying: false,
      transport: { status: target === "song_done" ? "completed" : "idle", positionMs: 0 }
    });
  }
  return null;
}

function applySongBrowserRequest(action, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.applySongBrowserRequest === "function") {
    return core.applySongBrowserRequest(action, options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    options = options || {};
    return core.updateRuntimeState({
      activeTab: "songs",
      songsSubTab: Object.prototype.hasOwnProperty.call(options, "songsSubTab") ? options.songsSubTab : S.songsSubTab,
      songFilter: Object.prototype.hasOwnProperty.call(options, "songFilter") ? options.songFilter : S.songFilter,
      songSort: Object.prototype.hasOwnProperty.call(options, "songSort") ? options.songSort : S.songSort,
      songSortAsc: Object.prototype.hasOwnProperty.call(options, "songSortAsc") ? !!options.songSortAsc : !!S.songSortAsc,
      communityTab: Object.prototype.hasOwnProperty.call(options, "communityTab") ? options.communityTab : S.communityTab,
      communitySearch: Object.prototype.hasOwnProperty.call(options, "communitySearch") ? options.communitySearch : S.communitySearch,
      communitySort: Object.prototype.hasOwnProperty.call(options, "communitySort") ? options.communitySort : S.communitySort
    });
  }
  return null;
}

function applyDashboardRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.applyDashboardRequest === "function") {
    return core.applyDashboardRequest(options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    options = options || {};
    return core.updateRuntimeState({
      dashboardRecommendations: Object.prototype.hasOwnProperty.call(options, "recommendations") ? options.recommendations : (S.recommendations || []),
      dashboardInsights: Object.prototype.hasOwnProperty.call(options, "insights") ? options.insights : (S.personalInsights || null),
      dashboardChallenges: Object.prototype.hasOwnProperty.call(options, "challenges") ? options.challenges : (S.activeChallenges || []),
      lastDashboardRefreshAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt") ? options.refreshedAt : Date.now()
    });
  }
  return null;
}

function refreshDashboardSnapshotRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.refreshDashboardSnapshot === "function") {
    return core.refreshDashboardSnapshot(options || {});
  }
  return applyDashboardRequest(options || {});
}

function initializeDashboardChallengesRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.initializeDashboardChallenges === "function") {
    return core.initializeDashboardChallenges(options || {});
  }
  return applyDashboardRequest(options || {});
}

function applyDashboardNavigationRequest(target) {
  var core = getOrchestratorCore();
  if (core && typeof core.applyDashboardNavigationRequest === "function") {
    return core.applyDashboardNavigationRequest(target);
  }
  if (core && typeof core.updateRuntimeState === "function") {
    var screen = "home_dash";
    if (target === "recommendations") screen = "recommendations";
    else if (target === "insights") screen = "insights";
    else if (target === "challenges") screen = "challenges";
    else if (target === "career") screen = "career";
    return core.updateRuntimeState({ activeScreen: screen });
  }
  return null;
}

function openDashboardSectionRequest(target) {
  var core = getOrchestratorCore();
  if (core && typeof core.openDashboardSection === "function") {
    return core.openDashboardSection(target);
  }
  return applyDashboardNavigationRequest(target);
}

function returnFromHomeFamilyRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.returnFromHomeFamily === "function") {
    return core.returnFromHomeFamily(options || {});
  }
  if (options && options.currentScreen) {
    var currentScreen = options.currentScreen;
    var isDashboardFamily = currentScreen === "recommendations"
      || currentScreen === "insights"
      || currentScreen === "challenges"
      || currentScreen === "career"
      || currentScreen === "home_dash";
    if (isDashboardFamily) return applyDashboardNavigationRequest("dashboard_back");
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: "home",
      activeTab: S.tab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function openUtilityScreenRequest(target) {
  var core = getOrchestratorCore();
  if (core && typeof core.openUtilityScreen === "function") {
    return core.openUtilityScreen(target);
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: target || "home",
      activeTab: S.tab || null
    });
  }
  return null;
}

function syncSettingsStateRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.syncSettingsState === "function") {
    return core.syncSettingsState(options || {});
  }
  return null;
}

function buildMidiSettingsRuntimePayload() {
  var activeDevice = typeof getActiveMidiDevice === "function" ? getActiveMidiDevice() : null;
  var activeProfile = typeof getActiveMidiProfile === "function" ? getActiveMidiProfile() : null;
  var profileIds = S.midiProfiles ? Object.keys(S.midiProfiles) : [];
  var profileOptions = [];
  var i;
  for (i = 0; i < profileIds.length; i++) {
    var id = profileIds[i];
    var profile = S.midiProfiles[id];
    if (!profile) continue;
    profileOptions.push({
      id: id,
      name: profile.name || "Unnamed Profile",
      type: profile.type || "default"
    });
  }
  return {
    midiEnabled: !!S.midiEnabled,
    activeDeviceId: S.activeMidiDeviceId || null,
    activeDeviceName: activeDevice ? (activeDevice.name || null) : null,
    activeProfileId: S.activeMidiProfileId || null,
    activeProfileName: activeProfile ? (activeProfile.name || null) : null,
    deviceOptions: Array.isArray(S.midiDevices) ? S.midiDevices.map(function(device) {
      return {
        id: device.id,
        name: device.name || "MIDI Input"
      };
    }) : [],
    profileOptions: profileOptions
  };
}

function syncMidiSettingsStateRequest(options) {
  var payload = buildMidiSettingsRuntimePayload();
  var core = getOrchestratorCore();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (core && typeof core.syncMidiSettingsState === "function") {
    return core.syncMidiSettingsState(payload);
  }
  return null;
}

function buildCloudSettingsRuntimePayload() {
  return {
    loggedIn: !!(S.cloudAuth && S.cloudAuth.loggedIn && S.cloudAuth.token),
    email: S.cloudAuth ? (S.cloudAuth.email || null) : null,
    lastSyncStatus: S.cloudSync ? (S.cloudSync.lastSyncStatus || "idle") : "idle",
    lastSyncAt: S.cloudSync ? (S.cloudSync.lastSyncAt || null) : null
  };
}

function syncCloudSettingsStateRequest(options) {
  var payload = buildCloudSettingsRuntimePayload();
  var core = getOrchestratorCore();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (core && typeof core.syncCloudSettingsState === "function") {
    return core.syncCloudSettingsState(payload);
  }
  return null;
}

function applyCloudWorkflowRequest(action, options) {
  var payload = buildCloudSettingsRuntimePayload();
  var core = getOrchestratorCore();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (core && typeof core.applyCloudWorkflowRequest === "function") {
    return core.applyCloudWorkflowRequest(action, payload);
  }
  if (core && typeof core.syncCloudSettingsState === "function") {
    return core.syncCloudSettingsState(payload);
  }
  return null;
}

function buildCurriculumRuntimePayload() {
  var curriculums = (window.SparkCurriculum && SparkCurriculum.curriculums) || {};
  var packs = (window.SparkContent && SparkContent.packs) || {};
  var curriculumIds = Object.keys(curriculums);
  var packIds = Object.keys(packs);
  return {
    curriculums: curriculumIds.map(function(id) {
      var cur = curriculums[id] || {};
      return {
        id: id,
        title: cur.title || id,
        trackCount: Array.isArray(cur.tracks) ? cur.tracks.length : 0
      };
    }),
    packs: packIds.map(function(id) {
      var pack = packs[id] || {};
      return {
        id: id,
        title: pack.title || id,
        type: pack.type || "pack"
      };
    })
  };
}

function syncCurriculumStateRequest(options) {
  var payload = buildCurriculumRuntimePayload();
  var core = getOrchestratorCore();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (core && typeof core.syncCurriculumState === "function") {
    return core.syncCurriculumState(payload);
  }
  return null;
}

function buildMidiImportRuntimePayload(options) {
  var normalizedMidi = (options && Object.prototype.hasOwnProperty.call(options, "normalizedMidi"))
    ? options.normalizedMidi
    : S.importedMidi;
  var assignments = (options && Object.prototype.hasOwnProperty.call(options, "assignments"))
    ? options.assignments
    : S.importedMidiAssignments;
  var seedChart = (options && Object.prototype.hasOwnProperty.call(options, "seedChart"))
    ? options.seedChart
    : S.importedMidiSeedPreview;
  var tracks = normalizedMidi && Array.isArray(normalizedMidi.tracks) ? normalizedMidi.tracks : [];
  var midiPayload = {
    summary: normalizedMidi ? {
      sourceName: normalizedMidi.sourceName || null,
      trackCount: tracks.length,
      tracks: tracks.map(function(track) {
        return {
          id: track.id,
          name: track.name || track.id || "Track",
          noteCount: Array.isArray(track.notes) ? track.notes.length : 0
        };
      })
    } : null,
    assignments: assignments || {},
    seedTitle: seedChart && seedChart.title ? seedChart.title : null
  };
  if (options && Object.prototype.hasOwnProperty.call(options, "seedMode")) {
    midiPayload.seedMode = options.seedMode;
  }
  return midiPayload;
}

function syncMidiImportStateRequest(options) {
  var payload = buildMidiImportRuntimePayload(options || {});
  var core = getOrchestratorCore();
  if (core && typeof core.syncMidiImportState === "function") {
    return core.syncMidiImportState(payload);
  }
  return null;
}

function openSkillTreeRequest() {
  var core = getOrchestratorCore();
  if (core && typeof core.openSkillTree === "function") {
    return core.openSkillTree();
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: S.tab || null
    });
  }
  return null;
}

function setSkillTreeFocusRequest(focus) {
  var core = getOrchestratorCore();
  if (core && typeof core.setSkillTreeFocus === "function") {
    return core.setSkillTreeFocus(focus);
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: S.tab || null,
      skillTreeFocus: focus || "overview"
    });
  }
  return null;
}

function openStemPlayerRequest() {
  var core = getOrchestratorCore();
  if (core && typeof core.openStemPlayer === "function") {
    return core.openStemPlayer();
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: "stems",
      activeTab: "songs",
      songsSubTab: "stems"
    });
  }
  return null;
}

function closeStemPlayerRequest() {
  var core = getOrchestratorCore();
  if (core && typeof core.closeStemPlayer === "function") {
    return core.closeStemPlayer();
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: "home",
      activeTab: "songs",
      songsSubTab: "stems",
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function returnFromUtilityFamilyRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.returnFromUtilityFamily === "function") {
    return core.returnFromUtilityFamily(options || {});
  }
  if (core && typeof core.updateRuntimeState === "function") {
    return core.updateRuntimeState({
      activeScreen: "home",
      activeTab: S.tab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function applyDashboardChallengeRewardRequest(challengeId) {
  var core = getOrchestratorCore();
  if (core && typeof core.applyDashboardChallengeReward === "function") {
    return core.applyDashboardChallengeReward(challengeId);
  }
  return null;
}

function completeSongSessionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.completeSongSession === "function") {
    return core.completeSongSession(options || {});
  }
  return syncSongRuntimeRequest("complete", options || {});
}

function completeGuidedSessionRequest(options) {
  var core = getOrchestratorCore();
  if (core && typeof core.completeGuidedSession === "function") {
    return core.completeGuidedSession(options || {});
  }
  if (core && typeof core.completeSession === "function") {
    var result = core.completeSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      markPlanComplete: true
    });
    if (typeof core.syncGuidedRuntimeState === "function") {
      core.syncGuidedRuntimeState({
        activeScreen: "guided_done",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "completed", positionMs: 0 }
      });
    }
    return result;
  }
  // Route through contract-based progress path (Phase 6 migration)
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var guidedActiveInstrument = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive ? SparkInstruments.getActive() : null;
    var guidedResult = SparkContracts.createSessionResult({
      mode: "guided",
      instrumentId: guidedActiveInstrument ? (guidedActiveInstrument.id || guidedActiveInstrument.appId || null) : null,
      instrumentType: guidedActiveInstrument ? guidedActiveInstrument.instrument : null,
      duration: 300,
      accuracy: 0.75,
      completed: true
    });
    var guidedOutcome = SparkProgressOrchestrator.applySessionOutcome(guidedResult);
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[App] Guided ProgressOutcome:", guidedOutcome);
    }
  }
  return null;
}

function applyGuidedNavigationRequest(target, options) {
  var core = getOrchestratorCore();
  if (core && typeof core.applyGuidedNavigationRequest === "function") {
    return core.applyGuidedNavigationRequest(target, options || {});
  }
  if (core && typeof core.syncGuidedRuntimeState === "function") {
    if (target === "guided_home") {
      return core.syncGuidedRuntimeState({
        activeScreen: "home",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    if (target === "guided_done") {
      return core.syncGuidedRuntimeState({
        activeScreen: "guided_done",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "completed", positionMs: 0 }
      });
    }
  }
  return null;
}
