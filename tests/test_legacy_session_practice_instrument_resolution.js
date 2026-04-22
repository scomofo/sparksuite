var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.S = { level: 1 };
  global.__sparkState = global.S;
  global.SparkContracts = {
    createSessionPlan: function(plan) { return plan; }
  };
  global.SparkCurriculumService = undefined;
  global.sparkEvents = [];
  global._sparkEmit = function(type, payload) {
    sparkEvents.push({ type: type, payload: payload });
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        getData: function() {
          return {
            CHORDS: { 1: [{ name: "C Major" }, { name: "F Major" }] },
            ALL_CHORDS: [{ name: "C Major" }, { name: "F Major" }],
            SESSIONS: [{ num: 1, title: "Piano Spark 1" }]
          };
        },
        generateDrills: function() {
          return [{ name: "Piano Drill" }];
        },
        getExercisesForLesson: function(lessonId) {
          return [{ id: "piano_" + lessonId }];
        },
        getExercises: function() {
          return [{ id: "piano_exercise" }];
        },
        analyzePerformance: function() {
          return { accuracy: 91, source: "piano" };
        },
        getPerformanceConfig: function() {
          return { laneType: "keys" };
        }
      }];
    }
  };
  global.SparkInstrumentAdapter = {
    getCurriculum: function() {
      return {
        CHORDS: { 1: [{ name: "G Major" }] },
        ALL_CHORDS: [{ name: "G Major" }],
        SESSIONS: [{ num: 1, title: "Guitar Spark 1" }]
      };
    },
    generateDrills: function() {
      return [{ name: "Guitar Drill" }];
    },
    getExercisesForLesson: function(lessonId) {
      return [{ id: "guitar_" + lessonId }];
    },
    getExercises: function() {
      return [{ id: "guitar_exercise" }];
    },
    analyzePerformance: function() {
      return { accuracy: 55, source: "guitar" };
    },
    getPerformanceConfig: function() {
      return { laneType: "strings" };
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    eval(loadJS("js/spark-core/session-engine.js"));
    eval(loadJS("js/spark-core/practice-engine.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Legacy Engine Instrument Resolution ---");

test("legacy session engine prefers the rehydrated active instrument over a stale adapter singleton", function() {
  var previousRandom = Math.random;
  Math.random = function() { return 0.1; };

  var plan = SparkSession.buildSession({ mode: "quickStart", level: 1 });

  Math.random = previousRandom;
  assert.strictEqual(plan.chordName, "C Major");
  assert.strictEqual(plan.instrumentId, "pianospark");
  assert.strictEqual(plan.instrumentType, "piano");
});

test("legacy practice engine prefers the rehydrated active instrument over a stale adapter singleton", function() {
  var drill = SparkPracticeEngine.generateDrill({ level: 1, count: 1 });
  var exercises = SparkPracticeEngine.buildExerciseSet({ lessonId: "lesson_1" });
  var analysis = SparkPracticeEngine.analyzeResults({ type: "performance", total: 10, correct: 9 });
  var config = SparkPracticeEngine.getPerformanceConfig();

  assert.strictEqual(drill.length, 1);
  assert.strictEqual(drill[0].name, "Piano Drill");
  assert.strictEqual(exercises[0].id, "piano_lesson_1");
  assert.strictEqual(analysis.accuracy, 91);
  assert.strictEqual(analysis.source, "piano");
  assert.strictEqual(config.laneType, "keys");
});

test("legacy session engine preserves app-id-only ownership when processing results", function() {
  global.S.chordProgress = { "C Major": 100, "F Major": 100 };
  global.S.level = 1;
  global.S.sessions = 0;
  global.S.xp = 0;
  global.S.earnedBadges = [];
  global.logHistory = function() {};
  global.checkBadges = function() {};

  var outcome = SparkSession.processResults({
    type: "session",
    chordName: "C Major",
    duration: 120
  });

  assert.strictEqual(outcome.leveledUp, true);
  assert.strictEqual(global.S.level, 2);
  assert.strictEqual(sparkEvents.length, 1);
  assert.strictEqual(sparkEvents[0].payload.appId, "pianospark");
});

test("legacy session engine uses the result payload app id when no active instrument is available", function() {
  global.SparkInstruments.getActive = function() {
    return null;
  };
  global.S.chordProgress = {};
  global.S.level = 1;
  global.S.sessions = 0;
  global.S.xp = 0;
  global.S.earnedBadges = [];
  global.logHistory = function() {};
  global.checkBadges = function() {};

  SparkSession.processResults({
    type: "drill",
    chordName: "C Major",
    duration: 60,
    instrumentId: "ukespark"
  });

  assert.strictEqual(sparkEvents.length, 1);
  assert.strictEqual(sparkEvents[0].payload.appId, "ukespark");
});

if (process.exitCode) process.exit(process.exitCode);
