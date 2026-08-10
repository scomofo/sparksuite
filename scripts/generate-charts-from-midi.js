#!/usr/bin/env node
// scripts/generate-charts-from-midi.js
// Regenerates performance charts from the real MIDI corpus.
//
// Run: npm run charts:generate-midi
//
// Before this script, every MIDI-backed chart was a hand-tiled 8-bar chord
// loop repeated 3x (~80s) with fictional Verse/Chorus/Outro phrase labels,
// unrelated to the song's real tempo, length, or bar grid — and misaligned
// with the MIDI backing audio. This script parses each song's MIDI file with
// the existing SparkChartIO parser and rebuilds the chart on the REAL grid:
//
// - bpm and bar boundaries come from the MIDI tempo map (tempo changes
//   respected bar by bar), beatsPerBar from the MIDI time signature
// - events span the song's real duration, one chord per bar (the learnable
//   density the charts already use), cycling the chart's authored chord
//   progression — voicings/lanes/strums are preserved from the source chart
// - phrases are honest fixed-length sections ("Section 1..N", 8 bars each);
//   MIDI markers are mostly metadata junk in this corpus, so no fake
//   Verse/Chorus labels are invented
// - because chart and backing audio now share the MIDI's tempo map, the
//   highway and the audio are aligned for the first time
//
// Known limitation (documented, not hidden): the chord progression still
// cycles uniformly across the whole song, so section-to-section harmony
// changes (verse vs chorus) are not captured — same as the charts always
// were, but now at real length and real timing. Fixing that needs per-song
// authoring in the editor.

var fs = require("fs");
var path = require("path");

var repoRoot = path.join(__dirname, "..");
var chartsDir = path.join(repoRoot, "data", "performance_charts");
var midiDir = path.join(repoRoot, "content", "songs", "midi");

global.window = global;
[
  "js/sparksuite/domain/types.js",
  "js/sparksuite/domain/tempo_map.js",
  "js/sparksuite/domain/note_event.js",
  "js/sparksuite/domain/phrase.js",
  "js/sparksuite/domain/chart.js",
  "js/sparksuite/core/chart_io.js"
].forEach(function(f) {
  global.eval(fs.readFileSync(path.join(repoRoot, f), "utf8"));
});

var SECTION_BARS = 8;

// Extract the authored chord cycle from a chart's events: the shortest
// leading period whose repetition reproduces the whole chord sequence.
function extractProgression(events) {
  var chords = events.map(function(e) { return e.chord || e.laneLabel || ""; });
  for (var period = 1; period <= chords.length; period++) {
    var matches = true;
    for (var i = 0; i < chords.length; i++) {
      if (chords[i] !== chords[i % period]) { matches = false; break; }
    }
    if (matches) return events.slice(0, period);
  }
  return events.slice();
}

// Walk real bar boundaries in ticks across the tempo map until durationSec.
function buildBarGrid(tempoMap, ppq, timeSignature, durationSec) {
  var numerator = timeSignature && timeSignature.numerator ? timeSignature.numerator : 4;
  var denominator = timeSignature && timeSignature.denominator ? timeSignature.denominator : 4;
  var barTicks = Math.round(ppq * numerator * (4 / denominator));
  if (barTicks <= 0) barTicks = ppq * 4;
  var bars = [];
  var tick = 0;
  var guard = 0;
  while (guard++ < 5000) {
    var startSec = tempoMap.tickToSeconds(tick);
    if (startSec >= durationSec) break;
    var endSec = Math.min(tempoMap.tickToSeconds(tick + barTicks), durationSec);
    bars.push({ startSec: startSec, endSec: endSec });
    tick += barTicks;
  }
  return { bars: bars, beatsPerBar: numerator * (4 / denominator) };
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function regenerateChart(chart, midiBuffer, io) {
  var parsed = io.fromMidiBuffer(midiBuffer, null, { title: chart.title });
  var durationSec = parsed.song.durationSec;
  if (!durationSec || durationSec < 30) return null;

  var tempoMap = parsed.tempoMap;
  var ppq = tempoMap.ppq;
  var timeSignatures = (parsed.metadata && parsed.metadata.timeSignatures) || [];
  var grid = buildBarGrid(tempoMap, ppq, timeSignatures[0], durationSec);
  if (grid.bars.length < 8) return null;

  var progression = extractProgression(chart.events || []);
  if (!progression.length) return null;

  var events = [];
  for (var b = 0; b < grid.bars.length; b++) {
    var bar = grid.bars[b];
    var source = progression[b % progression.length];
    events.push({
      id: b + 1,
      t: round3(bar.startSec),
      dur: round3(bar.endSec - bar.startSec),
      type: source.type || "chord",
      chord: source.chord,
      notes: source.notes,
      laneLabel: source.laneLabel || source.chord,
      strum: source.strum
    });
  }

  var phrases = [];
  for (var s = 0; s * SECTION_BARS < grid.bars.length; s++) {
    var firstBar = grid.bars[s * SECTION_BARS];
    var lastBar = grid.bars[Math.min((s + 1) * SECTION_BARS, grid.bars.length) - 1];
    phrases.push({
      id: s,
      name: "Section " + (s + 1),
      startSec: round3(firstBar.startSec),
      endSec: round3(lastBar.endSec)
    });
  }

  var initialBpm = tempoMap.segments && tempoMap.segments[0] ? tempoMap.segments[0].bpm : chart.bpm;

  return {
    id: chart.id,
    title: chart.title,
    artist: chart.artist,
    bpm: Math.round(initialBpm * 100) / 100,
    beatsPerBar: grid.beatsPerBar,
    offsetSec: chart.offsetSec || 0,
    audio: chart.audio,
    generated: {
      by: "scripts/generate-charts-from-midi.js",
      from: chart.audio && chart.audio.src ? chart.audio.src : null,
      tempoSegments: tempoMap.segments.length,
      progressionLength: progression.length
    },
    phrases: phrases,
    events: events
  };
}

function main() {
  var songs = JSON.parse(fs.readFileSync(path.join(repoRoot, "content", "songs", "index.json"), "utf8"));
  var io = new global.SparkChartIO();
  var regenerated = 0;
  var skipped = [];

  songs.forEach(function(song) {
    if (!song.midi || !song.chartId) return;
    var chartPath = path.join(chartsDir, song.chartId + ".json");
    var midiPath = path.join(repoRoot, song.midi);
    if (!fs.existsSync(chartPath) || !fs.existsSync(midiPath)) {
      skipped.push(song.id + " (missing chart or midi)");
      return;
    }
    var chart = JSON.parse(fs.readFileSync(chartPath, "utf8"));
    if (!chart.events || !chart.events.length || chart.events[0].type !== "chord") {
      skipped.push(song.id + " (non-chord chart, left untouched)");
      return;
    }
    var result;
    try {
      result = regenerateChart(chart, fs.readFileSync(midiPath), io);
    } catch (err) {
      skipped.push(song.id + " (midi parse failed: " + err.message + ")");
      return;
    }
    if (!result) {
      skipped.push(song.id + " (midi too short or bar grid unusable, left untouched)");
      return;
    }
    fs.writeFileSync(chartPath, JSON.stringify(result, null, 1) + "\n");
    regenerated++;
  });

  console.log("Regenerated " + regenerated + " charts from MIDI.");
  if (skipped.length) {
    console.log("Skipped " + skipped.length + ":");
    skipped.forEach(function(line) { console.log("  - " + line); });
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  extractProgression: extractProgression,
  buildBarGrid: buildBarGrid,
  regenerateChart: regenerateChart
};
