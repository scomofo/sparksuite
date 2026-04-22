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


function resetEnvironment() {
  global.window = global;
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

test("sessionPage rehydrates an app-id-only active instrument shell", function() {
  var html = sessionPage();
  assert.ok(html.indexOf("C") >= 0);
  assert.ok(html.indexOf("chord-svg") >= 0);
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
