// ===== Practice Intelligence Tests =====
// Run: node tests/test_practice_intelligence.js
//
// Behavioral coverage for js/sparksuite/core/practice_intelligence.js —
// the adaptive engine that turns gameplay results into simplify/challenge/
// focus recommendations, practice modes, speed, and difficulty steps.

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  var full = path.join(__dirname, "..", file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

global.window = global;
loadJS("js/sparksuite/core/practice_intelligence.js");

var pi = new SparkPracticeIntelligence();

console.log("=== Practice Intelligence Tests ===");

test("low accuracy is struggling and recommends simplify", function() {
  var analysis = pi.analyze({ accuracy: 0.5 });
  assert.strictEqual(analysis.struggling, true);
  assert.strictEqual(analysis.strong, false);
  assert.strictEqual(analysis.recommendation, "simplify");
});

test("high accuracy is strong and recommends challenge", function() {
  var analysis = pi.analyze({ accuracy: 0.9 });
  assert.strictEqual(analysis.strong, true);
  assert.strictEqual(analysis.struggling, false);
  assert.strictEqual(analysis.recommendation, "challenge");
});

test("mid accuracy with no weak lanes recommends continue", function() {
  var analysis = pi.analyze({ accuracy: 0.7 });
  assert.strictEqual(analysis.recommendation, "continue");
  assert.deepStrictEqual(analysis.adaptations, []);
});

test("weak lanes need more than 2 errors and trigger focus", function() {
  var analysis = pi.analyze({
    accuracy: 0.7,
    mistakes: { laneErrors: { "0": 3, "1": 2, "2": 5 } }
  });
  assert.deepStrictEqual(analysis.weakLanes, [0, 2]);
  assert.strictEqual(analysis.recommendation, "focus");
  assert.deepStrictEqual(analysis.adaptations, [{ type: "focus_lanes", lanes: [0, 2] }]);
});

test("struggling takes precedence over weak lanes", function() {
  var analysis = pi.analyze({
    accuracy: 0.3,
    mistakes: { laneErrors: { "1": 8 } }
  });
  assert.strictEqual(analysis.recommendation, "simplify");
});

test("results nested under gameplay are unwrapped", function() {
  var analysis = pi.analyze({ gameplay: { accuracy: 0.95 } });
  assert.strictEqual(analysis.strong, true);
  assert.strictEqual(analysis.accuracy, 0.95);
});

test("simplify adaptations reduce density and slow tempo", function() {
  var analysis = pi.analyze({ accuracy: 0.2 });
  assert.deepStrictEqual(analysis.adaptations, [
    { type: "reduce_density", factor: 0.5 },
    { type: "slow_tempo", factor: 0.75 }
  ]);
});

test("challenge adaptations increase density", function() {
  var analysis = pi.analyze({ accuracy: 0.99 });
  assert.deepStrictEqual(analysis.adaptations, [{ type: "increase_density", factor: 1.5 }]);
});

test("empty results are treated as struggling, not a crash", function() {
  var analysis = pi.analyze();
  assert.strictEqual(analysis.struggling, true);
  assert.strictEqual(analysis.accuracy, 0);
});

test("suggestMode maps analysis states to practice modes", function() {
  assert.strictEqual(pi.suggestMode(null), "NORMAL");
  assert.strictEqual(pi.suggestMode({ struggling: true }), "SLOW_MODE");
  assert.strictEqual(pi.suggestMode({ weakLanes: [2] }), "FOCUS_MODE");
  assert.strictEqual(pi.suggestMode({ strong: true, weakLanes: [] }), "NORMAL");
  assert.strictEqual(pi.suggestMode({ weakLanes: [] }), "LOOP_SECTION");
});

test("suggestSpeed steps down with accuracy", function() {
  assert.strictEqual(pi.suggestSpeed(null), 1.0);
  assert.strictEqual(pi.suggestSpeed({ accuracy: 0.3 }), 0.5);
  assert.strictEqual(pi.suggestSpeed({ accuracy: 0.5 }), 0.75);
  assert.strictEqual(pi.suggestSpeed({ accuracy: 0.7 }), 0.9);
  assert.strictEqual(pi.suggestSpeed({ accuracy: 0.95 }), 1.0);
});

test("suggestDifficulty steps toward the player's level", function() {
  assert.strictEqual(pi.suggestDifficulty("hard", { struggling: true }), "easy");
  assert.strictEqual(pi.suggestDifficulty("easy", { struggling: true }), "easy");
  assert.strictEqual(pi.suggestDifficulty("easy", { strong: true }), "normal");
  assert.strictEqual(pi.suggestDifficulty("normal", { strong: true }), "hard");
  assert.strictEqual(pi.suggestDifficulty("hard", { strong: true }), "hard");
  assert.strictEqual(pi.suggestDifficulty("normal", {}), "normal");
  assert.strictEqual(pi.suggestDifficulty("normal", null), "normal");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
