var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.render = function() {};
  global.act = function() {};
  global.findChord = function() { return null; };
  global.chordTypeTag = function() { return ""; };
  global.pianoSVG = function() { return "<svg></svg>"; };
  global.pianoClickableDiv = function(action, inner, cls) {
    return '<div class="' + cls + '" data-action="' + action + '">' + inner + "</div>";
  };
  global.levelColor = function() { return "#fff"; };
  global.STEM_NAMES = ["vocals"];
  global.STEM_COLORS = { vocals: "#fff" };
  global.STEM_ICONS = { vocals: "V" };
  global.pianoFormatTime = function(value) { return String(value || 0); };
  global.getPianoPageInstrument = function() {
    return {
      getData: function() {
        return {
          SONGS: [
            {
              id: "midnight_groove",
              title: "undefined",
              artist: "null",
              level: 2,
              bpm: 100,
              chords: ["C"],
              progression: ["C"]
            }
          ],
          CURRICULUM: [{ icon: "I" }, { icon: "II" }]
        };
      }
    };
  };
  global.S = {
    _songTab: "library",
    songIdx: 0,
    songPlaying: false,
    songChordIdx: 0,
    bpm: 90,
    stemStatus: "separating",
    stemError: "undefined",
    stemFile: { fileName: "null" },
    stemProgress: 45,
    stemPaths: { vocals: "vocals.wav" },
    stemToggles: { vocals: true },
    stemCurrentTime: 0,
    stemDuration: 120,
    stemVolume: 0.8
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/instruments/piano/pages/songs.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Songs Page Resolution ---");

test("piano selected song view ignores stale title and artist text", function() {
  pianoSongsTab();
  var html = songLibrary();
  assert.ok(html.indexOf("midnight_groove") >= 0);
  assert.ok(html.indexOf("Unknown Artist") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
});

test("piano stems screens ignore stale file and error text", function() {
  var section = stemsSection();
  var player = pianoStemsPlayerPage();
  assert.ok(section.indexOf("undefined") === -1);
  assert.ok(section.indexOf("null") === -1);
  assert.ok(player.indexOf("null") === -1);
});

test("piano song library list ignores stale row labels and still filters safely", function() {
  S.songIdx = null;
  S.songFilter = "midnight";
  S.songSort = "title";
  S.songSortAsc = true;
  pianoSongsTab();
  var html = songLibrary();
  assert.ok(html.indexOf("midnight_groove") >= 0);
  assert.ok(html.indexOf("Unknown Artist") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("null") === -1);
});

test("piano stems player ignores malformed stem volume values", function() {
  global.window.electron = {};
  S.stemStatus = "ready";
  S.stemVolume = "NaN";
  S.stemFile = { fileName: "mix.wav" };

  var html = pianoStemsPlayerPage();
  assert.ok(html.indexOf('value="1"') >= 0 || html.indexOf('value="1.0"') >= 0);
  assert.ok(html.indexOf(">100%</span>") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
