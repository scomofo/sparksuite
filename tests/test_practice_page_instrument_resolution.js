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
    xp: 12,
    streak: 3,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice"
  };
  global.escHTML = function(value) { return String(value); };
  global.SparkTheme = {
    get: function() { return { ok: true }; },
    getColor: function(instrument) { return instrument === "piano" ? "#3366ff" : "#888"; }
  };
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
        LN: { 1: "First Keys" },
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
