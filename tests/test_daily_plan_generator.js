var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.S = {};
global.__sparkState = global.S;

require("../js/sparksuite/core/skill_tracker.js");
require("../js/sparksuite/core/lesson_generator.js");
require("../js/sparksuite/core/daily_plan_generator.js");
var SkillTracker = window.SparkSkillTracker;
var DailyPlan = window.SparkDailyPlanGenerator;

console.log("=== Daily Plan Generator Tests ===");

test("generates plan with warmup as first item", function() {
  var sg = SkillTracker.create();
  var plan = DailyPlan.generate(sg, []);
  assert.ok(plan.length >= 2, "should have at least warmup + challenge");
  assert.strictEqual(plan[0].type, "warmup");
});

test("includes lesson when skills are weak", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.3;
  var plan = DailyPlan.generate(sg, []);
  var hasLesson = plan.some(function(p) { return p.type === "timing_drill"; });
  assert.ok(hasLesson, "should include timing drill");
});

test("includes song when songList provided", function() {
  var sg = SkillTracker.create();
  var songs = [{ title: "Test Song", bpm: 100 }];
  var plan = DailyPlan.generate(sg, songs);
  var hasSong = plan.some(function(p) { return p.type === "song"; });
  assert.ok(hasSong, "should include song");
});

test("includes challenge as last item", function() {
  var sg = SkillTracker.create();
  var plan = DailyPlan.generate(sg, []);
  assert.strictEqual(plan[plan.length - 1].type, "challenge");
});

test("estimateDuration sums durations", function() {
  var plan = [{ duration: 60 }, { duration: 30 }, { duration: 90 }];
  assert.strictEqual(DailyPlan.estimateDuration(plan), 180);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
