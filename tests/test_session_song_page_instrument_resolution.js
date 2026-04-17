var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

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
    bpm: 96,
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
      bpm: 110
    }];
  };

  var communityHtml = songsTab();
  assert.ok(communityHtml.indexOf("community_song_1") >= 0);
  assert.ok(communityHtml.indexOf(">null<") === -1);

  S.songsSubTab = "perform";
  var performHtml = songsTab();
  assert.ok(performHtml.indexOf("chart 1") >= 0);
  assert.ok(performHtml.indexOf("Unknown Artist") >= 0);
  assert.ok(performHtml.indexOf(">undefined<") === -1);
  assert.ok(performHtml.indexOf(">NaN<") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
