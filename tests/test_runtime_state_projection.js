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
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

global.window = global;
global.S = { guidedActivityId: null, guidedActivityKind: null, guidedBlockType: null };
global.saveState = function() {};
global.SparkInstruments = { getActive: function() { return null; }, getAll: function() { return []; } };

var _eval = eval;
_eval(loadJS("js/utils/normalize.js"));

eval(loadJS("js/sparksuite/domain/types.js"));
eval(loadJS("js/sparksuite/domain/session_segment.js"));
eval(loadJS("js/sparksuite/domain/session.js"));
eval(loadJS("js/sparksuite/domain/tempo_map.js"));
eval(loadJS("js/sparksuite/domain/note_event.js"));
eval(loadJS("js/sparksuite/domain/phrase.js"));
eval(loadJS("js/sparksuite/domain/chart.js"));
eval(loadJS("js/sparksuite/domain/gameplay_result.js"));
eval(loadJS("js/sparksuite/domain/engine_preset.js"));
eval(loadJS("js/sparksuite/bridges/practice_bridge.js"));
eval(loadJS("js/sparksuite/bridges/curriculum_bridge.js"));
eval(loadJS("js/sparksuite/bridges/progress_bridge.js"));
eval(loadJS("js/sparksuite/bridges/performance_bridge.js"));
eval(loadJS("js/sparksuite/core/calibration_engine.js"));
eval(loadJS("js/sparksuite/core/timing_engine.js"));
eval(loadJS("js/sparksuite/core/chart_io.js"));
eval(loadJS("js/sparksuite/core/replay_engine.js"));
eval(loadJS("js/sparksuite/core/input_judge.js"));
eval(loadJS("js/sparksuite/core/scoring_engine.js"));
eval(loadJS("js/sparksuite/core/rhythm_gameplay_engine.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_skill_tree.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_chords.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_scales.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_tuning.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_progression.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_adapter.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/index.js"));
eval(loadJS("js/instruments/bass/data.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_module.js"));
eval(loadJS("js/sparksuite/instruments/bass/bass_adapter.js"));
eval(loadJS("js/sparksuite/instruments/bass/index.js"));
eval(loadJS("js/sparksuite/instruments/piano/piano_adapter.js"));
eval(loadJS("js/sparksuite/instruments/piano/index.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_chart_library.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_rhythm_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/guitar_adapter.js"));
eval(loadJS("js/sparksuite/instruments/guitar/index.js"));
eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
eval(loadJS("js/curriculum/curriculum_v2.js"));
eval(loadJS("js/curriculum/curriculum_v2_legacy_adapter.js"));
eval(loadJS("js/sparksuite/core/storage.js"));
eval(loadJS("js/sparksuite/core/ai_engine.js"));
eval(loadJS("js/sparksuite/core/instrument_manager.js"));
eval(loadJS("js/sparksuite/core/psychology_engine.js"));
eval(loadJS("js/sparksuite/core/curriculum_engine.js"));
eval(loadJS("js/sparksuite/core/practice_templates.js"));
eval(loadJS("js/sparksuite/core/practice_engine.js"));
eval(loadJS("js/sparksuite/core/progress_engine.js"));
eval(loadJS("js/sparksuite/core/session_engine.js"));
eval(loadJS("js/sparksuite/core/execution_gateway.js"));
eval(loadJS("js/sparksuite/core/spark_core.js"));

console.log("\n--- SparkCore Runtime State Projection (Phase 2) ---");

test("SparkCore exposes a named runtime-state projection registry", function() {
  assert.strictEqual(typeof SparkCoreRuntime.RUNTIME_STATE_PROJECTIONS, "object");
  assert.strictEqual(typeof SparkCoreRuntime.RUNTIME_STATE_PROJECTIONS.guided, "function");
});

test("projectRuntimeStateFields('guided') derives legacy fields from engine runtime state", function() {
  var core = createDefaultSparkCore();
  var projected = core.projectRuntimeStateFields("guided", {
    guidedActivityId: "warm_engine_1",
    guidedActivityKind: "drill",
    guidedBlockType: "warm_engine"
  });
  assert.deepStrictEqual(projected, {
    guidedActivityId: "warm_engine_1",
    guidedActivityKind: "drill",
    guidedBlockType: "warm_engine"
  });
});

test("projectRuntimeStateFields('guided') defaults missing fields to null rather than undefined", function() {
  var core = createDefaultSparkCore();
  var projected = core.projectRuntimeStateFields("guided", {});
  assert.deepStrictEqual(projected, {
    guidedActivityId: null,
    guidedActivityKind: null,
    guidedBlockType: null
  });
});

test("projectRuntimeStateFields falls back to the core's own runtime state when none is passed", function() {
  var core = createDefaultSparkCore();
  core.updateRuntimeState({
    guidedActivityId: "song_1",
    guidedActivityKind: "song",
    guidedBlockType: "song"
  });
  var projected = core.projectRuntimeStateFields("guided");
  assert.strictEqual(projected.guidedActivityId, "song_1");
  assert.strictEqual(projected.guidedBlockType, "song");
});

test("projectRuntimeStateFields returns null for an unknown domain instead of throwing", function() {
  var core = createDefaultSparkCore();
  assert.strictEqual(core.projectRuntimeStateFields("not_a_real_domain", {}), null);
});

test("js/actions/system_family.js mirrors guided runtime fields through the engine-owned projection", function() {
  var source = loadJS("js/actions/system_family.js");
  assert.ok(
    source.indexOf("core.projectRuntimeStateFields(\"guided\"") !== -1,
    "mirrorGuidedRuntimeFields should delegate to SparkCore's projection instead of re-deriving the field list itself"
  );
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
