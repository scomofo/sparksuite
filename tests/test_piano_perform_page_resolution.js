var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.S = {
    performSongId: "river_walk",
    performArrangementType: "block_chords",
    performDifficulty: "normal",
    performSongData: {
      id: "river_walk",
      title: "undefined",
      artist: "null"
    },
    songAudioData: {},
    songAudioImporting: false,
    songAudioProgress: 0,
    performResults: {
      songId: "river_walk",
      title: "undefined",
      accuracy: 93,
      score: 5000,
      stars: 3,
      maxCombo: 18,
      arrangementType: "block_chords",
      difficultyId: "normal",
      phrases: [
        { phraseId: 1, name: "null", hits: 8, total: 10 }
      ]
    }
  };
  global.getPerformanceBest = function() {
    return { bestAccuracy: 93, bestStars: 3 };
  };
  global.getPerformanceMasteryLabel = function() {
    return "Solid";
  };
  global.normalizeSongId = function(song) {
    return song && song.id ? song.id : "song";
  };
  global.getCurrentLHPattern = function() {
    return { name: "Pattern A" };
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/instruments/piano/pages/perform_song.js"));
    global.eval(loadJS("js/sparksuite/core/progress_engine.js"));
    global.sparkCore = { progressEngine: new SparkSuiteProgressEngine() };
    global.eval(loadJS("js/instruments/piano/pages/perform_results.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Perform Page Resolution ---");

test("piano perform song page ignores stale title and artist text", function() {
  var html = pianoPerformSongPage();
  assert.ok(html.indexOf("river walk") >= 0);
  assert.ok(html.indexOf("Unknown Artist") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
});

test("piano performance results page ignores stale title and phrase text", function() {
  var html = pianoPerformanceResultsPage();
  assert.ok(html.indexOf("river walk") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf(">Phrase 1<") >= 0);
});

test("piano perform song page ignores stale left hand pattern text", function() {
  S.performArrangementType = "left_hand_patterns";
  global.getCurrentLHPattern = function() {
    return { name: "null" };
  };
  var html = pianoPerformSongPage();
  assert.ok(html.indexOf("Unknown pattern") >= 0);
  assert.ok(html.indexOf(">null<") === -1);
});

test("piano perform song page ignores malformed import progress", function() {
  S.songAudioImporting = true;
  S.songAudioProgress = "NaN";

  var html = pianoPerformSongPage();

  assert.ok(html.indexOf("Separating stems... 0%") >= 0);
  assert.ok(html.indexOf("width:0%") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano perform song page ignores malformed best accuracy and detected BPM", function() {
  global.getPerformanceBest = function() {
    return { bestAccuracy: "NaN", bestStars: 3 };
  };
  S.songAudioData.river_walk = {
    stemPaths: { drums: "x" },
    detectedBpm: "NaN"
  };

  var html = pianoPerformSongPage();

  assert.ok(/<span class="metric-label">Best Accuracy<\/span><span class="metric-value">0%<\/span>/.test(html));
  assert.ok(html.indexOf("Detected BPM:") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
