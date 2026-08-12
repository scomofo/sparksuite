// ===== Difficulty Scaler Tests =====
// Run: node tests/test_difficulty_scaler.js
//
// Behavioral coverage for js/sparksuite/music/difficulty_scaler.js —
// post-processes PlayAlongChart note density in place per difficulty.
// A silent regression here corrupts every chart the player loads, so
// pin the exact easy/hard/normal transforms and the null-safety paths.

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  var full = path.join(__dirname, "..", file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

global.window = global;
loadJS("js/sparksuite/music/difficulty_scaler.js");

var scaler = new SparkDifficultyScaler();

function makeChart(noteCount) {
  var notes = [];
  for (var i = 0; i < noteCount; i++) {
    notes.push({ tick: i * 120, tickLength: 0 });
  }
  return {
    songChart: {
      tracks: {
        lead: { notes: notes }
      }
    }
  };
}

console.log("=== Difficulty Scaler Tests ===");

test("easy keeps every other note starting from the first", function() {
  var chart = makeChart(8);
  scaler.apply(chart, "easy");
  var notes = chart.songChart.tracks.lead.notes;
  assert.strictEqual(notes.length, 4);
  assert.deepStrictEqual(
    notes.map(function(n) { return n.tick; }),
    [0, 240, 480, 720]
  );
});

test("hard adds a half-beat sustain to every 4th zero-length note", function() {
  var chart = makeChart(8);
  scaler.apply(chart, "hard");
  var notes = chart.songChart.tracks.lead.notes;
  assert.strictEqual(notes.length, 8, "hard must not drop notes");
  assert.strictEqual(notes[0].tickLength, 240);
  assert.strictEqual(notes[0].flags.sustain, true);
  assert.strictEqual(notes[4].tickLength, 240);
  assert.strictEqual(notes[4].flags.sustain, true);
  assert.strictEqual(notes[1].tickLength, 0);
  assert.ok(!notes[1].flags);
});

test("hard leaves notes that already sustain alone", function() {
  var chart = makeChart(4);
  chart.songChart.tracks.lead.notes[0].tickLength = 480;
  scaler.apply(chart, "hard");
  assert.strictEqual(chart.songChart.tracks.lead.notes[0].tickLength, 480);
  assert.ok(!chart.songChart.tracks.lead.notes[0].flags);
});

test("normal passes notes through untouched", function() {
  var chart = makeChart(6);
  var before = JSON.stringify(chart);
  scaler.apply(chart, "normal");
  assert.strictEqual(JSON.stringify(chart), before);
});

test("scaling mutates the chart in place and returns it", function() {
  var chart = makeChart(4);
  var returned = scaler.apply(chart, "easy");
  assert.strictEqual(returned, chart, "must return the same chart object");
  assert.strictEqual(chart.songChart.tracks.lead.notes.length, 2);
});

test("every track in the chart is scaled", function() {
  var chart = makeChart(4);
  chart.songChart.tracks.bass = { notes: [{ tick: 0 }, { tick: 120 }] };
  scaler.apply(chart, "easy");
  assert.strictEqual(chart.songChart.tracks.lead.notes.length, 2);
  assert.strictEqual(chart.songChart.tracks.bass.notes.length, 1);
});

test("null and malformed charts are returned unchanged", function() {
  assert.strictEqual(scaler.apply(null, "easy"), null);
  var noSongChart = {};
  assert.strictEqual(scaler.apply(noSongChart, "easy"), noSongChart);
  var noTracks = { songChart: {} };
  assert.strictEqual(scaler.apply(noTracks, "easy"), noTracks);
  var emptyTrack = { songChart: { tracks: { lead: null } } };
  assert.strictEqual(scaler.apply(emptyTrack, "easy"), emptyTrack);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
