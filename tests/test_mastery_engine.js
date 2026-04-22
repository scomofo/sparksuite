var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.S = {};
global.escHTML = function(s) { return String(s); };

require("../js/sparksuite/core/skill_tracker.js");
require("../js/sparksuite/core/mastery_engine.js");
var SkillTracker = window.SparkSkillTracker;
var Mastery = window.SparkMasteryEngine;

console.log("=== Mastery Engine Tests ===");

test("getTier returns gold for 0.8+", function() {
  assert.strictEqual(Mastery.getTier(0.85).id, "gold");
});

test("getTier returns silver for 0.6+", function() {
  assert.strictEqual(Mastery.getTier(0.65).id, "silver");
});

test("getTier returns bronze for 0.4+", function() {
  assert.strictEqual(Mastery.getTier(0.45).id, "bronze");
});

test("getTier returns null for below 0.4", function() {
  assert.strictEqual(Mastery.getTier(0.3), null);
});

test("getMasteryLevels returns per-skill tiers", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.85; sg.rhythm = 0.5; sg.chordAccuracy = 0.65;
  var levels = Mastery.getMasteryLevels(sg);
  assert.strictEqual(levels.timing.id, "gold");
  assert.strictEqual(levels.rhythm.id, "bronze");
  assert.strictEqual(levels.chordAccuracy.id, "silver");
});

test("getUnlocks returns unlocks for gold skills", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.85; sg.rhythm = 0.85; sg.chordAccuracy = 0.85;
  var unlocks = Mastery.getUnlocks(sg);
  assert.ok(unlocks.length >= 4, "should have multiple unlocks");
  var ids = unlocks.map(function(u) { return u.id; });
  assert.ok(ids.indexOf("master_mode") >= 0, "should unlock master mode");
});

test("getUnlocks returns empty for weak skills", function() {
  var sg = SkillTracker.create();
  sg.timing = 0.3; sg.rhythm = 0.3; sg.chordAccuracy = 0.3;
  var unlocks = Mastery.getUnlocks(sg);
  assert.strictEqual(unlocks.length, 0);
});

test("renderBadge returns empty for null tier", function() {
  assert.strictEqual(Mastery.renderBadge(null), "");
});

test("renderBadge returns HTML for valid tier", function() {
  var badge = Mastery.renderBadge(Mastery.getTier(0.85));
  assert.ok(badge.indexOf("Gold") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
