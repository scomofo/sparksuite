var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


function test(name, fn) {
  try {
    resetEnv();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function resetEnv() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.S = {
    performanceDailyHistory: []
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return { runtimeState: {} };
    }
  };
  global.getPerformanceTotals = function() {
    return { runs: 0, songsPlayed: 0, masteredSongs: 0, avgAccuracy: 0, totalStars: 0 };
  };
  global.getPerformanceRecentRuns = function() { return []; };
  global.getPerformanceTopSongs = function() { return []; };
  global.getPerformanceWeakSongs = function() { return []; };
  global.getMasteryColor = function() { return "#fff"; };
}

console.log("\n--- Performance Stats Page Resolution ---");

test("performanceStatsPage ignores sentinel focus and song labels", function() {
  global.sparkCore.getActiveSessionView = function() {
    return { runtimeState: { performanceStatsFocus: "undefined" } };
  };
  global.getPerformanceRecentRuns = function() {
    return [
      {
        songId: "undefined",
        arrangement: "null",
        difficulty: "NaN",
        mastery: "none",
        bestAccuracy: 75,
        bestStars: 2
      }
    ];
  };
  global.S.performanceDailyHistory = [
    { date: "undefined", type: "null", xp: 10 }
  ];

  loadVM("js/pages/performance_stats.js");

  var html = performanceStatsPage();
  assert.ok(html.indexOf(">overview<") >= 0 || html.indexOf(">overview</button>") >= 0);
  assert.ok(html.indexOf("song") >= 0);
  assert.ok(html.indexOf("chords / normal") >= 0);
  assert.ok(html.indexOf("unknown date") >= 0);
  assert.ok(html.indexOf("challenge +10XP") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
  assert.strictEqual(html.indexOf("null"), -1);
  assert.strictEqual(html.indexOf("NaN"), -1);
});

test("performanceStatsPage can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return { runtimeState: { performanceStatsFocus: "top" } };
    }
  };
  global.getPerformanceTopSongs = function() {
    return [
      { songId: "Night Drive", bestScore: 4200 }
    ];
  };

  loadVM("js/pages/performance_stats.js");

  var html = performanceStatsPage();
  assert.ok(html.indexOf(">top<") >= 0 || html.indexOf(">top</button>") >= 0);
  assert.ok(html.indexOf("Night Drive") >= 0);
  assert.ok(html.indexOf("4200 pts") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
