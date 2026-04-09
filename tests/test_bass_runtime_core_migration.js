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
  global.legacyPracticeCalls = [];
  global.legacyStartCalls = [];
  global.confettiCalls = 0;

  global.render = function() { renderCalls++; };
  global.saveState = function() { saveStateCalls++; };
  global.snd = function(name) { playedSounds.push(name); };
  global.trigC = function() { confettiCalls++; };
  global.stopMetronome = function() {};

  global.SCR = {
    SESSION: "session",
    DRILL: "drill",
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

  global.openLegacyPracticeSessionRequest = function(payload) {
    legacyPracticeCalls.push({ fn: "openLegacyPracticeSession", payload: payload });
    return payload;
  };

  global.openLegacyPracticeDrillRequest = function(payload) {
    legacyPracticeCalls.push({ fn: "openLegacyPracticeDrill", payload: payload });
    return payload;
  };

  global.repeatLegacyPracticeSessionRequest = function(payload) {
    legacyPracticeCalls.push({ fn: "repeatLegacyPracticeSession", payload: payload });
    return payload;
  };

  global.repeatLegacyPracticeDrillRequest = function(payload) {
    legacyPracticeCalls.push({ fn: "repeatLegacyPracticeDrill", payload: payload });
    return payload;
  };

  global.applyGuidedNavigationRequest = function(target) {
    guidedNavigationCalls.push(target);
    return { activeScreen: "guided_done" };
  };

  global.sparkCore = {
    startSession: function(payload) {
      legacyStartCalls.push(payload);
      if (payload.mode === "quickStart") {
        return {
          context: {
            legacyPractice: {
              mode: "quickStart",
              chordName: "E",
              chord: { name: "E" },
              durationSec: 120
            }
          }
        };
      }
      if (payload.mode === "chord") {
        return {
          context: {
            legacyPractice: {
              mode: "chord",
              chordName: payload.chordName || "A",
              chord: { name: payload.chordName || "A" },
              durationSec: 120
            }
          }
        };
      }
      if (payload.mode === "drill") {
        return {
          context: {
            legacyPractice: {
              mode: "drill",
              chords: [{ name: "E" }, { name: "A" }],
              chordNames: ["E", "A"],
              durationSec: 60
            }
          }
        };
      }
      return null;
    }
  };

  global.SparkProgressBridge = null;
  global.SparkSession = {
    buildSession: function(options) {
      if (options.mode === "quickStart") {
        return { chordName: "E", chord: { name: "E" }, duration: 120 };
      }
      if (options.mode === "chord") {
        return { chordName: options.chordName || "A", chord: { name: options.chordName || "A" }, duration: 120 };
      }
      if (options.mode === "drill") {
        return { chords: [{ name: "E" }, { name: "A" }], duration: 60 };
      }
      return null;
    },
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

test("quickStart and drill entry delegate to shared legacy practice helpers", function() {
  bassAct("quickStart");
  bassAct("startDrill");

  assert.deepStrictEqual(legacyStartCalls, [
    { mode: "quickStart", level: undefined },
    { mode: "drill", level: undefined }
  ]);
  assert.deepStrictEqual(legacyPracticeCalls, [
    { fn: "openLegacyPracticeSession", payload: { mode: "quickStart", chordName: "E", durationSec: 120 } },
    { fn: "openLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
  assert.strictEqual(S.screen, "drill");
});

test("legacy practice replay actions delegate to shared retry helpers", function() {
  S.currentChord = { name: "A" };
  S.timer = 120;
  S.drillChords = [{ name: "E" }, { name: "A" }];
  S.drillTimer = 60;

  bassAct("repeatLegacyPracticeSession");
  bassAct("repeatLegacyPracticeDrill");

  assert.deepStrictEqual(legacyStartCalls, [
    { mode: "chord", chordName: "A", level: undefined },
    { mode: "drill", level: undefined }
  ]);
  assert.deepStrictEqual(legacyPracticeCalls.slice(0, 4), [
    { fn: "repeatLegacyPracticeSession", payload: { mode: "chord", chordName: "A", durationSec: 120 } },
    { fn: "openLegacyPracticeSession", payload: { mode: "chord", chordName: "A", durationSec: 120 } },
    { fn: "repeatLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } },
    { fn: "openLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
