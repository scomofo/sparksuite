var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.APP_NAME = "SparkSuite";
  global.S = {
    activeInstrument: "pianospark",
    activeChallenges: []
  };
  global.__sparkState = global.S;
  global.saved = 0;
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
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "pianospark",
        instrument: "piano"
      };
    }
  };
  global.generateId = function(prefix) {
    return prefix + "_1";
  };
  global.saveState = function() {
    global.saved++;
  };
}

function test(name, fn) {
  try {
    resetState();
    eval(loadJS("js/meta/challenge_rules.js"));
    eval(loadJS("js/meta/challenge_engine.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Challenge Instrument Inference ---");

test("default challenge builders infer piano from the active instrument", function() {
  var daily = buildDefaultDailyChallenges();

  assert.strictEqual(daily[2].title, "Practice Left Hand");
  assert.strictEqual(daily[2].type, "left_hand_focus");
});

test("challenge initialization seeds piano challenges in the shared app shell", function() {
  var challenges = initializeChallengesForCurrentCycle();

  assert.strictEqual(challenges[2].title, "Practice Left Hand");
  assert.strictEqual(challenges[2].type, "left_hand_focus");
  assert.strictEqual(global.S.activeChallenges[2].type, "left_hand_focus");
  assert.strictEqual(global.saved, 1);
});

test("challenge initialization infers bass from thin active instrument ids before app defaults", function() {
  var originalBuildDailyChallenges = buildDefaultDailyChallenges;
  var originalBuildWeeklyChallenges = buildDefaultWeeklyChallenges;
  var capturedAppType = null;
  global.S.activeInstrument = "bassspark";
  global.SparkInstruments.getActive = function() {
    return {
      id: "bassspark",
      appId: "bassspark"
    };
  };
  buildDefaultDailyChallenges = function(appType) {
    capturedAppType = appType;
    return originalBuildDailyChallenges(appType);
  };
  buildDefaultWeeklyChallenges = function(appType) {
    return originalBuildWeeklyChallenges(appType);
  };

  initializeChallengesForCurrentCycle();

  buildDefaultDailyChallenges = originalBuildDailyChallenges;
  buildDefaultWeeklyChallenges = originalBuildWeeklyChallenges;
  assert.strictEqual(capturedAppType, "bass");
});

test("challenge initialization falls back to global S when SparkState.getRoot returns null", function() {
  global.SparkState = { getRoot: function() { return null; } };

  var challenges = initializeChallengesForCurrentCycle();

  assert.strictEqual(challenges[2].title, "Practice Left Hand");
  assert.strictEqual(global.S.activeChallenges[2].type, "left_hand_focus");
  assert.strictEqual(global.saved, 1);
});

if (process.exitCode) process.exit(process.exitCode);
