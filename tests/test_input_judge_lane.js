// Regression test for bug #9: the input judge selected the single closest-in-time
// note and only checked lane against THAT note, so a fractionally-closer wrong-lane
// note stole the input and produced an unearned wrong_fret miss while a correct-lane
// note was perfectly hittable. The judge must prefer an in-window lane-matching note.
var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
global.eval(fs.readFileSync(path.join(__dirname, "..", "js/sparksuite/core/input_judge.js"), "utf8"));

var PRESET = { hitWindowMs: { perfect: 70, good: 140, miss: 220 }, extraFretTolerance: false };
function note(timeSec, laneMask) { return { timeSec: timeSec, laneMask: laneMask, hit: false, missed: false }; }

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- Input judge lane preference ---");

test("prefers an in-window lane-matching note over a fractionally-closer wrong-lane note", function() {
  var judge = new window.SparkInputJudge();
  var notes = [note(1.000, 1), note(1.030, 2)]; // lane0 at 1.000s, lane1 at 1.030s
  var res = judge.resolve(notes, { atSec: 1.014, laneMask: 2 }, PRESET); // holding lane1; closer to the lane0 note
  assert.strictEqual(res.matched, true);
  assert.notStrictEqual(res.reason, "wrong_fret", "must not steal the input onto the wrong-lane note");
  assert.strictEqual(res.note.laneMask, 2, "should judge the lane-matching note");
  assert.strictEqual(res.judgement, "perfect");
});

test("still reports wrong_fret when no lane-matching note is in the window", function() {
  var judge = new window.SparkInputJudge();
  var res = judge.resolve([note(1.000, 1)], { atSec: 1.000, laneMask: 2 }, PRESET);
  assert.strictEqual(res.reason, "wrong_fret");
  assert.strictEqual(res.judgement, "miss");
  assert.strictEqual(res.note.laneMask, 1);
});

test("judges a lane-matching note even when a wrong-lane note is closer in time", function() {
  var judge = new window.SparkInputJudge();
  var notes = [note(1.000, 1), note(1.100, 2)];
  var res = judge.resolve(notes, { atSec: 1.010, laneMask: 2 }, PRESET); // lane0 10ms away, lane1 90ms away
  assert.strictEqual(res.note.laneMask, 2);
  assert.strictEqual(res.judgement, "good"); // 90ms -> good (<=140)
});

test("no target when nothing is in the miss window", function() {
  var judge = new window.SparkInputJudge();
  var res = judge.resolve([note(2.000, 2)], { atSec: 1.000, laneMask: 2 }, PRESET);
  assert.strictEqual(res.matched, false);
  assert.strictEqual(res.reason, "no_target");
});

console.log("\n--- Snapshot target selection (performance mode) ---");

test("prefers the closest full-match candidate over a closer partial match", function() {
  var judge = new window.SparkInputJudge();
  var partial = { absDiffMs: 40, fullMatch: false };
  var full = { absDiffMs: 200, fullMatch: true };
  assert.strictEqual(judge.selectSnapshotTarget([partial, full]), full);
});

test("falls back to the closest partial match when nothing matches fully", function() {
  var judge = new window.SparkInputJudge();
  var far = { absDiffMs: 250, fullMatch: false };
  var near = { absDiffMs: 50, fullMatch: false };
  assert.strictEqual(judge.selectSnapshotTarget([far, near]), near);
});

test("closest full match wins among multiple full matches", function() {
  var judge = new window.SparkInputJudge();
  var farFull = { absDiffMs: 300, fullMatch: true };
  var nearFull = { absDiffMs: 60, fullMatch: true };
  assert.strictEqual(judge.selectSnapshotTarget([farFull, nearFull, { absDiffMs: 10, fullMatch: false }]), nearFull);
});

test("returns null for an empty or missing candidate list", function() {
  var judge = new window.SparkInputJudge();
  assert.strictEqual(judge.selectSnapshotTarget([]), null);
  assert.strictEqual(judge.selectSnapshotTarget(null), null);
});
