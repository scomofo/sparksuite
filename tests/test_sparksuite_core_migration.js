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
    cloudAuth: {
      userId: null,
      email: null,
      token: null,
      loggedIn: false
    },
    cloudSync: {
      lastSyncStatus: "idle",
      lastSyncAt: null,
      dirtyKeys: []
    },
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
  global.SparkInstruments = {
    getActive: function() { return null; },
    getAll: function() { return []; }
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

// Shared utility helpers — pages/*.js wrappers delegate to SparkNormalize.
// Loaded the same way as the page modules below (matches the test's
// existing bootstrapping pattern).
var _eval = eval;
_eval(loadJS("js/utils/normalize.js"));

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
eval(loadJS("js/instruments/bass/data.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_module.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_adapter.js"));
eval(loadJS("js/sparksuite/instruments/bass/index.js"));
eval(loadJS("js/sparksuite/instruments/piano/piano_adapter.js"));
eval(loadJS("js/sparksuite/instruments/piano/index.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/index.js"));
eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
eval(loadJS("js/curriculum/curriculum_v2.js"));
eval(loadJS("js/curriculum/curriculum_v2_legacy_adapter.js"));
eval(loadJS("js/sparksuite/core/storage.js"));
eval(loadJS("js/sparksuite/core/ai_engine.js"));
eval(loadJS("js/sparksuite/core/instrument_manager.js"));
eval(loadJS("js/sparksuite/core/psychology_engine.js"));
eval(loadJS("js/sparksuite/core/curriculum_engine.js"));
eval(loadJS("js/sparksuite/core/practice_engine.js"));
eval(loadJS("js/sparksuite/core/progress_engine.js"));
eval(loadJS("js/sparksuite/core/session_engine.js"));
eval(loadJS("js/sparksuite/core/execution_gateway.js"));
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

test("createDefaultSparkCore installs explicit default execution gateway handlers", function() {
  var practiceCaptured = null;
  var songCaptured = null;
  var core;

  SparkExecutionGateway.clearHandlers();
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    practiceCaptured = { payload: payload, options: options };
    return true;
  };
  global.startPerformance = function(target, options) {
    songCaptured = { target: target, options: options };
    return true;
  };

  core = createDefaultSparkCore();

  assert.ok(core);
  assert.strictEqual(
    SparkExecutionGateway.runDirectExercise({
      type: "practice",
      gameplayPayload: { adapterType: "pianospark" },
      instrument: "pianospark"
    }, { source: "gateway_bootstrap_practice" }),
    true
  );
  assert.ok(practiceCaptured);
  assert.strictEqual(practiceCaptured.options.instrument, "pianospark");

  assert.strictEqual(
    SparkExecutionGateway.runDirectExercise("gateway_bootstrap_song", { source: "gateway_bootstrap_song" }),
    true
  );
  assert.ok(songCaptured);
  assert.strictEqual(songCaptured.target, "gateway_bootstrap_song");
  assert.deepStrictEqual(SparkExecutionGateway.getMissingHandlerReport(), {});

  delete global.startPlayableRhythmHighwayPayload;
  delete global.startPerformance;
});

test("daily practice plans preserve segment labels when projected back to legacy state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.ok(Array.isArray(plan.exercises));
  assert.strictEqual(plan.segments[0].label, "Quick warmup");
  assert.strictEqual(plan.segments[1].label, "Practice G to C");
  assert.ok(S.practicePlan.items.every(function(item) {
    return typeof item.label === "string" && item.label.length > 0;
  }));
  assert.strictEqual(S.practicePlan.items[0].label, "Quick warmup");
  assert.strictEqual(S.practicePlan.items[1].label, "Practice G to C");
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

test("startPracticeFromLesson prefers the active instrument type over the app id for rhythm launches", function() {
  var core = createDefaultSparkCore();
  var captured = null;
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };

  core.updateRuntimeState({
    activeInstrumentId: "pianospark",
    activeInstrumentType: "piano"
  });

  var launched = core.startPracticeFromLesson({
    type: "timing",
    tempo: 90,
    label: "Timing Drill"
  });

  assert.strictEqual(launched, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.source, "lesson_generator");
  assert.strictEqual(captured.options.label, "Timing Drill");
  assert.strictEqual(captured.options.instrument, "piano");

  delete global.startPlayableRhythmHighwayPayload;
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

test("SparkCore can open and complete daily practice through explicit helpers", function() {
  var core = createDefaultSparkCore();
  var plan = core.openDailyPracticePlan();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(core.getRuntimeState().activeScreen, "daily_practice");

  var rebuiltPlan = core.openDailyPracticePlan({ forceRebuild: true });
  assert.ok(rebuiltPlan instanceof SessionPlan);
  assert.notStrictEqual(rebuiltPlan.id, plan.id);

  var completionResult = core.completeDailyPracticePlan();
  assert.strictEqual(completionResult.planCompleted, true);
  assert.strictEqual(core.getRuntimeState().transport.status, "completed");
});

test("SparkCore can open daily practice from dashboard through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var plan = core.openDashboardPracticePlan();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(core.getRuntimeState().activeScreen, "daily_practice");
});

test("SparkCore can open the practice plan screen through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var plan = core.openPracticePlanScreen();

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "daily_practice");
  assert.strictEqual(core.getRuntimeState().activeScreen, "practice_plan");
  assert.strictEqual(core.getRuntimeState().activeTab, "practice");
});

test("SparkCore can open legacy practice session and drill runtime explicitly", function() {
  var core = createDefaultSparkCore();

  var sessionState = core.openLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });
  assert.strictEqual(sessionState.activeFlow, "legacy_practice_session");
  assert.strictEqual(sessionState.activeScreen, "session");
  assert.strictEqual(sessionState.activeTab, "practice");
  assert.strictEqual(sessionState.legacyPracticeMode, "chord");
  assert.strictEqual(sessionState.legacyPracticeChordName, "C");
  assert.strictEqual(sessionState.legacyPracticeDurationSec, 120);
  assert.strictEqual(sessionState.transport.status, "running");

  var drillState = core.openLegacyPracticeDrill({
    durationSec: 60,
    chordNames: ["C", "G"]
  });
  assert.strictEqual(drillState.activeFlow, "legacy_practice_drill");
  assert.strictEqual(drillState.activeScreen, "drill");
  assert.strictEqual(drillState.activeTab, "practice");
  assert.strictEqual(drillState.legacyPracticeMode, "drill");
  assert.deepStrictEqual(drillState.legacyDrillChordNames, ["C", "G"]);
  assert.strictEqual(drillState.legacyPracticeDurationSec, 60);
  assert.strictEqual(drillState.transport.status, "running");

  var fingerState = core.openLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 0
  });
  assert.strictEqual(fingerState.activeFlow, "legacy_finger_exercise");
  assert.strictEqual(fingerState.activeTab, "practice");
  assert.strictEqual(fingerState.legacyPracticeMode, "finger_exercise");
  assert.strictEqual(fingerState.legacyPracticeDurationSec, 90);
  assert.strictEqual(fingerState.legacyPracticeRemainingSec, 90);
  assert.strictEqual(fingerState.legacyFingerExerciseId, "spider_walk");
  assert.strictEqual(fingerState.legacyFingerExerciseActive, true);
  assert.strictEqual(fingerState.transport.status, "running");

  var completedFingerState = core.completeLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 3
  });
  assert.strictEqual(completedFingerState.activeFlow, "legacy_finger_exercise");
  assert.strictEqual(completedFingerState.legacyFingerExerciseId, "spider_walk");
  assert.strictEqual(completedFingerState.legacyFingerExerciseActive, false);
  assert.strictEqual(completedFingerState.legacyFingerExerciseCount, 3);
  assert.strictEqual(completedFingerState.legacyPracticeRemainingSec, 0);
  assert.strictEqual(completedFingerState.transport.status, "completed");

  var completedSessionState = core.completeLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });
  assert.strictEqual(completedSessionState.activeScreen, "complete");
  assert.strictEqual(completedSessionState.transport.status, "completed");
  assert.strictEqual(completedSessionState.legacyPracticeChordName, "C");

  var completedDrillState = core.completeLegacyPracticeDrill({
    durationSec: 60,
    chordNames: ["C", "G"]
  });
  assert.strictEqual(completedDrillState.activeScreen, "drill_done");
  assert.strictEqual(completedDrillState.transport.status, "completed");
  assert.deepStrictEqual(completedDrillState.legacyDrillChordNames, ["C", "G"]);

  var returnedState = core.returnFromLegacyPracticeFamily({ activeTab: "practice" });
  assert.strictEqual(returnedState.activeScreen, "home");
  assert.strictEqual(returnedState.activeTab, "practice");
  assert.strictEqual(returnedState.transport.status, "idle");

  var repeatedSessionState = core.repeatLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });
  assert.strictEqual(repeatedSessionState.activeScreen, "session");
  assert.strictEqual(repeatedSessionState.transport.status, "running");
  assert.strictEqual(repeatedSessionState.legacyPracticeChordName, "C");

  var repeatedDrillState = core.repeatLegacyPracticeDrill({
    durationSec: 60,
    chordNames: ["C", "G"]
  });
  assert.strictEqual(repeatedDrillState.activeScreen, "drill");
  assert.strictEqual(repeatedDrillState.transport.status, "running");
  assert.deepStrictEqual(repeatedDrillState.legacyDrillChordNames, ["C", "G"]);
});

test("SparkCore can sync legacy practice runtime countdown and pause state explicitly", function() {
  var core = createDefaultSparkCore();

  core.openLegacyPracticeSession({
    mode: "chord",
    chordName: "C",
    durationSec: 120
  });

  var tickState = core.syncLegacyPracticeRuntimeState("tick", {
    remainingSec: 91,
    timerActive: true
  });
  assert.strictEqual(tickState.legacyPracticeRemainingSec, 91);
  assert.strictEqual(tickState.legacyPracticeTimerActive, true);
  assert.strictEqual(tickState.transport.status, "running");

  var pauseState = core.syncLegacyPracticeRuntimeState("pause", {
    remainingSec: 91
  });
  assert.strictEqual(pauseState.legacyPracticeRemainingSec, 91);
  assert.strictEqual(pauseState.legacyPracticeTimerActive, false);
  assert.strictEqual(pauseState.transport.status, "paused");

  var resumeState = core.syncLegacyPracticeRuntimeState("resume", {
    remainingSec: 91
  });
  assert.strictEqual(resumeState.legacyPracticeTimerActive, true);
  assert.strictEqual(resumeState.transport.status, "running");
});

test("SparkCore can sync ear training runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var openState = core.openLegacyEarTraining({
    question: "C Major",
    options: ["C Major", "G Major", "A Minor"],
    answer: null,
    score: 1,
    total: 2,
    streak: 1
  });
  assert.strictEqual(openState.activeFlow, "legacy_ear_training");
  assert.strictEqual(openState.activeScreen, "home");
  assert.strictEqual(openState.activeTab, "ear");
  assert.strictEqual(openState.legacyEarTrainQuestion, "C Major");
  assert.deepStrictEqual(openState.legacyEarTrainOptions, ["C Major", "G Major", "A Minor"]);
  assert.strictEqual(openState.legacyEarTrainAnswer, null);
  assert.strictEqual(openState.legacyEarTrainScore, 1);
  assert.strictEqual(openState.legacyEarTrainTotal, 2);
  assert.strictEqual(openState.legacyEarTrainStreak, 1);

  var questionState = core.syncLegacyEarTrainingRuntimeState({
    question: "C Major",
    options: ["C Major", "G Major", "A Minor"],
    answer: null
  });
  assert.strictEqual(questionState.activeFlow, "legacy_ear_training");
  assert.strictEqual(questionState.activeScreen, "home");
  assert.strictEqual(questionState.activeTab, "ear");
  assert.strictEqual(questionState.legacyEarTrainQuestion, "C Major");
  assert.deepStrictEqual(questionState.legacyEarTrainOptions, ["C Major", "G Major", "A Minor"]);
  assert.strictEqual(questionState.legacyEarTrainAnswer, null);

  var answerState = core.syncLegacyEarTrainingRuntimeState({
    answer: "G Major"
  });
  assert.strictEqual(answerState.legacyEarTrainQuestion, "C Major");
  assert.deepStrictEqual(answerState.legacyEarTrainOptions, ["C Major", "G Major", "A Minor"]);
  assert.strictEqual(answerState.legacyEarTrainAnswer, "G Major");
});

test("SparkCore can open and sync strum runtime state explicitly", function() {
  var core = createDefaultSparkCore();
  var pattern = { name: "Island Groove", desc: "Syncopated groove", bpm: 76, pattern: ["D", "D", "U", "U", "D", "U"] };

  var openState = core.openLegacyStrumPattern({ pattern: pattern });
  assert.strictEqual(openState.activeFlow, "legacy_strum_pattern");
  assert.strictEqual(openState.activeScreen, "strum");
  assert.strictEqual(openState.activeTab, "strum");
  assert.deepStrictEqual(openState.legacyStrumPattern, pattern);
  assert.strictEqual(openState.legacyStrumActive, false);
  assert.strictEqual(openState.legacyStrumBeat, -1);
  assert.strictEqual(openState.transport.status, "ready");

  var playState = core.syncLegacyStrumRuntimeState({
    active: true,
    beat: 3
  });
  assert.strictEqual(playState.legacyStrumActive, true);
  assert.strictEqual(playState.legacyStrumBeat, 3);
  assert.strictEqual(playState.transport.status, "running");

  var stopState = core.syncLegacyStrumRuntimeState({
    active: false,
    beat: -1
  });
  assert.strictEqual(stopState.legacyStrumActive, false);
  assert.strictEqual(stopState.legacyStrumBeat, -1);
  assert.strictEqual(stopState.transport.status, "idle");
});

test("SparkCore can sync quiz runtime state explicitly", function() {
  var core = createDefaultSparkCore();
  var question = { name: "C Major", short: "C" };
  var options = [
    { name: "C Major", short: "C" },
    { name: "G Major", short: "G" }
  ];

  var openState = core.openLegacyQuiz({
    question: question,
    options: options,
    answer: null,
    score: 2,
    total: 3,
    streak: 1
  });
  assert.strictEqual(openState.activeFlow, "legacy_quiz");
  assert.strictEqual(openState.activeScreen, "quiz");
  assert.strictEqual(openState.activeTab, "quiz");
  assert.deepStrictEqual(openState.legacyQuizQuestion, question);
  assert.deepStrictEqual(openState.legacyQuizOptions, options);
  assert.strictEqual(openState.legacyQuizAnswer, null);
  assert.strictEqual(openState.legacyQuizScore, 2);
  assert.strictEqual(openState.legacyQuizTotal, 3);
  assert.strictEqual(openState.legacyQuizStreak, 1);

  var answerState = core.syncLegacyQuizRuntimeState({
    answer: "G Major",
    score: 2,
    total: 4,
    streak: 0
  });
  assert.strictEqual(answerState.legacyQuizAnswer, "G Major");
  assert.deepStrictEqual(answerState.legacyQuizOptions, options);
  assert.strictEqual(answerState.legacyQuizTotal, 4);
  assert.strictEqual(answerState.legacyQuizStreak, 0);
});

test("SparkCore can open, sync, and complete legacy daily challenge runtime explicitly", function() {
  var core = createDefaultSparkCore();

  var openState = core.openLegacyDailyChallenge({
    challengeId: "marathon",
    durationSec: 180
  });
  assert.strictEqual(openState.activeFlow, "legacy_daily_challenge");
  assert.strictEqual(openState.activeScreen, "daily");
  assert.strictEqual(openState.activeTab, "daily");
  assert.strictEqual(openState.legacyDailyChallengeId, "marathon");
  assert.strictEqual(openState.legacyDailyRemainingSec, 180);
  assert.strictEqual(openState.legacyDailyTimerActive, true);
  assert.strictEqual(openState.transport.status, "running");

  var tickState = core.syncLegacyDailyRuntimeState("tick", {
    challengeId: "marathon",
    remainingSec: 43,
    durationSec: 180,
    timerActive: true
  });
  assert.strictEqual(tickState.legacyDailyRemainingSec, 43);
  assert.strictEqual(tickState.legacyDailyTimerActive, true);
  assert.strictEqual(tickState.legacyDailyComplete, false);
  assert.strictEqual(tickState.transport.status, "running");

  var completeState = core.completeLegacyDailyChallenge({
    challengeId: "marathon",
    durationSec: 180
  });
  assert.strictEqual(completeState.legacyDailyRemainingSec, 0);
  assert.strictEqual(completeState.legacyDailyTimerActive, false);
  assert.strictEqual(completeState.legacyDailyComplete, true);
  assert.strictEqual(completeState.transport.status, "completed");

  var homeState = core.returnFromLegacyDailyChallenge({ activeTab: "daily" });
  assert.strictEqual(homeState.activeScreen, "home");
  assert.strictEqual(homeState.activeTab, "daily");
  assert.strictEqual(homeState.legacyDailyTimerActive, false);
  assert.strictEqual(homeState.transport.status, "idle");
});

test("SparkCore can open, sync, and complete legacy runner runtime explicitly", function() {
  var core = createDefaultSparkCore();

  var openState = core.openLegacyRunnerGame({
    targetName: "C",
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    distance: 0,
    obstacles: []
  });
  assert.strictEqual(openState.activeFlow, "legacy_runner_game");
  assert.strictEqual(openState.activeScreen, "home");
  assert.strictEqual(openState.activeTab, "runner");
  assert.strictEqual(openState.legacyRunnerActive, true);
  assert.strictEqual(openState.legacyRunnerTargetName, "C");
  assert.strictEqual(openState.transport.status, "running");

  var tickState = core.syncLegacyRunnerRuntimeState({
    active: true,
    targetName: "G",
    score: 220,
    combo: 3,
    maxCombo: 5,
    lives: 2,
    distance: 19,
    obstacles: [{ id: 1, name: "G", short: "G", x: 80, isTarget: true, hit: false, result: null }]
  });
  assert.strictEqual(tickState.legacyRunnerTargetName, "G");
  assert.strictEqual(tickState.legacyRunnerScore, 220);
  assert.strictEqual(tickState.legacyRunnerCombo, 3);
  assert.strictEqual(tickState.legacyRunnerLives, 2);
  assert.strictEqual(tickState.legacyRunnerDistance, 19);
  assert.strictEqual(tickState.transport.status, "running");

  var completeState = core.completeLegacyRunnerGame({
    targetName: "G",
    score: 220,
    combo: 0,
    maxCombo: 5,
    lives: 0,
    distance: 19,
    obstacles: [],
    results: { score: 220, maxCombo: 5, distance: 19 }
  });
  assert.strictEqual(completeState.legacyRunnerActive, false);
  assert.strictEqual(completeState.legacyRunnerScore, 220);
  assert.deepStrictEqual(completeState.legacyRunnerResults, { score: 220, maxCombo: 5, distance: 19 });
  assert.strictEqual(completeState.transport.status, "completed");
});

test("SparkCore can open, sync, and complete legacy rhythm runtime explicitly", function() {
  var core = createDefaultSparkCore();
  var beats = [{ time: 0, type: "D", hit: false, result: null }];

  var openState = core.openLegacyRhythmGame({
    beats: beats,
    score: 0,
    combo: 0,
    maxCombo: 0,
    startTimeMs: 1000
  });
  assert.strictEqual(openState.activeFlow, "legacy_rhythm_game");
  assert.strictEqual(openState.activeScreen, "home");
  assert.strictEqual(openState.activeTab, "rhythm");
  assert.strictEqual(openState.legacyRhythmActive, true);
  assert.strictEqual(openState.transport.status, "running");

  var tickState = core.syncLegacyRhythmRuntimeState({
    active: true,
    beats: [{ time: 0, type: "D", hit: true, result: "perfect" }],
    score: 175,
    combo: 2,
    maxCombo: 4,
    startTimeMs: 1000
  });
  assert.strictEqual(tickState.legacyRhythmScore, 175);
  assert.strictEqual(tickState.legacyRhythmCombo, 2);
  assert.strictEqual(tickState.legacyRhythmMaxCombo, 4);
  assert.strictEqual(tickState.transport.status, "running");

  var completeState = core.completeLegacyRhythmGame({
    beats: [{ time: 0, type: "D", hit: true, result: "perfect" }],
    score: 175,
    combo: 0,
    maxCombo: 4,
    startTimeMs: 1000,
    results: { score: 175, accuracy: 100, maxCombo: 4, total: 1, hits: 1 }
  });
  assert.strictEqual(completeState.legacyRhythmActive, false);
  assert.strictEqual(completeState.legacyRhythmScore, 175);
  assert.deepStrictEqual(completeState.legacyRhythmResults, { score: 175, accuracy: 100, maxCombo: 4, total: 1, hits: 1 });
  assert.strictEqual(completeState.transport.status, "completed");
});

test("SparkCore can sync tuner runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncTunerRuntimeState({
    active: true,
    note: "A",
    freq: 440,
    cents: 2,
    error: null
  });
  assert.strictEqual(activeState.tunerActive, true);
  assert.strictEqual(activeState.tunerNote, "A");
  assert.strictEqual(activeState.tunerFreq, 440);
  assert.strictEqual(activeState.tunerCents, 2);
  assert.strictEqual(activeState.tunerError, null);

  var errorState = core.syncTunerRuntimeState({
    active: false,
    note: null,
    freq: 0,
    cents: 0,
    error: "Microphone access denied"
  });
  assert.strictEqual(errorState.tunerActive, false);
  assert.strictEqual(errorState.tunerError, "Microphone access denied");
});

test("SparkCore can sync stem player runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncStemPlayerRuntimeState({
    playing: true,
    currentTime: 12.5,
    duration: 96
  });
  assert.strictEqual(activeState.stemPlaying, true);
  assert.strictEqual(activeState.stemCurrentTime, 12.5);
  assert.strictEqual(activeState.stemDuration, 96);

  var idleState = core.syncStemPlayerRuntimeState({
    playing: false,
    currentTime: 0,
    duration: 96
  });
  assert.strictEqual(idleState.stemPlaying, false);
  assert.strictEqual(idleState.stemCurrentTime, 0);
  assert.strictEqual(idleState.stemDuration, 96);
});

test("SparkCore can sync audio input runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncAudioInputRuntimeState({
    devices: [{ id: "usb", name: "USB Guitar" }],
    inputId: "usb",
    testingId: "usb",
    testLevel: 42
  });
  assert.deepStrictEqual(activeState.audioInputDevices, [{ id: "usb", name: "USB Guitar" }]);
  assert.strictEqual(activeState.audioInputId, "usb");
  assert.strictEqual(activeState.audioTestingId, "usb");
  assert.strictEqual(activeState.audioTestLevel, 42);

  var idleState = core.syncAudioInputRuntimeState({
    devices: [{ id: "default", name: "Default Input" }],
    inputId: "",
    testingId: "",
    testLevel: 0
  });
  assert.deepStrictEqual(idleState.audioInputDevices, [{ id: "default", name: "Default Input" }]);
  assert.strictEqual(idleState.audioInputId, "");
  assert.strictEqual(idleState.audioTestingId, "");
  assert.strictEqual(idleState.audioTestLevel, 0);
});

test("SparkCore can sync metronome runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncMetronomeRuntimeState({
    active: true,
    bpm: 96,
    beat: 2,
    beatsPerBar: 4
  });
  assert.strictEqual(activeState.metronomeActive, true);
  assert.strictEqual(activeState.metronomeBpm, 96);
  assert.strictEqual(activeState.metronomeBeat, 2);
  assert.strictEqual(activeState.metronomeBeatsPerBar, 4);

  var idleState = core.syncMetronomeRuntimeState({
    active: false,
    bpm: 72,
    beat: 0,
    beatsPerBar: 3
  });
  assert.strictEqual(idleState.metronomeActive, false);
  assert.strictEqual(idleState.metronomeBpm, 72);
  assert.strictEqual(idleState.metronomeBeat, 0);
  assert.strictEqual(idleState.metronomeBeatsPerBar, 3);
});

test("SparkCore can sync chord detect runtime state explicitly", function() {
  var core = createDefaultSparkCore();

  var activeState = core.syncChordDetectRuntimeState({
    active: true,
    notes: ["C", "E", "G"],
    match: 82,
    error: null
  });
  assert.strictEqual(activeState.chordDetectActive, true);
  assert.deepStrictEqual(activeState.chordDetectNotes, ["C", "E", "G"]);
  assert.strictEqual(activeState.chordDetectMatch, 82);
  assert.strictEqual(activeState.chordDetectError, null);

  var errorState = core.syncChordDetectRuntimeState({
    active: false,
    notes: [],
    match: -1,
    error: "Microphone access denied"
  });
  assert.strictEqual(errorState.chordDetectActive, false);
  assert.deepStrictEqual(errorState.chordDetectNotes, []);
  assert.strictEqual(errorState.chordDetectMatch, -1);
  assert.strictEqual(errorState.chordDetectError, "Microphone access denied");
});

test("legacy session and drill pages can fall back to SparkCore practice runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return []; };
  global._buildChordCheckInner = function() { return ""; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function() { return ""; };
  global.strumHTML = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [
              { name: "C", short: "C" },
              { name: "G", short: "G" }
            ],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.metronomeBpm = 80;
  S._metroBeats = 4;
  S._metroBeat = 0;
  S.metronomeOn = false;
  S.chordDetectOn = false;
  S.chordDetectErr = "";
  S.practiceIntention = "";
  S.timerActive = true;
  S.drillIdx = 0;
  S.drillSwitches = 0;
  S.drillAdaptiveBpm = 60;
  S.currentChord = null;
  S.timer = undefined;
  S.drillChords = [];
  S.drillTimer = undefined;
  S.dailyChallenge = {
    id: "marathon",
    title: "Marathon",
    desc: "Keep going",
    icon: "M",
    xp: 40
  };
  S.dailyTimer = undefined;
  S.dailyComplete = undefined;

  eval(loadJS("js/pages/session.js"));

  core.openLegacyPracticeSession({ mode: "chord", chordName: "C", durationSec: 120 });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf(">C<") >= 0);
  assert.ok(sessionHtml.indexOf("2:00") >= 0);

  S.timer = undefined;
  S.timerActive = undefined;
  core.syncLegacyPracticeRuntimeState("pause", { remainingSec: 91 });
  sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("1:31") >= 0);
  assert.ok(sessionHtml.indexOf("Resume") >= 0);

  core.openLegacyPracticeDrill({ durationSec: 60, chordNames: ["C", "G"] });
  var drillHtml = drillPage();
  assert.ok(drillHtml.indexOf("Switch Drill") >= 0);
  assert.ok(drillHtml.indexOf(">C<") >= 0);
  assert.ok(drillHtml.indexOf(">G<") >= 0);

  S.drillTimer = undefined;
  core.syncLegacyPracticeRuntimeState("tick", {
    remainingSec: 27,
    timerActive: true,
    mode: "drill",
    chordNames: ["C", "G"],
    durationSec: 60
  });
  drillHtml = drillPage();
  assert.ok(drillHtml.indexOf("27s") >= 0);

  core.openLegacyDailyChallenge({ challengeId: "marathon", durationSec: 180 });
  core.syncLegacyDailyRuntimeState("tick", {
    challengeId: "marathon",
    remainingSec: 43,
    durationSec: 180,
    timerActive: true
  });
  var dailyHtml = dailyPage();
  assert.ok(dailyHtml.indexOf("43s") >= 0);

  S.dailyTimer = undefined;
  S.dailyComplete = undefined;
  core.completeLegacyDailyChallenge({ challengeId: "marathon", durationSec: 180 });
  dailyHtml = dailyPage();
  assert.ok(dailyHtml.indexOf("dailyDoneHome") >= 0);
});

test("runner pages can fall back to SparkCore runner runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [
              { name: "C", short: "C" },
              { name: "G", short: "G" }
            ]
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.runnerActive = undefined;
  S.runnerTarget = null;
  S.runnerScore = undefined;
  S.runnerCombo = undefined;
  S.runnerLives = undefined;
  S.runnerDistance = undefined;
  S.runnerObstacles = undefined;
  S.runnerResults = null;
  S.runnerHighScore = 100;

  eval(loadJS("js/pages/games.js"));

  core.openLegacyRunnerGame({
    targetName: "C",
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    distance: 0,
    obstacles: []
  });
  core.syncLegacyRunnerRuntimeState({
    active: true,
    targetName: "G",
    score: 220,
    combo: 3,
    maxCombo: 5,
    lives: 2,
    distance: 19,
    obstacles: [{ id: 1, name: "G", short: "G", x: 80, isTarget: true, hit: false, result: null }]
  });
  var runnerHtml = runnerGamePage();
  assert.ok(runnerHtml.indexOf(">220<") >= 0);
  assert.ok(runnerHtml.indexOf(">G<") >= 0);
  assert.ok(runnerHtml.indexOf("runner-obstacle") >= 0);

  S.runnerResults = null;
  core.completeLegacyRunnerGame({
    targetName: "G",
    score: 220,
    combo: 0,
    maxCombo: 5,
    lives: 0,
    distance: 19,
    obstacles: [],
    results: { score: 220, maxCombo: 5, distance: 19 }
  });
  var resultsHtml = runnerResultsPage();
  assert.ok(resultsHtml.indexOf("Game Over!") >= 0);
  assert.ok(resultsHtml.indexOf(">220<") >= 0);
});

test("rhythm pages can fall back to SparkCore rhythm runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  S.rhythmActive = undefined;
  S.rhythmBeats = undefined;
  S.rhythmScore = undefined;
  S.rhythmCombo = undefined;
  S.rhythmMaxCombo = undefined;
  S.rhythmStartTime = undefined;
  S.rhythmResults = null;
  S.rhythmBpm = 90;

  eval(loadJS("js/pages/games.js"));

  var rhythmStart = performance.now();

  core.openLegacyRhythmGame({
    beats: [{ time: 1000, type: "D", hit: false, result: null }],
    score: 0,
    combo: 0,
    maxCombo: 0,
    startTimeMs: rhythmStart
  });
  core.syncLegacyRhythmRuntimeState({
    active: true,
    beats: [{ time: 1000, type: "D", hit: false, result: null }],
    score: 175,
    combo: 2,
    maxCombo: 4,
    startTimeMs: rhythmStart
  });
  var rhythmHtml = rhythmGamePage();
  assert.ok(rhythmHtml.indexOf(">175<") >= 0);
  assert.ok(rhythmHtml.indexOf(">2x<") >= 0);
  assert.ok(rhythmHtml.indexOf("rhythm-beat") >= 0);

  S.rhythmResults = null;
  core.completeLegacyRhythmGame({
    beats: [{ time: 0, type: "D", hit: true, result: "perfect" }],
    score: 175,
    combo: 0,
    maxCombo: 4,
    startTimeMs: performance.now(),
    results: { score: 175, accuracy: 100, maxCombo: 4, total: 1, hits: 1 }
  });
  var resultsHtml = rhythmResultsPage();
  assert.ok(resultsHtml.indexOf("Results!") >= 0);
  assert.ok(resultsHtml.indexOf(">175<") >= 0);
});

test("tuner page can fall back to SparkCore tuner runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            STRINGS: [
              { note: "E", freq: 82.4 },
              { note: "A", freq: 110.0 },
              { note: "D", freq: 146.8 },
              { note: "G", freq: 196.0 },
              { note: "B", freq: 246.9 },
              { note: "e", freq: 329.6 }
            ]
          };
        }
      };
    }
  };
  S.tunerActive = undefined;
  S.tunerNote = undefined;
  S.tunerFreq = undefined;
  S.tunerCents = undefined;
  S.tunerErr = undefined;
  S.audioInputDevices = [];
  S.audioInputId = "";
  S.audioTestingId = null;
  S.audioTestLevel = 0;

  eval(loadJS("js/pages/tools.js"));

  core.syncTunerRuntimeState({
    active: true,
    note: "A",
    freq: 440,
    cents: 2,
    error: null
  });
  var tunerHtml = tunerTab();
  assert.ok(tunerHtml.indexOf(">A<") >= 0);
  assert.ok(tunerHtml.indexOf("440 Hz") >= 0);
  assert.ok(tunerHtml.indexOf("In Tune!") >= 0);

  S.tunerActive = undefined;
  S.tunerNote = undefined;
  S.tunerFreq = undefined;
  S.tunerCents = undefined;
  S.tunerErr = undefined;
  core.syncTunerRuntimeState({
    active: false,
    note: null,
    freq: 0,
    cents: 0,
    error: "Microphone access denied"
  });
  tunerHtml = tunerTab();
  assert.ok(tunerHtml.indexOf("Microphone access denied") >= 0);
});

test("stem player page can fall back to SparkCore stem runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.formatTime = function(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  };
  global._isStemSolo = function() { return false; };
  global.STEM_NAMES = ["vocals", "drums"];
  global.STEM_COLORS = { vocals: "#f00", drums: "#0f0" };
  global.STEM_ICONS = { vocals: "V", drums: "D" };
  S.stemFile = { fileName: "mix.wav" };
  S.stemPaths = { vocals: "vocals.wav", drums: "drums.wav" };
  S.stemToggles = { vocals: true, drums: true };
  S.stemVolume = 0.8;
  S.stemPlaying = undefined;
  S.stemCurrentTime = undefined;
  S.stemDuration = undefined;

  eval(loadJS("js/pages/songs.js"));

  core.syncStemPlayerRuntimeState({
    playing: true,
    currentTime: 12.5,
    duration: 96
  });
  var stemsHtml = stemsPage();
  assert.ok(stemsHtml.indexOf("0:12 / 1:36") >= 0);
  assert.ok(stemsHtml.indexOf("Pause") >= 0);
});

test("tools page audio input section can fall back to SparkCore audio runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            STRINGS: [
              { note: "E", freq: 82.4 },
              { note: "A", freq: 110.0 }
            ]
          };
        }
      };
    }
  };
  S.tunerActive = false;
  S.tunerNote = null;
  S.tunerFreq = 0;
  S.tunerCents = 0;
  S.tunerErr = "";
  S.audioInputDevices = [];
  S.audioInputId = undefined;
  S.audioTestingId = undefined;
  S.audioTestLevel = undefined;

  eval(loadJS("js/pages/tools.js"));

  core.syncAudioInputRuntimeState({
    devices: [{ id: "usb", name: "USB Guitar" }],
    inputId: "usb",
    testingId: "usb",
    testLevel: 42
  });
  var toolsHtml = tunerTab();
  assert.ok(toolsHtml.indexOf("USB Guitar") >= 0);
  assert.ok(toolsHtml.indexOf("width:42%") >= 0);
  assert.ok(toolsHtml.indexOf("Signal detected") >= 0);
});

test("session page chord check can fall back to SparkCore chord detect runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return ["C", "E", "G"]; };
  global.getCoachFeedback = function() { return []; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function() { return ""; };
  global.strumHTML = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.currentChord = { name: "C", short: "C" };
  S.metronomeBpm = 80;
  S._metroBeats = 4;
  S._metroBeat = 0;
  S.metronomeOn = false;
  S.practiceIntention = "";
  S.timer = 120;
  S.timerActive = true;
  S.chordDetectOn = undefined;
  S.chordDetectErr = undefined;
  S.detectedNotes = undefined;
  S.chordMatch = undefined;

  eval(loadJS("js/pages/shared.js"));
  eval(loadJS("js/pages/session.js"));

  core.syncChordDetectRuntimeState({
    active: true,
    notes: ["C", "E", "G"],
    match: 82,
    error: null
  });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Stop") >= 0);
  assert.ok(sessionHtml.indexOf("82%") >= 0);
  assert.ok(sessionHtml.indexOf("C") >= 0);

  S.chordDetectOn = undefined;
  S.chordDetectErr = undefined;
  S.detectedNotes = undefined;
  S.chordMatch = undefined;
  core.syncChordDetectRuntimeState({
    active: false,
    notes: [],
    match: -1,
    error: "Microphone access denied"
  });
  sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Microphone access denied") >= 0);
  assert.ok(sessionHtml.indexOf("Listen") >= 0);
});

test("session page metronome card can fall back to SparkCore metronome runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return []; };
  global._buildChordCheckInner = function() { return ""; };
  global.getCoachFeedback = function() { return []; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function() { return ""; };
  global.strumHTML = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.currentChord = { name: "C", short: "C" };
  S.practiceIntention = "";
  S.timer = 120;
  S.timerActive = true;
  S.metronomeOn = undefined;
  S.metronomeBpm = undefined;
  S._metroBeat = undefined;
  S._metroBeats = undefined;
  S.chordDetectOn = false;
  S.chordDetectErr = "";

  eval(loadJS("js/pages/session.js"));

  core.syncMetronomeRuntimeState({
    active: true,
    bpm: 96,
    beat: 2,
    beatsPerBar: 4
  });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf(">96<") >= 0);
  assert.ok(sessionHtml.indexOf("Stop") >= 0);
  assert.ok(sessionHtml.indexOf("metro-dot active") >= 0);
});

test("finger exercise card can fall back to SparkCore finger exercise runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.FINGER_EXERCISES = [
    { id: "spider_walk", name: "Spider Walk", desc: "Walk each finger in order.", duration: 90, frequency: "Daily", tier: 1, goal: "Clean finger independence", offInstrument: true }
  ];
  S.fingerExActive = undefined;
  S.fingerExId = undefined;
  S.fingerExTimer = undefined;
  S.fingerStats = {};

  eval(loadJS("js/pages/shared.js"));

  core.openLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 0
  });
  var cardHtml = fingerExerciseCard();
  assert.ok(cardHtml.indexOf("Spider Walk") >= 0);
  assert.ok(cardHtml.indexOf("1:30") >= 0);
  assert.ok(cardHtml.indexOf("Stop") >= 0);

  S.fingerExActive = undefined;
  S.fingerExId = undefined;
  S.fingerExTimer = undefined;
  core.completeLegacyFingerExercise({
    exerciseId: "spider_walk",
    durationSec: 90,
    exerciseCount: 3
  });
  cardHtml = fingerExerciseCard();
  assert.ok(cardHtml.indexOf("3x") >= 0);
  assert.ok(cardHtml.indexOf("no guitar") === -1);
  assert.ok(cardHtml.indexOf("no instrument") >= 0);
});

test("strum page can fall back to SparkCore strum runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.strumHandSVG = function(direction, active) { return "<div>" + direction + ":" + active + "</div>"; };
  global.strumHTML = function(pattern, beat) { return "<div>" + pattern.join("-") + "|" + beat + "</div>"; };
  S.selectedStrum = undefined;
  S.strumActive = undefined;
  S._strumBeat = undefined;
  S.strumTone = "classic";

  eval(loadJS("js/pages/session.js"));

  core.openLegacyStrumPattern({
    pattern: { name: "Island Groove", desc: "Syncopated groove", bpm: 76, pattern: ["D", "D", "U", "U", "D", "U"] }
  });
  core.syncLegacyStrumRuntimeState({
    active: true,
    beat: 2
  });
  var strumHtml = strumDetailPage();
  assert.ok(strumHtml.indexOf("Island Groove") >= 0);
  assert.ok(strumHtml.indexOf("76 BPM") >= 0);
  assert.ok(strumHtml.indexOf("D-D-U-U-D-U|2") >= 0);
  assert.ok(strumHtml.indexOf("Stop") >= 0);
});

test("quiz page can fall back to SparkCore quiz runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.clickableDiv = function() { return ""; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.quizQ = undefined;
  S.quizOpts = undefined;
  S.quizAns = undefined;
  S.quizScore = 2;
  S.quizTotal = 3;
  S.quizStreak = 1;

  eval(loadJS("js/pages/session.js"));

  core.syncLegacyQuizRuntimeState({
    question: { name: "C Major", short: "C" },
    options: [
      { name: "C Major", short: "C" },
      { name: "G Major", short: "G" }
    ],
    answer: "G Major",
    score: 2,
    total: 3,
    streak: 1
  });
  var quizHtml = quizPage();
  assert.ok(quizHtml.indexOf("C Major?") >= 0);
  assert.ok(quizHtml.indexOf("2/3") >= 0);
  assert.ok(quizHtml.indexOf("G Major") >= 0);
  assert.ok(quizHtml.indexOf("Not quite!") >= 0);
});

test("quiz tab can fall back to SparkCore quiz score state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  S.quizCorrect = undefined;

  eval(loadJS("js/pages/practice.js"));

  core.syncLegacyQuizRuntimeState({
    score: 7,
    total: 10,
    streak: 2
  });
  var quizTabHtml = quizTab();
  assert.ok(quizTabHtml.indexOf("Correct: <strong>7</strong>") >= 0);
});

test("ear training page can fall back to SparkCore ear training runtime state", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  S.earTrainQ = undefined;
  S.earTrainOpts = undefined;
  S.earTrainAns = undefined;
  S.earTrainScore = 3;
  S.earTrainTotal = 5;
  S.earTrainStreak = 2;

  eval(loadJS("js/pages/practice.js"));

  core.syncLegacyEarTrainingRuntimeState({
    question: "C Major",
    options: ["C Major", "G Major", "A Minor"],
    answer: null,
    score: 3,
    total: 5,
    streak: 2
  });
  var activeHtml = earTrainTab();
  assert.ok(activeHtml.indexOf("What chord is this?") >= 0);
  assert.ok(activeHtml.indexOf("C Major") >= 0);
  assert.ok(activeHtml.indexOf("G Major") >= 0);

  S.earTrainScore = undefined;
  S.earTrainTotal = undefined;
  S.earTrainStreak = undefined;
  core.syncLegacyEarTrainingRuntimeState({
    answer: "G Major",
    score: 3,
    total: 6,
    streak: 0
  });
  var answeredHtml = earTrainPage();
  assert.ok(answeredHtml.indexOf("3/6") >= 0);
  assert.ok(answeredHtml.indexOf("It was C Major") >= 0);
});

test("song detail page uses SparkCore song runtime for active playback rendering", function() {
  var core = createDefaultSparkCore();
  window.sparkCore = core;
  global.escHTML = function(value) { return String(value); };
  global.strumHandSVG = function(direction, active) { return "<div>" + direction + ":" + active + "</div>"; };
  global.strumHTML = function(pattern, beat) { return "<div>" + pattern.join("-") + "|" + beat + "</div>"; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }, { name: "G", short: "G" }]
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedSong = undefined;
  S.songPlaying = undefined;
  S.songBeat = undefined;
  S.strumTone = "classic";

  eval(loadJS("js/pages/session.js"));

  core.openSongSession({
    songData: {
      title: "Fire Road",
      artist: "Spark Suite",
      bpm: 96,
      chords: ["C", "G"],
      progression: ["C", "G", "C", "G"],
      pattern: ["D", "D", "U", "U"]
    },
    source: "builtin"
  });
  core.syncSongRuntimeState("play", { songBeat: 2 });
  var songHtml = songDetailPage();
  assert.ok(songHtml.indexOf("U:true") >= 0);
  assert.ok(songHtml.indexOf("D-D-U-U|2") >= 0);
  assert.ok(songHtml.indexOf("Pause") >= 0);
});

test("session family pages can resolve sparkCore from the global binding", function() {
  var core = createDefaultSparkCore();
  global.window = {};
  global.sparkCore = core;
  global.VOICINGS = {};
  global._prevChordKey = "";
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
  global.getExpectedNotes = function() { return []; };
  global._buildChordCheckInner = function() { return ""; };
  global.getCoachFeedback = function() { return []; };
  global.escHTML = function(value) { return String(value); };
  global.tierBadgeHTML = function() { return ""; };
  global.getTransitionTip = function() { return null; };
  global.clickableDiv = function() { return ""; };
  global.strumHandSVG = function(direction, active) { return "<div>" + direction + ":" + active + "</div>"; };
  global.strumHTML = function(pattern, beat) { return "<div>" + pattern.join("-") + "|" + beat + "</div>"; };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }, { name: "G", short: "G" }],
            LC: { 1: "#fff" }
          };
        },
        ui: {
          chord: function(chord) { return "<div>" + chord.name + "</div>"; }
        }
      };
    }
  };
  S.selectedVoicing = 0;
  S.level = 1;
  S.currentChord = { name: "C", short: "C" };
  S.metronomeOn = undefined;
  S.metronomeBpm = undefined;
  S._metroBeat = undefined;
  S._metroBeats = undefined;
  S.chordDetectOn = false;
  S.chordDetectErr = "";
  S.practiceIntention = "";
  S.timer = undefined;
  S.timerActive = undefined;
  S.selectedSong = undefined;
  S.songPlaying = undefined;
  S.songBeat = undefined;
  S.strumTone = "classic";

  eval(loadJS("js/pages/session.js"));

  core.openLegacyPracticeSession({ mode: "chord", chordName: "C", durationSec: 120 });
  core.syncMetronomeRuntimeState({
    active: true,
    bpm: 92,
    beat: 1,
    beatsPerBar: 4
  });
  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf(">C<") >= 0);
  assert.ok(sessionHtml.indexOf(">92<") >= 0);
  assert.ok(sessionHtml.indexOf("Stop") >= 0);

  core.openSongSession({
    songData: {
      title: "Fire Road",
      artist: "Spark Suite",
      bpm: 96,
      chords: ["C", "G"],
      progression: ["C", "G", "C", "G"],
      pattern: ["D", "D", "U", "U"]
    },
    source: "builtin"
  });
  core.syncSongRuntimeState("play", { songBeat: 2 });
  var songHtml = songDetailPage();
  assert.ok(songHtml.indexOf("U:true") >= 0);
  assert.ok(songHtml.indexOf("D-D-U-U|2") >= 0);
  assert.ok(songHtml.indexOf("Pause") >= 0);
});

test("audio helpers can resolve sparkCore from the global binding", function() {
  var originalSetTimeout = global.setTimeout;
  var originalClearTimeout = global.clearTimeout;
  var originalCancelAnimationFrame = global.cancelAnimationFrame;
  var metronomeStates = [];
  var chordStates = [];
  var audioInputStates = [];
  var stemStates = [];
  global.window = {};
  global.sparkCore = {
    syncMetronomeRuntimeState: function(payload) {
      metronomeStates.push(payload);
      return payload;
    },
    syncChordDetectRuntimeState: function(payload) {
      chordStates.push(payload);
      return payload;
    },
    syncAudioInputRuntimeState: function(payload) {
      audioInputStates.push(payload);
      return payload;
    },
    syncStemPlayerRuntimeState: function(payload) {
      stemStates.push(payload);
      return payload;
    }
  };
  global.T = {};
  global.render = function() {};
  global.updateChordCheckUI = function() {};
  global.setTimeout = function() { return 1; };
  global.clearTimeout = function() {};
  global.cancelAnimationFrame = function() {};
  global.NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  global.CHORD_NOTES = { "C Major": ["C", "E", "G"] };
  global.SCR = { PERFORM: "perform" };
  S.metronomeBpm = 88;
  S._metroBeats = 4;
  S.metronomeOn = false;
  S.chordDetectOn = true;
  S.currentChord = { name: "C Major" };
  S.screen = "practice";
  S.performMode = "listen";
  S.audioInputDevices = [{ id: "mic_1", name: "Built-in Mic" }];
  S.audioInputId = "mic_1";
  S.audioTestingId = "mic_1";
  S.audioTestLevel = 17;
  S.stemCurrentTime = 5;
  S.stemDuration = 42;
  S.stemPlaying = true;

  eval(loadJS("js/audio.js"));

  startMetronome();
  stopMetronome();

  _midiInputNotes = { 60: true, 64: true, 67: true };
  _processMIDIChord();

  stopAudioTest();

  _stemAudios = {
    mix: {
      currentTime: 0,
      pause: function() {},
      src: "",
      ended: false
    }
  };
  pauseStems();
  seekStems(12);
  cleanupStems();

  assert.strictEqual(metronomeStates[0].active, true);
  assert.strictEqual(metronomeStates[0].bpm, 88);
  assert.strictEqual(metronomeStates[1].active, false);
  assert.ok(chordStates.length >= 1);
  assert.deepStrictEqual(chordStates[chordStates.length - 1].notes, ["C", "E", "G"]);
  assert.strictEqual(chordStates[chordStates.length - 1].active, true);
  assert.strictEqual(audioInputStates[0].testingId, "");
  assert.strictEqual(audioInputStates[0].testLevel, 0);
  assert.strictEqual(stemStates[0].playing, false);
  assert.strictEqual(stemStates[1].currentTime, 12);
  assert.strictEqual(stemStates[stemStates.length - 1].duration, 0);

  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
  global.cancelAnimationFrame = originalCancelAnimationFrame;
});

test("timer helpers can resolve sparkCore from the global binding", function() {
  var completedSession = null;
  var completedDrill = null;
  var syncedQuiz = null;
  global.window = {};
  global.sparkCore = {
    completeLegacyPracticeSession: function(payload) {
      completedSession = payload;
      return payload;
    },
    completeLegacyPracticeDrill: function(payload) {
      completedDrill = payload;
      return payload;
    },
    syncLegacyQuizRuntimeState: function(payload) {
      syncedQuiz = payload;
      return payload;
    }
  };
  global.SparkPsychology = { shouldReward: function() { return false; } };
  global.snd = function() {};
  global.addPracticeSecond = function() {};
  global.render = function() {};
  global.stopMetronome = function() {};
  global.stopChordDetect = function() {};
  global.trigC = function() {};
  global.saveState = function() {};
  global.logHistory = function() {};
  global.checkBadges = function() {};
  global._sparkEmit = function() {};
  global.getActiveInstrumentIdentityForActivity = function() {
    return { appId: "chordspark", instrumentType: "guitar" };
  };
  global.syncLegacyPracticeRuntimeRequest = function() {};
  global.SparkSession = {
    processResults: function() {
      return { xpEarned: 20, jackpot: false, leveledUp: false };
    }
  };
  global.updateDrillTimerUI = function() { return true; };
  global.SCR = {
    COMPLETE: "complete",
    DRILL: "drill",
    DRILL_DONE: "drill_done",
    DAILY: "daily"
  };
  global.T = { session: null, drill: null };
  global.clearTimeout = function() {};
  global.setTimeout = function() { return 1; };
  S.timerActive = true;
  S.timer = 0;
  S.metronomeOn = false;
  S.chordDetectOn = false;
  S.lastChordName = "C";
  S.currentChord = { name: "C" };
  S.screen = SCR.DRILL;
  S.drillTimer = 0;
  S.drillChords = [{ name: "C" }, { name: "G" }];
  S.sessions = 0;

  eval(loadJS("js/timers.js"));

  tickS();
  S.screen = SCR.DRILL;
  tickD();
  S.level = 1;
  global.CHORDS = { 1: [{ name: "C Major", short: "C" }] };
  global.ALL_CHORDS = [{ name: "C Major", short: "C" }, { name: "G Major", short: "G" }];
  global.shuffle = function(items) { return items; };
  genQ();

  assert.ok(completedSession);
  assert.strictEqual(completedSession.chordName, "C");
  assert.ok(completedDrill);
  assert.deepStrictEqual(completedDrill.chordNames, ["C", "G"]);
  assert.ok(syncedQuiz);
  assert.strictEqual(syncedQuiz.question.name, "C Major");
  assert.strictEqual(syncedQuiz.answer, null);
});

test("action families can resolve sparkCore from the global binding", function() {
  var strumOpened = null;
  var strumSynced = [];
  var returnedPractice = null;
  var earTrainingSynced = null;
  var shellUpdates = [];
  var mediaRuntimeUpdates = [];
  var shellRuntimeUpdates = [];
  var activatedInstrument = null;
  var deactivatedInstrument = false;
  var existingBridge = global.SparkProgressBridge || {};
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    syncLegacyMediaRuntimeState: function(update) {
      mediaRuntimeUpdates.push(update);
      return update;
    },
    applyLegacyActivityRuntime: function(update) {
      shellRuntimeUpdates.push(update);
      return update;
    }
  });
  global.window = {};
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.sparkCore = {
    openLegacyStrumPattern: function(payload) {
      strumOpened = payload;
      return payload;
    },
    syncLegacyStrumRuntimeState: function(payload) {
      strumSynced.push(payload);
      return payload;
    },
    returnFromLegacyPracticeFamily: function(payload) {
      returnedPractice = payload;
      return payload;
    },
    syncLegacyEarTrainingRuntimeState: function(payload) {
      earTrainingSynced = payload;
      return payload;
    },
    updateRuntimeState: function(payload) {
      shellUpdates.push(payload);
      return payload;
    }
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.render = function() {};
  global.saveState = function() {};
  global.stopAllTimers = function() {};
  global.fetchCommunity = function() {};
  global.act = function() {};
  global.snd = function() {};
  global.strumChord = function() {};
  global.setInterval = function() { return 1; };
  global.clearInterval = function() {};
  global.setTimeout = function() { return 1; };
  global.T = { strum: null };
  global.SCR = { HOME: "home", STRUM: "strum" };
  global.TAB = { SONGS: "songs", PRACTICE: "practice" };
  global.SparkInstruments = {
    activate: function(id) {
      activatedInstrument = id;
    },
    deactivate: function() {
      deactivatedInstrument = true;
    }
  };
  global.STRUM_PATTERNS = [
    { name: "Island Groove", level: 1, bpm: 76, pattern: ["D", "D", "U", "U"] }
  ];
  S.level = 1;
  S.strumActive = false;
  S.selectedStrum = STRUM_PATTERNS[0];
  S.currentChord = { name: "C Major" };
  S.earTrainQ = "C Major";
  S.earTrainOpts = ["C Major", "G Major", "A Minor"];
  S.earTrainAns = null;
  S.earTrainScore = 1;
  S.earTrainTotal = 2;
  S.earTrainStreak = 1;
  S.tab = "practice";
  S.songsSubTab = "library";

  eval(loadJS("js/actions/media_family.js"));
  eval(loadJS("js/actions/practice_family.js"));
  eval(loadJS("js/actions/shell_family.js"));

  __actionFamilies.media("openStrum", "Island Groove");
  __actionFamilies.media("toggleStrum");
  __actionFamilies.practice("completeSessionHome");
  __actionFamilies.practice("answerEarTrain", "G Major");
  __actionFamilies.shell("tab", "songs");
  __actionFamilies.shell("switchInstrument", "pianospark");
  __actionFamilies.shell("switchInstrumentBack");

  assert.ok(strumOpened);
  assert.strictEqual(strumOpened.pattern.name, "Island Groove");

  assert.strictEqual(strumSynced[0].active, true);
  assert.strictEqual(strumSynced[0].beat, 0);
  assert.ok(returnedPractice);
  assert.strictEqual(returnedPractice.activeTab, "practice");
  assert.ok(earTrainingSynced);
  assert.strictEqual(earTrainingSynced.answer, "G Major");
  assert.strictEqual(earTrainingSynced.total, 3);
  assert.strictEqual(shellUpdates[0].activeScreen, "home");
  assert.strictEqual(shellUpdates[0].activeTab, "songs");
  assert.strictEqual(activatedInstrument, "pianospark");
  assert.strictEqual(deactivatedInstrument, true);
  assert.ok(shellRuntimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: {
        tab: "songs",
        screen: "home",
        earTrainQ: null,
        earTrainAns: null,
        selectedVoicing: 0
      }
    });
  }));
  assert.ok(shellRuntimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: { activeInstrument: "pianospark", screen: "home", tab: "practice" },
      save: false
    });
  }));
  assert.ok(shellRuntimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: { activeInstrument: null },
      save: false
    });
  }));
});

test("media action family routes strum and stem state through the shared bridge", function() {
  var runtimeUpdates = [];
  var strumSyncs = [];
  var stemMuteCalls = [];
  var stemVolumeCalls = [];
  var strumHits = [];
  var saveCalls = 0;
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      runtimeUpdates.push(update);
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.sparkCore = {
    syncLegacyStrumRuntimeState: function(payload) {
      strumSyncs.push(payload);
      return payload;
    }
  };
  global.S = {
    level: 1,
    strumActive: false,
    selectedStrum: { name: "Island Groove", level: 1, bpm: 76, pattern: ["D", "D", "U", "U"] },
    currentChord: { name: "C Major" },
    stemToggles: { vocals: true },
    stemVolume: 0.8,
    strumTone: "classic",
    selectedScale: "Major"
  };
  global.T = { strum: 21 };
  global.SCR = { STRUM: "strum" };
  global.STRUM_PATTERNS = [S.selectedStrum];
  global.STRUM_TONES = { electric: true };
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies = global.__actionFamilies || {};
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.render = function() {};
  global.snd = function() {};
  global.strumChord = function(name) {
    strumHits.push(name);
  };
  global.setInterval = function(fn) {
    fn();
    return 77;
  };
  global.clearInterval = function() {};
  global.setStemMuted = function(stem, muted) {
    stemMuteCalls.push({ stem: stem, muted: muted });
  };
  global.setStemVolume = function(value) {
    stemVolumeCalls.push(value);
  };
  global.saveState = function() {
    saveCalls += 1;
  };

  eval(loadJS("js/actions/media_family.js"));

  assert.strictEqual(__actionFamilies.media("toggleStrum"), true);
  assert.strictEqual(__actionFamilies.media("toggleStrum"), true);
  assert.strictEqual(__actionFamilies.media("stemToggle", "vocals"), true);
  assert.strictEqual(__actionFamilies.media("stemVolume", "0.65"), true);
  assert.strictEqual(__actionFamilies.media("setTone", "electric"), true);
  assert.strictEqual(__actionFamilies.media("selectScale", "Minor"), true);

  assert.deepStrictEqual(runtimeUpdates[0], {
    setFields: { strumActive: true, _strumBeat: 0 },
    clearIntervals: [],
    save: undefined
  });
  assert.deepStrictEqual(runtimeUpdates[1], {
    setFields: { _strumBeat: 1 },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[2], {
    setFields: { strumActive: false, _strumBeat: -1 },
    clearIntervals: ["strum"],
    save: undefined
  });
  assert.deepStrictEqual(runtimeUpdates[3], {
    setFields: { stemToggles: { vocals: false } },
    clearIntervals: [],
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[4], {
    setFields: { stemVolume: 0.65 },
    clearIntervals: [],
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[5], {
    setFields: { strumTone: "electric" },
    clearIntervals: [],
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[6], {
    setFields: { selectedScale: "Minor" },
    clearIntervals: [],
    save: false
  });
  assert.strictEqual(strumSyncs[0].beat, 0);
  assert.strictEqual(strumSyncs[1].beat, 1);
  assert.strictEqual(strumSyncs[2].beat, -1);
  assert.deepStrictEqual(stemMuteCalls[0], { stem: "vocals", muted: true });
  assert.strictEqual(stemVolumeCalls[0], 0.65);
  assert.deepStrictEqual(strumHits, ["C Major", "C Major"]);
  assert.strictEqual(saveCalls, 1);
});

test("practiceStartItem prefers the shared session runtime for active daily-practice segments", function() {
  var syncCalls = [];
  var launchedSegmentId = null;
  var directStartItem = null;
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          segments: [
            { id: "practice_item_1", type: "practice", exerciseIds: ["ex_1"] }
          ]
        }
      };
    },
    syncSessionRuntime: function(payload) {
      syncCalls.push(payload);
      return true;
    }
  };
  global.SparkSessionRuntime = {
    runSegmentById: function(segmentId) {
      launchedSegmentId = segmentId;
      return true;
    }
  };
  global.startPracticeItem = function(itemId) {
    directStartItem = itemId;
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.render = function() {};
  global.saveState = function() {};
  global.act = function() {};

  eval(loadJS("js/actions/practice_family.js"));

  assert.strictEqual(__actionFamilies.practice("practiceStartItem", "practice_item_1"), true);
  assert.strictEqual(launchedSegmentId, "practice_item_1");
  assert.strictEqual(directStartItem, null);
  assert.strictEqual(syncCalls.length, 1);
  assert.strictEqual(syncCalls[0].segmentId, "practice_item_1");
  assert.strictEqual(syncCalls[0].status, "ready");
});

test("practice action family can pause, resume, and skip the shared daily-practice shell", function() {
  var syncCalls = [];
  var runtimeCalls = [];
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          segments: [
            { id: "practice_item_1", type: "practice", exerciseIds: ["ex_1"] },
            { id: "practice_item_2", type: "song", exerciseIds: ["ex_2"] }
          ]
        },
        runtimeState: {
          activeSegmentId: "practice_item_1",
          transport: {
            status: "running",
            positionMs: 400
          }
        }
      };
    },
    syncSessionRuntime: function(payload) {
      syncCalls.push(payload);
      return true;
    }
  };
  global.SparkSessionRuntime = {
    pauseActiveSegment: function() {
      runtimeCalls.push("pause");
      return true;
    },
    resumeActiveSegment: function() {
      runtimeCalls.push("resume");
      return true;
    },
    skipActiveSegment: function() {
      runtimeCalls.push("skip");
      return { hasNext: true, nextIndex: 1 };
    }
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.render = function() {};
  global.saveState = function() {};
  global.act = function() {};

  eval(loadJS("js/actions/practice_family.js"));

  assert.strictEqual(__actionFamilies.practice("sessionPauseBlock"), true);
  assert.strictEqual(__actionFamilies.practice("sessionResumeBlock"), true);
  assert.strictEqual(__actionFamilies.practice("sessionSkipBlock"), true);
  assert.deepStrictEqual(runtimeCalls, ["pause", "resume", "skip"]);
  assert.strictEqual(syncCalls.length, 3);
  assert.strictEqual(syncCalls[0].segmentId, "practice_item_1");
  assert.strictEqual(syncCalls[0].status, "running");
});

test("practice action family routes controls, ear-training, and daily progression through the shared bridge", function() {
  var runtimeUpdates = [];
  var completionUpdates = [];
  var dailyChallengeRequests = [];
  var dailyCompleteRequests = [];
  var acted = [];
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.sparkCore = {
    syncLegacyEarTrainingRuntimeState: function(payload) {
      acted.push({ type: "syncEar", payload: payload });
      return true;
    }
  };
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      if (update && update.incrementFields) {
        Object.keys(update.incrementFields).forEach(function(key) {
          S[key] = (S[key] || 0) + update.incrementFields[key];
        });
      }
      runtimeUpdates.push(update);
      return update;
    },
    applyLegacyActivityCompletion: function(update) {
      completionUpdates.push(update);
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.S = {
    level: 3,
    selectedLevel: 1,
    selectedVoicing: 0,
    currentChord: { name: "C Major" },
    earTrainQ: "C Major",
    earTrainOpts: ["C Major", "G Major", "A Minor"],
    earTrainAns: null,
    earTrainScore: 1,
    earTrainTotal: 2,
    earTrainStreak: 1,
    dailyChallenge: { id: "daily_1", title: "Chord Sprint", xp: 40 }
  };
  global.T = {};
  global.SCR = { DAILY: "daily" };
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies = global.__actionFamilies || {};
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.render = function() {};
  global.saveState = function() {};
  global.snd = function() {};
  global.trigC = function() {};
  global.tickDy = function() {};
  global.strumChord = function() {};
  global.logHistory = function() {};
  global.checkBadges = function() {};
  global.openLegacyDailyChallengeRequest = function(payload) {
    dailyChallengeRequests.push(payload);
  };
  global.completeLegacyDailyChallengeRequest = function(payload) {
    dailyCompleteRequests.push(payload);
  };
  global.act = function(action) {
    acted.push({ type: "act", action: action });
  };
  global.setTimeout = function(fn) {
    fn();
    return 1;
  };
  global.clearTimeout = function() {};

  eval(loadJS("js/actions/practice_family.js"));

  assert.strictEqual(__actionFamilies.practice("selLevel", "2"), true);
  assert.strictEqual(__actionFamilies.practice("selectVoicing", "1"), true);
  assert.strictEqual(__actionFamilies.practice("answerEarTrain", "C Major"), true);
  assert.strictEqual(__actionFamilies.practice("startDaily"), true);
  assert.strictEqual(__actionFamilies.practice("completeDaily"), true);

  assert.strictEqual(runtimeUpdates.length, 5);
  assert.deepStrictEqual(runtimeUpdates[0], {
    setFields: { selectedLevel: 2 }
  });
  assert.deepStrictEqual(runtimeUpdates[1], {
    setFields: { selectedVoicing: 1 }
  });
  assert.deepStrictEqual(runtimeUpdates[2], {
    setFields: { earTrainAns: "C Major" },
    incrementFields: { earTrainTotal: 1 }
  });
  assert.deepStrictEqual(runtimeUpdates[3], {
    setFields: { dailyTimer: 60, dailyComplete: false, screen: "daily" },
    clearTimeouts: ["daily"]
  });
  assert.deepStrictEqual(runtimeUpdates[4], {
    clearTimeouts: ["daily"]
  });

  assert.strictEqual(completionUpdates.length, 2);
  assert.deepStrictEqual(completionUpdates[0], {
    xpDelta: 15,
    incrementFields: { earTrainScore: 1, earTrainStreak: 1 },
    history: { type: "ear", detail: "C Major", xp: 15 },
    checkBadges: true
  });
  assert.deepStrictEqual(completionUpdates[1], {
    xpDelta: 40,
    setFlags: { dailyComplete: true },
    incrementFields: { dailyDone: 1 },
    history: { type: "daily", detail: "Chord Sprint", xp: 40 },
    checkBadges: true
  });
  assert.strictEqual(dailyChallengeRequests.length, 1);
  assert.strictEqual(dailyChallengeRequests[0].durationSec, 60);
  assert.strictEqual(dailyCompleteRequests.length, 1);
  assert.strictEqual(dailyCompleteRequests[0].challengeId, "daily_1");
});

test("practice action family routes timer cleanup through the shared bridge", function() {
  var runtimeUpdates = [];
  var syncRequests = [];
  var tickCalls = 0;
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      runtimeUpdates.push(update);
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.S = {
    timerActive: false,
    timer: 45,
    metronomeOn: false,
    chordDetectOn: false,
    lastChordName: "C",
    currentChord: { name: "C" }
  };
  global.T = { session: 42 };
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies = global.__actionFamilies || {};
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.syncLegacyPracticeRuntimeRequest = function(kind, payload) {
    syncRequests.push({ kind: kind, payload: payload });
  };
  global.render = function() {};
  global.tickS = function() { tickCalls += 1; };
  global.setTimeout = function() { return 99; };
  global.clearTimeout = function() {};
  global.stopMetronome = function() {};
  global.stopChordDetect = function() {};

  eval(loadJS("js/actions/practice_family.js"));

  assert.strictEqual(__actionFamilies.practice("toggleTimer"), true);
  assert.strictEqual(__actionFamilies.practice("toggleTimer"), true);
  assert.strictEqual(__actionFamilies.practice("doneSession"), true);

  assert.deepStrictEqual(runtimeUpdates[0], {
    setFields: { timerActive: true }
  });
  assert.deepStrictEqual(runtimeUpdates[1], {
    setFields: { timerActive: false },
    clearTimeouts: ["session"]
  });
  assert.deepStrictEqual(runtimeUpdates[2], {
    clearTimeouts: ["session"]
  });
  assert.deepStrictEqual(runtimeUpdates[3], {
    setFields: { timerActive: true, timer: 0 }
  });
  assert.strictEqual(syncRequests.length, 3);
  assert.strictEqual(syncRequests[0].kind, "resume");
  assert.strictEqual(syncRequests[1].kind, "pause");
  assert.strictEqual(syncRequests[2].kind, "set_remaining");
  assert.strictEqual(syncRequests[2].payload.remainingSec, 0);
  assert.strictEqual(tickCalls, 1);
});

test("utility action family routes curriculum and back navigation through the shared bridge", function() {
  var runtimeUpdates = [];
  var utilityRequests = [];
  var curriculumSyncs = 0;
  var midiSettingsSyncs = 0;
  var midiImportSyncs = [];
  var cloudRequests = [];
  var editorOpens = [];
  var homeReturns = [];
  var utilityReturns = [];
  var songNavigations = [];
  var stopTimerCalls = 0;
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      runtimeUpdates.push(update);
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.openUtilityScreenRequest = function(screen) {
    utilityRequests.push(screen);
    return screen;
  };
  global.syncCurriculumStateRequest = function() {
    curriculumSyncs += 1;
  };
  global.syncMidiSettingsStateRequest = function() {
    midiSettingsSyncs += 1;
  };
  global.syncMidiImportStateRequest = function(payload) {
    midiImportSyncs.push(payload || {});
    return payload;
  };
  global.applyCloudWorkflowRequest = function(action, payload) {
    cloudRequests.push({ action: action, payload: payload });
    return payload;
  };
  global.buildSeedChartFromImportedMidi = function(importedMidi, assignments, mode) {
    return { id: "seed_" + mode, importedMidi: importedMidi, assignments: assignments };
  };
  global.openEditor = function(kind, chart) {
    editorOpens.push({ kind: kind, chart: chart });
  };
  global.returnFromHomeFamilyRequest = function(payload) {
    homeReturns.push(payload);
    return payload;
  };
  global.returnFromUtilityFamilyRequest = function(payload) {
    utilityReturns.push(payload);
    return payload;
  };
  global.applySongNavigationRequest = function(target) {
    songNavigations.push(target);
    return target;
  };
  global.stopAllTimers = function() {
    stopTimerCalls += 1;
  };
  global.render = function() {};
  global.saveState = function() {};
  global.S = {
    screen: "song_done",
    tab: "songs",
    selectedVoicing: 2,
    activeMidiDeviceId: null,
    importedMidi: { sourceName: "demo.mid" },
    importedMidiAssignments: { track_1: "single_note" },
    feedbackDraft: { category: "bug" }
  };
  global.SCR = global.SCR || {};
  global.TAB = global.TAB || {};
  global.SCR.SONG = "song";
  global.SCR.SONG_DONE = "song_done";
  global.SCR.CURRICULUM = "curriculum";
  global.SCR.HOME = "home";
  global.SCR.HOME_DASH = "home_dash";
  global.SCR.SETTINGS = "settings";
  global.SCR.CLOUD_SETTINGS = "cloud_settings";
  global.SCR.MIDI_SETTINGS = "midi_settings";
  global.SCR.MIDI_IMPORT = "midi_import";
  global.SCR.DAILY = "daily";
  global.SCR.RECOMMENDATIONS = "recommendations";
  global.SCR.INSIGHTS = "insights";
  global.SCR.CHALLENGES = "challenges";
  global.SCR.CAREER = "career";
  global.TAB.DAILY = "daily";

  eval(loadJS("js/actions/utility_family.js"));

  assert.strictEqual(__actionFamilies.utilities("setMidiDevice", "device_1"), true);
  assert.strictEqual(__actionFamilies.utilities("openMidiSettings"), true);
  assert.strictEqual(__actionFamilies.utilities("openMidiImport"), true);
  assert.strictEqual(__actionFamilies.utilities("buildMidiSeedChart", "practice"), true);
  assert.strictEqual(__actionFamilies.utilities("openCloudSettings"), true);
  assert.strictEqual(__actionFamilies.utilities("feedbackDraftText", "Something felt off"), true);
  assert.strictEqual(__actionFamilies.utilities("openCurriculum"), true);
  S.screen = SCR.SONG_DONE;
  assert.strictEqual(__actionFamilies.utilities("back"), true);

  assert.deepStrictEqual(utilityRequests, ["midi_settings", "midi_import", "cloud_settings", "curriculum"]);
  assert.strictEqual(curriculumSyncs, 1);
  assert.strictEqual(midiSettingsSyncs, 2);
  assert.strictEqual(midiImportSyncs.length, 2);
  assert.strictEqual(midiImportSyncs[1].seedMode, "practice");
  assert.deepStrictEqual(cloudRequests, [{ action: "open", payload: undefined }]);
  assert.strictEqual(editorOpens.length, 1);
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.activeMidiDeviceId === "device_1";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.screen === "midi_settings";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.screen === "midi_import";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.importedMidiSeedPreview && update.setFields.importedMidiSeedPreview.id === "seed_practice";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.screen === "cloud_settings";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.feedbackDraft && update.setFields.feedbackDraft.category === "bug" && update.setFields.feedbackDraft.text === "Something felt off";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
    setFields: { screen: "curriculum" }
    });
  }));
  assert.deepStrictEqual(songNavigations, ["songs_home"]);
  assert.strictEqual(homeReturns.length, 1);
  assert.deepStrictEqual(homeReturns[0], { currentScreen: "home" });
  assert.strictEqual(utilityReturns.length, 0);
  assert.strictEqual(stopTimerCalls, 1);
  assert.ok(runtimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: { selectedVoicing: 0, screen: "home", tab: "songs" }
    });
  }));
});

test("system action family routes guided and career screen state through the shared bridge", function() {
  var runtimeUpdates = [];
  var dashboardRequests = [];
  var careerSongRequests = [];
  var songBrowserRequests = [];
  var audioInputSyncs = [];
  var midiSyncs = 0;
  var audioStops = 0;
  var midiInits = 0;
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      runtimeUpdates.push(update);
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: { flow: "guided_session" },
        runtimeState: { activeScreen: "guided_session" }
      };
    },
    getRuntimeState: function() {
      return { guidedActivityId: "gtr-d02-song", guidedBlockType: "song" };
    },
    completeGuidedSession: function() {
      return { guidedActivityId: null, guidedBlockType: null };
    }
  };
  global.openDashboardSectionRequest = function(section) {
    dashboardRequests.push(section);
    return section;
  };
  global.openCareerSongSelectionRequest = function(payload) {
    careerSongRequests.push(payload);
    return payload;
  };
  global.getCareerItem = function(kind, id) {
    if (kind === "songs" && id === "career_anthem") {
      return { title: "Career Anthem", artist: "Spark Career" };
    }
    return null;
  };
  global.applyGuidedNavigationRequest = function() {};
  global.applySongBrowserRequest = function(type, payload) {
    songBrowserRequests.push({ type: type, payload: payload });
    return payload;
  };
  global.syncAudioInputRuntimeRequest = function(payload) {
    audioInputSyncs.push(payload);
    return payload;
  };
  global.syncMidiSettingsStateRequest = function() {
    midiSyncs += 1;
  };
  global.stopAudioTest = function() {
    audioStops += 1;
  };
  global.initMIDI = function() {
    midiInits += 1;
  };
  global.applyThemeSetting = function() {};
  global.clearTimeout = function() {};
  global.clearInterval = function() {};
  global.stopMetronome = function() {};
  global.render = function() {};
  global.saveState = function() {};
  global.S = global.S || {};
  global.T = {};
  global.SCR = global.SCR || {};
  global.TAB = global.TAB || {};
  global.SCR.CAREER = "career";
  global.SCR.PERFORM_SONG = "perform_song";
  global.SCR.GUIDED_DONE = "guided_done";
  global.SCR.HOME = "home";
  global.TAB.PRACTICE = "practice";
  global.S.performArrangementType = "lead";
  global.S.performDifficulty = "hard";
  global.S.metronomeOn = false;
  global.S.practiceIntention = "";
  global.S.settings = { theme: "dark", accessibility: {} };
  global.S.songSort = "level";
  global.S.songSortAsc = true;
  global.S.songFilter = "";
  global.S.focusMode = false;
  global.S.tab = "songs";
  global.S.breakDismissed = false;
  global.S.sessionStartTime = 0;
  global.S.showShortcuts = false;
  global.S.audioInputDevices = [{ id: "usb-1", name: "USB Interface" }];
  global.S.audioInputId = "";
  global.S.midiEnabled = false;
  global.S.midiOutput = { id: "old-midi" };
  global.S.midiDevices = [{ id: "old-midi", name: "Old MIDI" }];

  eval(loadJS("js/actions/system_family.js"));

  assert.strictEqual(__actionFamilies.system("setIntention", "After coffee"), true);
  assert.strictEqual(__actionFamilies.system("setTheme", "ember"), true);
  assert.strictEqual(__actionFamilies.system("songSort", "level"), true);
  assert.strictEqual(__actionFamilies.system("songFilter", "ballad"), true);
  assert.strictEqual(__actionFamilies.system("toggleFocus"), true);
  assert.strictEqual(__actionFamilies.system("dismissBreak"), true);
  assert.strictEqual(__actionFamilies.system("toggleShortcuts"), true);
  assert.strictEqual(__actionFamilies.system("selectAudioInput", "usb-1"), true);
  assert.strictEqual(__actionFamilies.system("toggleMidi"), true);
  assert.strictEqual(__actionFamilies.system("toggleMidi"), true);
  assert.strictEqual(__actionFamilies.system("openCareer"), true);
  assert.strictEqual(__actionFamilies.system("openCareerSong", "career_anthem"), true);
  assert.strictEqual(__actionFamilies.system("guidedComplete"), true);

  assert.deepStrictEqual(songBrowserRequests, [
    { type: "song_sort", payload: { songSort: "level", songSortAsc: false } },
    { type: "song_filter", payload: { songFilter: "ballad" } }
  ]);
  assert.deepStrictEqual(dashboardRequests, ["career"]);
  assert.strictEqual(audioStops, 1);
  assert.deepStrictEqual(audioInputSyncs, [{
    devices: [{ id: "usb-1", name: "USB Interface" }],
    inputId: "usb-1",
    testingId: "",
    testLevel: 0
  }]);
  assert.strictEqual(midiInits, 1);
  assert.strictEqual(midiSyncs, 2);
  assert.strictEqual(careerSongRequests.length, 1);
  assert.strictEqual(careerSongRequests[0].songId, "career_anthem");
  assert.strictEqual(careerSongRequests[0].difficultyId, "hard");
  assert.ok(runtimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({ setFields: { screen: "career" } });
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: {
        currentSong: { title: "Career Anthem", artist: "Spark Career" },
        performSongData: { title: "Career Anthem", artist: "Spark Career" },
        performSongId: "career_anthem",
        screen: "perform_song"
      },
      save: false
    });
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: { screen: "guided_done" },
      save: false
    });
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.practiceIntention === "After coffee";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.settings && update.setFields.settings.theme === "ember";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.songSort === "level" && update.setFields.songSortAsc === false;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.songFilter === "ballad";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.focusMode === true && update.setFields.tab === "practice";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.breakDismissed === true && typeof update.setFields.sessionStartTime === "number";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.showShortcuts === true;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.audioInputId === "usb-1";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.midiEnabled === true;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.midiEnabled === false && update.setFields.midiOutput === null && Array.isArray(update.setFields.midiDevices);
  }));
});

test("system action family routes live tuner detection state through the shared bridge", function() {
  var source = loadJS("js/actions/system_family.js");

  assert.strictEqual(source.indexOf("S.tunerNote ="), -1);
  assert.strictEqual(source.indexOf("S.tunerFreq ="), -1);
  assert.strictEqual(source.indexOf("S.tunerCents ="), -1);
  assert.ok(/setLegacyFields\(\{\s*tunerNote: result\.note/.test(source));
  assert.ok(/setLegacyFields\(\{\s*tunerNote: null/.test(source));
});

test("system action family routes metronome BPM changes through the shared bridge", function() {
  var runtimeUpdates = [];
  var metronomeStates = [];
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      runtimeUpdates.push(update);
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.sparkCore = {
    syncMetronomeRuntimeState: function(payload) {
      metronomeStates.push(payload);
      return payload;
    }
  };
  global.syncMetronomeRuntimeRequest = function(payload) {
    return global.sparkCore.syncMetronomeRuntimeState(payload);
  };
  global.S = global.S || {};
  global.T = {};
  global.S.metronomeOn = false;
  global.S.metronomeBpm = 80;
  global.S._metroBeat = 1;
  global.S._metroBeats = 4;
  global.clearTimeout = function() {};
  global.startMetronome = function() {};
  global.stopMetronome = function() {};
  global.render = function() {};
  global.saveState = function() {};
  global.showMicroToast = function() {};
  global.SCR = {};
  global.TAB = {};

  eval(loadJS("js/actions/system_family.js"));

  assert.strictEqual(__actionFamilies.system("metroBpm", "112"), true);
  assert.deepStrictEqual(runtimeUpdates[0], {
    setFields: { metronomeBpm: 112 },
    save: false
  });
  assert.deepStrictEqual(metronomeStates[0], {
    active: false,
    bpm: 112,
    beat: 1,
    beatsPerBar: 4
  });
  assert.strictEqual(S.metronomeBpm, 112);
});

test("tools action family routes imported song and rhythm starts through the shared bridge", function() {
  var toolsSource = loadJS("js/actions/tools_family.js");
  var runtimeUpdates = [];
  var songRequests = [];
  var rhythmRequests = [];
  var songBrowserRequests = [];
  var communityFetches = 0;
  var fetchCalls = [];
  var existingBridge = global.SparkProgressBridge || {};
  global.window = {};
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = Object.assign({}, existingBridge, {
    applyLegacyActivityRuntime: function(update) {
      if (update && update.setFields) {
        Object.keys(update.setFields).forEach(function(key) {
          S[key] = update.setFields[key];
        });
      }
      runtimeUpdates.push(update);
      return update;
    }
  });
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.openSongSessionRequest = function(payload) {
    songRequests.push(payload);
    return payload;
  };
  global.openLegacyRhythmGameRequest = function(payload) {
    rhythmRequests.push(payload);
    return payload;
  };
  global.applySongBrowserRequest = function(action, payload) {
    songBrowserRequests.push({ action: action, payload: payload });
    return payload;
  };
  global.fetchCommunity = function() {
    communityFetches += 1;
  };
  global.fetch = function(url, options) {
    fetchCalls.push({ url: url, options: options });
    return {
      then: function(fn) {
        fn({ json: function() { return {}; } });
        return {
          then: function(next) {
            next({});
            return { catch: function() {} };
          }
        };
      }
    };
  };
  global.escHTML = function(value) { return String(value); };
  global.parseChordSheet = function(text) {
    if (text === "bad chart") return { error: "Could not parse chart" };
    return {
      chords: ["D Major", "A Major"],
      progression: ["D Major", "A Major", "G Major", "A Major"]
    };
  };
  global.render = function() {};
  global.saveState = function() {};
  global.strumChord = function() {};
  global.rhythmTick = function() {};
  global.setInterval = function(fn) {
    fn();
    return 123;
  };
  global.clearInterval = function() {};
  global.requestAnimationFrame = function() { return 1; };
  global.performance = { now: function() { return 2500; } };
  global.S = global.S || {};
  global.T = {};
  global.SCR = global.SCR || {};
  global.SCR.SONG = "song";
  global.S.importedSongs = [{
    title: "Imported Groove",
    artist: "Spark User",
    bpm: 96,
    chords: ["Am", "F"],
    progression: ["Am", "F", "C", "G"],
    pattern: ["D", "U"]
  }];
  global.S.importText = "";
  global.S.importedSong = null;
  global.S.importError = null;
  global.S.communityTab = "browse";
  global.S.communitySearch = "";
  global.S.communitySort = "popular";
  global.S.submitSong = {
    title: "Shared Song",
    artist: "Spark Artist",
    chords: ["C Major", "G Major"],
    progression: ["C Major", "G Major"],
    bpm: 102,
    pattern: [],
    submittedBy: "Tester"
  };
  global.S.rhythmBpm = 120;
  global.S.rhythmActive = false;
  global.S.dualChord = "C Major";
  global.S.dualAnchorOn = false;
  global.S.dailyGoalMinutes = 10;
  global.S.customSets = [{ name: "Old Set", chords: ["C Major", "G Major"] }];
  global.S.editingSet = false;
  global.S.editingSetIdx = -1;
  global.S.customSetName = "";
  global.S.customSetChords = [];
  global.S.rhythmResults = { score: 20 };
  global.S.progPickerOpen = false;
  global.S.progChords = ["C Major", "G Major"];
  global.S.progBpm = 90;
  global.S.progPlaying = false;
  global.S.progBeat = 0;
  global.S.runnerResults = { score: 50 };
  global.COMMON_PROGRESSIONS = [
    { name: "Axis", key: "C", chords: ["C Major", "G Major", "A Minor", "F Major"] }
  ];
  global.COMMUNITY_URL = "https://community.example";
  global.CHORDS = { 1: [{ name: "C Major" }, { name: "G Major" }] };
  global.S.level = 1;

  assert.strictEqual(toolsSource.indexOf("S.importMsg ="), -1);

  eval(toolsSource);

  assert.strictEqual(__actionFamilies.tools("dualChord", "G Major"), true);
  assert.strictEqual(__actionFamilies.tools("toggleAnchor"), true);
  assert.strictEqual(__actionFamilies.tools("setGoal", "25"), true);
  assert.strictEqual(__actionFamilies.tools("newSet"), true);
  assert.strictEqual(__actionFamilies.tools("setName", "Bright Set"), true);
  assert.strictEqual(__actionFamilies.tools("toggleSetChord", "C Major"), true);
  assert.strictEqual(__actionFamilies.tools("toggleSetChord", "G Major"), true);
  assert.strictEqual(__actionFamilies.tools("saveSet"), true);
  assert.strictEqual(__actionFamilies.tools("deleteSet", "1"), true);
  assert.strictEqual(__actionFamilies.tools("editSet", "0"), true);
  assert.strictEqual(__actionFamilies.tools("cancelSet"), true);
  assert.strictEqual(__actionFamilies.tools("rhythmBpm", "132"), true);
  assert.strictEqual(__actionFamilies.tools("rhythmResultsBack"), true);
  assert.strictEqual(__actionFamilies.tools("progPickerToggle"), true);
  assert.strictEqual(__actionFamilies.tools("progAdd", "A Minor"), true);
  assert.strictEqual(__actionFamilies.tools("progRemove", "1"), true);
  assert.strictEqual(__actionFamilies.tools("progMove", "1:left"), true);
  assert.strictEqual(__actionFamilies.tools("progTemplate", "0"), true);
  assert.strictEqual(__actionFamilies.tools("progBpm", "112"), true);
  assert.strictEqual(__actionFamilies.tools("progPlay"), true);
  assert.strictEqual(__actionFamilies.tools("progPlay"), true);
  assert.strictEqual(__actionFamilies.tools("progClear"), true);
  assert.strictEqual(__actionFamilies.tools("importText", "D A G A"), true);
  assert.strictEqual(__actionFamilies.tools("parseImport"), true);
  assert.strictEqual(__actionFamilies.tools("importTitle", "Bridge Import"), true);
  assert.strictEqual(__actionFamilies.tools("importArtist", "Core User"), true);
  assert.strictEqual(__actionFamilies.tools("importBpm", "104"), true);
  assert.strictEqual(__actionFamilies.tools("saveImport"), true);
  assert.strictEqual(__actionFamilies.tools("communityTab", "latest"), true);
  assert.strictEqual(__actionFamilies.tools("communitySearch", "groove"), true);
  assert.strictEqual(__actionFamilies.tools("communitySort", "newest"), true);
  assert.strictEqual(__actionFamilies.tools("submitField", "title:Shared Song Updated"), true);
  assert.strictEqual(__actionFamilies.tools("submitToggleChord", "A Minor"), true);
  assert.strictEqual(__actionFamilies.tools("submitSong"), true);
  assert.strictEqual(__actionFamilies.tools("playImport", "0"), true);
  assert.strictEqual(__actionFamilies.tools("deleteImport", "1"), true);
  assert.strictEqual(__actionFamilies.tools("runnerResultsBack"), true);
  assert.strictEqual(__actionFamilies.tools("startRhythm"), true);

  assert.strictEqual(songRequests.length, 1);
  assert.strictEqual(songRequests[0].source, "imported");
  assert.strictEqual(songRequests[0].songData.title, "Imported Groove");
  assert.strictEqual(rhythmRequests.length, 1);
  assert.ok(Array.isArray(rhythmRequests[0].beats));
  assert.ok(rhythmRequests[0].beats.length > 0);
  assert.ok(runtimeUpdates.some(function(update) {
    return JSON.stringify(update) === JSON.stringify({
      setFields: {
        selectedSong: global.S.importedSongs[0],
        songPlaying: false,
        songBeat: 0,
        screen: "song"
      },
      clearIntervals: ["song"],
      save: undefined
    });
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update &&
      update.setFields &&
      update.setFields.rhythmActive === true &&
      Array.isArray(update.setFields.rhythmBeats) &&
      update.setFields.rhythmScore === 0;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.dualChord === "G Major";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.dualAnchorOn === true;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.dailyGoalMinutes === 25;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.customSetName === "Bright Set";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.customSetChords) && update.setFields.customSetChords.indexOf("C Major") >= 0;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.customSets) && update.setFields.customSets.some(function(set) {
      return set && set.name === "Bright Set";
    });
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.rhythmBpm === 132;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Object.prototype.hasOwnProperty.call(update.setFields, "rhythmResults") && update.setFields.rhythmResults === null;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.progPickerOpen === true;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.progChords) && update.setFields.progChords.indexOf("A Minor") >= 0;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.progBpm === 112;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.progPlaying === true && update.setFields.progBeat === 0;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.progBeat === 1;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.progPlaying === false && Array.isArray(update.clearIntervals) && update.clearIntervals.indexOf("prog") >= 0;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.progChords) && update.setFields.progChords.length === 0;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.importText === "D A G A";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.importedSong && update.setFields.importedSong.title === "Imported Song";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.importedSong && update.setFields.importedSong.title === "Bridge Import";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.importedSong && update.setFields.importedSong.artist === "Core User";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.importedSong && update.setFields.importedSong.bpm === 104;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.importedSongs) && update.setFields.importedSongs.length === 2;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.importedSongs) && update.setFields.importedSongs.length === 1;
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.communityTab === "latest";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.communitySearch === "groove";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.communitySort === "newest";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && Object.prototype.hasOwnProperty.call(update.setFields, "runnerResults") && update.setFields.runnerResults === null;
  }));
  assert.deepStrictEqual(songBrowserRequests, [
    { action: "community_tab", payload: { communityTab: "latest" } },
    { action: "community_search", payload: { communitySearch: "groove" } },
    { action: "community_sort", payload: { communitySort: "newest" } }
  ]);
  assert.strictEqual(communityFetches, 3);
  assert.strictEqual(fetchCalls.length, 1);
  assert.strictEqual(fetchCalls[0].url, "https://community.example/api/songs");
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.submitSong && update.setFields.submitSong.title === "" && update.setFields.communityTab === "browse";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.submitSong && update.setFields.submitSong.title === "Shared Song Updated";
  }));
  assert.ok(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.submitSong && Array.isArray(update.setFields.submitSong.chords) && update.setFields.submitSong.chords.indexOf("A Minor") >= 0;
  }));
  assert.strictEqual(S.dualChord, "G Major");
  assert.strictEqual(S.dualAnchorOn, true);
  assert.strictEqual(S.dailyGoalMinutes, 25);
  assert.strictEqual(S.editingSet, false);
  assert.deepStrictEqual(S.customSets, [{ name: "Old Set", chords: ["C Major", "G Major"] }]);
  assert.strictEqual(S.rhythmBpm, 132);
  assert.deepStrictEqual(S.progChords, []);
  assert.strictEqual(S.progPlaying, false);
  assert.strictEqual(S.importedSongs.length, 1);
  assert.strictEqual(S.importedSong, null);
  assert.strictEqual(S.importText, "");
  assert.strictEqual(S.importError, null);
  assert.strictEqual(S.communityTab, "browse");
  assert.strictEqual(S.communitySearch, "groove");
  assert.strictEqual(S.communitySort, "newest");
  assert.strictEqual(S.submitSong.title, "");
  assert.strictEqual(S.runnerResults, null);
});

test("practice planning helpers can resolve sparkCore from the global binding", function() {
  var core = createDefaultSparkCore();
  var syncedChallenge = null;
  var syncedComplete = null;
  global.window = {};
  global.sparkCore = core;
  eval(loadJS("js/performance/recommendations.js"));
  eval(loadJS("js/performance/practice_engine.js"));
  eval(loadJS("js/practice/plan.js"));
  var legacyGenerateDailyPracticePlan = global.window.generateDailyPracticePlan;
  var legacyCompletePracticeItem = global.window.completePracticeItem;
  var performanceGeneratePracticePlan = global.window.generatePracticePlan;
  var performanceMarkPracticePlanItem = global.window.markPracticePlanItem;
  var chooseDailyChallenge = global.window.choosePerformanceDailyChallenge;
  var completeDailyChallenge = global.window.markPerformanceDailyComplete;

  var plan = legacyGenerateDailyPracticePlan();
  assert.ok(plan);
  assert.strictEqual(plan.items.length, 2);
  assert.strictEqual(plan.curriculum.nextLessonId, "session_1");
  assert.strictEqual(core.getRuntimeState().activeFlow, "daily_practice");

  var completion = legacyCompletePracticeItem(plan.items[0].id, { accuracy: 0.82 });
  assert.ok(completion);
  assert.strictEqual(completion.planCompleted, false);

  var performancePlan = performanceGeneratePracticePlan();
  assert.ok(performancePlan);
  assert.strictEqual(performancePlan.items.length, 2);

  var performanceCompletion = performanceMarkPracticePlanItem(performancePlan.items[1].id);
  assert.ok(performanceCompletion);
  assert.strictEqual(typeof performanceCompletion.planCompleted, "boolean");

  core.syncPerformanceDailyChallengeState = function(challenge, isComplete) {
    syncedChallenge = challenge;
    syncedComplete = isComplete;
  };

  var challenge = chooseDailyChallenge();
  assert.ok(challenge);
  assert.strictEqual(syncedChallenge.id, challenge.id);
  assert.strictEqual(syncedComplete, false);

  var xp = completeDailyChallenge();
  assert.strictEqual(xp, challenge.xp || 0);
  assert.strictEqual(syncedChallenge.id, challenge.id);
  assert.strictEqual(syncedComplete, true);

  delete global.sparkCore;
});

test("performance and studio action families can resolve sparkCore from the global binding", function() {
  var syncCalls = [];
  var editorSyncs = [];
  var runtimeUpdates = [];
  var performanceSelections = [];
  var practicePlanRequests = [];
  var segmentLookups = [];
  var runtimeCompletions = [];
  global.window = {};
  global.sparkCore = {
    startSession: function(payload) {
      return payload;
    },
    syncPerformanceRuntimeState: function(action, payload) {
      syncCalls.push({ action: action, payload: payload });
      return payload;
    },
    getRuntimeState: function() {
      return {
        performanceSongIndex: 4,
        performanceSongTitle: "Night Drive"
      };
    },
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          segments: [
            { id: "warmup_1", type: "practice", exerciseIds: ["ex_warmup"] }
          ],
          exercises: [
            { id: "ex_warmup", type: "practice", data: { core: { skill: "timing" }, gameplay: {} } }
          ]
        },
        runtimeState: {
          performanceTargetTechnique: "tap"
        }
      };
    },
    getSegmentById: function(id) {
      segmentLookups.push(id);
      return {
        meta: {
          gameplayPayload: { chartId: "seg_chart" }
        }
      };
    }
  };
  global.window.SparkSessionRuntime = {
    completeSegmentById: function(id, result, options) {
      runtimeCompletions.push({ id: id, result: result, options: options });
      return { hasNext: false, nextIndex: -1 };
    }
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = global.SparkProgressBridge || {};
  global.SparkProgressBridge.applyLegacyActivityRuntime = function(update) {
    if (update && update.setFields) {
      Object.keys(update.setFields).forEach(function(key) {
        S[key] = update.setFields[key];
      });
    }
    runtimeUpdates.push(update);
    return update;
  };
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.openPerformanceSongSelectionRequest = function(payload) {
    performanceSelections.push(payload);
    return payload;
  };
  global.syncPerformanceEditorDocumentState = function(chart, options) {
    editorSyncs.push({ chart: chart, options: options || {} });
  };
  global.applyPerformanceEditorCoreMutation = function(action, payload) {
    if (action === "set_title") {
      return {
        chart: Object.assign({}, S.performEditorChart, { title: payload.title })
      };
    }
    if (action === "set_bpm") {
      return {
        chart: Object.assign({}, S.performEditorChart, { bpm: payload.bpm })
      };
    }
    return null;
  };
  global.openPracticePlanScreenRequest = function(payload) {
    practicePlanRequests.push({ kind: "open", payload: payload || {} });
    return payload || {};
  };
  global.completeDailyPracticePlanRequest = function(payload) {
    practicePlanRequests.push({ kind: "complete", payload: payload || {} });
    return payload || {};
  };
  global.openDailyPracticePlanRequest = function(payload) {
    practicePlanRequests.push({ kind: "regenerate", payload: payload || {} });
    return payload || {};
  };
  global.render = function() {};
  global.saveState = function() {};
  global.setTimeout = function(fn) { if (typeof fn === "function") fn(); return 1; };
  global.performance = { now: function() { return 1000; } };
  global.Blob = function(parts, opts) { this.parts = parts; this.opts = opts; };
  global.URL = {
    createObjectURL: function() { return "blob:mock"; },
    revokeObjectURL: function() {}
  };
  global.document = {
    body: {
      appendChild: function() {},
      removeChild: function() {}
    },
    createElement: function() {
      return {
        click: function() {}
      };
    }
  };
  global.resolveModuleExerciseLaunchOptions = function(v) { return v; };
  global.buildModuleExerciseRhythmPayload = function() { return null; };
  global.startRhythmHighwaySegment = function() { return true; };
  global._createRhythmHighwayLoopSpec = function() { return { startSec: 0, endSec: 4 }; };
  global.applyPerformanceDifficultyToState = function(v) {
    S.performDifficulty = v || "normal";
  };
  global.applyPerformanceStemPreset = function(v) {
    S.performPracticePreset = v;
  };
  global.PerformanceTransport = {
    setSpeed: function(v) {
      S.performSpeed = v;
    }
  };
  global.SCR = global.SCR || {};
  global.TAB = global.TAB || {};
  global.SCR.PERFORM_SONG = "performSong";
  global.SCR.PLAN = "plan";
  global.S.screen = "home";
  global.S.performArrangementType = "chords";
  global.S.performDifficulty = "normal";
  global.S.performSpeed = 1;
  global.S.performPracticePreset = "full_mix";
  global.S.performMode = "midi";
  global.S.performTargetTechnique = null;
  global.S.performEditorMode = "chords";
  global.S.performEditorSnap = "1/8";
  global.S.performEditorDirty = false;
  global.S.performEditorChart = {
    id: "custom_chart",
    title: "Old Chart",
    artist: "Custom",
    bpm: 90,
    events: [],
    phrases: []
  };
  global.S.activeCoreSegmentId = "segment_7";
  global.S.rhythmHighwaySnapshot = {};
  global.S.performChart = { phrases: [], events: [] };
  global.S.performResults = { phraseStats: [] };

  eval(loadJS("js/actions/performance_family.js"));
  eval(loadJS("js/actions/studio_family.js"));

  __actionFamilies.performance("performArrangement", "rhythm_chords");
  __actionFamilies.performance("performDifficulty", "hard");
  __actionFamilies.performance("performSpeed", "0.8");
  __actionFamilies.performance("performPracticePreset", "guitar_solo");
  __actionFamilies.performance("performStatsFocus", "accuracy");
  __actionFamilies.performance("editorMode", "lead");
  __actionFamilies.performance("editorSnap", "1/16");
  __actionFamilies.performance("editorTitle", "Bridge Chart");
  __actionFamilies.performance("editorBpm", "128");
  __actionFamilies.studio("openPlan");
  __actionFamilies.studio("completePlanItem", "warmup_1");
  __actionFamilies.studio("regeneratePlan");
  __actionFamilies.studio("planStartPerformanceSong", "night_drive|rhythm_chords|hard");
  __actionFamilies.studio("rhythmHighwayLoopWindow");

  assert.deepStrictEqual(syncCalls.map(function(entry) { return entry.action; }), [
    "configure",
    "configure",
    "configure",
    "configure",
    "configure_stats"
  ]);
  assert.strictEqual(syncCalls[0].payload.arrangementType, "rhythm_chords");
  assert.strictEqual(syncCalls[1].payload.songIndex, 4);
  assert.strictEqual(syncCalls[1].payload.songTitle, "Night Drive");
  assert.strictEqual(syncCalls[2].payload.speed, 0.8);
  assert.strictEqual(syncCalls[3].payload.preset, "guitar_solo");
  assert.strictEqual(syncCalls[4].payload.focus, "accuracy");
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorMode === "lead";
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorSnap === "1/16";
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorChart && update.setFields.performEditorChart.title === "Bridge Chart";
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorChart && update.setFields.performEditorChart.bpm === 128;
  }), true);
  assert.strictEqual(S.performEditorMode, "lead");
  assert.strictEqual(S.performEditorSnap, "1/16");
  assert.strictEqual(S.performEditorChart.title, "Bridge Chart");
  assert.strictEqual(S.performEditorChart.bpm, 128);
  assert.strictEqual(S.performEditorDirty, true);
  assert.strictEqual(editorSyncs.length, 4);
  assert.deepStrictEqual(runtimeCompletions, [{
    id: "warmup_1",
    result: null,
    options: { autoAdvance: false }
  }]);
  assert.deepStrictEqual(practicePlanRequests, [
    { kind: "open", payload: {} },
    { kind: "regenerate", payload: { forceRebuild: true } }
  ]);
  assert.strictEqual(performanceSelections.length, 1);
  assert.strictEqual(performanceSelections[0].songId, "night_drive");
  assert.strictEqual(performanceSelections[0].arrangementType, "rhythm_chords");
  assert.strictEqual(performanceSelections[0].difficultyId, "hard");
  assert.deepStrictEqual(segmentLookups, ["segment_7"]);

  delete global.sparkCore;
});

test("studio action family routes plan launch state through the shared bridge", function() {
  var runtimeUpdates = [];
  var skillFocusRequests = [];
  var planRequests = [];
  var rhythmStarts = [];
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: { flow: "daily_practice" },
        runtimeState: { activeScreen: "daily_practice" }
      };
    },
    getSegmentById: function() {
      return {
        meta: {
          gameplayPayload: { chartId: "loop_chart" }
        }
      };
    }
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = global.SparkProgressBridge || {};
  global.SparkProgressBridge.applyLegacyActivityRuntime = function(update) {
    if (update && update.setFields) {
      Object.keys(update.setFields).forEach(function(key) {
        S[key] = update.setFields[key];
      });
    }
    runtimeUpdates.push(update);
    return update;
  };
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.openPracticePlanScreenRequest = function(payload) {
    planRequests.push(payload || {});
    return payload || {};
  };
  global.setSkillTreeFocusRequest = function(focus) {
    skillFocusRequests.push(focus);
    return focus;
  };
  global.startRhythmHighwaySegment = function(segmentId, preset) {
    rhythmStarts.push({ segmentId: segmentId, preset: preset, loop: arguments.length > 2 ? arguments[2] : undefined });
    return true;
  };
  global._createRhythmHighwayLoopSpec = function(payload) {
    return { chartId: payload.chartId, startSec: 1, endSec: 5 };
  };
  global.findChordByName = function(name) {
    return { name: name };
  };
  global.render = function() {};
  global.SCR = global.SCR || {};
  global.TAB = global.TAB || {};
  global.SCR.HOME = "home";
  global.SCR.DRILL = "drill";
  global.SCR.PLAN = "plan";
  global.SCR.GUIDED = "guided";
  global.TAB.PRACTICE = "practice";
  global.S = global.S || {};
  global.S.activeCoreSegmentId = "segment_7";
  global.S.rhythmHighwayPreset = "spark_learning";
  global.S.rhythmHighwayHeldMask = 0;
  global.S.rhythmHighwaySnapshot = {};

  eval(loadJS("js/actions/studio_family.js"));

  __actionFamilies.studio("planStartWarmup");
  __actionFamilies.studio("planStartTransition", "C Major|G Major");
  __actionFamilies.studio("planStartRhythm", "110");
  __actionFamilies.studio("rhythmHighwayPreset", "tight");
  __actionFamilies.studio("rhythmHighwayLane", "2");
  __actionFamilies.studio("rhythmHighwayLoopWindow");
  __actionFamilies.studio("rhythmHighwayClearLoop");
  __actionFamilies.studio("skillTreeFocus", "rhythm");
  __actionFamilies.studio("openPlan");

  assert.deepStrictEqual(runtimeUpdates[0], {
    setFields: { screen: "home", tab: "practice" },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[1], {
    setFields: {
      drillChords: [{ name: "C Major" }, { name: "G Major" }],
      drillIdx: 0,
      drillTimer: 60,
      screen: "drill"
    },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[2], {
    setFields: { rhythmBpm: 110, rhythmActive: false, screen: "home", tab: "games" },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[3], {
    setFields: { rhythmHighwayPreset: "tight" },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[4], {
    setFields: { rhythmHighwayHeldMask: 4 },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[5], {
    setFields: { rhythmHighwayLoop: { chartId: "loop_chart", startSec: 1, endSec: 5 } },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[6], {
    setFields: { rhythmHighwayLoop: null },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[7], {
    setFields: { skillTreeFocus: "rhythm" },
    save: false
  });
  assert.deepStrictEqual(runtimeUpdates[8], {
    setFields: { screen: "plan" },
    save: false
  });
  assert.deepStrictEqual(skillFocusRequests, ["rhythm"]);
  assert.deepStrictEqual(planRequests, [{}]);
  assert.deepStrictEqual(rhythmStarts, [
    { segmentId: "segment_7", preset: "tight", loop: undefined },
    { segmentId: "segment_7", preset: "tight", loop: { chartId: "loop_chart", startSec: 1, endSec: 5 } },
    { segmentId: "segment_7", preset: "tight", loop: null }
  ]);
  assert.strictEqual(S.screen, "plan");
  assert.strictEqual(S.tab, "games");
  assert.strictEqual(S.rhythmBpm, 110);
  assert.strictEqual(S.rhythmHighwayPreset, "tight");
  assert.strictEqual(S.rhythmHighwayHeldMask, 4);
  assert.strictEqual(S.rhythmHighwayLoop, null);
  assert.strictEqual(S.skillTreeFocus, "rhythm");
});

test("studio action family routes performance editor state through the shared bridge", function() {
  var runtimeUpdates = [];
  var editorSyncs = [];
  var saveCalls = 0;
  global.window = {};
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = global.SparkProgressBridge || {};
  global.SparkProgressBridge.applyLegacyActivityRuntime = function(update) {
    if (update && update.setFields) {
      Object.keys(update.setFields).forEach(function(key) {
        S[key] = update.setFields[key];
      });
    }
    runtimeUpdates.push(update);
    return update;
  };
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.syncPerformanceEditorDocumentState = function(chart, options) {
    editorSyncs.push({ chart: chart, options: options || {} });
  };
  global.applyPerformanceEditorCoreMutation = function(action, payload) {
    var chart = JSON.parse(JSON.stringify(S.performEditorChart || {
      id: "chart_1",
      title: "Bridge Chart",
      events: [],
      phrases: []
    }));
    if (action === "select_event") return { chart: chart };
    if (action === "add_event") {
      chart.events.push({ id: 2, laneLabel: "G", t: 2, dur: 1 });
      return { chart: chart };
    }
    if (action === "delete_event") {
      chart.events = chart.events.filter(function(event) { return event.id !== payload.id; });
      return { chart: chart };
    }
    if (action === "update_event") {
      chart.events = chart.events.map(function(event) {
        return event.id === payload.id ? Object.assign({}, event, { laneLabel: payload.val }) : event;
      });
      return { chart: chart };
    }
    if (action === "add_phrase") {
      chart.phrases.push({ id: 1, name: "Chorus", startSec: 8, endSec: 16 });
      return { chart: chart };
    }
    if (action === "select_phrase") return { chart: chart };
    if (action === "update_phrase") {
      chart.phrases = chart.phrases.map(function(phrase) {
        return phrase.id === payload.id ? Object.assign({}, phrase, { name: payload.val }) : phrase;
      });
      return { chart: chart };
    }
    if (action === "delete_phrase") {
      chart.phrases = chart.phrases.filter(function(phrase) { return phrase.id !== payload.id; });
      return { chart: chart };
    }
    if (action === "save_to_library") return { library: [chart] };
    if (action === "load_from_library") return { chart: S.performEditorLibrary[payload.index], library: S.performEditorLibrary };
    if (action === "delete_from_library") return { library: [] };
    return null;
  };
  global.render = function() {};
  global.saveState = function() { saveCalls += 1; };
  global.S = global.S || {};
  global.S.performEditorMode = "chords";
  global.S.performEditorDirty = false;
  global.S.performEditorSelectedEventId = null;
  global.S.performEditorSelectedPhraseId = null;
  global.S.performEditorChart = {
    id: "chart_1",
    title: "Bridge Chart",
    events: [{ id: 1, laneLabel: "C", t: 0, dur: 1 }],
    phrases: [{ id: 0, name: "Verse", startSec: 0, endSec: 8 }]
  };
  global.S.performEditorLibrary = [];

  eval(loadJS("js/actions/studio_family.js"));

  __actionFamilies.studio("editorSelectEvent", "1");
  __actionFamilies.studio("editorAddEvent");
  __actionFamilies.studio("editorDeleteEvent", "1");
  __actionFamilies.studio("editorEvt", JSON.stringify({ id: 2, prop: "label", val: "Am" }));
  __actionFamilies.studio("editorAddPhrase");
  __actionFamilies.studio("editorSelectPhrase", "1");
  __actionFamilies.studio("editorPhrase", JSON.stringify({ id: 1, prop: "name", val: "Bridge" }));
  __actionFamilies.studio("editorDeletePhrase", "1");
  __actionFamilies.studio("editorSave");
  __actionFamilies.studio("editorLoad", "0");
  __actionFamilies.studio("editorDelete", "0");

  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorSelectedEventId === 1;
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorChart && update.setFields.performEditorChart.events.length === 2;
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorSelectedEventId === null;
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && update.setFields.performEditorSelectedPhraseId === 1;
  }), true);
  assert.strictEqual(runtimeUpdates.some(function(update) {
    return update && update.setFields && Array.isArray(update.setFields.performEditorLibrary);
  }), true);
  assert.strictEqual(S.performEditorLibrary.length, 0);
  assert.strictEqual(S.performEditorDirty, false);
  assert.strictEqual(saveCalls, 2);
  assert.strictEqual(editorSyncs.length, 10);
});

test("performance action family routes showroom and config state through the shared bridge", function() {
  var runtimeUpdates = [];
  var performanceSyncs = [];
  var activated = [];
  var starts = [];
  var dailyRequests = [];
  var inputStarts = [];
  var speedChanges = [];
  var saveCalls = 0;
  global.window = {};
  global.sparkCore = {
    getRuntimeState: function() {
      return {
        performanceSongIndex: 2,
        performanceSongTitle: "Night Drive"
      };
    },
    syncPerformanceRuntimeState: function(action, payload) {
      performanceSyncs.push({ action: action, payload: payload });
      return payload;
    }
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.SparkProgressBridge = global.SparkProgressBridge || {};
  global.SparkProgressBridge.applyLegacyActivityRuntime = function(update) {
    if (update && update.setFields) {
      Object.keys(update.setFields).forEach(function(key) {
        S[key] = update.setFields[key];
      });
    }
    runtimeUpdates.push(update);
    return update;
  };
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.SparkInstruments = {
    getActive: function() { return null; },
    getAll: function() {
      return [{
        id: "bassspark",
        appId: "bassspark",
        instrument: "bass",
        getData: function() {
          return {
            SONGS: [{ id: "night_drive", title: "Night Drive", bpm: 100 }]
          };
        }
      }];
    },
    activate: function(appId) {
      activated.push(appId);
      S.activeInstrument = appId;
    }
  };
  global.buildPerformanceChartFromSong = function(song) {
    return { id: "chart_" + song.id, title: song.title, events: [] };
  };
  global.startPerformance = function(chart, options) {
    starts.push({ chart: chart, options: options || null });
    return true;
  };
  global.choosePerformanceDailyChallenge = function() {
    return {
      songId: "night_drive",
      arrangementType: "rhythm_chords",
      difficultyId: "hard",
      techniqueKey: "tap"
    };
  };
  global.openPerformanceDailyChallengeRequest = function(payload) {
    dailyRequests.push(payload || {});
    return payload || {};
  };
  global.resolvePerformanceSongId = function(song) {
    return song.id || String(song.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  };
  global.PerformanceInput = {
    start: function(mode) {
      inputStarts.push(mode);
    }
  };
  global.PerformanceTransport = {
    setSpeed: function(speed) {
      speedChanges.push(speed);
    }
  };
  global.saveState = function() {
    saveCalls += 1;
  };
  global.render = function() {};
  global.SCR = global.SCR || {};
  global.TAB = global.TAB || {};
  global.SCR.HOME = "home";
  global.SCR.PERFORM_SONG = "performSong";
  global.TAB.PRACTICE = "practice";
  global.S = global.S || {};
  global.S.activeInstrument = null;
  global.S.launcherView = "performance";
  global.S._showroomOverride = "bass";
  global.S.performArrangementType = "chords";
  global.S.performDifficulty = "normal";
  global.S.performMode = "midi";
  global.S.performInputSource = "midi";
  global.S.performSpeed = 1;
  global.S.performDebug = false;
  global.SONGS = [{ id: "night_drive", title: "Night Drive", bpm: 100 }];

  eval(loadJS("js/actions/performance_family.js"));

  __actionFamilies.performance("showroomPlayLibrarySong", "night_drive|bass");
  __actionFamilies.performance("openPerformanceDaily");
  __actionFamilies.performance("performArrangement", "rhythm_chords");
  __actionFamilies.performance("performMode", "mic");
  __actionFamilies.performance("performSpeed", "0.75");
  __actionFamilies.performance("performDebug");
  S.selectedSong = null;
  S.performChart = null;
  __actionFamilies.performance("showroomStartPerf", "missing");

  assert.deepStrictEqual(activated, ["bassspark"]);
  assert.strictEqual(starts.length, 1);
  assert.strictEqual(starts[0].chart.id, "chart_night_drive");
  assert.strictEqual(dailyRequests.length, 1);
  assert.strictEqual(dailyRequests[0].songId, "night_drive");
  assert.strictEqual(dailyRequests[0].difficultyId, "hard");
  assert.deepStrictEqual(performanceSyncs.map(function(entry) { return entry.action; }), [
    "configure",
    "configure",
    "configure"
  ]);
  assert.deepStrictEqual(inputStarts, ["mic"]);
  assert.deepStrictEqual(speedChanges, [0.75]);
  assert.strictEqual(saveCalls, 3);
  assert.deepStrictEqual(runtimeUpdates.map(function(update) { return update && update.setFields; }), [
    { selectedSong: { id: "night_drive", title: "Night Drive", bpm: 100 } },
    {
      performSongData: { id: "night_drive", title: "Night Drive", bpm: 100 },
      performSongId: "night_drive",
      performArrangementType: "rhythm_chords",
      performDifficulty: "hard",
      screen: "performSong"
    },
    { performArrangementType: "rhythm_chords" },
    { performMode: "mic", performInputSource: "mic" },
    { performSpeed: 0.75 },
    { performDebug: true },
    { screen: "home", tab: "practice" }
  ]);
  assert.strictEqual(runtimeUpdates[0].setFields.selectedSong.title, "Night Drive");
  assert.strictEqual(S.performSongId, "night_drive");
  assert.strictEqual(S.performArrangementType, "rhythm_chords");
  assert.strictEqual(S.performMode, "mic");
  assert.strictEqual(S.performSpeed, 0.75);
  assert.strictEqual(S.performDebug, true);
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "practice");

  delete global.sparkCore;
});

test("dashboard utility UI surfaces can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.sparkCore = {
    getRuntimeState: function() {
      return {
        cloudLoggedIn: true,
        cloudEmail: "scott@example.com",
        cloudLastSyncStatus: "ok",
        cloudLastSyncAt: Date.now() - 60000,
        curriculumLoading: false,
        curriculumLastManifestPath: "curriculum/manifest.json",
        curriculumLastLoadStatus: "ok",
        curriculumSummaries: [{ id: "guitar", title: "Guitar", trackCount: 1 }],
        contentLoading: false,
        contentLastManifestPath: "content/manifest.json",
        contentLastLoadStatus: "ok",
        curriculumPackSummaries: [{ id: "starter-pack", title: "Starter Pack", type: "songs" }],
        midiImportSummary: {
          tracks: [{ id: "track_1", name: "Piano RH", noteCount: 42 }]
        },
        midiImportAssignments: {
          track_1: "melody"
        },
        midiImportSeedMode: "piano_melody",
        midiImportSeedTitle: "Demo Seed",
        settingsTheme: "retro"
      };
    },
    getActiveSessionView: function() {
      return {
        runtimeState: {
          dashboardRecommendations: [{ id: "rec-1", title: "Recommendation" }],
          dashboardChallenges: [{ id: "challenge-1", title: "Challenge" }],
          dashboardInsights: {
            strongestSkills: [{ bucket: "timing", id: "sixteenth_grid", value: 0.91 }],
            weakestSkills: [{ bucket: "chords", id: "bm", value: 0.42 }],
            masteryTrend: { chords: [0.2, 0.5, 0.8] },
            practiceTrend: { minutes: [5, 10, 15] },
            recommendationQuality: { totalAccepted: 3, focusedTechnique: { songId: "night_drive", techniqueLabel: "tap notes", accuracy: 78 } },
            careerTrend: { clearedSongs: 4, averageStars: 3.5, completedStages: 2 }
          }
        }
      };
    }
  };
  global.escHTML = function(value) { return String(value); };
  global.isLoggedInSpark = function() { return false; };
  global.SparkCurriculum = { curriculums: {} };
  global.SparkContent = { packs: {} };
  global.S = global.S || {};
  global.S.cloudAuth = { email: null };
  global.S.cloudSync = { lastSyncStatus: "idle", lastSyncAt: null };
  global.S.personalInsights = {};
  global.S.lastInsightRun = Date.now();
  global.S.importedMidi = null;
  global.S.importedMidiAssignments = {};
  global.S.settings = { theme: "dark", uiVolume: 0.5, practiceReminder: false };
  global.S.releaseInfo = { version: "1.2.3", build: 7 };
  global.getCurriculumItem = function() { return null; };
  global.getSettingsCategories = function() {
    return [
      { id: "display", title: "Display" },
      { id: "about", title: "About" }
    ];
  };
  global.renderInsightLineChart = function(series) {
    return "<chart>" + (series || []).length + "</chart>";
  };
  global.getRecommendedCareerSong = function() {
    return { title: "Career Song" };
  };
  global.getActiveSeasonalEvent = function() {
    return { id: "event-1" };
  };

  eval(loadJS("js/cloud/ui.js"));
  eval(loadJS("js/curriculum/curriculum_ui.js"));
  eval(loadJS("js/home/home_engine.js"));
  eval(loadJS("js/import/midi_ui.js"));
  eval(loadJS("js/insights/ui.js"));
  eval(loadJS("js/settings/settings_ui.js"));

  var cloudHtml = global.window.cloudSettingsPage();
  var curriculumHtml = global.window.curriculumPage();
  var dashboardData = global.window.buildHomeDashboardData();
  var midiHtml = global.window.midiImportPage();
  var insightsHtml = insightsDashboardPage();
  var settingsHtml = settingsPage();

  assert.ok(cloudHtml.indexOf("scott@example.com") >= 0);
  assert.ok(curriculumHtml.indexOf("curriculum/manifest.json") >= 0);
  assert.strictEqual(dashboardData.recommendations[0].id, "rec-1");
  assert.strictEqual(dashboardData.challenges[0].id, "challenge-1");
  assert.strictEqual(dashboardData.insights.careerTrend.completedStages, 2);
  assert.ok(midiHtml.indexOf("Piano RH") >= 0);
  assert.ok(midiHtml.indexOf("Demo Seed") >= 0);
  assert.ok(insightsHtml.indexOf("tap notes is still at 78% in night drive") >= 0);
  assert.ok(settingsHtml.indexOf("retro") >= 0);

  delete global.sparkCore;
});

test("song family routes browser, playback, and completion state through the shared bridge", function() {
  var songSyncs = [];
  var songCompletions = [];
  var songRuntimeUpdates = [];
  var songCompletionUpdates = [];
  var browserRequests = [];
  var communityFetches = 0;
  var strumHits = [];
  var originalPracticeBridge = global.SparkPracticeBridge;
  global.window = {};
  global.sparkCore = {
    getRuntimeState: function() {
      return {
        songSessionSource: "community"
      };
    },
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          id: "plan_1"
        }
      };
    }
  };
  global.__actionFamilies = {};
  global.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.window.registerSparkActionFamily = global.registerSparkActionFamily;
  global.applySongBrowserRequest = function(action, payload) {
    browserRequests.push({ action: action, payload: payload });
    return payload;
  };
  global.fetchCommunity = function() {
    communityFetches += 1;
  };
  global.syncSongRuntimeRequest = function(action, payload) {
    songSyncs.push({ action: action, payload: payload });
    return payload;
  };
  global.completeSongSessionRequest = function(payload) {
    songCompletions.push(payload);
    return payload;
  };
  global.snd = function() {};
  global.render = function() {};
  global.strumChord = function(name) {
    strumHits.push(name);
  };
  global.setInterval = function(fn) {
    fn();
    return 1;
  };
  global.clearInterval = function() {};
  global.fireMicro = function() {};
  global.trigC = function() {};
  global.saveState = function() {};
  global.logHistory = function() {};
  global.checkBadges = function() {};
  global._sparkEmit = function() {};
  global.getActiveInstrumentIdentityForActivity = function() {
    return { appId: "chordspark" };
  };
  global.SparkProgressBridge = global.SparkProgressBridge || {};
  global.SparkProgressBridge.applyLegacyActivityRuntime = function(update) {
    if (update && update.setFields) {
      Object.keys(update.setFields).forEach(function(key) {
        S[key] = update.setFields[key];
      });
    }
    songRuntimeUpdates.push(update);
    return update;
  };
  global.SparkProgressBridge.applyLegacyActivityCompletion = function(update) {
    if (update && update.incrementFields) {
      Object.keys(update.incrementFields).forEach(function(key) {
        S[key] = (S[key] || 0) + update.incrementFields[key];
      });
    }
    songCompletionUpdates.push(update);
    return update;
  };
  global.window.SparkProgressBridge = global.SparkProgressBridge;
  global.CHORD_NAME_MAP = {};
  global.T = {};
  global.SCR = global.SCR || {};
  global.TAB = global.TAB || {};
  global.SCR.SONG_DONE = "song_done";
  global.SCR.HOME = "home";
  global.TAB.SONGS = "songs";
  global.S = global.S || {};
  global.S.selectedSong = {
    title: "Night Drive",
    bpm: 120,
    progression: ["C", "G", "Am"]
  };
  global.S.songsSubTab = "library";
  global.S.songPlaying = false;
  global.S.songBeat = 0;
  global.S.songsPlayed = 0;

  eval(loadJS("js/actions/song_family.js"));
  var showroomSource = loadJS("js/showroom/spark-showroom.js");

  __actionFamilies.songs("songsSubTab", "community");
  __actionFamilies.songs("toggleSong");
  __actionFamilies.songs("completeSong");
  __actionFamilies.songs("songDoneHome");

  assert.strictEqual(songSyncs[0].payload.source, "community");
  assert.strictEqual(songSyncs[1].action, "tick");
  assert.strictEqual(songSyncs[1].payload.songBeat, 1);
  assert.strictEqual(songCompletions[0].source, "community");
  assert.strictEqual(songRuntimeUpdates.length, 5);
  assert.deepStrictEqual(songRuntimeUpdates[0], {
    setFields: { songsSubTab: "community" }
  });
  assert.deepStrictEqual(songRuntimeUpdates[1], {
    setFields: { songPlaying: true, songBeat: 0 },
    clearIntervals: []
  });
  assert.deepStrictEqual(songRuntimeUpdates[2], {
    setFields: { songBeat: 1 },
    save: false
  });
  assert.deepStrictEqual(songRuntimeUpdates[3], {
    setFields: { songPlaying: false, screen: "song_done" },
    clearIntervals: ["song"]
  });
  assert.deepStrictEqual(songRuntimeUpdates[4], {
    setFields: { screen: "home", tab: "songs" }
  });
  assert.strictEqual(songCompletionUpdates.length, 1);
  assert.deepStrictEqual(songCompletionUpdates[0], {
    xpDelta: 40,
    incrementFields: { songsPlayed: 1 },
    history: { type: "song", detail: "Night Drive", xp: 40 },
    emit: { type: "lesson_completed", payload: { appId: "chordspark", lessonId: "song_Night Drive", xp: 40 } },
    checkBadges: true
  });
  assert.deepStrictEqual(browserRequests[0], {
    action: "songs_subtab",
    payload: { songsSubTab: "community" }
  });
  assert.strictEqual(communityFetches, 1);
  assert.deepStrictEqual(strumHits, ["C", "G"]);
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "songs");
  assert.strictEqual(S.songsSubTab, "community");
  assert.strictEqual(S.songBeat, 1);
  assert.strictEqual(S.songsPlayed, 1);
  assert.ok(showroomSource.indexOf("function getShowroomCoreView()") >= 0);
  assert.ok(showroomSource.indexOf("var view = getShowroomCoreView();") >= 0);

  global.SparkPracticeBridge = originalPracticeBridge;
  delete global.sparkCore;
});

test("SparkCore can open and complete guided sessions through explicit helpers", function() {
  var core = createDefaultSparkCore();
  var plan = core.openGuidedSession({ sessionNum: 2 });

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "guided_session");
  assert.strictEqual(core.getRuntimeState().activeScreen, "guided_session");
  assert.strictEqual(core.getRuntimeState().guidedStep, "spark");

  core.syncGuidedRuntimeState({
    guidedStep: "victoryLap"
  });
  var result = core.completeGuidedSession();
  assert.strictEqual(result.planCompleted, true);
  assert.strictEqual(result.completedItems, plan.segments.length);
  assert.strictEqual(plan.segments[plan.segments.length - 1].completed, true);
  assert.strictEqual(core.getRuntimeState().activeScreen, "guided_done");
  assert.strictEqual(core.getRuntimeState().transport.status, "completed");
});

test("SparkCore can apply guided navigation requests explicitly", function() {
  var core = createDefaultSparkCore();
  core.openGuidedSession({ sessionNum: 1 });

  var doneState = core.applyGuidedNavigationRequest("guided_done");
  assert.strictEqual(doneState.activeScreen, "guided_done");
  assert.strictEqual(doneState.transport.status, "completed");

  var homeState = core.applyGuidedNavigationRequest("guided_home");
  assert.strictEqual(homeState.activeScreen, "home");
  assert.strictEqual(homeState.activeTab, "practice");
  assert.strictEqual(homeState.guidedStep, null);
  assert.strictEqual(homeState.guidedNewMovePhase, null);
  assert.strictEqual(homeState.transport.status, "idle");
});

test("SparkCore can track guided runtime step and phase state explicitly", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });

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
  assert.strictEqual(state.activeSegmentId, plan.segments[0].id);
  assert.strictEqual(state.transport.status, "running");
  assert.strictEqual(state.transport.positionMs, 18000);
});

test("SparkCore can open, sync, navigate, and complete song sessions explicitly", function() {
  var core = createDefaultSparkCore();
  var request = core.openSongSession({
    songData: {
      title: "Fire Road",
      artist: "Spark Suite",
      bpm: 96,
      chords: ["C", "G"],
      progression: ["C", "G", "C", "G"],
      pattern: ["D", "D", "U", "U"]
    },
    source: "builtin"
  });

  assert.strictEqual(request.songData.title, "Fire Road");
  assert.strictEqual(core.getRuntimeState().activeFlow, "song_session");
  assert.strictEqual(core.getRuntimeState().activeScreen, "song");
  assert.strictEqual(core.getRuntimeState().activeTab, "songs");
  assert.strictEqual(core.getRuntimeState().songSessionSource, "builtin");
  assert.strictEqual(core.getRuntimeState().songPlaying, false);
  assert.strictEqual(core.getRuntimeState().transport.status, "ready");

  core.syncSongRuntimeState("play", { songBeat: 0 });
  assert.strictEqual(core.getRuntimeState().songPlaying, true);
  assert.strictEqual(core.getRuntimeState().transport.status, "running");

  core.syncSongRuntimeState("tick", { songBeat: 2 });
  assert.strictEqual(core.getRuntimeState().songBeat, 2);

  var doneRequest = core.completeSongSession();
  assert.strictEqual(doneRequest.activeScreen, "song_done");
  assert.strictEqual(core.getRuntimeState().activeScreen, "song_done");
  assert.strictEqual(core.getRuntimeState().songPlaying, false);
  assert.strictEqual(core.getRuntimeState().transport.status, "completed");

  var homeState = core.applySongNavigationRequest("songs_home");
  assert.strictEqual(homeState.activeScreen, "home");
  assert.strictEqual(homeState.activeTab, "songs");
  assert.strictEqual(homeState.transport.status, "idle");
});

test("SparkCore can track song browser state explicitly", function() {
  var core = createDefaultSparkCore();
  var state = core.applySongBrowserRequest("songs_subtab", {
    songsSubTab: "community",
    songFilter: "fire",
    songSort: "title",
    songSortAsc: false,
    communityTab: "submit",
    communitySearch: "suite",
    communitySort: "newest"
  });

  assert.strictEqual(state.activeTab, "songs");
  assert.strictEqual(state.songsSubTab, "community");
  assert.strictEqual(state.songFilter, "fire");
  assert.strictEqual(state.songSort, "title");
  assert.strictEqual(state.songSortAsc, false);
  assert.strictEqual(state.communityTab, "submit");
  assert.strictEqual(state.communitySearch, "suite");
  assert.strictEqual(state.communitySort, "newest");
});

test("SparkCore can track dashboard recommendation, insight, and challenge snapshots explicitly", function() {
  var core = createDefaultSparkCore();
  var state = core.applyDashboardRequest({
    recommendations: [{ id: "rec_1", title: "Practice G to C" }],
    insights: { strongestSkills: [{ id: "timing" }] },
    challenges: [{ id: "daily_1", title: "Daily Challenge" }],
    refreshedAt: 12345
  });

  assert.strictEqual(state.dashboardRecommendations.length, 1);
  assert.strictEqual(state.dashboardRecommendations[0].id, "rec_1");
  assert.strictEqual(state.dashboardInsights.strongestSkills[0].id, "timing");
  assert.strictEqual(state.dashboardChallenges[0].id, "daily_1");
  assert.strictEqual(state.lastDashboardRefreshAt, 12345);
});

test("SparkCore can refresh and initialize dashboard snapshots through explicit helpers", function() {
  var core = createDefaultSparkCore();
  var refreshState = core.refreshDashboardSnapshot({
    recommendations: [{ id: "rec_1", title: "Practice G to C" }],
    insights: { strongestSkills: [{ id: "timing" }] },
    challenges: [{ id: "daily_1", title: "Daily Challenge" }],
    refreshedAt: 12345
  });
  assert.strictEqual(refreshState.dashboardRecommendations[0].id, "rec_1");
  assert.strictEqual(refreshState.dashboardInsights.strongestSkills[0].id, "timing");
  assert.strictEqual(refreshState.lastDashboardRefreshAt, 12345);

  var initState = core.initializeDashboardChallenges({
    challenges: [{ id: "daily_2", title: "Weekly Challenge" }],
    refreshedAt: 67890
  });
  assert.strictEqual(initState.dashboardChallenges[0].id, "daily_2");
  assert.strictEqual(initState.dashboardRecommendations[0].id, "rec_1");
  assert.strictEqual(initState.lastDashboardRefreshAt, 67890);
});

test("SparkCore can track dashboard navigation and recommendation lookup explicitly", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    recommendations: [{ id: "rec_1", title: "Practice G to C" }]
  });

  var recommendationState = core.applyDashboardNavigationRequest("recommendations");
  assert.strictEqual(recommendationState.activeScreen, "recommendations");

  var insightState = core.applyDashboardNavigationRequest("insights");
  assert.strictEqual(insightState.activeScreen, "insights");

  var backState = core.applyDashboardNavigationRequest("dashboard_back");
  assert.strictEqual(backState.activeScreen, "home_dash");

  var homeState = core.applyDashboardNavigationRequest("home_dash");
  assert.strictEqual(homeState.activeScreen, "home_dash");

  var recommendation = core.getDashboardRecommendationById("rec_1");
  assert.strictEqual(recommendation.title, "Practice G to C");
  assert.strictEqual(core.getDashboardRecommendationById("missing"), null);
});

test("SparkCore can open dashboard sections through an explicit helper", function() {
  var core = createDefaultSparkCore();

  assert.strictEqual(core.openDashboardSection("recommendations").activeScreen, "recommendations");
  assert.strictEqual(core.openDashboardSection("career").activeScreen, "career");
  assert.strictEqual(core.openDashboardSection("insights").activeScreen, "insights");
  assert.strictEqual(core.openDashboardSection("challenges").activeScreen, "challenges");
  assert.strictEqual(core.openDashboardSection("home_dash").activeScreen, "home_dash");
});

test("SparkCore can return from dashboard-family and home-family screens explicitly", function() {
  var core = createDefaultSparkCore();

  core.openDashboardSection("recommendations");
  assert.strictEqual(core.returnFromHomeFamily({ currentScreen: "recommendations" }).activeScreen, "home_dash");

  var state = core.returnFromHomeFamily({ currentScreen: "home" });
  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkCore can open utility screens through an explicit helper", function() {
  var core = createDefaultSparkCore();

  assert.strictEqual(core.openUtilityScreen("settings").activeScreen, "settings");
  assert.strictEqual(core.openUtilityScreen("curriculum").activeScreen, "curriculum");
  assert.strictEqual(core.openUtilityScreen("cloud_settings").activeScreen, "cloud_settings");
  assert.strictEqual(core.openUtilityScreen("midi_settings").activeScreen, "midi_settings");
  assert.strictEqual(core.openUtilityScreen("midi_import").activeScreen, "midi_import");
});

test("SparkCore can open the skill tree through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var state = core.openSkillTree();

  assert.strictEqual(state.activeScreen, "skill_tree");
  assert.strictEqual(state.skillTreeFocus, "overview");
});

test("SparkCore can track skill tree focus through an explicit helper", function() {
  var core = createDefaultSparkCore();
  core.openSkillTree();

  var state = core.setSkillTreeFocus("rhythm");
  assert.strictEqual(state.activeScreen, "skill_tree");
  assert.strictEqual(state.skillTreeFocus, "rhythm");
});

test("SparkCore can open and close the stem player through explicit helpers", function() {
  var core = createDefaultSparkCore();

  var openState = core.openStemPlayer();
  assert.strictEqual(openState.activeScreen, "stems");
  assert.strictEqual(openState.activeTab, "songs");
  assert.strictEqual(openState.songsSubTab, "stems");

  var closeState = core.closeStemPlayer();
  assert.strictEqual(closeState.activeScreen, "home");
  assert.strictEqual(closeState.activeTab, "songs");
  assert.strictEqual(closeState.songsSubTab, "stems");
  assert.strictEqual(closeState.transport.status, "idle");
});

test("SparkCore can return from utility-family screens explicitly", function() {
  var core = createDefaultSparkCore();

  core.openUtilityScreen("settings");
  assert.strictEqual(core.returnFromUtilityFamily({ currentScreen: "settings" }).activeScreen, "home");

  core.openUtilityScreen("midi_import");
  var state = core.returnFromUtilityFamily({ currentScreen: "midi_import" });
  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.transport.status, "idle");
});

test("SparkCore can track settings, midi, cloud, and midi-import utility snapshots explicitly", function() {
  var core = createDefaultSparkCore();

  var settingsState = core.syncSettingsState({ theme: "retro" });
  assert.strictEqual(settingsState.settingsTheme, "retro");

  var midiState = core.syncMidiSettingsState({
    midiEnabled: true,
    activeDeviceId: "dev_1",
    activeDeviceName: "Keyboard",
    activeProfileId: "profile_1",
    activeProfileName: "Default Piano",
    deviceOptions: [{ id: "dev_1", name: "Keyboard" }],
    profileOptions: [{ id: "profile_1", name: "Default Piano", type: "piano" }]
  });
  assert.strictEqual(midiState.midiEnabled, true);
  assert.strictEqual(midiState.midiActiveDeviceId, "dev_1");
  assert.strictEqual(midiState.midiActiveDeviceName, "Keyboard");
  assert.strictEqual(midiState.midiActiveProfileId, "profile_1");
  assert.strictEqual(midiState.midiActiveProfileName, "Default Piano");
  assert.strictEqual(midiState.midiDeviceOptions[0].id, "dev_1");
  assert.strictEqual(midiState.midiProfileOptions[0].type, "piano");

  var cloudState = core.syncCloudSettingsState({
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "ok",
    lastSyncAt: 1712102400000
  });
  assert.strictEqual(cloudState.cloudLoggedIn, true);
  assert.strictEqual(cloudState.cloudEmail, "player@sparksuite.dev");
  assert.strictEqual(cloudState.cloudLastSyncStatus, "ok");
  assert.strictEqual(cloudState.cloudLastSyncAt, 1712102400000);

  var openedCloudState = core.openCloudSettings({
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "idle"
  });
  assert.strictEqual(openedCloudState.activeScreen, "cloud_settings");
  assert.strictEqual(openedCloudState.cloudLoggedIn, true);

  var syncingCloudState = core.applyCloudWorkflowRequest("sync_start", {
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "syncing"
  });
  assert.strictEqual(syncingCloudState.cloudLastSyncStatus, "syncing");

  var completedCloudState = core.applyCloudWorkflowRequest("sync_done", {
    loggedIn: true,
    email: "player@sparksuite.dev",
    lastSyncStatus: "ok",
    lastSyncAt: 1712102400000
  });
  assert.strictEqual(completedCloudState.cloudLastSyncStatus, "ok");
  assert.strictEqual(completedCloudState.cloudLastSyncAt, 1712102400000);

  var midiImportState = core.syncMidiImportState({
    summary: {
      sourceName: "lesson.mid",
      trackCount: 2,
      tracks: [
        { id: "t1", name: "Piano RH", noteCount: 24 },
        { id: "t2", name: "Piano LH", noteCount: 18 }
      ]
    },
    assignments: { t1: "melody", t2: "left_hand" },
    seedMode: "piano_left_hand",
    seedTitle: "Imported LH"
  });
  assert.strictEqual(midiImportState.midiImportSummary.sourceName, "lesson.mid");
  assert.strictEqual(midiImportState.midiImportSummary.trackCount, 2);
  assert.strictEqual(midiImportState.midiImportAssignments.t1, "melody");
  assert.strictEqual(midiImportState.midiImportSeedMode, "piano_left_hand");
  assert.strictEqual(midiImportState.midiImportSeedTitle, "Imported LH");

  var curriculumState = core.syncCurriculumState({
    curriculums: [{ id: "starter", title: "Starter Path", trackCount: 2 }],
    packs: [{ id: "pack_1", title: "Road Pack", type: "songs" }]
  });
  assert.strictEqual(curriculumState.curriculumSummaries[0].id, "starter");
  assert.strictEqual(curriculumState.curriculumSummaries[0].trackCount, 2);
  assert.strictEqual(curriculumState.curriculumPackSummaries[0].title, "Road Pack");

  var curriculumLoadingState = core.applyCurriculumWorkflowRequest("curriculum_load_start", {
    manifestPath: "/data/curriculum.json"
  });
  assert.strictEqual(curriculumLoadingState.curriculumLoading, true);
  assert.strictEqual(curriculumLoadingState.curriculumLastManifestPath, "/data/curriculum.json");
  assert.strictEqual(curriculumLoadingState.curriculumLastLoadStatus, "loading");

  var curriculumDoneState = core.applyCurriculumWorkflowRequest("curriculum_load_done", {
    manifestPath: "/data/curriculum.json",
    status: "ok"
  });
  assert.strictEqual(curriculumDoneState.curriculumLoading, false);
  assert.strictEqual(curriculumDoneState.curriculumLastLoadStatus, "ok");

  var contentLoadingState = core.applyCurriculumWorkflowRequest("content_load_start", {
    manifestPath: "/data/content.json"
  });
  assert.strictEqual(contentLoadingState.contentLoading, true);
  assert.strictEqual(contentLoadingState.contentLastManifestPath, "/data/content.json");
  assert.strictEqual(contentLoadingState.contentLastLoadStatus, "loading");

  var contentDoneState = core.applyCurriculumWorkflowRequest("content_load_done", {
    manifestPath: "/data/content.json",
    status: "ok"
  });
  assert.strictEqual(contentDoneState.contentLoading, false);
  assert.strictEqual(contentDoneState.contentLastLoadStatus, "ok");
});

test("SparkCore can build and apply dashboard recommendation launch requests", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    recommendations: [{ id: "rec_song", title: "Play Fire Road" }]
  });

  var request = core.launchDashboardRecommendation("rec_song");
  assert.strictEqual(request.recommendationId, "rec_song");
  assert.strictEqual(request.recommendation.title, "Play Fire Road");
  assert.strictEqual(core.getRuntimeState().activeScreen, "recommendations");
  assert.strictEqual(core.getRuntimeState().lastDashboardRecommendationId, "rec_song");
});

test("SparkCore can update dashboard challenge snapshots after reward claim", function() {
  var core = createDefaultSparkCore();
  core.applyDashboardRequest({
    challenges: [
      { id: "daily_1", title: "Daily Challenge", completed: true, claimed: false }
    ]
  });

  var state = core.applyDashboardChallengeReward("daily_1");
  assert.strictEqual(state.dashboardChallenges[0].id, "daily_1");
  assert.strictEqual(state.dashboardChallenges[0].claimed, true);
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
    songIndex: 1,
    songTitle: "Night Drive",
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
  assert.strictEqual(runningState.performanceSongIndex, 1);
  assert.strictEqual(runningState.performanceSongTitle, "Night Drive");
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
    arrangementType: "lead",
    difficulty: "pro",
    speed: 0.5,
    mode: "mic",
    preset: "guitar_solo"
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.performanceArrangementType, "lead");
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

  core.syncPerformanceRuntimeState("calibration_apply", {
    source: "mic",
    globalOffsetMs: 12,
    midiOffsetMs: -4,
    micOffsetMs: 18
  });
  var calibrationAppliedState = core.getRuntimeState();
  assert.strictEqual(calibrationAppliedState.performanceTimingOffsetMs, 12);
  assert.strictEqual(calibrationAppliedState.performanceMidiOffsetMs, -4);
  assert.strictEqual(calibrationAppliedState.performanceMicOffsetMs, 18);

  // start action clears calibrationMode
  core.syncPerformanceRuntimeState("calibration_start");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  core.syncPerformanceRuntimeState("start", { chartId: "night_drive_chart" });
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, false);

  core.syncPerformanceRuntimeState("configure_editor", {
    mode: "lead",
    snap: "1/16",
    chartId: "custom_chart",
    chartTitle: "Lead Builder",
    source: "library",
    dirty: true,
    selectedEventId: 7,
    bpm: 132,
    eventCount: 18,
    phraseCount: 4
  });
  var editorConfiguredState = core.getRuntimeState();
  assert.strictEqual(editorConfiguredState.performanceEditorMode, "lead");
  assert.strictEqual(editorConfiguredState.performanceEditorSnap, "1/16");
  assert.strictEqual(editorConfiguredState.performanceEditorChartId, "custom_chart");
  assert.strictEqual(editorConfiguredState.performanceEditorChartTitle, "Lead Builder");
  assert.strictEqual(editorConfiguredState.performanceEditorSource, "library");
  assert.strictEqual(editorConfiguredState.performanceEditorDirty, true);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventId, 7);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventLabel, null);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventTime, null);
  assert.strictEqual(editorConfiguredState.performanceEditorSelectedEventDuration, null);
  assert.strictEqual(editorConfiguredState.performanceEditorBpm, 132);
  assert.strictEqual(editorConfiguredState.performanceEditorEventCount, 18);
  assert.strictEqual(editorConfiguredState.performanceEditorPhraseCount, 4);

  core.syncPerformanceRuntimeState("configure_editor", {
    selectedEventId: 9,
    selectedEventLabel: "Am",
    selectedEventTime: 12.5,
    selectedEventDuration: 1.25
  });
  var selectedEventState = core.getRuntimeState();
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventId, 9);
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventLabel, "Am");
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventTime, 12.5);
  assert.strictEqual(selectedEventState.performanceEditorSelectedEventDuration, 1.25);

  core.syncPerformanceRuntimeState("configure_editor", {
    selectedPhraseId: 2,
    selectedPhraseName: "Bridge",
    selectedPhraseStart: 16,
    selectedPhraseEnd: 24
  });
  var selectedPhraseState = core.getRuntimeState();
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseId, 2);
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseName, "Bridge");
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseStart, 16);
  assert.strictEqual(selectedPhraseState.performanceEditorSelectedPhraseEnd, 24);

  core.syncPerformanceRuntimeState("configure_editor", {
    selectedPhraseId: null,
    selectedPhraseName: null,
    selectedPhraseStart: null,
    selectedPhraseEnd: null,
    phraseCount: 3
  });
  var clearedPhraseState = core.getRuntimeState();
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseId, null);
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseName, null);
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseStart, null);
  assert.strictEqual(clearedPhraseState.performanceEditorSelectedPhraseEnd, null);
  assert.strictEqual(clearedPhraseState.performanceEditorPhraseCount, 3);

  core.syncPerformanceRuntimeState("configure_stats", {
    focus: "weak"
  });
  var statsConfiguredState = core.getRuntimeState();
  assert.strictEqual(statsConfiguredState.performanceStatsFocus, "weak");

  core.syncPerformanceRuntimeState("close_editor", { screen: "home" });
  var homeState = core.getRuntimeState();
  assert.strictEqual(homeState.activeScreen, "home");
});

test("SparkCore exposes a compact performance editor document view", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceEditorDocument({
    id: "custom_chart",
    title: "Lead Builder",
    bpm: 132,
    events: [
      { id: 9, laneLabel: "Am", t: 12.5, dur: 1.25 }
    ],
    phrases: [
      { id: 2, name: "Bridge", startSec: 16, endSec: 24 }
    ]
  }, {
    source: "library",
    dirty: true,
    mode: "lead",
    snap: "1/16",
    eventCount: 18,
    phraseCount: 4,
    selectedEventId: 9,
    selectedPhraseId: 2
  });

  var documentView = core.getPerformanceEditorDocumentView();
  assert.ok(documentView.chart);
  assert.strictEqual(documentView.chart.id, "custom_chart");
  assert.strictEqual(documentView.chartId, "custom_chart");
  assert.strictEqual(documentView.title, "Lead Builder");
  assert.strictEqual(documentView.source, "library");
  assert.strictEqual(documentView.dirty, true);
  assert.strictEqual(documentView.mode, "lead");
  assert.strictEqual(documentView.snap, "1/16");
  assert.strictEqual(documentView.bpm, 132);
  assert.strictEqual(documentView.eventCount, 18);
  assert.strictEqual(documentView.phraseCount, 4);
  assert.strictEqual(documentView.selectedEvent.id, 9);
  assert.strictEqual(documentView.selectedEvent.label, "Am");
  assert.strictEqual(documentView.selectedPhrase.id, 2);
  assert.strictEqual(documentView.selectedPhrase.name, "Bridge");

  documentView.chart.title = "Changed Outside";
  assert.strictEqual(core.getPerformanceEditorDocumentView().chart.title, "Lead Builder");
});

test("SparkCore can derive editor document runtime state from a chart payload", function() {
  var core = createDefaultSparkCore();
  var chart = {
    id: "custom_chart",
    title: "Roadmap Builder",
    bpm: 128,
    events: [
      { id: 4, laneLabel: "C", t: 2.5, dur: 1 }
    ],
    phrases: [
      { id: 1, name: "Verse", startSec: 0, endSec: 8 }
    ]
  };

  core.syncPerformanceEditorDocument(chart, {
    source: "song",
    dirty: true,
    mode: "chords",
    snap: "1/8",
    selectedEventId: 4,
    selectedPhraseId: 1
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeScreen, "performance_editor");
  assert.strictEqual(state.performanceEditorChartId, "custom_chart");
  assert.strictEqual(state.performanceEditorChartTitle, "Roadmap Builder");
  assert.strictEqual(state.performanceEditorSource, "song");
  assert.strictEqual(state.performanceEditorDirty, true);
  assert.strictEqual(state.performanceEditorBpm, 128);
  assert.strictEqual(state.performanceEditorEventCount, 1);
  assert.strictEqual(state.performanceEditorPhraseCount, 1);
  assert.strictEqual(state.performanceEditorSelectedEventLabel, "C");
  assert.strictEqual(state.performanceEditorSelectedEventTime, 2.5);
  assert.strictEqual(state.performanceEditorSelectedPhraseName, "Verse");
  assert.strictEqual(state.performanceEditorSelectedPhraseEnd, 8);

  core.syncPerformanceEditorDocument(null, {
    action: "open_editor",
    source: "blank",
    dirty: false,
    mode: "lead",
    snap: "free",
    selectedEventId: null,
    selectedPhraseId: null
  });

  var blankState = core.getRuntimeState();
  assert.strictEqual(blankState.activeScreen, "performance_editor");
  assert.strictEqual(blankState.performanceEditorChartId, null);
  assert.strictEqual(blankState.performanceEditorSource, "blank");
  assert.strictEqual(blankState.performanceEditorDirty, false);
  assert.strictEqual(blankState.performanceEditorMode, "lead");
  assert.strictEqual(blankState.performanceEditorSnap, "free");
});

test("SparkCore can apply editor chart mutations through a core-owned document copy", function() {
  var core = createDefaultSparkCore();
  var blank = core.applyPerformanceEditorMutation("new_blank", { mode: "chords" });
  core.syncPerformanceEditorDocument(blank.chart, {
    action: "open_editor",
    source: "blank",
    dirty: true,
    mode: "chords",
    snap: "1/8"
  });

  var addedEvent = core.applyPerformanceEditorMutation("add_event", { mode: "chords" });
  assert.ok(addedEvent.chart);
  assert.strictEqual(addedEvent.chart.events.length, 1);
  assert.strictEqual(addedEvent.chart.events[0].id, 1);

  core.syncPerformanceEditorDocument(addedEvent.chart, {
    source: "blank",
    dirty: true,
    selectedEventId: null,
    selectedPhraseId: null
  });

  var selectedEvent = core.applyPerformanceEditorMutation("select_event", { id: 1 });
  assert.strictEqual(selectedEvent.selectedEventId, 1);

  var updatedEvent = core.applyPerformanceEditorMutation("update_event", {
    id: 1,
    prop: "label",
    val: "G"
  });
  assert.strictEqual(updatedEvent.chart.events[0].laneLabel, "G");
  assert.strictEqual(updatedEvent.chart.events[0].chord, "G");

  core.syncPerformanceEditorDocument(updatedEvent.chart, {
    source: "blank",
    dirty: true,
    selectedEventId: 1,
    selectedPhraseId: null
  });

  var deletedEvent = core.applyPerformanceEditorMutation("delete_event", { id: 1 });
  assert.strictEqual(deletedEvent.chart.events.length, 0);
  assert.strictEqual(deletedEvent.selectedEventId, null);

  var titled = core.applyPerformanceEditorMutation("set_title", { title: "Edited in Core" });
  assert.strictEqual(titled.chart.title, "Edited in Core");

  var addedPhrase = core.applyPerformanceEditorMutation("add_phrase");
  assert.strictEqual(addedPhrase.chart.phrases.length, 2);
  assert.strictEqual(addedPhrase.selectedPhraseId, 1);

  core.syncPerformanceEditorDocument(addedPhrase.chart, {
    source: "blank",
    dirty: true,
    selectedPhraseId: addedPhrase.selectedPhraseId
  });

  var updatedPhrase = core.applyPerformanceEditorMutation("update_phrase", {
    id: 1,
    prop: "name",
    val: "Chorus"
  });
  assert.strictEqual(updatedPhrase.chart.phrases[1].name, "Chorus");

  var deletedPhrase = core.applyPerformanceEditorMutation("delete_phrase", { id: 1 });
  assert.strictEqual(deletedPhrase.chart.phrases.length, 1);
  assert.strictEqual(deletedPhrase.selectedPhraseId, null);
});

test("SparkCore can manage the editor library from the core-owned document workflow", function() {
  var core = createDefaultSparkCore();
  var chart = {
    id: "library_chart",
    title: "Saved Core Chart",
    bpm: 110,
    events: [{ id: 1, laneLabel: "C", t: 0, dur: 1 }],
    phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }]
  };

  core.syncPerformanceEditorDocument(chart, {
    action: "open_editor",
    source: "blank",
    dirty: true,
    mode: "chords",
    snap: "1/8"
  });

  var saved = core.applyPerformanceEditorMutation("save_to_library");
  assert.strictEqual(saved.library.length, 1);
  assert.strictEqual(saved.library[0].title, "Saved Core Chart");

  var loaded = core.applyPerformanceEditorMutation("load_from_library", { index: 0 });
  assert.ok(loaded.chart);
  assert.strictEqual(loaded.chart.id, "library_chart");
  assert.strictEqual(loaded.selectedEventId, null);
  assert.strictEqual(loaded.selectedPhraseId, null);

  var deleted = core.applyPerformanceEditorMutation("delete_from_library", { index: 0 });
  assert.strictEqual(deleted.library.length, 0);
});

test("SparkCore can expose export and preview artifacts from the core-owned editor document", function() {
  var core = createDefaultSparkCore();
  var chart = {
    id: "preview_chart",
    title: "Preview Chart",
    bpm: 95,
    events: [{ id: 1, laneLabel: "Dm", t: 1, dur: 1 }],
    phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }]
  };

  core.syncPerformanceEditorDocument(chart, {
    action: "open_editor",
    source: "library",
    dirty: false,
    mode: "chords",
    snap: "1/8"
  });

  var exportData = core.getPerformanceEditorExportData();
  assert.ok(exportData.chart);
  assert.strictEqual(exportData.chart.id, "preview_chart");
  assert.strictEqual(exportData.fileName, "Preview_Chart.json");
  assert.ok(exportData.json.indexOf("\"title\": \"Preview Chart\"") >= 0);

  var previewChart = core.getPerformanceEditorPreviewChart();
  assert.ok(previewChart);
  assert.strictEqual(previewChart.title, "Preview Chart");
  previewChart.title = "Changed Locally";
  assert.strictEqual(core.getPerformanceEditorPreviewChart().title, "Preview Chart");

  core.syncPerformanceRuntimeState("configure", {
    difficulty: "hard",
    speed: 0.8,
    mode: "mic",
    preset: "guitar_solo",
    arrangementType: "lead"
  });

  var previewRequest = core.startPerformanceEditorPreview();
  assert.ok(previewRequest);
  assert.strictEqual(previewRequest.chartId, "preview_chart");
  assert.strictEqual(previewRequest.arrangementType, "lead");
  assert.strictEqual(previewRequest.difficulty, "hard");
  assert.strictEqual(previewRequest.speed, 0.8);
  assert.strictEqual(previewRequest.mode, "mic");
  assert.strictEqual(previewRequest.preset, "guitar_solo");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "preview_chart");
  assert.strictEqual(core.getRuntimeState().transport.status, "running");
});

test("SparkCore can open performance stats, editor, and calibration through explicit helpers", function() {
  var core = createDefaultSparkCore();

  var statsRequest = core.openPerformanceStats({ focus: "weak" });
  assert.strictEqual(statsRequest.focus, "weak");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_stats");
  assert.strictEqual(core.getRuntimeState().performanceStatsFocus, "weak");

  var editorRequest = core.openPerformanceEditor(null, {
    source: "blank",
    mode: "lead",
    snap: "1/16"
  });
  assert.strictEqual(editorRequest.source, "blank");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_editor");
  assert.strictEqual(core.getRuntimeState().performanceEditorMode, "lead");
  assert.strictEqual(core.getRuntimeState().performanceEditorSnap, "1/16");

  var calibrationRequest = core.openPerformanceCalibration({ source: "mic" });
  assert.strictEqual(calibrationRequest.source, "mic");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform_calibration");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationSource, "mic");
});

test("SparkCore can open performance song selection through an explicit helper", function() {
  var core = createDefaultSparkCore();

  var selectionRequest = core.openPerformanceSongSelection({
    songId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard"
  });

  assert.strictEqual(selectionRequest.songId, "night_drive");
  assert.strictEqual(selectionRequest.songIndex, 1);
  assert.strictEqual(selectionRequest.songTitle, "Night Drive");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "night_drive");
  assert.strictEqual(core.getRuntimeState().performanceSongIndex, 1);
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Night Drive");
  assert.strictEqual(core.getRuntimeState().performanceArrangementType, "rhythm_chords");
  assert.strictEqual(core.getRuntimeState().performanceDifficultyId, "hard");
});

test("SparkCore can open performance song selection from direct song data", function() {
  var core = createDefaultSparkCore();
  var songData = {
    title: "Career Anthem",
    artist: "Spark Career",
    bpm: 92,
    chords: ["C", "G"],
    progression: ["C", "G", "Am", "F"]
  };

  var selectionRequest = core.openPerformanceSongSelection({
    songId: "career_anthem",
    songData: songData,
    arrangementType: "chords",
    difficultyId: "normal"
  });

  assert.strictEqual(selectionRequest.songId, "career_anthem");
  assert.strictEqual(selectionRequest.songData.title, "Career Anthem");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "career_anthem");
  assert.strictEqual(core.getRuntimeState().performanceSongData.title, "Career Anthem");
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Career Anthem");
});

test("SparkCore can open career song selection through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var request = core.openCareerSongSelection({
    songId: "career_anthem",
    songData: {
      title: "Career Anthem",
      artist: "Spark Career"
    },
    arrangementType: "lead",
    difficultyId: "hard"
  });

  assert.strictEqual(request.songId, "career_anthem");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceSongData.title, "Career Anthem");
  assert.strictEqual(core.getRuntimeState().performanceArrangementType, "lead");
  assert.strictEqual(core.getRuntimeState().performanceDifficultyId, "hard");
});

test("SparkCore can open performance daily challenge selection through an explicit helper", function() {
  var core = createDefaultSparkCore();
  var request = core.openPerformanceDailyChallenge({
    songId: "fire_road",
    songData: {
      title: "Fire Road",
      artist: "Spark Suite"
    },
    songTitle: "Fire Road",
    arrangementType: "chords",
    difficultyId: "normal",
    songIndex: 0
  });

  assert.strictEqual(request.songId, "fire_road");
  assert.strictEqual(core.getRuntimeState().activeScreen, "performance_song");
  assert.strictEqual(core.getRuntimeState().performanceSongTitle, "Fire Road");

  var fallback = core.openPerformanceDailyChallenge({});
  assert.strictEqual(fallback.activeScreen, "home");
  assert.strictEqual(fallback.activeTab, "songs");
});

test("SparkCore can start a selected performance song through an explicit helper", function() {
  var core = createDefaultSparkCore();
  core.openPerformanceSongSelection({
    songId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficultyId: "hard",
    targetTechnique: "tap"
  });

  var startRequest = core.startSelectedPerformanceSong({
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard",
    speed: 0.8,
    mode: "mic",
    preset: "guitar_solo",
    countIn: true,
    targetTechnique: "tap"
  });

  assert.strictEqual(startRequest.chartId, "night_drive");
  assert.strictEqual(startRequest.songIndex, 1);
  assert.strictEqual(startRequest.songTitle, "Night Drive");
  assert.strictEqual(startRequest.arrangementType, "rhythm_chords");
  assert.strictEqual(startRequest.difficulty, "hard");
  assert.strictEqual(startRequest.speed, 0.8);
  assert.strictEqual(startRequest.mode, "mic");
  assert.strictEqual(startRequest.preset, "guitar_solo");
  assert.strictEqual(startRequest.targetTechnique, "tap");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform");
  assert.strictEqual(core.getRuntimeState().transport.status, "count_in");
  assert.strictEqual(core.getRuntimeState().performanceTargetTechnique, "tap");
});

test("SparkCore can build retry launch requests from performance runtime state", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });
  core.syncPerformanceRuntimeState("configure", {
    speed: 0.75,
    mode: "mic",
    preset: "guitar_solo",
    targetTechnique: "open"
  });

  var retryRequest = core.startPerformanceRetrySession({
    chartId: "night_drive"
  });
  assert.strictEqual(retryRequest.chartId, "night_drive");
  assert.strictEqual(retryRequest.arrangementType, "rhythm_chords");
  assert.strictEqual(retryRequest.difficulty, "hard");
  assert.strictEqual(retryRequest.speed, 0.75);
  assert.strictEqual(retryRequest.mode, "mic");
  assert.strictEqual(retryRequest.preset, "guitar_solo");
  assert.strictEqual(retryRequest.targetTechnique, "open");
  assert.strictEqual(retryRequest.songIndex, 1);
  assert.strictEqual(retryRequest.songTitle, "Night Drive");
  assert.strictEqual(core.getRuntimeState().activeScreen, "perform");
  assert.strictEqual(core.getRuntimeState().performanceChartId, "night_drive");
  assert.strictEqual(core.getRuntimeState().performanceTargetTechnique, "open");
  assert.strictEqual(core.getRuntimeState().transport.status, "running");

  var phraseRetryRequest = core.startPerformanceRetrySession({
    chartId: "night_drive",
    targetPhraseIndex: 2
  });
  assert.strictEqual(phraseRetryRequest.targetPhraseIndex, 2);
  assert.strictEqual(phraseRetryRequest.chartId, "night_drive");
});

test("SparkCore preserves focused imported technique through performance finish", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songTitle: "Night Drive",
    targetTechnique: "forced"
  });
  core.syncPerformanceRuntimeState("start", {
    chartId: "night_drive",
    difficulty: "hard",
    arrangementType: "rhythm_chords",
    speed: 1,
    mode: "midi",
    preset: "full_mix",
    targetTechnique: "forced"
  });
  core.syncPerformanceRuntimeState("finish", {
    screen: "perform_done",
    results: { title: "Night Drive", accuracy: 82 },
    targetTechnique: "forced"
  });

  assert.strictEqual(core.getRuntimeState().activeScreen, "perform_done");
  assert.strictEqual(core.getRuntimeState().performanceTargetTechnique, "forced");
});

test("SparkCore can build and apply calibration requests from runtime state", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("open_calibration", {
    source: "mic",
    globalOffsetMs: 12,
    midiOffsetMs: -4,
    micOffsetMs: 18
  });

  var startRequest = core.applyPerformanceCalibrationRequest("calibration_start", {
    source: "mic"
  });
  assert.strictEqual(startRequest.source, "mic");
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, true);
  assert.strictEqual(core.getRuntimeState().transport.status, "calibrating");

  var applyRequest = core.applyPerformanceCalibrationRequest("calibration_apply", {
    source: "mic",
    appliedOffsetMs: 10,
    globalOffsetMs: 22,
    midiOffsetMs: -4,
    micOffsetMs: 28
  });
  assert.strictEqual(applyRequest.appliedOffsetMs, 10);
  assert.strictEqual(core.getRuntimeState().performanceTimingOffsetMs, 22);
  assert.strictEqual(core.getRuntimeState().performanceMicOffsetMs, 28);

  var resetRequest = core.applyPerformanceCalibrationRequest("calibration_reset", {
    source: "mic",
    globalOffsetMs: 22,
    midiOffsetMs: -4,
    micOffsetMs: 0
  });
  assert.strictEqual(resetRequest.source, "mic");
  assert.strictEqual(core.getRuntimeState().performanceMicOffsetMs, 0);
  assert.strictEqual(core.getRuntimeState().performanceCalibrationMode, false);
  assert.strictEqual(core.getRuntimeState().transport.status, "idle");
});

test("orchestrator requests can resolve sparkCore from the global binding", function() {
  global.window = {};
  var syncedCalibration = null;
  var syncedSong = null;
  var syncedCloud = null;
  var syncedCurriculum = null;
  var syncedGuided = null;
  var calls = [];
  global.sparkCore = {
    openPerformanceEditor: function(chart, options) {
      return {
        type: "editor",
        chart: chart,
        options: options
      };
    },
    syncPerformanceRuntimeState: function(action, payload) {
      syncedCalibration = {
        action: action,
        payload: payload
      };
      return syncedCalibration;
    },
    startSession: function(options) {
      return {
        type: "session",
        options: options
      };
    },
    openLegacyPracticeSession: function(options) {
      calls.push({ type: "legacy_session", options: options });
      return { type: "legacy_session", options: options };
    },
    syncLegacyPracticeRuntimeState: function(action, options) {
      calls.push({ type: "legacy_practice_sync", action: action, options: options });
      return { type: "legacy_practice_sync", action: action, options: options };
    },
    openLegacyDailyChallenge: function(options) {
      calls.push({ type: "daily_open", options: options });
      return { type: "daily_open", options: options };
    },
    syncTunerRuntimeState: function(options) {
      calls.push({ type: "tuner_sync", options: options });
      return { type: "tuner_sync", options: options };
    },
    openLegacyRhythmGame: function(options) {
      calls.push({ type: "rhythm_open", options: options });
      return { type: "rhythm_open", options: options };
    },
    openGuidedSession: function(options) {
      calls.push({ type: "guided_open", options: options });
      return { type: "guided_open", options: options };
    },
    syncSongRuntimeState: function(action, options) {
      syncedSong = { action: action, options: options };
      calls.push({ type: "song_sync", action: action, options: options });
      return syncedSong;
    },
    applyDashboardRequest: function(options) {
      calls.push({ type: "dashboard_apply", options: options });
      return { type: "dashboard_apply", options: options };
    },
    syncCloudSettingsState: function(payload) {
      syncedCloud = payload;
      calls.push({ type: "cloud_sync", payload: payload });
      return payload;
    },
    syncCurriculumState: function(payload) {
      syncedCurriculum = payload;
      calls.push({ type: "curriculum_sync", payload: payload });
      return payload;
    },
    openSkillTree: function() {
      calls.push({ type: "skill_tree_open" });
      return { type: "skill_tree_open" };
    },
    openStemPlayer: function() {
      calls.push({ type: "stem_player_open" });
      return { type: "stem_player_open" };
    },
    completeSession: function(options) {
      calls.push({ type: "guided_complete", options: options });
      return { type: "guided_complete", options: options };
    },
    syncGuidedRuntimeState: function(payload) {
      syncedGuided = payload;
      calls.push({ type: "guided_sync", payload: payload });
      return payload;
    }
  };
  global.eval(loadJS("js/orchestrator-requests.js"));

  var editorRequest = openPerformanceEditorRequest({ id: "chart_1" }, { source: "blank" });
  var calibrationRequest = applyPerformanceCalibrationRequest("calibration_apply", {
    source: "mic",
    globalOffsetMs: 14,
    midiOffsetMs: -3,
    micOffsetMs: 9
  });
  var practicePlanRequest = openPracticePlanScreenRequest({ forceRebuild: true });
  var legacySessionRequest = openLegacyPracticeSessionRequest({ mode: "chord", chordName: "C" });
  var practiceSyncRequest = syncLegacyPracticeRuntimeRequest("tick", { remainingSec: 42 });
  var dailyRequest = openLegacyDailyChallengeRequest({ challengeId: "daily_1" });
  var tunerRequest = syncTunerRuntimeRequest({ tunerNote: "E" });
  var rhythmRequest = openLegacyRhythmGameRequest({ mode: "strum" });
  var guidedRequest = openGuidedSessionRequest({ sessionNum: 3 });
  var songSyncRequest = syncSongRuntimeRequest("play", { songData: { id: "stand-by-me" }, source: "library" });
  var dashboardRequest = applyDashboardRequest({ recommendations: [{ id: "rec_1" }] });
  var cloudRequest = syncCloudSettingsStateRequest({ loggedIn: true, email: "scott@example.com" });
  var curriculumRequest = syncCurriculumStateRequest({ activeTrackId: "guitar-30day" });
  var skillTreeRequest = openSkillTreeRequest();
  var stemPlayerRequest = openStemPlayerRequest();
  var guidedCompleteRequest = completeGuidedSessionRequest();

  assert.strictEqual(editorRequest.type, "editor");
  assert.strictEqual(editorRequest.chart.id, "chart_1");
  assert.strictEqual(editorRequest.options.source, "blank");
  assert.strictEqual(calibrationRequest.source, "mic");
  assert.ok(syncedCalibration);
  assert.strictEqual(syncedCalibration.action, "calibration_apply");
  assert.strictEqual(syncedCalibration.payload.source, "mic");
  assert.strictEqual(syncedCalibration.payload.globalOffsetMs, 14);
  assert.strictEqual(practicePlanRequest.type, "session");
  assert.strictEqual(practicePlanRequest.options.flow, SparkSessionTypes.FLOW_DAILY_PRACTICE);
  assert.strictEqual(practicePlanRequest.options.forceRebuild, true);
  assert.strictEqual(legacySessionRequest.type, "legacy_session");
  assert.strictEqual(legacySessionRequest.options.chordName, "C");
  assert.strictEqual(practiceSyncRequest.type, "legacy_practice_sync");
  assert.strictEqual(practiceSyncRequest.action, "tick");
  assert.strictEqual(practiceSyncRequest.options.remainingSec, 42);
  assert.strictEqual(dailyRequest.type, "daily_open");
  assert.strictEqual(dailyRequest.options.challengeId, "daily_1");
  assert.strictEqual(tunerRequest.type, "tuner_sync");
  assert.strictEqual(tunerRequest.options.tunerNote, "E");
  assert.strictEqual(rhythmRequest.type, "rhythm_open");
  assert.strictEqual(rhythmRequest.options.mode, "strum");
  assert.strictEqual(guidedRequest.type, "guided_open");
  assert.strictEqual(guidedRequest.options.sessionNum, 3);
  assert.ok(syncedSong);
  assert.strictEqual(songSyncRequest.action, "play");
  assert.strictEqual(songSyncRequest.options.source, "library");
  assert.strictEqual(songSyncRequest.options.songData.id, "stand-by-me");
  assert.strictEqual(dashboardRequest.type, "dashboard_apply");
  assert.strictEqual(dashboardRequest.options.recommendations[0].id, "rec_1");
  assert.ok(syncedCloud);
  assert.strictEqual(cloudRequest.email, "scott@example.com");
  assert.strictEqual(cloudRequest.loggedIn, true);
  assert.ok(syncedCurriculum);
  assert.strictEqual(curriculumRequest.activeTrackId, "guitar-30day");
  assert.strictEqual(skillTreeRequest.type, "skill_tree_open");
  assert.strictEqual(stemPlayerRequest.type, "stem_player_open");
  assert.strictEqual(guidedCompleteRequest.type, "guided_complete");
  assert.strictEqual(guidedCompleteRequest.options.flow, SparkSessionTypes.FLOW_GUIDED_SESSION);
  assert.ok(syncedGuided);
  assert.strictEqual(syncedGuided.activeScreen, "guided_done");
  assert.ok(calls.length >= 11);
});

test("studio openPlan resumes guided sessions instead of opening the plan screen when guided runtime is active", function() {
  global.window = {};
  global.__actionFamilies = global.__actionFamilies || {};
  global.window.registerSparkActionFamily = function(name, handler) {
    global.__actionFamilies[name] = handler;
  };
  global.S = global.S || {};
  global.S.screen = "home";
  global.SCR = global.SCR || {};
  global.SCR.PLAN = "plan";
  global.SCR.GUIDED = "guided";
  var practicePlanRequests = [];
  global.openPracticePlanScreenRequest = function(payload) {
    practicePlanRequests.push(payload || {});
    return payload || {};
  };
  global.render = function() {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: { guidedPlan: { title: "How guitars get tuned" } }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "songSlice"
        }
      };
    }
  };

  eval(loadJS("js/actions/studio_family.js"));
  var handled = __actionFamilies.studio("openPlan");

  assert.strictEqual(handled, true);
  assert.strictEqual(S.screen, "guided");
  assert.deepStrictEqual(practicePlanRequests, []);
});

test("SparkCore can build performance completion requests from runtime state", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var completionRequest = core.buildPerformanceCompletionRequest({
    performanceResults: {
      title: "Night Drive",
      accuracy: 88,
      stars: 4,
      score: 12345
    },
    xpAwarded: 9
  });

  assert.strictEqual(completionRequest.flow, SparkSessionTypes.FLOW_PERFORMANCE_SONG);
  assert.strictEqual(completionRequest.markPlanComplete, true);
  assert.strictEqual(completionRequest.chartId, "night_drive");
  assert.strictEqual(completionRequest.arrangementType, "rhythm_chords");
  assert.strictEqual(completionRequest.difficultyId, "hard");
  assert.strictEqual(completionRequest.songIndex, 1);
  assert.strictEqual(completionRequest.songTitle, "Night Drive");
  assert.strictEqual(completionRequest.xpAwarded, 9);
  assert.strictEqual(completionRequest.performanceResults.accuracy, 88);
});

test("SparkCore can build and apply performance navigation requests", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });
  core.syncPerformanceRuntimeState("finish", {
    screen: "perform_done",
    results: {
      title: "Night Drive",
      accuracy: 88
    }
  });

  var songsHomeRequest = core.buildPerformanceNavigationRequest("songs_home");
  assert.strictEqual(songsHomeRequest.activeScreen, "home");
  assert.strictEqual(songsHomeRequest.activeTab, "songs");
  assert.strictEqual(songsHomeRequest.transport.status, "idle");

  var songsHomeState = core.applyPerformanceNavigationRequest("songs_home");
  assert.strictEqual(songsHomeState.activeScreen, "home");
  assert.strictEqual(songsHomeState.activeTab, "songs");
  assert.strictEqual(songsHomeState.transport.status, "idle");

  var songDetailState = core.applyPerformanceNavigationRequest("song_detail");
  assert.strictEqual(songDetailState.activeScreen, "performance_song");
  assert.strictEqual(songDetailState.activeTab, "songs");
  assert.strictEqual(songDetailState.performanceSongTitle, "Night Drive");

  var stopReturnState = core.applyPerformanceNavigationRequest("return_after_stop");
  assert.strictEqual(stopReturnState.activeScreen, "performance_song");
  assert.strictEqual(stopReturnState.activeTab, "songs");
});

test("SparkCore can mirror performance song selection state explicitly", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var state = core.getRuntimeState();
  assert.strictEqual(state.activeFlow, "performance_song");
  assert.strictEqual(state.activeScreen, "performance_song");
  assert.strictEqual(state.performanceChartId, "night_drive");
  assert.strictEqual(state.performanceSongIndex, 1);
  assert.strictEqual(state.performanceSongTitle, "Night Drive");
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

test("SparkCore performance runtime state can return from song detail back to songs home", function() {
  var core = createDefaultSparkCore();
  core.syncPerformanceRuntimeState("select_song", {
    chartId: "night_drive",
    songIndex: 1,
    songTitle: "Night Drive",
    arrangementType: "rhythm_chords",
    difficulty: "hard"
  });

  var state = core.updateRuntimeState({
    activeScreen: "home",
    activeTab: "songs",
    transport: { status: "idle", positionMs: 0 }
  });

  assert.strictEqual(state.activeScreen, "home");
  assert.strictEqual(state.activeTab, "songs");
  assert.strictEqual(state.transport.status, "idle");
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
  var melodyPayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_07" }
  });
  var performancePayload = adapter.createPayload({
    curriculum: { nextLessonId: "uke_08" }
  });

  assert.strictEqual(switchingPayload.chartId, "uke_switch_flow_01");
  assert.strictEqual(patternPayload.chartId, "uke_island_pattern_01");
  assert.strictEqual(melodyPayload.chartId, "uke_melody_lift_01");
  assert.strictEqual(performancePayload.chartId, "uke_stage_flow_01");
  assert.ok(patternPayload.songChart.tracks.guitar.notes.length >= 8);
  assert.ok(performancePayload.songChart.tracks.guitar.notes.length >= 12);
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

test("createDefaultSparkCore prefers the rehydrated active instrument over a stale singleton adapter", function() {
  var pianoSongs = [
    { title: "Midnight Train", artist: "Piano Suite" },
    { title: "River Walk", artist: "Piano Suite" }
  ];
  var pianoSessions = [
    { num: 1, title: "Piano Spark 1", spark: { text: "Start" }, newMove: { chord: "C" } },
    { num: 2, title: "Piano Spark 2", spark: { text: "Continue" }, newMove: { chord: "G" } }
  ];
  var pianoInstrument = {
    id: "pianospark",
    appId: "pianospark",
    instrument: "piano",
    getCurriculumMap: function() { return [{ num: 1, title: "White Keys Only" }]; },
    getSongs: function() { return pianoSongs; },
    getData: function() { return { SESSIONS: pianoSessions }; }
  };

  SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [pianoInstrument];
    }
  };

  SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return [{ num: 1, title: "Stale Guitar Lesson" }]; },
    getCurriculum: function() { return { SESSIONS: [{ num: 1, title: "Stale Guitar Session" }] }; },
    getSongs: function() { return [{ title: "Stale Guitar Song", artist: "Spark Suite" }]; }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();

  assert.strictEqual(context.appId, "pianospark");
  assert.strictEqual(context.instrumentType, "piano");
  assert.strictEqual(context.adapter.getType(), "piano");
  assert.strictEqual(context.curriculumMap[0].title, "White Keys Only");
  assert.strictEqual(context.sessions[0].title, "Piano Spark 1");
  assert.strictEqual(context.songs[1].title, "River Walk");
});

test("createDefaultSparkCore keeps curriculum v2 maps from thin active instruments while using registered adapters", function() {
  SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        instrument: "guitar",
        getCurriculumMapV2: function() {
          return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
        }
      };
    },
    getAll: function() {
      return [{
        id: "chordspark",
        appId: "chordspark",
        instrument: "guitar"
      }];
    }
  };

  SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return [{ num: 1, title: "Stale Guitar Lesson" }]; },
    getCurriculum: function() { return { SESSIONS: [{ num: 1, title: "Stale Guitar Session" }] }; },
    getSongs: function() { return [{ title: "Stale Guitar Song", artist: "Spark Suite" }]; }
  };

  var core = createDefaultSparkCore();
  var context = core.instrumentManager.getActiveContext();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

  assert.strictEqual(context.instrumentType, "guitar");
  assert.strictEqual(context.curriculumMap[0].id, "gtr-d01");
  assert.strictEqual(context.sessions[0].id, "gtr-d01");
  assert.strictEqual(plan.context.curriculum.nextLessonId, "gtr-d01");
  assert.strictEqual(plan.context.curriculum.nextLesson.id, "gtr-d01");
  assert.strictEqual(plan.lesson.id, "gtr-d01");
});

test("guided sessions normalize curriculum v2 plans into the legacy guided flow shape", function() {
  SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        instrument: "guitar",
        getCurriculumMapV2: function() {
          return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
        }
      };
    },
    getAll: function() {
      return [{
        id: "chordspark",
        appId: "chordspark",
        instrument: "guitar"
      }];
    }
  };

  SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return []; },
    getCurriculum: function() { return { SESSIONS: [] }; },
    getSongs: function() { return []; }
  };

  var core = createDefaultSparkCore();
  var plan = core.openGuidedSession({ sessionNum: 1 });
  var guidedPlan = plan.context.guidedPlan;
  var guidedState = core.getRuntimeState();

  assert.strictEqual(guidedPlan.id, "gtr-d01");
  assert.strictEqual(guidedPlan.num, 1);
  assert.ok(guidedPlan.spark && guidedPlan.spark.text.indexOf("warm engine block") >= 0);
  assert.strictEqual(guidedPlan.review, null);
  assert.ok(guidedPlan.newMove && guidedPlan.newMove.text.indexOf("drill block") >= 0);
  assert.ok(guidedPlan.songSlice && guidedPlan.songSlice.text.indexOf("song block") >= 0);
  assert.ok(guidedPlan.songSlice && guidedPlan.songSlice.song.indexOf("\"Horse\" intro") >= 0);
  assert.ok(guidedPlan.victoryLap && guidedPlan.victoryLap.text.length > 0);
  assert.strictEqual(plan.segments.length, 4);
  assert.strictEqual(plan.exercises.length, 4);
  assert.strictEqual(plan.segments[0].id, "gtr-d01_warm_engine");
  assert.strictEqual(plan.segments[0].label, "Warm Engine");
  assert.strictEqual(plan.segments[0].durationSec, 90);
  assert.strictEqual(plan.segments[0].meta.activityId, "gtr-d01-warm_engine");
  assert.strictEqual(plan.segments[1].id, "gtr-d01_drill");
  assert.strictEqual(plan.segments[1].label, "Drill");
  assert.strictEqual(plan.segments[1].durationSec, 180);
  assert.strictEqual(plan.segments[1].meta.activityKind, "review");
  assert.strictEqual(plan.segments[2].id, "gtr-d01_song");
  assert.ok(plan.segments[2].label.indexOf("\"Horse\" intro") >= 0);
  assert.strictEqual(plan.segments[2].type, "song");
  assert.strictEqual(plan.segments[2].durationSec, 240);
  assert.strictEqual(plan.segments[3].id, "gtr-d01_cooldown");
  assert.strictEqual(plan.segments[3].label, "Cooldown");
  assert.strictEqual(plan.segments[3].durationSec, 90);
  assert.strictEqual(plan.context.guidedShellDurationSec, 600);
  assert.strictEqual(guidedState.activeSegmentId, "gtr-d01_warm_engine");
  assert.strictEqual(guidedPlan.blockActivities.warm_engine.id, "gtr-d01-warm_engine");
  assert.strictEqual(guidedPlan.blockActivities.drill.id, "gtr-d01-drill");
  assert.strictEqual(guidedPlan.blockActivities.song.id, "gtr-d01-song");
  assert.strictEqual(guidedState.guidedActivityId, "gtr-d01-warm_engine");
  assert.strictEqual(guidedState.guidedActivityKind, "warm_engine_play");
  assert.strictEqual(guidedState.guidedBlockType, "warm_engine");

  guidedState = core.syncGuidedRuntimeState({
    guidedStep: "newMove",
    guidedNewMovePhase: "watch"
  });
  assert.strictEqual(guidedState.activeSegmentId, "gtr-d01_drill");
  assert.strictEqual(guidedState.guidedActivityId, "gtr-d01-drill");
  assert.strictEqual(guidedState.guidedActivityKind, "review");
  assert.strictEqual(guidedState.guidedBlockType, "drill");

  guidedState = core.syncGuidedRuntimeState({
    guidedStep: "songSlice",
    guidedNewMovePhase: null
  });
  assert.strictEqual(guidedState.activeSegmentId, "gtr-d01_song");
  assert.strictEqual(guidedState.guidedActivityId, "gtr-d01-song");
  assert.strictEqual(guidedState.guidedBlockType, "song");

  guidedState = core.syncGuidedRuntimeState({
    guidedStep: "victoryLap"
  });
  assert.strictEqual(guidedState.activeSegmentId, "gtr-d01_cooldown");
  assert.strictEqual(guidedState.guidedActivityId, "gtr-d01-cooldown");
  assert.strictEqual(guidedState.guidedBlockType, "cooldown");

  guidedState = core.applyGuidedNavigationRequest("guided_done");
  assert.strictEqual(guidedState.activeSegmentId, null);
  assert.strictEqual(guidedState.guidedActivityId, null);
  assert.strictEqual(guidedState.guidedActivityKind, null);
  assert.strictEqual(guidedState.guidedBlockType, null);
});

test("advanceGuidedSession completes V2 blocks only when the step leaves them", function() {
  SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        instrument: "guitar",
        getCurriculumMapV2: function() {
          return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
        }
      };
    },
    getAll: function() {
      return [{
        id: "chordspark",
        appId: "chordspark",
        instrument: "guitar"
      }];
    }
  };

  SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return []; },
    getCurriculum: function() { return { SESSIONS: [] }; },
    getSongs: function() { return []; }
  };

  var core = createDefaultSparkCore();
  var plan = core.openGuidedSession({ sessionNum: 1 });
  var state = core.getRuntimeState();

  assert.strictEqual(state.activeSegmentId, "gtr-d01_warm_engine");
  assert.strictEqual(plan.segments[0].completed, false);
  assert.strictEqual(plan.segments[1].completed, false);

  state = core.advanceGuidedSession({}).runtimeState;
  assert.strictEqual(state.guidedStep, "review");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_drill");
  assert.strictEqual(plan.segments[0].completed, true);
  assert.strictEqual(plan.segments[1].completed, false);

  state = core.advanceGuidedSession({}).runtimeState;
  assert.strictEqual(state.guidedStep, "newMove");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_drill");
  assert.strictEqual(plan.segments[1].completed, false);

  state = core.advanceGuidedSession({ guidedNewMovePhase: null }).runtimeState;
  assert.strictEqual(state.guidedStep, "songSlice");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_song");
  assert.strictEqual(state.transport.status, "running");
  assert.strictEqual(state.transport.positionMs, 0);
  assert.strictEqual(plan.segments[1].completed, true);

  state = core.advanceGuidedSession({}).runtimeState;
  assert.strictEqual(state.guidedStep, "victoryLap");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_cooldown");
  assert.strictEqual(state.transport.status, "running");
  assert.strictEqual(state.transport.positionMs, 0);
  assert.strictEqual(plan.segments[2].completed, true);
});

test("SparkCore can sync the shared session runtime and expose active segment/exercise in the session view", function() {
  var originalWindow = global.window;
  var attachCalls = [];
  global.window = global.window || {};
  global.window.SparkSessionRuntime = {
    attachSession: function(plan, options) {
      attachCalls.push({
        plan: plan,
        options: options
      });
      return true;
    },
    getActiveSession: function() {
      return core.currentPlan;
    },
    getActiveSegment: function() {
      return core.currentPlan && core.currentPlan.segments ? core.currentPlan.segments[0] : null;
    },
    getActiveExercise: function() {
      return core.currentPlan && core.currentPlan.exercises ? core.currentPlan.exercises[0] : null;
    }
  };
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });
  attachCalls.length = 0;
  var synced = core.syncSessionRuntime({ scheduleTick: false });
  var view = core.getActiveSessionView();

  assert.strictEqual(synced, true);
  assert.strictEqual(attachCalls.length, 1);
  assert.strictEqual(attachCalls[0].plan, plan);
  assert.strictEqual(attachCalls[0].options.segmentId, plan.segments[0].id);
  assert.strictEqual(attachCalls[0].options.status, "ready");
  assert.strictEqual(attachCalls[0].options.positionMs, 0);
  assert.ok(view.activeSegment);
  assert.ok(view.activeExercise);
  assert.strictEqual(view.activeSegment.id, plan.segments[0].id);
  assert.strictEqual(view.activeExercise.id, plan.exercises[0].id);

  global.window = originalWindow;
});

test("SparkCore startSession automatically syncs the shared runtime for guided plans", function() {
  var originalWindow = global.window;
  var attachCalls = [];
  global.window = global.window || {};
  global.window.SparkSessionRuntime = {
    attachSession: function(plan, options) {
      attachCalls.push({ plan: plan, options: options });
      return true;
    }
  };
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_GUIDED_SESSION, sessionNum: 1 });

  assert.strictEqual(attachCalls.length, 1);
  assert.strictEqual(attachCalls[0].plan, plan);
  assert.strictEqual(attachCalls[0].options.segmentId, plan.segments[0].id);
  assert.strictEqual(attachCalls[0].options.status, "ready");
  assert.strictEqual(attachCalls[0].options.scheduleTick, false);
  assert.strictEqual(attachCalls[0].options.autoAdvance, false);

  global.window = originalWindow;
});

test("skipGuidedBlock jumps to the next V2 shell block and completes the skipped block", function() {
  SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        instrument: "guitar",
        getCurriculumMapV2: function() {
          return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
        }
      };
    },
    getAll: function() {
      return [{
        id: "chordspark",
        appId: "chordspark",
        instrument: "guitar"
      }];
    }
  };

  SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return []; },
    getCurriculum: function() { return { SESSIONS: [] }; },
    getSongs: function() { return []; }
  };

  var core = createDefaultSparkCore();
  var plan = core.openGuidedSession({ sessionNum: 1 });
  var state = core.skipGuidedBlock({}).runtimeState;

  assert.strictEqual(state.guidedStep, "review");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_drill");
  assert.strictEqual(plan.segments[0].completed, true);
  assert.strictEqual(plan.segments[1].completed, false);

  core.syncGuidedRuntimeState({
    guidedStep: "newMove",
    guidedNewMovePhase: "shadow"
  });
  state = core.skipGuidedBlock({}).runtimeState;
  assert.strictEqual(state.guidedStep, "songSlice");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_song");
  assert.strictEqual(plan.segments[1].completed, true);

  state = core.skipGuidedBlock({}).runtimeState;
  assert.strictEqual(state.guidedStep, "victoryLap");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_cooldown");
  assert.strictEqual(plan.segments[2].completed, true);
});

test("extendGuidedBlock keeps victory lap active and lengthens the cooldown shell", function() {
  SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        instrument: "guitar",
        getCurriculumMapV2: function() {
          return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
        }
      };
    },
    getAll: function() {
      return [{
        id: "chordspark",
        appId: "chordspark",
        instrument: "guitar"
      }];
    }
  };

  SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return []; },
    getCurriculum: function() { return { SESSIONS: [] }; },
    getSongs: function() { return []; }
  };

  var core = createDefaultSparkCore();
  var plan = core.openGuidedSession({ sessionNum: 1 });
  var state;

  core.syncGuidedRuntimeState({
    guidedStep: "victoryLap",
    guidedNewMovePhase: null,
    status: "running",
    positionMs: 45000
  });
  state = core.extendGuidedBlock({}).runtimeState;

  assert.strictEqual(state.guidedStep, "victoryLap");
  assert.strictEqual(state.activeSegmentId, "gtr-d01_cooldown");
  assert.strictEqual(state.guidedActivityId, "gtr-d01-cooldown");
  assert.strictEqual(state.guidedBlockType, "cooldown");
  assert.strictEqual(state.transport.status, "running");
  assert.strictEqual(state.transport.positionMs, 0);
  assert.strictEqual(plan.segments[3].durationSec, 390);
  assert.strictEqual(plan.segments[3].meta.guidedExtensionSec, 300);
  assert.strictEqual(plan.segments[3].meta.guidedExtensionCount, 1);
  assert.strictEqual(plan.context.guidedShellExtensionSec, 300);
  assert.strictEqual(plan.context.guidedShellExtensionCount, 1);
  assert.strictEqual(plan.context.guidedShellDurationSec, 900);
  assert.strictEqual(plan.context.guidedPlan.blockActivities.cooldown.duration_sec, 390);
});


test("createDefaultSparkCore registers bass as a first-class instrument adapter", function() {
  SparkInstrumentAdapter = {
    getAppId: function() { return "bassspark"; },
    getInstrumentType: function() { return "bass"; },
    getCurriculumMap: function() { return SparkBassModule.getCurriculumMap(); },
    getCurriculum: function() { return { SESSIONS: SparkBassModule.getCurriculumMap() }; },
    getSongs: function() { return SparkBassModule.getSongs(); }
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
  assert.strictEqual(context.curriculumMap[0].title, "First Groove");
  assert.strictEqual(context.songs[0].title, "Seven Nation Army");
  assert.ok(context.rhythmAdapter);
  assert.strictEqual(context.rhythmAdapter.getLaneCount(), 4);
  assert.strictEqual(performancePlan.context.performanceSong.songId, "seven_nation_army");
  assert.strictEqual(S.performSongData.title, "Seven Nation Army");
  assert.strictEqual(S.performArrangementType, "groove");
  assert.strictEqual(S.performDifficulty, "hard");
});

test("bass rhythm adapter selects richer chart variants as sessions progress", function() {
  var adapter = new SparkBassRhythmAdapter();
  var rootPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_1" }
  });
  var groovePayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_11" }
  });
  var walkingPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_16" }
  });
  var ghostPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_21" }
  });
  var funkPayload = adapter.createPayload({
    curriculum: { nextLessonId: "session_27" }
  });

  assert.strictEqual(rootPayload.chartId, "bass_root_pulse_01");
  assert.strictEqual(groovePayload.chartId, "bass_fifth_drive_01");
  assert.strictEqual(walkingPayload.chartId, "bass_walk_intro_01");
  assert.strictEqual(ghostPayload.chartId, "bass_ghost_grid_01");
  assert.strictEqual(funkPayload.chartId, "bass_funk_push_01");
  assert.strictEqual(rootPayload.songChart.metadata.laneCount, 4);
  assert.ok(walkingPayload.songChart.tracks.guitar.notes.length >= 6);
  assert.ok(funkPayload.songChart.tracks.guitar.notes.length >= 16);
});

test("SparkBassModule exposes authored advanced exercises for later-phase bass skills", function() {
  var walking = SparkBassModule.getExercises("walking_bass");
  var slap = SparkBassModule.getExercises("slap");
  var ghost = SparkBassModule.getExercises("ghost_notes");

  assert.strictEqual(walking[0].id, "bass_walk_lines_01");
  assert.strictEqual(walking[0].focus, "walking_bass");
  assert.strictEqual(slap[0].id, "bass_slap_pop_01");
  assert.strictEqual(slap[0].focus, "slap");
  assert.strictEqual(ghost[0].id, "bass_ghost_grid_02");
  assert.strictEqual(ghost[0].focus, "ghost_notes");
});

test("InstrumentManager rejects adapter factories that return incomplete contracts", function() {
  var manager = new SparkInstrumentManager();

  assert.throws(function() {
    manager.register("broken", function() {
      return {
        getId: function() { return "broken"; }
      };
    });
  }, /missing required method/);
});

test("InstrumentManager getActiveContext fails fast for unregistered instrument types without module capabilities", function() {
  var previousInstruments = global.SparkInstruments;
  var previousAdapter = global.SparkInstrumentAdapter;
  var manager = new SparkInstrumentManager();

  global.SparkInstruments = {
    getActive: function() {
      return { id: "mysteryspark", appId: "mysteryspark", instrument: "mystery" };
    },
    getAll: function() {
      return [];
    }
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "mysteryspark"; },
    getInstrumentType: function() { return "mystery"; }
  };

  assert.throws(function() {
    manager.getActiveContext();
  }, /Instrument "mystery" is not registered/);

  global.SparkInstruments = previousInstruments;
  global.SparkInstrumentAdapter = previousAdapter;
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

test("completeSession can carry focused bass rhythm drill progress into bass skill state", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE
  });

  plan.segments = [
    SparkSessionSegment.create({
      id: "bass_walk_lines_01",
      type: SparkSessionSegmentTypes.RHYTHM_HIGHWAY,
      label: "Walk Lines 01",
      meta: {}
    })
  ];

  var result = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: "bass_walk_lines_01",
    gameplayContext: {
      instrument: "bass",
      exerciseFocus: "walking_bass"
    },
    gameplayResult: {
      gameplay: {
        accuracy: 0.74,
        maxCombo: 11
      },
      learning: {
        weakAreas: ["late"]
      }
    }
  });

  assert.ok(result.sessionStatePatch.bassSkillProgress);
  assert.ok(result.sessionStatePatch.bassSkillProgress.walking_bass);
  assert.ok(result.sessionStatePatch.bassSkillProgress.walking_bass.timing < result.sessionStatePatch.bassSkillProgress.walking_bass.accuracy);
  assert.ok(S.bassSkillProgress.walking_bass);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);


