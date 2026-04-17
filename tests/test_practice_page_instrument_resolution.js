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
              { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: 240, meta: { songId: "island_strum" } },
              { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120, meta: { exerciseId: "warmup_1" } }
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
  assert.ok(html.indexOf("performance song") >= 0);
  assert.ok(html.indexOf("finger") >= 0);
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
