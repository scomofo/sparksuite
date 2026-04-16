var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    xp: 90,
    level: 1,
    xpLog: []
  };
  global.__sparkState = global.S;
  global.SparkState = {
    getRoot: function() { return global.S; },
    read: function(path, fallback) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length; i++) {
        if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
        cursor = cursor[parts[i]];
      }
      return cursor == null ? fallback : cursor;
    },
    write: function(path, value) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length - 1; i++) {
        if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      return value;
    }
  };
  global.saveStateCalls = 0;
  global.saveState = function() { saveStateCalls++; };
  global.toasts = [];
  global.showToast = function(message) { toasts.push(message); };
  global.achievementChecks = 0;
  global.evaluateAchievements = function() { achievementChecks++; };
  global.skillPointAwards = 0;
  global.awardSkillPoint = function() { skillPointAwards++; };
}

function test(name, fn) {
  try {
    resetState();
    eval(loadJS("js/meta/levels.js"));
    eval(loadJS("js/meta/xp.js"));
    eval(loadJS("js/cloud/storage.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Shared XP Progression ---");

test("awardXP mirrors shared and legacy XP keys", function() {
  awardXP(15, "practice");

  assert.strictEqual(S.playerXP, 105);
  assert.strictEqual(S.xp, 105);
  assert.strictEqual(S.xpLog.length, 1);
  assert.strictEqual(S.xpLog[0].reason, "practice");
});

test("checkLevelUp falls back to shared xp and level keys", function() {
  S.xp = 300;
  S.level = 1;

  checkLevelUp();

  assert.strictEqual(S.playerLevel, 2);
  assert.strictEqual(S.level, 2);
  assert.ok(toasts.some(function(message) { return message.indexOf("Level Up! Level 2") >= 0; }));
  assert.strictEqual(achievementChecks, 1);
  assert.strictEqual(skillPointAwards, 1);
});

test("getLevelProgress falls back to shared xp and level keys", function() {
  S.xp = 150;
  S.level = 1;

  var progress = getLevelProgress();

  assert.ok(progress > 0);
  assert.ok(progress < 1);
});

test("cloud snapshot falls back to shared xp and level keys", function() {
  S.xp = 245;
  S.level = 4;

  var snapshot = buildCloudSnapshot();

  assert.strictEqual(snapshot.profile.playerXP, 245);
  assert.strictEqual(snapshot.profile.playerLevel, 4);
});

test("applyCloudSnapshot mirrors imported xp and level to shared keys", function() {
  applyCloudSnapshot({
    version: 1,
    profile: {
      playerXP: 410,
      playerLevel: 5,
      playerAchievements: {},
      playerStats: {}
    },
    progression: {},
    practice: {},
    planning: {},
    editor: {},
    devices: {},
    settings: {}
  });

  assert.strictEqual(S.playerXP, 410);
  assert.strictEqual(S.xp, 410);
  assert.strictEqual(S.playerLevel, 5);
  assert.strictEqual(S.level, 5);
});

if (process.exitCode) process.exit(process.exitCode);
