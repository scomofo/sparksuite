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

var path = require("path");
var smf = require("./smf_writer");

var ROOT = path.resolve(__dirname, "..", "..");
var OUT_DIR = path.join(ROOT, "content", "songs", "midi");

var PPQ = smf.PPQ;
var Q = PPQ;          // quarter
var E = PPQ / 2;      // eighth
var H = PPQ * 2;      // half
var DQ = Q + E;       // dotted quarter
var DH = H + Q;       // dotted half
var n = smf.n;
var line = smf.line;

function write(fileName, bpm, timeSig, title, melodyNotes, bassNotes) {
  var size = smf.writeSmf(path.join(OUT_DIR, fileName), bpm, timeSig, title, [
    { name: "Melody RH", notes: melodyNotes, channel: 0, velocity: 96 },
    { name: "Bass LH", notes: bassNotes, channel: 1, velocity: 72 }
  ]);
  console.log("wrote " + fileName + " (" + size + " bytes)");
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

write("ode_to_joy.mid", 90, [4, 4], "Ode to Joy (Beethoven, public domain)",
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

write("amazing_grace.mid", 80, [3, 4], "Amazing Grace (NEW BRITAIN, public domain)",
  line(0, agMelodySteps), agBassNotes);
