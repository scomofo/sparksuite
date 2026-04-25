var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.SparkEventLogger = { log: function() {} };
var warnings = [];
global.console = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: function(message) { warnings.push(message); }
};
global.SparkInstruments = {
  getAll: function() {
    return [
      { id: "pianospark", appId: "pianospark", instrument: "piano" },
      { id: "ukespark", appId: "ukespark", instrument: "ukulele" }
    ];
  }
};

require("../js/sparksuite/core/execution_gateway.js");
var GW = window.SparkExecutionGateway;

console.log("=== Execution Gateway Tests ===");

test("register rejects non-function handlers", function() {
  assert.throws(function() {
    GW.register("practice.start", null);
  }, /must be a function/);
});

test("execute uses registered handlers before fallback launchers", function() {
  var captured = null;
  GW.clearHandlers();
  GW.register("practice.start", function(payload) {
    captured = payload;
    return "handled";
  });

  var result = GW.runDirectExercise({
    type: "practice",
    gameplayPayload: { adapterType: "pianospark" },
    instrument: "pianospark"
  }, { source: "test" });

  assert.strictEqual(result, "handled");
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "piano");
  assert.deepStrictEqual(GW.getMissingHandlerReport(), {});
  GW.clearHandlers();
});

test("execute records missing handler counts when fallback path is used", function() {
  var captured = null;
  GW.clearHandlers();
  warnings = [];
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };

  var launched = GW.runDirectExercise({
    type: "practice",
    gameplayPayload: { adapterType: "ukespark" },
    instrument: "ukespark"
  }, { source: "test" });

  assert.strictEqual(launched, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "ukulele");
  assert.strictEqual(GW.getMissingHandlerReport()["practice.start"], 1);
  assert.ok(warnings.length > 0);

  delete global.startPlayableRhythmHighwayPayload;
  GW.clearHandlers();
});

test("installDefaultHandlers registers explicit practice and song launch handlers", function() {
  var practiceCaptured = null;
  var songCaptured = null;
  GW.clearHandlers();
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    practiceCaptured = { payload: payload, options: options };
    return true;
  };
  global.startPerformance = function(target, options) {
    songCaptured = { target: target, options: options };
    return true;
  };

  GW.installDefaultHandlers();

  assert.strictEqual(GW.runDirectExercise({
    type: "practice",
    gameplayPayload: { adapterType: "ukespark" },
    instrument: "ukespark"
  }, { source: "default_practice" }), true);
  assert.ok(practiceCaptured);
  assert.strictEqual(practiceCaptured.options.instrument, "ukulele");

  assert.strictEqual(GW.runDirectExercise("default_song_chart", { source: "default_song" }), true);
  assert.ok(songCaptured);
  assert.strictEqual(songCaptured.target, "default_song_chart");
  assert.deepStrictEqual(GW.getMissingHandlerReport(), {});

  delete global.startPlayableRhythmHighwayPayload;
  delete global.startPerformance;
  GW.clearHandlers();
});

test("runSessionSegment uses registered segment handlers before exercise launch fallbacks", function() {
  var captured = null;
  GW.clearHandlers();
  GW.register("session.segment.practice", function(payload) {
    captured = payload;
    return "segment_handled";
  });

  var result = GW.runSessionSegment({
    id: "plan_segment",
    segments: [
      { id: "seg_segment", type: "practice", exerciseIds: ["ex_segment"] }
    ],
    exercises: [
      {
        id: "ex_segment",
        type: "practice",
        data: {
          core: { skill: "timing", instrument: "pianospark" },
          gameplay: { payload: { adapterType: "pianospark" } }
        }
      }
    ]
  }, { id: "seg_segment", type: "practice", exerciseIds: ["ex_segment"] }, { source: "segment_test" });

  assert.strictEqual(result, "segment_handled");
  assert.ok(captured);
  assert.strictEqual(captured.segment.id, "seg_segment");
  assert.strictEqual(captured.exercise.id, "ex_segment");
  assert.strictEqual(captured.options.exerciseCount, 1);
  assert.deepStrictEqual(GW.getMissingHandlerReport(), {});
  GW.clearHandlers();
});

test("runSessionSegment falls back through the shared segment-start handler", function() {
  var captured = null;
  GW.clearHandlers();
  GW.register("session.segment.start", function(payload) {
    captured = payload;
    return "segment_start_handled";
  });

  var result = GW.runSessionSegment({
    id: "plan_shared_segment",
    segments: [
      { id: "seg_shared", type: "song", exerciseIds: ["ex_shared"] }
    ],
    exercises: [
      {
        id: "ex_shared",
        type: "song",
        data: {
          core: { songId: "shared_song" },
          gameplay: {}
        }
      }
    ]
  }, { id: "seg_shared", type: "song", exerciseIds: ["ex_shared"] }, { source: "segment_start_test" });

  assert.strictEqual(result, "segment_start_handled");
  assert.ok(captured);
  assert.strictEqual(captured.segment.id, "seg_shared");
  assert.strictEqual(captured.exercise.id, "ex_shared");
  assert.strictEqual(GW.getMissingHandlerReport()["session.segment.song"], 1);
  GW.clearHandlers();
});

test("installDefaultHandlers registers explicit session segment handlers", function() {
  var captured = null;
  GW.clearHandlers();
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };

  GW.installDefaultHandlers();

  var result = GW.runSessionSegment({
    id: "plan_default_segment",
    segments: [
      { id: "seg_default_practice", type: "drill", exerciseIds: ["ex_default_practice"] }
    ],
    exercises: [
      {
        id: "ex_default_practice",
        type: "practice",
        data: {
          core: { skill: "timing", instrument: "pianospark" },
          gameplay: { payload: { adapterType: "pianospark" } }
        }
      }
    ]
  }, { id: "seg_default_practice", type: "drill", exerciseIds: ["ex_default_practice"] }, { source: "default_segment" });

  assert.strictEqual(result, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "piano");
  assert.deepStrictEqual(GW.getMissingHandlerReport(), {});

  delete global.startPlayableRhythmHighwayPayload;
  GW.clearHandlers();
});

test("normalizeToExercise wraps string chartId", function() {
  var ex = GW.normalizeToExercise("my_chart_id");
  assert.strictEqual(ex.type, "song");
  assert.strictEqual(ex.data.core.chartId, "my_chart_id");
  assert.ok(ex.id);
});

test("normalizeToExercise wraps song object", function() {
  var ex = GW.normalizeToExercise({ songId: "test_song", arrangementType: "chords" });
  assert.strictEqual(ex.type, "song");
  assert.strictEqual(ex.data.core.songId, "test_song");
  assert.strictEqual(ex.data.core.arrangementType, "chords");
});

test("normalizeToExercise wraps practice object", function() {
  var ex = GW.normalizeToExercise({ pattern: "D D D D", tempo: 60 });
  assert.strictEqual(ex.type, "practice");
  assert.ok(ex.data);
});

test("normalizeToExercise passes through V2 exercise", function() {
  var v2 = { id: "ex_1", type: "song", data: { core: {} } };
  var ex = GW.normalizeToExercise(v2);
  assert.strictEqual(ex.id, "ex_1");
  assert.strictEqual(ex, v2);
});

test("runDirectExercise returns false without launchers", function() {
  GW.clearHandlers();
  var result = GW.runDirectExercise("some_chart", { source: "test" });
  assert.strictEqual(result, false);
  assert.strictEqual(GW.getMissingHandlerReport()["song.start"], 1);
});

test("runDirectExercise calls startPerformance for songs", function() {
  GW.clearHandlers();
  var called = false;
  global.startPerformance = function() { called = true; };
  GW.runDirectExercise("chart_id", { source: "retry" });
  assert.ok(called, "should call startPerformance");
  assert.strictEqual(GW.getMissingHandlerReport()["song.start"], 1);
  delete global.startPerformance;
});

test("runDirectExercise normalizes app-id instruments for practice payload launches", function() {
  GW.clearHandlers();
  var captured = null;
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };

  var launched = GW.runDirectExercise({
    type: "practice",
    gameplayPayload: { adapterType: "pianospark" },
    instrument: "pianospark"
  }, { source: "test" });

  assert.strictEqual(launched, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "piano");
  assert.strictEqual(GW.getMissingHandlerReport()["practice.start"], 1);

  delete global.startPlayableRhythmHighwayPayload;
});

test("runPlanItem can resolve sparkCore from the global binding", function() {
  GW.clearHandlers();
  var captured = null;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          segments: [
            { id: "seg_plan", type: "practice", exerciseIds: ["ex_plan"] }
          ],
          exercises: [
            {
              id: "ex_plan",
              type: "practice",
              data: {
                core: { skill: "timing", instrument: "pianospark" },
                gameplay: { payload: { adapterType: "pianospark" } }
              }
            }
          ]
        }
      };
    }
  };
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };

  var launched = GW.runPlanItem({ id: "seg_plan" }, { source: "plan_item_test" });

  assert.strictEqual(launched, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "piano");

  delete global.startPlayableRhythmHighwayPayload;
  delete global.sparkCore;
});

test("runRhythmHighwaySegment can resolve sparkCore from the global binding", function() {
  GW.clearHandlers();
  var captured = null;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          segments: [
            { id: "seg_rhythm", type: "practice", exerciseIds: ["ex_rhythm"] }
          ],
          exercises: [
            {
              id: "ex_rhythm",
              type: "practice",
              data: {
                core: { skill: "timing", instrument: "ukespark" },
                gameplay: { payload: { adapterType: "ukespark" } }
              }
            }
          ]
        }
      };
    }
  };
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };

  var launched = GW.runRhythmHighwaySegment("seg_rhythm", { source: "rhythm_segment_test" });

  assert.strictEqual(launched, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "ukulele");

  delete global.startPlayableRhythmHighwayPayload;
  delete global.sparkCore;
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
