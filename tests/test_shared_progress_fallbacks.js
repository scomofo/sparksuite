var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    level: 7,
    xp: 345,
    practiceHistory: [{ id: 1 }, { id: 2 }],
    totalPracticeMinutes: 90,
    practiceStreak: 4,
    metaProgress: {
      challengesCompleted: 3,
      goalsCompleted: 2,
      skillPoints: 1
    },
    playerStats: {
      songsCompleted: 5,
      totalPracticeMinutes: 90,
      lessonsCompleted: 6,
      exercisesCompleted: 8,
      streakBest: 9
    }
  };
  global.__sparkState = global.S;
  global.SparkState = {
    getRoot: function() {
      return global.S;
    },
    read: function(path, fallback) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length; i++) {
        if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
          return fallback;
        }
        cursor = cursor[parts[i]];
      }
      return cursor == null ? fallback : cursor;
    }
  };
  global.getAverageAccuracy = function() {
    return 0.88;
  };
}

function test(name, fn) {
  try {
    resetState();
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

resetState();
eval(loadJS("js/analytics/reports.js"));
eval(loadJS("js/meta/dashboard.js"));
eval(loadJS("js/meta/profile.js"));
global.awardXP = function() {};
global.saveState = function() {};
global.showToast = function() {};
eval(loadJS("js/meta/achievements.js"));
global.getCurriculumItem = function(type, id) {
  if (type === "lessons" && id === "locked_lesson") {
    return {
      id: id,
      unlockRules: {
        playerLevel: 5
      }
    };
  }
  return null;
};
eval(loadJS("js/curriculum/curriculum_engine.js"));

console.log("\n--- Shared Progress Fallbacks ---");

test("generatePracticeReport falls back to shared level key", function() {
  var report = generatePracticeReport();
  assert.strictEqual(report.level, 7);
});

test("dashboardPage falls back to shared xp and level keys", function() {
  var html = dashboardPage();
  assert.ok(html.indexOf("Level: 7") >= 0);
  assert.ok(html.indexOf("XP: 345") >= 0);
});

test("profilePage falls back to shared xp and level keys", function() {
  var html = profilePage();
  assert.ok(html.indexOf("Level: 7") >= 0);
  assert.ok(html.indexOf("XP: 345") >= 0);
});

test("evaluateAchievements unlocks level achievements from shared level state", function() {
  evaluateAchievements();
  assert.strictEqual(S.playerAchievements.level_5, true);
});

test("checkLessonUnlockRules falls back to shared level state", function() {
  assert.strictEqual(checkLessonUnlockRules("locked_lesson"), true);
});

if (process.exitCode) process.exit(process.exitCode);
