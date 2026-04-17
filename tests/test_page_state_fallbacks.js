var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    editorObject: {
      id: "chart_1",
      title: "Demo Chart",
      artist: "Spark",
      bpm: 100,
      events: [{ id: "evt_1", type: "chord", t: 1 }],
      phrases: [{ id: "phrase_1", name: "Verse", startSec: 0, endSec: 4 }]
    },
    editorMode: "chart",
    editorDirty: true,
    editorGridDivision: "1/8",
    editorPlayheadSec: 2,
    editorSnapEnabled: true,
    editorSelectedId: "evt_1",
    performEditorChart: {
      title: "Performance Chart",
      bpm: 90,
      events: [{ id: 1, laneLabel: "C", t: 1, dur: 1 }],
      phrases: [{ id: 1, name: "Intro", startSec: 0, endSec: 4 }]
    },
    performEditorLibrary: [{ title: "Saved Chart", events: [] }],
    performChart: {
      title: "Night Drive",
      artist: "Spark Artist",
      instrument: "piano",
      events: [],
      phrases: []
    },
    performSongData: {
      title: "River Run",
      artist: "Spark Artist",
      bpm: 92,
      chords: ["C", "G"],
      progression: ["C", "G", "Am", "F"]
    },
    performSongId: "river_run",
    performArrangementType: "chords",
    performDifficulty: "normal",
    performSpeed: 1,
    xp: 125,
    level: 4,
    streak: 3,
    sessions: 9,
    todayPracticeSeconds: 600,
    dailyGoalMinutes: 15
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.sparkCore = null;
  global.escHTML = function(value) { return String(value); };
  global.validateEditorObject = function() { return []; };
  global.renderVisualTimeline = null;
  global.renderEditorInspector = function() { return '<div class="card">Inspector</div>'; };
  global.getPerformancePhraseForTime = function() { return null; };
  global.getNextPerformEvent = function() { return null; };
  global.renderPerformanceHighway = function() { return '<div class="perform-highway">Highway</div>'; };
  global.getAvailablePerformanceHighwayThemes = function() { return ["classic"]; };
  global.getPerformanceHighwayThemeId = function() { return "classic"; };
  global.getPerformanceHighwayInstrument = function() { return "piano"; };
  global.getPerformanceStats = function() {
    return { mastery: "solid", runs: 2, bestScore: 900, bestAccuracy: 88, bestStars: 4 };
  };
  global.getMasteryColor = function() { return "#4ECDC4"; };
  global.getMasteryIcon = function() { return "*"; };
  global.buildPerformanceRecommendationsForSong = function() {
    return [{ label: "Keep going", reason: "Strong recent run" }];
  };
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Page State Fallbacks ---");

async function run() {
  await test("editor page can render from plain global S", function() {
    eval(loadJS("js/pages/editor.js"));

    var html = editorPage();

    assert.ok(html.indexOf("Demo Chart") >= 0);
    assert.ok(html.indexOf("Dirty:</b> Yes") >= 0);
    assert.ok(html.indexOf("Events: 1") >= 0);
  });

  await test("performance editor page can render from plain global S", function() {
    eval(loadJS("js/pages/performance_editor.js"));

    var html = performanceEditorPage();

    assert.ok(html.indexOf("Chart Editor") >= 0);
    assert.ok(html.indexOf("Performance Chart") >= 0);
    assert.ok(html.indexOf("Events (1)") >= 0);
  });

  await test("perform song page can render from plain global S", function() {
    eval(loadJS("js/pages/perform_song.js"));

    var html = performSongPage();

    assert.ok(html.indexOf("River Run") >= 0);
    assert.ok(html.indexOf("Start Performance") >= 0);
    assert.ok(html.indexOf("Best Accuracy") >= 0);
  });

  await test("perform page can render from plain global S", function() {
    eval(loadJS("js/pages/perform.js"));

    var html = performPage();

    assert.ok(html.indexOf("Night Drive") >= 0);
    assert.ok(html.indexOf("Score") >= 0);
    assert.ok(html.indexOf("Highway") >= 0);
  });

  await test("games and calibration pages can render from plain global S", function() {
    global.getPerformanceCalibrationView = function() {
      return {
        source: "midi",
        mode: null,
        globalOffsetMs: 0,
        midiOffsetMs: 5,
        micOffsetMs: -3
      };
    };
    eval(loadJS("js/pages/games.js"));
    eval(loadJS("js/pages/perform_calibration.js"));

    assert.ok(rhythmTab().indexOf("Rhythm Game") >= 0);
    assert.ok(performCalibrationPage().indexOf("Performance Calibration") >= 0);
  });

  await test("skill tree page can read focus from plain global S", function() {
    global.S.skillTreeFocus = "rhythm";
    global.SparkInstruments = {
      getActive: function() {
        return {
          getSkillTree: function() {
            return {
              branches: [
                { id: "rhythm", title: "Rhythm", nodes: [] },
                { id: "chords", title: "Chords", nodes: [] }
              ]
            };
          }
        };
      }
    };
    global.renderSkillTreeBranch = function(branch) {
      return '<div class="branch">' + branch.title + '</div>';
    };
    eval(loadJS("js/pages/skill_tree.js"));

    var html = skillTreePage();

    assert.ok(html.indexOf("Skill Tree") >= 0);
    assert.ok(html.indexOf("Rhythm") >= 0);
  });

  await test("skill tree page rehydrates thin active instruments before reading the tree", function() {
    global.S.skillTreeFocus = "overview";
    global.SparkInstruments = {
      getActive: function() {
        return { appId: "pianospark" };
      },
      getAll: function() {
        return [{
          id: "pianospark",
          appId: "pianospark",
          getSkillTree: function() {
            return {
              branches: [
                { id: "overview", label: "Overview", nodes: [] },
                { id: "rhythm", label: "Rhythm", nodes: [] }
              ]
            };
          }
        }];
      }
    };
    global.renderSkillTreeBranch = function(branch) {
      return '<div class="branch">' + branch.label + '</div>';
    };
    eval(loadJS("js/pages/skill_tree.js"));

    var html = skillTreePage();

    assert.ok(html.indexOf("Overview") >= 0);
    assert.ok(html.indexOf("Rhythm") >= 0);
  });

  await test("guided page rehydrates thin active instruments before reading page ui", function() {
    global.SparkInstruments = {
      getActive: function() {
        return { appId: "pianospark" };
      },
      getAll: function() {
        return [{
          id: "pianospark",
          appId: "pianospark",
          getData: function() { return { ALL_CHORDS: [] }; },
          ui: { chord: function() { return "<svg></svg>"; } }
        }];
      }
    };
    eval(loadJS("js/pages/guided.js"));

    var instrument = resolveGuidedActiveInstrument();

    assert.ok(instrument);
    assert.strictEqual(instrument.id, "pianospark");
    assert.strictEqual(typeof instrument.getData, "function");
    assert.strictEqual(typeof instrument.ui.chord, "function");
  });

  await test("session page rehydrates thin active instruments before reading page ui", function() {
    global.SparkInstruments = {
      getActive: function() {
        return { appId: "pianospark" };
      },
      getAll: function() {
        return [{
          id: "pianospark",
          appId: "pianospark",
          getData: function() { return { ALL_CHORDS: [] }; },
          ui: { chord: function() { return "<svg></svg>"; } }
        }];
      }
    };
    eval(loadJS("js/pages/session.js"));

    var instrument = resolveSessionActiveInstrument();

    assert.ok(instrument);
    assert.strictEqual(instrument.id, "pianospark");
    assert.strictEqual(typeof instrument.getData, "function");
    assert.strictEqual(typeof instrument.ui.chord, "function");
  });

  await test("songs page rehydrates thin active instruments before rendering the library", function() {
    global.clickableDiv = function() { return ""; };
    global.SparkInstruments = {
      getActive: function() {
        return { appId: "pianospark" };
      },
      getAll: function() {
        return [{
          id: "pianospark",
          appId: "pianospark",
          getData: function() {
            return {
              LC: { 1: "#4ECDC4" },
              SONGS: [{
                title: "River Run",
                artist: "Spark Artist",
                level: 1,
                bpm: 92,
                chords: ["C", "G"],
                progression: ["C", "G", "Am", "F"]
              }],
              ALL_CHORDS: [{ name: "C Major", short: "C" }, { name: "G Major", short: "G" }]
            };
          }
        }];
      }
    };
    eval(loadJS("js/pages/songs.js"));

    var html = songsTab();

    assert.ok(html.indexOf("Song Library") >= 0);
    assert.ok(html.indexOf("River Run") >= 0);
    assert.ok(html.indexOf("Spark Artist") >= 0);
  });

  await test("games page rehydrates thin active instruments before rendering game tabs", function() {
    global.SparkInstruments = {
      getActive: function() {
        return { appId: "pianospark" };
      },
      getAll: function() {
        return [{
          id: "pianospark",
          appId: "pianospark",
          getData: function() {
            return { ALL_CHORDS: [] };
          },
          ui: { chord: function() { return "<svg></svg>"; } }
        }];
      }
    };
    eval(loadJS("js/pages/games.js"));

    var html = runnerTab();

    assert.ok(html.indexOf("Chord Runner") >= 0);
    assert.ok(html.indexOf("Start!") >= 0);
  });

  await test("tools page rehydrates thin active instruments before rendering the guide", function() {
    global.SparkInstruments = {
      getActive: function() {
        return { appId: "pianospark" };
      },
      getAll: function() {
        return [{
          id: "pianospark",
          appId: "pianospark",
          getData: function() {
            return {
              STRINGS: [
                { note: "E", freq: 82.4 },
                { note: "A", freq: 110.0 }
              ],
              CHORDS: {
                1: [{ name: "E Major", short: "E" }]
              },
              ALL_CHORDS: [{ name: "E Major", short: "E" }]
            };
          },
          ui: { chord: function() { return "<svg>Chord</svg>"; } }
        }];
      }
    };
    eval(loadJS("js/pages/tools.js"));

    var html = guideTab();

    assert.ok(html.indexOf("How to Read Chord Charts") >= 0);
    assert.ok(html.indexOf("Example: E Major") >= 0);
  });

  await test("progress dashboard can render from plain global S", function() {
    global.sparkCore = {
      progressEngine: {
        getSkillGraph: function() {
          return {
            timing: { mastery: 0.4, confidence: 0.9, attempts: 3, lastPracticed: Date.now() - 86400000 },
            rhythm: { mastery: 0.8, confidence: 0.8, attempts: 5, lastPracticed: Date.now() }
          };
        },
        getDecayedSkills: function() {
          return [{ skillId: "timing", decay: 0.2 }];
        },
        getMasteryLevel: function(value) {
          return value >= 0.75 ? "SOLID" : "LEARNING";
        }
      }
    };
    eval(loadJS("js/pages/progress_dashboard.js"));

    var html = progressDashboardPage();

    assert.ok(html.indexOf("Your Progress") >= 0);
    assert.ok(html.indexOf("125") >= 0);
    assert.ok(html.indexOf("Focus Areas") >= 0);
    assert.ok(html.indexOf("Needs Review") >= 0);
  });

  await test("shared page roots fall back to global S when SparkState.getRoot returns null", function() {
    global.SparkState = { getRoot: function() { return null; } };
    global.sparkCore = {
      progressEngine: {
        getSkillGraph: function() { return {}; },
        getDecayedSkills: function() { return []; },
        getMasteryLevel: function() { return "LEARNING"; }
      }
    };

    eval(loadJS("js/pages/editor.js"));
    eval(loadJS("js/pages/performance_editor.js"));
    eval(loadJS("js/pages/perform_song.js"));
    eval(loadJS("js/pages/games.js"));
    eval(loadJS("js/pages/perform_calibration.js"));
    eval(loadJS("js/pages/skill_tree.js"));
    eval(loadJS("js/pages/progress_dashboard.js"));

    assert.ok(editorPage().indexOf("Demo Chart") >= 0);
    assert.ok(performanceEditorPage().indexOf("Performance Chart") >= 0);
    assert.ok(performSongPage().indexOf("River Run") >= 0);
    assert.ok(rhythmTab().indexOf("Rhythm Game") >= 0);
    assert.ok(performCalibrationPage().indexOf("Performance Calibration") >= 0);
    assert.ok(skillTreePage().indexOf("Skill Tree") >= 0);
    assert.ok(progressDashboardPage().indexOf("Your Progress") >= 0);
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
