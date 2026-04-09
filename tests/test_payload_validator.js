var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
require("../js/sparksuite/core/payload_validator.js");
var V = window.SparkPayloadValidator;

console.log("=== Payload Validator Tests ===");

test("validateGameplayPayload rejects null", function() {
  var r = V.validateGameplayPayload(null);
  assert.strictEqual(r.valid, false);
});

test("validateGameplayPayload accepts valid payload", function() {
  var r = V.validateGameplayPayload({ chartId: "test", notes: [{ lane: 0 }, { lane: 1 }] });
  assert.strictEqual(r.valid, true);
});

test("validateGameplayPayload catches missing lane on notes", function() {
  var r = V.validateGameplayPayload({ chartId: "test", notes: [{ lane: 0 }, {}] });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors[0].indexOf("lane") >= 0);
});

test("validateLaneDistribution detects collapse", function() {
  var r = V.validateLaneDistribution([{ lane: 0 }, { lane: 0 }, { lane: 0 }]);
  assert.strictEqual(r.collapsed, true);
  assert.strictEqual(r.valid, false);
});

test("validateLaneDistribution accepts good distribution", function() {
  var r = V.validateLaneDistribution([{ lane: 0 }, { lane: 1 }, { lane: 2 }]);
  assert.strictEqual(r.collapsed, false);
  assert.strictEqual(r.valid, true);
  assert.strictEqual(r.laneCount, 3);
});

test("validateLaneDistribution handles empty", function() {
  var r = V.validateLaneDistribution([]);
  assert.strictEqual(r.valid, true);
});

test("summarizeEvents computes accuracy", function() {
  var events = [
    { result: "perfect", deltaMs: 10 },
    { result: "good", deltaMs: 50 },
    { result: "miss", deltaMs: 100 },
    { result: "perfect", deltaMs: 5 }
  ];
  var s = V.summarizeEvents(events);
  assert.strictEqual(s.total, 4);
  assert.strictEqual(s.perfect, 2);
  assert.strictEqual(s.good, 1);
  assert.strictEqual(s.miss, 1);
  assert.strictEqual(s.accuracy, 0.75);
  assert.strictEqual(s.precision, 0.5);
  assert.strictEqual(s.missRate, 0.25);
  assert.strictEqual(s.avgDeltaMs, 41);
});

test("summarizeEvents handles empty", function() {
  var s = V.summarizeEvents([]);
  assert.strictEqual(s.total, 0);
  assert.strictEqual(s.accuracy, 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
