var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
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
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    mastery: {
      chords: {},
      rhythm: {}
    },
    insightSnapshots: []
  };
  global.__sparkState = global.S;
  delete global.sparkCore;
}

resetState();
eval(loadJS("js/insights/mastery.js"));

console.log("\n--- Insights Mastery ---");

test("mastery helpers can read sparkCore progress snapshot", function() {
  global.window.sparkCore = {
    getLegacyProgressSnapshot: function() {
      return {
        mastery: {
          chords: { C: 22, G: 91 },
          rhythm: { strum: 48 }
        }
      };
    }
  };

  var weakest = getWeakestMasterySkills(2);
  var strongest = getStrongestMasterySkills(1);

  assert.strictEqual(weakest.length, 2);
  assert.strictEqual(weakest[0].bucket, "chords");
  assert.strictEqual(weakest[0].id, "C");
  assert.strictEqual(weakest[0].value, 22);
  assert.strictEqual(strongest[0].id, "G");
  assert.strictEqual(strongest[0].value, 91);
});

test("mastery trend still reads legacy insight snapshots", function() {
  S.insightSnapshots = [{
    ts: 1,
    mastery: { chords: 10, transitions: 20, rhythm: 30, songs: 40 }
  }, {
    ts: 2,
    mastery: { chords: 15, transitions: 25, rhythm: 35, songs: 45 }
  }];

  var trend = buildMasteryTrend();

  assert.deepStrictEqual(trend.chords, [{ ts: 1, value: 10 }, { ts: 2, value: 15 }]);
  assert.deepStrictEqual(trend.rhythm, [{ ts: 1, value: 30 }, { ts: 2, value: 35 }]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
