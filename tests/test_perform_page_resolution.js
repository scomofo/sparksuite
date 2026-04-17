var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnv() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.render = function() {};
  global.saveState = function() {};
  global.renderPerformanceHighway = function() { return "<div>highway</div>"; };
  global.getPerformancePhraseForTime = function() { return { name: "undefined" }; };
  global.getNextPerformEvent = function() { return null; };
  global.getImportedTechniquePreview = function() { return [{ label: "undefined", color: "#fff" }]; };
  global.hasImportedTechniqueFlags = function() { return false; };
  global.renderImportedTechniqueFlags = function() { return ""; };
  global.getPerformancePracticePresetStemLabel = function() { return "Guitar"; };
  global.getPerformanceStats = function() {
    return { mastery: "none", runs: 0, bestScore: 0, bestAccuracy: 0, bestStars: 0 };
  };
  global.getMasteryColor = function() { return "#fff"; };
  global.getMasteryIcon = function() { return "*"; };
  global.hasImportedTechniqueResultData = function() { return false; };
  global.getTechniqueSummaryRow = function() { return null; };
  global.buildPerformanceRecommendationsForSong = function() {
    return [{ label: "undefined", reason: "null" }];
  };
  global.S = {
    performChart: {
      id: "chart_1",
      title: "undefined",
      artist: "null",
      arrangementType: "chords",
      phrases: [],
      events: []
    },
    performScore: 100,
    performAccuracy: 95,
    performCombo: 3,
    performLastHitLabel: "undefined",
    performLastHitTime: Date.now(),
    performCountdownActive: false,
    performCountdownBeats: 0,
    performInputSource: "midi",
    performInputNotes: [],
    performDebug: false,
    performLoop: { phraseId: 2, startSec: 0, endSec: 4 },
    performMode: "midi",
    performDifficulty: "normal",
    performSpeed: 1,
    performPracticePreset: "full_mix",
    performPaused: false,
    performCurrentSec: 0,
    performTargetTechnique: null,
    performResults: {
      title: "undefined",
      artist: "null",
      stars: 3,
      totalEvents: 10,
      score: 1000,
      accuracy: 90,
      maxCombo: 4,
      phraseStats: [
        { name: "undefined", total: 2, scoreSum: 2, perfects: 1, goods: 1, oks: 0, misses: 0 },
        { name: "null", total: 2, scoreSum: 0, perfects: 0, goods: 0, oks: 0, misses: 2 }
      ],
      importedTechniqueSummary: {
        open: { label: "undefined", hits: 1, total: 2, accuracy: 50 }
      },
      unlocks: [{ label: "null", xp: 25 }]
    },
    performChartId: "chart_1",
    performSongStats: {},
    performMidiOffsetMs: 0,
    performAudioOffsetMs: 0,
    _calibrating: false
  };
  global.S.performChart.phrases = [{ id: 2, name: "undefined" }];
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceResults: S.performResults,
          performanceChartId: "chart_1",
          performanceTargetTechnique: null,
          transport: { positionMs: 0, status: "running" }
        }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/pages/perform.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Perform Page Resolution ---");

test("perform pages ignore stale chart and result text tokens", function() {
  var activeHtml = performPage();
  var doneHtml = performDonePage();
  assert.ok(activeHtml.indexOf("chart_1") >= 0);
  assert.ok(activeHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(activeHtml.indexOf("Phrase") >= 0);
  assert.ok(activeHtml.indexOf("Looping: Phrase") >= 0);
  assert.ok(activeHtml.indexOf("Technique") >= 0);
  assert.ok(activeHtml.indexOf(">undefined<") === -1);
  assert.ok(activeHtml.indexOf(">null<") === -1);
  assert.ok(doneHtml.indexOf("chart_1") >= 0);
  assert.ok(doneHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(doneHtml.indexOf("Recommendation") >= 0);
  assert.ok(doneHtml.indexOf("Unlock") >= 0);
  assert.ok(doneHtml.indexOf("Open-note timing") >= 0);
  assert.ok(doneHtml.indexOf("Phrase 1") >= 0);
  assert.ok(doneHtml.indexOf("Phrase 2") >= 0);
  assert.ok(doneHtml.indexOf(">undefined<") === -1);
  assert.ok(doneHtml.indexOf(">null<") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
