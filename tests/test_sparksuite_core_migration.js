var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var lastProgressEvent = null;

function test(name, fn) {
  try {
    resetState();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    completedLessons: [],
    mastery: { lessons: {}, rhythm: {} },
    practiceHistory: [],
    practicePlanHistory: [],
    practicePlanComplete: false,
    practicePlanFocus: "",
    practicePlan: null,
    practicePlanDate: null,
    activeSessionPlanId: null,
    xp: 0,
    guidedSession: 1,
    completedGuidedSessions: [],
    chordProgress: {},
    adaptiveState: {},
    weakSpots: {},
    performArrangementType: "chords",
    performDifficulty: "normal"
  };
  global.saveStateCalls = 0;
  global.saveState = function() { saveStateCalls++; };
  var guidedSessions = [
    {
      num: 1,
      title: "First Spark",
      level: 1,
      bpm: 70,
      spark: { text: "Start here" },
      newMove: { chord: "C" }
    },
    {
      num: 2,
      title: "Second Spark",
      level: 1,
      bpm: 75,
      spark: { text: "Keep going" },
      newMove: { chord: "G" }
    }
  ];
  var songs = [
    { title: "Fire Road", artist: "Spark Suite" },
    { title: "Night Drive", artist: "Spark Suite" }
  ];
  global.buildPracticeCandidates = function() {
    return [
      { id: "warmup_1", type: "warmup", label: "Quick warmup", reason: "Start loose", meta: { durationSec: 120 } },
      { id: "transition_1", type: "transition", label: "Practice G to C", reason: "Weak transition", meta: { key: "G|C", from: "G", to: "C" } }
    ];
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return [{ num: 1, title: "First Spark" }]; },
    getCurriculum: function() { return { SESSIONS: guidedSessions }; },
    getSongs: function() { return songs; }
  };
  global.SparkSession = {
    processResults: function() {
      return {
        xpEarned: 30,
        jackpot: false,
        leveledUp: false
      };
    }
  };
  global.SparkProgressOrchestrator = {
    evaluateAll: function(evt) {
      lastProgressEvent = evt;
      return {};
    }
  };
  global.SparkPsychology = {
    shouldReward: function() { return false; }
  };
  global.updateWeakSpotsFromPerformance = function() {};
  global.updateAdaptiveFromResult = function() {};
  global.checkLessonUnlockRules = function() { return true; };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    if (rootLessonId === "uke_01") {
      var order = ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05"];
      for (var i = 0; i < order.length; i++) {
        if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
      }
      return null;
    }
    return rootLessonId;
  };
  lastProgressEvent = null;
}

resetState();

eval(loadJS("js/sparksuite/domain/types.js"));
eval(loadJS("js/sparksuite/domain/session_segment.js"));
eval(loadJS("js/sparksuite/domain/session.js"));
eval(loadJS("js/sparksuite/domain/tempo_map.js"));
eval(loadJS("js/sparksuite/domain/note_event.js"));
eval(loadJS("js/sparksuite/domain/phrase.js"));
eval(loadJS("js/sparksuite/domain/chart.js"));
eval(loadJS("js/sparksuite/domain/gameplay_result.js"));
eval(loadJS("js/sparksuite/domain/engine_preset.js"));
eval(loadJS("js/sparksuite/bridges/practice_bridge.js"));
eval(loadJS("js/sparksuite/bridges/curriculum_bridge.js"));
eval(loadJS("js/sparksuite/bridges/progress_bridge.js"));
eval(loadJS("js/sparksuite/bridges/performance_bridge.js"));
eval(loadJS("js/sparksuite/core/calibration_engine.js"));
eval(loadJS("js/sparksuite/core/timing_engine.js"));
eval(loadJS("js/sparksuite/core/chart_io.js"));
eval(loadJS("js/sparksuite/core/replay_engine.js"));
eval(loadJS("js/sparksuite/core/input_judge.js"));
eval(loadJS("js/sparksuite/core/scoring_engine.js"));
eval(loadJS("js/sparksuite/core/rhythm_gameplay_engine.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_skill_tree.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_chords.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_scales.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_tuning.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_progression.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_adapter.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/index.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_adapter.js"));
eval(loadJS("js/sparksuite/instruments/bass/index.js"));
eval(loadJS("js/sparksuite/instruments/piano/piano_adapter.js"));
eval(loadJS("js/sparksuite/instruments/piano/index.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/index.js"));
eval(loadJS("js/sparksuite/core/storage.js"));
eval(loadJS("js/sparksuite/core/ai_engine.js"));
eval(loadJS("js/sparksuite/core/instrument_manager.js"));
eval(loadJS("js/sparksuite/core/psychology_engine.js"));
eval(loadJS("js/sparksuite/core/curriculum_engine.js"));
eval(loadJS("js/sparksuite/core/practice_engine.js"));
eval(loadJS("js/sparksuite/core/progress_engine.js"));
eval(loadJS("js/sparksuite/core/session_engine.js"));
eval(loadJS("js/sparksuite/core/spark_core.js"));

console.log("\n--- SparkSuite Core Migration ---");

test("startSession returns a SessionPlan and syncs the legacy practice plan", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(plan.segments.length, 2);
  assert.ok(S.practicePlan);
  assert.strictEqual(S.practicePlan.items.length, 2);
  assert.strictEqual(S.practicePlan.curriculum.nextLessonId, "session_1");
});

test("SparkCore exposes engine-owned runtime state for active session context", function() {
  var core = createDefaultSparkCore();
  var initialState = core.getRuntimeState();

  assert.strictEqual(initialState.activeFlow, null);
  assert.strictEqual(initialState.transport.status, "idle");

  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  var runtimeState = core.getRuntimeState();
  var view = core.getActiveSessionView();

  assert.strictEqual(runtimeState.activeFlow, "daily_practice");
  assert.strictEqual(runtimeState.activeInstrumentId, "chordspark");
  assert.strictEqual(runtimeState.activeInstrumentType, "guitar");
  assert.strictEqual(runtimeState.activePlanId, plan.id);
  assert.strictEqual(runtimeState.activeSegmentId, plan.segments[0].id);
  assert.strictEqual(runtimeState.activeScreen, "daily_practice");
  assert.strictEqual(runtimeState.transport.status, "ready");
  assert.strictEqual(runtimeState.transport.positionMs, 0);
  assert.strictEqual(view.plan, plan);
  assert.strictEqual(view.runtimeState, runtimeState);
  assert.strictEqual(view.lastSessionOutcome, null);
});

test("SparkCore runtime state tracks manual patches and completion summaries", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  core.updateRuntimeState({
    activeSegmentId: plan.segments[1].id,
    transport: { status: "running", positionMs: 6400 }
  });

  var midState = core.getRuntimeState();
  assert.strictEqual(midState.activeSegmentId, plan.segments[1].id);
  assert.strictEqual(midState.transport.status, "running");
  assert.strictEqual(midState.transport.positionMs, 6400);

  core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[0].id });
  var result = core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[1].id });
  var completedState = core.getRuntimeState();

  assert.strictEqual(completedState.transport.status, "completed");
  assert.strictEqual(completedState.lastCompletedSessionId, plan.id);
  assert.strictEqual(completedState.lastCompletedFlow, "daily_practice");
  assert.strictEqual(completedState.lastOutcomeSummary.sessionId, plan.id);
  assert.strictEqual(completedState.lastOutcomeSummary.xpAwarded, result.xpAwarded);
});

test("SparkCore can track guided runtime step and phase state explicitly", function() {
  var core = createDefaultSparkCore();
  core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });

  core.syncGuidedRuntimeState({
    guidedStep: "newMove",
    guidedNewMovePhase: "shadow",
    transport: { status: "running", positionMs: 18000 }
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeFlow, "guided_session");
  assert.strictEqual(state.activeScreen, "guided_session");
  assert.strictEqual(state.guidedStep, "newMove");
  assert.strictEqual(state.guidedNewMovePhase, "shadow");
  assert.strictEqual(state.transport.status, "running");
  assert.strictEqual(state.transport.positionMs, 18000);
});

test("SparkCore can mirror performance runtime state explicitly", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  core.syncPerformanceRuntimeState("start", {
    chartId: "night_drive_chart",
    difficulty: "hard",
    arrangementType: "rhythm_chords",
    speed: 0.75,
    mode: "midi",
    countIn: true
  });
  core.syncPerformanceRuntimeState("tick", { sec: 12.4, status: "running" });
  core.syncPerformanceRuntimeState("set_loop", { loop: { startSec: 10, endSec: 14, phraseId: "phrase_2" } });

  var runningState = core.getRuntimeState();
  assert.strictEqual(runningState.activeFlow, "performance_song");
  assert.strictEqual(runningState.activeScreen, "perform");
  assert.strictEqual(runningState.performanceChartId, "night_drive_chart");
  assert.strictEqual(runningState.performanceDifficultyId, "hard");
  assert.strictEqual(runningState.performanceArrangementType, "rhythm_chords");
  assert.strictEqual(runningState.performanceSpeed, 0.75);
  assert.strictEqual(runningState.performanceInputMode, "midi");
  assert.strictEqual(runningState.transport.status, "running");
  assert.strictEqual(runningState.transport.positionMs, 12400);
  assert.deepStrictEqual(runningState.performanceLoop, { startSec: 10, endSec: 14, phraseId: "phrase_2" });

  core.syncPerformanceRuntimeState("pause");
  assert.strictEqual(core.getRuntimeState().transport.status, "paused");

  core.syncPerformanceRuntimeState("finish", { screen: "perform_done" });
  var finishedState = core.getRuntimeState();
  assert.strictEqual(finishedState.activeScreen, "perform_done");
  assert.strictEqual(finishedState.transport.status, "completed");
  assert.strictEqual(finishedState.performanceLoop, null);
});

test("SparkCore retains performance result payload for result-screen consumers", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  core.syncPerformanceRuntimeState("finish", {
    screen: "perform_done",
    results: {
      title: "Night Drive",
      artist: "Spark Suite",
      score: 1234,
      accuracy: 88,
      stars: 4
    }
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeScreen, "perform_done");
  assert.strictEqual(state.performanceResults.title, "Night Drive");
  assert.strictEqual(state.performanceResults.score, 1234);
  assert.strictEqual(state.performanceResults.accuracy, 88);
});

test("SparkCore can mirror performance runtime configuration changes", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "normal"
  });

  core.syncPerformanceRuntimeState("configure", {
    difficulty: "pro",
    speed: 0.5,
    mode: "mic",
    preset: "guitar_solo"
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.performanceDifficultyId, "pro");
  assert.strictEqual(state.performanceSpeed, 0.5);
  assert.strictEqual(state.performanceInputMode, "mic");
  assert.strictEqual(state.performancePracticePreset, "guitar_solo");
});

test("SparkCore can track performance screen transitions for stats, editor, and calibration", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  core.syncPerformanceRuntimeState("open_stats");
  var statsState = core.getRuntimeState();
  assert.strictEqual(statsState.activeScreen, "performance_stats");
  assert.strictEqual(statsState.transport.status, "idle");

  core.syncPerformanceRuntimeState("open_editor");
  var editorState = core.getRuntimeState();
  assert.strictEqual(editorState.activeScreen, "performance_editor");
  assert.strictEqual(editorState.transport.status, "idle");

  core.syncPerformanceRuntimeState("open_calibration", { source: "mic" });
  var calibrationScreenState = core.getRuntimeState();
  assert.strictEqual(calibrationScreenState.activeScreen, "perform_calibration");
  assert.strictEqual(calibrationScreenState.performanceCalibrationSource, "mic");
  assert.strictEqual(calibrationScreenState.performanceCalibrationMode, false);

  // calibration_source: standalone source change
  core.syncPerformanceRuntimeState("calibration_source", { source: "midi" });
  var sourceChangedState = core.getRuntimeState();
  assert.strictEqual(sourceChangedState.performanceCalibrationSource, "midi");
  assert.strictEqual(sourceChangedState.activeScreen, "perform_calibration");

  // switch back to mic for remaining calibration tests
  core.syncPerformanceRuntimeState("calibration_source", { source: "mic" });
  assert.strictEqual(core.getRuntimeState().performanceCalibrationSource, "mic");

  core.syncPerformanceRuntimeState("calibration_start");
  var calibrationRunningState = core.getRuntimeState();
  assert.strictEqual(calibrationRunningState.performanceCalibrationMode, true);
  assert.strictEqual(calibrationRunningState.transport.status, "calibrating");
  assert.strictEqual(calibrationRunningState.performanceCalibrationSource, "mic");

  core.syncPerformanceRuntimeState("calibration_stop");
  var calibrationStoppedState = core.getRuntimeState();
  assert.strictEqual(calibrationStoppedState.performanceCalibrationMode, false);
  assert.strictEqual(calibrationStoppedState.transport.status, "idle");

  // calibration_reset: distinct from stop — preserves source, resets mode
  core.syncPerformanceRuntimeState("calibration_start");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  core.syncPerformanceRuntimeState("calibration_reset");
  var calibrationResetState = core.getRuntimeState();
  assert.strictEqual(calibrationResetState.performanceCalibrationMode, false);
  assert.strictEqual(calibrationResetState.transport.status, "idle");
  assert.strictEqual(calibrationResetState.activeScreen, "perform_calibration");
  assert.strictEqual(calibrationResetState.performanceCalibrationSource, "mic");

  // start action clears calibrationMode
  core.syncPerformanceRuntimeState("calibration_start");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  core.syncPerformanceRuntimeState("start", { chartId: "night_drive_chart" });
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, false);

  core.syncPerformanceRuntimeState("close_editor", { screen: "home" });
  var homeState = core.getRuntimeState();
  assert.strictEqual(homeState.activeScreen, "home");
});

test("SparkCore can mirror performance song selection state explicitly", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeFlow, "performance_song");
  assert.strictEqual(state.activeScreen, "performance_song");
  assert.strictEqual(state.performanceChartId, "night_drive");
  assert.strictEqual(state.performanceArrangementType, "rhythm_chords");
  assert.strictEqual(state.performanceDifficultyId, "hard");
  assert.strictEqual(state.transport.status, "ready");
  assert.strictEqual(state.transport.positionMs, 0);
});

test("SparkCore runtime state can track shell navigation back to home tabs", function() {
  var core = createDefaultSparkCore();
  core.updateRuntimeState({
    activeScreen: "perform_done",
    activeTab: "songs",
    transport: { status: "completed", positionMs: 22000 }
  });

  var state = core.updateRuntimeState({
    activeScreen: "home",
    activeTab: "practice",
    transport: { status: "idle", positionMs: 0 }
  });

  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.activeTab, "practice");
  assert.strictEqual(state.transport.status, "idle");
  assert.strictEqual(state.transport.positionMs, 0);
});

test("SparkCore guided runtime state can transition from done screen back to home", function() {
  var core = createDefaultSparkCore();
  core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });
  core.syncGuidedRuntimeState({
    activeScreen: "guided_done",
    guidedStep: null,
    guidedNewMovePhase: null,
    transport: { status: "completed", positionMs: 0 }
  });
  var state = core.syncGuidedRuntimeState({
    activeScreen: "home",
    guidedStep: null,
    guidedNewMovePhase: null,
    transport: { status: "idle", positionMs: 0 }
  });

  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkPracticeBridge can project active session plans into legacy practice-plan shape", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  var projected = SparkPracticeBridge.toLegacyPlan(plan);

  assert.strictEqual(projected.id, plan.id);
  assert.strictEqual(projected.flow, "daily_practice");
  assert.strictEqual(projected.focus, plan.focus);
  assert.strictEqual(projected.items.length, plan.segments.length);
  assert.strictEqual(projected.items[0].id, plan.segments[0].id);
  assert.strictEqual(projected.items[0].label, plan.segments[0].label);
  assert.strictEqual(projected.completedItems, 0);
});

test("completeSession marks a single session segment complete through progress engine", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[0].id,
    result: {
      exerciseId: "transition_1",
      accuracy: 0.72,
      transitions: { "G->C": 0.72 },
      phrases: [{ id: "phrase_1", accuracy: 0.66 }]
    }
  });

  assert.strictEqual(result.completedItems, 1);
  assert.strictEqual(S.practicePlan.items[0].completed, true);
  assert.strictEqual(S.practicePlanComplete, false);
  assert.ok(result.itemResultSummary);
  assert.strictEqual(result.itemResultSummary.practiceResult.exerciseId, "transition_1");
  assert.strictEqual(result.itemResultSummary.adaptiveUpdate.exerciseId, "transition_1");
  assert.strictEqual(S.adaptiveState.transition_1.accuracy, 0.72);
  assert.strictEqual(S.practiceHistory.length, 1);
  assert.strictEqual(S.practiceHistory[0].exerciseId, "transition_1");
  assert.strictEqual(S.weakSpots.transitions["G->C"].attempts, 1);
  assert.strictEqual(S.weakSpots.phrases.phrase_1.attempts, 1);
});

test("completeSession finalizes the migrated daily plan and awards completion progress", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[0].id });
  var result = core.completeSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, itemId: plan.segments[1].id });

  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.xpAwarded, 20);
  assert.strictEqual(result.completionSummary.sessionId, plan.id);
  assert.strictEqual(result.completionSummary.flow, "daily_practice");
  assert.strictEqual(result.completionSummary.focus, plan.focus);
  assert.strictEqual(result.completionSummary.itemCount, 2);
  assert.strictEqual(S.practicePlanComplete, true);
  assert.strictEqual(S.xp, 20);
  assert.strictEqual(S.practicePlanHistory.length, 1);
  assert.strictEqual(S.practicePlanHistory[0].sessionId, plan.id);
  assert.strictEqual(S.practicePlanHistory[0].flow, "daily_practice");
  assert.ok(lastProgressEvent);
  assert.strictEqual(lastProgressEvent.xpAwarded, 20);
});

test("completeSession returns engine-owned rhythm learning summary while bridge syncs legacy mastery state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    markPlanComplete: true,
    gameplayResult: {
      gameplay: { accuracy: 0.5 },
      learning: {
        skills: [{ id: "gtr_alt_strum_basic", delta: 0.08 }],
        weakAreas: ["late_strums"]
      }
    }
  });

  assert.strictEqual(result.xpAwarded, 30);
  assert.deepStrictEqual(result.sessionStatePatch.mastery.rhythm, { gtr_alt_strum_basic: 8 });
  assert.deepStrictEqual(result.sessionStatePatch.weakSpots.rhythmHighway, ["late_strums"]);
  assert.strictEqual(result.completionSummary.flow, "daily_practice");
  assert.strictEqual(result.completionSummary.xpAwarded, 30);
  assert.strictEqual(core.getLastSessionOutcome(), result);
  assert.strictEqual(S.mastery.rhythm.gtr_alt_strum_basic, 8);
  assert.deepStrictEqual(S.weakSpots.rhythmHighway, ["late_strums"]);
});

test("startSession routes guided sessions through core and syncs guided state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 2 });
  var view = core.getActiveSessionView();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "guided_session");
  assert.strictEqual(plan.segments.length, 1);
  assert.strictEqual(view.plan.context.guidedPlan.title, "Second Spark");
  assert.strictEqual(view.runtimeState.activeScreen, "guided_session");
  assert.strictEqual(S.guidedSession, 2);
  assert.strictEqual(S.guidedPlan.title, "Second Spark");
  assert.strictEqual(S.guidedStep, "spark");
});

test("completeSession advances guided progress without mutating the daily practice plan", function() {
  var core = createDefaultSparkCore();
  core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
  core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });

  var result = core.completeSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, markPlanComplete: true });

  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.xpAwarded, 30);
  assert.deepStrictEqual(result.sessionStatePatch.guided.completedSessionNums, [1]);
  assert.strictEqual(result.sessionStatePatch.guided.nextGuidedSession, 2);
  assert.strictEqual(result.sessionStatePatch.guided.chordProgress.C, 25);
  assert.deepStrictEqual(S.completedGuidedSessions, [1]);
  assert.strictEqual(S.guidedSession, 2);
  assert.strictEqual(S.chordProgress.C, 25);
  assert.ok(S.practicePlan);
  assert.strictEqual(S.practicePlan.items.length, 2);
});

test("startSession routes performance song selection through core and syncs the legacy song state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });
  var view = core.getActiveSessionView();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "performance_song");
  assert.strictEqual(plan.segments.length, 1);
  assert.strictEqual(view.plan.context.performanceSong.songId, "night_drive");
  assert.strictEqual(view.runtimeState.performanceArrangementType, "rhythm_chords");
  assert.strictEqual(view.runtimeState.performanceDifficultyId, "hard");
  assert.strictEqual(S.performSongId, "night_drive");
  assert.strictEqual(S.performSongData.title, "Night Drive");
  assert.strictEqual(S.performArrangementType, "rhythm_chords");
  assert.strictEqual(S.performDifficulty, "hard");
});

test("createDefaultSparkCore registers ukulele and builds a ukulele-ready practice context", function() {
  SparkInstrumentAdapter = {
    getAppId: function() { return "ukespark"; },
    getInstrumentType: function() { return "ukulele"; },
    getCurriculumMap: function() { return SparkUkuleleLessons; },
    getCurriculum: function() { return { SESSIONS: SparkUkuleleLessons }; },
    getSongs: function() { return SparkUkuleleModule.getSongs(); }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.strictEqual(context.instrumentType, "ukulele");
  assert.ok(context.adapter);
  assert.strictEqual(context.curriculumMap[0].id, "uke_01");
  assert.ok(context.rhythmAdapter);
  assert.strictEqual(context.rhythmAdapter.getLaneCount(), 4);
  assert.strictEqual(plan.segments.length, 2);
  assert.strictEqual(S.practicePlan.curriculum.nextLessonId, "uke_01");
});

test("ukulele rhythm adapter selects richer chart variants as lessons progress", function() {
  var adapter = new SparkUkuleleRhythmAdapter();
  var switchingPayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_03" }
  });
  var patternPayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_04" }
  });

  assert.strictEqual(switchingPayload.chartId, "uke_switch_flow_01");
  assert.strictEqual(patternPayload.chartId, "uke_island_pattern_01");
  assert.ok(patternPayload.songChart.tracks.guitar.notes.length >= 8);
});

test("createDefaultSparkCore registers piano as a first-class instrument adapter", function() {
  var pianoSongs = [
    { title: "Midnight Train", artist: "Piano Suite" },
    { title: "River Walk", artist: "Piano Suite" }
  ];
  var pianoSessions = [
    { num: 1, title: "Piano Spark 1", spark: { text: "Start" }, newMove: { chord: "C" } },
    { num: 2, title: "Piano Spark 2", spark: { text: "Continue" }, newMove: { chord: "G" } }
  ];

  SparkInstrumentAdapter = {
    getAppId: function() { return "pianospark"; },
    getInstrumentType: function() { return "piano"; },
    getCurriculumMap: function() { return [{ num: 1, title: "White Keys Only" }]; },
    getCurriculum: function() { return { SESSIONS: pianoSessions }; },
    getSongs: function() { return pianoSongs; }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var performancePlan = core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songIndex: 1,
    arrangementType: "melody",
    difficultyId: "pro"
  });

  assert.ok(context.adapter);
  assert.strictEqual(context.instrumentType, "piano");
  assert.strictEqual(context.adapter.getType(), "piano");
  assert.strictEqual(context.curriculumMap[0].title, "White Keys Only");
  assert.strictEqual(context.songs[1].title, "River Walk");
  assert.strictEqual(performancePlan.context.performanceSong.songId, "river_walk");
  assert.strictEqual(S.performSongData.title, "River Walk");
  assert.strictEqual(S.performArrangementType, "melody");
  assert.strictEqual(S.performDifficulty, "pro");
});

test("createDefaultSparkCore registers bass as a first-class instrument adapter", function() {
  var bassSongs = [
    { title: "Low Tide", artist: "Bass Suite" },
    { title: "Deep Pulse", artist: "Bass Suite" }
  ];
  var bassSessions = [
    { num: 1, title: "Bass Spark 1", spark: { text: "Groove" }, newMove: { chord: "E" } },
    { num: 2, title: "Bass Spark 2", spark: { text: "Lock in" }, newMove: { chord: "A" } }
  ];

  SparkInstrumentAdapter = {
    getAppId: function() { return "bassspark"; },
    getInstrumentType: function() { return "bass"; },
    getCurriculumMap: function() { return [{ num: 1, title: "Low End Basics" }]; },
    getCurriculum: function() { return { SESSIONS: bassSessions }; },
    getSongs: function() { return bassSongs; }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var performancePlan = core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songIndex: 0,
    arrangementType: "groove",
    difficultyId: "hard"
  });

  assert.ok(context.adapter);
  assert.strictEqual(context.instrumentType, "bass");
  assert.strictEqual(context.adapter.getType(), "bass");
  assert.strictEqual(context.curriculumMap[0].title, "Low End Basics");
  assert.strictEqual(context.songs[0].title, "Low Tide");
  assert.strictEqual(performancePlan.context.performanceSong.songId, "low_tide");
  assert.strictEqual(S.performSongData.title, "Low Tide");
  assert.strictEqual(S.performArrangementType, "groove");
  assert.strictEqual(S.performDifficulty, "hard");
});

test("completeSession routes performance completion rewards through core", function() {
  var core = createDefaultSparkCore();
  core.startSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    songId: "night_drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
    markPlanComplete: true,
    performanceResults: {
      accuracy: 88,
      stars: 4,
      score: 1234
    }
  });

  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.xpAwarded, 9);
  assert.strictEqual(result.performanceSummary.songId, "night_drive");
  assert.strictEqual(result.performanceSummary.arrangementType, "rhythm_chords");
  assert.strictEqual(result.performanceSummary.difficultyId, "hard");
  assert.strictEqual(result.performanceSummary.accuracy, 88);
  assert.strictEqual(result.performanceSummary.stars, 4);
  assert.strictEqual(S.xp, 9);
  assert.strictEqual(S.xpToast.amount, 9);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
