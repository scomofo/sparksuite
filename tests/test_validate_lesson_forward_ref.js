var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", "js/sparksuite/content/validate_instrument_module.js"), "utf8"), { filename: path.join(__dirname, "..", "js/sparksuite/content/validate_instrument_module.js") });
var validateLessons = global.SparkValidateLessons;

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

var skillTree = [
  { id: "skill_a" },
  { id: "skill_b" },
  { id: "skill_c" }
];

console.log("\n--- validateLessons forward-reference prerequisite fix ---");

test("backward-reference prerequisite passes (baseline)", function() {
  var lessons = [
    { id: "lesson_1", skill: "skill_a", prerequisites: [] },
    { id: "lesson_2", skill: "skill_b", prerequisites: ["lesson_1"] }
  ];
  assert.strictEqual(validateLessons("test", lessons, skillTree), true);
});

test("forward-reference prerequisite passes (was previously false-rejected)", function() {
  var lessons = [
    { id: "lesson_b", skill: "skill_b", prerequisites: ["lesson_c"] },
    { id: "lesson_c", skill: "skill_c", prerequisites: [] }
  ];
  assert.doesNotThrow(function() {
    validateLessons("test", lessons, skillTree);
  }, "forward-reference to lesson_c from lesson_b must not throw");
});

test("genuinely missing prerequisite still throws", function() {
  var lessons = [
    { id: "lesson_x", skill: "skill_a", prerequisites: ["lesson_does_not_exist"] }
  ];
  assert.throws(function() {
    validateLessons("test", lessons, skillTree);
  }, /missing prerequisite/);
});

test("prerequisite that is a skill id passes", function() {
  var lessons = [
    { id: "lesson_1", skill: "skill_a", prerequisites: ["skill_b"] }
  ];
  assert.doesNotThrow(function() {
    validateLessons("test", lessons, skillTree);
  });
});

test("duplicate lesson id still throws", function() {
  var lessons = [
    { id: "lesson_dup", skill: "skill_a", prerequisites: [] },
    { id: "lesson_dup", skill: "skill_b", prerequisites: [] }
  ];
  assert.throws(function() {
    validateLessons("test", lessons, skillTree);
  }, /duplicate lesson id/);
});

test("lesson missing skill still throws", function() {
  var lessons = [
    { id: "lesson_1", prerequisites: [] }
  ];
  assert.throws(function() {
    validateLessons("test", lessons, skillTree);
  }, /missing skill/);
});
