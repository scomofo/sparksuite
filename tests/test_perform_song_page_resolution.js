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
    resetEnv();
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
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.S = {
    performSongId: "song_x",
    performArrangementType: "chords",
    performDifficulty: "normal",
    performSpeed: 1,
    performTargetTechnique: null,
    songAudioData: {}
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.getPerformanceStats = function() {
    return {
      mastery: "none",
      runs: 0,
      bestScore: 0,
      bestAccuracy: 0,
      bestStars: 0
    };
  };
  global.getMasteryColor = function() { return "#fff"; };
  global.getMasteryIcon = function() { return "*"; };
  global.buildPerformanceRecommendationsForSong = function() { return []; };
}

console.log("\n--- Perform Song Page Resolution ---");

test("performSongPage ignores sentinel song text and technique labels", function() {
  global.S.performTargetTechnique = "undefined";
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceSongData: {
          title: "undefined",
          artist: "null",
          bpm: 120,
          chords: [],
          progression: []
        },
        performanceTargetTechnique: "undefined"
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.ok(html.indexOf("song x") >= 0);
  assert.strictEqual(html.indexOf(">undefined<"), -1);
  assert.strictEqual(html.indexOf(">null<"), -1);
  assert.ok(html.indexOf("Technique") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
