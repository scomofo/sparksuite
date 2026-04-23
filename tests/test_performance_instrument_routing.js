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
global.SparkInstruments = {
  getActive: function() {
    return { id: "ukespark", appId: "ukespark" };
  },
  getAll: function() {
    return [
      { id: "ukespark", appId: "ukespark", instrument: "ukulele" },
      { id: "bassspark", appId: "bassspark", instrument: "bass" },
      { id: "chordspark", appId: "chordspark", instrument: "guitar" }
    ];
  }
};

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

eval(loadJS("js/performance/chart_manifest.js"));
eval(loadJS("js/performance/chart.js"));
eval(loadJS("js/performance/session.js"));

console.log("=== Performance Instrument Routing Tests ===");

test("resolvePerformanceStartInstrument prefers active instrument for explicit shared-chart metadata", function() {
  var instrument = resolvePerformanceStartInstrument({
    instrument: "guitar",
    supportedInstruments: ["guitar", "ukulele", "piano"]
  }, "shared_chart", {});

  assert.strictEqual(instrument, "ukulele");
});

test("applyPerformanceChartInstrumentContext stamps shared charts with the active instrument", function() {
  var chart = applyPerformanceChartInstrumentContext({
    id: "shared_chart",
    instrument: "guitar",
    adapterType: "guitar",
    supportedInstruments: ["guitar", "ukulele", "piano"],
    events: [],
    phrases: []
  }, "shared_chart", {});

  assert.strictEqual(chart.instrument, "ukulele");
  assert.strictEqual(chart.adapterType, "ukulele");
});

test("applyPerformanceChartInstrumentContext preserves instrument-specific charts", function() {
  var chart = applyPerformanceChartInstrumentContext({
    id: "bass_midnight_lock_package",
    instrument: "bass",
    adapterType: "bass",
    events: [],
    phrases: []
  }, "bass_midnight_lock_package", {});

  assert.strictEqual(chart.instrument, "bass");
  assert.strictEqual(chart.adapterType, "bass");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
