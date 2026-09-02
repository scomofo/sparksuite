/*
 * Two P1 findings from the Codex review on PR #120, both in code that PR
 * introduced. The PR merged before they were addressed, so these are the
 * follow-up fixes.
 *
 * 1. progress_orchestrator used `event.accuracy || 0.75`. Once that cascade
 *    step actually ran, a genuine accuracy of 0 — a completely failed attempt
 *    — was recorded as 75% mastery. Two failed chord attempts therefore
 *    cleared the `> 70` gates in evaluateUnlocks() and unlocked the F chord.
 *
 * 2. ensurePerformanceMicInput guarded only on S.chordDetectOn, which stays
 *    false while getUserMedia is pending. A second start during that window
 *    acquired a second stream, and a stop could not cancel a request already
 *    in flight, so the microphone could switch on after the user had picked
 *    another input source.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
function read(rel) { return fs.readFileSync(path.join(repoRoot, rel), "utf8"); }
function load(rel) { global.eval(read(rel)); }

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

global.window = global;
global.saveState = function () {};
global.S = { mastery: {}, unlocks: {}, masteryScaleVersion: 1 };
load("js/utils/day.js");
load("js/utils/mastery.js");
load("js/sparksuite/core/progress_engine.js");
load("js/progression/mastery.js");
load("js/progression/unlocks.js");

var Engine = global.SparkSuiteProgressEngine;

// The orchestrator's accuracy resolution, extracted from the real source so
// the test cannot drift from it.
var orchestratorSrc = read("js/sparksuite/core/progress_orchestrator.js");
function resolveAccuracy(event, fallback) {
  var body = orchestratorSrc.slice(orchestratorSrc.indexOf("function accuracyOr(fallback)"));
  body = body.slice(0, body.indexOf("\n      }") + 8);
  return new Function("event", "fallback", body + "; return accuracyOr(fallback);")(event, fallback);
}

function reset() { S.mastery = {}; S.unlocks = {}; S.masteryScaleVersion = 1; }

// --- Finding 1 ------------------------------------------------------------

test("a real accuracy of 0 is preserved, not replaced by the default", function() {
  assert.strictEqual(resolveAccuracy({ accuracy: 0 }, 0.75), 0);
});

test("a missing or non-numeric accuracy still takes the default", function() {
  assert.strictEqual(resolveAccuracy({}, 0.75), 0.75);
  assert.strictEqual(resolveAccuracy({ accuracy: null }, 0.75), 0.75);
  assert.strictEqual(resolveAccuracy({ accuracy: "0.9" }, 0.75), 0.75);
  assert.strictEqual(resolveAccuracy({ accuracy: NaN }, 0.75), 0.75);
  assert.strictEqual(resolveAccuracy({ accuracy: Infinity }, 0.75), 0.75);
});

test("real values pass through untouched", function() {
  assert.strictEqual(resolveAccuracy({ accuracy: 0.5 }, 0.75), 0.5);
  assert.strictEqual(resolveAccuracy({ accuracy: 1 }, 0.75), 1);
});

test("two failed chord attempts record 0% and do not unlock the F chord", function() {
  reset();
  ["C", "G"].forEach(function (chord) {
    Engine.blendCategoryMastery("chords", chord, resolveAccuracy({ accuracy: 0 }, 0.75));
  });
  assert.strictEqual(getMastery("chords", "C"), 0, "a total failure is 0% mastery, not 75%");
  assert.strictEqual(getMastery("chords", "G"), 0);
  evaluateUnlocks();
  assert.ok(
    !(S.unlocks.chords && S.unlocks.chords.F),
    "failing every note must not unlock the F chord"
  );
});

test("genuinely strong attempts still unlock the F chord", function() {
  reset();
  ["C", "G"].forEach(function (chord) {
    for (var i = 0; i < 3; i++) {
      Engine.blendCategoryMastery("chords", chord, resolveAccuracy({ accuracy: 0.95 }, 0.75));
    }
  });
  evaluateUnlocks();
  assert.ok(S.unlocks.chords && S.unlocks.chords.F, "the unlock must still work when earned");
});

// --- Finding 2 ------------------------------------------------------------

var audioSrc = read("js/audio.js");
var sessionSrc = read("js/performance/session.js");

test("each acquisition carries a generation token", function() {
  assert.ok(/var _chordDetectGeneration\s*=\s*0/.test(audioSrc));
  assert.ok(
    /var myGeneration\s*=\s*\+\+_chordDetectGeneration/.test(audioSrc),
    "startChordDetect must stamp a generation before requesting the microphone"
  );
});

test("a superseded acquisition disposes of its own stream", function() {
  var then = audioSrc.slice(audioSrc.indexOf("getUserMedia(getAudioConstraint()).then"));
  then = then.slice(0, then.indexOf("chordR.stream=st;"));
  assert.ok(/myGeneration!==_chordDetectGeneration/.test(then), "it must compare generations");
  assert.ok(
    /st\.getTracks\(\)\.forEach\(function\(t\)\{t\.stop\(\);\}\)/.test(then),
    "a stale stream must be stopped, or the microphone stays live and untracked"
  );
});

test("stopping invalidates a request that is still in flight", function() {
  var stop = audioSrc.slice(audioSrc.indexOf("function stopChordDetect()"));
  stop = stop.slice(0, stop.indexOf("\n}"));
  assert.ok(
    /_chordDetectGeneration\+\+/.test(stop),
    "stopChordDetect must bump the generation so a pending request cannot install itself"
  );
});

test("a stale failure does not overwrite current state", function() {
  var caught = audioSrc.slice(audioSrc.indexOf("}).catch(function(){"));
  caught = caught.slice(0, caught.indexOf("render();"));
  assert.ok(
    /myGeneration!==_chordDetectGeneration\)\s*return/.test(caught),
    "a denial from a superseded request must not clear the live session's state"
  );
});

test("the performance path waits on a pending request", function() {
  assert.ok(/function isChordDetectPending\(\)/.test(audioSrc), "pending state must be observable");
  var fn = sessionSrc.slice(sessionSrc.indexOf("function ensurePerformanceMicInput()"));
  fn = fn.slice(0, fn.indexOf("\n}"));
  // Ordering is about code, not the comments explaining it — prose in this
  // function mentions startChordDetect() before the guard it describes.
  fn = fn.replace(/^[ \t]*\/\/[^\n]*/gm, "");
  assert.ok(
    /isChordDetectPending\(\)/.test(fn),
    "checking S.chordDetectOn alone starts a second acquisition during the pending window"
  );
  var onIdx = fn.indexOf("S.chordDetectOn");
  var pendingIdx = fn.indexOf("isChordDetectPending");
  assert.ok(onIdx > -1 && pendingIdx > onIdx, "both guards must run before startChordDetect()");
  assert.ok(fn.indexOf("startChordDetect()") > pendingIdx);
});

console.log("PASS: Codex review follow-ups — zero accuracy preserved, mic acquisition guarded (" + passed + " checks)");
