var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
require("../js/sparksuite/core/flow_engine.js");
var Flow = window.SparkFlowEngine;

console.log("=== Flow Engine Tests ===");

test("detectEmotion returns frustrated on high miss streak", function() {
  assert.strictEqual(Flow.detectEmotion({ missStreak: 10, accuracy: 0.3, combo: 0 }), "frustrated");
});

test("detectEmotion returns bored on high accuracy + combo", function() {
  assert.strictEqual(Flow.detectEmotion({ missStreak: 0, accuracy: 0.97, combo: 35 }), "bored");
});

test("detectEmotion returns struggling on low accuracy", function() {
  assert.strictEqual(Flow.detectEmotion({ missStreak: 3, accuracy: 0.5, combo: 2 }), "struggling");
});

test("detectEmotion returns engaged for normal play", function() {
  assert.strictEqual(Flow.detectEmotion({ missStreak: 1, accuracy: 0.75, combo: 8 }), "engaged");
});

test("adjustDifficulty returns increase when skilled", function() {
  assert.strictEqual(Flow.adjustDifficulty({ accuracy: 0.95, timingConsistency: 0.9, missStreak: 0 }), "increase");
});

test("adjustDifficulty returns decrease when struggling", function() {
  assert.strictEqual(Flow.adjustDifficulty({ accuracy: 0.5, timingConsistency: 0.4, missStreak: 6 }), "decrease");
});

test("adjustDifficulty returns maintain for average", function() {
  assert.strictEqual(Flow.adjustDifficulty({ accuracy: 0.75, timingConsistency: 0.7, missStreak: 2 }), "maintain");
});

test("flowController reduces difficulty when frustrated", function() {
  var result = Flow.flowController({ accuracy: 0.3, combo: 0, missStreak: 10, timingConsistency: 0.3, retryCount: 0 });
  assert.strictEqual(result.action, "reduce_difficulty");
  assert.strictEqual(result.tempoMultiplier, 0.9);
});

test("flowController increases difficulty when bored", function() {
  var result = Flow.flowController({ accuracy: 0.97, combo: 35, missStreak: 0, timingConsistency: 0.95, retryCount: 0 });
  assert.strictEqual(result.action, "increase_difficulty");
  assert.strictEqual(result.tempoMultiplier, 1.05);
});

test("getEncouragement returns text for frustrated", function() {
  assert.strictEqual(Flow.getEncouragement({ emotion: "frustrated" }), "Take your time.");
});

test("getEncouragement returns empty for engaged", function() {
  assert.strictEqual(Flow.getEncouragement({ emotion: "engaged" }), "");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
