var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js");

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

console.log("\n--- Ukulele Chord Choreography ---");

test("ukulele chord-switching skill exposes no-look chord choreography drills", function() {
  var exercises = SparkUkuleleModule.getExercises("uke_chord_switching");
  var choreography = exercises.filter(function(exercise) {
    return exercise && exercise.choreography;
  });

  assert.ok(choreography.length >= 2, "expected multiple chord choreography drills");
  assert.ok(choreography.some(function(exercise) {
    return exercise.id === "ex_uke_chord_choreography_blind_01";
  }), "missing blind switch choreography drill");

  choreography.forEach(function(exercise) {
    assert.strictEqual(exercise.type, "transition");
    assert.strictEqual(exercise.choreography.noLook, true);
    assert.strictEqual(exercise.choreography.reversePath, true);
    assert.ok(Array.isArray(exercise.choreography.chordPath));
    assert.ok(exercise.choreography.chordPath.length >= 2);
    assert.ok(exercise.tags.indexOf("chord_choreography") >= 0);
  });
});

test("ukulele module can expose its full exercise list without selector input", function() {
  var all = SparkUkuleleModule.getExercises();
  var ids = all.map(function(exercise) { return exercise.id; });
  var unique = {};

  ids.forEach(function(id) {
    assert.ok(!unique[id], "duplicate exercise id " + id);
    unique[id] = true;
  });

  assert.ok(ids.indexOf("ex_uke_chord_choreography_blind_01") >= 0);
  assert.ok(ids.length >= 30);
});

if (failed > 0) {
  console.error("\n" + passed + " passed, " + failed + " failed");
  process.exit(1);
}

console.log("\n" + passed + " passed, " + failed + " failed");
