var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Stale plan",
      items: [
        { id: "stale_1", type: "song", label: "Old Stale Song" }
      ]
    }
  };
  global.escHTML = function(value) { return String(value); };
  global.ensurePracticePlan = function() { return S.practicePlan; };
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Song mastery",
            items: [
              { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: 240 },
              { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 }
            ]
          }
        },
        lastSessionOutcome: null
      };
    }
  };
  global.act = function() {};
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/instruments/piano/pages/plan.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Plan Page Resolution ---");

test("pianoPlanPage prefers the active core-backed practice plan and launches by item id", function() {
  var html = pianoPlanPage();

  assert.ok(html.indexOf("Song mastery") >= 0);
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf("Old Stale Song"), -1);
  assert.ok(html.indexOf("launchPracticePlanItem('song_1')") >= 0);
  assert.ok(html.indexOf("launchPracticePlanItem('practice_1')") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
