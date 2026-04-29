var assert = require("assert");

global.window = global;

require("../js/sparksuite/core/practice_templates.js");

function sumDuration(items) {
  return items.reduce(function(total, item) {
    return total + (item.durationSec || 0);
  }, 0);
}

var templates = SparkPracticeTemplates.getAll();
assert.ok(Array.isArray(templates), "template catalog must be an array");
assert.ok(templates.length >= 3, "catalog should expose several practice templates");

templates.forEach(function(template) {
  assert.strictEqual(template.durationSec, 600, template.id + " must be a 10-minute template");
  assert.strictEqual(sumDuration(template.blocks), 600, template.id + " blocks must total 10 minutes");
  assert.ok(template.blocks.length >= 4, template.id + " should use short blocks");
  template.blocks.forEach(function(block) {
    assert.ok(block.id, "block must have an id");
    assert.ok(block.label, "block must have a label");
    assert.ok(block.durationSec <= 180, "ADHD-friendly blocks should stay short");
  });
});

var quickPlan = SparkPracticeTemplates.buildPlan({
  templateId: "quick_win",
  instrumentType: "guitar",
  skill: "open_chords",
  lessonId: "gtr_01"
});

assert.strictEqual(quickPlan.template.id, "quick_win");
assert.strictEqual(quickPlan.segments.length, quickPlan.exercises.length);
assert.strictEqual(sumDuration(quickPlan.segments), 600);
assert.strictEqual(quickPlan.segments[0].meta.practiceTemplateId, "quick_win");
assert.strictEqual(quickPlan.segments[0].meta.instrumentType, "guitar");
assert.strictEqual(quickPlan.segments[1].meta.skill, "open_chords");
assert.strictEqual(quickPlan.segments[1].meta.lessonId, "gtr_01");
assert.deepStrictEqual(quickPlan.segments[1].exerciseIds, [quickPlan.exercises[1].id]);

var fallbackPlan = SparkPracticeTemplates.buildPlan({ templateId: "missing" });
assert.strictEqual(fallbackPlan.template.id, "quick_win");
assert.strictEqual(sumDuration(fallbackPlan.segments), 600);

console.log("test_practice_templates passed");
