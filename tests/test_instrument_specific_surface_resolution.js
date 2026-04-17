var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment(activeAppId) {
  var pianoModule = {
    id: "pianospark",
    appId: "pianospark",
    instrument: "piano",
    getData: function() {
      return {
        CURRICULUM: [{ num: 1, title: "First Keys", desc: "Start here", icon: "P" }],
        BADGES: [{ id: "starter", label: "Starter", desc: "Begin", check: function() { return true; } }],
        SONGS: [{
          title: "Moonlight",
          artist: "Suite",
          level: 1,
          bpm: 72,
          chords: ["C"],
          progression: ["C"]
        }],
        LC: { 1: "#3366ff" },
        CHORD_COLORS: { major: "#3366ff" },
        DAILY_TYPES: [{ id: "daily", name: "Daily", desc: "Test" }],
        FINGER_EXERCISES: [],
        FINGER_BADGES: []
      };
    }
  };
  var guitarModule = {
    id: "chordspark",
    appId: "chordspark",
    instrument: "guitar",
    getData: function() {
      return {
        ALL_CHORDS: [
          { name: "C", short: "C" },
          { name: "G", short: "G" }
        ]
      };
    }
  };
  var bassModule = {
    id: "bassspark",
    appId: "bassspark",
    instrument: "bass",
    getData: function() {
      return {
        ALL_CHORDS: [{ name: "C", short: "C" }],
        SESSIONS: [{
          num: 1,
          title: "Bass Basics",
          level: 1,
          bpm: 70,
          spark: { text: "Start" },
          newMove: { chord: "C" }
        }]
      };
    }
  };

  global.window = global;
  global.document = {
    body: { appendChild: function() {} },
    getElementById: function() { return null; },
    createElement: function() {
      return {
        setAttribute: function() {},
        classList: { add: function() {}, remove: function() {} }
      };
    }
  };
  global.navigator = {};
  global.S = {
    xp: 12,
    streak: 3,
    darkMode: false,
    onboardingComplete: false,
    currentSession: 1,
    tab: "practice",
    level: 1,
    dailyGoal: 10,
    dailyPracticed: 120,
    customSets: [],
    focusMode: false,
    earned: [],
    chordProg: { C: 40 },
    songIdx: null,
    songFilter: "",
    songSort: "level",
    songSortAsc: true,
    completedSessions: [],
    personalBests: {},
    fingerExercisesDone: 0,
    history: [],
    _gameTab: "drill",
    _toolTab: "stats",
    guidedSession: 1
  };
  global.T = {};
  global.SCR = {
    GUIDED: "guided",
    DRILL: "drill",
    SESSION: "session"
  };
  global.escHTML = function(value) { return String(value); };
  global.render = function() {};
  global.saveState = function() {};
  global.snd = function() {};
  global.tickD = function() {};
  global.tickS = function() {};
  global.trigC = function() {};
  global.act = function() {};
  global.playSound = function() {};
  global.pianoClickableDiv = function(action, content) {
    return "<div data-action=\"" + action + "\">" + content + "</div>";
  };
  global.pianoIfThenCard = function(text) { return "<div>" + text + "</div>"; };
  global.practicePlanSection = function() { return "<div>Plan</div>"; };
  global.getCurrentSessionPlan = function() {
    return { num: 1, title: "Warmup", level: 1 };
  };
  global.getCurrentLevel = function() {
    return { num: 1, title: "First Keys", desc: "Start here", icon: "P" };
  };
  global.chordsUpToLevel = function() {
    return [{ short: "C", color: "#3366ff" }];
  };
  global.chordsForLevel = function() {
    return [{ short: "C", color: "#3366ff" }];
  };
  global.findChord = function(name) {
    return { short: name, color: "#3366ff", type: "major" };
  };
  global.pianoTierBadgeHTML = function() { return "<span>tier</span>"; };
  global.pianoSVG = function() { return "<div class=\"piano-svg\"></div>"; };
  global.pianoFormatTime = function(value) { return String(value); };
  global.PLAY_STYLES = [];
  global.KEYBOARD_SIZES = [];
  global.getMidiInputNames = function() { return []; };
  global.exportState = function() {};
  global.isRecording = function() { return false; };
  global.SparkSession = {
    processResults: function() {
      return { xpEarned: 10, leveledUp: false, jackpot: false };
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: activeAppId };
    },
    getAll: function() {
      return [pianoModule, guitarModule, bassModule];
    }
  };
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Instrument Specific Surface Resolution ---");

test("piano surfaces rehydrate an app-id-only active instrument shell", function() {
  resetEnvironment("pianospark");
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/games.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));
  global.eval(loadJS("js/instruments/piano/pages/songs.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));

  assert.ok(pianoPracticeTab().indexOf("First Keys") >= 0);
  assert.ok(pianoSongsTab().indexOf("Moonlight") >= 0);
  assert.ok(pianoGamesTab().indexOf("Chord Drill") >= 0);
  assert.ok(statsTab().indexOf("Starter") >= 0);
  assert.strictEqual(levelColor(1), "#3366ff");
  assert.deepStrictEqual(pianoCheckBadges(), ["starter"]);
});

test("guitarAct rehydrates an app-id-only active instrument shell", function() {
  resetEnvironment("chordspark");
  global.eval(loadJS("js/instruments/guitar/app.js"));
  guitarAct("drillTransition", "C|G");
  assert.strictEqual(S.drillChords.length, 2);
  assert.strictEqual(S.drillChords[0].name, "C");
  assert.strictEqual(S.drillChords[1].name, "G");
});

test("bassAct rehydrates an app-id-only active instrument shell", function() {
  resetEnvironment("bassspark");
  global.eval(loadJS("js/instruments/bass/app.js"));
  bassAct("guidedStart", "1");
  assert.strictEqual(S.guidedPlan.title, "Bass Basics");
  assert.strictEqual(S.screen, SCR.GUIDED);
});

if (process.exitCode) process.exit(process.exitCode);
