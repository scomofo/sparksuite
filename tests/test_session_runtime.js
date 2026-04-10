var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.S = {};
global.SparkSessionTypes = { FLOW_DAILY_PRACTICE: "daily_practice" };
global.SparkSessionSegmentTypes = { normalize: function(t) { return t || "practice"; } };

require("../js/sparksuite/core/session_runtime.js");
var Runtime = window.SparkSessionRuntime;

console.log("=== Session Runtime Tests ===");

test("startSessionLoop returns null without engines", function() {
  var session = Runtime.startSessionLoop();
  assert.strictEqual(session, null);
});

test("runSegment returns false with no active session", function() {
  assert.strictEqual(Runtime.runSegment(0), false);
});

test("recordEvent stores events", function() {
  Runtime.recordEvent({ type: "hit", delta: 10 });
  Runtime.recordEvent({ type: "miss", delta: 80 });
  assert.strictEqual(Runtime.getSessionEvents().length, 2);
});

test("completeSegment returns hasNext false with no session", function() {
  var result = Runtime.completeSegment({ accuracy: 0.8 });
  assert.strictEqual(result.hasNext, false);
});

test("getActiveSession returns null initially", function() {
  assert.strictEqual(Runtime.getActiveSession(), null);
});

test("getActiveSegmentIndex returns -1 initially", function() {
  assert.strictEqual(Runtime.getActiveSegmentIndex(), -1);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
