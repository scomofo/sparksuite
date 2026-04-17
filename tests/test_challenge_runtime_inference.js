var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    resetEnv();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function resetEnv() {
  global.window = global;
  global.APP_NAME = "ChordSpark";
  global.S = {
    activeChallenges: []
  };
  global.saveState = function() {};
  var idCounter = 0;
  global.generateId = function(prefix) {
    idCounter += 1;
    return prefix + "_" + idCounter;
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "ukespark" };
    },
    getAll: function() {
      return [
        { id: "ukespark", appId: "ukespark", instrument: "ukulele" }
      ];
    }
  };
}

console.log("\n--- Challenge Runtime Inference ---");

test("buildDefaultDailyChallenges keeps shared non-piano shells on the stringed challenge path", function() {
  global.eval(loadJS("js/meta/challenge_rules.js"));
  var challenges = buildDefaultDailyChallenges();

  assert.strictEqual(challenges[2].type, "weak_transition_focus");
  assert.strictEqual(challenges[2].title, "Fix a Weak Transition");
});

test("initializeChallengesForCurrentCycle resolves thin active instruments before challenge generation", function() {
  global.eval(loadJS("js/meta/challenge_rules.js"));
  global.eval(loadJS("js/meta/challenge_engine.js"));

  var challenges = initializeChallengesForCurrentCycle();

  assert.strictEqual(challenges.length, 6);
  assert.strictEqual(challenges[2].type, "weak_transition_focus");
});

test("challenge inference falls back to APP_NAME for non-guitar shells", function() {
  global.APP_NAME = "BassSpark";
  SparkInstruments.getActive = function() {
    return null;
  };
  global.eval(loadJS("js/meta/challenge_rules.js"));

  var challenges = buildDefaultDailyChallenges();

  assert.strictEqual(challenges[2].type, "weak_transition_focus");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
