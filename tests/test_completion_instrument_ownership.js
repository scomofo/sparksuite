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

function resetPracticeEnvironment() {
  global.window = global;
  global.S = {
    practicePlanComplete: false,
    // Completion credit is earned-gated: at least one plan item must be
    // done for the orchestrator outcome this test asserts on to fire.
    practicePlan: { items: [{ id: "item_1", completed: true }] }
  };
  global.__sparkState = global.S;
  global.SparkSessionTypes = {
    FLOW_DAILY_PRACTICE: "daily_practice",
    FLOW_PERFORMANCE_SONG: "performance_song"
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{ id: "pianospark", appId: "pianospark", instrument: "piano" }];
    }
  };
  global.sparkCorePayloads = [];
  global.progressPayloads = [];
  global.sparkCore = {
    completeSession: function(payload) {
      sparkCorePayloads.push(payload);
      return { ok: true };
    }
  };
  global.SparkContracts = {
    createSessionResult: function(result) { return result; }
  };
  global.SparkProgressOrchestrator = {
    applySessionOutcome: function(result) {
      progressPayloads.push(result);
      return {};
    }
  };
  global.saveState = function() {};
}

function resetPerformanceEnvironment() {
  global.window = global;
  global.S = {
    performResults: null,
    performStarRating: null,
    performChart: { arrangementType: "rhythm_chords" },
    performChartId: "night_drive",
    performDifficulty: "hard",
    performArrangementType: "rhythm_chords",
    performPhraseStats: {},
    performanceStats: {},
    performSongStats: {}
  };
  global.__sparkState = global.S;
  global.SCR = { PERFORM_DONE: "perform_done" };
  global.SparkSessionTypes = {
    FLOW_PERFORMANCE_SONG: "performance_song"
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{ id: "pianospark", appId: "pianospark", instrument: "piano" }];
    }
  };
  global.performanceProgressPayloads = [];
  global.sparkCoreCompletionPayloads = [];
  global.stopPerformance = function() {};
  global.destroySparkHighway = function() {};
  global.destroyPerformanceInput = function() {};
  global.destroyPerformanceAudio = function() {};
  global.finalizePerformanceResults = function() {
    return {
      accuracy: 87,
      stars: 3,
      score: 12345,
      duration: 95,
      title: "Night Drive"
    };
  };
  global.SparkPerformanceBridge = null;
  global.sparkCore = {
    completeSession: function(payload) {
      sparkCoreCompletionPayloads.push(payload);
      return { xpAwarded: 9 };
    }
  };
  global.SparkContracts = {
    createSessionResult: function(result) { return result; }
  };
  global.SparkProgressOrchestrator = {
    applySessionOutcome: function(result) {
      performanceProgressPayloads.push(result);
      return {};
    }
  };
  global.logHistory = function() {};
  global.saveState = function() {};
  global.render = function() {};
  global.PerfEvents = { emit: function() {} };
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Completion Single-Path Ownership ---");

// Phase 7: the core's completeSession is the single progression driver for
// these flows. Instrument identity is resolved inside the core
// (InstrumentManager.getActiveContext) — covered in
// test_sparksuite_core_migration.js. These tests pin that completion runs
// through the core exactly once with NO shadow observer double-processing.

test("practice plan completion routes through the core exactly once", function() {
  resetPracticeEnvironment();
  eval(loadJS("js/practice/engine.js"));

  completePracticePlan();

  assert.strictEqual(sparkCorePayloads.length, 1);
  assert.strictEqual(sparkCorePayloads[0].earnedCompletion, true);
  assert.strictEqual(progressPayloads.length, 0, "no shadow observer call beside the core driver");
});

test("performance completion routes through the core exactly once", function() {
  resetPerformanceEnvironment();
  eval(loadJS("js/performance/session.js"));
  stopPerformance = function() {};

  finishPerformance();

  assert.strictEqual(sparkCoreCompletionPayloads.length, 1);
  assert.strictEqual(sparkCoreCompletionPayloads[0].performanceResults.accuracy, 87);
  assert.strictEqual(performanceProgressPayloads.length, 0, "no shadow observer call beside the core driver");
});

if (process.exitCode) process.exit(process.exitCode);
