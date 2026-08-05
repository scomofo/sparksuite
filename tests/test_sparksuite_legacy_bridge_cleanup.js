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
    practicePlan: null,
    practicePlanDate: null,
    practicePlanHistory: [],
    practicePlanComplete: false,
    practiceHistory: [],
    xp: 0,
    xpToast: null,
    practiceStreak: 0,
    totalPracticeMinutes: 0,
    todayPracticeMinutes: 0,
    lastPracticeDate: null,
    weakSpots: {},
    adaptiveState: {},
    drillCount: 0,
    dailyDone: 0,
    dailyComplete: false,
    earTrainAns: null,
    earTrainTotal: 0,
    earTrainScore: 0,
    earTrainStreak: 0,
    songsPlayed: 0,
    songPlaying: false,
    songBeat: 0,
    runnerHighScore: 0,
    runnerResults: null
  };
  global.T = {};
  global.SparkSessionTypes = {
    FLOW_DAILY_PRACTICE: "daily_practice"
  };
  global.sparkCoreCalls = [];
  global.sparkCore = {
    startSession: function(payload) {
      sparkCoreCalls.push({ fn: "startSession", payload: payload });
      return {
        toLegacyPracticePlan: function() {
          return {
            id: "plan_1",
            flow: "daily_practice",
            items: [{ id: "warmup_1" }],
            totalItems: 1,
            completedItems: 0
          };
        }
      };
    },
    completeSession: function(payload) {
      sparkCoreCalls.push({ fn: "completeSession", payload: payload });
      return { ok: true, itemId: payload.itemId || null };
    }
  };
  global.getTopWeakSpots = function() {
    return { transitions: [], rhythm: [], phrases: [] };
  };
  global.applyAdaptiveToExercise = function(exercise) { return exercise; };
  global.sparkEvents = [];
  global.badgeChecks = 0;
  global.clearedIntervals = [];
  global.clearedTimeouts = [];
  global.canceledAnimationFrames = [];
  global.logHistory = function() {};
  global._sparkEmit = function(type, payload) { sparkEvents.push({ type: type, payload: payload }); };
  global.checkBadges = function() { badgeChecks++; };
  global.saveState = function() {};
  global.clearInterval = function(id) { clearedIntervals.push(id); };
  global.clearTimeout = function(id) { clearedTimeouts.push(id); };
  global.cancelAnimationFrame = function(id) { canceledAnimationFrames.push(id); };
}

resetState();

eval(loadJS("js/sparksuite/bridges/progress_bridge.js"));
eval(loadJS("js/practice/progress.js"));
global.Math.random = function() { return 1; };
// Load the real orchestrator (processResults delegates its absorbed session
// progression sequence to it), then stub only the evaluateAll cascade.
eval(loadJS("js/spark-core/progress-orchestrator.js"));
global.SparkProgressOrchestrator.evaluateAll = function() { return { newAchievements: [] }; };
global.SparkInstruments = {
  getActive: function() {
    return {
      getData: function() {
        return {
          CHORDS: { 1: [{ name: "E Major" }] }
        };
      }
    };
  }
};
eval(loadJS("js/performance/practice_engine.js"));
var performanceGeneratePracticePlan = generatePracticePlan;
var performanceMarkPracticePlanItem = markPracticePlanItem;
eval(loadJS("js/spark-core/session-engine.js"));
eval(loadJS("js/practice/weakspots.js"));
eval(loadJS("js/practice/adaptive.js"));

eval(loadJS("js/practice/plan.js"));
var legacyGenerateDailyPracticePlan = generateDailyPracticePlan;
var legacyCompletePracticeItem = completePracticeItem;
var legacyGetNextPracticeItem = getNextPracticeItem;
var legacyGenerateWeeklyPracticePlan = generateWeeklyPracticePlan;
eval(loadJS("js/practice/engine.js"));

console.log("\n--- SparkSuite Legacy Cleanup ---");

test("performance practice generator delegates to sparkCore when available", function() {
  var plan = performanceGeneratePracticePlan();

  assert.ok(plan);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSession");
  assert.strictEqual(sparkCoreCalls[0].payload.flow, "daily_practice");
});

test("performance practice item completion delegates to sparkCore when available", function() {
  var result = performanceMarkPracticePlanItem("warmup_1");

  assert.ok(result);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "completeSession");
  assert.strictEqual(sparkCoreCalls[0].payload.itemId, "warmup_1");
});

test("legacy daily practice generator delegates to sparkCore when available", function() {
  var plan = legacyGenerateDailyPracticePlan();

  assert.ok(plan);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSession");
  assert.strictEqual(sparkCoreCalls[0].payload.flow, "daily_practice");
});

test("legacy daily practice completion delegates item result handling to sparkCore", function() {
  var result = legacyCompletePracticeItem("transition_1", { accuracy: 0.75 });

  assert.ok(result);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "completeSession");
  assert.strictEqual(sparkCoreCalls[0].payload.itemId, "transition_1");
  assert.strictEqual(sparkCoreCalls[0].payload.result.accuracy, 0.75);
});

test("legacy daily practice generator defers to shared ensurePracticePlan when available", function() {
  var plan = legacyGenerateDailyPracticePlan();

  assert.ok(plan);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSession");
  assert.strictEqual(sparkCoreCalls[0].payload.flow, "daily_practice");
});

test("legacy getNextPracticeItem stays read-only when no daily plan exists", function() {
  S.practicePlan = null;

  var next = legacyGetNextPracticeItem();

  assert.strictEqual(next, null);
  assert.strictEqual(sparkCoreCalls.length, 0);
});

test("legacy weekly practice generation preserves the current daily plan snapshot", function() {
  S.practicePlan = {
    date: "2026-04-17",
    items: [{ id: "existing_daily", completed: false }]
  };
  S.practicePlanDate = "2026-04-17";
  S.practicePlanComplete = true;

  var weekly = legacyGenerateWeeklyPracticePlan();

  assert.ok(weekly);
  assert.strictEqual(Array.isArray(weekly.days), true);
  assert.strictEqual(weekly.days.length, 7);
  assert.deepStrictEqual(S.practicePlan, {
    date: "2026-04-17",
    items: [{ id: "existing_daily", completed: false }]
  });
  assert.strictEqual(S.practicePlanDate, "2026-04-17");
  assert.strictEqual(S.practicePlanComplete, true);
});

test("performance practice generator defers to shared ensurePracticePlan when available", function() {
  var plan = performanceGeneratePracticePlan();

  assert.ok(plan);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSession");
  assert.strictEqual(sparkCoreCalls[0].payload.flow, "daily_practice");
});

test("progress bridge legacy reward helper centralizes xp and toast updates", function() {
  var reward = SparkProgressBridge.applyLegacyReward({ xpDelta: 12, toastAmount: 12, jackpot: true });

  assert.strictEqual(reward.xpDelta, 12);
  assert.strictEqual(S.xp, 12);
  assert.strictEqual(S.xpToast.amount, 12);
  assert.strictEqual(S.xpToast.jackpot, true);
});

test("practice progress recorder delegates session bookkeeping to the bridge", function() {
  recordPracticeSession({ id: "practice_1", durationMin: 7 });

  assert.strictEqual(S.practiceHistory.length, 1);
  assert.strictEqual(S.practiceHistory[0].id, "practice_1");
  assert.ok(S.practiceHistory[0].ts);
  assert.strictEqual(S.totalPracticeMinutes, 7);
  assert.strictEqual(S.todayPracticeMinutes, 7);
  assert.strictEqual(S.practiceStreak, 1);
});

test("spark session processResults delegates session progression writes to the bridge", function() {
  S.level = 1;
  S.streak = 0;
  S.sessions = 0;
  S.xp = 0;
  S.chordProgress = {};
  S.lastSessionDate = null;

  var outcome = SparkSession.processResults({
    type: "session",
    chordName: "E Major",
    duration: 120
  });

  assert.strictEqual(outcome.xpEarned, 10);
  assert.strictEqual(S.sessions, 1);
  assert.strictEqual(S.streak, 1);
  assert.strictEqual(S.xp, 10);
  assert.strictEqual(S.chordProgress["E Major"], 34);
  assert.strictEqual(S.lastSessionDate, new Date().toISOString().slice(0, 10));
});

test("practice weak-spot updater delegates to bridge helper", function() {
  updateWeakSpotsFromPerformance({
    transitions: { "G->C": 0.61 },
    phrases: [{ id: "phrase_2", accuracy: 0.55 }]
  });

  assert.strictEqual(S.weakSpots.transitions["G->C"].attempts, 1);
  assert.strictEqual(S.weakSpots.phrases["phrase_2"].attempts, 1);
});

test("practice adaptive updater delegates to bridge helper", function() {
  updateAdaptiveFromResult({ exerciseId: "rhythm_1", accuracy: 0.82 });

  assert.strictEqual(S.adaptiveState.rhythm_1.accuracy, 0.82);
  assert.ok(S.adaptiveState.rhythm_1.ts);
});

test("legacy activity completion helper centralizes drill and daily bookkeeping", function() {
  SparkProgressBridge.applyLegacyActivityCompletion({
    xpDelta: 20,
    toastAmount: 20,
    incrementFields: { drillCount: 1 },
    history: { type: "drill", detail: "E / A", xp: 20 },
    emit: { type: "practice_session_completed", payload: { type: "drill" } },
    checkBadges: true
  });

  SparkProgressBridge.applyLegacyActivityCompletion({
    xpDelta: 40,
    toastAmount: 40,
    setFlags: { dailyComplete: true },
    incrementFields: { dailyDone: 1 },
    history: { type: "daily", detail: "Challenge", xp: 40 },
    checkBadges: true
  });

  assert.strictEqual(S.xp, 60);
  assert.strictEqual(S.drillCount, 1);
  assert.strictEqual(S.dailyDone, 1);
  assert.strictEqual(S.dailyComplete, true);
  assert.strictEqual(S.xpToast.amount, 40);
  assert.strictEqual(badgeChecks, 2);
});

test("legacy activity completion helper centralizes runner bookkeeping", function() {
  SparkProgressBridge.applyLegacyActivityCompletion({
    xpDelta: 15,
    maxFields: { runnerHighScore: 120 },
    resultFields: { runnerResults: { score: 120, maxCombo: 8, distance: 42 } },
    history: { type: "runner", detail: "Score: 120", xp: 15 }
  });

  assert.strictEqual(S.xp, 15);
  assert.strictEqual(S.runnerHighScore, 120);
  assert.deepStrictEqual(S.runnerResults, { score: 120, maxCombo: 8, distance: 42 });
});

test("legacy activity completion helper centralizes ear training and song bookkeeping", function() {
  SparkProgressBridge.applyLegacyActivityCompletion({
    xpDelta: 15,
    incrementFields: { earTrainScore: 1, earTrainStreak: 1 },
    history: { type: "ear", detail: "C Major", xp: 15 },
    checkBadges: true
  });

  SparkProgressBridge.applyLegacyActivityCompletion({
    xpDelta: 40,
    incrementFields: { songsPlayed: 1 },
    history: { type: "song", detail: "Fire Road", xp: 40 },
    emit: { type: "lesson_completed", payload: { lessonId: "song_fire_road", xp: 40 } },
    checkBadges: true
  });

  assert.strictEqual(S.xp, 55);
  assert.strictEqual(S.earTrainScore, 1);
  assert.strictEqual(S.earTrainStreak, 1);
  assert.strictEqual(S.songsPlayed, 1);
  assert.strictEqual(sparkEvents.length, 1);
  assert.strictEqual(sparkEvents[0].type, "lesson_completed");
  assert.strictEqual(badgeChecks, 2);
});

test("legacy activity runtime helper centralizes mini-activity state and timer cleanup", function() {
  T.song = 321;
  T.ear = 654;

  SparkProgressBridge.applyLegacyActivityRuntime({
    setFields: { songPlaying: true, songBeat: 0, earTrainAns: "C Major" },
    incrementFields: { earTrainTotal: 1 },
    clearIntervals: ["song"],
    clearTimeouts: ["ear"]
  });

  assert.strictEqual(S.songPlaying, true);
  assert.strictEqual(S.songBeat, 0);
  assert.strictEqual(S.earTrainAns, "C Major");
  assert.strictEqual(S.earTrainTotal, 1);
  assert.deepStrictEqual(clearedIntervals, [321]);
  assert.deepStrictEqual(clearedTimeouts, [654]);
  assert.strictEqual(T.song, null);
  assert.strictEqual(T.ear, null);
});

test("legacy activity runtime helper can cancel animation frames for live mini-games", function() {
  SparkProgressBridge.applyLegacyActivityRuntime({
    setFields: { rhythmActive: false, runnerActive: false },
    cancelAnimationFrames: [111, 222]
  });

  assert.strictEqual(S.rhythmActive, false);
  assert.strictEqual(S.runnerActive, false);
  assert.deepStrictEqual(canceledAnimationFrames, [111, 222]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
