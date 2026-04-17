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
  global.__sparkState = global.S;
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

eval(loadJS("js/sparksuite/core/state_facade.js"));
eval(loadJS("js/sparksuite/bridges/progress_bridge.js"));
eval(loadJS("js/practice/progress.js"));
global.Math.random = function() { return 1; };
global.SparkProgressOrchestrator = { evaluateAll: function() { return { newAchievements: [] }; } };
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
eval(loadJS("js/performance/analytics.js"));
eval(loadJS("js/performance/practice_engine.js"));
var performanceGeneratePracticePlan = generatePracticePlan;
var performanceMarkPracticePlanItem = markPracticePlanItem;
eval(loadJS("js/performance/recommendations.js"));
eval(loadJS("js/spark-core/session-engine.js"));
eval(loadJS("js/practice/weakspots.js"));
eval(loadJS("js/practice/adaptive.js"));

eval(loadJS("js/practice/plan.js"));
var legacyGenerateDailyPracticePlan = generateDailyPracticePlan;
var legacyCompletePracticeItem = completePracticeItem;
eval(loadJS("js/practice/engine.js"));

console.log("\n--- SparkSuite Legacy Cleanup ---");

test("performance practice generator delegates to sparkCore when available", function() {
  var plan = performanceGeneratePracticePlan();

  assert.ok(plan);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSession");
  assert.strictEqual(sparkCoreCalls[0].payload.flow, "daily_practice");
});

test("performance practice helpers can read analytics from sparkCore snapshots", function() {
  global.sparkCore = {
    getLegacyPracticeAnalyticsSnapshot: function() {
      return {
        transitionStats: {
          "G->C": { attempts: 4, success: 2 }
        },
        chordProgress: {
          "E Major": 34,
          "A Major": 91
        },
        performanceStats: {
          fire_road_chords_normal: {
            songId: "fire_road",
            runs: 3,
            bestAccuracy: 72,
            arrangement: "chords",
            difficulty: "normal"
          }
        }
      };
    }
  };

  var transitions = getWeakTransitions();
  var chords = getWeakChords();
  var songs = getWeakPerformanceSongs();

  assert.strictEqual(transitions.length, 1);
  assert.strictEqual(transitions[0].from, "G");
  assert.strictEqual(transitions[0].to, "C");
  assert.strictEqual(chords.length, 1);
  assert.strictEqual(chords[0].chord, "E Major");
  assert.strictEqual(chords[0].mastery, 34);
  assert.strictEqual(songs.length, 1);
  assert.strictEqual(songs[0].songId, "fire_road");
  assert.strictEqual(songs[0].accuracy, 72);
});

test("performance analytics and recommendations can read sparkCore snapshots", function() {
  global.SONGS = [
    { title: "Fire Road", progression: ["C", "G"] }
  ];
  global.sparkCore = {
    getLegacyPracticeAnalyticsSnapshot: function() {
      return {
        performanceStats: {
          fire_road_chords_normal: {
            songId: "fire_road",
            arrangement: "chords",
            difficulty: "normal",
            bestScore: 640,
            bestAccuracy: 68,
            bestStars: 2,
            mastery: "developing",
            lastPlayed: "2026-04-13T10:00:00.000Z",
            runs: 2
          }
        }
      };
    }
  };

  var totals = getPerformanceTotals();
  var recent = getPerformanceRecentRuns();
  var weak = getPerformanceWeakSongs();
  var recs = buildPerformanceRecommendationsForSong("fire_road");

  assert.strictEqual(totals.runs, 2);
  assert.strictEqual(totals.songsPlayed, 1);
  assert.strictEqual(totals.avgAccuracy, 68);
  assert.strictEqual(recent.length, 1);
  assert.strictEqual(recent[0].songId, "fire_road");
  assert.strictEqual(weak.length, 1);
  assert.strictEqual(weak[0].bestAccuracy, 68);
  assert.strictEqual(recs[0].type, "retry_run");
  assert.strictEqual(recs[0].songId, "fire_road");
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

test("legacy session engine preserves thin active instrument app ids in session plans", function() {
  var sessionEngineSource = loadJS("js/spark-core/session-engine.js");
  assert.ok(sessionEngineSource.indexOf('var activeInstrument = typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function" ? SparkInstruments.getActive() : null;') >= 0);
  assert.ok(sessionEngineSource.indexOf('instrumentId = activeInstrument.id || activeInstrument.appId || null;') >= 0);
});

test("legacy session engine emits practice completion events with the active instrument app id", function() {
  var sessionEngineSource = loadJS("js/spark-core/session-engine.js");
  assert.ok(sessionEngineSource.indexOf('var emitActiveInstrument = typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function" ? SparkInstruments.getActive() : null;') >= 0);
  assert.ok(sessionEngineSource.indexOf('var emitInstrumentId = emitActiveInstrument ? (emitActiveInstrument.id || emitActiveInstrument.appId || null) : null;') >= 0);
  assert.ok(sessionEngineSource.indexOf('appId:     emitInstrumentId || results.instrumentId || "chordspark",') >= 0);
});

test("getNextPracticeItem reads the cached plan without generating one", function() {
  var next = getNextPracticeItem();

  assert.strictEqual(next, null);
  assert.strictEqual(sparkCoreCalls.length, 0);
});

test("generateWeeklyPracticePlan preserves the cached daily plan", function() {
  S.practicePlan = { id: "cached_daily_plan", items: [{ id: "existing_item" }] };
  S.practicePlanDate = "2026-04-16";
  S.practicePlanInstrumentId = "pianospark";
  S.practicePlanInstrumentType = "piano";
  S.practicePlanComplete = true;
  S.practicePlanFocus = "Song mastery";

  var weeklyPlan = generateWeeklyPracticePlan();

  assert.ok(weeklyPlan);
  assert.strictEqual(weeklyPlan.days.length, 7);
  assert.strictEqual(S.practicePlan.id, "cached_daily_plan");
  assert.strictEqual(S.practicePlan.items[0].id, "existing_item");
  assert.strictEqual(S.practicePlanDate, "2026-04-16");
  assert.strictEqual(S.practicePlanInstrumentId, "pianospark");
  assert.strictEqual(S.practicePlanInstrumentType, "piano");
  assert.strictEqual(S.practicePlanComplete, true);
  assert.strictEqual(S.practicePlanFocus, "Song mastery");
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

test("performance practice generator defers to shared ensurePracticePlan when available", function() {
  var plan = performanceGeneratePracticePlan();

  assert.ok(plan);
  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSession");
  assert.strictEqual(sparkCoreCalls[0].payload.flow, "daily_practice");
});

test("progress bridge legacy reward helper centralizes xp and toast updates", function() {
  var reward = SparkStateBridge.applyLegacyReward({ xpDelta: 12, toastAmount: 12, jackpot: true });

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

test("practice progress recorder prefers sparkCore helper when available", function() {
  var calls = 0;
  global.sparkCore = {
    recordLegacyPracticeSession: function(result) {
      calls++;
      S.practiceHistory.push({ id: result.id, via: "core" });
    }
  };

  recordPracticeSession({ id: "practice_core", durationMin: 4 });

  assert.strictEqual(calls, 1);
  assert.strictEqual(S.practiceHistory.length, 1);
  assert.strictEqual(S.practiceHistory[0].via, "core");
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

test("practice weak-spot updater prefers sparkCore helper when available", function() {
  var calls = 0;
  global.sparkCore = {
    updateLegacyWeakSpotsFromPerformance: function(result) {
      calls++;
      S.weakSpots = {
        transitions: { "G->C": { accuracy: result.transitions["G->C"], attempts: 1 } },
        chords: {},
        rhythm: {},
        phrases: {}
      };
    }
  };

  updateWeakSpotsFromPerformance({
    transitions: { "G->C": 0.61 }
  });

  assert.strictEqual(calls, 1);
  assert.strictEqual(S.weakSpots.transitions["G->C"].attempts, 1);
});

test("practice adaptive updater delegates to bridge helper", function() {
  updateAdaptiveFromResult({ exerciseId: "rhythm_1", accuracy: 0.82 });

  assert.strictEqual(S.adaptiveState.rhythm_1.accuracy, 0.82);
  assert.ok(S.adaptiveState.rhythm_1.ts);
});

test("practice adaptive updater prefers sparkCore helper when available", function() {
  var calls = 0;
  global.sparkCore = {
    updateLegacyAdaptiveFromResult: function(result) {
      calls++;
      S.adaptiveState[result.exerciseId] = { accuracy: result.accuracy, ts: 123 };
    }
  };

  updateAdaptiveFromResult({ exerciseId: "rhythm_1", accuracy: 0.82 });

  assert.strictEqual(calls, 1);
  assert.strictEqual(S.adaptiveState.rhythm_1.accuracy, 0.82);
  assert.strictEqual(S.adaptiveState.rhythm_1.ts, 123);
});

test("legacy activity completion helper centralizes drill and daily bookkeeping", function() {
  SparkStateBridge.applyLegacyActivityCompletion({
    xpDelta: 20,
    toastAmount: 20,
    incrementFields: { drillCount: 1 },
    history: { type: "drill", detail: "E / A", xp: 20 },
    emit: { type: "practice_session_completed", payload: { type: "drill" } },
    checkBadges: true
  });

  SparkStateBridge.applyLegacyActivityCompletion({
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
  SparkStateBridge.applyLegacyActivityCompletion({
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
  SparkStateBridge.applyLegacyActivityCompletion({
    xpDelta: 15,
    incrementFields: { earTrainScore: 1, earTrainStreak: 1 },
    history: { type: "ear", detail: "C Major", xp: 15 },
    checkBadges: true
  });

  SparkStateBridge.applyLegacyActivityCompletion({
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

  SparkStateBridge.applyLegacyActivityRuntime({
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
  SparkStateBridge.applyLegacyActivityRuntime({
    setFields: { rhythmActive: false, runnerActive: false },
    cancelAnimationFrames: [111, 222]
  });

  assert.strictEqual(S.rhythmActive, false);
  assert.strictEqual(S.runnerActive, false);
  assert.deepStrictEqual(canceledAnimationFrames, [111, 222]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
