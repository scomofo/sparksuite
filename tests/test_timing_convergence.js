// ===== Timing Convergence Tests =====
// Run: node tests/test_timing_convergence.js
//
// Hit windows and latency offsets each have exactly ONE source of truth:
// - Hit windows: SparkEnginePresetRegistry (domain/engine_preset.js).
//   Performance difficulties derive their windows from named presets instead
//   of duplicating drifting numbers (the third, never-loaded timing system in
//   js/sparksuite/{runtime,gameplay} was deleted outright).
// - Latency offsets: SparkTimingCore's model, built from the persisted
//   performance calibration store. Performance mode and the rhythm gameplay
//   clock both resolve offsets through it.

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (e) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + e.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

global.window = global;
global.S = { performTimingOffsetMs: 12, performMidiOffsetMs: 5, performMicOffsetMs: 30 };
global.eval(loadJS("js/sparksuite/domain/engine_preset.js"));
global.eval(loadJS("js/performance/difficulties.js"));
global.eval(loadJS("js/sparksuite/core/timing_core.js"));
global.eval(loadJS("js/performance/calibration.js"));

console.log("\n--- Timing Convergence ---");

test("performance difficulties derive hit windows from the preset registry", function() {
  var pairs = { easy: "spark_gentle", normal: "spark_learning", pro: "spark_pro" };
  for (var id in pairs) {
    var diff = getPerformanceDifficulty(id);
    var preset = SparkEnginePresetRegistry.get(pairs[id]);
    assert.strictEqual(diff.enginePreset, pairs[id], id + " must name its preset");
    assert.strictEqual(diff.perfectMs, preset.hitWindowMs.perfect, id + " perfect window");
    assert.strictEqual(diff.goodMs, preset.hitWindowMs.good, id + " good window");
    assert.strictEqual(diff.missMs, preset.hitWindowMs.miss, id + " miss window");
  }
});

test("the registry carries the five spark presets and no orphaned homage presets", function() {
  var all = SparkEnginePresetRegistry.all();
  ["spark_gentle", "spark_learning", "spark_balanced", "spark_challenge", "spark_pro"].forEach(function(name) {
    assert.ok(all[name], name + " must exist");
    assert.ok(all[name].hitWindowMs.perfect < all[name].hitWindowMs.good, name + " windows must be ordered");
    assert.ok(all[name].hitWindowMs.good < all[name].hitWindowMs.miss, name + " windows must be ordered");
  });
  assert.ok(!all.gh_like && !all.rb_like && !all.clone_hero_like, "consumer-less homage presets are gone");
});

test("the learning tier is unified (the 130 vs 140 good-window drift is resolved)", function() {
  assert.strictEqual(SparkEnginePresetRegistry.get("spark_learning").hitWindowMs.good, 140);
});

test("SparkTimingCore.fromPerformanceState resolves global + per-mode offsets", function() {
  var core = SparkTimingCore.fromPerformanceState(S);
  assert.strictEqual(core.getInputOffsetMs("midi"), 17, "global 12 + midi 5");
  assert.strictEqual(core.getInputOffsetMs("mic"), 42, "global 12 + mic 30");
  assert.strictEqual(core.getInputOffsetMs("audio"), 12, "global only");
});

test("performance offset resolution delegates to the shared model", function() {
  assert.strictEqual(getActivePerformanceOffsetMs("midi"), 17);
  assert.strictEqual(getActivePerformanceOffsetMs("mic"), 42);
  assert.strictEqual(getActivePerformanceOffsetMs(), 12);
});

test("the rhythm gameplay calibration engine resolves through the same model", function() {
  global.SparkSuiteInstrumentAdapters = {
    guitar: function() {
      return { getCapabilities: function() { return { micCalibration: true }; } };
    },
    piano: function() {
      return { getCapabilities: function() { return {}; } };
    }
  };
  global.eval(loadJS("js/sparksuite/core/calibration_engine.js"));
  var engine = new SparkCalibrationEngine();
  assert.strictEqual(engine.getOffsetMs("guitar"), 42, "global + mic, matching performance mode's mic offset");
  assert.strictEqual(engine.getOffsetMs("piano"), 0, "capability gate still applies");
});

test("LIVE performance scoring resolves its offset through the shared helper", function() {
  var source = loadJS("js/performance/session.js");
  assert.ok(
    source.indexOf("getActivePerformanceOffsetMs(S.performMode)") >= 0,
    "maybeScorePendingEvents must delegate to the shared offset resolution"
  );
});

test("LIVE rhythm strum judgment applies the global input offset", function() {
  var source = loadJS("js/pages/rhythm_highway.js");
  assert.ok(
    source.indexOf("getRhythmInputOffsetSec") >= 0 &&
    source.indexOf("currentSongTimeSec - getRhythmInputOffsetSec()") >= 0,
    "the strum handler must judge at the calibrated input time"
  );
  assert.ok(
    source.indexOf('getInputOffsetMs("audio")') >= 0,
    "keyboard/button strums use the global (audio-mode) offset, not the mic offset"
  );
});

console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
