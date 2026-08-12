// Score-model convergence: one core SparkScoringEngine with two skins
// ("tiered" arcade profile for the rhythm highway, "quality" profile for
// performance mode), plus the shared cross-mode completion-XP policy
// (SparkCompletionXp) and the note-vs-input accuracy split.
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
eval(loadJS("js/sparksuite/domain/completion_xp.js"));
eval(loadJS("js/sparksuite/core/scoring_engine.js"));

var PRESET = { comboStep: 10, maxMultiplier: 4 };

function hit(judgement, flags) {
  return { judgement: judgement, note: { laneMask: 1, flags: flags || {} } };
}

console.log("=== Score Model Convergence Tests ===");

test("tiered profile (default) keeps the rhythm highway's arcade math", function() {
  var engine = new window.SparkScoringEngine(PRESET);
  assert.strictEqual(engine.profile, "tiered");

  assert.strictEqual(engine.apply(hit("perfect")).scoreDelta, 100);
  assert.strictEqual(engine.apply(hit("good")).scoreDelta, 70);
  assert.strictEqual(engine.apply(hit("ok")).scoreDelta, 40);

  // Stepped multiplier: x2 once the combo reaches comboStep (10).
  for (var i = 0; i < 7; i++) engine.apply(hit("perfect"));
  assert.strictEqual(engine.state.combo, 10);
  assert.strictEqual(engine.apply(hit("perfect")).scoreDelta, 200);

  // Special-phrase bonus stays a tiered-profile concern.
  var special = engine.apply(hit("perfect", { specialPhrase: true }));
  assert.strictEqual(special.special, true);
  assert.strictEqual(special.scoreDelta, 225);
});

test("quality profile reproduces performance mode's previous inline math exactly", function() {
  var engine = new window.SparkScoringEngine({ maxMultiplier: 4 }, { profile: "quality" });

  // Old inline math: combo++, mult = min(1 + combo*0.1, 4),
  // delta = round(100 * quality * mult).
  var expectedScore = 0;
  var combo = 0;
  var qualities = [1.0, 0.75, 0.58, 1.0, 0.45, 1.0];
  qualities.forEach(function(quality) {
    combo++;
    var mult = Math.min(1 + combo * 0.1, 4);
    expectedScore += Math.round(100 * quality * mult);
    engine.apply({ judgement: "good", quality: quality, note: { laneMask: 0, flags: {} } });
  });
  assert.strictEqual(engine.state.score, expectedScore);
  assert.strictEqual(engine.state.combo, qualities.length);

  // A miss resets the combo, exactly as the inline path did.
  engine.apply({ judgement: "miss", reason: "late", note: { laneMask: 0 } });
  assert.strictEqual(engine.state.combo, 0);

  // Smooth ramp caps at the preset max multiplier.
  for (var i = 0; i < 40; i++) engine.apply({ judgement: "perfect", quality: 1, note: { laneMask: 0, flags: {} } });
  assert.strictEqual(engine.getMultiplier(), 4);
});

test("summary splits note accuracy from input accuracy", function() {
  var engine = new window.SparkScoringEngine(PRESET);
  engine.apply(hit("perfect"));
  engine.apply(hit("perfect"));
  engine.apply({ judgement: "miss", reason: "late", note: { laneMask: 1 } }); // expired note
  engine.apply({ judgement: "miss", reason: "no_target", note: null });       // spurious strum

  var summary = engine.toSummary();
  // Note accuracy: 2 hits over 3 chart notes — spurious input excluded.
  assert.strictEqual(summary.gameplay.accuracy, 0.67);
  // Input accuracy keeps the old semantics: 2 hits over 4 apply calls.
  assert.strictEqual(summary.gameplay.inputAccuracy, 0.5);
});

test("SparkCompletionXp is one curve: base 20 plus accuracy/5, clamped", function() {
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(0), 20);
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(50), 30);
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(80), 36);
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(100), 40);
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(140), 40);
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(-5), 20);
  assert.strictEqual(window.SparkCompletionXp.forAccuracy(null), 20);
});

test("legacy rhythm tap completion awards normalized accuracy XP, not score/10", function() {
  var sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    Array: Array,
    JSON: JSON,
    Object: Object,
    S: { xp: 0, level: 1 },
    saveState: function() {}
  };
  sandbox.window = sandbox;
  var vm = require("vm");
  vm.runInNewContext(loadJS("js/sparksuite/domain/completion_xp.js"), sandbox);
  vm.runInNewContext(loadJS("js/sparksuite/core/progress_orchestrator.js"), sandbox);

  // 80% accuracy run with a big arcade score: XP must come from accuracy.
  var outcome = sandbox.SparkProgressOrchestrator.applySessionOutcome(
    { mode: "rhythm", accuracy: 0.8, completed: true, meta: { score: 4200 } },
    { drive: true }
  );
  assert.strictEqual(outcome.sessionEffects.xpEarned, 36); // 20 + 80/5
  assert.strictEqual(sandbox.S.xp, 36, "state XP must match the normalized award");

  // Callers that never report accuracy keep the legacy score/10 policy.
  var legacy = sandbox.SparkProgressOrchestrator.applySessionOutcome(
    { mode: "rhythm", completed: true, meta: { score: 150 } },
    { drive: true }
  );
  assert.strictEqual(legacy.sessionEffects.xpEarned, 15);
});

test("performance and rhythm paths share the completion-XP policy in source", function() {
  var sessionSource = loadJS("js/performance/session.js");
  var progressSource = loadJS("js/sparksuite/core/progress_engine.js");
  assert.ok(sessionSource.indexOf("SparkCompletionXp.forAccuracy") >= 0,
    "finishPerformance must use the shared policy");
  var uses = progressSource.split("SparkCompletionXp.forAccuracy").length - 1;
  assert.ok(uses >= 2,
    "progress engine must use the shared policy for both the daily-practice and performance-song flows (found " + uses + ")");
});

if (failed > 0) process.exitCode = 1;
console.log("\n" + passed + " passed, " + failed + " failed");
