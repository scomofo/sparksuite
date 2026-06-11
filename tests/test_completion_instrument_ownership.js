var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
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

console.log("\n--- Completion Instrument Ownership ---");

test("practice plan completion preserves app-id-only active instruments", function() {
  resetPracticeEnvironment();
  eval(loadJS("js/practice/engine.js"));

  completePracticePlan();

  assert.strictEqual(sparkCorePayloads.length, 1);
  assert.strictEqual(progressPayloads.length, 1);
  assert.strictEqual(progressPayloads[0].instrumentId, "pianospark");
  assert.strictEqual(progressPayloads[0].instrumentType, "piano");
});

test("performance completion preserves app-id-only active instruments", function() {
  resetPerformanceEnvironment();
  eval(loadJS("js/performance/session.js"));
  stopPerformance = function() {};

  finishPerformance();

  assert.strictEqual(sparkCoreCompletionPayloads.length, 1);
  assert.strictEqual(performanceProgressPayloads.length, 1);
  assert.strictEqual(performanceProgressPayloads[0].instrumentId, "pianospark");
  assert.strictEqual(performanceProgressPayloads[0].instrumentType, "piano");
});

if (process.exitCode) process.exit(process.exitCode);
