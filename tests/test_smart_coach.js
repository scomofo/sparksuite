var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function resetState() {
  global.window = global;
  global.S = {
    xp: 0,
    weakSpots: { rhythmHighway: ["wrong_fret"] },
    skillGraph: null,
    personalInsights: null,
    practicePlanHistory: []
  };
  global.saveState = function() {};
}

resetState();

loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");
loadJS("js/sparksuite/core/skill_tracker.js");
loadJS("js/sparksuite/core/flow_engine.js");
loadJS("js/sparksuite/core/lesson_generator.js");
loadJS("js/sparksuite/core/learning_brain.js");
loadJS("js/sparksuite/bridges/progress_bridge.js");
loadJS("js/sparksuite/core/session_engine.js");

var passed = 0, failed = 0;
function test(name, fn) {
  try { resetState(); fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

console.log("=== Smart Coach Tests ===");

test("session engine uses smart brain analysis to drive difficulty and focus", function() {
  S.skillGraph = SparkSkillTracker.create();
  S.skillGraph.timing = 0.34;
  S.skillGraph.laneAccuracy[3] = 0.28;
  S.lastSessionEvents = [{ type: "miss" }, { type: "miss" }, { type: "miss" }, { type: "miss" }, { type: "miss" }, { type: "miss" }];
  S.playerProfile = { consistency: 0.4 };

  var practiceEngine = {
    buildDailyPracticePlan: function() {
      return { segments: [], exercises: [], focus: "timing", rewards: { xp: 10 } };
    }
  };
  var curriculumEngine = {
    getDailyPracticeContext: function() {
      return { nextLesson: { id: "lesson_1", skill: "timing" } };
    }
  };

  var engine = new SparkSuiteSessionEngine(practiceEngine, curriculumEngine);
  var plan = engine.buildSession(SparkSessionTypes.FLOW_DAILY_PRACTICE, {
    instrumentContext: { appId: "chordspark" }
  });

  assert.strictEqual(plan.difficulty, "easy");
  assert.strictEqual(plan.focus, "timing");
  assert.ok(plan.context.brainAnalysis);
  assert.strictEqual(plan.context.brainAnalysis.recommendedDifficultyId, "easy");
  assert.strictEqual(plan.context.smartCoach.weakArea, "wrong_fret");
  assert.ok(plan.exercises.length >= 1);
  assert.strictEqual(plan.exercises[0].data.core.skill, "timing");
});

test("progress bridge stores smart coach insights after session completion", function() {
  S.skillGraph = SparkSkillTracker.create();
  var plan = new SessionPlan({
    id: "session_smart",
    flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
    segments: [],
    exercises: []
  });

  SparkProgressBridge.finalizePlan(plan, {
    xpAwarded: 15,
    accuracy: 0.58,
    avgAbsDelta: 72,
    chordHits: 16,
    chordAttempts: 20,
    totalNotes: 20,
    laneErrors: { 2: 10 },
    sessionStatePatch: {
      weakSpots: { rhythmHighway: ["wrong_fret"] }
    },
    completionSummary: {
      date: "2026-04-09",
      focus: "timing",
      itemCount: 0,
      completedAt: "2026-04-09T12:00:00.000Z",
      sessionId: "session_smart",
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      durationSec: 60
    }
  });

  var stateRoot = global.__sparkState || global.S;
  assert.ok(stateRoot.personalInsights);
  assert.strictEqual(stateRoot.recommendedFocus, "timing");
  assert.strictEqual(stateRoot.personalInsights.recommendationQuality.smartCoach.focusSkill, "timing");
  assert.strictEqual(stateRoot.personalInsights.recommendationQuality.smartCoach.weakArea, "wrong_fret");
  assert.ok(typeof stateRoot.personalInsights.coach.message === "string");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
