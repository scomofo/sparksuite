var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
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

  global.eval(loadJS("js/performance/highway.js"));
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

  global.eval(loadJS("js/performance/session.js"));
  _updatePerformDisplay();

  assert.strictEqual(calls.length >= 3, true);
  assert.strictEqual(calls[0].type, "ensure");
  assert.strictEqual(calls[0].chart.instrument, "ukulele");
  assert.strictEqual(calls[1].type, "feed");
  assert.strictEqual(calls[calls.length - 1].type, "update");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
