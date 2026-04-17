var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    activeInstrument: "pianospark",
    performanceStats: {
      focus_song_chords_normal: {
        songId: "focus_song",
        arrangement: "chords",
        difficulty: "normal",
        runs: 2,
        bestAccuracy: 65,
        bestStars: 2,
        importedTechniqueTotals: {
          tap: { total: 10, hits: 4 }
        },
        lastFocusedTechnique: "tap"
      }
    },
    timingWindows: { perfect: 45, good: 90, ok: 150 }
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.saveState = function() {};
  global.SparkInstruments = {
    getActive: function() {
      return { id: "pianospark", instrument: "piano" };
    }
  };
  global.SparkSessionTypes = { FLOW_DAILY_PRACTICE: "daily_practice" };
  global.selectWarmupItem = function() { return { id: "warmup_1", type: "warmup" }; };
  global.selectWeakTransition = function() { return { id: "transition_1", type: "transition" }; };
  global.selectWeakPerformanceTarget = function() { return { id: "song_1", type: "performance_song" }; };
  global.selectRhythmItem = function() { return { id: "rhythm_1", type: "rhythm" }; };
  global.selectFingerItem = function() { return { id: "finger_1", type: "finger" }; };
  global.applyAdaptiveToExercise = function(item) { return item; };
  global.syncPerformanceDailyChallengeStateCalls = [];
  global.sparkCore = {
    syncPerformanceDailyChallengeState: function(challenge, isComplete) {
      syncPerformanceDailyChallengeStateCalls.push({ challenge: challenge, isComplete: isComplete });
    }
  };
  global.SONGS = [
    { title: "Focus Song", progression: ["C", "G"] }
  ];
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Practice State Fallbacks ---");

async function run() {
  await test("practice weak spots and progress can update plain global S", function() {
    eval(loadJS("js/practice/weakspots.js"));
    eval(loadJS("js/practice/progress.js"));

    updateWeakSpotsFromPerformance({
      transitions: { "G->C": 0.4 },
      rhythm: { strum: 0.6 },
      phrases: [{ id: "phrase_1", accuracy: 0.5 }]
    });
    recordPracticeSession({ id: "practice_1", durationMin: 12 });

    assert.strictEqual(S.weakSpots.transitions["G->C"].attempts, 1);
    assert.strictEqual(S.practiceHistory.length, 1);
    assert.strictEqual(S.totalPracticeMinutes, 12);
    assert.strictEqual(getPracticeStats().sessions, 1);
  });

  await test("practice engine and plan helpers can build from plain global S", function() {
    eval(loadJS("js/practice/engine.js"));
    eval(loadJS("js/practice/plan.js"));
    global.getTopWeakSpots = function() {
      return {
        transitions: [{ key: "G->C" }],
        rhythm: [{ key: "strum" }],
        phrases: [{ key: "phrase_1" }]
      };
    };

    var built = buildPracticePlan();
    var legacy = generateDailyPracticePlan();

    assert.strictEqual(built.instrumentId, "pianospark");
    assert.strictEqual(built.instrumentType, "piano");
    assert.strictEqual(Array.isArray(built.items), true);
    assert.strictEqual(getCachedPracticePlanForActiveInstrument().instrumentId, "pianospark");
    assert.strictEqual(legacy.items[0].type, "warmup");
    assert.strictEqual(getNextPracticeItem().id, "warmup_1");
  });

  await test("practice engine preserves appId-only active instrument ownership", function() {
    global.S.activeInstrument = null;
    global.SparkInstruments.getActive = function() {
      return { appId: "pianospark", instrument: "piano" };
    };
    eval(loadJS("js/practice/engine.js"));
    eval(loadJS("js/practice/plan.js"));
    global.getTopWeakSpots = function() {
      return {
        transitions: [{ key: "G->C" }],
        rhythm: [{ key: "strum" }],
        phrases: [{ key: "phrase_1" }]
      };
    };

    var built = buildPracticePlan();

    assert.strictEqual(built.instrumentId, "pianospark");
    assert.strictEqual(getCachedPracticePlanForActiveInstrument().instrumentId, "pianospark");
  });

  await test("performance recommendations can use plain global S", function() {
    eval(loadJS("js/performance/recommendations.js"));

    var recs = buildPerformanceRecommendationsForSong("focus_song");
    var challenge = choosePerformanceDailyChallenge();
    var xp = markPerformanceDailyComplete();

    assert.strictEqual(recs[0].type, "imported_technique_focus");
    assert.strictEqual(challenge.songId, "focus_song");
    assert.strictEqual(challenge.techniqueKey, "tap");
    assert.strictEqual(xp, challenge.xp);
    assert.strictEqual(S.performanceDailyComplete, true);
    assert.strictEqual(syncPerformanceDailyChallengeStateCalls.length, 2);
  });

  await test("practice helpers fall back to global S when SparkState.getRoot returns null", function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/practice/weakspots.js"));
    eval(loadJS("js/practice/progress.js"));
    eval(loadJS("js/practice/engine.js"));
    eval(loadJS("js/practice/plan.js"));
    eval(loadJS("js/performance/recommendations.js"));
    global.getTopWeakSpots = function() {
      return {
        transitions: [{ key: "G->C" }],
        rhythm: [{ key: "strum" }],
        phrases: [{ key: "phrase_1" }]
      };
    };

    recordPracticeSession({ id: "practice_1", durationMin: 12 });
    assert.strictEqual(S.practiceHistory.length, 1);
    assert.strictEqual(buildPracticePlan().instrumentId, "pianospark");
    assert.strictEqual(generateDailyPracticePlan().items[0].type, "warmup");
    assert.strictEqual(buildPerformanceRecommendationsForSong("focus_song")[0].type, "imported_technique_focus");
  });

  await test("practice completion preserves thin active instrument app ids in session results", function() {
    var practiceEngineSource = loadJS("js/practice/engine.js");
    assert.ok(practiceEngineSource.indexOf('function resolvePracticeEngineActiveInstrument(){') >= 0);
    assert.ok(practiceEngineSource.indexOf('var practiceActiveInstrument = resolvePracticeEngineActiveInstrument();') >= 0);
    assert.ok(practiceEngineSource.indexOf('instrumentId: practiceActiveInstrument ? (practiceActiveInstrument.id || practiceActiveInstrument.appId || null) : null,') >= 0);
    assert.ok(practiceEngineSource.indexOf('instrumentType: practiceActiveInstrument ? (practiceActiveInstrument.instrument || null) : null,') >= 0);
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
