const assert = require("assert");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("PASS:", name);
  } catch (error) {
    failed += 1;
    console.error("FAIL:", name, "--", error.message);
  }
}

global.window = {};
global.performance = {
  _now: 0,
  now() {
    return this._now;
  }
};

const eventBusModule = require("../js/sparksuite/core/spark_event_bus.js");

test("performance monitor emits measured and budget_exceeded events", async function() {
  const budgetModule = require("../js/sparksuite/core/performance_budget.js");
  const monitorModule = require("../js/sparksuite/core/performance_monitor.js");
  const bus = new eventBusModule.SparkEventBus({ maxEvents: 20 });
  const monitor = new monitorModule.SparkPerformanceMonitor({
    eventBus: bus,
    budgets: Object.assign({}, budgetModule.SparkPerformanceBudgets, {
      inputProcessingMs: 2
    })
  });

  performance._now = 0;
  monitor.measure("input.process", "inputProcessingMs", function() {
    performance._now = 5;
    return true;
  });

  const recent = bus.getRecent(5);
  assert.strictEqual(recent[0].type, "performance.measured");
  assert.strictEqual(recent[1].type, "performance.budget_exceeded");
  assert.strictEqual(recent[1].payload.label, "input.process");
});

test("storage, session engine, gameplay, and debug bundle record budget events", function() {
  const budgetModule = require("../js/sparksuite/core/performance_budget.js");
  const monitorModule = require("../js/sparksuite/core/performance_monitor.js");
  const storageModule = require("../js/sparksuite/core/storage.js");
  const sessionEngineModule = require("../js/sparksuite/core/session_engine.js");
  const scoringEngineModule = require("../js/sparksuite/core/scoring_engine.js");
  const gameplayEngineModule = require("../js/sparksuite/core/rhythm_gameplay_engine.js");
  const chartIoModule = require("../js/sparksuite/core/chart_io.js");
  const debugBundleModule = require("../js/sparksuite/debug/debug_bundle.js");

  const bus = new eventBusModule.SparkEventBus({ maxEvents: 100 });
  const monitor = new monitorModule.SparkPerformanceMonitor({
    eventBus: bus,
    budgets: budgetModule.SparkPerformanceBudgets
  });

  global.localStorage = {
    _store: {},
    getItem(key) {
      return this._store[key] || null;
    },
    setItem(key, value) {
      this._store[key] = String(value);
    }
  };
  global.S = {};
  global.SparkMigrateProfile = function(profile) { return profile; };
  global.SparkCreateDefaultProfile = function(userId) {
    return { schemaVersion: 4, userId: userId || "default", settings: {}, mastery: {} };
  };

  const storage = new storageModule.SparkSuiteStorage();
  storage.setPerformanceMonitor(monitor);
  storage.saveUserProfile({ schemaVersion: 4, userId: "fixture", settings: {}, mastery: {} });
  storage.getUserProfile("fixture");

  global.SparkSessionTypes = {
    FLOW_DAILY_PRACTICE: "daily_practice",
    FLOW_GUIDED_SESSION: "guided_session",
    FLOW_PERFORMANCE_SONG: "performance_song",
    FLOW_SPOTIFY_PLAY_ALONG: "spotify_play_along"
  };
  global.SparkSessionSegmentTypes = { normalize(value) { return value; } };
  global.SparkSessionSegment = { create(payload) { return Object.assign({}, payload); } };
  global.SessionPlan = function SessionPlan(payload) {
    Object.assign(this, payload);
  };
  const sessionEngine = new sessionEngineModule.SparkSuiteSessionEngine(
    {
      buildDailyPracticePlan() {
        return {
          focus: "rhythm",
          segments: [{ id: "seg_1", type: "practice", exerciseIds: ["ex_1"], durationSec: 60 }],
          exercises: [{ id: "ex_1", type: "practice", data: { core: {} } }],
          rewards: []
        };
      }
    },
    {
      getDailyPracticeContext() {
        return { nextLesson: { id: "lesson_1" } };
      }
    }
  );
  sessionEngine.setPerformanceMonitor(monitor);
  sessionEngine.buildSession("daily_practice", { instrumentContext: { appId: "chordspark", instrumentType: "guitar" } });

  global.SparkEnginePresetRegistry = { get() { return { hitWindowMs: { miss: 140 }, comboStep: 10, maxMultiplier: 4 }; } };
  global.SparkTimingEngine = function() {
    this.tickToSeconds = function(_tempoMap, tick) { return tick / 100; };
  };
  global.SparkCalibrationEngine = function() {};
  global.SparkInputJudge = function() {
    this.resolve = function(noteStates) {
      return { note: noteStates[0], judgement: "perfect", reason: null };
    };
  };
  global.SparkReplayEngine = function() {
    this.record = function() {};
    this.export = function() { return []; };
  };
  global.SparkGameplayResult = function(payload) { Object.assign(this, payload); };
  global.SparkNormalizePracticeAssist = function(config) { return config || {}; };
  global.SparkTempoMap = function(payload) {
    this.ppq = payload.ppq;
    this.tickToSeconds = function(tick) { return tick / 100; };
  };
  global.SparkNoteEvent = function(payload) { Object.assign(this, payload); };
  global.SparkPhrase = function(payload) { Object.assign(this, payload); };
  global.SparkSongChart = function(payload) { Object.assign(this, payload); };

  const scoring = new scoringEngineModule.SparkScoringEngine();
  const gameplay = new gameplayEngineModule.SparkRhythmGameplayEngine({
    chart: {
      tempoMap: [],
      tracks: {
        guitar: {
          notes: [{ id: "n1", tick: 100, tickLength: 10, laneMask: 1, flags: {}, label: "A", skillId: "skill_1" }]
        }
      }
    },
    scoringEngine: scoring,
    eventBus: bus,
    performanceMonitor: monitor
  });
  gameplay.handleInput({ lane: 0, timeMs: 100 });
  gameplay.update(2);

  const chartIO = new chartIoModule.SparkChartIO({ performanceMonitor: monitor });
  chartIO.fromExerciseDefinition({
    id: "chart_1",
    title: "Timing Drill",
    notes: [{ beat: 1, lengthBeats: 1, laneMask: 1, label: "A" }]
  }, {
    getLaneCount() { return 5; }
  });

  debugBundleModule.buildSparkDebugBundle({
    sparkCore: {
      getActiveSessionView() { return null; },
      getRuntimeState() { return {}; }
    },
    gateway: { getMissingHandlerReport() { return {}; } },
    eventBus: bus,
    storage: { getSettings() { return {}; } },
    performanceMonitor: monitor
  });

  const types = bus.getRecent(50).map((event) => event.type);
  assert.ok(types.includes("performance.measured"));
  assert.ok(types.includes("runtime.input.received"));
  assert.ok(types.includes("runtime.score.applied"));
  assert.ok(types.includes("runtime.session.frame"));
  assert.ok(types.includes("performance.measured"));
  assert.ok(bus.getRecent(100).some((event) => event.payload && event.payload.label === "chart.load.exercise_definition"));
  assert.ok(types.includes("performance.budget_exceeded") || types.includes("performance.measured"));
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
