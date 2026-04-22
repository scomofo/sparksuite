var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


function resetEnv() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.S = {
    performCalibrationSource: "undefined",
    performCalibrationMode: true,
    performTimingOffsetMs: "NaN",
    performMidiOffsetMs: { broken: true },
    performMicOffsetMs: [],
    performCalibrationHits: { broken: true }
  };
  global.computeCalibrationOffsetMs = function() { return "NaN"; };
  global.getCalibrationBeatIndex = function() { return "NaN"; };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {}
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/pages/perform_calibration.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Perform Calibration Page Resolution ---");

test("performCalibrationPage ignores malformed cached calibration state", function() {
  var html = performCalibrationPage();
  var view = getPerformanceCalibrationView();

  assert.strictEqual(view.source, "midi");
  assert.strictEqual(view.globalOffsetMs, 0);
  assert.strictEqual(view.midiOffsetMs, 0);
  assert.strictEqual(view.micOffsetMs, 0);
  assert.ok(html.indexOf("Global Offset: 0 ms") >= 0);
  assert.ok(html.indexOf("MIDI Offset: 0 ms") >= 0);
  assert.ok(html.indexOf("Mic Offset: 0 ms") >= 0);
  assert.ok(html.indexOf("Captured Hits:</b> 0") >= 0);
  assert.ok(html.indexOf("Suggested Offset: 0 ms") >= 0);
  assert.ok(html.indexOf(">0</div>") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
