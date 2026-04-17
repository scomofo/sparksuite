var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnv() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.confirm = function() { return true; };
  global.S = {
    guidedPlan: {
      id: "guided_plan_1",
      num: 2,
      title: "undefined",
      level: 1,
      bpm: 72,
      spark: { text: "Start here" }
    },
    guidedStep: "spark",
    newMovePhase: "watch",
    streak: 3,
    completedGuidedSessions: []
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        getData: function() { return { ALL_CHORDS: [] }; },
        ui: { chord: function() { return "<div>chord</div>"; } }
      };
    },
    getAll: function() { return []; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: { guidedPlan: S.guidedPlan }
        },
        runtimeState: { guidedStep: "spark" },
        lastSessionOutcome: { xpAwarded: 30 }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/pages/guided.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Guided Page Resolution ---");

test("guided pages ignore stale plan titles", function() {
  var sessionHtml = guidedSessionPage();
  var doneHtml = guidedDonePage();
  assert.ok(sessionHtml.indexOf("guided_plan_1") >= 0);
  assert.ok(doneHtml.indexOf("guided_plan_1") >= 0);
  assert.ok(sessionHtml.indexOf(">undefined<") === -1);
  assert.ok(doneHtml.indexOf(">undefined<") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
