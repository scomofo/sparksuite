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
  global.render = function() {};
  global.S = {
    _gameTab: "quiz",
    quizQ: { answer: "undefined", options: ["C", "G"] },
    quizAns: "C",
    quizCorrect: 2,
    earChord: "null",
    earRevealed: true,
    level: 1,
    bpm: 90,
    runnerActive: true,
    runnerTarget: "NaN",
    runnerScore: 4,
    chordChangeActive: true,
    chordChangeTimer: 30,
    chordChangeCount: 7,
    chordChangePair: ["undefined", "null"],
    fingerExercisesDone: 0,
    fingerDaysLogged: 0,
    fingerBadges: [],
    fingerStats: { _chordChangeBest: 0 }
  };
  global.findChord = function(name) {
    if (!name || name === "Chord") return null;
    return { short: name };
  };
  global.pianoSVG = function(chord) {
    return "<div>" + (chord && chord.short || "") + "</div>";
  };
  global.pianoFormatTime = function(value) { return String(value); };
  global.chordsUpToLevel = function() {
    return [{ short: "C" }, { short: "G" }];
  };
  global.getRunnerOptions = function() {
    return ["C", "G"];
  };
  global._getChordChangePairs = function() {
    return [["C", "G"]];
  };
  global.getAvailableExercises = function() {
    return [];
  };
  global.pianoClickableDiv = function(action, content) {
    return "<div data-action=\"" + action + "\">" + content + "</div>";
  };
  global.KEYBOARD_SIZES = [];
  global.STYLE_PREFS = [];
  global.TRANSITION_TIPS = {};
  global.PIANO_TRANSITION_TIPS = {};
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            DAILY_TYPES: [{ id: "daily", name: "undefined", desc: "null" }],
            FINGER_EXERCISES: [{
              id: "ex1",
              tier: 1,
              name: "undefined",
              desc: "null",
              goal: "NaN",
              frequency: "undefined",
              duration: 30
            }],
            FINGER_BADGES: [{ id: "badge1", icon: "null", desc: "undefined" }]
          };
        }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/sparksuite/core/psychology_engine.js"));
    global.eval(loadJS("js/instruments/piano/pages/games.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Games Page Resolution ---");

test("quiz and ear training ignore stale chord labels", function() {
  var quizHtml = quizTab();
  assert.ok(quizHtml.indexOf(">undefined<") === -1);
  assert.ok(quizHtml.indexOf("It was Chord") >= 0);

  var earHtml = earTrainTab();
  assert.ok(earHtml.indexOf(">null<") === -1);
  assert.ok(earHtml.indexOf("It was: <strong>Chord</strong>") >= 0);
});

test("runner and chord change views ignore stale target labels", function() {
  var runnerHtml = runnerTab();
  assert.ok(runnerHtml.indexOf(">NaN<") === -1);
  assert.ok(runnerHtml.indexOf("Target chord") >= 0);

  var fingersHtml = fingersTab();
  assert.ok(fingersHtml.indexOf(">undefined<") === -1);
  assert.ok(fingersHtml.indexOf(">null<") === -1);
  assert.ok(fingersHtml.indexOf("? ↔ ?") >= 0);
});

test("daily and finger exercise cards ignore stale cached labels", function() {
  global.getAvailableExercises = function() {
    return [{
      id: "ex1",
      tier: 1,
      name: "undefined",
      desc: "null",
      goal: "NaN",
      frequency: "undefined",
      duration: 30
    }];
  };
  pianoGamesTab();
  var dailyHtml = dailyTab();
  assert.ok(dailyHtml.indexOf("Challenge") >= 0);
  assert.ok(dailyHtml.indexOf("Practice mission") >= 0);
  assert.ok(dailyHtml.indexOf("Completed: 0") >= 0);
  assert.ok(dailyHtml.indexOf("undefined") === -1);
  assert.ok(dailyHtml.indexOf("null") === -1);

  S.chordChangeActive = false;
  var fingersHtml = fingersTab();
  assert.ok(fingersHtml.indexOf("Exercise") >= 0);
  assert.ok(fingersHtml.indexOf("Practice this movement.") >= 0);
  assert.ok(fingersHtml.indexOf("daily") >= 0);
  assert.ok(fingersHtml.indexOf("Injury Prevention:") >= 0);
  assert.ok(fingersHtml.indexOf("undefined") === -1);
  assert.ok(fingersHtml.indexOf("null") === -1);
  assert.ok(fingersHtml.indexOf("NaN") === -1);
});

test("drill tab ignores stale transition tip text", function() {
  S.drillActive = true;
  S.drillChords = ["C", "G"];
  S.drillIdx = 1;
  S.drillTimer = 12;
  global.PIANO_TRANSITION_TIPS = { "C_G": "undefined" };
  var html = drillTab();
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("💡") === -1 || html.indexOf("undefined") === -1);
});

test("active timed piano game cards suppress entrance animations during timer ticks", function() {
  var psychology = new SparkSuitePsychologyEngine();
  assert.strictEqual(psychology.isIntenseFlowState({ mode: "drill" }), true);
  assert.strictEqual(psychology.isIntenseFlowState({ mode: "daily", type: "daily" }), true);
  assert.strictEqual(psychology.isIntenseFlowState({ mode: "daily" }), false);
  S.drillActive = true;
  S.drillChords = ["C", "G"];
  S.drillIdx = 0;
  S.drillTimer = 29;
  var drillHtml = drillTab();

  S.dailyActive = true;
  S.dailyType = "daily";
  S.dailyTimer = 28;
  S.dailyScore = 1;
  S.chord = "C";
  pianoGamesTab();
  var dailyHtml = dailyTab();
  var styles = loadJS("styles.css");

  assert.ok(drillHtml.indexOf("live-timer-surface") >= 0);
  assert.ok(dailyHtml.indexOf("live-timer-surface") >= 0);
  assert.ok(styles.indexOf(".live-timer-surface.card") >= 0);
  assert.ok(styles.indexOf("animation:none") >= 0);
});

test("rhythm tab ignores malformed BPM values", function() {
  S._gameTab = "rhythm";
  S.rhythmActive = false;
  S.bpm = "NaN";
  var html = rhythmTab();
  assert.ok(html.indexOf("BPM: 90") >= 0);
  assert.ok(html.indexOf('value="90"') >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano games use classed visible labels instead of inline strong headings", function() {
  var source = loadJS("js/instruments/piano/pages/games.js");
  assert.ok(source.indexOf('class="card-section-heading"') >= 0);
  assert.ok(source.indexOf('class="card-micro-heading"') >= 0);
  assert.strictEqual(source.indexOf("'<strong>' + escHTML(exerciseName)"), -1);
  assert.strictEqual(source.indexOf("<strong>Injury Prevention:</strong>"), -1);
});

if (process.exitCode) process.exit(process.exitCode);
