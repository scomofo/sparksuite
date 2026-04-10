var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
require("../js/sparksuite/core/feel_system.js");
require("../js/sparksuite/core/dynamic_timing.js");
var DT = window.SparkDynamicTiming;

console.log("=== Dynamic Timing Tests ===");

test("computeTimingBias returns 0 with insufficient data", function() {
  DT.resetDynamic();
  DT.recordDelta(10);
  assert.strictEqual(DT.computeTimingBias(), 0);
});

test("computeTimingBias computes average with enough data", function() {
  DT.resetDynamic();
  for (var i = 0; i < 5; i++) DT.recordDelta(20);
  assert.strictEqual(DT.computeTimingBias(), 20);
});

test("updateDynamicOffset adjusts toward correcting bias", function() {
  DT.resetDynamic();
  for (var i = 0; i < 10; i++) DT.recordDelta(30); // consistently late
  var offset = DT.updateDynamicOffset();
  assert.ok(offset < 0, "offset should be negative to correct late bias: " + offset);
});

test("dynamic offset clamped to +-40", function() {
  DT.resetDynamic();
  for (var i = 0; i < 20; i++) DT.recordDelta(500);
  for (var j = 0; j < 50; j++) DT.updateDynamicOffset();
  assert.ok(DT.getDynamicOffset() >= -40);
});

test("createProfile returns defaults", function() {
  var p = DT.createProfile();
  assert.strictEqual(p.preferredOffset, -15);
  assert.strictEqual(p.timingBias, "neutral");
  assert.strictEqual(p.preset, "arcade");
});

test("updateProfile classifies late bias", function() {
  DT.resetDynamic();
  for (var i = 0; i < 10; i++) DT.recordDelta(25);
  var p = DT.createProfile();
  DT.updateProfile(p);
  assert.strictEqual(p.timingBias, "late");
});

test("updateProfile classifies early bias", function() {
  DT.resetDynamic();
  for (var i = 0; i < 10; i++) DT.recordDelta(-25);
  var p = DT.createProfile();
  DT.updateProfile(p);
  assert.strictEqual(p.timingBias, "early");
});

test("getPreset returns arcade by default", function() {
  var p = DT.getPreset("arcade");
  assert.strictEqual(p.perfect, 25);
  assert.strictEqual(p.good, 60);
});

test("getPreset returns training", function() {
  var p = DT.getPreset("training");
  assert.strictEqual(p.perfect, 40);
  assert.strictEqual(p.good, 90);
});

test("applyPreset modifies SparkFeelSystem", function() {
  DT.applyPreset("training");
  assert.strictEqual(window.SparkFeelSystem.input.PERFECT_WINDOW, 40);
  assert.strictEqual(window.SparkFeelSystem.input.GOOD_WINDOW, 90);
  // Reset
  DT.applyPreset("arcade");
});

test("getPresetList returns array", function() {
  var list = DT.getPresetList();
  assert.ok(list.length >= 2);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
