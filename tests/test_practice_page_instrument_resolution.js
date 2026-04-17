var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.document = { body: { classList: { contains: function(cls) { return cls === "sv2"; } } } };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null
  };
  global.escHTML = function(value) { return String(value); };
  global.SparkTheme = {
    get: function() { return { ok: true }; },
    getColor: function(instrument) { return instrument === "piano" ? "#3366ff" : "#888"; }
  };
  global.BADGES = [];
  global.ringHTML = function() { return "<div>ring</div>"; };
  global.act = function() {};
  global.practiceTab = function() { return "<div>Practice</div>"; };
  global.drillTab = function() { return "<div>Drill</div>"; };
  global.dailyTab = function() { return ""; };
  global.quizTab = function() { return ""; };
  global.earTrainTab = function() { return ""; };
  global.strumTab = function() { return ""; };
  global.songsTab = function() { return ""; };
  global.rhythmTab = function() { return ""; };
  global.runnerTab = function() { return ""; };
  global.buildTab = function() { return ""; };
  global.tunerTab = function() { return ""; };
  global.dualTab = function() { return ""; };
  global.statsTab = function() { return ""; };
  global.guideTab = function() { return ""; };
  global.gamesTab = function() { return ""; };
  global.toolsTab = function() { return ""; };
  global.strumTrackCard = function() { return ""; };
  global.fingerExerciseCard = function() { return ""; };

  var pianoModule = {
    id: "pianospark",
    appId: "pianospark",
    instrument: "piano",
    name: "Piano",
    icon: "\uD83C\uDFB9",
    tabs: [{ id: "practice", label: "Practice", icon: "\uD83C\uDFB9" }],
    tabRenderers: {
      practice: function() { return "<div>Piano Practice</div>"; }
    },
    getData: function() {
      return {
        LC: { 1: "#3366ff" },
        LN: { 1: "First Keys" },
        CURRICULUM: [{ num: 1, title: "First Keys", desc: "Foundations", icon: "\uD83C\uDFB9", tip: "" }],
        CHORDS: { 1: [] },
        SESSIONS: [],
        BADGES: [],
        ALL_CHORDS: [{ name: "C" }]
      };
    }
  };

  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [pianoModule];
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/pages/practice.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Practice Page Instrument Resolution ---");

test("sv2HomeDashboard rehydrates an app-id-only active instrument shell", function() {
  var html = sv2HomeDashboard();
  assert.ok(html.indexOf("Piano") >= 0);
  assert.ok(html.indexOf("First Keys") >= 0);
  assert.ok(html.indexOf("1/1 chords") >= 0);
});

test("homePage uses rehydrated tab renderers from the active instrument module", function() {
  var html = homePage();
  assert.ok(html.indexOf("Piano Practice") >= 0);
});

test("practicePage renders human plan labels from a core-backed daily practice plan", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.generateDailyPracticePlan = function() {};
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
              { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
            ]
          }
        }
      };
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf(">song<"), -1);
  assert.strictEqual(html.indexOf(">practice<"), -1);
});

test("practicePage does not generate a plan during render and shows an empty state when none exists", function() {
  var generateCalls = 0;
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.generateDailyPracticePlan = function() {
    generateCalls++;
    return {
      items: [{ id: "generated_1", label: "Generated Plan Row" }]
    };
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.S.practicePlan = null;

  var html = practicePage();
  assert.strictEqual(generateCalls, 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Generated Plan Row"), -1);
});

test("practicePage falls back to cached plan state when the practice bridge is unavailable", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [{ id: "cached_1", type: "practice", label: "Cached Warmup", completed: false }]
    }
  };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            items: [{ id: "core_1", type: "practice", label: "Core Warmup", completed: false }]
          }
        }
      };
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("Cached Warmup") >= 0);
  assert.strictEqual(html.indexOf("Core Warmup"), -1);
});

test("practicePage does not render completed items as clickable start buttons", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", completed: true },
        { id: "todo_1", type: "practice", label: "Next Warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("Completed Warmup") >= 0);
  assert.ok(html.indexOf("Next Warmup") >= 0);
  assert.ok(html.indexOf("practiceStartItem', 'done_1") === -1);
  assert.ok(html.indexOf("practiceStartItem', 'todo_1") >= 0);
  assert.ok(html.indexOf(">Done<") >= 0);
});

test("practicePage derives readable fallback labels and subtitles for sparse plan items", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        { id: "song_1", type: "song", completed: false, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("island strum") >= 0);
  assert.ok(html.indexOf("left hand") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("practicePage does not render start buttons for sparse plan items without ids", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        { type: "song", completed: false, meta: { songId: "island_strum" } },
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practicePage();
  assert.strictEqual(html.indexOf("practiceStartItem', 'undefined'"), -1);
  assert.ok(html.indexOf("practiceStartItem', 'practice_1'") >= 0);
  assert.ok(html.indexOf(">Unavailable<") >= 0);
});

test("plan page infers richer display types from generic core-backed items", function() {
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
              { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: 240, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
              { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
            ]
          }
        },
        lastSessionOutcome: null
      };
    }
  };
  global.ensurePracticePlan = function() {
    throw new Error("should not be called");
  };
  global.S = { practicePlanComplete: false };
  global.act = function() {};
  global.launchPracticeItem = function() {};
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("ukulele - strum pattern - performance song") >= 0);
  assert.ok(html.indexOf("piano - left hand - finger") >= 0);
  assert.strictEqual(html.indexOf("â€¢"), -1);
  assert.strictEqual(html.indexOf(">song<"), -1);
  assert.strictEqual(html.indexOf(">practice<"), -1);
});

test("planPage stays read-only when no plan exists and shows an empty state", function() {
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
  global.act = function() {};
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Generated Plan Row"), -1);
});

test("planPage falls back to cached plan state when the practice bridge is unavailable", function() {
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
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("Cached Warmup") >= 0);
  assert.strictEqual(html.indexOf("Core Warmup"), -1);
});

test("planPage does not render completed items as clickable go buttons", function() {
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
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("Completed Warmup") >= 0);
  assert.ok(html.indexOf("Next Warmup") >= 0);
  assert.ok(html.indexOf("launchPracticePlanItem('done_1')") === -1);
  assert.ok(html.indexOf("launchPracticePlanItem('todo_1')") >= 0);
  assert.ok(html.indexOf(">Done<") >= 0);
});

test("planPage derives plan completion from completed items when the stale completion flag is false", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", durationSec: 120, completed: true },
        { id: "done_2", type: "practice", label: "Completed Rhythm", durationSec: 120, completed: true }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("Plan completed!") >= 0);
  assert.strictEqual(html.indexOf("Mark Plan Complete"), -1);
});

test("planPage derives readable fallback labels for sparse plan items", function() {
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
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("island strum") >= 0);
  assert.ok(html.indexOf("left hand") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("planPage derives a readable focus label when a cached plan omits focus", function() {
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
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("No practice focus yet.") >= 0);
  assert.strictEqual(html.indexOf("<div class=\"muted\">No practice plan yet.</div>"), -1);
});

test("planPage does not render a completed banner when the plan is missing but the stale completion flag remains", function() {
  global.S = {
    practicePlanComplete: true,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Plan completed!"), -1);
});

test("planPage treats empty cached plan shells as missing plans in the header copy", function() {
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
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.ok(html.indexOf("<div class=\"muted\">No practice plan yet.</div>") >= 0);
  assert.strictEqual(html.indexOf("No practice focus yet."), -1);
});

test("planPage does not render go buttons for sparse plan items without ids", function() {
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
  global.eval(loadJS("js/pages/plan.js"));

  var html = planPage();
  assert.strictEqual(html.indexOf("launchPracticePlanItem('undefined')"), -1);
  assert.ok(html.indexOf("launchPracticePlanItem('practice_1')") >= 0);
  assert.ok(html.indexOf(">Unavailable<") >= 0);
});

test("planPage and practicePage tolerate sparse cached plan items that contain null entries", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        null,
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.eval(loadJS("js/pages/plan.js"));

  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.strictEqual(practiceHtml.indexOf("undefined"), -1);
  assert.strictEqual(planHtml.indexOf("undefined"), -1);
  assert.ok(practiceHtml.indexOf(">Unavailable<") >= 0);
  assert.ok(planHtml.indexOf(">Unavailable<") >= 0);
  assert.ok(practiceHtml.indexOf("warmup 1") >= 0);
  assert.ok(planHtml.indexOf("warmup 1") >= 0);
});

test("startPracticeItem skips null cached plan rows when launching by id", function() {
  var launched = [];
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        null,
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };

  startPracticeItem("practice_1");

  assert.deepStrictEqual(launched, ["practice_1"]);
});

test("startPracticeItem fails safely when a cached plan shell omits items", function() {
  var launched = [];
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      focus: "Song mastery"
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };

  startPracticeItem("practice_1");

  assert.deepStrictEqual(launched, []);
});

test("launchPracticePlanItem skips null cached plan rows when launching by id", function() {
  var launched = [];
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        null,
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };
  global.eval(loadJS("js/pages/plan.js"));

  launchPracticePlanItem("practice_1");

  assert.deepStrictEqual(launched, ["practice_1"]);
});

test("practiceTab reads the active core-backed plan without calling ensurePracticePlan during render", function() {
  var ensureCalls = 0;
  global.ensurePracticePlan = function() {
    ensureCalls++;
    return {
      focus: "Stale plan",
      completedItems: 0,
      totalItems: 1,
      items: [{ id: "stale_1", label: "Old Stale Song", desc: "stale", completed: false }]
    };
  };
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
            completedItems: 1,
            totalItems: 2,
            items: [
              { id: "song_1", type: "song", label: "Replay Island Strum", desc: "Tune recall", completed: false },
              { id: "practice_1", type: "practice", label: "Quick warmup", desc: "Loosen up", completed: true }
            ]
          }
        }
      };
    }
  };

  var html = practiceTab();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf("Old Stale Song"), -1);
});

test("practiceTab derives progress counts when cached plans omit completedItems and totalItems", function() {
  var ensureCalls = 0;
  global.ensurePracticePlan = function() {
    ensureCalls++;
    return null;
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true },
        { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("1/2") >= 0);
  assert.strictEqual(html.indexOf("undefined/undefined"), -1);
});

test("practiceTab ignores stale zero totalItems when cached plans still have items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      completedItems: 1,
      totalItems: 0,
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true },
        { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("1/2") >= 0);
  assert.strictEqual(html.indexOf("1/0"), -1);
});

test("practiceTab derives a readable focus label when cached plans omit focus", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Focus: No practice focus yet.") >= 0);
  assert.strictEqual(html.indexOf("Focus: undefined"), -1);
});

test("practiceTab shows an empty-state practice plan card when no plan exists", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Today&#39;s Practice Plan") >= 0 || html.indexOf("Today's Practice Plan") >= 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
});

test("practiceTab falls back to cached plan state when the practice bridge is unavailable", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    practicePlan: {
      focus: "Cached focus",
      completedItems: 0,
      totalItems: 1,
      items: [{ id: "cached_1", label: "Cached Warmup", desc: "cached", completed: false }]
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
            completedItems: 0,
            totalItems: 1,
            items: [{ id: "core_1", label: "Core Warmup", desc: "core", completed: false }]
          }
        }
      };
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Cached Warmup") >= 0);
  assert.strictEqual(html.indexOf("Core Warmup"), -1);
});

test("practiceTab treats malformed cached plan shells without array items as empty state", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      items: { length: 1, 0: { id: "bad_1", label: "Broken Row" } }
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Broken Row"), -1);
});

test("practiceTab and planPage treat null-only cached plan arrays as empty state", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [null, null]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.eval(loadJS("js/pages/plan.js"));

  var practiceHtml = practiceTab();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
});

test("sv2HomeDashboard uses instrumentType when the rehydrated module does not expose instrument", function() {
  var themeRequests = [];
  SparkTheme.get = function(instrument) {
    themeRequests.push(instrument);
    return { ok: true };
  };
  SparkInstruments.getAll = function() {
    return [{
      id: "pianospark",
      appId: "pianospark",
      instrumentType: "piano",
      name: "Piano",
      icon: "\uD83C\uDFB9",
      tabs: [{ id: "practice", label: "Practice", icon: "\uD83C\uDFB9" }],
      tabRenderers: {
        practice: function() { return "<div>Piano Practice</div>"; }
      },
      getData: function() {
        return {
          LN: { 1: "First Keys" },
          ALL_CHORDS: [{ name: "C" }]
        };
      }
    }];
  };

  sv2HomeDashboard();

  assert.strictEqual(themeRequests[0], "piano");
});

if (process.exitCode) process.exit(process.exitCode);
