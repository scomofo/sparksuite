var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..", "..");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(repoRoot, file), "utf8"));
}

function loadFixture(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
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
    xpToast: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    chordProgress: {},
    adaptiveState: {},
    weakSpots: {},
    performArrangementType: "chords",
    performDifficulty: "normal"
  };
  global.saveState = function() {};
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
loadJS("js/utils/day.js");
loadJS("js/utils/normalize.js");
loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");
loadJS("js/sparksuite/domain/tempo_map.js");
loadJS("js/sparksuite/domain/note_event.js");
loadJS("js/sparksuite/domain/phrase.js");
loadJS("js/sparksuite/domain/chart.js");
loadJS("js/sparksuite/domain/gameplay_result.js");
loadJS("js/sparksuite/domain/engine_preset.js");
loadJS("js/sparksuite/storage/profile_schema.js");
loadJS("js/sparksuite/storage/migrations.js");
loadJS("js/sparksuite/bridges/practice_bridge.js");
loadJS("js/sparksuite/bridges/curriculum_bridge.js");
loadJS("js/sparksuite/bridges/progress_bridge.js");
loadJS("js/sparksuite/bridges/performance_bridge.js");
loadJS("js/sparksuite/core/storage.js");
loadJS("js/sparksuite/core/calibration_engine.js");
loadJS("js/sparksuite/core/timing_engine.js");
loadJS("js/sparksuite/core/chart_io.js");
loadJS("js/sparksuite/core/replay_engine.js");
loadJS("js/sparksuite/core/input_judge.js");
loadJS("js/sparksuite/core/scoring_engine.js");
loadJS("js/sparksuite/core/rhythm_gameplay_engine.js");
loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js");
loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js");
loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js");
loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js");
loadJS("js/sparksuite/instruments/guitar/index.js");
loadJS("js/curriculum/curriculum_v2_data.generated.js");
loadJS("js/curriculum/curriculum_v2.js");
loadJS("js/curriculum/curriculum_v2_legacy_adapter.js");
loadJS("js/sparksuite/core/ai_engine.js");
loadJS("js/sparksuite/core/instrument_manager.js");
loadJS("js/sparksuite/core/psychology_engine.js");
loadJS("js/sparksuite/core/curriculum_engine.js");
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/sparksuite/core/progress_engine.js");
loadJS("js/sparksuite/core/session_engine.js");
require("../spark_core_modules.js").loadSparkCore(loadJS);

var resultFixture = loadFixture("fixtures/results/perfect_run.json");

var core = createDefaultSparkCore();
var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
var view = core.getActiveSessionView();

assert.ok(plan instanceof SessionPlan);
assert.ok(Array.isArray(plan.segments));
assert.ok(plan.segments.length >= 2);
assert.strictEqual(view.activeSegment.id, plan.segments[0].id);
assert.ok(S.activeSessionPlanId);

var first = core.completeSession({
  flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
  itemId: plan.segments[0].id,
  result: resultFixture
});
assert.strictEqual(first.planCompleted, false);

var last = core.completeSession({
  flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
  itemId: plan.segments[1].id,
  result: resultFixture
});

assert.strictEqual(last.planCompleted, true);
assert.ok(S.practicePlanComplete);
assert.ok(S.xpToast && S.xpToast.amount > 0);
assert.ok(core.getRuntimeState().lastCompletedSessionId === plan.id);
assert.strictEqual(core.getRuntimeState().transport.status, "completed");

console.log("PASS: e2e guitar happy path completes session, progression, and reward flow");
