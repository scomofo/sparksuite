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
  global.eval(loadJS("js/instruments/piano/pages/onboarding.js"));
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

test("piano practice tab ignores stale curriculum and custom set labels", function() {
  resetEnvironment("pianospark");
  global.getPianoPageInstrument = function() {
    return {
      getData: function() {
        return {
          CURRICULUM: [{ num: 1, title: "undefined", desc: "null", tip: "NaN", icon: "P" }],
          BADGES: [{ id: "starter", label: "Starter", desc: "undefined", icon: "null", check: function() { return true; } }],
          SONGS: [],
          LC: { 1: "#3366ff" },
          CHORD_COLORS: { major: "#3366ff" },
          DAILY_TYPES: [],
          FINGER_EXERCISES: [],
          FINGER_BADGES: []
        };
      }
    };
  };
  global.S.customSets = [{ name: "undefined", chords: ["C"] }];
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = pianoPracticeTab();
  assert.ok(html.indexOf("Guided session") >= 0 || html.indexOf("Warmup") >= 0);
  assert.ok(html.indexOf("Level 1") >= 0);
  assert.ok(html.indexOf("Custom Set (1)") >= 0);
  assert.ok(html.indexOf("🏅") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano onboarding and tools ignore stale intention strings", function() {
  resetEnvironment("pianospark");
  global.S.practiceIntention = "undefined";
  global.S.dailyGoal = "NaN";
  global.S.volume = { broken: true };
  global.S.reverbAmount = "null";
  global.S.a4Tuning = [];
  global.S.onboardingStep = 3;
  global.S._toolTab = "settings";
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/onboarding.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));

  var onboardingHtml = pianoOnboardingPage();
  assert.ok(onboardingHtml.indexOf('value="undefined"') === -1);

  global.S.practiceIntention = "null";
  global.S.onboardingStep = 4;
  onboardingHtml = pianoOnboardingPage();
  assert.ok(onboardingHtml.indexOf("When I null") === -1);

  var toolsHtml = pianoToolsTab();
  assert.ok(toolsHtml.indexOf('value="null"') === -1);
  assert.ok(toolsHtml.indexOf("Daily Goal: 10 min") >= 0);
  assert.ok(toolsHtml.indexOf("Volume: 100%") >= 0);
  assert.ok(toolsHtml.indexOf("Reverb: 0%") >= 0);
  assert.ok(toolsHtml.indexOf("A4 tuning: 440 Hz") >= 0);
  assert.ok(toolsHtml.indexOf("NaN") === -1);
});

test("piano header ignores stale numeric badges", function() {
  resetEnvironment("pianospark");
  global.S.xp = "undefined";
  global.S.currentSession = { broken: true };
  global.S.streak = "NaN";
  global.S.onboardingComplete = true;
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));

  var html = pianoHeaderHTML();
  assert.ok(html.indexOf("0 XP") >= 0);
  assert.ok(html.indexOf("S0/50") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano placement test ignores stale prompt text", function() {
  resetEnvironment("pianospark");
  global.S._placementIdx = 0;
  global.PLACEMENT_TESTS = [{ prompt: "undefined" }];
  global.eval(loadJS("js/instruments/piano/pages/onboarding.js"));

  var html = placementTestPage();
  assert.ok(html.indexOf("Try this chord or pattern.") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
});

test("piano tools stats ignore stale history labels", function() {
  resetEnvironment("pianospark");
  global.S._toolTab = "stats";
  global.S.xp = "NaN";
  global.S.streak = { broken: true };
  global.S.level = "undefined";
  global.S.personalBests = { bpm: "null", streak: [] };
  global.S.history = { broken: true };
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));
  global.getPianoPageInstrument = function() {
    return {
      getData: function() {
        return {
          BADGES: [{ id: "starter", label: "undefined", desc: "null", icon: "NaN" }]
        };
      }
    };
  };

  var html = pianoToolsTab();
  assert.ok(html.indexOf(">0<") >= 0);
  assert.ok(html.indexOf("0/8") >= 0);
  assert.ok(html.indexOf("No activity yet") >= 0);
  assert.ok(html.indexOf("Invalid Date") === -1);
  assert.ok(html.indexOf("Badge") >= 0);
  assert.ok(html.indexOf("Keep practicing") >= 0);
  assert.ok(html.indexOf("🏅") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano clips tab ignores stale clip timestamps, durations, and urls", function() {
  resetEnvironment("pianospark");
  global.S._toolTab = "clips";
  global.S.practiceClips = [
    { ts: "not-a-date", duration: "NaN", url: "undefined" }
  ];
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));

  var html = pianoToolsTab();
  assert.ok(html.indexOf("Unknown time") >= 0);
  assert.ok(html.indexOf(">->") >= 0 || html.indexOf(">-<") >= 0);
  assert.ok(html.indexOf("Unavailable") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano songs library ignores stale sentinel search text", function() {
  resetEnvironment("pianospark");
  global.S.songFilter = "undefined";
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/songs.js"));

  var html = pianoSongsTab();
  assert.ok(html.indexOf('value="undefined"') === -1);
  assert.ok(html.indexOf('matching “undefined”') === -1);
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
