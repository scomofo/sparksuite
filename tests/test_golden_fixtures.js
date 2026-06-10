var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
global.window = global;

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

require("../js/sparksuite/domain/session.js");

var guitarSession = loadJson("fixtures/sessions/guitar_beginner_open_chords.json");
var ukeSession = loadJson("fixtures/sessions/ukulele_beginner_down_strum.json");
var perfectRun = loadJson("fixtures/results/perfect_run.json");
var badTimingRun = loadJson("fixtures/results/bad_timing_run.json");
var missedNotesRun = loadJson("fixtures/results/missed_notes_run.json");
var newUser = loadJson("fixtures/profiles/new_user.json");
var intermediateUser = loadJson("fixtures/profiles/intermediate_guitar_user.json");

assert.doesNotThrow(function() {
  assertSessionPlan(guitarSession);
});
assert.doesNotThrow(function() {
  assertSessionPlan(ukeSession);
});
assert.strictEqual(guitarSession.segments[0].exerciseIds[0], guitarSession.exercises[0].id);
assert.strictEqual(ukeSession.instrumentType, "ukulele");

assert.strictEqual(perfectRun.accuracy, 1);
assert.ok(badTimingRun.timing.late > 0 || badTimingRun.timing.early > 0);
assert.strictEqual(missedNotesRun.total, 48);
assert.strictEqual(missedNotesRun.hits + missedNotesRun.misses, missedNotesRun.total);

assert.strictEqual(newUser.schemaVersion, 3);
assert.strictEqual(intermediateUser.selectedInstrument, "guitar");
assert.ok(intermediateUser.mastery["gtr-d01"].mastery > 0.8);

console.log("PASS: golden fixtures exist and validate against session, results, and profile contracts");
