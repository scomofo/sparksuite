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
  global.toasts = [];
  global.sparkCoreCalls = [];
  global.guidedNavigationCalls = [];
  global.legacyPracticeCalls = [];
  global.confettiCalls = 0;
  global.bridgeCompletionCalls = [];

  global.render = function() { renderCalls++; };
  global.saveState = function() { saveStateCalls++; };
  global.snd = function(name) { playedSounds.push(name); };
  global.showToast = function(msg) { toasts.push(msg); };
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
            ALL_CHORDS: [
              { name: "E" },
              { name: "A" }
            ],
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
  global.__sparkState = global.S;

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
    syncLegacyGuidedSession: function(plan, sessionNum) {
      sparkCoreCalls.push({ fn: "syncLegacyGuidedSession", payload: { plan: plan, sessionNum: sessionNum } });
      S.guidedPlan = plan;
      S.guidedSession = sessionNum;
      S.guidedStep = "spark";
      S.newMovePhase = null;
      S.guidedPaused = false;
      return plan;
    },
    applyLegacySessionStatePatch: function(payload) {
      sparkCoreCalls.push({ fn: "applyLegacySessionStatePatch", payload: payload });
      if (payload && payload.guided) {
        if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
        (payload.guided.completedSessionNums || []).forEach(function(num) {
          if (S.completedGuidedSessions.indexOf(num) < 0) S.completedGuidedSessions.push(num);
        });
        if (typeof payload.guided.nextGuidedSession === "number") S.guidedSession = payload.guided.nextGuidedSession;
      }
      return payload;
    },
    applyLegacyActivityCompletion: function(payload) {
      sparkCoreCalls.push({ fn: "applyLegacyActivityCompletion", payload: payload });
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
      if (payload.toastAmount) S.xpToast = { amount: payload.toastAmount, time: 1, jackpot: !!payload.jackpot };
      if (payload.save !== false) saveState();
      return payload;
    }
  };

  global.SparkStateBridge = {
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
    },
    applySessionStatePatch: function(payload) {
      if (payload && payload.guided) {
        if (Array.isArray(payload.guided.completedSessionNums)) {
          payload.guided.completedSessionNums.forEach(function(num) {
            if (S.completedGuidedSessions.indexOf(num) < 0) S.completedGuidedSessions.push(num);
          });
        }
        if (typeof payload.guided.nextGuidedSession === "number") S.guidedSession = payload.guided.nextGuidedSession;
      }
      return payload;
    }
  };
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

test("guidedStart fallback prefers sparkCore legacy guided sync helper", function() {
  global.openGuidedSessionRequest = null;

  bassAct("guidedStart", "2");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "syncLegacyGuidedSession");
  assert.strictEqual(sparkCoreCalls[0].payload.sessionNum, 2);
  assert.strictEqual(S.guidedPlan.num, 2);
  assert.strictEqual(S.screen, "guided");
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

  assert.deepStrictEqual(sparkCoreCalls.slice(0, 4), [
    { fn: "startLegacyPracticeSession", payload: { mode: "quickStart", level: 2 } },
    { fn: "openLegacyPracticeSession", payload: { mode: "quickStart", chordName: "E", durationSec: 120 } },
    { fn: "startLegacyPracticeSession", payload: { mode: "drill", level: 2 } },
    { fn: "openLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
  assert.deepStrictEqual(legacyPracticeCalls, []);
  assert.strictEqual(S.lastChordName, "E");
  assert.strictEqual(S.timer, 120);
  assert.strictEqual(S.drillTimer, 60);
  assert.strictEqual(S.screen, "drill");
});

test("quickStart resolves a chord object when legacy context only provides chordName", function() {
  window.sparkCore.startLegacyPracticeSession = function(options) {
    sparkCoreCalls.push({ fn: "startLegacyPracticeSession", payload: options });
    return {
      context: {
        legacyPractice: {
          mode: options.mode || "quickStart",
          chordName: "E",
          durationSec: 120
        }
      }
    };
  };

  bassAct("quickStart");

  assert.strictEqual(S.currentChord && S.currentChord.name, "E");
  assert.strictEqual(S.screen, "session");
});

test("startDrill hydrates chord names into bass chord objects", function() {
  window.sparkCore.startLegacyPracticeSession = function(options) {
    sparkCoreCalls.push({ fn: "startLegacyPracticeSession", payload: options });
    return {
      context: {
        legacyPractice: {
          mode: "drill",
          chordNames: ["E", "A"],
          durationSec: 60
        }
      }
    };
  };

  bassAct("startDrill");

  assert.deepStrictEqual(S.drillChords, [{ name: "E" }, { name: "A" }]);
  assert.strictEqual(S.screen, "drill");
});

test("startDrill falls back to the instrument chord pool when sparkCore drill plan is sparse", function() {
  window.sparkCore.startLegacyPracticeSession = function(options) {
    sparkCoreCalls.push({ fn: "startLegacyPracticeSession", payload: options });
    return {
      context: {
        legacyPractice: {
          mode: "drill",
          chordNames: [],
          durationSec: 60
        }
      }
    };
  };

  bassAct("startDrill");

  assert.deepStrictEqual(S.drillChords, [{ name: "E" }, { name: "A" }]);
  assert.strictEqual(S.screen, "drill");
});

test("quickStart and drill entry surface feedback when legacy practice builders return no session", function() {
  window.sparkCore.startLegacyPracticeSession = function(options) {
    sparkCoreCalls.push({ fn: "startLegacyPracticeSession", payload: options });
    return null;
  };

  bassAct("quickStart");
  bassAct("startDrill");

  assert.deepStrictEqual(toasts, [
    "That practice item couldn't be started right now.",
    "That practice item couldn't be started right now."
  ]);
  assert.strictEqual(S.screen, "home");
});

test("legacy practice replay actions delegate to shared retry helpers", function() {
  S.currentChord = { name: "A" };
  S.timer = 120;
  S.drillChords = [{ name: "E" }, { name: "A" }];
  S.drillTimer = 60;

  bassAct("repeatLegacyPracticeSession");
  bassAct("repeatLegacyPracticeDrill");

  assert.deepStrictEqual(legacyPracticeCalls.slice(0, 2), [
    { fn: "repeatLegacyPracticeSession", payload: { mode: "chord", chordName: "A", durationSec: 120 } },
    { fn: "repeatLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
  assert.deepStrictEqual(sparkCoreCalls.slice(0, 4), [
    { fn: "startLegacyPracticeSession", payload: { mode: "chord", chordName: "A" } },
    { fn: "openLegacyPracticeSession", payload: { mode: "chord", chordName: "A", durationSec: 120 } },
    { fn: "startLegacyPracticeSession", payload: { mode: "drill", level: 2 } },
    { fn: "openLegacyPracticeDrill", payload: { durationSec: 60, chordNames: ["E", "A"] } }
  ]);
});

test("guidedComplete fallback uses local bookkeeping when sparkCore helper is unavailable", function() {
  S.screen = "guided";
  S.guidedPlan = { num: 2, newMove: { chord: "A" } };
  global.completeGuidedSessionRequest = null;
  global.applyGuidedNavigationRequest = null;
  global.window.sparkCore.completeSession = null;
  global.window.sparkCore.applyLegacySessionStatePatch = null;
  global.window.sparkCore.applyLegacyActivityCompletion = null;

  bassAct("guidedComplete");

  assert.strictEqual(bridgeCompletionCalls.length, 0);
  assert.deepStrictEqual(S.completedGuidedSessions, [2]);
  assert.strictEqual(S.guidedSession, 2);
  assert.strictEqual(S.xpToast.amount, 30);
  assert.strictEqual(S.screen, "guided_done");
  assert.strictEqual(confettiCalls, 1);
});

test("guidedComplete fallback prefers sparkCore legacy completion helpers", function() {
  S.screen = "guided";
  S.guidedPlan = { num: 2, newMove: { chord: "A" } };
  global.completeGuidedSessionRequest = null;
  global.applyGuidedNavigationRequest = null;
  global.window.sparkCore.completeSession = null;
  global.SparkStateBridge.applyLegacyActivityCompletion = function(payload) {
    bridgeCompletionCalls.push(payload);
    return payload;
  };

  bassAct("guidedComplete");

  assert.strictEqual(sparkCoreCalls[0].fn, "applyLegacySessionStatePatch");
  assert.strictEqual(sparkCoreCalls[1].fn, "applyLegacyActivityCompletion");
  assert.strictEqual(bridgeCompletionCalls.length, 0);
  assert.strictEqual(S.xpToast.amount, 30);
  assert.strictEqual(S.screen, "guided_done");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
