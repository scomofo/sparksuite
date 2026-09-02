/*
 * Selecting "Mic" in song Performance must actually open a microphone.
 *
 * It used to set S.performMode and call PerformanceInput.start(), which only
 * resets buffers — nothing ever reached getUserMedia. The detector loop in
 * js/audio.js already forwards detected notes to PerformanceInput.onMicUpdate
 * while the perform screen is in mic mode, so the feed was wired; it was just
 * never started. The visible symptom was every note scoring as a miss for
 * anyone playing an acoustic instrument, unless they also had a MIDI
 * controller attached (which fed onMicUpdate via _processMIDIChord).
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
function sourceOf(file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

// --- The start path opens the mic, and does so after stopAllTimers --------

var sessionSrc = sourceOf("js/performance/session.js");

test("startPerformance opens the mic after tearing timers down", function() {
  var body = sessionSrc.slice(sessionSrc.indexOf("function startPerformance(chartIdOrChart"));
  var stopIdx = body.indexOf("stopAllTimers();");
  var ensureIdx = body.indexOf("ensurePerformanceMicInput();");
  assert.ok(stopIdx > -1, "startPerformance still calls stopAllTimers");
  assert.ok(ensureIdx > -1, "startPerformance must ensure mic input");
  assert.ok(
    ensureIdx > stopIdx,
    "the mic must be opened AFTER stopAllTimers(), which stops the detector — " +
      "opening it earlier means pressing Play silently closes the microphone"
  );
});

// --- ensurePerformanceMicInput behaviour ---------------------------------

function makeEnv(overrides) {
  var env = {
    S: { performMode: "mic", chordDetectOn: false },
    calls: []
  };
  Object.keys(overrides || {}).forEach(function (k) { env.S[k] = overrides[k]; });
  return env;
}

// Evaluate just the helper against a controlled scope.
function loadEnsure(env) {
  var src = sessionSrc.slice(
    sessionSrc.indexOf("function ensurePerformanceMicInput()"),
    sessionSrc.indexOf("function startPerformance(chartIdOrChart")
  );
  var factory = new Function(
    "S", "startChordDetect",
    src + "; return ensurePerformanceMicInput;"
  );
  return factory(env.S, function () {
    env.calls.push("startChordDetect");
    env.S.chordDetectOn = true;
  });
}

test("mic mode starts the detector", function() {
  var env = makeEnv();
  var ensure = loadEnsure(env);
  assert.strictEqual(ensure(), true);
  assert.deepStrictEqual(env.calls, ["startChordDetect"]);
});

test("non-mic modes never touch the microphone", function() {
  ["midi", "keyboard", "off"].forEach(function (mode) {
    var env = makeEnv({ performMode: mode });
    var ensure = loadEnsure(env);
    assert.strictEqual(ensure(), false, mode + " must not open the mic");
    assert.deepStrictEqual(env.calls, [], mode + " must not call startChordDetect");
  });
});

test("an already-running detector is not restarted", function() {
  var env = makeEnv({ chordDetectOn: true });
  var ensure = loadEnsure(env);
  assert.strictEqual(ensure(), true);
  assert.deepStrictEqual(env.calls, [], "restarting would drop and re-acquire the stream mid-song");
});

// --- The mode switch opens and releases it -------------------------------

var actionSrc = sourceOf("js/actions/performance_family.js");
var modeHandler = actionSrc.slice(
  actionSrc.indexOf('if (a === "performMode")'),
  actionSrc.indexOf('if (a === "performDifficulty")')
);

test("choosing Mic opens the microphone", function() {
  assert.ok(
    /v === "mic"[\s\S]{0,200}ensurePerformanceMicInput\(\)/.test(modeHandler),
    "the performMode handler must open the mic when mic is chosen"
  );
});

test("choosing another source releases the microphone", function() {
  assert.ok(
    /else if \([\s\S]{0,120}isChordDetectActive\(\)[\s\S]{0,160}stopChordDetect\(\)/.test(modeHandler),
    "switching away from mic must release the stream rather than leave it open"
  );
  assert.ok(
    !/else if \(S\.chordDetectOn\b/.test(modeHandler),
    "gating on S.chordDetectOn alone skips teardown while the request is still pending"
  );
});

// --- Teardown still covers leaving the screen ----------------------------

test("stopAllTimers still releases the microphone", function() {
  var timers = sourceOf("js/timers.js");
  assert.ok(
    /if\(typeof isChordDetectActive==="function"&&isChordDetectActive\(\)\)stopChordDetect\(\);/.test(timers),
    "leaving performance must tear down the microphone even mid-acquisition"
  );
});

// --- The feed the detector publishes into is still connected -------------

test("the detector still forwards notes to PerformanceInput in mic mode", function() {
  var audio = sourceOf("js/audio.js");
  assert.ok(
    /S\.performMode\s*===\s*"mic"[\s\S]{0,120}PerformanceInput\.onMicUpdate/.test(audio),
    "js/audio.js must publish detected notes to PerformanceInput while in mic mode"
  );
});

console.log("PASS: performance mic input is acquired, released, and fed (" + passed + " checks)");
