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
var SkillTracker = window.SparkSkillTracker;
var LessonGen = window.SparkLessonGenerator;

console.log("=== Lesson Generator Tests ===");

test("generates timing drill when timing is weak", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.4; sg.rhythm = 0.8; sg.chordAccuracy = 0.8;
  var lesson = LessonGen.generate(sg);
  assert.ok(lesson, "should return a lesson");
  assert.strictEqual(lesson.type, "timing_drill");
  assert.strictEqual(lesson.mode, "practice");
  assert.strictEqual(lesson.tempo, 60);
});

test("generates lane drill when a lane is weak", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.7; sg.rhythm = 0.7; sg.chordAccuracy = 0.8;
  sg.laneAccuracy[3] = 0.3;
  var lesson = LessonGen.generate(sg);
  assert.ok(lesson);
  assert.strictEqual(lesson.type, "lane_drill");
  assert.strictEqual(lesson.lane, 3);
});

test("generates chord drill when chords are weak", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.7; sg.rhythm = 0.7; sg.chordAccuracy = 0.5;
  var lesson = LessonGen.generate(sg);
  assert.ok(lesson);
  assert.strictEqual(lesson.type, "chord_drill");
});

test("returns null when all skills are strong", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.9; sg.rhythm = 0.9; sg.chordAccuracy = 0.9;
  for (var i = 0; i < 6; i++) sg.laneAccuracy[i] = 0.9;
  var lesson = LessonGen.generate(sg);
  assert.strictEqual(lesson, null);
});

test("lesson has required fields", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.3;
  var lesson = LessonGen.generate(sg);
  assert.ok(lesson.label, "should have label");
  assert.ok(lesson.pattern, "should have pattern");
  assert.ok(typeof lesson.duration === "number", "should have numeric duration");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
