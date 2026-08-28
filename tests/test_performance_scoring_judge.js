var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

function resetEnv() {
  global.window = global;
  global.S = {
    performChart: null,
    performMode: "mic",
    performDifficulty: "normal",
    performWindowPerfectMs: 30,
    performWindowGoodMs: 80,
    performWindowMissMs: 150,
    performMicOffsetMs: 0,
    performPhraseStats: [],
    performCombo: 0,
    performMaxCombo: 0,
    performScore: 0,
    performAccuracy: 0,
    performInputSource: null,
    performInputNotes: [],
    performTargetTechnique: null,
    performLastHitLabel: null,
    performLastHitTime: null
  };
  global.render = function() {};
  global.saveState = function() {};
  global.PerformanceInput = {
    activeMode: "mic",
    getSnapshot: function() {
      return { pitchClasses: global.__testPitchClasses ? global.__testPitchClasses.slice() : [] };
    }
  };
  global.eval(loadJS("js/sparksuite/core/input_judge.js"));
  global.eval(loadJS("js/performance/scoring.js"));
  global.eval(loadJS("js/performance/session.js"));
}

function makeEvent(id, t, notes) {
  return { id: id, t: t, type: "note", notes: notes, phraseId: null };
}

console.log("\n--- Performance scoring routed through the shared InputJudge ---");

test("a single in-window matching candidate is scored", function() {
  resetEnv();
  var a = makeEvent("a", 1.0, ["C"]);
  S.performChart = { events: [a] };
  global.__testPitchClasses = ["C"];

  maybeScorePendingEvents(1.0);

  assert.strictEqual(a._scored, true);
  assert.strictEqual(a._hit, true);
  assert.ok(S.performScore > 0);
  assert.strictEqual(S.performCombo, 1);
});

test("no snapshot activity leaves in-window candidates unscored", function() {
  resetEnv();
  var a = makeEvent("a", 1.0, ["C"]);
  S.performChart = { events: [a] };
  global.__testPitchClasses = [];

  maybeScorePendingEvents(1.0);

  assert.strictEqual(a._scored, undefined);
  assert.strictEqual(S.performScore, 0);
});

test("an expired event outside the window is marked miss and resets combo", function() {
  resetEnv();
  var a = makeEvent("a", 1.0, ["C"]);
  S.performChart = { events: [a] };
  S.performCombo = 3;
  global.__testPitchClasses = [];

  maybeScorePendingEvents(1.0 + S.performWindowMissMs / 1000 + 0.5);

  assert.strictEqual(a._scored, true);
  assert.strictEqual(a._miss, true);
  assert.strictEqual(S.performCombo, 0);
});

test("two simultaneously-matching in-window events do not both claim credit from one frame's input", function() {
  resetEnv();
  // Both target the same pitch class so both are genuine matches once played —
  // the old independent-per-event scan would score both off the single
  // snapshot in the same call. The shared judge should award this frame's
  // input to only the closer (in time) of the two.
  var farther = makeEvent("farther", 1.0, ["C"]);
  var closer = makeEvent("closer", 1.05, ["C"]);
  S.performChart = { events: [farther, closer] };
  global.__testPitchClasses = ["C"];

  maybeScorePendingEvents(1.05);

  assert.strictEqual(closer._scored, true, "the closer candidate should be credited this frame");
  assert.strictEqual(farther._scored, undefined, "the farther candidate must not be double-credited in the same frame");
  assert.strictEqual(S.performCombo, 1);

  // The still-pending candidate is picked up on a later frame once the input
  // is still active and it becomes the closest remaining unscored candidate.
  maybeScorePendingEvents(1.06);

  assert.strictEqual(farther._scored, true);
  assert.strictEqual(S.performCombo, 2);
});

test("a closer non-matching candidate does not block a farther genuinely-matching candidate", function() {
  resetEnv();
  var wrongButCloser = makeEvent("wrong", 1.0, ["G"]);
  var rightButFarther = makeEvent("right", 0.9, ["C"]);
  S.performChart = { events: [wrongButCloser, rightButFarther] };
  global.__testPitchClasses = ["C"];

  maybeScorePendingEvents(1.0);

  assert.strictEqual(rightButFarther._scored, true, "the genuinely-matching event should still be credited");
  assert.strictEqual(rightButFarther._hit, true);
  assert.notStrictEqual(wrongButCloser._scored, true, "the closer non-matching event must not steal the credit");
});

if (process.exitCode) process.exit(process.exitCode);
