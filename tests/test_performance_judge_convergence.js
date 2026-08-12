// Judge convergence: LIVE performance scoring selects its target event
// through the shared SparkInputJudge instead of scoring every in-window
// event against the same input snapshot. Regression-pins the performance
// twin of the rhythm highway's lane-stealing fix: input intended for the
// chord actually being played must not be consumed by a neighboring event
// with a degraded partial-credit grade.
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

global.window = global;
global.S = {};
global.SCR = { PERFORM: "perform" };
global.TAB = { SONGS: "songs" };
global.getActivePerformanceOffsetMs = function() { return 0; };

var snapshotPitchClasses = [];
global.PerformanceInput = {
  activeMode: "mic",
  getSnapshot: function() {
    return { pitchClasses: snapshotPitchClasses.slice() };
  }
};

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

eval(loadJS("js/sparksuite/core/input_judge.js"));
eval(loadJS("js/sparksuite/core/scoring_engine.js"));
eval(loadJS("js/performance/scoring.js"));
eval(loadJS("js/performance/session.js"));

function chordEvent(tSec, notes) {
  return { t: tSec, type: "chord", notes: notes, phraseId: 0 };
}

function startChart(events) {
  var chart = {
    title: "Judge Test",
    artist: "Test",
    events: events,
    phrases: [{ id: 0, name: "Phrase", startSec: 0, endSec: 60 }]
  };
  S.performChart = chart;
  S.performPhraseStats = createEmptyPhraseStats(chart);
  S.performMode = "mic";
  S.performDifficulty = "normal";
  S.performWindowPerfectMs = 70;
  S.performWindowGoodMs = 140;
  S.performWindowMissMs = 350;
  S.performCombo = 0;
  S.performMaxCombo = 0;
  S.performScore = 0;
  S.performAccuracy = 0;
  S.performTargetTechnique = null;
  resetPerformanceScoringEngine();
  return chart;
}

console.log("=== Performance Judge Convergence Tests ===");

test("a fully-matched later event wins over a closer-in-scan-order partial match", function() {
  // C major at 10.0s, A minor at 10.3s; the player plays A minor 50ms early.
  var a = chordEvent(10.0, [0, 4, 7]);
  var b = chordEvent(10.3, [9, 0, 4]);
  startChart([a, b]);
  snapshotPitchClasses = [9, 0, 4];

  maybeScorePendingEvents(10.25);

  assert.strictEqual(b._hit, true, "the chord actually played must score");
  assert.strictEqual(b._result.grade, "perfect");
  assert.ok(!a._scored, "the earlier wrong-chord event must not consume the input");
  assert.strictEqual(S.performCombo, 1);
});

test("an unplayed event left pending becomes an honest miss when its window passes", function() {
  var a = chordEvent(10.0, [0, 4, 7]);
  var b = chordEvent(10.3, [9, 0, 4]);
  startChart([a, b]);
  snapshotPitchClasses = [9, 0, 4];

  maybeScorePendingEvents(10.25);
  snapshotPitchClasses = [];
  maybeScorePendingEvents(10.40); // A is now 400ms past — beyond the 350ms window

  assert.strictEqual(a._miss, true, "the skipped chord must be marked missed");
  assert.strictEqual(b._hit, true);
  assert.strictEqual(S.performCombo, 0, "the honest miss resets the combo");
});

test("a full match farther away beats a fractionally-closer partial match", function() {
  // The player holds C major; the C major event is 200ms late, but an
  // A-minor event 40ms away shares two of three pitch classes.
  var a = chordEvent(10.0, [0, 4, 7]);
  var b = chordEvent(10.24, [9, 0, 4]);
  startChart([a, b]);
  snapshotPitchClasses = [0, 4, 7];

  maybeScorePendingEvents(10.20);

  assert.strictEqual(a._hit, true, "the fully-matched chord must be judged");
  assert.ok(!b._scored, "the closer partial-overlap event must stay pending");
});

test("with no full match anywhere, the closest partial match scores", function() {
  var a = chordEvent(10.0, [0, 4, 7]);
  var b = chordEvent(10.3, [9, 0, 4]);
  startChart([a, b]);
  snapshotPitchClasses = [0, 4]; // sloppy two-note detection, partial for both

  maybeScorePendingEvents(10.25);

  assert.strictEqual(b._hit, true, "closest-in-time partial match wins");
  assert.ok(!a._scored);
});

test("a lone in-window event scores exactly as the legacy scanner did", function() {
  var a = chordEvent(10.0, [0, 4, 7]);
  startChart([a]);
  snapshotPitchClasses = [0, 4, 7];

  maybeScorePendingEvents(10.0);

  assert.strictEqual(a._hit, true);
  assert.strictEqual(a._result.grade, "perfect");
  assert.strictEqual(S.performCombo, 1);
  assert.strictEqual(S.performScore, 110); // 100 * 1.0 * (1 + 0.1 combo)
});

test("one frame's input scores at most one event", function() {
  // Same chord charted twice inside one window: a single frame must not
  // double-credit both from one snapshot.
  var a = chordEvent(10.0, [0, 4, 7]);
  var b = chordEvent(10.2, [0, 4, 7]);
  startChart([a, b]);
  snapshotPitchClasses = [0, 4, 7];

  maybeScorePendingEvents(10.15);

  var scored = (a._scored ? 1 : 0) + (b._scored ? 1 : 0);
  assert.strictEqual(scored, 1, "exactly one event may consume the frame's input");
});

if (failed > 0) process.exitCode = 1;
console.log("\n" + passed + " passed, " + failed + " failed");
