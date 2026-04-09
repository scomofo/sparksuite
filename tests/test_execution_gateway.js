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

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
