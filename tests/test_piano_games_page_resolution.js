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
          return { DAILY_TYPES: [], FINGER_EXERCISES: [], FINGER_BADGES: [] };
        }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
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

if (process.exitCode) process.exit(process.exitCode);
