var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.S = {
    profile: {
      displayName: "Morgan",
      instrumentPrimary: "guitar"
    },
    sparkProfile: {},
    playerLevel: 1,
    playerXP: 0,
    practiceStreak: 0,
    playerStats: {
      lessonsCompleted: 0,
      sessionsCompleted: 0,
      totalPracticeMinutes: 0,
      exercisesCompleted: 0,
      streakBest: 0
    }
  };
  global.SparkStorage = {
    load: function() {
      return {
        displayName: "",
        apps: {},
        suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/meta/profile.js"));
    fn();
    passed += 1;
    console.log("  PASS: " + name);
  } catch (error) {
    failed += 1;
    console.error("  FAIL: " + name);
    console.error("    " + error.message);
  }
}

console.log("\n--- Legacy Profile Page Resolution ---");

test("legacy profile page uses real profile identity instead of a bare template shell", function() {
  var html = profilePage();

  assert.ok(html.indexOf("Morgan") >= 0);
  assert.ok(html.indexOf("Primary Instrument: Guitar") >= 0);
  assert.ok(html.indexOf("Badges Unlocked: 0") >= 0);
});

test("legacy profile page can summarize canonical stored progress", function() {
  global.SparkStorage.load = function() {
    return {
      displayName: "Riley",
      selectedInstrument: "piano",
      apps: {
        pianospark: {
          instrument: "piano",
          stats: {
            xp: 240,
            level: 3,
            lessonsCompleted: 4,
            sessionsCompleted: 6,
            streakDays: 5
          }
        }
      },
      suiteRewards: {
        badges: ["first_session", "streak_3"],
        cosmetics: [],
        challengeProgress: {}
      }
    };
  };
  global.S.playerLevel = 0;
  global.S.playerXP = 0;
  global.S.playerStats = {
    lessonsCompleted: 0,
    sessionsCompleted: 0,
    totalPracticeMinutes: 12,
    exercisesCompleted: 9,
    streakBest: 0
  };

  var html = profilePage();

  assert.ok(html.indexOf("Riley") >= 0);
  assert.ok(html.indexOf("Primary Instrument: Piano") >= 0);
  assert.ok(html.indexOf("Level: 3") >= 0);
  assert.ok(html.indexOf("XP: 240") >= 0);
  assert.ok(html.indexOf("Lessons Completed: 4") >= 0);
  assert.ok(html.indexOf("Sessions Completed: 6") >= 0);
  assert.ok(html.indexOf("Badges Unlocked: 2") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
