var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
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
  global.lastProgressEvent = null;
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
    evaluateAll: function(evt) {
      global.lastProgressEvent = evt;
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

var core = createDefaultSparkCore();
var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });
var activeView = core.getActiveSessionView();

assert.ok(plan instanceof SessionPlan);
assert.strictEqual(plan.flow, SparkSessionTypes.FLOW_DAILY_PRACTICE);
assert.ok(Array.isArray(plan.segments));
assert.ok(plan.segments.length >= 2);
assert.ok(Array.isArray(plan.rewards));
assert.ok(plan.rewards.length >= 1);
assert.strictEqual(activeView.plan, plan);
assert.strictEqual(activeView.activeSegment.id, plan.segments[0].id);
assert.strictEqual(activeView.activeSegment.label, plan.segments[0].label);

var partial = core.completeSession({
  flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
  itemId: plan.segments[0].id,
  result: { hits: 8, total: 10 }
});

assert.strictEqual(partial.completedItems, 1);
assert.strictEqual(partial.planCompleted, false);
assert.strictEqual(core.getLastSessionOutcome(), partial);

var complete = core.completeSession({
  flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
  itemId: plan.segments[1].id,
  result: { hits: 9, total: 10 }
});

assert.strictEqual(complete.planCompleted, true);
assert.strictEqual(core.getLastSessionOutcome(), complete);
assert.strictEqual(S.practicePlanComplete, true);
assert.ok(Array.isArray(S.practicePlanHistory));
assert.strictEqual(S.practicePlanHistory.length, 1);
assert.ok(S.xpToast && S.xpToast.amount > 0);
assert.ok(core.getRuntimeState().lastCompletedSessionId === plan.id);
assert.ok(core.getRuntimeState().transport.status === "completed");

console.log("PASS: SparkCore end-to-end session flow builds, activates, and completes a session plan");
