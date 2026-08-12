#!/usr/bin/env node
/*
 * Generate public-domain MIDI arrangements for the song corpus.
 *
 * Unlike the personal-use transcriptions in content/songs/midi/ (see that
 * directory's README), these files are ORIGINAL arrangements of
 * public-domain compositions, authored for SparkSuite and covered by the
 * repository's MIT license:
 *
 * - ode_to_joy.mid      "Ode to Joy" theme, Beethoven, Symphony No. 9
 *                       (1824). Composition in the public domain.
 * - amazing_grace.mid   "Amazing Grace" to the traditional NEW BRITAIN
 *                       tune (first published 1829, Columbian Harmony).
 *                       Composition in the public domain.
 *
 * Both are simple two-hand piano arrangements in C major, matching the
 * piano 30-day curriculum (melody right hand, root-note left hand).
 *
 * Regenerate with: node scripts/songs/generate_public_domain_midis.js
 */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..", "..");
var OUT_DIR = path.join(ROOT, "content", "songs", "midi");

var PPQ = 480;
var Q = PPQ;          // quarter
var E = PPQ / 2;      // eighth
var H = PPQ * 2;      // half
var DQ = Q + E;       // dotted quarter
var DH = H + Q;       // dotted half

// ── SMF byte-level writers ──

function vlq(value) {
  var bytes = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function str(text) {
  var out = [];
  for (var i = 0; i < text.length; i++) out.push(text.charCodeAt(i) & 0xff);
  return out;
}

function u32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function u16(value) {
  return [(value >>> 8) & 0xff, value & 0xff];
}

// events: [{tick, bytes:[...]}] — absolute ticks, converted to deltas here.
function trackChunk(events) {
  var sorted = events.slice().sort(function(a, b) { return a.tick - b.tick; });
  var data = [];
  var lastTick = 0;
  sorted.forEach(function(evt) {
    data = data.concat(vlq(evt.tick - lastTick), evt.bytes);
    lastTick = evt.tick;
  });
  data = data.concat(vlq(0), [0xff, 0x2f, 0x00]); // end of track
  return str("MTrk").concat(u32(data.length), data);
}

function tempoEvent(tick, bpm) {
  var usPerBeat = Math.round(60000000 / bpm);
  return { tick: tick, bytes: [0xff, 0x51, 0x03, (usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff] };
}

function timeSigEvent(tick, numerator, denominatorPow2) {
  return { tick: tick, bytes: [0xff, 0x58, 0x04, numerator, denominatorPow2, 24, 8] };
}

function trackNameEvent(tick, name) {
  return { tick: tick, bytes: [0xff, 0x03, name.length].concat(str(name)) };
}

// notes: [{tick, midi, dur, vel}] on a fixed channel.
function noteEvents(notes, channel, velocity) {
  var events = [];
  notes.forEach(function(note) {
    events.push({ tick: note.tick, bytes: [0x90 | channel, note.midi, note.vel || velocity] });
    events.push({ tick: note.tick + note.dur, bytes: [0x80 | channel, note.midi, 0x40] });
  });
  return events;
}

function writeSmf(fileName, bpm, timeSig, title, melodyNotes, bassNotes) {
  var conductor = trackChunk([
    trackNameEvent(0, title),
    tempoEvent(0, bpm),
    timeSigEvent(0, timeSig[0], Math.log2(timeSig[1]))
  ]);
  var melody = trackChunk([trackNameEvent(0, "Melody RH")].concat(noteEvents(melodyNotes, 0, 96)));
  var bass = trackChunk([trackNameEvent(0, "Bass LH")].concat(noteEvents(bassNotes, 1, 72)));

  var header = str("MThd").concat(u32(6), u16(1), u16(3), u16(PPQ));
  var bytes = header.concat(conductor, melody, bass);
  fs.writeFileSync(path.join(OUT_DIR, fileName), Buffer.from(bytes));
  console.log("wrote " + fileName + " (" + bytes.length + " bytes)");
}

// ── Note-name helper ──

var PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function n(name) {
  var letter = name[0];
  var octave = parseInt(name.slice(1), 10);
  return 12 * (octave + 1) + PITCH[letter];
}

// Builds a melody line from [name, durTicks] pairs laid end to end,
// with null entries as rests.
function line(startTick, steps) {
  var notes = [];
  var tick = startTick;
  steps.forEach(function(step) {
    if (step[0] !== null) notes.push({ tick: tick, midi: n(step[0]), dur: step[1] });
    tick += step[1];
  });
  return notes;
}

// ── Ode to Joy — Beethoven, Symphony No. 9 theme (public domain) ──
// C major, 4/4, 90 BPM. 16 bars: a a' b a'. Right hand fits the C
// five-finger position the piano curriculum teaches (C4–G4).

var odePhraseA = [
  ["E4", Q], ["E4", Q], ["F4", Q], ["G4", Q],
  ["G4", Q], ["F4", Q], ["E4", Q], ["D4", Q],
  ["C4", Q], ["C4", Q], ["D4", Q], ["E4", Q]
];
var odeEndingFirst = [["E4", DQ], ["D4", E], ["D4", H]];   // bars 4
var odeEndingSecond = [["D4", DQ], ["C4", E], ["C4", H]];  // bars 8, 16

var odeMelodySteps = []
  .concat(odePhraseA, odeEndingFirst)                       // bars 1-4
  .concat(odePhraseA, odeEndingSecond)                      // bars 5-8
  .concat([                                                 // bars 9-12
    ["D4", Q], ["D4", Q], ["E4", Q], ["C4", Q],
    ["D4", Q], ["E4", E], ["F4", E], ["E4", Q], ["C4", Q],
    ["D4", Q], ["E4", E], ["F4", E], ["E4", Q], ["D4", Q],
    ["C4", Q], ["D4", Q], ["G3", H]
  ])
  .concat(odePhraseA, odeEndingSecond);                     // bars 13-16

var odeBar = 4 * Q;
var odeBassRoots = ["C3", "G2", "C3", "G2", "C3", "G2", "C3", null,
                    "G2", "C3", "G2", null, "C3", "G2", "C3", null];
var odeBassNotes = [];
odeBassRoots.forEach(function(root, bar) {
  if (root) {
    odeBassNotes.push({ tick: bar * odeBar, midi: n(root), dur: 4 * Q });
  } else {
    // cadence bars (8, 12, 16): V–I half-note motion
    var first = bar === 11 ? "C3" : "G2";
    var second = bar === 11 ? "G2" : "C3";
    odeBassNotes.push({ tick: bar * odeBar, midi: n(first), dur: H });
    odeBassNotes.push({ tick: bar * odeBar + H, midi: n(second), dur: H });
  }
});

writeSmf("ode_to_joy.mid", 90, [4, 4], "Ode to Joy (Beethoven, public domain)",
  line(0, odeMelodySteps), odeBassNotes);

// ── Amazing Grace — NEW BRITAIN, traditional (public domain) ──
// C major, 3/4, 80 BPM. One-beat pickup, then 15 bars; melody spans
// G3–G4 with the traditional eighth-note ornaments on "ing"/"but".

var agMelodySteps = [
  [null, H], ["G3", Q],                       // pickup bar: rest, "A-"
  ["C4", H], ["E4", E], ["C4", E],            // 1  maz-ing
  ["E4", H], ["D4", Q],                       // 2  grace, how
  ["C4", H], ["A3", Q],                       // 3  sweet, the
  ["G3", H], ["G3", Q],                       // 4  sound, that
  ["C4", H], ["E4", E], ["C4", E],            // 5  saved a
  ["E4", H], ["D4", Q],                       // 6  wretch, like
  ["G4", DH],                                 // 7  me —
  ["G4", H], ["E4", Q],                       // 8  (me), I
  ["G4", H], ["E4", Q],                       // 9  once, was
  ["C4", H], ["G3", Q],                       // 10 lost, but
  ["A3", H], ["C4", Q],                       // 11 now, am
  ["C4", H], ["G3", Q],                       // 12 found, was
  ["C4", H], ["E4", E], ["C4", E],            // 13 blind, but
  ["E4", H], ["D4", Q],                       // 14 now, I
  ["C4", DH]                                  // 15 see
];

var agBar = 3 * Q;
var agBassRoots = [null, "C3", "G2", "F2", "C3", "C3", "G2", "C3",
                   "C3", "C3", "C3", "F2", "C3", "C3", "G2", "C3"];
var agBassNotes = [];
agBassRoots.forEach(function(root, bar) {
  if (root) agBassNotes.push({ tick: bar * agBar, midi: n(root), dur: DH });
});

writeSmf("amazing_grace.mid", 80, [3, 4], "Amazing Grace (NEW BRITAIN, public domain)",
  line(0, agMelodySteps), agBassNotes);
