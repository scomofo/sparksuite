// ===== MIDI Chart Generation Tests =====
// Run: node tests/test_midi_chart_generation.js
//
// Charts backed by a MIDI file are regenerated on the song's REAL grid by
// scripts/generate-charts-from-midi.js: real duration, real tempo map, real
// bar boundaries, honest "Section N" phrases. Before this pipeline every
// MIDI-backed chart was an 8-bar loop tiled 3x (~80s) with fictional
// Verse/Chorus/Outro labels, misaligned with its own backing audio. These
// tests pin the generator's behavior against a real corpus file and the
// committed charts' corpus-wide properties.

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (e) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + e.message);
  }
}

var repo = path.join(__dirname, "..");
var generator = require(path.join(repo, "scripts", "generate-charts-from-midi.js"));
var io = new global.SparkChartIO();

console.log("\n--- MIDI Chart Generation ---");

test("extractProgression finds the shortest authored chord cycle", function() {
  function ev(chord) { return { chord: chord, notes: [chord], laneLabel: chord, strum: "down", type: "chord" }; }
  var tiled = [ev("C"), ev("G"), ev("Am"), ev("F"), ev("C"), ev("G"), ev("Am"), ev("F")];
  assert.strictEqual(generator.extractProgression(tiled).length, 4);
  assert.strictEqual(generator.extractProgression([ev("E"), ev("E"), ev("E")]).length, 1);
  var irregular = [ev("C"), ev("G"), ev("C"), ev("F")];
  assert.strictEqual(generator.extractProgression(irregular).length, 4, "non-repeating sequences stay whole");
});

test("regenerateChart rebuilds a chart on the real MIDI grid", function() {
  var chart = {
    id: "let_it_be_chords",
    title: "Let It Be",
    artist: "The Beatles",
    bpm: 72,
    beatsPerBar: 4,
    offsetSec: 0,
    audio: { type: "midi", src: "content/songs/midi/let_it_be.mid" },
    phrases: [{ id: 0, name: "Verse", startSec: 0, endSec: 26.667 }],
    events: []
  };
  var cycle = ["C", "G", "Am", "F", "C", "G", "F", "C"];
  for (var r = 0; r < 3; r++) {
    for (var i = 0; i < cycle.length; i++) {
      chart.events.push({
        id: chart.events.length + 1,
        t: chart.events.length * 3.333,
        dur: 3.333,
        type: "chord",
        chord: cycle[i],
        notes: [cycle[i]],
        laneLabel: cycle[i],
        strum: i % 2 ? "up" : "down"
      });
    }
  }
  var midi = fs.readFileSync(path.join(repo, "content", "songs", "midi", "let_it_be.mid"));
  var result = generator.regenerateChart(chart, midi, io);

  assert.ok(result, "regeneration must succeed for a real MIDI file");
  assert.ok(Math.abs(result.bpm - 70) < 1, "bpm must come from the MIDI tempo map, not the old chart (got " + result.bpm + ")");
  var end = result.events[result.events.length - 1];
  assert.ok(end.t + end.dur > 200, "events must span the real song duration, not an 80s loop (got " + (end.t + end.dur) + ")");
  assert.ok(result.events.length > 48, "full-length songs need more than the tiled 24 bars");
  assert.strictEqual(result.generated.progressionLength, 8, "the authored 8-chord cycle must be preserved");
  for (var c = 0; c < 8; c++) {
    assert.strictEqual(result.events[c].chord, cycle[c], "progression order must be preserved");
  }
  var names = result.phrases.map(function(p) { return p.name; });
  assert.ok(names.indexOf("Verse") === -1 && names.indexOf("Chorus") === -1, "no fictional section labels");
  assert.ok(/^Section 1$/.test(names[0]), "phrases are honest numbered sections");
  for (var e = 1; e < result.events.length; e++) {
    assert.ok(result.events[e].t > result.events[e - 1].t, "event times must be strictly increasing");
  }
});

test("time-signature changes shape the bar grid instead of the opening meter poisoning it", function() {
  // smells_like_teen_spirit.mid opens with a 1/4 pickup bar then switches to
  // 4/4 — the old grid applied 1/4 to the whole song (522 beat-length bars).
  var chart = {
    id: "sig_check", title: "Sig Check", artist: "x", bpm: 120, beatsPerBar: 4, offsetSec: 0,
    audio: { type: "midi", src: "content/songs/midi/smells_like_teen_spirit.mid" },
    phrases: [],
    events: [{ id: 1, t: 0, dur: 2, type: "chord", chord: "F5", notes: ["F"], laneLabel: "F5", strum: "down" }]
  };
  var midi = fs.readFileSync(path.join(repo, "content", "songs", "midi", "smells_like_teen_spirit.mid"));
  var result = generator.regenerateChart(chart, midi, io);
  assert.strictEqual(result.beatsPerBar, 4, "chart-level meter is the dominant signature, not the pickup");
  assert.ok(result.events.length < 200, "bar-length events, not beat-length (got " + result.events.length + ")");
  assert.ok(result.events[0].dur < result.events[1].dur, "the 1/4 pickup bar stays shorter than the 4/4 bars");
});

test("chart duration covers the full MIDI timeline, not just the selected track", function() {
  // tomorrow_never_knows.mid: the selected melodic track ends ~15s before the
  // full arrangement the backing player renders.
  var chart = {
    id: "dur_check", title: "Dur Check", artist: "x", bpm: 120, beatsPerBar: 4, offsetSec: 0,
    audio: { type: "midi", src: "content/songs/midi/tomorrow_never_knows.mid" },
    phrases: [],
    events: [{ id: 1, t: 0, dur: 2, type: "chord", chord: "C", notes: ["C"], laneLabel: "C", strum: "down" }]
  };
  var midi = fs.readFileSync(path.join(repo, "content", "songs", "midi", "tomorrow_never_knows.mid"));
  var result = generator.regenerateChart(chart, midi, io);
  var last = result.events[result.events.length - 1];
  assert.ok(last.t + last.dur > 195, "chart must reach the full arrangement's end (got " + (last.t + last.dur) + ")");
});

test("committed MIDI-backed charts carry real structure corpus-wide", function() {
  var chartsDir = path.join(repo, "data", "performance_charts");
  var files = fs.readdirSync(chartsDir).filter(function(f) { return f.slice(-5) === ".json"; });
  var regenerated = 0;
  files.forEach(function(f) {
    var chart = JSON.parse(fs.readFileSync(path.join(chartsDir, f), "utf8"));
    if (!chart.generated || chart.generated.by !== "scripts/generate-charts-from-midi.js") return;
    regenerated++;
    var last = chart.events[chart.events.length - 1];
    assert.ok(last.t + last.dur >= 60, f + ": regenerated charts must span at least a minute");
    var names = chart.phrases.map(function(p) { return p.name; });
    assert.ok(names.join(",").indexOf("Verse,Chorus,Outro") === -1, f + ": no tiled fictional phrase labels");
    assert.ok(chart.phrases.length >= 2, f + ": full songs need more than one section");
    var lastPhrase = chart.phrases[chart.phrases.length - 1];
    assert.ok(Math.abs(lastPhrase.endSec - (last.t + last.dur)) < 1, f + ": phrases must cover the event span");
  });
  assert.ok(regenerated >= 30, "the regenerated corpus must stay regenerated (found " + regenerated + ")");
});

console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
