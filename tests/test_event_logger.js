var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
require("../js/sparksuite/core/event_logger.js");
var Logger = window.SparkEventLogger;

console.log("=== Event Logger Tests ===");

test("log adds entry", function() {
  Logger.clear();
  Logger.log("test_event", { foo: "bar" });
  assert.strictEqual(Logger.getLog().length, 1);
  assert.strictEqual(Logger.getLog()[0].event, "test_event");
});

test("getEventsByType filters", function() {
  Logger.clear();
  Logger.log("session_start", {});
  Logger.log("session_complete", { accuracy: 0.8 });
  Logger.log("session_start", {});
  assert.strictEqual(Logger.getEventsByType("session_start").length, 2);
  assert.strictEqual(Logger.getEventsByType("session_complete").length, 1);
});

test("getSessionStats computes correctly", function() {
  Logger.clear();
  Logger.log("session_start", {});
  Logger.log("session_start", {});
  Logger.log("session_complete", { accuracy: 0.8 });
  Logger.log("session_complete", { accuracy: 0.6 });
  Logger.log("session_retry", {});
  var stats = Logger.getSessionStats();
  assert.strictEqual(stats.totalSessions, 2);
  assert.strictEqual(stats.totalStarts, 2);
  assert.strictEqual(stats.completionRate, 1);
  assert.strictEqual(stats.retries, 1);
  assert.strictEqual(stats.avgAccuracy, 0.7);
});

test("log caps at 200 entries", function() {
  Logger.clear();
  for (var i = 0; i < 210; i++) Logger.log("bulk", { i: i });
  assert.strictEqual(Logger.getLog().length, 200);
});

test("clear empties log", function() {
  Logger.log("x", {});
  Logger.clear();
  assert.strictEqual(Logger.getLog().length, 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
