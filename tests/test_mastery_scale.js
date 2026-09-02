/*
 * Mastery is a 0-100 percentage everywhere: one writer
 * (ProgressEngine.blendCategoryMastery), one normalizer
 * (ProgressEngine.toMasteryPercent), and readers that compare against
 * percentages. Before this was settled, progress_orchestrator step 5 probed
 * for a bare `updateMastery` global that never existed, so chord and song
 * mastery were never written at all.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

global.window = global;
global.saveState = function() {};
global.S = { mastery: {}, unlocks: {} };

loadJS("js/utils/mastery.js");
loadJS("js/sparksuite/core/progress_engine.js");
loadJS("js/progression/mastery.js");
loadJS("js/progression/unlocks.js");

var Engine = global.SparkSuiteProgressEngine;
var passed = 0;

function test(name, fn) {
  try {
    fn();
    console.log("  PASS " + name);
    passed++;
  } catch (e) {
    console.error("  FAIL " + name + ": " + (e && e.message));
    process.exitCode = 1;
  }
}

function resetMastery() {
  S.mastery = {};
  S.unlocks = {};
  S.masteryScaleVersion = 1;
}

// --- toMasteryPercent accepts either accuracy convention ------------------

test("fractions scale up to percent", function() {
  assert.strictEqual(Engine.toMasteryPercent(0.8), 80);
  assert.strictEqual(Engine.toMasteryPercent(0.955), 95.5);
});

test("percentages pass through unchanged", function() {
  assert.strictEqual(Engine.toMasteryPercent(80), 80);
  assert.strictEqual(Engine.toMasteryPercent(100), 100);
});

test("1 resolves to a perfect score, not 1%", function() {
  assert.strictEqual(Engine.toMasteryPercent(1), 100);
});

test("out-of-range and non-numeric inputs are clamped", function() {
  assert.strictEqual(Engine.toMasteryPercent(150), 100);
  assert.strictEqual(Engine.toMasteryPercent(-5), 0);
  assert.strictEqual(Engine.toMasteryPercent(NaN), 0);
  assert.strictEqual(Engine.toMasteryPercent(undefined), 0);
});

// --- blendCategoryMastery writes 0-100 and blends 0.75/0.25 ---------------

test("a first result seeds mastery at the full percent value", function() {
  resetMastery();
  assert.strictEqual(Engine.blendCategoryMastery("chords", "C", 0.8), 80);
  assert.strictEqual(SparkMastery.get("chords", "C"), 80);
});

test("later results blend at 0.75/0.25, matching smoothMastery", function() {
  resetMastery();
  Engine.blendCategoryMastery("chords", "C", 1);       // -> 100
  var next = Engine.blendCategoryMastery("chords", "C", 0.6); // 100*.75 + 60*.25
  assert.strictEqual(next, 90);
});

test("both accuracy conventions produce the same stored value", function() {
  resetMastery();
  var asFraction = Engine.blendCategoryMastery("songs", "s1", 0.42);
  resetMastery();
  var asPercent = Engine.blendCategoryMastery("songs", "s1", 42);
  assert.strictEqual(asFraction, asPercent);
});

test("a missing category or skill is a no-op, not a throw", function() {
  resetMastery();
  assert.strictEqual(Engine.blendCategoryMastery(null, "C", 1), null);
  assert.strictEqual(Engine.blendCategoryMastery("chords", null, 1), null);
});

// --- readers agree with the writer ---------------------------------------

test("stored percentages render without further scaling", function() {
  resetMastery();
  Engine.blendCategoryMastery("chords", "C", 0.9);
  assert.strictEqual(getMastery("chords", "C"), 90);
  assert.strictEqual(getAverageMastery("chords"), 90);
});

test("unlock rules fire on percent thresholds, not fractions", function() {
  resetMastery();
  // 60% is below the >70 gate for the F chord.
  Engine.blendCategoryMastery("chords", "C", 0.6);
  Engine.blendCategoryMastery("chords", "G", 0.6);
  evaluateUnlocks();
  assert.ok(!(S.unlocks.chords && S.unlocks.chords.F), "F must stay locked at 60%");

  // Push both above 70 and it unlocks.
  Engine.blendCategoryMastery("chords", "C", 1);
  Engine.blendCategoryMastery("chords", "C", 1);
  Engine.blendCategoryMastery("chords", "G", 1);
  Engine.blendCategoryMastery("chords", "G", 1);
  evaluateUnlocks();
  assert.ok(S.unlocks.chords && S.unlocks.chords.F, "F unlocks once both pass 70%");
});

test("a weak session cannot unlock the F chord", function() {
  // The regression the scale decision exists to prevent. The orchestrator
  // writes percentages; against the old fraction gates (`> 0.7`) any session
  // above ~1% accuracy cleared them, so a 10% attempt unlocked the F chord.
  // On the percent gate it correctly stays locked.
  resetMastery();
  Engine.blendCategoryMastery("chords", "C", 0.1);
  Engine.blendCategoryMastery("chords", "G", 0.1);
  assert.strictEqual(getMastery("chords", "C"), 10, "10% accuracy stores as 10, which beats the old 0.7 gate");
  evaluateUnlocks();
  assert.ok(!(S.unlocks.chords && S.unlocks.chords.F), "10% must not unlock the F chord");
});

// --- legacy saves are rescaled exactly once ------------------------------

test("legacy 0-1 values are migrated up to percent", function() {
  S.mastery = { guitar: { chords: { C: 0.8, G: 1 }, rhythm: { r1: 55 } } };
  delete S.masteryScaleVersion;
  SparkMastery.ensureShape();
  assert.strictEqual(S.mastery.guitar.chords.C, 80, "0.8 -> 80");
  assert.strictEqual(S.mastery.guitar.chords.G, 100, "1 -> 100");
  assert.strictEqual(S.mastery.guitar.rhythm.r1, 55, "already-percent values are left alone");
  assert.strictEqual(S.masteryScaleVersion, 1);
});

test("migration never runs twice", function() {
  S.mastery = { guitar: { chords: { C: 0.8 } } };
  delete S.masteryScaleVersion;
  SparkMastery.ensureShape();
  SparkMastery.ensureShape();
  SparkMastery.ensureShape();
  assert.strictEqual(S.mastery.guitar.chords.C, 80, "80, not 800000");
});

test("zero stays zero through migration", function() {
  S.mastery = { guitar: { chords: { C: 0 } } };
  delete S.masteryScaleVersion;
  SparkMastery.ensureShape();
  assert.strictEqual(S.mastery.guitar.chords.C, 0);
});

console.log("PASS: mastery scale is 0-100 end to end (" + passed + " checks)");
