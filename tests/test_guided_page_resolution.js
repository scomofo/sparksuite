var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


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

test("guided song slice ignores stale cached copy", function() {
  S.guidedPlan.songSlice = {
    text: "undefined",
    song: "null"
  };
  S.guidedStep = "songSlice";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "songSlice" },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var html = guidedSessionPage();
  assert.ok(html.indexOf("Play this short song slice with steady timing.") >= 0);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("undefined") === -1);
});

test("guided pages ignore malformed cached BPM values", function() {
  S.guidedPlan.bpm = "NaN";
  S.guidedPlan.newMove = {
    text: "Try it",
    chord: "C",
    strum: "D D U U"
  };
  S.guidedStep = "newMove";
  S.newMovePhase = "try";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: {
        guidedStep: "newMove",
        newMovePhase: "try"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var html = guidedSessionPage();
  assert.ok(html.indexOf("Level 1 &bull; 80 BPM") >= 0);
  assert.ok(html.indexOf("at 80 BPM") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("guided done page ignores malformed completion counters", function() {
  S.streak = "NaN";
  S.completedGuidedSessions = { broken: true };
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "spark" },
      lastSessionOutcome: { xpAwarded: "NaN" }
    };
  };
  var html = guidedDonePage();
  assert.ok(html.indexOf("+30") >= 0);
  assert.ok(html.indexOf("&#128293;0") >= 0);
  assert.ok(html.indexOf(">0/22<") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("guided exit routes through a confirmation action", function() {
  var source = loadJS("js/pages/guided.js");
  assert.ok(source.indexOf('onclick="act(\\\'guidedConfirmStop\\\')"') >= 0);
  assert.strictEqual(source.indexOf("if(confirm('End session early?'))act('guidedStop')"), -1);
});

test("guided confirmation action delegates to guidedStop only after confirm", function() {
  var handled;
  var acted = [];
  global.window = global;
  global.S = {};
  global.T = {};
  global.confirm = function() { return true; };
  global.act = function(name) { acted.push(name); };
  global.registerSparkActionFamily = function(name, handler) {
    global.runSparkActionFamilies = handler;
  };
  global.eval(loadJS("js/actions/system_family.js"));
  handled = global.runSparkActionFamilies("guidedConfirmStop");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(acted, ["guidedStop"]);

  acted = [];
  global.confirm = function() { return false; };
  handled = global.runSparkActionFamilies("guidedConfirmStop");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(acted, []);
});

if (process.exitCode) process.exit(process.exitCode);
