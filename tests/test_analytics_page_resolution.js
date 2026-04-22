var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
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
  global.buildAnalyticsSummary = function() { return null; };
}

console.log("\n--- Analytics Page Resolution ---");

test("analyticsPage ignores sentinel recommendation labels and reasons", function() {
  global.buildAnalyticsSummary = function() {
    return {
      weakestTransitions: [
        { label: "undefined", avgMs: 180 }
      ],
      weakestSongs: [
        { label: "null", accuracy: 42 }
      ],
      weakestPhrases: [
        { label: "NaN", accuracy: 55 }
      ],
      strongestSkills: [],
      recentImprovement: [],
      practiceConsistency: {},
      recommendations: [
        { label: "undefined", reason: "null" }
      ]
    };
  };

  global.eval(loadJS("js/pages/analytics.js"));

  var html = analyticsPage();
  assert.ok(html.indexOf("Transition") >= 0);
  assert.ok(html.indexOf("Song") >= 0);
  assert.ok(html.indexOf("Phrase") >= 0);
  assert.ok(html.indexOf("Recommendation") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
  assert.strictEqual(html.indexOf("null"), -1);
  assert.strictEqual(html.indexOf("NaN"), -1);
});

test("analyticsPage ignores malformed numeric metrics", function() {
  global.buildAnalyticsSummary = function() {
    return {
      weakestTransitions: [
        { label: "Slow change", avgMs: "NaN" }
      ],
      weakestSongs: [
        { label: "Song A", accuracy: "NaN" }
      ],
      weakestPhrases: [
        { label: "Phrase A", accuracy: { broken: true } }
      ],
      strongestSkills: [],
      recentImprovement: [],
      practiceConsistency: {
        streak: "NaN",
        sessions: { broken: true },
        historyCount: []
      },
      recommendations: []
    };
  };

  global.eval(loadJS("js/pages/analytics.js"));

  var html = analyticsPage();
  assert.strictEqual(html.indexOf("NaN"), -1);
  assert.ok(html.indexOf("0 ms") >= 0);
  assert.ok(html.indexOf("0%") >= 0);
  assert.ok(html.indexOf("Streak: 0") >= 0);
  assert.ok(html.indexOf("Sessions: 0") >= 0);
  assert.ok(html.indexOf("History Entries: 0") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
