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
            { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: 240, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
            { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
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
  assert.ok(html.indexOf("ukulele - strum pattern - performance song") >= 0);
  assert.ok(html.indexOf("piano - left hand - finger") >= 0);
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

test("piano practice plan section shows an empty state when no plan exists", function() {
  global.S = { practicePlan: null };
  global.getPracticeStats = function() {
    return { streak: 2, todayMinutes: 4, totalMinutes: 30, sessions: 7 };
  };
  global.getAverageMastery = function() { return 0.5; };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  global.practicePlanSection = undefined;
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = practicePlanSection();
  assert.ok(html.indexOf("Today's Practice Plan") >= 0 || html.indexOf("Today\\'s Practice Plan") >= 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
});

test("piano practice plan section derives fallback labels for sparse plan items", function() {
  global.S = {
    practicePlan: {
      items: [
        { id: "song_1", type: "song", completed: false, meta: { songId: "island_strum" } },
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseFocus: "left_hand", exerciseId: "warmup_1" } }
      ]
    }
  };
  global.getPracticeStats = function() {
    return { streak: 2, todayMinutes: 4, totalMinutes: 30, sessions: 7 };
  };
  global.getAverageMastery = function() { return 0.5; };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  global.practicePlanSection = undefined;
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = practicePlanSection();
  assert.ok(html.indexOf("island strum") >= 0);
  assert.ok(html.indexOf("left hand") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("piano practice plan section does not render start buttons for sparse plan items without ids", function() {
  global.S = {
    practicePlan: {
      items: [
        { type: "song", completed: false, meta: { songId: "island_strum" } },
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.getPracticeStats = function() {
    return { streak: 2, todayMinutes: 4, totalMinutes: 30, sessions: 7 };
  };
  global.getAverageMastery = function() { return 0.5; };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  global.practicePlanSection = undefined;
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = practicePlanSection();
  assert.strictEqual(html.indexOf("practiceStartItem', 'undefined'"), -1);
  assert.ok(html.indexOf("practiceStartItem', 'practice_1'") >= 0);
  assert.ok(html.indexOf(">Unavailable<") >= 0);
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

test("pianoPlanPage does not render completed items as clickable go buttons", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", durationSec: 120, completed: true },
        { id: "todo_1", type: "practice", label: "Next Warmup", durationSec: 120, completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = pianoPlanPage();
  assert.ok(html.indexOf("Completed Warmup") >= 0);
  assert.ok(html.indexOf("Next Warmup") >= 0);
  assert.ok(html.indexOf("launchPracticePlanItem('done_1')") === -1);
  assert.ok(html.indexOf("launchPracticePlanItem('todo_1')") >= 0);
  assert.ok(html.indexOf(">Done<") >= 0);
});

test("pianoPlanPage derives readable fallback labels for sparse plan items", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "song_1", type: "song", durationSec: 240, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
        { id: "practice_1", type: "practice", durationSec: 120, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = pianoPlanPage();
  assert.ok(html.indexOf("island strum") >= 0);
  assert.ok(html.indexOf("left hand") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("pianoPlanPage derives a readable focus label when a cached plan omits focus", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      items: [
        { id: "song_1", type: "song", durationSec: 240, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = pianoPlanPage();
  assert.ok(html.indexOf("No practice focus yet.") >= 0);
  assert.strictEqual(html.indexOf("<div class=\"muted\">No practice plan yet.</div>"), -1);
});

test("pianoPlanPage does not render a completed banner when the plan is missing but the stale completion flag remains", function() {
  global.S = {
    practicePlanComplete: true,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = pianoPlanPage();
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Plan completed!"), -1);
});

test("pianoPlanPage treats empty cached plan shells as missing plans in the header copy", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      items: []
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = pianoPlanPage();
  assert.ok(html.indexOf("<div class=\"muted\">No practice plan yet.</div>") >= 0);
  assert.strictEqual(html.indexOf("No practice focus yet."), -1);
});

test("pianoPlanPage does not render go buttons for sparse plan items without ids", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { type: "song", durationSec: 240, meta: { songId: "island_strum" } },
        { id: "practice_1", type: "practice", durationSec: 120, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = pianoPlanPage();
  assert.strictEqual(html.indexOf("launchPracticePlanItem('undefined')"), -1);
  assert.ok(html.indexOf("launchPracticePlanItem('practice_1')") >= 0);
  assert.ok(html.indexOf(">Unavailable<") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
