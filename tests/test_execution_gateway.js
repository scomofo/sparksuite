var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.SparkEventLogger = { log: function() {} };

require("../js/sparksuite/core/execution_gateway.js");
var GW = window.SparkExecutionGateway;

console.log("=== Execution Gateway Tests ===");

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
  var result = GW.runDirectExercise("some_chart", { source: "test" });
  assert.strictEqual(result, false);
});

test("runDirectExercise calls startPerformance for songs", function() {
  var called = false;
  global.startPerformance = function() { called = true; };
  GW.runDirectExercise("chart_id", { source: "retry" });
  assert.ok(called, "should call startPerformance");
  delete global.startPerformance;
});

test("runDirectExercise publishes execution trace", function() {
  global.startPerformance = function() {};
  global.window.sparkCore = {
    updateRuntimeState: function(patch) { this.patch = patch; }
  };
  GW.runDirectExercise("chart_id", { source: "trace_test" });
  assert.ok(global.window.__sparkExecutionTrace);
  assert.strictEqual(global.window.__sparkExecutionTrace.source, "trace_test");
  assert.strictEqual(global.window.sparkCore.patch.lastExecutionTrace.source, "trace_test");
  delete global.startPerformance;
});

test("runDirectExercise normalizes app-id instruments for playable practice launches", function() {
  var captured = null;
  global.SparkInstruments = {
    getAll: function() {
      return [{ id: "pianospark", appId: "pianospark", instrument: "piano" }];
    }
  };
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
  };

  GW.runDirectExercise({
    id: "practice_payload",
    type: "practice",
    data: {
      core: { instrument: "pianospark" },
      gameplay: {
        payload: { adapterType: "pianospark", chartId: "practice_chart" }
      }
    }
  }, { source: "practice_test" });

  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "piano");

  delete global.startPlayableRhythmHighwayPayload;
  delete global.SparkInstruments;
});

test("runDirectExercise normalizes app-id instruments for spotify playable launches", function() {
  var captured = null;
  global.SparkInstruments = {
    getAll: function() {
      return [{ id: "ukespark", appId: "ukespark", instrument: "ukulele" }];
    }
  };
  global.window.sparkCore = { playbackEngine: {} };
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
  };

  GW.runDirectExercise({
    id: "spotify_payload",
    type: "song",
    data: {
      core: {
        instrument: "ukespark",
        spotifyTrackUri: "spotify:track:test"
      },
      gameplay: {
        chart: { metadata: { source: "spotify", laneCount: 4 }, song: { title: "Island Song" } },
        playAlongChart: { trackUri: "spotify:track:test" },
        preset: "spark_learning"
      }
    }
  }, { source: "spotify_test" });

  assert.ok(captured);
  assert.strictEqual(captured.payload.adapterType, "ukulele");
  assert.strictEqual(captured.options.instrument, "ukulele");

  delete global.startPlayableRhythmHighwayPayload;
  delete global.SparkInstruments;
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
