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
  global.S = {
    onboarding: {
      instrument: "bass",
      skillLevel: "beginner",
      starterContentUnlocked: false
    }
  };
  global.saveState = function() {};
  global.unlockCalls = [];
  global.unlockContent = function(kind, id) {
    unlockCalls.push({ kind: kind, id: id });
  };
}

console.log("\n--- Onboarding Starter Unlocks ---");

test("applyStarterUnlocksFromOnboarding seeds bass beginner content", function() {
  global.eval(loadJS("js/onboarding/actions.js"));
  applyStarterUnlocksFromOnboarding();

  var unlockedIds = unlockCalls.map(function(call) { return call.id; });
  assert.ok(unlockedIds.indexOf("bass_level_1") >= 0);
  assert.ok(unlockedIds.indexOf("bass_level_2") >= 0);
  assert.strictEqual(S.onboarding.starterContentUnlocked, true);
});

test("applyStarterUnlocksFromOnboarding seeds bass early intermediate content", function() {
  S.onboarding.skillLevel = "early_intermediate";
  global.eval(loadJS("js/onboarding/actions.js"));
  applyStarterUnlocksFromOnboarding();

  var unlockedIds = unlockCalls.map(function(call) { return call.id; });
  assert.ok(unlockedIds.indexOf("bass_level_3") >= 0);
  assert.ok(unlockedIds.indexOf("bass_level_4") >= 0);
  assert.ok(unlockedIds.indexOf("bass_level_5") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
