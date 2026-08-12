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
  global.buildAnalyticsSummary = function() { return null; };
  global.S = {
    transitionStats: {},
    performanceStats: {},
    history: [],
    streak: 0,
    sessions: 0
  };
  delete global.createAnalyticsSummaryShell;
  delete global.selectWeakTransitionCandidate;
  delete global.selectWeakPerformanceCandidate;
  delete global.selectRhythmCandidate;
  delete global.selectFingerCandidate;
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

  loadVM("js/pages/analytics.js");

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

  loadVM("js/pages/analytics.js");

  var html = analyticsPage();
  assert.strictEqual(html.indexOf("NaN"), -1);
  assert.ok(html.indexOf("0 ms") >= 0);
  assert.ok(html.indexOf("0%") >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Streak:</span> <span class="metric-value" style="font-size:13px">0</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Sessions:</span> <span class="metric-value" style="font-size:13px">0</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">History Entries:</span> <span class="metric-value" style="font-size:13px">0</span>') >= 0);
});

test("analyticsPage uses shared visual contract classes", function() {
  global.buildAnalyticsSummary = function() {
    return {
      weakestTransitions: [],
      weakestSongs: [],
      weakestPhrases: [],
      strongestSkills: [{ label: "Timing", value: "Good" }],
      recentImprovement: [{ label: "Accuracy", value: "+4%" }],
      practiceConsistency: { streak: 2, sessions: 3, historyCount: 4 },
      recommendations: [{ label: "Song A", reason: "Keep momentum" }]
    };
  };

  loadVM("js/pages/analytics.js");

  var html = analyticsPage();
  assert.strictEqual(html.indexOf("<b>"), -1);
  assert.ok(html.indexOf('class="card-section-heading mb8"') >= 0);
  assert.ok(html.indexOf('class="card-micro-heading"') >= 0);
  assert.ok(html.indexOf('class="metric-label"') >= 0);
  assert.ok(html.indexOf('class="metric-value"') >= 0);
});

test("analyticsPage renders an empty state when summary builder is not loaded", function() {
  delete global.buildAnalyticsSummary;
  loadVM("js/pages/analytics.js");

  var html = analyticsPage();

  assert.ok(html.indexOf("No analytics available yet.") >= 0);
});

test("analytics engine tolerates missing optional recommendation helpers", function() {
  loadVM("js/analytics/engine.js");

  var summary = buildAnalyticsSummary();

  assert.ok(summary);
  assert.deepStrictEqual(summary.recommendations, []);
  assert.deepStrictEqual(summary.weakestTransitions, []);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
