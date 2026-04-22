var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.document = {
    getElementById: function() { return null; }
  };
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.S = {
    performCurrentSec: 12,
    performScore: 4200,
    performCombo: 9,
    performAccuracy: 96,
    performInputMidi: [60, 64],
    performChart: {
      id: "midnight_groove",
      title: "undefined",
      artist: "null"
    },
    performResults: {
      songId: "midnight_groove",
      title: "undefined",
      accuracy: 96,
      score: 4200,
      stars: 3,
      maxCombo: 9,
      arrangementType: "block_chords",
      difficultyId: "normal"
    }
  };
  global.getPerformancePhraseForTime = function() {
    return { name: "NaN" };
  };
  global.renderPerformanceHighway = function() {
    return "<div>highway</div>";
  };
  global.getPerformanceBest = function() {
    return { bestAccuracy: 96, bestStars: 3 };
  };
  global.getPerformanceMasteryLabel = function() {
    return "Solid";
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/instruments/piano/pages/perform.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Perform Live Page Resolution ---");

test("piano perform live page ignores stale chart and phrase labels", function() {
  var html = pianoPerformPage();
  assert.ok(html.indexOf(">midnight_groove<") >= 0);
  assert.ok(html.indexOf(">Unknown Artist<") >= 0);
  assert.ok(html.indexOf("Phrase: Phrase") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano perform done page ignores stale result title", function() {
  var html = pianoPerformDonePage();
  assert.ok(html.indexOf(">midnight_groove<") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
