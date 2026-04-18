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
  global.S = {
    rhythmActive: false,
    rhythmBeats: [],
    rhythmScore: 0,
    rhythmCombo: 0,
    rhythmMaxCombo: 0,
    rhythmStartTime: 0,
    rhythmResults: null,
    rhythmBpm: 80,
    runnerActive: true,
    runnerScore: 10,
    runnerCombo: 2,
    runnerMaxCombo: 4,
    runnerLives: 3,
    runnerDistance: 15,
    runnerTarget: { short: "undefined", name: "null" },
    runnerObstacles: [
      { x: 100, short: "undefined", name: "null", result: "normal" }
    ],
    runnerResults: null,
    runnerHighScore: 0,
    level: 1,
    progChords: [],
    progPlaying: false,
    progBeat: 0,
    progPickerOpen: false
  };
  global.performance = { now: function() { return 0; } };
  global.COMMON_PROGRESSIONS = [];
  global.SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        getData: function() {
          return { ALL_CHORDS: [] };
        },
        ui: {
          chord: function() { return "<div>chord</div>"; }
        }
      };
    },
    getAll: function() { return []; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/pages/games.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Games Page Resolution ---");

test("runnerGamePage ignores stale target and obstacle labels", function() {
  var html = runnerGamePage();
  assert.ok(html.indexOf("Target Chord") >= 0);
  assert.ok(html.indexOf("Target chord") >= 0);
  assert.ok(html.indexOf(">?</div>") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
});

test("games pages ignore malformed cached BPM values", function() {
  S.rhythmBpm = "NaN";
  S.progBpm = { bpm: 1 };
  S.progChords = ["C"];
  var rhythmHtml = rhythmTab();
  var buildHtml = buildTab();
  assert.ok(rhythmHtml.indexOf(">90</div><div style=\"font-size:10px;color:var(--text-muted)\">BPM</div>") >= 0);
  assert.ok(rhythmHtml.indexOf("NaN") === -1);
  assert.ok(buildHtml.indexOf(">80</div><div style=\"font-size:10px;color:var(--text-muted)\">BPM</div>") >= 0);
  assert.ok(buildHtml.indexOf("NaN") === -1);
});

test("games pages ignore malformed cached score counters", function() {
  S.rhythmResults = { score: "NaN", accuracy: "NaN", maxCombo: "NaN" };
  S.runnerHighScore = "NaN";
  S.runnerResults = { score: "NaN", maxCombo: "NaN", distance: "NaN" };

  var rhythmHtml = rhythmTab();
  var runnerHtml = runnerTab();
  var resultsHtml = runnerResultsPage();

  assert.ok(rhythmHtml.indexOf(">0</div><div style=\"font-size:11px;color:var(--text-muted)\">Score</div>") >= 0);
  assert.ok(rhythmHtml.indexOf(">0%</div><div style=\"font-size:11px;color:var(--text-muted)\">Accuracy</div>") >= 0);
  assert.ok(runnerHtml.indexOf("High Score") === -1);
  assert.ok(resultsHtml.indexOf(">0</div><div style=\"font-size:11px;color:var(--text-muted)\">Score</div>") >= 0);
  assert.ok(resultsHtml.indexOf(">0x</div><div style=\"font-size:11px;color:var(--text-muted)\">Max Combo</div>") >= 0);
  assert.ok(resultsHtml.indexOf(">0m</div><div style=\"font-size:11px;color:var(--text-muted)\">Distance</div>") >= 0);
  assert.ok(rhythmHtml.indexOf("NaN") === -1);
  assert.ok(resultsHtml.indexOf("NaN") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
