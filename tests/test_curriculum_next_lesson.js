// Regression test for bug #6: the engine-driven daily-practice next-lesson
// resolution must advance past lessons recorded in S.completedLessons. The live
// completion path only appends the lesson id to S.completedLessons (it writes no
// lesson-mastery value), so before the fix the first lesson was served forever.
var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) { global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8")); }

// The engine file only defines the constructor (no global state captured at load
// time), so load it ONCE; setup() just resets the mock state per test.
global.window = global;
global.S = { completedLessons: [], mastery: { lessons: {} }, curriculumV2CompletedSessions: {} };
global.SparkMastery = { category: function(name) { return (global.S.mastery && global.S.mastery[name]) || {}; } };
global.SparkCurriculumBridge = { getNextLesson: function() { return null; }, isLessonUnlocked: function() { return true; } };
global.SparkCurriculumService = { getReviewTargets: function() { return []; }, buildLearningQueue: function() { return []; }, getLessonById: function() { return null; } };
loadJS("js/sparksuite/core/curriculum_engine.js");

function setup(completedLessons) {
  global.S.completedLessons = completedLessons || [];
  global.S.mastery = { lessons: {} };
  global.S.curriculumV2CompletedSessions = {};
  return new global.SparkSuiteCurriculumEngine();
}

var LESSONS = [
  { id: "l1", prerequisites: [], masteryRequired: 1 },
  { id: "l2", prerequisites: [], masteryRequired: 1 },
  { id: "l3", prerequisites: [], masteryRequired: 1 }
];

function nextId(eng) {
  var ctx = eng.getDailyPracticeContext({ instrumentType: "piano", lessons: LESSONS });
  return ctx.nextLesson && ctx.nextLesson.id;
}

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- Curriculum next-lesson advancement ---");

test("fresh learner gets the first lesson", function() {
  assert.strictEqual(nextId(setup([])), "l1");
});

test("a completed lesson (S.completedLessons) is skipped — practice advances", function() {
  assert.strictEqual(nextId(setup(["l1"])), "l2");
});

test("advances again after the second lesson is completed", function() {
  assert.strictEqual(nextId(setup(["l1", "l2"])), "l3");
});

test("all complete falls back to a lesson without crashing", function() {
  assert.ok(nextId(setup(["l1", "l2", "l3"])));
});
