var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
}

loadJS("js/sparksuite/instruments/ukulele/ukulele_foundations_pack.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_packs.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Ukulele Foundations Pack Spec ---");

test("foundations pack exposes SparkSuite-ready curriculum metadata", function() {
  var pack = SparkUkuleleFoundationsPack;

  assert.strictEqual(pack.module_id, "uke_foundations_pack_01");
  assert.strictEqual(pack.instrument, "ukulele");
  assert.strictEqual(pack.estimated_total_time_min, 36);
  assert.deepStrictEqual(pack.sets, ["set_a_strum", "set_b_changes", "set_c_melody"]);
  assert.strictEqual(pack.curriculum_sets.length, 3);
});

test("each set uses short measurable blocks with progression hooks", function() {
  SparkUkuleleFoundationsPack.curriculum_sets.forEach(function(set) {
    var total = 0;
    assert.ok(set.set_id);
    assert.ok(set.bpm.start <= set.bpm.target);
    assert.strictEqual(set.blocks.length, 5);
    set.blocks.forEach(function(block) {
      total += block.duration_sec;
      assert.ok(block.duration_sec <= SparkUkuleleFoundationsPack.session_rules.max_block_time_sec);
      assert.ok(block.goal || block.instructions || block.instruction);
      if (block.type !== "record") {
        assert.ok(block.progression_hook, block.block_id + " missing progression hook");
      }
    });
    assert.strictEqual(total, 720);
  });
});

test("scoring hooks and session rules expose future tuning contracts", function() {
  var pack = SparkUkuleleFoundationsPack;

  assert.strictEqual(pack.metrics.timing_stability, "std_dev(beat_alignment)");
  assert.strictEqual(pack.metrics.tempo_drift, "bpm_variance_over_time");
  assert.strictEqual(pack.metrics.transition_cleanliness, "gap_duration_between_chords");
  assert.strictEqual(pack.session_rules.auto_advance_if.success_score, ">0.85");
  assert.strictEqual(pack.session_rules.repeat_if.success_score, "<0.65");
  assert.ok(pack.session_rules.nudge_prompts.indexOf("keep hand moving") >= 0);
});

test("ukulele module and pack list expose the foundations pack", function() {
  var packs = SparkUkuleleModule.getPacks();
  var specs = SparkUkuleleModule.getCurriculumPackSpecs();

  assert.ok(packs.some(function(pack) { return pack.id === "uke_foundations_pack_01"; }));
  assert.strictEqual(specs.length, 1);
  assert.strictEqual(specs[0].module_id, "uke_foundations_pack_01");
});

if (failed > 0) {
  console.error("\n" + passed + " passed, " + failed + " failed");
  process.exit(1);
}

console.log("\n" + passed + " passed, " + failed + " failed");
