var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.S = {};

require("../js/sparksuite/core/skill_tracker.js");
var SkillTracker = window.SparkSkillTracker;

console.log("=== Skill Tracker Tests ===");

test("createSkillGraph returns valid default structure", function() {
  var sg = SkillTracker.create();
  assert.strictEqual(sg.timing, 0.5);
  assert.strictEqual(sg.rhythm, 0.5);
  assert.strictEqual(sg.chordAccuracy, 0.5);
  assert.ok(sg.laneAccuracy);
  assert.strictEqual(sg.laneAccuracy[0], 0.5);
  assert.strictEqual(sg.laneAccuracy[5], 0.5);
  assert.ok(Array.isArray(sg.history));
  assert.strictEqual(sg.history.length, 0);
});

test("updateSkillGraph improves timing on good session", function() {
  var sg = SkillTracker.create();
  var before = sg.timing;
  SkillTracker.update(sg, {
    avgAbsDelta: 20, accuracy: 0.9,
    chordHits: 8, chordAttempts: 10,
    laneErrors: {}, totalNotes: 10
  });
  assert.ok(sg.timing > before, "timing should improve: " + sg.timing);
  assert.strictEqual(sg.history.length, 1);
});

test("updateSkillGraph degrades timing on bad session", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.8;
  SkillTracker.update(sg, {
    avgAbsDelta: 80, accuracy: 0.4,
    chordHits: 3, chordAttempts: 10,
    laneErrors: { 2: 5 }, totalNotes: 10
  });
  assert.ok(sg.timing < 0.8, "timing should degrade: " + sg.timing);
});

test("updateSkillGraph caps history at 30", function() {
  var sg = SkillTracker.create();
  for (var i = 0; i < 35; i++) {
    SkillTracker.update(sg, {
      avgAbsDelta: 50, accuracy: 0.5,
      chordHits: 5, chordAttempts: 10,
      laneErrors: {}, totalNotes: 10
    });
  }
  assert.strictEqual(sg.history.length, 30);
});

test("getWeakestSkill returns lowest skill", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.3; sg.rhythm = 0.7; sg.chordAccuracy = 0.6;
  assert.strictEqual(SkillTracker.getWeakestSkill(sg), "timing");
});

test("getWeakestLane returns lowest lane", function() {
  var sg = SkillTracker.create();
  sg.laneAccuracy[3] = 0.1;
  assert.strictEqual(SkillTracker.getWeakestLane(sg), 3);
});

test("getSkillDelta returns per-skill changes", function() {
  var prev = { timing: 0.5, rhythm: 0.5, chordAccuracy: 0.5 };
  var sg = SkillTracker.create();
  sg.timing = 0.6; sg.rhythm = 0.45; sg.chordAccuracy = 0.5;
  var delta = SkillTracker.getSkillDelta(sg, prev);
  assert.ok(delta.timing > 0);
  assert.ok(delta.rhythm < 0);
  assert.strictEqual(delta.chordAccuracy, 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
