#!/usr/bin/env node
/* ===== Generate performance charts from SONGS data ===== */
/* Run: node scripts/generate-charts.js                     */

var fs = require("fs");
var path = require("path");

// ── Chord-to-pitch-class mapping ──
// Built from the CHORDS data + music theory for chords used in songs
var CHORD_NOTES = {
  // Level 1
  "Em":   ["E","G","B"],
  "Em7":  ["E","G","B","D"],
  // Level 2
  "E":    ["E","G#","B"],
  "Am":   ["A","C","E"],
  // Level 3
  "A":    ["A","C#","E"],
  "D":    ["D","F#","A"],
  // Level 4
  "G":    ["G","B","D"],
  "C":    ["C","E","G"],
  // Level 5
  "E7":   ["E","G#","B","D"],
  "A7":   ["A","C#","E","G"],
  "D7":   ["D","F#","A","C"],
  "B7":   ["B","D#","F#","A"],
  "Am7":  ["A","C","E","G"],
  "G7":   ["G","B","D","F"],
  "C7":   ["C","E","G","Bb"],
  "Dm7":  ["D","F","A","C"],
  // Level 6
  "Dm":   ["D","F","A"],
  "Cadd9":["C","E","G","D"],
  "Dsus2":["D","E","A"],
  "Dsus4":["D","G","A"],
  "Asus2":["A","B","E"],
  // Level 7
  "Fmaj7":["F","A","C","E"],
  "F":    ["F","A","C"],
  // Level 8
  "Bm":   ["B","D","F#"],
  "E5":   ["E","B"],
  "F#m":  ["F#","A","C#"],
  "A/C#": ["A","C#","E"],
  "D/F#": ["D","F#","A"],
  "Gm":   ["G","Bb","D"],
  "Cm":   ["C","Eb","G"]
};

// ── Song data (copied from data.js) ──
var SONGS = [
  {title:"Three Little Birds",artist:"Bob Marley",bpm:75,progression:["A","A","D","A","A","A","E","A"],pattern:["D","D","U","U","D","U"]},
  {title:"Horse With No Name",artist:"America",bpm:90,progression:["Em","Em","D","D","Em","Em","D","D"],pattern:["D","D","U","U","D","U"]},
  {title:"Knockin on Heavens Door",artist:"Bob Dylan",bpm:68,progression:["G","D","Am","Am","G","D","C","C"],pattern:["D","D","U","U","D","U"]},
  {title:"Wonderful Tonight",artist:"Eric Clapton",bpm:95,progression:["G","D","C","D","G","D","C","D"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Let It Be",artist:"The Beatles",bpm:72,progression:["C","G","Am","F","C","G","F","C"],pattern:["D","D","U","U","D","U"]},
  {title:"Wish You Were Here",artist:"Pink Floyd",bpm:62,progression:["Em","G","Em","G","Em","A","Em","A","G","C","D","Am","G","D","C","Am"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Love Me Do",artist:"The Beatles",bpm:148,progression:["G","G","C","G","G","G","C","G"],pattern:["D","D","U","U","D","U"]},
  {title:"Stand By Me",artist:"Ben E. King",bpm:118,progression:["A","A","D","E","A","A","D","E"],pattern:["D","D","U","U","D","U"]},
  {title:"Jambalaya",artist:"Hank Williams",bpm:120,progression:["A","A","D","D","A","A","E","A"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Achy Breaky Heart",artist:"Billy Ray Cyrus",bpm:120,progression:["A","A","E","E","E","E","A","A"],pattern:["D","D","U","U","D","U"]},
  {title:"Bad Moon Rising",artist:"CCR",bpm:176,progression:["D","D","A","G","D","D","A","G"],pattern:["D","D","U","U","D","U"]},
  {title:"Brown Eyed Girl",artist:"Van Morrison",bpm:150,progression:["G","C","G","D","G","C","G","D"],pattern:["D","D","U","U","D","U"]},
  {title:"Riptide",artist:"Vance Joy",bpm:102,progression:["Am","G","C","C","Am","G","C","C"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Leaving on a Jet Plane",artist:"John Denver",bpm:136,progression:["G","C","G","C","G","C","D","D"],pattern:["D","D","U","U","D","U"]},
  {title:"Hey Soul Sister",artist:"Train",bpm:97,progression:["G","D","Em","C","G","D","Em","C"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Have You Ever Seen the Rain",artist:"CCR",bpm:116,progression:["Am","F","C","G","Am","F","C","C"],pattern:["D","D","U","U","D","U"]},
  {title:"Hotel California",artist:"Eagles",bpm:74,progression:["Am","Am","E","E","G","G","D","D","F","F","C","C","Dm","Dm","E","E"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Creep",artist:"Radiohead",bpm:92,progression:["G","G","B7","B7","C","C","Cm","Cm"],pattern:["D","D","U","U","D","U"]},
  {title:"Hallelujah",artist:"Leonard Cohen",bpm:56,progression:["C","Am","C","Am","F","G","C","G"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Tears in Heaven",artist:"Eric Clapton",bpm:80,progression:["A","E","F#m","A/C#","D","E7","A","A"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Tomorrow Never Knows",artist:"The Beatles",bpm:125,progression:["C","C","C","C","C","C","C","C"],pattern:["D","D","U","U","D","U"]},
  {title:"Smokestack Lightning",artist:"Howlin' Wolf",bpm:130,progression:["E","E","E","E","E","E","E","E"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Coconut",artist:"Harry Nilsson",bpm:118,progression:["C7","C7","C7","C7","C7","C7","C7","C7"],pattern:["D","D","U","U","D","U"]},
  {title:"Run Through the Jungle",artist:"CCR",bpm:130,progression:["Dm","Dm","Dm","Dm","Dm","Dm","Dm","Dm"],pattern:["D","D","U","U","D","U"]},
  {title:"Get the Party Started",artist:"P!nk",bpm:130,progression:["Bm","Bm","Bm","Bm","Bm","Bm","Bm","Bm"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"The Beat Goes On",artist:"Sonny & Cher",bpm:130,progression:["Em","Em","Em","Em","Em","Em","Em","Em"],pattern:["D","D","U","U","D","U"]},
  {title:"Peter Gunn",artist:"Duane Eddy",bpm:130,progression:["E","E","E","E","E","E","E","E"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Mannish Boy",artist:"Muddy Waters",bpm:80,progression:["E","E","E","E","E","E","E","E"],pattern:["D","D","U","U","D","U"]},
  {title:"Boom Boom",artist:"John Lee Hooker",bpm:135,progression:["E","E","E","E","E","E","E","E"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Within You Without You",artist:"The Beatles",bpm:110,progression:["C","C","C","C","C","C","C","C"],pattern:["D","D","U","U","D","U"]},
  {title:"Who is He",artist:"Bill Withers",bpm:105,progression:["Em","Em","Em","Em","Em","Em","Em","Em"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Jump into the Fire",artist:"Harry Nilsson",bpm:135,progression:["E","E","E","E","E","E","E","E"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Fever",artist:"Peggy Lee",bpm:115,progression:["Am","Am","Am","Am","Am","Am","Am","Am"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Its All Good",artist:"Bob Dylan",bpm:100,progression:["Gm","Gm","Gm","Gm","Gm","Gm","Gm","Gm"],pattern:["D","D","U","U","D","U"]},
  {title:"Shakedown Street",artist:"Grateful Dead",bpm:110,progression:["A","A","A","A","A","A","A","A"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Eleanor Rigby",artist:"The Beatles",bpm:138,progression:["Em","Em","C","C","Em","Em","C","Em"],pattern:["D","D","U","U","D","U"]},
  {title:"Royals",artist:"Lorde",bpm:85,progression:["C","C","D","D","C","C","D","D"],pattern:["D","D","U","U","D","U"]},
  {title:"What I Got",artist:"Sublime",bpm:94,progression:["D","D","G","G","D","D","G","G"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Whole Lotta Love",artist:"Led Zeppelin",bpm:92,progression:["E","E","A","A","E","E","A","E"],pattern:["D","D","U","U","D","U"]},
  {title:"Ill Take You There",artist:"The Staple Singers",bpm:108,progression:["C","C","F","F","C","C","F","C"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Moves Like Jagger",artist:"Maroon 5",bpm:128,progression:["Em","Em","Bm","Bm","Em","Em","Bm","Bm"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Dreams",artist:"Fleetwood Mac",bpm:120,progression:["Fmaj7","Fmaj7","G","G","Fmaj7","Fmaj7","G","G"],pattern:["D","D","U","U","D","U"]},
  {title:"Do I Wanna Know",artist:"Arctic Monkeys",bpm:85,progression:["Gm","Gm","Cm","Cm","Gm","Gm","Cm","Cm"],pattern:["D","x","D","U","x","U","D","U"]},
  {title:"Chain of Fools",artist:"Aretha Franklin",bpm:112,progression:["Cm","Cm","Cm","Cm","Cm","Cm","Cm","Cm"],pattern:["D","U","D","U","D","U","D","U"]},
  {title:"Get Up Stand Up",artist:"Bob Marley",bpm:100,progression:["Cm","Cm","Cm","Cm","Cm","Cm","Cm","Cm"],pattern:["D","x","U","x","U","D","x","U"]},
  {title:"Music",artist:"Madonna",bpm:120,progression:["Gm","Gm","Gm","Gm","Gm","Gm","Gm","Gm"],pattern:["D","x","D","U","x","U","D","U"]}
];

// ── Helpers ──

function toChartId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function getNotesForChord(chordName) {
  if (CHORD_NOTES[chordName]) return CHORD_NOTES[chordName];
  // Fallback: try root note only
  var root = chordName.replace(/[^A-G#b]/g, "");
  return root ? [root] : ["?"];
}

function getStrumDir(pattern, idx) {
  if (!pattern || !pattern.length) return "down";
  var p = pattern[idx % pattern.length];
  if (p === "U") return "up";
  return "down";
}

function buildChart(song) {
  var id = toChartId(song.title) + "_chords";
  var bpm = song.bpm;
  var beatsPerBar = 4;
  var secPerBeat = 60 / bpm;
  var secPerChord = secPerBeat * beatsPerBar; // 1 bar per chord in progression

  var progression = song.progression;
  // Repeat progression 3x to make a reasonable-length chart (~24-48 bars)
  var repeats = 3;
  var fullProg = [];
  for (var r = 0; r < repeats; r++) {
    for (var p = 0; p < progression.length; p++) {
      fullProg.push(progression[p]);
    }
  }

  // Build events
  var events = [];
  for (var i = 0; i < fullProg.length; i++) {
    var chord = fullProg[i];
    var t = i * secPerChord;
    events.push({
      id: i + 1,
      t: Math.round(t * 1000) / 1000,
      dur: Math.round(secPerChord * 1000) / 1000,
      type: "chord",
      chord: chord,
      notes: getNotesForChord(chord),
      laneLabel: chord,
      strum: getStrumDir(song.pattern, i)
    });
  }

  // Build phrases (one phrase per repeat of the progression)
  var phrases = [];
  for (var ri = 0; ri < repeats; ri++) {
    var startSec = ri * progression.length * secPerChord;
    var endSec = (ri + 1) * progression.length * secPerChord;
    var label = ri === 0 ? "Verse" : ri === 1 ? "Chorus" : "Outro";
    phrases.push({
      id: ri,
      name: label,
      startSec: Math.round(startSec * 1000) / 1000,
      endSec: Math.round(endSec * 1000) / 1000
    });
  }

  return {
    id: id,
    title: song.title,
    artist: song.artist,
    bpm: bpm,
    beatsPerBar: beatsPerBar,
    offsetSec: 0,
    audio: { type: "silent" },
    phrases: phrases,
    events: events
  };
}

// ── Generate all charts ──

var outDir = path.join(__dirname, "..", "data", "performance_charts");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

var generated = 0;
var skipped = 0;

for (var s = 0; s < SONGS.length; s++) {
  var song = SONGS[s];
  if (!song.progression || !song.progression.length) {
    console.log("SKIP (no progression): " + song.title);
    skipped++;
    continue;
  }

  var chart = buildChart(song);
  var filename = toChartId(song.title) + "_chords.json";
  var filepath = path.join(outDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(chart, null, 2) + "\n");
  generated++;
  console.log("OK: " + filename + " (" + chart.events.length + " events, " + chart.phrases.length + " phrases)");
}

console.log("\nDone: " + generated + " charts generated, " + skipped + " skipped.");
console.log("Output: " + outDir);
