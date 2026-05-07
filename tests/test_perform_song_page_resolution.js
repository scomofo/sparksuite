var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


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
  global.buildPerformanceRecommendationsForSong = function() {
    return [{
      label: "undefined",
      reason: "null"
    }];
  };
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
  assert.ok(html.indexOf("Recommendation") >= 0);
  assert.ok(html.indexOf("Technique") >= 0);
});

test("performSongPage ignores malformed song numbers and import progress", function() {
  global.S.songAudioImporting = true;
  global.S.songAudioProgress = "NaN";
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceSongData: {
          title: "Song",
          artist: "Artist",
          bpm: "NaN",
          chords: { broken: true },
          progression: "broken"
        }
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.ok(html.indexOf(">?<") >= 0);
  assert.ok(html.indexOf(">0<") >= 0);
  assert.ok(html.indexOf("Separating stems... 0%") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("performSongPage ignores malformed detected BPM values", function() {
  global.S.songAudioData = {
    song: {
      stemPaths: { drums: "x" },
      detectedBpm: "NaN"
    }
  };
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceSongData: {
          title: "Song",
          artist: "Artist",
          bpm: "NaN",
          chords: [],
          progression: []
        }
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.ok(html.indexOf("Detected BPM:") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("performSongPage requests stats with canonical song id", function() {
  var capturedArgs = null;
  global.getPerformanceStats = function(songId, arrangementType, difficultyId) {
    capturedArgs = {
      songId: songId,
      arrangementType: arrangementType,
      difficultyId: difficultyId
    };
    return {
      mastery: "none",
      runs: 0,
      bestScore: 0,
      bestAccuracy: 0,
      bestStars: 0
    };
  };
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceDifficultyId: "pro"
      },
      plan: {
        flow: "performance_song",
        context: {
          performanceSong: {
            songId: "stand_by_me",
            arrangementType: "rhythm_chords",
            songData: {
              title: "Stand By Me",
              artist: "Ben E. King",
              bpm: 120,
              chords: [],
              progression: []
            }
          }
        }
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  performSongPage();
  assert.deepStrictEqual(capturedArgs, {
    songId: "stand_by_me",
    arrangementType: "rhythm_chords",
    difficultyId: "pro"
  });
});

test("performSongPage can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceSongData: {
            title: "Night Drive",
            artist: "The Meteors",
            bpm: 132,
            chords: ["Am", "F", "C"],
            progression: ["Am", "F", "C", "G"],
            audio: { src: "builtin.mp3" }
          },
          performanceArrangementType: "lead",
          performanceDifficultyId: "easy",
          performanceSpeed: 0.75,
          performanceTargetTechnique: "tap"
        }
      };
    }
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.ok(html.indexOf("Night Drive") >= 0);
  assert.ok(html.indexOf("The Meteors") >= 0);
  assert.ok(html.indexOf(">132<") >= 0);
  assert.ok(html.indexOf(">3<") >= 0);
  assert.ok(html.indexOf(">4<") >= 0);
  assert.ok(html.indexOf("Tap-note consistency") >= 0);
  assert.ok(html.indexOf('onclick="act(\'performArrangement\',\'lead\')"') >= 0);
  assert.ok(html.indexOf('onclick="act(\'performDifficulty\',\'easy\')"') >= 0);
});

test("performSongPage does not render dead weakest-phrase action before results exist", function() {
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceSongData: {
          title: "The Beat Goes On",
          artist: "Sonny & Cher",
          bpm: 130,
          chords: ["Em"],
          progression: ["Em", "Em"]
        }
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.strictEqual(html.indexOf("performRetryPhrase"), -1);
  assert.ok(html.indexOf("Finish a run to unlock weakest-phrase practice") >= 0);
});

test("performSongPage renders weakest-phrase action when phrase results exist", function() {
  global.S.performChart = {
    phrases: [{ id: "p1", startSec: 0, endSec: 8 }]
  };
  global.S.performResults = {
    phraseStats: [{ total: 1, scoreSum: 60 }]
  };
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceSongData: {
          title: "The Beat Goes On",
          artist: "Sonny & Cher",
          bpm: 130,
          chords: ["Em"],
          progression: ["Em", "Em"]
        }
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.ok(html.indexOf("performRetryPhrase") >= 0);
  assert.ok(html.indexOf("Practice Weakest Phrase") >= 0);
});

test("performSongPage play actions share the calmer play-button typography class", function() {
  global.S.performChart = {
    phrases: [{ id: "p1", startSec: 0, endSec: 8 }]
  };
  global.S.performResults = {
    phraseStats: [{ total: 1, scoreSum: 60 }]
  };
  global.sparkCore.getActiveSessionView = function() {
    return {
      runtimeState: {
        performanceSongData: {
          title: "The Beat Goes On",
          artist: "Sonny & Cher",
          bpm: 130,
          chords: ["Em"],
          progression: ["Em", "Em"]
        }
      }
    };
  };

  global.eval(loadJS("js/pages/perform_song.js"));

  var html = performSongPage();
  assert.ok(html.indexOf("perform-song-play-btn-primary") >= 0);
  assert.ok(html.indexOf("perform-song-play-btn-secondary") >= 0);
  assert.ok(html.indexOf("perform-song-play-btn-utility") >= 0);
  assert.strictEqual(html.indexOf("box-shadow:0 14px 28px rgba(255,107,107,.22)\">&#127918; Start Performance"), -1);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
