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
_testEval(loadJS("js/sparksuite/core/capo_mode.js"));
_testEval(loadJS("js/sparksuite/ui/session_shell.js"));


function resetEnvironment() {
  global.window = global;
  global.sparkCore = undefined;
  global.S = {
    currentChord: { name: "C" },
    timer: 45,
    timerActive: false,
    selectedVoicing: 0,
    metronomeOn: false,
    metronomeBpm: 80,
    _metroBeat: 0,
    _metroBeats: 4,
    chordDetectOn: false,
    detectedNotes: [],
    chordMatch: -1,
    chordDetectErr: "",
    drillChords: [{ name: "C" }, { name: "G" }],
    drillIdx: 0,
    drillTimer: 30,
    drillSwitches: 2,
    drillAdaptiveBpm: 70,
    quizQ: { name: "C" },
    quizOpts: [{ name: "C" }],
    quizAns: null,
    quizScore: 1,
    quizTotal: 1,
    quizStreak: 1,
    songsSubTab: "builtin",
    songFilter: "",
    songSort: "level",
    songSortAsc: true,
    performanceDailyChallenge: null,
    performanceDailyComplete: false,
    communityTab: "browse",
    communitySearch: "",
    communitySort: "votes",
    communitySongs: [],
    communityLoading: false,
    communityError: "",
    importedSongs: [],
    importedSong: null,
    importError: "",
    importText: "",
    selectedSong: {
      title: "Nocturne",
      artist: "Piano Suite",
      bpm: 72,
      chords: ["C", "G"],
      progression: ["C", "G"],
      pattern: ["D", "U"]
    },
    songPlaying: false,
    songBeat: 0,
    capoModeFret: 0,
    strumTone: "classic",
    performDifficulty: "normal"
  };
  global.escHTML = function(value) { return String(value); };
  global.ringHTML = function() { return "<div>ring</div>"; };
  global.getExpectedNotes = function() { return []; };
  global._buildChordCheckInner = function() { return "<div>check</div>"; };
  global.getTransitionTip = function() { return ""; };
  global.tierBadgeHTML = function() { return ""; };
  global.strumHandSVG = function() { return "<div>hand</div>"; };
  global.strumHTML = function() { return "<div>pattern</div>"; };
  global.getPerformanceStats = function() { return { mastery: "none" }; };
  global.getMasteryColor = function() { return "#999"; };
  global.getMasteryIcon = function() { return ""; };
  global.clickableDiv = function() { return ""; };
  global.STEM_NAMES = ["vocals"];
  global.STEM_COLORS = { vocals: "#fff" };
  global.STEM_ICONS = { vocals: "V" };
  global.formatTime = function(value) { return String(value || 0); };
  global._prevChordKey = null;
  global.VOICINGS = {};
  global.STRUM_PATTERNS = [{ name: "Groove", desc: "Steady", level: 1, bpm: 72, pattern: ["D", "U"] }];
  global.act = function() {};

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
        ALL_CHORDS: [{ name: "C", short: "C" }, { name: "G", short: "G" }],
        LC: { 1: "#3366ff" },
        LN: { 1: "First Keys" },
        SONGS: [{
          title: "Nocturne",
          artist: "Piano Suite",
          level: 1,
          bpm: 72,
          chords: ["C", "G"],
          progression: ["C", "G"]
        }]
      };
    }
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
    global.eval(loadJS("js/pages/session.js"));
    global.eval(loadJS("js/pages/songs.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Session/Song Page Instrument Resolution ---");

test("render registry keeps session screens on the shared session shell", function() {
  var source = loadJS("js/render_registry.js");
  assert.ok(source.indexOf("S.screen === SCR.SESSION") >= 0);
  assert.ok(source.indexOf("return sharedPages[S.screen]()") >= 0);
});

test("sessionPage rehydrates an app-id-only active instrument shell", function() {
  var html = sessionPage();
  assert.ok(html.indexOf("C") >= 0);
  assert.ok(html.indexOf("chord-svg") >= 0);
});

test("session family pages surface the live daily-practice shell from sparkCore", function() {
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          focus: "Timing focus",
          segments: [
            { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 },
            { id: "song_1", type: "song", label: "Song push", durationSec: 240 }
          ]
        },
        activeSegment: { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 },
        runtimeState: {
          activeSegmentId: "practice_1",
          transport: { status: "paused", positionMs: 30000, durationMs: 120000 }
        }
      };
    }
  };
  S.dailyChallenge = { id: "marathon", icon: "X", title: "Daily", desc: "Challenge", xp: 15 };

  var sessionHtml = sessionPage();
  var drillHtml = drillPage();
  var dailyHtml = dailyPage();

  assert.ok(sessionHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(sessionHtml.indexOf("Paused - Quick warmup") >= 0);
  assert.ok(sessionHtml.indexOf("Resume Block") >= 0);
  assert.ok(sessionHtml.indexOf("Skip Block") >= 0);
  assert.ok(sessionHtml.indexOf("0m 30s in block") >= 0);
  assert.ok(sessionHtml.indexOf("1m 30s left") >= 0);
  assert.ok(drillHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(dailyHtml.indexOf("Practice Session Live") >= 0);
});

test("sessionPage can render a live daily-practice shell without a legacy chord", function() {
  S.currentChord = null;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          focus: "Set A - Strum Stability",
          segments: [
            { id: "uke_favorites_set_a_warmup", type: "warmup", label: "Warm-up Strum", durationSec: 120 }
          ]
        },
        activeSegment: { id: "uke_favorites_set_a_warmup", type: "warmup", label: "Warm-up Strum", durationSec: 120 },
        runtimeState: {
          activeSegmentId: "uke_favorites_set_a_warmup",
          transport: { status: "running", positionMs: 1000, durationMs: 120000 }
        }
      };
    }
  };

  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(sessionHtml.indexOf("In progress - Warm-up Strum") >= 0);
});

test("sessionPage falls back to the projected legacy daily plan shell", function() {
  S.currentChord = null;
  S.practicePlan = {
    flow: "daily_practice",
    focus: "Set A - Strum Stability",
    items: [
      { id: "uke_favorites_set_a_warmup", type: "warmup", label: "Warm-up Strum", durationSec: 120 }
    ]
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(sessionHtml.indexOf("In progress - Warm-up Strum") >= 0);
});

test("sessionPage renders a fallback shell instead of a blank session screen", function() {
  S.currentChord = null;
  S.practicePlan = null;
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var sessionHtml = sessionPage();
  assert.ok(sessionHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(sessionHtml.indexOf("In progress - Practice block") >= 0);
});

test("sessionPage prefers canonical runtime values over stale legacy session state", function() {
  S.currentChord = { name: "C" };
  S.timer = 45;
  S.timerActive = false;
  S.metronomeOn = false;
  S.metronomeBpm = 80;
  global.ringHTML = function(_pct, _size, _width, _color, inner) { return "<div>" + inner + "</div>"; };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          focus: "Timing focus",
          segments: [
            { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 }
          ]
        },
        activeSegment: { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 },
        runtimeState: {
          activeSegmentId: "practice_1",
          legacyPracticeChordName: "G",
          legacyPracticeRemainingSec: 90,
          legacyPracticeTimerActive: true,
          metronomeActive: true,
          metronomeBpm: 96,
          metronomeBeat: 2,
          metronomeBeatsPerBar: 4,
          transport: { status: "running", positionMs: 30000, durationMs: 120000 }
        }
      };
    }
  };

  var html = sessionPage();
  assert.ok(html.indexOf(">G</h2>") >= 0);
  assert.ok(html.indexOf(">1:30<") >= 0);
  assert.ok(html.indexOf("&#9208; Pause") >= 0);
  assert.ok(html.indexOf(">96<") >= 0);
  assert.strictEqual(html.indexOf(">C</h2>"), -1);
});

test("session mini-game pages prefer canonical runtime over stale legacy quiz and strum state", function() {
  global.S.quizQ = { name: "Legacy Quiz" };
  global.S.quizOpts = [{ name: "Legacy Quiz" }];
  global.S.quizScore = 1;
  global.S.quizTotal = 1;
  global.S.quizStreak = 1;
  global.S.selectedStrum = { name: "Legacy Strum", desc: "Old", bpm: 60, pattern: ["D"] };
  global.S.strumActive = false;
  global.S._strumBeat = 0;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          legacyQuizQuestion: { name: "Core Quiz" },
          legacyQuizOptions: [{ name: "Core Quiz" }, { name: "Runtime Choice" }],
          legacyQuizAnswer: null,
          legacyQuizScore: 4,
          legacyQuizTotal: 6,
          legacyQuizStreak: 2,
          legacyStrumPattern: { name: "Core Strum", desc: "Runtime", bpm: 96, pattern: ["D", "U"] },
          legacyStrumActive: true,
          legacyStrumBeat: 1
        }
      };
    }
  };
  global.window.sparkCore = global.sparkCore;

  var quizHtml = quizPage();
  var strumHtml = strumDetailPage();

  assert.ok(quizHtml.indexOf("Core Quiz") >= 0);
  assert.ok(quizHtml.indexOf("Runtime Choice") >= 0);
  assert.strictEqual(quizHtml.indexOf("Legacy Quiz"), -1);
  assert.ok(quizHtml.indexOf("4/6") >= 0);
  assert.ok(strumHtml.indexOf("Core Strum") >= 0);
  assert.ok(strumHtml.indexOf("96 BPM") >= 0);
  assert.strictEqual(strumHtml.indexOf("Legacy Strum"), -1);
});

test("drillPage prefers canonical drill chords over stale legacy drill state", function() {
  S.drillChords = [{ name: "C" }, { name: "G" }];
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          focus: "Timing focus",
          segments: [
            { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 }
          ]
        },
        activeSegment: { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120 },
        runtimeState: {
          activeSegmentId: "practice_1",
          legacyDrillChordNames: ["G", "C"],
          legacyPracticeRemainingSec: 90,
          transport: { status: "running", positionMs: 30000, durationMs: 120000 }
        }
      };
    }
  };

  var html = drillPage();

  assert.ok(html.indexOf("chord-svg\">G<") >= 0);
  assert.ok(html.indexOf("Next: <strong>C") >= 0);
});

test("sessionPage ignores stale practice intention text", function() {
  S.practiceIntention = "undefined";
  var html = sessionPage();
  assert.ok(html.indexOf("When I undefined") === -1);
});

test("sessionPage ignores malformed metronome and drill BPM values", function() {
  S.metronomeBpm = "NaN";
  S._metroBeat = "NaN";
  S._metroBeats = "NaN";
  S.drillAdaptiveBpm = "NaN";

  var sessionHtml = sessionPage();
  var drillHtml = drillPage();

  assert.ok(sessionHtml.indexOf("80") >= 0);
  assert.ok(drillHtml.indexOf('id="drill-adaptive-bpm"') >= 0);
  assert.ok(drillHtml.indexOf(">0<") >= 0 || drillHtml.indexOf(">0</div>") >= 0);
  assert.ok(sessionHtml.indexOf("NaN") === -1);
  assert.ok(drillHtml.indexOf("NaN") === -1);
});

test("completePage ignores malformed XP and streak counters", function() {
  S.xpToast = { amount: "NaN" };
  S.streak = "NaN";
  S.chordProgress = { C: "NaN" };

  var html = completePage();
  assert.ok(html.indexOf("+10") >= 0);
  assert.ok(html.indexOf("&#128293;0") >= 0);
  assert.ok(html.indexOf(">0%</div>") >= 0 || html.indexOf(">0%<") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("quizPage ignores malformed cached score counters", function() {
  S.quizScore = "NaN";
  S.quizTotal = "NaN";
  S.quizStreak = "NaN";

  var html = quizPage();
  assert.ok(html.indexOf(">0/0<") >= 0);
  assert.ok(html.indexOf("&#128293;<span style=\"font-weight:700;color:#FF6B6B\">0</span>") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("songDetailPage and songDonePage ignore stale song copy tokens", function() {
  S.selectedSong = {
    id: "moonlight_sonata",
    title: "undefined",
    artist: "null",
    bpm: "NaN",
    chords: ["C", "G"],
    progression: ["C", "G"],
    pattern: ["D", "U"]
  };

  var detailHtml = songDetailPage();
  var doneHtml = songDonePage();
  assert.ok(detailHtml.indexOf("moonlight_sonata") >= 0);
  assert.ok(detailHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(detailHtml.indexOf("-- BPM") >= 0);
  assert.ok(detailHtml.indexOf(">undefined<") === -1);
  assert.ok(detailHtml.indexOf(">null<") === -1);
  assert.ok(detailHtml.indexOf("NaN") === -1);
  assert.ok(doneHtml.indexOf("moonlight_sonata") >= 0);
  assert.ok(doneHtml.indexOf(">undefined<") === -1);
});

test("song detail applies capo mode to displayed chord shapes without changing sounding chords", function() {
  S.capoModeFret = 2;
  S.selectedSong = {
    title: "Capo Song",
    artist: "Player",
    bpm: 90,
    chords: ["A", "E", "F#m", "D"],
    progression: ["A", "E", "F#m", "D"],
    pattern: ["D", "U"]
  };

  var html = songDetailPage();

  assert.ok(html.indexOf("Capo 2") >= 0);
  assert.ok(html.indexOf("G (sounds A)") >= 0);
  assert.ok(html.indexOf("D (sounds E)") >= 0);
  assert.ok(html.indexOf("Em (sounds F#m)") >= 0);
  assert.ok(html.indexOf("C (sounds D)") >= 0);
});

test("song library perform buttons rely on clickable card guards instead of inline propagation hacks", function() {
  var songsSource = loadJS("js/pages/songs.js");
  var uiSource = loadJS("js/ui.js");
  assert.ok(songsSource.indexOf('onclick="act(\\\'openPerformSong\\\',') >= 0);
  assert.strictEqual(songsSource.indexOf("event.stopPropagation();act('openPerformSong'"), -1);
  assert.ok(uiSource.indexOf('if(event.target&&event.target.closest&&event.target.closest("button,input,select,textarea,a")){return;}') >= 0);
});

test("strumDetailPage ignores malformed BPM values", function() {
  S.selectedStrum = {
    name: "Groove",
    desc: "Steady",
    bpm: "NaN",
    pattern: ["D", "U"]
  };

  var html = strumDetailPage();
  assert.ok(html.indexOf("-- BPM") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("strumTab ignores malformed pattern BPM values", function() {
  global.STRUM_PATTERNS = [{ name: "Groove", desc: "Steady", level: 1, bpm: "NaN", pattern: ["D", "U"] }];

  var html = strumTab();
  assert.ok(html.indexOf("-- BPM") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("songsTab rehydrates an app-id-only active instrument shell", function() {
  var html = songsTab();
  assert.ok(html.indexOf("Song Library") >= 0);
  assert.ok(html.indexOf("Nocturne") >= 0);
  assert.ok(html.indexOf("Lvl 1") >= 0);
});

test("songsTab tolerates instruments without a song library", function() {
  global.SparkInstruments = {
    getActive: function() {
      return {
        appId: "vocalspark",
        instrument: "vocals",
        getData: function() {
          return { ALL_CHORDS: [] };
        }
      };
    },
    getAll: function() {
      return [];
    }
  };

  var html = songsTab();

  assert.ok(html.indexOf("Song Library") >= 0);
});

test("songsTab ignores stale performance daily copy tokens", function() {
  S.performanceDailyChallenge = {
    label: "undefined",
    songTitle: "Moonlight",
    reason: "null",
    techniqueKey: " undefined ",
    xp: 25
  };

  var html = songsTab();
  assert.ok(html.indexOf("Moonlight") >= 0);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf("Technique focus") === -1);
});

test("songs surfaces ignore stale chart and community text tokens", function() {
  S.songsSubTab = "community";
  S.communitySongs = [{
    id: "community_song_1",
    title: "undefined",
    artist: "null",
    bpm: "NaN",
    votes: 3,
    chords: "[]"
  }];
  global.getPerformanceChartLibrary = function() {
    return [{
      id: "chart_1",
      title: "undefined",
      artist: "null",
      badge: " NaN ",
      description: "undefined",
      bpm: "NaN"
    }];
  };

  var communityHtml = songsTab();
  assert.ok(communityHtml.indexOf("community_song_1") >= 0);
  assert.ok(communityHtml.indexOf(">null<") === -1);

  S.songsSubTab = "perform";
  var performHtml = songsTab();
  assert.ok(performHtml.indexOf("chart 1") >= 0);
  assert.ok(performHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(performHtml.indexOf("-- BPM") >= 0);
  assert.ok(performHtml.indexOf(">undefined<") === -1);
  assert.ok(performHtml.indexOf(">NaN<") === -1);
  assert.ok(performHtml.indexOf("NaN BPM") === -1);
});

test("songs import list ignores stale imported song text tokens", function() {
  S.songsSubTab = "import";
  S.importedSongs = [{
    id: "import_song_1",
    title: "undefined",
    artist: "null",
    bpm: "NaN",
    chords: ["C", "G"]
  }];

  var html = songsTab();
  assert.ok(html.indexOf("import song 1") >= 0);
  assert.ok(html.indexOf("Unknown Artist") >= 0);
  assert.ok(html.indexOf("-- BPM") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("songs forms ignore stale cached submit and import field values", function() {
  S.songsSubTab = "community";
  S.communityTab = "submit";
  S.submitSong = {
    title: "undefined",
    artist: "null",
    submittedBy: "NaN",
    bpm: "NaN",
    chords: [],
    progression: []
  };

  var submitHtml = songsTab();
  assert.ok(submitHtml.indexOf('value="undefined"') === -1);
  assert.ok(submitHtml.indexOf('value="null"') === -1);
  assert.ok(submitHtml.indexOf('value="NaN"') === -1);

  S.songsSubTab = "import";
  S.importText = "undefined";
  S.importedSong = {
    id: "import_song_2",
    title: "undefined",
    artist: "null",
    bpm: "NaN",
    chords: ["C", "G"],
    progression: ["C", "G"]
  };

  var importHtml = songsTab();
  assert.ok(importHtml.indexOf('value="undefined"') === -1);
  assert.ok(importHtml.indexOf('value="null"') === -1);
  assert.ok(importHtml.indexOf(">undefined</textarea>") === -1);
  assert.ok(importHtml.indexOf('value="import song 2"') >= 0);
  assert.ok(importHtml.indexOf('value="90"') >= 0);
  assert.ok(submitHtml.indexOf('value="90"') >= 0);
  assert.ok(importHtml.indexOf("NaN") === -1);
  assert.ok(submitHtml.indexOf("NaN") === -1);
});

test("songs search inputs ignore stale sentinel strings", function() {
  S.songsSubTab = "builtin";
  S.songFilter = "undefined";
  var libraryHtml = songsTab();
  assert.ok(libraryHtml.indexOf('value="undefined"') === -1);
  assert.ok(libraryHtml.indexOf('matching &ldquo;undefined&rdquo;') === -1);

  S.songsSubTab = "community";
  S.communitySearch = "null";
  var communityHtml = songsTab();
  assert.ok(communityHtml.indexOf('value="null"') === -1);
});

test("stems player ignores malformed stem volume values", function() {
  global.window.electron = {};
  S.stemStatus = "ready";
  S.stemVolume = "NaN";
  S.stemFile = { fileName: "mix.wav" };

  var html = stemsPage();
  assert.ok(html.indexOf('value="1"') >= 0 || html.indexOf('value="1.0"') >= 0);
  assert.ok(html.indexOf(">100%</span>") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
