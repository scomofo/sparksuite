var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function makeElement() {
  return {
    innerHTML: "",
    textContent: "",
    style: {},
    firstChild: { style: {} },
    children: []
  };
}

function resetEnvironment() {
  var pianoModule = {
    id: "pianospark",
    appId: "pianospark",
    instrument: "piano",
    name: "Piano",
    ui: {
      chord: function(chordObj) {
        return "<div class=\"chord-svg\">" + (chordObj && chordObj.name || "") + "</div>";
      }
    },
    getData: function() {
      return {
        ALL_CHORDS: [
          { name: "G Major", short: "G" },
          { name: "C", short: "C" }
        ],
        STRINGS: [
          { note: "E", freq: 82.41 },
          { note: "A", freq: 110 },
          { note: "D", freq: 146.83 },
          { note: "G", freq: 196 },
          { note: "B", freq: 246.94 },
          { note: "e", freq: 329.63 }
        ],
        CHORDS: {
          1: [{ name: "G Major", short: "G" }]
        }
      };
    }
  };
  var elements = {};
  global.window = global;
  global.document = {
    getElementById: function(id) {
      return elements[id] || null;
    }
  };
  global.__elements = elements;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          legacyRunnerActive: true,
          legacyRunnerTargetName: "G Major",
          legacyRunnerScore: 42,
          legacyRunnerCombo: 3,
          legacyRunnerMaxCombo: 5,
          legacyRunnerLives: 2,
          legacyRunnerDistance: 77,
          legacyRunnerObstacles: []
        }
      };
    }
  };
  global.S = {
    dualChord: "G Major",
    dualAnchorOn: false,
    runnerActive: false,
    runnerScore: 0,
    runnerCombo: 0,
    runnerMaxCombo: 0,
    runnerLives: 0,
    runnerDistance: 0,
    runnerResults: null,
    runnerHighScore: 0,
    tunerActive: false,
    tunerNote: "A",
    tunerFreq: 110,
    tunerCents: 2,
    audioInputDevices: [],
    audioInputId: "",
    audioTestingId: "",
    audioTestLevel: 0
  };
  global.escHTML = function(value) { return String(value); };
  global.act = function() {};
  global.GUITAR_ANCHOR = {
    activeChords: ["G Major"],
    targetString: 1,
    fret: 3,
    instruction: "Anchor"
  };
  global.PIANO_CHORDS = {
    "G Major": {
      notes: ["G4", "B4", "D5"],
      fingers: [1, 3, 5],
      quality: "Major"
    }
  };
  global.ChordEngine = {
    intervals: {
      Major: [0, 4, 7],
      Minor: [0, 3, 7]
    },
    get: function() {
      return ["G", "B", "D"];
    }
  };
  global.COMMON_PROGRESSIONS = [];
  global.getGuidedSessionView = function() {
    return {
      newMovePhase: "watch"
    };
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [pianoModule];
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/pages/dual.js"));
    global.eval(loadJS("js/pages/games.js"));
    global.eval(loadJS("js/pages/guided.js"));
    global.eval(loadJS("js/pages/tools.js"));
    global.eval(loadJS("js/pages/shared.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Misc Page Instrument Resolution ---");

test("dualTab rehydrates an app-id-only active instrument shell", function() {
  var html = dualTab();
  assert.ok(html.indexOf("Dual View") >= 0);
  assert.ok(html.indexOf("chord-svg") >= 0);
});

test("runnerGamePage rehydrates an app-id-only active instrument shell", function() {
  var html = runnerGamePage();
  assert.ok(html.indexOf("Target Chord") >= 0);
  assert.ok(html.indexOf("chord-svg") >= 0);
});

test("guided review rehydrates an app-id-only active instrument shell", function() {
  var html = _guidedReview({
    review: {
      text: "Review this chord",
      chords: ["C"]
    }
  });
  assert.ok(html.indexOf("chord-svg") >= 0);
  assert.ok(html.indexOf("Review") >= 0);
});

test("tunerTab rehydrates an app-id-only active instrument shell", function() {
  var html = tunerTab();
  assert.ok(html.indexOf("Piano Tuner") >= 0);
  assert.ok(html.indexOf("Standard tuning: E A D G B e") >= 0);
  assert.ok(html.indexOf("USB instrument cable or audio interface") >= 0);
  assert.ok(html.indexOf("329.63Hz") >= 0);
});

test("updateTunerUI rehydrates an app-id-only active instrument shell", function() {
  var strings = [];
  var i;
  for (i = 0; i < 6; i++) {
    strings.push({
      style: {},
      firstChild: { style: {} }
    });
  }
  __elements["tuner-note-display"] = makeElement();
  __elements["tuner-freq-display"] = makeElement();
  __elements["tuner-needle"] = makeElement();
  __elements["tuner-status"] = makeElement();
  __elements["tuner-strings"] = {
    children: strings
  };

  updateTunerUI();

  assert.strictEqual(__elements["tuner-note-display"].textContent, "A");
  assert.strictEqual(__elements["tuner-freq-display"].textContent, "110 Hz");
  assert.strictEqual(__elements["tuner-needle"].style.left, "51%");
  assert.strictEqual(strings[1].style.borderColor, "#4ECDC4");
});

if (process.exitCode) process.exit(process.exitCode);
