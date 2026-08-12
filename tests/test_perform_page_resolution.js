var assert = require("assert");
var fs = require("fs");
var path = require("path");

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
_testEval(loadJS("js/sparksuite/core/psychology_engine.js"));
_testEval(loadJS("js/sparksuite/core/progress_engine.js"));


function resetEnv() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.render = function() {};
  global.saveState = function() {};
  global.renderPerformanceHighway = function() { return "<div>highway</div>"; };
  global.getPerformancePhraseForTime = function() { return { name: "undefined" }; };
  global.getNextPerformEvent = function() { return null; };
  global.getImportedTechniquePreview = function() { return [{ label: "undefined", color: "#fff" }]; };
  global.hasImportedTechniqueFlags = function() { return false; };
  global.renderImportedTechniqueFlags = function() { return ""; };
  global.getPerformancePracticePresetStemLabel = function() { return "Guitar"; };
  global.getPerformanceStats = function() {
    return { mastery: "none", runs: 0, bestScore: 0, bestAccuracy: 0, bestStars: 0 };
  };
  global.getMasteryColor = function() { return "#fff"; };
  global.getMasteryIcon = function() { return "*"; };
  global.hasImportedTechniqueResultData = function() { return false; };
  global.getTechniqueSummaryRow = function() { return null; };
  global.buildPerformanceRecommendationsForSong = function() {
    return [{ label: "undefined", reason: "null" }];
  };
  global.S = {
    performChart: {
      id: "chart_1",
      title: "undefined",
      artist: "null",
      arrangementType: "chords",
      phrases: [],
      events: []
    },
    performScore: 100,
    performAccuracy: 95,
    performCombo: 3,
    performLastHitLabel: "undefined",
    performLastHitTime: Date.now(),
    performCountdownActive: false,
    performCountdownBeats: 0,
    performInputSource: "midi",
    performInputNotes: [],
    performDebug: false,
    performLoop: { phraseId: 2, startSec: 0, endSec: 4 },
    performMode: "midi",
    performDifficulty: "normal",
    performSpeed: 1,
    performPracticePreset: "full_mix",
    performPaused: false,
    performCurrentSec: 0,
    performTargetTechnique: null,
    performResults: {
      title: "undefined",
      artist: "null",
      stars: 3,
      totalEvents: 10,
      score: 1000,
      accuracy: 90,
      maxCombo: 4,
      phraseStats: [
        { name: "undefined", total: 2, scoreSum: 2, perfects: 1, goods: 1, oks: 0, misses: 0 },
        { name: "null", total: 2, scoreSum: 0, perfects: 0, goods: 0, oks: 0, misses: 2 }
      ],
      importedTechniqueSummary: {
        open: { label: "undefined", hits: 1, total: 2, accuracy: 50 }
      },
      unlocks: [{ label: "null", xp: 25 }]
    },
    performChartId: "chart_1",
    performSongStats: {},
    performMidiOffsetMs: 0,
    performAudioOffsetMs: 0,
    _calibrating: false
  };
  global.S.performChart.phrases = [{ id: 2, name: "undefined" }];
  global.sparkCore = {
    progressEngine: new SparkSuiteProgressEngine(null, new SparkSuitePsychologyEngine()),
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceResults: S.performResults,
          performanceChartId: "chart_1",
          performanceTargetTechnique: null,
          transport: { positionMs: 0, status: "running" }
        }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnv();
    loadVM("js/pages/perform.js");
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Perform Page Resolution ---");

test("perform pages ignore stale chart and result text tokens", function() {
  var activeHtml = performPage();
  var doneHtml = performDonePage();
  assert.ok(activeHtml.indexOf("chart_1") >= 0);
  assert.ok(activeHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(activeHtml.indexOf("Phrase") >= 0);
  assert.ok(activeHtml.indexOf("Looping: Phrase") >= 0);
  assert.ok(activeHtml.indexOf("Technique") >= 0);
  assert.ok(activeHtml.indexOf(">undefined<") === -1);
  assert.ok(activeHtml.indexOf(">null<") === -1);
  assert.ok(doneHtml.indexOf("chart_1") >= 0);
  assert.ok(doneHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(doneHtml.indexOf("Recommendation") >= 0);
  assert.ok(doneHtml.indexOf("Unlock") >= 0);
  assert.ok(doneHtml.indexOf("Open-note timing") >= 0);
  assert.ok(doneHtml.indexOf("Phrase 1") >= 0);
  assert.ok(doneHtml.indexOf("Phrase 2") >= 0);
  assert.ok(doneHtml.indexOf(">undefined<") === -1);
  assert.ok(doneHtml.indexOf(">null<") === -1);
});

test("performPage ignores malformed debug timing values", function() {
  S.performDebug = true;
  S.performCurrentSec = "NaN";
  S.performLoop = { phraseId: 2, startSec: "NaN", endSec: "NaN" };

  var html = performPage();

  assert.ok(html.indexOf("time: 0.00s") >= 0);
  assert.ok(html.indexOf("loop: 0.0-0.0") >= 0);
  assert.ok(html.indexOf("NaNs") === -1);
});

test("performPage ignores malformed calibration and offset values", function() {
  S.performMidiOffsetMs = "NaN";
  S._calibrating = true;
  S._calibCurrentBeat = "NaN";
  S._calibTotalBeats = "NaN";

  var html = performPage();

  assert.ok(html.indexOf("offset:") === -1);
  assert.ok(html.indexOf(">0/8<") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("perform pages can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceTargetTechnique: "tap",
          performanceDifficultyId: "pro",
          performanceSpeed: 0.75,
          performancePracticePreset: "guitar_solo",
          performanceInputMode: "mic",
          performanceLoop: null,
          performanceResults: {
            title: "Night Drive",
            artist: "The Meteors",
            stars: 4,
            totalEvents: 12,
            score: 2450,
            accuracy: 96,
            maxCombo: 9,
            phraseStats: [
              { name: "Launch", total: 3, scoreSum: 3, perfects: 3, goods: 0, oks: 0, misses: 0 },
              { name: "Drift", total: 3, scoreSum: 2, perfects: 2, goods: 0, oks: 0, misses: 1 }
            ],
            importedTechniqueSummary: {
              tap: { label: "Tap-note consistency", hits: 4, total: 5, accuracy: 80 }
            },
            unlocks: [{ label: "Turbo Mode", xp: 50 }]
          },
          performanceChartId: "night_drive_chart",
          transport: { positionMs: 2500, status: "paused" }
        }
      };
    }
  };

  loadVM("js/pages/perform.js");

  var activeHtml = performPage();
  var doneHtml = performDonePage();
  assert.ok(activeHtml.indexOf("FOCUS: TAP-NOTE CONSISTENCY") >= 0);
  assert.ok(activeHtml.indexOf('onclick="act(\'performMode\',\'mic\')"') >= 0);
  assert.ok(activeHtml.indexOf('onclick="act(\'performDifficulty\',\'pro\')"') >= 0);
  assert.ok(activeHtml.indexOf('onclick="act(\'performSpeed\',0.75)"') >= 0);
  assert.ok(activeHtml.indexOf('onclick="act(\'resumePerform\')"') >= 0);
  assert.ok(doneHtml.indexOf("Night Drive") >= 0);
  assert.ok(doneHtml.indexOf("The Meteors") >= 0);
  assert.ok(doneHtml.indexOf("Tap-note consistency") >= 0);
  assert.ok(doneHtml.indexOf("Turbo Mode") >= 0);
});

test("performDonePage hides weakest retry when no phrase target exists", function() {
  S.performChart.phrases = [];
  S.performResults.phraseStats = [
    { name: "Only Phrase", total: 2, scoreSum: 1, perfects: 1, goods: 0, oks: 0, misses: 1 }
  ];

  var html = performDonePage();

  assert.strictEqual(html.indexOf("performRetryPhrase"), -1);
  assert.ok(html.indexOf("Finish a phrase-tracked run") >= 0);
});

test("performDonePage keeps weakest retry when phrase target exists", function() {
  S.performChart.phrases = [{ id: "phrase-a", name: "Phrase A", startSec: 0, endSec: 4 }];
  S.performResults.phraseStats = [
    { name: "Phrase A", total: 2, scoreSum: 1, perfects: 1, goods: 0, oks: 0, misses: 1 }
  ];

  var html = performDonePage();

  assert.ok(html.indexOf("performRetryPhrase") >= 0);
  assert.strictEqual(html.indexOf("Finish a phrase-tracked run"), -1);
});

test("performDonePage no-results fallback exits through the performance song list action", function() {
  S.performResults = null;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceResults: null,
          performanceChartId: null,
          performanceTargetTechnique: null,
          performanceDifficultyId: null,
          performanceSpeed: null,
          performancePracticePreset: null,
          performanceInputMode: null,
          performanceLoop: null,
          transport: { positionMs: 0, status: "stopped" }
        }
      };
    }
  };

  var html = performDonePage();

  assert.ok(html.indexOf("No results.") >= 0);
  assert.ok(html.indexOf("performDoneSongs") >= 0);
  assert.strictEqual(html.indexOf("act('back')"), -1);
});

test("performDonePage uses shared result surface classes", function() {
  var html = performDonePage();

  assert.ok(html.indexOf("metric-value") >= 0);
  assert.ok(html.indexOf("metric-label") >= 0);
  assert.ok(html.indexOf("card-section-heading") >= 0);
  assert.ok(html.indexOf("card-micro-heading") >= 0);
  assert.ok(html.indexOf("split-row") >= 0);
  assert.ok(html.indexOf("action-row") >= 0);
  assert.strictEqual(html.indexOf("<h3 style="), -1);
  assert.strictEqual(html.indexOf("font-size:13px;font-weight:700;color:var(--text-primary)"), -1);
});

test("performanceStatsPage uses shared list and metric classes", function() {
  global.getPerformanceTotals = function() {
    return { runs: 8, songsPlayed: 4, masteredSongs: 2, avgAccuracy: 91, totalStars: 15 };
  };
  global.getPerformanceRecentRuns = function() {
    return [{ songId: "night_drive", arrangement: "chords", difficulty: "normal", mastery: "solid", bestAccuracy: 91, bestStars: 4 }];
  };
  global.getPerformanceTopSongs = function() {
    return [{ songId: "night_drive", bestScore: 2100 }];
  };
  global.getPerformanceWeakSongs = function() {
    return [{ songId: "slow_burn", bestAccuracy: 62 }];
  };
  global.S.performanceDailyHistory = [{ date: "2026-05-06", type: "full_run", xp: 25 }];
  loadVM("js/pages/performance_stats.js");

  var html = performanceStatsPage();

  assert.ok(html.indexOf("card-section-heading") >= 0);
  assert.ok(html.indexOf("metric-value") >= 0);
  assert.ok(html.indexOf("metric-label") >= 0);
  assert.ok(html.indexOf("split-row") >= 0);
  assert.ok(html.indexOf("action-row") >= 0);
  assert.strictEqual(html.indexOf("<h3 style="), -1);
  assert.strictEqual(html.indexOf("font-size:13px;font-weight:700;color:var(--text-primary)"), -1);
});

if (process.exitCode) process.exit(process.exitCode);
