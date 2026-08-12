// ===== Song Readiness Tests =====
// Run: node tests/test_song_readiness.js
//
// The song unlock gate is engine-owned: SparkCurriculumService.getSongReadiness
// decides whether a song (or strum pattern) is unlocked and reports the
// learner's chord gaps. js/pages/songs.js consumes the decision and keeps its
// old inline `song.level > S.level` check only as a no-service fallback.

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (e) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + e.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

global.window = global;
global.S = { level: 3, chordProgress: { A: 100, D: 100, E: 40 } };
loadVM("js/curriculum/curriculum_engine.js");

console.log("\n--- Song Readiness ---");

test("unlock rule matches the legacy level gate", function() {
  assert.strictEqual(SparkCurriculumService.getSongReadiness({ level: 3, chords: [] }).unlocked, true);
  assert.strictEqual(SparkCurriculumService.getSongReadiness({ level: 4, chords: [] }).unlocked, false);
  assert.strictEqual(SparkCurriculumService.getSongReadiness({ level: 1 }).unlocked, true, "chordless shapes (strum patterns) work");
});

test("chord gaps report unmastered chords from learner state", function() {
  var readiness = SparkCurriculumService.getSongReadiness({ level: 2, chords: ["A", "D", "E", "G"] });
  assert.deepStrictEqual(readiness.chordsToLearn, ["E", "G"], "E at 40 and unseen G are gaps; mastered A/D are not");
  assert.strictEqual(readiness.requiredLevel, 2);
  assert.strictEqual(readiness.playerLevel, 3);
});

test("userContext overrides global state for headless use", function() {
  var readiness = SparkCurriculumService.getSongReadiness(
    { level: 5, chords: ["C"] },
    { playerLevel: 6, chordProgress: { C: 100 } }
  );
  assert.strictEqual(readiness.unlocked, true);
  assert.deepStrictEqual(readiness.chordsToLearn, []);
});

test("songs page consults the engine gate and keeps only a fallback inline check", function() {
  var source = loadJS("js/pages/songs.js");
  assert.ok(source.indexOf("SparkCurriculumService.getSongReadiness(s)") >= 0, "song list must ask the engine");
  assert.ok(source.indexOf("SparkCurriculumService.getSongReadiness(sp)") >= 0, "strum list must ask the engine");
  var inlineChecks = (source.match(/sp?\.level\s*>\s*S\.level/g) || []).length;
  assert.strictEqual(inlineChecks, 2, "exactly one fallback inline check per list, no primary inline gating");
});

console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
