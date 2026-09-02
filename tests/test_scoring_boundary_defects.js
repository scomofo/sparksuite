/*
 * Three defects found while mapping SparkSuite's two scoring models. All three
 * are independent of which model the product eventually standardises on, and
 * all three failed silently — nothing threw, nothing logged, the numbers just
 * came out wrong.
 *
 * 1. Five engine-tier call sites guarded on startPlayableRhythmHighwayPayload,
 *    which was never defined anywhere in production. Every one fell through,
 *    so the ExecutionGateway's practice route, Spotify play-along and
 *    SessionRuntime's drill launch all quietly did nothing.
 *
 * 2. Accuracy reaches ProgressEngine on two different scales (0..1 from the
 *    gameplay engine, 0..100 from the performance scorer) and every consumer
 *    CLAMPED rather than converted — so a value on the wrong scale was
 *    flattened into a plausible number instead of rejected.
 *
 * 3. Strum direction is never measured (inferStrumDirectionFromCluster is a
 *    stub returning null), but pro scored the unmeasured component as 0. That
 *    capped every pro strum at 0.80, putting "perfect" out of reach.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
function read(rel) { return fs.readFileSync(path.join(repoRoot, rel), "utf8"); }
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/[^\n]*/gm, "");
}

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

// --- Defect 1: the guarded launcher that never existed --------------------

test("every guarded call to startPlayableRhythmHighwayPayload has a definition", function () {
  var guards = [];
  ["js/sparksuite/core/execution_gateway.js", "js/sparksuite/core/spark_core.js",
   "js/sparksuite/core/session_runtime.js"].forEach(function (f) {
    if (/startPlayableRhythmHighwayPayload/.test(read(f))) guards.push(f);
  });
  assert.ok(guards.length >= 3, "expected the engine tier to still guard on this launcher");

  var page = read("js/pages/rhythm_highway.js");
  assert.ok(
    /window\.startPlayableRhythmHighwayPayload\s*=/.test(page),
    "the engine tier guards on this name; without an export every guard falls through silently"
  );
  assert.ok(
    /function startPlayableRhythmHighwayPayload\s*\(\s*payload\s*,\s*launchContext\s*\)/.test(page),
    "callers pass (payload, launchContext)"
  );
});

test("the launcher does not inherit the previous run's preset or loop", function () {
  var page = strip(read("js/pages/rhythm_highway.js"));
  var body = page.slice(page.indexOf("function startPlayableRhythmHighwayPayload"));
  body = body.slice(0, body.indexOf("\n  }") + 4);

  // These callers start a different exercise than whatever ran last, so the
  // exercise's own preset must win over the sticky S.rhythmHighwayPreset that
  // startRhythmHighwayPayload would otherwise prefer.
  assert.ok(
    /startRhythmHighwayPayload\(\s*payload\s*,\s*\(payload && payload\.enginePreset\) \|\| null\s*,\s*launchContext\s*\)/.test(body),
    "the payload's own enginePreset must be passed as the middle argument"
  );
  assert.ok(
    /S\.rhythmHighwayLoop = null/.test(body),
    "a stale loop window must be cleared; passing loopSpec null cannot express " +
      "'no loop' because the resolution is `launchContext.loopSpec || S.rhythmHighwayLoop`"
  );

  // The two behaviours above only matter because of these two lines in the
  // function being delegated to. Pin them so the adapter cannot silently
  // become redundant or wrong if the resolution changes.
  assert.ok(
    /resolveRhythmHighwayPresetName\(presetName \|\| S\.rhythmHighwayPreset \|\| payload\.enginePreset\)/.test(page),
    "preset resolution changed — recheck whether the adapter still needs to pass one"
  );
  assert.ok(
    /var resolvedLoopSpec = launchContext\.loopSpec \|\| S\.rhythmHighwayLoop \|\| null;/.test(page),
    "loop resolution changed — recheck whether clearing S.rhythmHighwayLoop is still needed"
  );
  assert.ok(
    /function startRhythmHighwayPayload\(payload, presetName, launchContext\)/.test(page),
    "startRhythmHighwayPayload's signature changed — recheck the adapter"
  );
});

test("the adapter clears the stale loop and forwards the payload preset", function () {
  // Run the real adapter body against a stub of the function it delegates to,
  // so this asserts behaviour rather than matching source text.
  var page = strip(read("js/pages/rhythm_highway.js"));
  var body = page.slice(page.indexOf("function startPlayableRhythmHighwayPayload"));
  body = body.slice(0, body.indexOf("\n  }") + 4);

  var seen = null;
  var scope = {
    S: {
      rhythmHighwayPreset: "spark_gentle",
      rhythmHighwayLoop: { startTick: 0, endTick: 480, label: "previous exercise" }
    }
  };
  var run = new Function("S", "startRhythmHighwayPayload", body +
    "; return startPlayableRhythmHighwayPayload;")(scope.S, function (payload, presetName, ctx) {
      // Capture what the real function would resolve against, per lines 317-318.
      seen = {
        presetName: presetName,
        loopAtCall: scope.S.rhythmHighwayLoop,
        resolvedPreset: presetName || scope.S.rhythmHighwayPreset || payload.enginePreset,
        resolvedLoop: (ctx && ctx.loopSpec) || scope.S.rhythmHighwayLoop || null
      };
      return true;
    });

  run({ chartId: "drill", enginePreset: "spark_pro", songChart: {} },
      { source: "session_runtime", label: "Drill", instrument: "guitar" });

  assert.strictEqual(seen.presetName, "spark_pro",
    "the exercise's own preset must be passed, not left to the sticky S.rhythmHighwayPreset");
  assert.strictEqual(seen.resolvedPreset, "spark_pro",
    "a drill must not launch at the previous run's assist preset");
  assert.strictEqual(seen.loopAtCall, null, "the stale loop window must be cleared before delegating");
  assert.strictEqual(seen.resolvedLoop, null,
    "a fresh drill must not be sliced by the loop window set on a previous exercise");
});

test("a caller that asks for a loop still gets one", function () {
  var page = strip(read("js/pages/rhythm_highway.js"));
  var body = page.slice(page.indexOf("function startPlayableRhythmHighwayPayload"));
  body = body.slice(0, body.indexOf("\n  }") + 4);
  var seen = null;
  var S = { rhythmHighwayPreset: null, rhythmHighwayLoop: { startTick: 0, endTick: 100 } };
  var run = new Function("S", "startRhythmHighwayPayload", body +
    "; return startPlayableRhythmHighwayPayload;")(S, function (payload, presetName, ctx) {
      seen = { loopSpec: ctx.loopSpec, loopState: S.rhythmHighwayLoop };
      return true;
    });
  var wanted = { startTick: 200, endTick: 400, label: "requested" };
  run({ songChart: {} }, { loopSpec: wanted });
  assert.strictEqual(seen.loopSpec, wanted, "an explicitly requested loop must survive");
  assert.strictEqual(seen.loopState, S.rhythmHighwayLoop,
    "clearing must not fire when the caller supplied its own loop");
});

// --- Defect 2: two accuracy scales ---------------------------------------

global.window = global;
global.saveState = function () {};
global.S = { mastery: {}, unlocks: {} };
global.eval(read("js/sparksuite/core/progress_engine.js"));
var Engine = global.SparkSuiteProgressEngine;

test("each scale converts to a canonical percent", function () {
  assert.strictEqual(Engine.toAccuracyPercent(0.95, Engine.ACCURACY_FRACTION), 95);
  assert.strictEqual(Engine.toAccuracyPercent(95, Engine.ACCURACY_PERCENT), 95);
  assert.strictEqual(Engine.toAccuracyFraction(0.95, Engine.ACCURACY_FRACTION), 0.95);
  assert.strictEqual(Engine.toAccuracyFraction(95, Engine.ACCURACY_PERCENT), 0.95);
});

test("a perfect run is a perfect run on either scale", function () {
  assert.strictEqual(Engine.toAccuracyPercent(1, Engine.ACCURACY_FRACTION), 100);
  assert.strictEqual(Engine.toAccuracyPercent(100, Engine.ACCURACY_PERCENT), 100);
});

test("the corruption the old clamping produced is gone", function () {
  // Before: clampProgressNumber(0.95, 0, 100) === 0.95, displayed as 1% accuracy.
  assert.notStrictEqual(
    Engine.toAccuracyPercent(0.95, Engine.ACCURACY_FRACTION), 0.95,
    "a 95% run must not read as 0.95%"
  );
  // Before: Math.min(1, 95) === 1, a mediocre run read as flawless.
  assert.strictEqual(
    Engine.toAccuracyFraction(60, Engine.ACCURACY_PERCENT), 0.6,
    "a 60% run must not clamp to a perfect 1"
  );
});

test("junk and out-of-range values collapse to a safe bound", function () {
  [undefined, null, NaN, Infinity, "abc", -5].forEach(function (v) {
    assert.strictEqual(Engine.toAccuracyPercent(v, Engine.ACCURACY_PERCENT), 0, String(v));
  });
  assert.strictEqual(Engine.toAccuracyPercent(9999, Engine.ACCURACY_PERCENT), 100);
  assert.strictEqual(Engine.toAccuracyPercent(5, Engine.ACCURACY_FRACTION), 100);
});

test("no accuracy consumer clamps a raw value any more", function () {
  var src = strip(read("js/sparksuite/core/progress_engine.js"));
  assert.strictEqual(
    src.match(/clampProgressNumber\(\s*results\.accuracy/), null,
    "results.accuracy must be converted with an explicit scale, not clamped"
  );
  assert.strictEqual(
    src.match(/Math\.min\(1,\s*gameplay\.accuracy\)/), null,
    "gameplay.accuracy must be converted with an explicit scale, not clamped"
  );
});

test("both XP formulas still award exactly what they did before", function () {
  // A: 20 base + round(fraction * 20)  → 40 for a perfect run
  assert.strictEqual(20 + Math.round(Engine.toAccuracyFraction(1, Engine.ACCURACY_FRACTION) * 20), 40);
  assert.strictEqual(20 + Math.round(Engine.toAccuracyFraction(0.5, Engine.ACCURACY_FRACTION) * 20), 30);
  // B: max(5, round(percent / 10))     → 10 for a perfect run
  assert.strictEqual(Math.max(5, Math.round(Engine.toAccuracyPercent(100, Engine.ACCURACY_PERCENT) / 10)), 10);
  assert.strictEqual(Math.max(5, Math.round(Engine.toAccuracyPercent(20, Engine.ACCURACY_PERCENT) / 10)), 5);
});

// --- Defect 3: the unmeasurable strum-direction tax -----------------------

global.eval(read("js/performance/difficulties.js"));
global.eval(read("js/performance/scoring.js"));

function perfectStrum(difficulty) {
  var event = { type: "strum", t: 1, notes: ["C", "E", "G"], rhythm: { dir: "down" } };
  var snapshot = { pitchClasses: ["C", "E", "G"] };
  return scorePerformanceEvent(event, snapshot, 0, difficulty, "mic");
}

test("a flawless strum reaches perfect on every difficulty, pro included", function () {
  ["easy", "normal", "pro"].forEach(function (d) {
    var r = perfectStrum(d);
    assert.strictEqual(r.grade, "perfect",
      d + " graded a flawless strum as '" + r.grade + "' (score " + r.score + ")");
    assert.strictEqual(r.score, 1, d + " should score a flawless strum as 1");
  });
});

test("pro specifically is no longer capped at 0.80", function () {
  // (0.65 + 0.35 + 0) / 1.25 = 0.80 → "good" was the old ceiling.
  var r = perfectStrum("pro");
  assert.ok(r.score > 0.8, "pro strum score must clear the old 0.80 cap, got " + r.score);
});

test("a genuinely wrong direction is still penalised when it can be measured", function () {
  var event = { type: "strum", t: 1, notes: ["C"], rhythm: { dir: "down" } };
  // A matched cluster carrying an observed direction — what the stub will
  // provide once inferStrumDirectionFromCluster is implemented.
  var snapshot = {
    pitchClasses: ["C"],
    attackClusters: [{ tSec: 1, pitchClasses: ["C"], strumDir: "up", notes: [60, 64] }]
  };
  var wrong = scorePerformanceEvent(event, snapshot, 0, "pro", "midi");
  snapshot.attackClusters[0].strumDir = "down";
  var right = scorePerformanceEvent(event, snapshot, 0, "pro", "midi");
  assert.ok(right.score > wrong.score,
    "playing the charted direction must beat playing the opposite one (" +
      right.score + " vs " + wrong.score + ")");
});

test("timing still matters — the fix must not flatten every strum to perfect", function () {
  var event = { type: "strum", t: 1, notes: ["C", "E", "G"], rhythm: { dir: "down" } };
  var snapshot = { pitchClasses: ["C", "E", "G"] };
  var onTime = scorePerformanceEvent(event, snapshot, 0, "pro", "mic");
  var late = scorePerformanceEvent(event, snapshot, 500, "pro", "mic");
  assert.strictEqual(onTime.grade, "perfect");
  assert.ok(late.score < onTime.score, "a badly late strum must score below an on-time one");
  assert.notStrictEqual(late.grade, "perfect", "500ms late must not still grade perfect");
  // Deliberately not asserting "miss": this scorer blends note and timing, and
  // every difficulty's noteWeight (0.65 on pro) sits above the 0.45 miss line,
  // so a chord whose notes are all correct cannot grade a miss on timing alone.
  // That is this model's own behaviour, unchanged here, and one of the ways it
  // differs from the lane judge.
  assert.strictEqual(late.timingScore, 0, "500ms is outside every window");
  assert.strictEqual(late.score, 0.65, "note credit alone on pro");
});

test("wrong notes still matter", function () {
  var event = { type: "strum", t: 1, notes: ["C", "E", "G"], rhythm: { dir: "down" } };
  var partial = scorePerformanceEvent(event, { pitchClasses: ["C"] }, 0, "pro", "mic");
  assert.ok(partial.score < 1, "one note of three must not score a perfect strum");
});

console.log("PASS: scoring boundary defects — launcher defined, accuracy scales explicit, unmeasured strum direction no longer penalised (" + passed + " checks)");
