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

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "guided_session");
  assert.strictEqual(plan.segments.length, 1);
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

  assert.ok(plan instanceof SessionPlan);
  assert.strictEqual(plan.flow, "performance_song");
  assert.strictEqual(plan.segments.length, 1);
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
