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

test("progression builder uses a real remove button", function() {
  var source = loadJS("js/pages/games.js");
  assert.ok(source.indexOf('<button class="del-btn" onclick="act(\\\'progRemove\\\',') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'rhythmResultsReplay\\\')"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'rhythmResultsBack\\\')"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'runnerResultsReplay\\\')"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'runnerResultsBack\\\')"') >= 0);
  var actionsSource = loadJS("js/actions/tools_family.js");
  assert.ok(actionsSource.indexOf('if (a === "rhythmResultsReplay") {') >= 0);
  assert.ok(actionsSource.indexOf('if (a === "rhythmResultsBack") {') >= 0);
  assert.ok(actionsSource.indexOf('if (a === "runnerResultsReplay") {') >= 0);
  assert.ok(actionsSource.indexOf('if (a === "runnerResultsBack") {') >= 0);
});

test("games pages can resolve sparkCore from the global binding", function() {
  global.window = {};
  S.rhythmActive = undefined;
  S.rhythmScore = undefined;
  S.rhythmCombo = undefined;
  S.rhythmMaxCombo = undefined;
  S.rhythmStartTime = undefined;
  S.rhythmBeats = undefined;
  S.runnerActive = undefined;
  S.runnerScore = undefined;
  S.runnerCombo = undefined;
  S.runnerMaxCombo = undefined;
  S.runnerLives = undefined;
  S.runnerDistance = undefined;
  S.runnerTarget = null;
  S.runnerObstacles = [];
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          legacyRhythmActive: true,
          legacyRhythmBeats: [{ time: 500, type: "D" }],
          legacyRhythmScore: 12,
          legacyRhythmCombo: 3,
          legacyRhythmMaxCombo: 5,
          legacyRhythmStartTimeMs: 0,
          legacyRunnerActive: true,
          legacyRunnerScore: 22,
          legacyRunnerCombo: 4,
          legacyRunnerMaxCombo: 7,
          legacyRunnerLives: 2,
          legacyRunnerDistance: 18,
          legacyRunnerTargetName: "C",
          legacyRunnerObstacles: [{ x: 100, short: "C", name: "C", result: "normal" }]
        }
      };
    }
  };
  SparkInstruments.getActive = function() {
    return {
      appId: "chordspark",
      getData: function() {
        return {
          ALL_CHORDS: [{ name: "C", short: "C" }]
        };
      },
      ui: {
        chord: function() { return "<div>chord</div>"; }
      }
    };
  };

  var rhythmHtml = rhythmTab();
  var runnerHtml = runnerGamePage();

  assert.ok(rhythmHtml.indexOf("TAP!") >= 0 || rhythmHtml.indexOf("Start!") >= 0);
  assert.ok(rhythmHtml.indexOf(">12</div>") >= 0);
  assert.ok(rhythmHtml.indexOf(">3x</div>") >= 0);
  assert.ok(runnerHtml.indexOf(">22</div>") >= 0);
  assert.ok(runnerHtml.indexOf(">C</div>") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
