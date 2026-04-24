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
      forceRebuild: !!(options && options.forceRebuild)
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
  if (window.sparkCore && typeof window.sparkCore.openGuidedSession === "function") {
    return window.sparkCore.openGuidedSession(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
    return window.sparkCore.startSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      sessionNum: options && Object.prototype.hasOwnProperty.call(options, "sessionNum") ? options.sessionNum : undefined
    });
  }
  return null;
}

function openSongSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openSongSession === "function") {
    return window.sparkCore.openSongSession(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
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
  if (window.sparkCore && typeof window.sparkCore.openCareerSongSelection === "function") {
    return window.sparkCore.openCareerSongSelection(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.openPerformanceSongSelection === "function") {
    return window.sparkCore.openPerformanceSongSelection(options || {});
  }
  return null;
}

function openPerformanceDailyChallengeRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.openPerformanceDailyChallenge === "function") {
    return window.sparkCore.openPerformanceDailyChallenge(options || {});
  }
  return openPerformanceSongSelectionRequest(options || {});
}

function syncSongRuntimeRequest(action, options) {
  if (window.sparkCore && typeof window.sparkCore.syncSongRuntimeState === "function") {
    return window.sparkCore.syncSongRuntimeState(action, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      activeFlow: "song_session",
      activeScreen: options.targetScreen || (action === "complete" ? "song_done" : "song"),
      activeTab: "songs",
      songSessionData: Object.prototype.hasOwnProperty.call(options, "songData") ? options.songData : window.sparkCore.getRuntimeState().songSessionData,
      songSessionSource: options.source || window.sparkCore.getRuntimeState().songSessionSource || "builtin",
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
  if (window.sparkCore && typeof window.sparkCore.applySongNavigationRequest === "function") {
    return window.sparkCore.applySongNavigationRequest(target, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
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
  if (window.sparkCore && typeof window.sparkCore.applySongBrowserRequest === "function") {
    return window.sparkCore.applySongBrowserRequest(action, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
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
  if (window.sparkCore && typeof window.sparkCore.applyDashboardRequest === "function") {
    return window.sparkCore.applyDashboardRequest(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    options = options || {};
    return window.sparkCore.updateRuntimeState({
      dashboardRecommendations: Object.prototype.hasOwnProperty.call(options, "recommendations") ? options.recommendations : (S.recommendations || []),
      dashboardInsights: Object.prototype.hasOwnProperty.call(options, "insights") ? options.insights : (S.personalInsights || null),
      dashboardChallenges: Object.prototype.hasOwnProperty.call(options, "challenges") ? options.challenges : (S.activeChallenges || []),
      lastDashboardRefreshAt: Object.prototype.hasOwnProperty.call(options, "refreshedAt") ? options.refreshedAt : Date.now()
    });
  }
  return null;
}

function refreshDashboardSnapshotRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.refreshDashboardSnapshot === "function") {
    return window.sparkCore.refreshDashboardSnapshot(options || {});
  }
  return applyDashboardRequest(options || {});
}

function initializeDashboardChallengesRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.initializeDashboardChallenges === "function") {
    return window.sparkCore.initializeDashboardChallenges(options || {});
  }
  return applyDashboardRequest(options || {});
}

function applyDashboardNavigationRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardNavigationRequest === "function") {
    return window.sparkCore.applyDashboardNavigationRequest(target);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    var screen = "home_dash";
    if (target === "recommendations") screen = "recommendations";
    else if (target === "insights") screen = "insights";
    else if (target === "challenges") screen = "challenges";
    else if (target === "career") screen = "career";
    return window.sparkCore.updateRuntimeState({ activeScreen: screen });
  }
  return null;
}

function openDashboardSectionRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.openDashboardSection === "function") {
    return window.sparkCore.openDashboardSection(target);
  }
  return applyDashboardNavigationRequest(target);
}

function returnFromHomeFamilyRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.returnFromHomeFamily === "function") {
    return window.sparkCore.returnFromHomeFamily(options || {});
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
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: S.tab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function openUtilityScreenRequest(target) {
  if (window.sparkCore && typeof window.sparkCore.openUtilityScreen === "function") {
    return window.sparkCore.openUtilityScreen(target);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: target || "home",
      activeTab: S.tab || null
    });
  }
  return null;
}

function syncSettingsStateRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.syncSettingsState === "function") {
    return window.sparkCore.syncSettingsState(options || {});
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
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.syncMidiSettingsState === "function") {
    return window.sparkCore.syncMidiSettingsState(payload);
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
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.syncCloudSettingsState === "function") {
    return window.sparkCore.syncCloudSettingsState(payload);
  }
  return null;
}

function applyCloudWorkflowRequest(action, options) {
  var payload = buildCloudSettingsRuntimePayload();
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.applyCloudWorkflowRequest === "function") {
    return window.sparkCore.applyCloudWorkflowRequest(action, payload);
  }
  if (window.sparkCore && typeof window.sparkCore.syncCloudSettingsState === "function") {
    return window.sparkCore.syncCloudSettingsState(payload);
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
  var key;
  options = options || {};
  for (key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  }
  if (window.sparkCore && typeof window.sparkCore.syncCurriculumState === "function") {
    return window.sparkCore.syncCurriculumState(payload);
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
  return {
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
    seedMode: (options && Object.prototype.hasOwnProperty.call(options, "seedMode")) ? options.seedMode : null,
    seedTitle: seedChart && seedChart.title ? seedChart.title : null
  };
}

function syncMidiImportStateRequest(options) {
  var payload = buildMidiImportRuntimePayload(options || {});
  if (window.sparkCore && typeof window.sparkCore.syncMidiImportState === "function") {
    return window.sparkCore.syncMidiImportState(payload);
  }
  return null;
}

function openSkillTreeRequest() {
  if (window.sparkCore && typeof window.sparkCore.openSkillTree === "function") {
    return window.sparkCore.openSkillTree();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: S.tab || null
    });
  }
  return null;
}

function setSkillTreeFocusRequest(focus) {
  if (window.sparkCore && typeof window.sparkCore.setSkillTreeFocus === "function") {
    return window.sparkCore.setSkillTreeFocus(focus);
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "skill_tree",
      activeTab: S.tab || null,
      skillTreeFocus: focus || "overview"
    });
  }
  return null;
}

function openStemPlayerRequest() {
  if (window.sparkCore && typeof window.sparkCore.openStemPlayer === "function") {
    return window.sparkCore.openStemPlayer();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "stems",
      activeTab: "songs",
      songsSubTab: "stems"
    });
  }
  return null;
}

function closeStemPlayerRequest() {
  if (window.sparkCore && typeof window.sparkCore.closeStemPlayer === "function") {
    return window.sparkCore.closeStemPlayer();
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: "songs",
      songsSubTab: "stems",
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function returnFromUtilityFamilyRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.returnFromUtilityFamily === "function") {
    return window.sparkCore.returnFromUtilityFamily(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function") {
    return window.sparkCore.updateRuntimeState({
      activeScreen: "home",
      activeTab: S.tab || null,
      transport: { status: "idle", positionMs: 0 }
    });
  }
  return null;
}

function applyDashboardChallengeRewardRequest(challengeId) {
  if (window.sparkCore && typeof window.sparkCore.applyDashboardChallengeReward === "function") {
    return window.sparkCore.applyDashboardChallengeReward(challengeId);
  }
  return null;
}

function completeSongSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeSongSession === "function") {
    return window.sparkCore.completeSongSession(options || {});
  }
  return syncSongRuntimeRequest("complete", options || {});
}

function completeGuidedSessionRequest(options) {
  if (window.sparkCore && typeof window.sparkCore.completeGuidedSession === "function") {
    return window.sparkCore.completeGuidedSession(options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
    var result = window.sparkCore.completeSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      markPlanComplete: true
    });
    if (typeof window.sparkCore.syncGuidedRuntimeState === "function") {
      window.sparkCore.syncGuidedRuntimeState({
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
  if (window.sparkCore && typeof window.sparkCore.applyGuidedNavigationRequest === "function") {
    return window.sparkCore.applyGuidedNavigationRequest(target, options || {});
  }
  if (window.sparkCore && typeof window.sparkCore.syncGuidedRuntimeState === "function") {
    if (target === "guided_home") {
      return window.sparkCore.syncGuidedRuntimeState({
        activeScreen: "home",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    if (target === "guided_done") {
      return window.sparkCore.syncGuidedRuntimeState({
        activeScreen: "guided_done",
        guidedStep: null,
        guidedNewMovePhase: null,
        transport: { status: "completed", positionMs: 0 }
      });
    }
  }
  return null;
}
