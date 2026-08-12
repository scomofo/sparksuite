// ===== Unmocked Session Loop E2E =====
// Run: node tests/e2e/session_loop_unmocked.test.js
//
// The other e2e tests stub the engine seams (SparkSession,
// SparkProgressOrchestrator, SparkPsychology, buildPracticeCandidates).
// This test runs the FULL engine chain with the real modules:
//
//   real practice selectors  -> real SparkCore session engines
//   real curriculum service  -> lesson choice from the real uke module
//   real progress orchestrator + real XP/level economy
//   real psychology + real adaptive difficulty rules
//
// driven by the golden fixtures in fixtures/results/. Only platform/UI
// seams are shimmed: localStorage, saveState, history/event sinks, the
// instrument registry lookup (which serves the REAL ukulele module),
// and Math.random (pinned for deterministic reward rolls).
//
// This is the CLAUDE.md guiding principle as a test: remove the UI and
// SparkSuite must still function — build a session, play it, and watch
// progress, XP, and difficulty respond.

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var repoRoot = path.resolve(__dirname, "..", "..");

function loadJS(file) {
  var full = path.join(repoRoot, file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function loadFixture(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

// ---------------------------------------------------------------------------
// Platform shims (NOT engine stubs)
// ---------------------------------------------------------------------------

global.window = global;

var saveStateCalls = 0;
global.saveState = function() { saveStateCalls++; };

var historyLog = [];
global.logHistory = function(type, detail, xp) { historyLog.push({ type: type, detail: detail, xp: xp }); };

var emittedEvents = [];
global._sparkEmit = function(type, payload) { emittedEvents.push({ type: type, payload: payload }); };

var storageBacking = {};
global.localStorage = {
  getItem: function(k) { return Object.prototype.hasOwnProperty.call(storageBacking, k) ? storageBacking[k] : null; },
  setItem: function(k, v) { storageBacking[k] = String(v); },
  removeItem: function(k) { delete storageBacking[k]; }
};

// Deterministic psychology rolls: 0.9 means no jackpot (threshold 1/15)
// and no variable-ratio reward beyond the guaranteed early phase.
Math.random = function() { return 0.9; };

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
  level: 1,
  playerXP: 0,
  playerLevel: 1,
  sessions: 0,
  streak: 0,
  guidedSession: 1,
  completedGuidedSessions: [],
  // Seeded learner state so the real selectors have something to work with:
  // two partially-learned chords and a weak rhythm result below the 75%
  // threshold that makes selectRhythmCandidate fire.
  chordProgress: { C: 40, Am: 20 },
  ukuleleSkillProgress: {},
  rhythmResults: { accuracy: 60 },
  rhythmBpm: 90,
  adaptiveState: {},
  weakSpots: {},
  performArrangementType: "chords",
  performDifficulty: "normal"
};

// ---------------------------------------------------------------------------
// Real modules — domain, gameplay core, instrument, curriculum, engines
// ---------------------------------------------------------------------------

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
loadJS("js/curriculum/curriculum_v2_data.generated.js");
loadJS("js/curriculum/curriculum_v2.js");
loadJS("js/curriculum/curriculum_v2_legacy_adapter.js");

// The real engine chain the stubbed e2e replaces with fakes:
loadJS("js/practice/selectors.js");        // real buildPracticeCandidates
loadJS("js/practice/weakspots.js");        // real updateWeakSpotsFromPerformance
loadJS("js/practice/adaptive.js");         // real per-exercise adaptive state
loadJS("js/progression/adaptive.js");      // real buildAdaptiveDecision rules
loadJS("js/curriculum/curriculum_registry.js"); // real getCurriculumItem
loadJS("js/curriculum/curriculum_engine.js"); // real SparkCurriculumService
loadJS("js/sparksuite/services/psychology.js"); // real SparkPsychology
loadJS("js/sparksuite/core/contracts.js");
loadJS("js/sparksuite/core/progress_orchestrator.js"); // real progression
loadJS("js/sparksuite/legacy/session_engine.js");      // real SparkSession
loadJS("js/meta/levels.js");               // real level curve
loadJS("js/meta/xp.js");                   // real awardXP

loadJS("js/sparksuite/core/storage.js");
loadJS("js/sparksuite/core/ai_engine.js");
loadJS("js/sparksuite/core/instrument_manager.js");
loadJS("js/sparksuite/core/psychology_engine.js");
loadJS("js/sparksuite/core/curriculum_engine.js");
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/sparksuite/core/progress_engine.js");
loadJS("js/sparksuite/core/session_engine.js");
loadJS("js/sparksuite/core/spark_core.js");

// Registry lookup shim serving the REAL ukulele module.
global.SparkInstruments = {
  getActive: function() { return SparkUkuleleModule; },
  getAll: function() { return [SparkUkuleleModule]; }
};
global.SparkInstrumentAdapter = {
  getAppId: function() { return SparkUkuleleModule.appId; },
  getInstrumentType: function() { return SparkUkuleleModule.id; },
  getCurriculumMap: function() { return SparkUkuleleModule.getCurriculumMap(); },
  getCurriculum: function() { return SparkUkuleleModule.getCurriculum(); },
  getSongs: function() { return SparkUkuleleModule.getSongs(); }
};

var perfectRun = loadFixture("fixtures/results/perfect_run.json");
var badTimingRun = loadFixture("fixtures/results/bad_timing_run.json");

// ---------------------------------------------------------------------------
// 1. Build a session through SparkCore with the real selectors + curriculum
// ---------------------------------------------------------------------------

var core = createDefaultSparkCore();
var plan = core.startSession({ flow: SparkSessionTypes.FLOW_DAILY_PRACTICE });

assert.ok(plan instanceof SessionPlan, "startSession must return a SessionPlan");
assert.ok(plan.segments.length >= 2,
  "real selectors should produce multiple segments from the seeded learner state, got " + plan.segments.length);
plan.segments.forEach(function(seg) {
  assert.ok(seg.id, "every segment needs an id");
  assert.ok(seg.label, "every segment needs a label");
});

var activeView = core.getActiveSessionView();
assert.strictEqual(activeView.plan, plan);
assert.strictEqual(activeView.activeSegment.id, plan.segments[0].id);

// ---------------------------------------------------------------------------
// 2. Play the whole plan with the perfect-run fixture and complete it
// ---------------------------------------------------------------------------

var outcome = null;
for (var i = 0; i < plan.segments.length; i++) {
  outcome = core.completeSession({
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    itemId: plan.segments[i].id,
    result: { hits: perfectRun.hits, total: perfectRun.total }
  });
  assert.strictEqual(outcome.completedItems, i + 1);
}

assert.strictEqual(outcome.planCompleted, true, "playing every segment must complete the plan");
assert.strictEqual(S.practicePlanComplete, true);
assert.strictEqual(S.practicePlanHistory.length, 1, "completed plan must be recorded in history");
assert.ok(S.xpToast && S.xpToast.amount > 0, "completing the plan must award XP");
assert.strictEqual(core.getRuntimeState().lastCompletedSessionId, plan.id);
assert.strictEqual(core.getRuntimeState().transport.status, "completed");
assert.ok(saveStateCalls > 0, "engine progress must persist through saveState");

// ---------------------------------------------------------------------------
// 3. Run the REAL progression sequence (orchestrator, not a stub)
// ---------------------------------------------------------------------------

var chordBefore = S.chordProgress.C;
var sessionResult = SparkContracts.createSessionResult({
  mode: "quickStart",
  chordName: "C",
  duration: 120,
  accuracy: perfectRun.accuracy,
  completed: true
});
var progression = SparkSession.processResults(sessionResult);

assert.ok(progression.xpEarned > 0, "real orchestrator must award session XP");
assert.strictEqual(progression.jackpot, false, "pinned Math.random must not jackpot");
assert.strictEqual(S.sessions, 1, "orchestrator must count the session");
assert.ok(S.chordProgress.C > chordBefore,
  "chord progress must advance (was " + chordBefore + ", now " + S.chordProgress.C + ")");
assert.ok(historyLog.some(function(h) { return h.type === "session"; }),
  "progression must log session history");
assert.ok(emittedEvents.some(function(e) { return e.type === "practice_session_completed"; }),
  "progression must emit the session-completed event");

// ---------------------------------------------------------------------------
// 4. Difficulty responds to results through the real psychology rules
// ---------------------------------------------------------------------------

var goodCall = SparkPsychology.getAdaptiveDifficulty({
  targetType: "rhythm",
  currentValue: S.rhythmBpm,
  accuracy: perfectRun.accuracy * 100
});
assert.strictEqual(goodCall.difficultyAction, "raise_bpm", "a perfect run must raise the rhythm bpm");
assert.strictEqual(goodCall.nextValue, S.rhythmBpm + 5);

var badCall = SparkPsychology.getAdaptiveDifficulty({
  targetType: "rhythm",
  currentValue: S.rhythmBpm,
  accuracy: badTimingRun.accuracy * 100
});
assert.strictEqual(badCall.difficultyAction, "lower_bpm", "a bad-timing run must lower the rhythm bpm");
assert.strictEqual(badCall.nextValue, S.rhythmBpm - 5);

var easedExercise = applyAdaptiveToExercise({ id: "ex_1", bpm: 90 });
S.adaptiveState["ex_1"] = { accuracy: badTimingRun.accuracy };
var easedAfterBadRun = applyAdaptiveToExercise({ id: "ex_1", bpm: 90 });
assert.ok(easedAfterBadRun.bpm < easedExercise.bpm,
  "after a bad run the same exercise must come back easier (" + easedExercise.bpm + " -> " + easedAfterBadRun.bpm + ")");

console.log("PASS: e2e unmocked session loop — real engines build, play, progress, and adapt a session");
