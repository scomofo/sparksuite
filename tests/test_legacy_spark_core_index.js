var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.S = { activeInstrument: "pianospark" };
  global.__sparkState = global.S;
  global.capturedStartOpts = null;
  global.capturedOutcome = null;
  global.SparkState = {
    read: function(path, fallback) {
      var cursor = global.S;
      var i;
      for (i = 0; i < path.length; i++) {
        if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, path[i])) return fallback;
        cursor = cursor[path[i]];
      }
      return cursor;
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        getData: function() {
          return { SESSIONS: ["intro"] };
        }
      }];
    }
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculum: function() { return { SESSIONS: ["guitar_intro"] }; }
  };
  global.SparkSession = {
    buildSession: function(opts) {
      global.capturedStartOpts = opts;
      return opts;
    },
    processResults: function(result) {
      return { processed: true, result: result };
    }
  };
  global.SparkContracts = {
    createSessionResult: function(result) { return result; }
  };
  global.SparkProgressOrchestrator = {
    applySessionOutcome: function(result) {
      global.capturedOutcome = result;
      return { applied: true };
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    eval(loadJS("js/spark-core/index.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Legacy SparkCore Index ---");

test("startSession resolves thin app-id active instruments before the stale adapter singleton", function() {
  var plan = SparkCore.startSession({ mode: "guided" });
  assert.strictEqual(plan.instrumentId, "pianospark");
  assert.strictEqual(plan.instrumentType, "piano");
  assert.deepStrictEqual(plan.instrumentData, { SESSIONS: ["intro"] });
  assert.strictEqual(global.capturedStartOpts.instrumentId, "pianospark");
  assert.strictEqual(global.capturedStartOpts.instrumentType, "piano");
});

test("completeSession resolves thin app-id active instruments before the stale adapter singleton", function() {
  var outcome = SparkCore.completeSession({ type: "guided" });
  assert.ok(outcome);
  assert.strictEqual(global.capturedOutcome.instrumentId, "pianospark");
  assert.strictEqual(global.capturedOutcome.instrumentType, "piano");
});

if (process.exitCode) process.exit(process.exitCode);
