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
  global.localStorage = (function() {
    var store = {};
    return {
      getItem: function(key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem: function(key, value) {
        store[key] = String(value);
      },
      removeItem: function(key) {
        delete store[key];
      },
      clear: function() {
        store = {};
      }
    };
  })();
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
    xp: 14,
    level: 2,
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
  global.getChordTier = function() { return { tier: "none" }; };
  global.tierBadgeHTML = function() { return ""; };
  global.ringHTML = function(_pct, _size, _stroke, _color, inner) { return inner; };
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
  global.buildSkillTree = function() {
    return {
      branches: [{
        id: "rhythm",
        label: "Rhythm",
        nodes: [{
          label: "Steady Pulse",
          status: "developing",
          progress: 42,
          children: []
        }]
      }]
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
    global.eval(loadJS("js/meta/challenge_ui.js"));
    global.eval(loadJS("js/pages/tools.js"));
    global.eval(loadJS("js/pages/shared.js"));
    global.eval(loadJS("js/pages/skill_tree.js"));
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

test("active challenges card can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.S.activeChallenges = [];
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          dashboardChallenges: [{
            id: "daily-clean-change",
            title: "Clean Change",
            description: "Land 5 clean switches",
            progress: 3,
            target: 5,
            completed: false,
            claimed: false
          }]
        }
      };
    }
  };

  global.eval(loadJS("js/meta/challenge_ui.js"));
  var html = renderActiveChallengesCard();

  assert.ok(html.indexOf("Clean Change") >= 0);
  assert.ok(html.indexOf("3 / 5") >= 0);
});

test("tunerTab rehydrates an app-id-only active instrument shell", function() {
  var html = tunerTab();
  assert.ok(html.indexOf("Piano Tuner") >= 0);
  assert.ok(html.indexOf("Standard tuning: E A D G B e") >= 0);
  assert.ok(html.indexOf("USB instrument cable or audio interface") >= 0);
  assert.ok(html.indexOf("329.63Hz") >= 0);
});

test("tunerTab ignores malformed shared frequency values", function() {
  S.tunerFreq = "NaN";
  S.tunerCents = "NaN";
  S.tunerActive = true;
  SparkInstruments.getAll = function() {
    return [{
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
          STRINGS: [
            { note: "E", freq: "NaN" }
          ],
          ALL_CHORDS: [
            { name: "G Major", short: "G" }
          ],
          CHORDS: {
            1: [{ name: "G Major", short: "G" }]
          }
        };
      }
    }];
  };

  var html = tunerTab();
  assert.ok(html.indexOf("--Hz") >= 0);
  assert.ok(html.indexOf("Play a note...") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("tunerTab and guideTab use instrument-neutral shared copy", function() {
  S.audioInputDevices = [{ id: "usb-1", name: "USB Interface" }];
  S.audioTestingId = "usb-1";
  S.audioTestLevel = 12;

  var tunerHtml = tunerTab();
  var guideHtml = guideTab();

  assert.ok(tunerHtml.indexOf("Signal detected - play to confirm") >= 0);
  assert.ok(tunerHtml.indexOf("strum your guitar") === -1);
  assert.ok(guideHtml.indexOf("Tune your instrument with the built-in mic tuner") >= 0);
  assert.ok(guideHtml.indexOf("Tune your guitar with the built-in mic tuner") === -1);
});

test("tunerTab and statsTab ignore malformed shared counters", function() {
  S.audioInputDevices = [{ id: "usb-1", name: "USB Interface" }];
  S.audioTestingId = "usb-1";
  S.audioTestLevel = "NaN";
  S.xp = "NaN";
  S.level = "NaN";
  S.streak = "NaN";
  localStorage.setItem("pianospark_jeeves_export", JSON.stringify({ xp: "NaN", level: "NaN", sessions: "NaN", streak: "NaN" }));

  var tunerHtml = tunerTab();
  var statsHtml = statsTab();

  assert.ok(tunerHtml.indexOf("width:0%") >= 0);
  assert.ok(tunerHtml.indexOf("NaN") === -1);
  assert.ok(statsHtml.indexOf(">0</div><div class=\"metric-label\">Total XP</div>") >= 0);
  assert.ok(statsHtml.indexOf("Lvl 1") >= 0);
  assert.ok(statsHtml.indexOf("Combined XP") >= 0);
  assert.ok(statsHtml.indexOf("NaN") === -1);
});

test("tools page can resolve sparkCore from the global binding", function() {
  global.window = {};
  S.tunerActive = undefined;
  S.tunerNote = undefined;
  S.tunerFreq = undefined;
  S.tunerCents = undefined;
  S.tunerErr = undefined;
  S.audioInputDevices = [];
  S.audioInputId = undefined;
  S.audioTestingId = undefined;
  S.audioTestLevel = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          tunerActive: true,
          tunerNote: "D",
          tunerFreq: 146.8,
          tunerCents: 1,
          tunerError: null,
          audioInputDevices: [{ id: "usb-1", name: "USB Interface" }],
          audioInputId: "usb-1",
          audioTestingId: "usb-1",
          audioTestLevel: 18
        }
      };
    }
  };

  var html = tunerTab();
  assert.ok(html.indexOf(">D<") >= 0);
  assert.ok(html.indexOf("146.8 Hz") >= 0 || html.indexOf("146.80 Hz") >= 0 || html.indexOf("147 Hz") >= 0);
  assert.ok(html.indexOf("USB Interface") >= 0);
  assert.ok(html.indexOf("Signal detected - play to confirm") >= 0);
});

test("challenge and skill tree pages can resolve sparkCore from the global binding", function() {
  global.window = {};
  S.activeChallenges = [];
  S.skillTreeFocus = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          dashboardChallenges: [{
            id: "daily_1",
            title: "Daily Groove",
            description: "Hit 3 clean reps",
            progress: 2,
            target: 3,
            completed: false,
            claimed: false
          }]
        }
      };
    },
    getRuntimeState: function() {
      return {
        skillTreeFocus: "rhythm"
      };
    }
  };

  var challengeHtml = renderActiveChallengesCard();
  var skillHtml = skillTreePage();

  assert.ok(challengeHtml.indexOf("Daily Groove") >= 0);
  assert.ok(challengeHtml.indexOf("2 / 3") >= 0);
  assert.ok(skillHtml.indexOf("Rhythm") >= 0);
  assert.ok(skillHtml.indexOf("Steady Pulse") >= 0);
  assert.ok(skillHtml.indexOf("Overview") >= 0);
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

test("statsTab uses the active instrument label in the music journey card", function() {
  localStorage.setItem("pianospark_jeeves_export", JSON.stringify({ xp: 22, level: 4 }));
  var html = statsTab();
  assert.ok(html.indexOf("My Music Journey") >= 0);
  assert.ok(html.indexOf(">Piano<") >= 0);
  assert.ok(html.indexOf(">Guitar<") === -1);
});

test("statsTab ignores malformed shared history and transition metrics", function() {
  S.history = { broken: true };
  S.transitionStats = {
    "C->G": {
      attempts: "NaN",
      avgTime: "NaN",
      best: "NaN"
    },
    "G->Am": {
      attempts: 3,
      avgTime: "NaN",
      best: "NaN"
    }
  };

  var html = statsTab();
  assert.ok(html.indexOf("Practice Stats") >= 0);
  assert.ok(html.indexOf("NaNs") === -1);
  assert.ok(html.indexOf("0.0s") >= 0);
});

test("tools page routes learning path through a studio action", function() {
  var toolsSource = loadJS("js/pages/tools.js");
  var studioSource = loadJS("js/actions/studio_family.js");
  assert.ok(toolsSource.indexOf('onclick="act(\\\'openLearningPath\\\')"') >= 0);
  assert.ok(studioSource.indexOf('if (a === "openLearningPath") {') >= 0);
  assert.ok(studioSource.indexOf('window.SparkShowroomNavigate("path");') >= 0);
});

test("shared helpers ignore malformed drill and strum BPM values", function() {
  __elements["drill-timer-ring"] = makeElement();
  __elements["drill-switch-count"] = makeElement();
  __elements["drill-adaptive-bpm"] = makeElement();
  S.drillTimer = 25;
  S.drillSwitches = 4;
  S.drillAdaptiveBpm = "NaN";
  global.STRUM_PATTERNS = [{ name: "Groove", desc: "Steady", bpm: "NaN", pattern: ["D", "U"] }];
  S.sessions = 0;

  assert.strictEqual(updateDrillTimerUI(), true);
  assert.strictEqual(__elements["drill-adaptive-bpm"].textContent, "0");

  var html = strumTrackCard();
  assert.ok(html.indexOf("-- BPM") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
