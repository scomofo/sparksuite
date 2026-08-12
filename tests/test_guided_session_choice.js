// Verifies the SessionEngine asks the CurriculumEngine which guided session
// is next (engine-owned lesson choice) instead of always starting at session 1,
// while still honoring an explicitly caller-pinned sessionNum.
var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function setup(stateOverrides) {
  global.window = global;
  global.S = Object.assign({
    level: 1,
    completedGuidedSessions: [],
    completedSessions: [],
    completedLessons: [],
    curriculumV2CompletedSessions: {},
    mastery: { chords: {}, lessons: {} },
    chordProgress: {}
  }, stateOverrides || {});

  // CurriculumService provides the engine-owned lesson choice; SparkSession
  // orchestrates. No SparkContracts loaded, so wrapPlan returns the raw plan.
  eval(loadJS("js/curriculum/curriculum_engine.js"));
  eval(loadJS("js/sparksuite/legacy/session_engine.js"));
}

function sessions() {
  return [
    { num: 1, title: "Hello, Bass", level: 1 },
    { num: 2, title: "Two Strings", level: 1 },
    { num: 3, title: "First Riff", level: 1 }
  ];
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Guided Session Choice ---");

test("fresh player with no completion starts at session 1", function() {
  setup();
  var plan = SparkSession.buildSession({ mode: "guided", instrumentData: { SESSIONS: sessions() } });
  assert.strictEqual(plan.sessionNum, 1);
  assert.strictEqual(plan.plan.title, "Hello, Bass");
});

test("engine advances to the first not-yet-completed guided session", function() {
  setup({ completedGuidedSessions: [1, 2] });
  var plan = SparkSession.buildSession({ mode: "guided", instrumentData: { SESSIONS: sessions() } });
  assert.strictEqual(plan.sessionNum, 3, "should skip completed sessions 1 and 2");
  assert.strictEqual(plan.plan.title, "First Riff");
});

test("a not-yet-finished choice reports allComplete=false", function() {
  setup({ completedGuidedSessions: [1] });
  var choice = SparkCurriculumService.getNextGuidedSession(sessions());
  assert.strictEqual(choice.sessionNum, 2);
  assert.strictEqual(choice.allComplete, false);
});

test("legacy completedSessions structure is also honored", function() {
  setup({ completedSessions: [1] });
  var plan = SparkSession.buildSession({ mode: "guided", instrumentData: { SESSIONS: sessions() } });
  assert.strictEqual(plan.sessionNum, 2);
  assert.strictEqual(plan.plan.title, "Two Strings");
});

test("explicitly pinned sessionNum overrides the curriculum choice", function() {
  setup({ completedGuidedSessions: [1, 2] });
  var plan = SparkSession.buildSession({ mode: "guided", sessionNum: 2, instrumentData: { SESSIONS: sessions() } });
  assert.strictEqual(plan.sessionNum, 2, "caller pinned session 2 must win over engine choice");
  assert.strictEqual(plan.plan.title, "Two Strings");
});

test("getNextGuidedSession returns the last session for replay when all are complete", function() {
  setup({ completedGuidedSessions: [1, 2, 3] });
  var choice = SparkCurriculumService.getNextGuidedSession(sessions());
  assert.strictEqual(choice.sessionNum, 3);
  assert.strictEqual(choice.index, 2);
  assert.strictEqual(choice.allComplete, true, "finished learner must be flagged, not silently replayed");
});

test("getNextGuidedSession honors userContext.completedSessionNums without global S", function() {
  setup();
  var choice = SparkCurriculumService.getNextGuidedSession(sessions(), { completedSessionNums: [1] });
  assert.strictEqual(choice.sessionNum, 2);
  assert.strictEqual(choice.session.title, "Two Strings");
});

test("getNextGuidedSession returns null for empty or missing session lists", function() {
  setup();
  assert.strictEqual(SparkCurriculumService.getNextGuidedSession([]), null);
  assert.strictEqual(SparkCurriculumService.getNextGuidedSession(null), null);
});
