var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

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

function resetEnv() {
  global.window = global;
  global._sparkHighway = null;
  global.S = {
    performChart: null,
    performCurrentSec: 0,
    performCombo: 0
  };
  global.escHTML = function(value) { return String(value); };
  global.document = {
    getElementById: function(id) {
      if (id === "spark-highway-canvas") return { id: "spark-highway-canvas" };
      if (id === "perform-imported-overlay") return { innerHTML: "" };
      return null;
    },
    querySelectorAll: function() { return []; },
    querySelector: function() { return null; }
  };
  global.getPerformancePhraseForTime = function() { return null; };
  global.renderImportedTechniqueOverlay = function() { return ""; };
}

console.log("\n--- Performance Highway Resolution ---");

test("ensureSparkHighway picks piano skin for piano charts", function() {
  resetEnv();

  var createdSkin = null;
  global.SparkHighway = function SparkHighway(canvas, skin) {
    this.canvas = canvas;
    this.skin = skin;
    createdSkin = skin;
  };
  SparkHighway.GUITAR_SKIN = { id: "guitar_skin" };
  SparkHighway.PIANO_SKIN = { id: "piano_skin" };
  SparkHighway.prototype.init = function() { return Promise.resolve(); };
  SparkHighway.prototype.destroy = function() {};

  loadVM("js/performance/highway.js");
  ensureSparkHighway({ id: "canvas_1" }, { instrument: "piano" });

  assert.strictEqual(createdSkin, SparkHighway.PIANO_SKIN);
});

test("_updatePerformDisplay initializes the highway renderer before feeding chart data", function() {
  resetEnv();

  var calls = [];
  global.ensureSparkHighway = function(canvas, chart) {
    calls.push({ type: "ensure", canvas: canvas, chart: chart });
  };
  global.feedChartToHighway = function(chart) {
    calls.push({ type: "feed", chart: chart });
  };
  global.updateSparkHighway = function(nowSec, combo) {
    calls.push({ type: "update", nowSec: nowSec, combo: combo });
  };

  global.S.performChart = { id: "chart_1", instrument: "ukulele", events: [], phrases: [] };
  global.S.performCurrentSec = 12;
  global.S.performCombo = 4;

  loadVM("js/performance/session.js");
  _updatePerformDisplay();

  assert.strictEqual(calls.length >= 3, true);
  assert.strictEqual(calls[0].type, "ensure");
  assert.strictEqual(calls[0].chart.instrument, "ukulele");
  assert.strictEqual(calls[1].type, "feed");
  assert.strictEqual(calls[calls.length - 1].type, "update");
});

function chordChart(progression) {
  return {
    instrument: "guitar",
    events: progression.map(function(name, i) {
      return { id: i, t: i, type: "chord", chord: name, notes: [] };
    })
  };
}

test("chord events map distinct chords to distinct lanes in first-appearance order", function() {
  resetEnv();
  global.SparkHighway = function SparkHighway() {};
  SparkHighway.GUITAR_SKIN = { id: "guitar_skin", laneCount: 6 };
  loadVM("js/performance/highway.js");

  var chart = chordChart(["Am", "Am", "E", "G", "D", "F", "C"]);
  var lanes = chart.events.map(function(evt) { return derivePerformanceLaneIndex(chart, evt); });

  assert.deepStrictEqual(lanes, [0, 0, 1, 2, 3, 4, 5], "each new chord takes the next lane; repeats stay put");
});

test("chord lanes stay stable across the whole chart and wrap past the lane count", function() {
  resetEnv();
  global.SparkHighway = function SparkHighway() {};
  SparkHighway.GUITAR_SKIN = { id: "guitar_skin", laneCount: 6 };
  loadVM("js/performance/highway.js");

  // 7 unique chords on a 6-lane skin: Bm wraps to lane 0, and the reprise
  // of Am/E later in the song must land back on their original lanes.
  var chart = chordChart(["Am", "E", "G", "D", "F", "C", "Bm", "Am", "E"]);
  var lanes = chart.events.map(function(evt) { return derivePerformanceLaneIndex(chart, evt); });

  assert.deepStrictEqual(lanes, [0, 1, 2, 3, 4, 5, 0, 0, 1]);
});

test("explicit laneMask, lane, and pitch-bearing events bypass chord-name mapping", function() {
  resetEnv();
  global.SparkHighway = function SparkHighway() {};
  SparkHighway.GUITAR_SKIN = { id: "guitar_skin", laneCount: 6 };
  loadVM("js/performance/highway.js");

  var chart = chordChart(["Am", "E"]);
  assert.strictEqual(derivePerformanceLaneMask(chart, { type: "chord", chord: "Am", notes: [], laneMask: 12 }), 12, "explicit laneMask wins");
  assert.strictEqual(derivePerformanceLaneMask(chart, { type: "chord", chord: "Am", notes: [], lane: 3 }), 8, "explicit lane wins");
  assert.strictEqual(derivePerformanceLaneMask(chart, { type: "note", notes: [] }), 0, "no chord name and no notes still derives nothing");
});

test("imported open/technique events keep their zero mask and stay out of the chord order", function() {
  resetEnv();
  global.SparkHighway = function SparkHighway() {};
  SparkHighway.GUITAR_SKIN = { id: "guitar_skin", laneCount: 6 };
  loadVM("js/performance/highway.js");

  // Imported Spark charts mark open techniques as type:"open" with
  // notes:[] and laneMask 0 — the zero mask IS the meaning. Chord-name
  // lane mapping must not stamp them onto a fretted lane, and their
  // laneLabel must not occupy a slot in the chord lane order.
  var chart = {
    instrument: "guitar",
    events: [
      { id: 0, t: 0, type: "open",  laneLabel: "Open", notes: [], laneMask: 0 },
      { id: 1, t: 1, type: "chord", chord: "Am", notes: [] },
      { id: 2, t: 2, type: "chord", chord: "E",  notes: [] }
    ]
  };

  assert.strictEqual(derivePerformanceLaneMask(chart, chart.events[0]), 0, "open event keeps its zero mask");
  assert.strictEqual(derivePerformanceLaneIndex(chart, chart.events[1]), 0, "first chord takes lane 0, not displaced by the open label");
  assert.strictEqual(derivePerformanceLaneIndex(chart, chart.events[2]), 1);
  assert.deepStrictEqual(chart._chordLaneOrder, ["Am", "E"], "only chord-type events enter the lane order");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
