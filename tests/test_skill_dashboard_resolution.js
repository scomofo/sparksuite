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
  global.S = {
    skillGraph: {
      timing: 0.6,
      rhythm: 0.4,
      chordAccuracy: 0.5,
      laneAccuracy: [0.8, 0.6, 0.4, 0.2, 0.1, 0],
      history: []
    }
  };
  global.SparkSkillTracker = {
    getWeakestSkill: function() { return "rhythm"; },
    getWeakestLane: function() { return "undefined"; }
  };
  global.SparkMasteryEngine = {
    getUnlocks: function() {
      return [{ id: "unlock_1", label: "null" }];
    }
  };
  global.SparkInstruments = {
    getActive: function() { return null; },
    getAll: function() { return []; }
  };
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/pages/skill_dashboard.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Skill Dashboard Resolution ---");

test("skillDashboardPage ignores stale unlock labels and malformed weakest lane values", function() {
  var html = skillDashboardPage();
  assert.ok(html.indexOf("Weakest lane:") >= 0);
  assert.ok(html.indexOf(">G<") >= 0);
  assert.ok(html.indexOf("unlock_1") >= 0);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf("âœ“") === -1);
});

test("skillDashboardPage uses active instrument lane labels instead of guitar-only labels", function() {
  S.skillGraph.laneAccuracy = [0.9, 0.7, 0.5, 0.3];
  SparkSkillTracker.getWeakestLane = function() { return 3; };
  SparkInstruments.getActive = function() {
    return { appId: "bassspark" };
  };
  SparkInstruments.getAll = function() {
    return [{
      id: "bassspark",
      appId: "bassspark",
      getRhythmAdapter: function() {
        return {
          getLaneLabels: function() {
            return ["E", "A", "D", "G"];
          }
        };
      }
    }];
  };

  var html = skillDashboardPage();

  assert.ok(html.indexOf(">E<") >= 0);
  assert.ok(html.indexOf(">A<") >= 0);
  assert.ok(html.indexOf(">D<") >= 0);
  assert.ok(html.indexOf("Weakest lane: <strong style=\"color:var(--text-primary)\">G</strong>") >= 0);
  assert.strictEqual(html.indexOf(">R<"), -1);
  assert.strictEqual(html.indexOf(">Y<"), -1);
  assert.strictEqual(html.indexOf(">B<"), -1);
  assert.strictEqual(html.indexOf(">O<"), -1);
});

if (process.exitCode) process.exit(process.exitCode);
