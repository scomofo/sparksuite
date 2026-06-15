var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
global.eval(fs.readFileSync(path.join(__dirname, "..", "js/sparksuite/analysis/performance_tracker.js"), "utf8"));

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- PerformanceTracker.computeSummary() and getEvents() ---");

test("computeSummary() on empty tracker returns zero-valued object", function() {
  var t = new SparkPerformanceTracker();
  var s = t.computeSummary();
  assert.strictEqual(s.accuracy, 0);
  assert.strictEqual(s.timing, 0);
  assert.strictEqual(s.consistency, 0);
  assert.ok(Array.isArray(s.weakAreas));
  assert.strictEqual(s.weakAreas.length, 0);
});

test("computeSummary() returns correct accuracy ratio", function() {
  var t = new SparkPerformanceTracker();
  t.record({ time: 1.0, lane: 0, hit: true, error: 0 });
  t.record({ time: 1.5, lane: 0, hit: true, error: 5 });
  t.record({ time: 2.0, lane: 0, hit: false, error: -80 });
  t.record({ time: 2.5, lane: 0, hit: false, error: 100 });
  var s = t.computeSummary();
  assert.strictEqual(s.accuracy, 0.5);
});

test("computeSummary() all hits with zero error yields perfect timing and consistency", function() {
  var t = new SparkPerformanceTracker();
  for (var i = 0; i < 5; i++) t.record({ time: i, lane: 0, hit: true, error: 0 });
  var s = t.computeSummary();
  assert.strictEqual(s.accuracy, 1.0);
  assert.strictEqual(s.timing, 1.0);
  assert.strictEqual(s.consistency, 1.0);
});

test("computeSummary() timing degrades with large errors", function() {
  var t = new SparkPerformanceTracker();
  t.record({ time: 0, lane: 0, hit: true, error: 200 });
  var s = t.computeSummary();
  assert.strictEqual(s.timing, 0, "avg abs error = 200ms should produce timing = 0");
});

test("computeSummary() returns object (not array) even after getSummary() returns array", function() {
  var t = new SparkPerformanceTracker();
  t.record({ time: 0, lane: 0, hit: true, error: 10 });
  var legacy = t.getSummary();
  var modern = t.computeSummary();
  assert.ok(Array.isArray(legacy), "getSummary still returns array");
  assert.ok(!Array.isArray(modern), "computeSummary returns object");
  assert.ok(typeof modern.accuracy === "number");
});

test("getEvents() returns a copy of the events array", function() {
  var t = new SparkPerformanceTracker();
  t.record({ time: 1.0, lane: 0, hit: true, error: 5 });
  var evts = t.getEvents();
  assert.ok(Array.isArray(evts));
  assert.strictEqual(evts.length, 1);
  evts.push({ time: 99, lane: 0, hit: false, error: 0 });
  assert.strictEqual(t.getEvents().length, 1, "mutating returned array must not affect tracker");
});

test("getEvents() and getSummary() both reflect reset()", function() {
  var t = new SparkPerformanceTracker();
  t.record({ time: 1.0, lane: 0, hit: true, error: 0 });
  t.reset();
  assert.strictEqual(t.getEvents().length, 0);
  assert.strictEqual(t.getSummary().length, 0);
});
