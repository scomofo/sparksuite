var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    mastery: {
      chords: {},
      rhythm: {},
      transitions: {},
      songs: {}
    },
    unlocks: {}
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.saveState = function() {};
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Progression State Fallbacks ---");

async function run() {
  await test("mastery helpers can update and read plain global S", function() {
    eval(loadJS("js/progression/mastery.js"));

    updateMasteryFromPerformance({
      chords: { C: 0.9, G: 0.8 },
      transitions: { "C_G": 0.75 },
      rhythm: { strum: 0.7 },
      songId: "song_one",
      accuracy: 0.85
    });

    assert.ok(S.mastery.chords.C > 0);
    assert.ok(S.mastery.transitions.C_G > 0);
    assert.strictEqual(getMastery("songs", "song_one"), 0.85);
    assert.ok(getAverageMastery("chords") > 0.8);
  });

  await test("unlock helpers can mutate and evaluate plain global S", function() {
    eval(loadJS("js/progression/mastery.js"));
    eval(loadJS("js/progression/unlocks.js"));

    unlockContent("lessons", "lesson_one");
    S.mastery.chords.C = 0.8;
    S.mastery.chords.G = 0.8;
    S.mastery.rhythm.strum = 0.7;
    S.mastery.transitions.C_G = 0.8;
    S.mastery.songs.song_one = 0.8;

    evaluateUnlocks();

    assert.strictEqual(isUnlocked("lessons", "lesson_one"), true);
    assert.strictEqual(isUnlocked("chords", "F"), true);
    assert.strictEqual(isUnlocked("lessons", "strumming_1"), true);
    assert.strictEqual(isUnlocked("lessons", "transitions_2"), true);
    assert.strictEqual(isUnlocked("songs", "song_2"), true);
  });

  await test("progression tree can build and recommend lessons from plain global S", function() {
    eval(loadJS("js/progression/unlocks.js"));
    eval(loadJS("js/progression/tree.js"));

    buildProgressionTree();
    unlockContent("lessons", "lesson1");

    assert.ok(S.progressionTree);
    assert.strictEqual(getNextRecommendedLesson(), "lesson2");
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
