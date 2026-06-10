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
  assert.ok(html.indexOf('<span class="metric-label">Global Offset:</span> <span class="metric-value" style="font-size:13px">0 ms</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">MIDI Offset:</span> <span class="metric-value" style="font-size:13px">0 ms</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Mic Offset:</span> <span class="metric-value" style="font-size:13px">0 ms</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Captured Hits:</span> <span class="metric-value">0</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Suggested Offset:</span> <span class="metric-value" style="font-size:13px">0 ms</span>') >= 0);
  assert.ok(html.indexOf(">0</div>") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("performCalibrationPage can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.S.performCalibrationSource = "undefined";
  global.S.performCalibrationMode = false;
  global.S.performTimingOffsetMs = "NaN";
  global.S.performMidiOffsetMs = "NaN";
  global.S.performMicOffsetMs = "NaN";
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceCalibrationSource: "mic",
          performanceCalibrationMode: true,
          performanceTimingOffsetMs: 24,
          performanceMidiOffsetMs: 12,
          performanceMicOffsetMs: 36
        }
      };
    }
  };
  global.computeCalibrationOffsetMs = function() { return 18; };
  global.getCalibrationBeatIndex = function() { return 3; };

  global.eval(loadJS("js/pages/perform_calibration.js"));

  var html = performCalibrationPage();
  var view = getPerformanceCalibrationView();
  assert.strictEqual(view.source, "mic");
  assert.strictEqual(view.mode, true);
  assert.strictEqual(view.globalOffsetMs, 24);
  assert.strictEqual(view.midiOffsetMs, 12);
  assert.strictEqual(view.micOffsetMs, 36);
  assert.ok(html.indexOf('<span class="metric-label">Global Offset:</span> <span class="metric-value" style="font-size:13px">24 ms</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">MIDI Offset:</span> <span class="metric-value" style="font-size:13px">12 ms</span>') >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Mic Offset:</span> <span class="metric-value" style="font-size:13px">36 ms</span>') >= 0);
  assert.ok(html.indexOf(">3</div>") >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Suggested Offset:</span> <span class="metric-value" style="font-size:13px">18 ms</span>') >= 0);
});

test("perform page calibration controls route through actions", function() {
  var source = loadJS("js/pages/perform.js");
  assert.ok(source.indexOf('onclick="act(\\\'performCalibrationTap\\\')"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'performCalibrationCancel\\\')"') >= 0);
});

test("performCalibrationPage uses shared visual contract classes", function() {
  var html = performCalibrationPage();
  var source = loadJS("js/pages/perform_calibration.js");

  assert.strictEqual(html.indexOf("<b>"), -1);
  assert.strictEqual(source.indexOf("<b>"), -1);
  assert.ok(html.indexOf('class="card-section-heading mb12"') >= 0);
  assert.ok(html.indexOf('class="metric-label"') >= 0);
  assert.ok(html.indexOf('class="metric-value"') >= 0);
  assert.ok(html.indexOf('class="action-row"') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
