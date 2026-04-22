var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.S = {};

require("../js/sparksuite/core/skill_tracker.js");
require("../js/sparksuite/core/lesson_generator.js");
require("../js/sparksuite/core/flow_engine.js");
require("../js/sparksuite/core/learning_brain.js");
var Brain = window.SparkLearningBrain;
var SkillTracker = window.SparkSkillTracker;

console.log("=== Learning Brain Tests ===");

test("analyzeUser returns focused recommendation for weak skills", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.3;
  var result = Brain.analyzeUser(sg, null);
  assert.strictEqual(result.focusSkill, "timing");
  assert.strictEqual(result.recommendation, "targeted_practice");
});

test("analyzeUser returns challenge for strong skills + bored", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.9; sg.rhythm = 0.9; sg.chordAccuracy = 0.9;
  var flow = { accuracy: 0.97, combo: 35, missStreak: 0 };
  var result = Brain.analyzeUser(sg, flow);
  assert.strictEqual(result.recommendation, "challenge");
});

test("analyzeUser returns easy_practice when frustrated", function() {
  var sg = SkillTracker.create();
  var flow = { accuracy: 0.3, combo: 0, missStreak: 10 };
  var result = Brain.analyzeUser(sg, flow);
  assert.strictEqual(result.recommendation, "easy_practice");
});

test("analyzeUser handles null skillGraph", function() {
  var result = Brain.analyzeUser(null, null);
  assert.strictEqual(result.recommendation, "none");
});

test("generatePracticeFromWeakness returns drill", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.3;
  var drill = Brain.generatePracticeFromWeakness("timing", sg);
  assert.ok(drill);
  assert.strictEqual(drill.mode, "practice");
});

test("buildAdaptiveSession returns segments", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.4;
  var songs = [{ title: "Test", bpm: 100 }];
  var session = Brain.buildAdaptiveSession(sg, null, songs);
  assert.ok(session.segments.length >= 1);
  assert.ok(session.analysis);
});

test("buildAdaptiveSession skips song when frustrated", function() {
  var sg = SkillTracker.create();
  var flow = { accuracy: 0.3, combo: 0, missStreak: 10 };
  var songs = [{ title: "Test", bpm: 100 }];
  var session = Brain.buildAdaptiveSession(sg, flow, songs);
  var hasSong = session.segments.some(function(s) { return s.type === "song"; });
  assert.ok(!hasSong, "should skip song when frustrated");
});

test("getInsightText returns meaningful text", function() {
  var text = Brain.getInsightText({ focusSkill: "timing", recommendation: "targeted_practice" });
  assert.ok(text.indexOf("Timing") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
