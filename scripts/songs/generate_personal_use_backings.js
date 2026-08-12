#!/usr/bin/env node
/*
 * Generate chords-only backing MIDIs for curriculum songs whose
 * compositions are still under copyright:
 *
 * - mad_world.mid            "Mad World" (Tears for Fears, 1982),
 *                            transposed to D minor for the guitar
 *                            curriculum's Dm lesson.
 * - you_are_my_sunshine.mid  "You Are My Sunshine" (1940; US copyright
 *                            runs to 2036), in C for the ukulele
 *                            curriculum's C-F-G7 lessons.
 *
 * These sit under the same personal-use carve-out as the rest of
 * content/songs/midi/ (see that directory's README and the LICENSE
 * exclusion): personal practice only, excluded from packaged builds,
 * not for redistribution. They are deliberately CHORDS-ONLY — block
 * triads over root notes, no melody — so they carry the songs' harmonic
 * skeleton for backing playback and chart-timing generation without the
 * transcribed melodic expression the full corpus files contain.
 *
 * Regenerate with: node scripts/songs/generate_personal_use_backings.js
 */

var path = require("path");
var smf = require("./smf_writer");

var ROOT = path.resolve(__dirname, "..", "..");
var OUT_DIR = path.join(ROOT, "content", "songs", "midi");

var PPQ = smf.PPQ;
var Q = PPQ;
var H = PPQ * 2;
var W = PPQ * 4;
var n = smf.n;

var VOICINGS = {
  Dm: ["A3", "D4", "F4"],
  F:  ["A3", "C4", "F4"],
  C:  ["G3", "C4", "E4"],
  G:  ["G3", "B3", "D4"],
  G7: ["G3", "B3", "D4", "F4"]
};

var ROOTS = { Dm: "D3", F: "F2", C: "C3", G: "G2", G7: "G2" };

// One chord symbol per 4/4 bar: block triad as two half notes over a
// whole-note root.
function chordBackingTracks(bars) {
  var chordNotes = [];
  var bassNotes = [];
  bars.forEach(function(symbol, bar) {
    var barTick = bar * W;
    VOICINGS[symbol].forEach(function(name) {
      chordNotes.push({ tick: barTick, midi: n(name), dur: H });
      chordNotes.push({ tick: barTick + H, midi: n(name), dur: H });
    });
    bassNotes.push({ tick: barTick, midi: n(ROOTS[symbol]), dur: W });
  });
  return [
    { name: "Chords", notes: chordNotes, channel: 0, velocity: 84 },
    { name: "Bass Roots", notes: bassNotes, channel: 1, velocity: 72 }
  ];
}

function write(fileName, bpm, title, bars) {
  var size = smf.writeSmf(path.join(OUT_DIR, fileName), bpm, [4, 4], title, chordBackingTracks(bars));
  console.log("wrote " + fileName + " (" + size + " bytes)");
}

// "Mad World" — the song's i-III-VII-IV loop, in D minor (Dm F C G).
var madWorldBars = [];
for (var i = 0; i < 4; i++) madWorldBars.push("Dm", "F", "C", "G");
write("mad_world.mid", 88, "Mad World (chords-only backing, personal use)", madWorldBars);

// "You Are My Sunshine" — standard 16-bar verse shape in C.
write("you_are_my_sunshine.mid", 100, "You Are My Sunshine (chords-only backing, personal use)",
  ["C", "C", "C", "C", "F", "F", "C", "C", "F", "F", "C", "C", "C", "G7", "C", "C"]);
