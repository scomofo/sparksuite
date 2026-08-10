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

// Walk real bar boundaries in ticks across the tempo map until durationSec,
// honoring every time-signature change (a 1/4 pickup bar followed by 4/4 must
// not turn the whole song into beat-length bars). A signature change that
// lands mid-bar cuts the bar short at the change, matching notation practice.
// The chart-level beatsPerBar scalar is the song's dominant signature.
function buildBarGrid(tempoMap, ppq, timeSignatures, durationSec) {
  var sigs = (timeSignatures || []).slice().sort(function(a, b) { return a.tick - b.tick; });
  if (!sigs.length || sigs[0].tick > 0) sigs.unshift({ tick: 0, numerator: 4, denominator: 4 });

  var bars = [];
  var beatWeight = {};
  var tick = 0;
  var sigIdx = 0;
  var guard = 0;
  while (guard++ < 5000) {
    while (sigIdx + 1 < sigs.length && sigs[sigIdx + 1].tick <= tick) sigIdx++;
    var sig = sigs[sigIdx];
    var numerator = sig.numerator || 4;
    var denominator = sig.denominator || 4;
    var barTicks = Math.round(ppq * numerator * (4 / denominator));
    if (barTicks <= 0) barTicks = ppq * 4;
    var barEndTick = tick + barTicks;
    if (sigIdx + 1 < sigs.length && sigs[sigIdx + 1].tick > tick && sigs[sigIdx + 1].tick < barEndTick) {
      barEndTick = sigs[sigIdx + 1].tick;
    }
    var startSec = tempoMap.tickToSeconds(tick);
    if (startSec >= durationSec) break;
    var endSec = Math.min(tempoMap.tickToSeconds(barEndTick), durationSec);
    bars.push({ startSec: startSec, endSec: endSec });
    var quarterBeats = numerator * (4 / denominator);
    beatWeight[quarterBeats] = (beatWeight[quarterBeats] || 0) + (endSec - startSec);
    tick = barEndTick;
  }

  var dominantBeats = 4;
  var dominantWeight = -1;
  for (var key in beatWeight) {
    if (beatWeight[key] > dominantWeight) {
      dominantWeight = beatWeight[key];
      dominantBeats = Number(key);
    }
  }
  return { bars: bars, beatsPerBar: dominantBeats };
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function regenerateChart(chart, midiBuffer, io) {
  var parsed = io.fromMidiBuffer(midiBuffer, null, { title: chart.title });
  var tempoMap = parsed.tempoMap;
  // The backing player renders every MIDI track, but the parsed chart's
  // duration reflects only the selected track — take the later of the two so
  // chart, phrases, and playback share one endpoint.
  var fullTimelineSec = parsed.metadata && parsed.metadata.midiLastTickEnd
    ? tempoMap.tickToSeconds(parsed.metadata.midiLastTickEnd)
    : 0;
  var durationSec = Math.max(parsed.song.durationSec || 0, fullTimelineSec);
  if (!durationSec || durationSec < 30) return null;

  var ppq = tempoMap.ppq;
  var timeSignatures = (parsed.metadata && parsed.metadata.timeSignatures) || [];
  var grid = buildBarGrid(tempoMap, ppq, timeSignatures, durationSec);
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
