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
  assert.ok(html.indexOf("Lane 1") >= 0);
  assert.ok(html.indexOf("unlock_1") >= 0);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf("âœ“") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
