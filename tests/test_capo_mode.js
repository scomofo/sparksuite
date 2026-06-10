var assert = require("assert");

var SparkCapoMode = require("../js/sparksuite/core/capo_mode.js");

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

console.log("\n--- Capo Mode ---");

test("keeps the original chord while displaying the capo-adjusted shape", function() {
  var chord = SparkCapoMode.getDisplayChord("A", 2);
  assert.strictEqual(chord.original, "A");
  assert.strictEqual(chord.display, "G");
  assert.strictEqual(chord.capoFret, 2);
  assert.strictEqual(chord.sounding, "A");
  assert.strictEqual(chord.label, "G (sounds A)");
});

test("preserves chord quality while calculating capo shapes", function() {
  assert.strictEqual(SparkCapoMode.getDisplayChord("F#m", 2).display, "Em");
  assert.strictEqual(SparkCapoMode.getDisplayChord("Bbmaj7", 3).display, "Gmaj7");
  assert.strictEqual(SparkCapoMode.getDisplayChord("D/F#", 2).display, "C/E");
});

test("normalizes capo frets and leaves unknown chords readable", function() {
  assert.strictEqual(SparkCapoMode.normalizeCapoFret(-2), 0);
  assert.strictEqual(SparkCapoMode.normalizeCapoFret(19), 12);
  assert.strictEqual(SparkCapoMode.getDisplayChord("N.C.", 4).display, "N.C.");
});

test("maps whole progressions without mutating the input", function() {
  var progression = ["A", "E", "F#m", "D"];
  var mapped = SparkCapoMode.mapProgression(progression, 2);
  assert.deepStrictEqual(progression, ["A", "E", "F#m", "D"]);
  assert.deepStrictEqual(mapped.map(function(chord) { return chord.display; }), ["G", "D", "Em", "C"]);
});

if (failed > 0) {
  console.error("\n" + passed + " passed, " + failed + " failed");
  process.exit(1);
}

console.log("\n" + passed + " passed, " + failed + " failed");
