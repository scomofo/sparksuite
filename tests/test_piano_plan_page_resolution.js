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
  global.sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "daily_practice",
        _legacyPlan: {
          focus: "Song mastery",
          items: [
            { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: 240, meta: { songId: "island_strum" } },
            { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120, meta: { exerciseId: "warmup_1" } }
          ]
        }
      },
      lastSessionOutcome: null
    };
  };
  var html = pianoPlanPage();

  assert.ok(html.indexOf("Song mastery") >= 0);
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf("Old Stale Song"), -1);
  assert.ok(html.indexOf("launchPracticePlanItem('song_1')") >= 0);
  assert.ok(html.indexOf("launchPracticePlanItem('practice_1')") >= 0);
  assert.ok(html.indexOf("performance song") >= 0);
  assert.ok(html.indexOf("finger") >= 0);
});

test("piano practice plan section reads the active core-backed plan without generating one during render", function() {
  var generateCalls = 0;
  global.S = {
    practicePlan: {
      items: [{ id: "stale_1", label: "Old Stale Song", completed: false }]
    }
  };
  global.generateDailyPracticePlan = function() {
    generateCalls++;
    return S.practicePlan;
  };
  global.getPracticeStats = function() {
    return { streak: 2, todayMinutes: 4, totalMinutes: 30, sessions: 7 };
  };
  global.getAverageMastery = function() { return 0.5; };
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            items: [
              { id: "song_1", type: "song", label: "Replay Island Strum", completed: false },
              { id: "practice_1", type: "practice", label: "Quick warmup", completed: true }
            ]
          }
        }
      };
    }
  };

  global.practicePlanSection = undefined;
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = practicePlanSection();
  assert.strictEqual(generateCalls, 0);
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf("Old Stale Song"), -1);
});

test("piano practice plan section falls back to cached plan state when the practice bridge is unavailable", function() {
  global.S = {
    practicePlan: {
      items: [{ id: "cached_1", label: "Cached Warmup", completed: false }]
    }
  };
  global.getPracticeStats = function() {
    return { streak: 2, todayMinutes: 4, totalMinutes: 30, sessions: 7 };
  };
  global.getAverageMastery = function() { return 0.5; };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            items: [{ id: "core_1", label: "Core Warmup", completed: false }]
          }
        }
      };
    }
  };

  global.practicePlanSection = undefined;
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = practicePlanSection();
  assert.ok(html.indexOf("Cached Warmup") >= 0);
  assert.strictEqual(html.indexOf("Core Warmup"), -1);
});

test("pianoPlanPage stays read-only when no plan exists and shows an empty state", function() {
  var ensureCalls = 0;
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.ensurePracticePlan = function() {
    ensureCalls++;
    return {
      focus: "Generated plan",
      items: [{ id: "generated_1", label: "Generated Plan Row" }]
    };
  };
  global.S = { practicePlanComplete: false, practicePlan: null };

  var html = pianoPlanPage();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Generated Plan Row"), -1);
});

test("pianoPlanPage falls back to cached plan state when the practice bridge is unavailable", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [{ id: "cached_1", type: "practice", label: "Cached Warmup", durationSec: 120 }]
    }
  };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Core focus",
            items: [{ id: "core_1", type: "practice", label: "Core Warmup", durationSec: 120 }]
          }
        },
        lastSessionOutcome: null
      };
    }
  };

  var html = pianoPlanPage();
  assert.ok(html.indexOf("Cached Warmup") >= 0);
  assert.strictEqual(html.indexOf("Core Warmup"), -1);
});

if (process.exitCode) process.exit(process.exitCode);
