var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    inputLatencyMs: 18,
    calibrationOffsets: [10, 20],
    timingWindows: {
      perfect: 45,
      good: 90,
      ok: 150
    }
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.performance = {
    now: function() { return 1000; }
  };
  global.saveState = function() {};
  global.startCalibrationMetronomeCalls = [];
  global.stopCalibrationMetronomeCalls = 0;
  global.startCalibrationMetronome = function(bpm) {
    startCalibrationMetronomeCalls.push(bpm);
  };
  global.stopCalibrationMetronome = function() {
    stopCalibrationMetronomeCalls++;
  };
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Audio State Fallbacks ---");

async function run() {
  await test("shared audio root helper includes plain global S fallback", function() {
    var source = loadJS("js/audio.js");
    assert.ok(source.indexOf('if(typeof globalThis!=="undefined"&&globalThis.S)return globalThis.S;') >= 0);
  });

  await test("audio calibration page and actions can use plain global S", function() {
    eval(loadJS("js/audio/calibration.js"));

    var html = calibrationPage();
    assert.ok(html.indexOf("Detected Latency: 18 ms") >= 0);
    assert.ok(html.indexOf("Samples: 2") >= 0);

    startAudioCalibration();
    stopAudioCalibration();

    assert.deepStrictEqual(S.calibrationOffsets, []);
    assert.deepStrictEqual(startCalibrationMetronomeCalls, [80]);
    assert.strictEqual(stopCalibrationMetronomeCalls, 1);
  });

  await test("latency helpers record offsets into plain global S", function() {
    eval(loadJS("js/audio/latency.js"));

    S.lastClickTime = 900;
    recordCalibrationHit(930);
    registerMetronomeClick();

    assert.strictEqual(Array.isArray(S.calibrationOffsets), true);
    assert.strictEqual(S.calibrationOffsets[S.calibrationOffsets.length - 1], 30);
    assert.strictEqual(Math.round(S.inputLatencyMs), 20);
    assert.strictEqual(S.lastClickTime, 1000);
  });

  await test("timing helpers can grade hits from plain global S", function() {
    eval(loadJS("js/audio/timing.js"));

    assert.strictEqual(getTimingRating(30), "perfect");
    assert.strictEqual(getTimingRating(75), "good");
    assert.strictEqual(getTimingRating(140), "ok");
    assert.strictEqual(getTimingRating(220), "miss");
    assert.strictEqual(getTimingScore(30), 1.0);
    assert.strictEqual(getTimingScore(75), 0.75);
  });

  await test("audio helpers fall back to global S when SparkState.getRoot returns null", function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/audio/calibration.js"));
    eval(loadJS("js/audio/latency.js"));
    eval(loadJS("js/audio/timing.js"));

    assert.ok(calibrationPage().indexOf("Detected Latency: 18 ms") >= 0);
    S.lastClickTime = 900;
    recordCalibrationHit(930);
    assert.strictEqual(S.calibrationOffsets[S.calibrationOffsets.length - 1], 30);
    assert.strictEqual(getTimingRating(30), "perfect");
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
