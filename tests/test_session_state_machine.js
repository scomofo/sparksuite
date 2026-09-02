var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function test(name, fn) {
  try {
    fn();
    console.log("PASS:", name);
  } catch (error) {
    console.error("FAIL:", name);
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
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
  global.saveState = function() {};
  global.SparkInstruments = {
    getActive: function() { return null; },
    getAll: function() { return []; }
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculumMap: function() { return [{ num: 1, title: "First Spark" }]; },
    getCurriculum: function() {
      return {
        SESSIONS: [
          { num: 1, title: "First Spark", level: 1, bpm: 70, spark: { text: "Start here" }, newMove: { chord: "C" } },
          { num: 2, title: "Second Spark", level: 1, bpm: 75, spark: { text: "Keep going" }, newMove: { chord: "G" } }
        ]
      };
    },
    getSongs: function() { return [{ title: "Fire Road", artist: "Spark Suite" }]; }
  };
  global.buildPracticeCandidates = function() {
    return [
      { id: "warmup_1", type: "warmup", label: "Quick warmup", reason: "Start loose", meta: { durationSec: 120 } },
      { id: "transition_1", type: "transition", label: "Practice G to C", reason: "Weak transition", meta: { key: "G|C", from: "G", to: "C" } }
    ];
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
    evaluateAll: function() {
      return {};
    }
  };
  global.SparkPsychology = {
    shouldReward: function() { return false; }
  };
  global.updateWeakSpotsFromPerformance = function() {};
  global.updateAdaptiveFromResult = function() {};
  global.checkLessonUnlockRules = function() { return true; };
  global.getNextLessonFromCurriculum = function(rootLessonId) { return rootLessonId; };
}

resetState();
// SparkDay: the local-calendar-day helper the day-boundary logic depends on.
loadJS("js/utils/day.js");
loadJS("js/utils/normalize.js");
loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");
loadJS("js/sparksuite/domain/session_states.js");
loadJS("js/sparksuite/core/session_transitions.js");
loadJS("js/sparksuite/core/session_state_machine.js");
loadJS("js/sparksuite/domain/tempo_map.js");
loadJS("js/sparksuite/domain/note_event.js");
loadJS("js/sparksuite/domain/phrase.js");
loadJS("js/sparksuite/domain/chart.js");
loadJS("js/sparksuite/domain/gameplay_result.js");
loadJS("js/sparksuite/domain/engine_preset.js");
loadJS("js/sparksuite/bridges/practice_bridge.js");
loadJS("js/sparksuite/bridges/curriculum_bridge.js");
loadJS("js/sparksuite/bridges/progress_bridge.js");
loadJS("js/sparksuite/bridges/performance_bridge.js");
loadJS("js/sparksuite/core/calibration_engine.js");
loadJS("js/sparksuite/core/timing_engine.js");
loadJS("js/sparksuite/core/chart_io.js");
loadJS("js/sparksuite/core/replay_engine.js");
loadJS("js/sparksuite/core/input_judge.js");
loadJS("js/sparksuite/core/scoring_engine.js");
loadJS("js/sparksuite/core/rhythm_gameplay_engine.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_skill_tree.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_chords.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_scales.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_tuning.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_progression.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_adapter.js");
loadJS("js/sparksuite/instruments/ukulele/index.js");
loadJS("js/instruments/bass/data.js");
loadJS("js/sparksuite/instruments/bass/bass_module.js");
loadJS("js/sparksuite/instruments/bass/bass_adapter.js");
loadJS("js/sparksuite/instruments/bass/index.js");
loadJS("js/sparksuite/instruments/piano/piano_adapter.js");
loadJS("js/sparksuite/instruments/piano/index.js");
loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js");
loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js");
loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js");
loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js");
loadJS("js/sparksuite/instruments/guitar/index.js");
loadJS("js/curriculum/curriculum_v2_data.generated.js");
loadJS("js/curriculum/curriculum_v2.js");
loadJS("js/curriculum/curriculum_v2_legacy_adapter.js");
loadJS("js/sparksuite/core/storage.js");
loadJS("js/sparksuite/core/ai_engine.js");
loadJS("js/sparksuite/core/instrument_manager.js");
loadJS("js/sparksuite/core/psychology_engine.js");
loadJS("js/sparksuite/core/curriculum_engine.js");
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/sparksuite/core/progress_engine.js");
loadJS("js/sparksuite/core/session_engine.js");
loadJS("js/sparksuite/core/spark_core.js");

console.log("\n--- Session State Machine ---");

test("session state machine allows the canonical happy-path transitions", function() {
  var machine = new SparkSessionStateMachine({
    sessionId: "plan_1"
  });

  assert.strictEqual(machine.getState(), SparkSessionStates.CREATED);
  assert.strictEqual(machine.transition(SparkSessionStates.READY, { reason: "session_built" }), SparkSessionStates.READY);
  assert.strictEqual(machine.transition(SparkSessionStates.RUNNING, { reason: "exercise_started" }), SparkSessionStates.RUNNING);
  assert.strictEqual(machine.transition(SparkSessionStates.SEGMENT_COMPLETE, { reason: "segment_completed" }), SparkSessionStates.SEGMENT_COMPLETE);
  assert.strictEqual(machine.transition(SparkSessionStates.COMPLETED, { reason: "session_completed" }), SparkSessionStates.COMPLETED);
  assert.strictEqual(machine.snapshot().history.length, 5);
});

test("session state machine rejects impossible transitions and allows retry from failed", function() {
  var machine = new SparkSessionStateMachine({
    sessionId: "plan_2"
  });

  assert.throws(function() {
    machine.transition(SparkSessionStates.COMPLETED, { reason: "skip_everything" });
  }, /Invalid session transition/);

  machine.transition(SparkSessionStates.READY, { reason: "session_built" });
  machine.transition(SparkSessionStates.FAILED, { reason: "runtime_error" });
  assert.strictEqual(machine.transition(SparkSessionStates.READY, { reason: "retry" }), SparkSessionStates.READY);
});

test("sparkCore startSession and completeSession keep a live session state machine snapshot", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, forceRebuild: true });
  var activeView = core.getActiveSessionView();

  assert.ok(activeView.stateMachine);
  assert.strictEqual(activeView.stateMachine.sessionId, plan.id);
  assert.strictEqual(activeView.stateMachine.state, SparkSessionStates.READY);

  core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[0].id,
    result: { hits: 8, total: 10 }
  });
  activeView = core.getActiveSessionView();
  assert.strictEqual(activeView.stateMachine.state, SparkSessionStates.SEGMENT_COMPLETE);

  core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[1].id,
    result: { hits: 9, total: 10 }
  });
  activeView = core.getActiveSessionView();
  assert.strictEqual(activeView.stateMachine.state, SparkSessionStates.COMPLETED);
});

test("sparkCore rejects completing an already completed session before re-running progress flow", function() {
  var core = createDefaultSparkCore();
  var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE, forceRebuild: true });
  var originalCompleteSession = core.progressEngine.completeSession;
  var completionCalls = 0;

  core.progressEngine.completeSession = function(planArg, payloadArg) {
    completionCalls++;
    return originalCompleteSession.call(core.progressEngine, planArg, payloadArg);
  };

  core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[0].id,
    result: { hits: 8, total: 10 }
  });
  var firstFinalOutcome = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[1].id,
    result: { hits: 9, total: 10 }
  });

  assert.throws(function() {
    core.completeSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      itemId: plan.segments[1].id,
      result: { hits: 9, total: 10 }
    });
  }, /Invalid session transition|Cannot complete session/);

  assert.strictEqual(completionCalls, 2);
  assert.deepStrictEqual(core.getLastSessionOutcome(), firstFinalOutcome);
  assert.strictEqual(core.getActiveSessionView().stateMachine.state, SparkSessionStates.COMPLETED);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
