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

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
