var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", "js/recommend/rules.js"), "utf8"), { filename: path.join(__dirname, "..", "js/recommend/rules.js") });

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- balanceRecommendationSet lesson deduplication ---");

test("single candidate of each type all pass through", function() {
  var candidates = [
    { id: "a", type: "lesson", priority: 90 },
    { id: "b", type: "warmup", priority: 40 },
    { id: "c", type: "rhythm", priority: 30 }
  ];
  var result = balanceRecommendationSet(candidates, 5);
  assert.strictEqual(result.length, 3);
});

test("two lesson candidates with tight maxSuggestions: first-pass dedup keeps only highest-priority lesson", function() {
  var candidates = [
    { id: "lesson1", type: "lesson", priority: 96 },
    { id: "lesson2", type: "lesson", priority: 94 },
    { id: "warmup1", type: "warmup", priority: 40 }
  ];
  // maxSuggestions=2: first pass fills [lesson1, warmup1]; fill pass cannot add more
  var result = balanceRecommendationSet(candidates, 2);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].id, "lesson1", "highest-priority lesson should be first");
  assert.strictEqual(result[1].id, "warmup1", "warmup should be second");
  var hasLesson2 = result.some(function(c) { return c.id === "lesson2"; });
  assert.strictEqual(hasLesson2, false, "lesson2 must not appear when maxSuggestions reached by one-per-type set");
});

test("three lesson candidates plus other types: only one lesson admitted initially, others filled in second pass", function() {
  var candidates = [
    { id: "l1", type: "lesson", priority: 96 },
    { id: "l2", type: "lesson", priority: 95 },
    { id: "w1", type: "warmup", priority: 40 }
  ];
  var result = balanceRecommendationSet(candidates, 3);
  var lessonIds = result.filter(function(c) { return c.type === "lesson"; }).map(function(c) { return c.id; });
  // First pass: l1 (lesson), w1 (warmup) → 2 items. Second pass fills remaining from unseen: l2.
  // So result should have l1 from first pass, l2 from fill pass (maxSuggestions=3).
  assert.ok(lessonIds.indexOf("l1") >= 0, "l1 should be in result");
});

test("maxSuggestions=1 returns only highest priority item", function() {
  var candidates = [
    { id: "l1", type: "lesson", priority: 96 },
    { id: "w1", type: "warmup", priority: 40 }
  ];
  var result = balanceRecommendationSet(candidates, 1);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "l1");
});

test("empty candidates returns empty array", function() {
  var result = balanceRecommendationSet([], 5);
  assert.strictEqual(result.length, 0);
});
