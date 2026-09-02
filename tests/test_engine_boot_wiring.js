/*
 * Guards against "written, tested, and never loaded".
 *
 * Node tests load engine files explicitly via eval/require, a path the
 * browser never takes, so a module can be fully covered by unit tests while
 * having no <script> tag and therefore not existing at runtime. That is how
 * chord/song mastery stayed broken: progress_orchestrator probed for a
 * global that was never wired, and every test still passed.
 *
 * This test reads index.html and asserts the wiring itself:
 *   1. Every engine global the live core reaches for is actually loaded.
 *   2. Every file under js/sparksuite/core/ is either loaded, or listed
 *      below as knowingly unloaded — so adding one silently is a failure.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
var indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");

function isLoaded(relPath) {
  return indexHtml.indexOf(relPath) !== -1;
}

/*
 * Engine modules that are deliberately not loaded. Each needs a reason.
 * Shrinking this list is the goal; adding to it should be a conscious act,
 * because everything here is code that cannot run in the app.
 */
var KNOWINGLY_UNLOADED = {
  "action_registry.js": "action dispatch, paired with execution_gateway",
  "error_boundary.js": "spark_core guards on it; activating changes error handling",
  "error_codes.js": "only consumed by other unloaded modules",
  "event_logger.js": "spark_core guards on it; activating turns on event logging",
  "execution_gateway.js": "727 lines of action dispatch; activating is its own piece of work",
  "feel_system.js": "superseded by SparkEnginePresetRegistry as the hit-window source",
  "flow_engine.js": "adaptive difficulty; activating changes how the app teaches",
  "learning_brain.js": "adaptive difficulty; activating changes how the app teaches",
  "lesson_generator.js": "unshipped lesson generation",
  "mastery_engine.js": "0-1 tier thresholds predate the 0-100 mastery scale",
  "performance_budget.js": "paired with performance_monitor",
  "performance_monitor.js": "spark_core guards on it; activating turns on measurement",
  "practice_engine_v2.js": "v2 engine pair, not yet chosen over v1",
  "session_engine_v2.js": "v2 engine pair, not yet chosen over v1",
  "session_state_machine.js": "activating enforces completion transitions; see spark_core.assertCanCompleteSession",
  "session_transitions.js": "paired with session_state_machine",
  "skill_tracker.js": "consumed by learning_brain, also unloaded",
  "spark_error.js": "structured errors, consumed by other unloaded modules",
  "spark_event_bus.js": "spark_core guards on it; activating turns on the event bus",
  "spark_log.js": "consumed by other unloaded modules",
  "spotify_integration.js": "unshipped Spotify feature",
  "system_wiring.js": "unshipped play-along feature; adds SparkCore.prototype methods",
  "time_source.js": "consumed by system_wiring, also unloaded"
};

var coreDir = path.join(repoRoot, "js/sparksuite/core");
var coreFiles = fs.readdirSync(coreDir).filter(function (f) {
  return /\.js$/.test(f);
});

var loaded = [];
var unloaded = [];
coreFiles.forEach(function (file) {
  if (isLoaded("js/sparksuite/core/" + file)) loaded.push(file);
  else unloaded.push(file);
});

// --- 1. No module drops out of the app unnoticed -------------------------

var unexpectedlyUnloaded = unloaded.filter(function (f) {
  return !Object.prototype.hasOwnProperty.call(KNOWINGLY_UNLOADED, f);
});
assert.deepStrictEqual(
  unexpectedlyUnloaded,
  [],
  "these core modules are not loaded by index.html and are not listed as knowingly unloaded — " +
    "add the <script> tag, or record why they are dormant: " + unexpectedlyUnloaded.join(", ")
);

// --- 2. The exemption list cannot rot ------------------------------------

var staleExemptions = Object.keys(KNOWINGLY_UNLOADED).filter(function (f) {
  return coreFiles.indexOf(f) === -1 || loaded.indexOf(f) !== -1;
});
assert.deepStrictEqual(
  staleExemptions,
  [],
  "these are listed as knowingly unloaded but are now loaded or deleted — remove them from the list: " +
    staleExemptions.join(", ")
);

// --- 3. The core the app actually runs on is wired -----------------------

[
  "js/sparksuite/core/spark_core.js",
  "js/sparksuite/core/session_engine.js",
  "js/sparksuite/core/practice_engine.js",
  "js/sparksuite/core/progress_engine.js",
  "js/sparksuite/core/curriculum_engine.js",
  "js/sparksuite/core/psychology_engine.js",
  "js/sparksuite/core/instrument_manager.js",
  "js/sparksuite/core/storage.js",
  "js/sparksuite/core/progress_orchestrator.js"
].forEach(function (file) {
  assert.ok(isLoaded(file), file + " is the live core and must be loaded by index.html");
});

// --- 4. Load order: dependencies come before their dependents ------------

function positionOf(relPath) {
  var i = indexHtml.indexOf(relPath);
  assert.ok(i !== -1, relPath + " must be loaded");
  return i;
}

assert.ok(
  positionOf("js/sparksuite/core/progress_engine.js") < positionOf("js/meta/skill_tree_meta.js"),
  "skill_tree_meta applies ProgressEngine's unlock decision, so the engine must load first"
);
assert.ok(
  positionOf("js/utils/mastery.js") < positionOf("js/progression/mastery.js"),
  "SparkMastery is the store the progression readers use"
);
assert.ok(
  positionOf("js/sparksuite/core/progress_engine.js") < positionOf("js/sparksuite/core/spark_core.js"),
  "spark_core composes the engines, so they must be defined first"
);

console.log(
  "PASS: engine boot wiring — " + loaded.length + " core modules loaded, " +
    unloaded.length + " knowingly dormant, load order intact"
);
