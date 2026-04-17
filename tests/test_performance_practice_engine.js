var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.SparkSessionTypes = {
    FLOW_DAILY_PRACTICE: "daily_practice"
  };
  global.S = {
    transitionStats: {
      "C->G": { attempts: 10, success: 4 },
      "Am|F": { attempts: 8, success: 3 },
      "D→A": { attempts: 6, success: 2 }
    },
    chordProgress: { C: 90, G: 55 },
    performanceStats: {
      song_a: { runs: 3, bestAccuracy: 72, songId: "island_strum", arrangement: "chords", difficulty: "normal" }
    }
  };
  global.ensurePracticePlan = undefined;
  global.sparkCore = undefined;
  global.saveState = function() {};
}

function test(name, fn) {
  try {
    resetState();
    global.eval(loadJS("js/performance/practice_engine.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Performance Practice Engine ---");

test("getWeakTransitions parses legacy and normalized transition delimiters", function() {
  var weak = getWeakTransitions();
  var keys = weak.map(function(row) { return row.from + "|" + row.to; });

  assert.ok(keys.indexOf("C|G") >= 0);
  assert.ok(keys.indexOf("Am|F") >= 0);
  assert.ok(keys.indexOf("D|A") >= 0);
});

test("generatePracticePlan stores transition and song launch data inside item meta", function() {
  var plan = generatePracticePlan();
  var transition = null;
  var chordPractice = null;
  var performanceSong = null;
  for (var i = 0; i < plan.items.length; i++) {
    if (!transition && plan.items[i].type === "transition") transition = plan.items[i];
    if (!chordPractice && plan.items[i].type === "chord_practice") chordPractice = plan.items[i];
    if (!performanceSong && plan.items[i].type === "performance_song") performanceSong = plan.items[i];
  }

  assert.ok(transition);
  assert.deepStrictEqual(transition.meta, {
    from: transition.label.split(" -> ")[0],
    to: transition.label.split(" -> ")[1],
    key: transition.label.split(" -> ")[0] + "|" + transition.label.split(" -> ")[1]
  });

  assert.ok(chordPractice);
  assert.deepStrictEqual(chordPractice.meta, {
    chordName: "G"
  });

  assert.ok(performanceSong);
  assert.deepStrictEqual(performanceSong.meta, {
    songId: "island_strum",
    arrangementType: "chords",
    difficultyId: "normal"
  });
});

if (process.exitCode) process.exit(process.exitCode);
