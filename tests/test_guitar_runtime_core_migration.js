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
    level: 2,
    lastChordName: "A",
    screen: "home",
    sessionMicros: [],
    selectedVoicing: 0,
    guidedSession: 2,
    metronomeOn: false
  };
  global.__sparkState = global.S;
  global.T = {};
  global.renderCalls = 0;
  global.saveStateCalls = 0;
  global.playedSounds = [];
  global.sparkCoreCalls = [];
  global.guidedNavigationCalls = [];
  global.confettiCalls = 0;
  global.bridgeCompletionCalls = [];
  global.intervalCallback = null;

  global.render = function() { renderCalls++; };
  global.saveState = function() { saveStateCalls++; };
  global.snd = function(name) { playedSounds.push(name); };
  global.trigC = function() { confettiCalls++; };
  global.stopMetronome = function() {};
  global.tickS = function() {};
  global.tickD = function() {};
  global.addPracticeSecond = function() {};
  global.setTimeout = function() { return 1; };
  global.setInterval = function(fn) { intervalCallback = fn; return 2; };
  global.clearTimeout = function() {};
  global.clearInterval = function() {};

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
            ALL_CHORDS: [
              { name: "E" },
              { name: "A" }
            ],
            FINGER_EXERCISES: [
              { id: "spider_walk", name: "Spider Walk", duration: 2 }
            ],
            SESSIONS: [
              { num: 1, title: "Guitar Session 1", bpm: 70, spark: { text: "start" }, newMove: { chord: "E" } },
              { num: 2, title: "Guitar Session 2", bpm: 80, spark: { text: "next" }, newMove: { chord: "A" } }
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
          title: "Guitar Session 2",
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

  global.window.sparkCore = {
    startLegacyPracticeSession: function(options) {
      sparkCoreCalls.push({ fn: "startLegacyPracticeSession", payload: options });
      if (options.mode === "drill") {
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
      return {
        context: {
          legacyPractice: {
            mode: options.mode || "quickStart",
            chord: { name: options.chordName || "E" },
            chordName: options.chordName || "E",
            durationSec: 120
          }
        }
      };
    },
    openLegacyPracticeSession: function(payload) {
      sparkCoreCalls.push({ fn: "openLegacyPracticeSession", payload: payload });
      return payload;
    },
    openLegacyPracticeDrill: function(payload) {
      sparkCoreCalls.push({ fn: "openLegacyPracticeDrill", payload: payload });
      return payload;
    },
    syncLegacyPracticeRuntimeState: function(action, payload) {
      sparkCoreCalls.push({ fn: "syncLegacyPracticeRuntimeState", action: action, payload: payload });
      return payload;
    },
    openLegacyFingerExercise: function(payload) {
      sparkCoreCalls.push({ fn: "openLegacyFingerExercise", payload: payload });
      return payload;
    },
    completeLegacyFingerExercise: function(payload) {
      sparkCoreCalls.push({ fn: "completeLegacyFingerExercise", payload: payload });
      return payload;
    }
  };

  global.SparkProgressBridge = {
    applyLegacyActivityCompletion: function(payload) {
      bridgeCompletionCalls.push(payload);
      if (payload.incrementFields) {
        Object.keys(payload.incrementFields).forEach(function(key) {
          S[key] = (S[key] || 0) + payload.incrementFields[key];
        });
      }
      if (payload.resultFields) {
        Object.keys(payload.resultFields).forEach(function(key) {
          S[key] = payload.resultFields[key];
        });
      }
      if (typeof payload.xpDelta === "number") S.xp = (S.xp || 0) + payload.xpDelta;
      if (payload.toastAmount) S.xpToast = { amount: payload.toastAmount, time: 1, jackpot: !!payload.jackpot };
      if (payload.save !== false) saveState();
      return payload;
    }
  };
}

resetState();
eval(loadJS("js/instruments/guitar/app.js"));

console.log("\n--- Guitar Runtime Core Migration ---");

test("quickStart delegates legacy practice session launch through sparkCore helpers", function() {
  guitarAct("quickStart");

  assert.deepStrictEqual(sparkCoreCalls, [
    { fn: "startLegacyPracticeSession", payload: { mode: "quickStart", level: 2 } },
    { fn: "openLegacyPracticeSession", payload: { mode: "quickStart", chordName: "E", durationSec: 120 } }
  ]);
  assert.strictEqual(S.lastChordName, "E");
  assert.strictEqual(S.currentChord.name, "E");
  assert.strictEqual(S.timer, 120);
  assert.strictEqual(S.timerActive, true);
  assert.strictEqual(S.screen, "session");
  assert.strictEqual(saveStateCalls, 1);
});

test("startSession and resumeSession delegate chord launches through sparkCore helpers", function() {
  guitarAct("startSession", "E");
  guitarAct("resumeSession");

  assert.deepStrictEqual(sparkCoreCalls, [
    { fn: "startLegacyPracticeSession", payload: { mode: "chord", chordName: "E" } },
    { fn: "openLegacyPracticeSession", payload: { mode: "chord", chordName: "E", durationSec: 120 } },
    { fn: "startLegacyPracticeSession", payload: { mode: "chord", chordName: "E" } },
    { fn: "openLegacyPracticeSession", payload: { mode: "chord", chordName: "E", durationSec: 120 } }
  ]);
  assert.strictEqual(S.currentChord.name, "E");
  assert.strictEqual(S.timer, 120);
  assert.strictEqual(S.screen, "session");
});

test("startDrill delegates drill launch through sparkCore helpers", function() {
  guitarAct("startDrill");

  assert.deepStrictEqual(sparkCoreCalls, [
    { fn: "startLegacyPracticeSession", payload: { mode: "drill", level: 2 } },
    { fn: "openLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
  assert.deepStrictEqual(S.drillChords, [{ name: "E" }, { name: "A" }]);
  assert.strictEqual(S.drillTimer, 60);
  assert.strictEqual(S.screen, "drill");
});

test("guidedStart delegates to shared guided session helper", function() {
  guitarAct("guidedStart", "2");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openGuidedSession");
  assert.strictEqual(sparkCoreCalls[0].payload.sessionNum, 2);
  assert.strictEqual(S.screen, "guided");
  assert.strictEqual(saveStateCalls, 1);
});

test("guidedComplete delegates to shared completion and guided navigation helpers", function() {
  S.screen = "guided";

  guitarAct("guidedComplete");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "completeGuidedSession");
  assert.deepStrictEqual(guidedNavigationCalls, ["guided_done"]);
  assert.strictEqual(S.screen, "guided_done");
  assert.ok(playedSounds.indexOf("levelup") >= 0);
  assert.strictEqual(confettiCalls, 1);
});

test("drillTransition reuses shared drill runtime helper", function() {
  guitarAct("drillTransition", "E|A");

  assert.deepStrictEqual(sparkCoreCalls, [
    { fn: "openLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
  assert.strictEqual(S.screen, "drill");
  assert.strictEqual(S.drillTimer, 60);
});

test("finger exercise completion mirrors runtime through core and bridge helpers", function() {
  S.fingerStats = {};

  guitarAct("startFingerEx", "spider_walk");
  assert.strictEqual(typeof intervalCallback, "function");

  intervalCallback();
  intervalCallback();

  assert.deepStrictEqual(sparkCoreCalls, [
    { fn: "openLegacyFingerExercise", payload: { exerciseId: "spider_walk", durationSec: 2, exerciseCount: 0 } },
    { fn: "syncLegacyPracticeRuntimeState", action: "tick", payload: {
      mode: "finger_exercise",
      remainingSec: 1,
      durationSec: 2,
      timerActive: true,
      fingerExerciseId: "spider_walk",
      fingerExerciseActive: true,
      fingerExerciseCount: 0
    } },
    { fn: "syncLegacyPracticeRuntimeState", action: "tick", payload: {
      mode: "finger_exercise",
      remainingSec: 0,
      durationSec: 2,
      timerActive: true,
      fingerExerciseId: "spider_walk",
      fingerExerciseActive: true,
      fingerExerciseCount: 0
    } },
    { fn: "completeLegacyFingerExercise", payload: { exerciseId: "spider_walk", durationSec: 2, exerciseCount: 1 } }
  ]);
  assert.strictEqual(bridgeCompletionCalls.length, 1);
  assert.strictEqual(bridgeCompletionCalls[0].xpDelta, 10);
  assert.strictEqual(bridgeCompletionCalls[0].toastAmount, 10);
  assert.deepStrictEqual(bridgeCompletionCalls[0].incrementFields, { fingerExCount: 1 });
  assert.strictEqual(S.fingerExCount, 1);
  assert.strictEqual(S.fingerStats.spider_walk, 1);
  assert.strictEqual(S.xpToast.amount, 10);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
