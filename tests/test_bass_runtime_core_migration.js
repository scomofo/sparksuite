var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    guidedSession: 2,
    screen: "home",
    metronomeOn: false,
    completedGuidedSessions: [],
    xpToast: null
  };
  global.T = {};
  global.renderCalls = 0;
  global.saveStateCalls = 0;
  global.playedSounds = [];
  global.sparkCoreCalls = [];
  global.guidedNavigationCalls = [];
  global.confettiCalls = 0;

  global.render = function() { renderCalls++; };
  global.saveState = function() { saveStateCalls++; };
  global.snd = function(name) { playedSounds.push(name); };
  global.trigC = function() { confettiCalls++; };
  global.stopMetronome = function() {};

  global.SCR = {
    GUIDED: "guided",
    GUIDED_DONE: "guided_done"
  };

  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            SESSIONS: [
              { num: 1, title: "Bass Session 1", bpm: 70, spark: { text: "start" }, newMove: { chord: "E" } },
              { num: 2, title: "Bass Session 2", bpm: 80, spark: { text: "next" }, newMove: { chord: "A" } }
            ]
          };
        }
      };
    }
  };

  global.openGuidedSessionRequest = function(payload) {
    sparkCoreCalls.push({ fn: "openGuidedSession", payload: payload });
    return {
      context: {
        guidedSession: 2,
        guidedPlan: {
          num: 2,
          title: "Bass Session 2",
          bpm: 80,
          spark: { text: "next" },
          newMove: { chord: "A" }
        }
      }
    };
  };

  global.completeGuidedSessionRequest = function(payload) {
    sparkCoreCalls.push({ fn: "completeGuidedSession", payload: payload || {} });
    return { audioCue: "levelup" };
  };

  global.applyGuidedNavigationRequest = function(target) {
    guidedNavigationCalls.push(target);
    return { activeScreen: "guided_done" };
  };

  global.SparkProgressBridge = null;
  global.SparkSession = {
    processResults: function() {
      return { xpEarned: 30, jackpot: false, leveledUp: false };
    }
  };
}

resetState();
eval(loadJS("js/instruments/bass/app.js"));

console.log("\n--- Bass Runtime Core Migration ---");

test("guidedStart delegates to shared guided session helper", function() {
  bassAct("guidedStart", "2");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openGuidedSession");
  assert.strictEqual(sparkCoreCalls[0].payload.sessionNum, 2);
  assert.strictEqual(S.screen, "guided");
  assert.strictEqual(saveStateCalls, 1);
});

test("guidedComplete delegates to shared completion and guided navigation helpers", function() {
  S.screen = "guided";

  bassAct("guidedComplete");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "completeGuidedSession");
  assert.deepStrictEqual(guidedNavigationCalls, ["guided_done"]);
  assert.strictEqual(S.screen, "guided_done");
  assert.ok(playedSounds.indexOf("levelup") >= 0);
  assert.strictEqual(confettiCalls, 1);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
