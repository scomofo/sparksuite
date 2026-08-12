/* ───────── PianoSpark – data.js (instrument module) ───────── */
/* Complete rebuild: 8-level curriculum, 50 sessions, LH patterns, reward engine */
/* Wrapped in IIFE to prevent global conflicts with ChordSpark data */
(function() {

// Piano-specific screen & tab constants (namespaced to avoid clobbering shared SCR/TAB)
var PIANO_SCR = { HOME: 0, SESSION: 1, ONBOARDING: 2, STEM_PLAYER: 3, PERFORM: 4, PERFORM_DONE: 5, PERFORM_SONG: 6, PLAN: 7, MIDI_SETTINGS: 8, MIDI_IMPORT: 9, CLOUD_SETTINGS: 10, CALIBRATION: 11, CURRICULUM: 12, RECOMMENDATIONS: 13, CAREER: 14, INSIGHTS: 15, CHALLENGES: 16, HOME_DASH: 17, ONBOARDING_FLOW: 18, SETTINGS: 19 };
var PIANO_APP_NAME = "PianoSpark";
var PIANO_TAB = {
  PRACTICE: 0, GAMES: 1, SONGS: 2, TOOLS: 3
};

// Note helpers
var NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var FLAT_NAMES = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

function midiToNote(m) { return NOTE_NAMES[((m % 12) + 12) % 12]; }
function midiToOctave(m) { return Math.floor(m / 12) - 1; }
// midiToFreq respects S.a4Tuning (default 440 Hz) for pitch calibration
function midiToFreq(m) {
  var a4 = (typeof S !== "undefined" && S.a4Tuning) ? S.a4Tuning : 440;
  return a4 * Math.pow(2, (m - 69) / 12);
}
function noteToMidi(name, octave) {
  var i = NOTE_NAMES.indexOf(name);
  if (i < 0) i = FLAT_NAMES.indexOf(name);
  if (i < 0) return -1;
  return (octave + 1) * 12 + i;
}

// ── Level colors & names ──
var LC = {
  1: "#22c55e", 2: "#3b82f6", 3: "#f97316", 4: "#ef4444",
  5: "#8b5cf6", 6: "#ec4899", 7: "#14b8a6", 8: "#7c3aed"
};
var LN = {
  1: "White Keys Only", 2: "The Neighbor Chords", 3: "The Emotional Turn",
  4: "Complete Key of C", 5: "Key of G", 6: "Key of F",
  7: "Color Chords", 8: "Graduation"
};

// ── Chord type colors ──
var CHORD_COLORS = {
  major: "#2196F3", minor: "#9C27B0", dom7: "#FF9800",
  maj7: "#009688", dim: "#F44336", sus: "#4CAF50",
  min7: "#E040FB", aug: "#FF5722"
};

// ── CURRICULUM array (8 levels) ──
var CURRICULUM = [
  { num:1, title:"White Keys Only", sub:"Hello, Piano", icon:"\u{1F3B9}",
    sessions:"1-3", chords:["C"],
    desc:"Meet middle C. One chord, one shape, one sound.",
    tip:"Master the drop-and-find motion before adding chords.",
    songs:["Row Row Row Your Boat","Twinkle Twinkle"],
    lhPattern:"R1",
    transitions:[] },
  { num:2, title:"The Neighbor Chords", sub:"Smooth Slides", icon:"\u{1F3E0}",
    sessions:"4-8", chords:["F/inv2","G/inv1"],
    desc:"Your hand barely moves. Two fingers shift one key each.",
    tip:"Voice-led inversions keep movement minimal.",
    songs:["La Bamba","Happy Birthday"],
    lhPattern:"R1",
    transitions:[
      {a:"C",b:"F",difficulty:1,anchor:"Thumb stays on C"},
      {a:"F",b:"G",difficulty:1,anchor:"All fingers step down one key"},
      {a:"G",b:"C",difficulty:1,anchor:"Reverse of C to G"},
      {a:"C",b:"G",difficulty:1,anchor:"Thumb drops to B, shift down"}
    ] },
  { num:3, title:"The Emotional Turn", sub:"Major Meets Minor", icon:"\u{1F3AD}",
    sessions:"9-14", chords:["Am","Em"],
    desc:"One finger changes everything. Major becomes minor.",
    tip:"C and Am share two notes. Feel the emotional shift.",
    songs:["Let It Be","Stand By Me"],
    lhPattern:"R2",
    transitions:[
      {a:"C",b:"Am",difficulty:1,anchor:"C and E stay, G moves to A"},
      {a:"Am",b:"Em",difficulty:1,anchor:"Share E, step A\u2192G and C\u2192B"},
      {a:"Am",b:"F",difficulty:2,anchor:"Shift down to F position"},
      {a:"C",b:"Em",difficulty:2,anchor:"Drop to E minor shape"}
    ] },
  { num:4, title:"Complete Key of C", sub:"The Full Palette", icon:"\u{1F3A8}",
    sessions:"15-20", chords:["Dm","G7"],
    desc:"All seven chords in the key of C. ii-V-I is your new superpower.",
    tip:"Dm\u2192G7\u2192C is the most important progression in Western music.",
    songs:["Hallelujah","Autumn Leaves","Piano Man"],
    lhPattern:"R3",
    transitions:[
      {a:"Am",b:"Dm",difficulty:1,anchor:"A stays, C\u2192D and E\u2192F"},
      {a:"Dm",b:"G7",difficulty:2,anchor:"Shift to G7 shape"},
      {a:"G7",b:"C",difficulty:1,anchor:"F pulls to E, resolves to C"}
    ] },
  { num:5, title:"Key of G", sub:"First Black Keys", icon:"\u{2B50}",
    sessions:"21-28", chords:["D","Bm","Em7"],
    desc:"F# enters the picture. Your first black key adventure.",
    tip:"Drop BPM by 10 when adding black keys. Build back up.",
    songs:["Wonderwall","Country Roads","Perfect"],
    lhPattern:"R4",
    transitions:[
      {a:"G",b:"D",difficulty:2,anchor:"Move to D shape, F# is the new note"},
      {a:"D",b:"Bm",difficulty:2,anchor:"D to B minor, share D"},
      {a:"Em",b:"D",difficulty:1,anchor:"Step up from Em to D"}
    ] },
  { num:6, title:"Key of F", sub:"The Flat Side", icon:"\u{1F30A}",
    sessions:"29-34", chords:["Bb","Gm","Dm7"],
    desc:"Bb introduces the world of flats. Smooth jazz territory.",
    tip:"Bb major uses the same shape as other majors \u2014 just shifted.",
    songs:["Lean on Me","Can't Help Falling in Love"],
    lhPattern:"R5",
    transitions:[
      {a:"F",b:"Bb",difficulty:2,anchor:"Move to Bb shape"},
      {a:"Bb",b:"Gm",difficulty:2,anchor:"Bb to G minor"},
      {a:"Gm",b:"Dm",difficulty:1,anchor:"Minor to minor, step down"}
    ] },
  { num:7, title:"Color Chords", sub:"Beyond Triads", icon:"\u{1F308}",
    sessions:"35-42", chords:["Cmaj7","Fmaj7","Am7"],
    desc:"Add the 7th and everything gets dreamy.",
    tip:"Maj7 chords add one note to what you already know.",
    songs:["Imagine","Fly Me to the Moon"],
    lhPattern:"R6",
    transitions:[
      {a:"C",b:"Cmaj7",difficulty:1,anchor:"Just add B to C major"},
      {a:"F",b:"Fmaj7",difficulty:1,anchor:"Just add E to F major"},
      {a:"Am",b:"Am7",difficulty:1,anchor:"Just add G to A minor"}
    ] },
  { num:8, title:"Graduation", sub:"Performance Ready", icon:"\u{1F393}",
    sessions:"43-50", chords:["Eb","Fm","C7","Dm7b5"],
    desc:"New keys, substitutions, and real arrangements.",
    tip:"You can now play hundreds of songs. Go explore!",
    songs:["Bohemian Rhapsody","Moonlight Sonata","Prelude in C"],
    lhPattern:"R7",
    transitions:[
      {a:"C",b:"Eb",difficulty:3,anchor:"Shift to Eb, two flats"},
      {a:"Eb",b:"Fm",difficulty:2,anchor:"Step up to F minor"}
    ] }
];

// ── CHORDS restructured with inversions + voice-leading ──
var CHORDS = {
  "C": {
    name:"C Major", short:"C", type:"major", level:1,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["C4","E4","G4"], midi:[60,64,67],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["E4","G4","C5"], midi:[64,67,72],
                      fingers_rh:[1,2,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["G3","C4","E4"], midi:[55,60,64],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"C3", bassMidi:48,
    voiceLeadTo: {
      "F": { inversion:"second", shared:["C4"], movement:"E4\u2192F4, G4\u2192A4" },
      "Am": { inversion:"root", shared:["C4","E4"], movement:"G4\u2192A4" },
      "G": { inversion:"first", shared:[], movement:"C4\u2192B3, E4\u2192D4" },
      "Em": { inversion:"root", shared:["E4","G4"], movement:"C4\u2192B3" }
    }
  },
  "F": {
    name:"F Major", short:"F", type:"major", level:2,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["F4","A4","C5"], midi:[65,69,72],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["A3","C4","F4"], midi:[57,60,65],
                      fingers_rh:[1,2,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["C4","F4","A4"], midi:[60,65,69],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"F2", bassMidi:41,
    voiceLeadTo: {
      "C": { inversion:"root", shared:["C4"], movement:"F4\u2192E4, A4\u2192G4" },
      "G": { inversion:"first", shared:[], movement:"C4\u2192B3, F4\u2192D4, A4\u2192G4" },
      "Am": { inversion:"root", shared:["A4"], movement:"C4\u2192C4, F4\u2192E4" }
    }
  },
  "G": {
    name:"G Major", short:"G", type:"major", level:2,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["G4","B4","D5"], midi:[67,71,74],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["B3","D4","G4"], midi:[59,62,67],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["D4","G4","B4"], midi:[62,67,71],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"G2", bassMidi:43,
    voiceLeadTo: {
      "C": { inversion:"root", shared:[], movement:"B3\u2192C4, D4\u2192E4, G4\u2192G4" },
      "Am": { inversion:"root", shared:[], movement:"B3\u2192A3, D4\u2192C4, G4\u2192E4" },
      "Em": { inversion:"root", shared:["G4","B4"], movement:"D4\u2192E4" }
    }
  },
  "Am": {
    name:"A Minor", short:"Am", type:"minor", level:3,
    color: CHORD_COLORS.minor,
    rootPosition: { notes:["A3","C4","E4"], midi:[57,60,64],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["C4","E4","A4"], midi:[60,64,69],
                      fingers_rh:[1,2,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["E4","A4","C5"], midi:[64,69,72],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"A2", bassMidi:45,
    voiceLeadTo: {
      "C": { inversion:"root", shared:["C4","E4"], movement:"A3\u2192G4" },
      "Em": { inversion:"root", shared:["E4"], movement:"A3\u2192G3, C4\u2192B3" },
      "Dm": { inversion:"root", shared:["A3"], movement:"C4\u2192D4, E4\u2192F4" },
      "F": { inversion:"second", shared:["C4"], movement:"A3\u2192A4, E4\u2192F4" }
    }
  },
  "Em": {
    name:"E Minor", short:"Em", type:"minor", level:3,
    color: CHORD_COLORS.minor,
    rootPosition: { notes:["E4","G4","B4"], midi:[64,67,71],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["G3","B3","E4"], midi:[55,59,64],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["B3","E4","G4"], midi:[59,64,67],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"E3", bassMidi:52,
    voiceLeadTo: {
      "Am": { inversion:"root", shared:["E4"], movement:"G4\u2192A4, B4\u2192C5" },
      "C": { inversion:"root", shared:["E4","G4"], movement:"B4\u2192C5" }
    }
  },
  "Dm": {
    name:"D Minor", short:"Dm", type:"minor", level:4,
    color: CHORD_COLORS.minor,
    rootPosition: { notes:["D4","F4","A4"], midi:[62,65,69],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["F4","A4","D5"], midi:[65,69,74],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["A3","D4","F4"], midi:[57,62,65],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"D3", bassMidi:50,
    voiceLeadTo: {
      "G7": { inversion:"root", shared:[], movement:"D4\u2192D4, F4\u2192F4, A4\u2192G4" },
      "Am": { inversion:"root", shared:["A4"], movement:"D4\u2192C4, F4\u2192E4" }
    }
  },
  "G7": {
    name:"G Dominant 7th", short:"G7", type:"dom7", level:4,
    color: CHORD_COLORS.dom7,
    rootPosition: { notes:["G3","B3","D4","F4"], midi:[55,59,62,65],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["B3","D4","F4","G4"], midi:[59,62,65,67],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["D4","F4","G4","B4"], midi:[62,65,67,71],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"G2", bassMidi:43,
    voiceLeadTo: {
      "C": { inversion:"root", shared:[], movement:"B3\u2192C4, D4\u2192E4, F4\u2192E4, G3\u2192G4" }
    }
  },
  "D": {
    name:"D Major", short:"D", type:"major", level:5,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["D4","F#4","A4"], midi:[62,66,69],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["F#4","A4","D5"], midi:[66,69,74],
                      fingers_rh:[1,2,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["A3","D4","F#4"], midi:[57,62,66],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"D3", bassMidi:50,
    voiceLeadTo: {
      "G": { inversion:"root", shared:["D4"], movement:"F#4\u2192G4, A4\u2192B4" },
      "Bm": { inversion:"root", shared:["D4","F#4"], movement:"A4\u2192B4" }
    }
  },
  "Bm": {
    name:"B Minor", short:"Bm", type:"minor", level:5,
    color: CHORD_COLORS.minor,
    rootPosition: { notes:["B3","D4","F#4"], midi:[59,62,66],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["D4","F#4","B4"], midi:[62,66,71],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["F#3","B3","D4"], midi:[54,59,62],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"B2", bassMidi:47,
    voiceLeadTo: {
      "Em": { inversion:"root", shared:["B3"], movement:"D4\u2192E4, F#4\u2192G4" },
      "D": { inversion:"root", shared:["D4","F#4"], movement:"B3\u2192A3" }
    }
  },
  "Em7": {
    name:"E Minor 7th", short:"Em7", type:"min7", level:5,
    color: CHORD_COLORS.min7,
    rootPosition: { notes:["E4","G4","B4","D5"], midi:[64,67,71,74],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["G3","B3","D4","E4"], midi:[55,59,62,64],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["B3","D4","E4","G4"], midi:[59,62,64,67],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"E3", bassMidi:52,
    voiceLeadTo: {
      "Am": { inversion:"root", shared:["E4"], movement:"G4\u2192A4, B4\u2192C5, D5\u2192C5" }
    }
  },
  "Bb": {
    name:"B Flat Major", short:"Bb", type:"major", level:6,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["Bb3","D4","F4"], midi:[58,62,65],
                    fingers_rh:[2,4,5], fingers_lh:[3,2,1] },
    firstInversion: { notes:["D4","F4","Bb4"], midi:[62,65,70],
                      fingers_rh:[1,2,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["F3","Bb3","D4"], midi:[53,58,62],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"Bb2", bassMidi:46,
    voiceLeadTo: {
      "F": { inversion:"root", shared:["F4"], movement:"Bb3\u2192A3, D4\u2192C4" },
      "Gm": { inversion:"root", shared:["Bb3","D4"], movement:"F4\u2192G4" }
    }
  },
  "Gm": {
    name:"G Minor", short:"Gm", type:"minor", level:6,
    color: CHORD_COLORS.minor,
    rootPosition: { notes:["G3","Bb3","D4"], midi:[55,58,62],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["Bb3","D4","G4"], midi:[58,62,67],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["D4","G4","Bb4"], midi:[62,67,70],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"G2", bassMidi:43,
    voiceLeadTo: {
      "Dm": { inversion:"root", shared:["D4"], movement:"G3\u2192A3, Bb3\u2192A3" },
      "Bb": { inversion:"root", shared:["Bb3","D4"], movement:"G3\u2192F3" }
    }
  },
  "Dm7": {
    name:"D Minor 7th", short:"Dm7", type:"min7", level:6,
    color: CHORD_COLORS.min7,
    rootPosition: { notes:["D4","F4","A4","C5"], midi:[62,65,69,72],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["F4","A4","C5","D5"], midi:[65,69,72,74],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["A3","C4","D4","F4"], midi:[57,60,62,65],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"D3", bassMidi:50,
    voiceLeadTo: {
      "G7": { inversion:"root", shared:["D4","F4"], movement:"A4\u2192G4, C5\u2192B4" }
    }
  },
  "Dm7b5": {
    name:"D Half-Diminished 7th", short:"Dm7b5", type:"dim", level:8,
    color: CHORD_COLORS.dim,
    rootPosition: { notes:["D4","F4","Ab4","C5"], midi:[62,65,68,72],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["F4","Ab4","C5","D5"], midi:[65,68,72,74],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["Ab3","C4","D4","F4"], midi:[56,60,62,65],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"D3", bassMidi:50,
    voiceLeadTo: {
      "G7": { inversion:"root", shared:["D4","F4"], movement:"Ab4\u2192G4, C5\u2192B4" }
    }
  },
  "Cmaj7": {
    name:"C Major 7th", short:"Cmaj7", type:"maj7", level:7,
    color: CHORD_COLORS.maj7,
    rootPosition: { notes:["C4","E4","G4","B4"], midi:[60,64,67,71],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["E4","G4","B4","C5"], midi:[64,67,71,72],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["G3","B3","C4","E4"], midi:[55,59,60,64],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"C3", bassMidi:48,
    voiceLeadTo: {
      "Fmaj7": { inversion:"root", shared:["C4","E4"], movement:"G4\u2192A4, B4\u2192A4" }
    }
  },
  "Fmaj7": {
    name:"F Major 7th", short:"Fmaj7", type:"maj7", level:7,
    color: CHORD_COLORS.maj7,
    rootPosition: { notes:["F4","A4","C5","E5"], midi:[65,69,72,76],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["A3","C4","E4","F4"], midi:[57,60,64,65],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["C4","E4","F4","A4"], midi:[60,64,65,69],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"F2", bassMidi:41,
    voiceLeadTo: {
      "Em7": { inversion:"root", shared:["E4"], movement:"F4\u2192E4, A4\u2192G4, C5\u2192B4" }
    }
  },
  "Am7": {
    name:"A Minor 7th", short:"Am7", type:"min7", level:7,
    color: CHORD_COLORS.min7,
    rootPosition: { notes:["A3","C4","E4","G4"], midi:[57,60,64,67],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["C4","E4","G4","A4"], midi:[60,64,67,69],
                      fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["E4","G4","A4","C5"], midi:[64,67,69,72],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"A2", bassMidi:45,
    voiceLeadTo: {
      "Dm7": { inversion:"root", shared:["A3","C4"], movement:"E4\u2192D4, G4\u2192F4" }
    }
  },
  "Eb": {
    name:"E Flat Major", short:"Eb", type:"major", level:8,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["Eb4","G4","Bb4"], midi:[63,67,70],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["G3","Bb3","Eb4"], midi:[55,58,63],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["Bb3","Eb4","G4"], midi:[58,63,67],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"Eb3", bassMidi:51,
    voiceLeadTo: {
      "Bb": { inversion:"root", shared:["Bb3"], movement:"Eb4\u2192D4, G4\u2192F4" },
      "Fm": { inversion:"root", shared:[], movement:"Eb4\u2192F4, G4\u2192Ab4, Bb4\u2192C5" }
    }
  },
  "Fm": {
    name:"F Minor", short:"Fm", type:"minor", level:8,
    color: CHORD_COLORS.minor,
    rootPosition: { notes:["F4","Ab4","C5"], midi:[65,68,72],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["Ab3","C4","F4"], midi:[56,60,65],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["C4","F4","Ab4"], midi:[60,65,68],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"F2", bassMidi:41,
    voiceLeadTo: {
      "Eb": { inversion:"root", shared:[], movement:"F4\u2192Eb4, Ab4\u2192G4, C5\u2192Bb4" }
    }
  },
  "C7": {
    name:"C Dominant 7th", short:"C7", type:"dom7", level:8,
    color: CHORD_COLORS.dom7,
    rootPosition: { notes:["C4","E4","G4","Bb4"], midi:[60,64,67,70],
                    fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    firstInversion: { notes:["E4","G4","Bb4","C5"], midi:[64,67,70,72],
                      fingers_rh:[1,2,4,5], fingers_lh:[5,3,2,1] },
    secondInversion: { notes:["G3","Bb3","C4","E4"], midi:[55,58,60,64],
                       fingers_rh:[1,2,3,5], fingers_lh:[5,3,2,1] },
    bassNote:"C3", bassMidi:48,
    voiceLeadTo: {
      "F": { inversion:"root", shared:["C4"], movement:"E4\u2192F4, G4\u2192A4, Bb4\u2192A4" }
    }
  },
  "A": {
    name:"A Major", short:"A", type:"major", level:5,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["A3","C#4","E4"], midi:[57,61,64],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["C#4","E4","A4"], midi:[61,64,69],
                      fingers_rh:[1,2,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["E4","A4","C#5"], midi:[64,69,73],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"A2", bassMidi:45,
    voiceLeadTo: {
      "D": { inversion:"root", shared:["A3"], movement:"C#4\u2192D4, E4\u2192F#4" }
    }
  },
  "E": {
    name:"E Major", short:"E", type:"major", level:5,
    color: CHORD_COLORS.major,
    rootPosition: { notes:["E4","G#4","B4"], midi:[64,68,71],
                    fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    firstInversion: { notes:["G#3","B3","E4"], midi:[56,59,64],
                      fingers_rh:[1,3,5], fingers_lh:[5,3,1] },
    secondInversion: { notes:["B3","E4","G#4"], midi:[59,64,68],
                       fingers_rh:[1,3,5], fingers_lh:[5,2,1] },
    bassNote:"E3", bassMidi:52,
    voiceLeadTo: {
      "Am": { inversion:"root", shared:["E4"], movement:"G#4\u2192A4, B4\u2192C5" }
    }
  }
};

// Map chord short name to pitch classes (for detection)
var CHORD_NOTES = {};
(function() {
  for (var key in CHORDS) {
    var c = CHORDS[key];
    var notes = c.rootPosition.notes.map(function(n) {
      var noteName = n.replace(/\d/g, "");
      var idx = NOTE_NAMES.indexOf(noteName);
      if (idx < 0) idx = FLAT_NAMES.indexOf(noteName);
      return NOTE_NAMES[idx >= 0 ? idx : 0];
    });
    CHORD_NOTES[c.short] = notes;
  }
})();

// Get all chord keys as flat list
function allChordKeys() {
  return Object.keys(CHORDS);
}
function allChords() {
  var _pc = (typeof PIANO_DATA !== "undefined" && PIANO_DATA.CHORDS) ? PIANO_DATA.CHORDS : CHORDS;
  return allChordKeys().map(function(k) { return _pc[k]; });
}
function findChord(short) {
  var _pc = (typeof PIANO_DATA !== "undefined" && PIANO_DATA.CHORDS) ? PIANO_DATA.CHORDS : CHORDS;
  return _pc[short] || null;
}

// Get chords for a specific level (introduced at that level)
function chordsForLevel(lvl) {
  return allChords().filter(function(c) { return c.level === lvl; });
}

// Get all chords unlocked at or below a given level
function chordsUpToLevel(lvl) {
  return allChords().filter(function(c) { return c.level <= lvl; });
}

// Helper to get a chord's default midi/fingers for display
function chordMidi(c) {
  if (!c) return [];
  return c.rootPosition.midi;
}
function chordFingers(c) {
  if (!c) return [];
  return c.rootPosition.fingers_rh;
}
function chordNoteNames(c) {
  if (!c) return [];
  return c.rootPosition.notes;
}

// ── LH_PATTERNS array (7 rhythm levels) ──
var LH_PATTERNS = [
  { id:"R1", name:"Whole Note Bass", level:"R1",
    desc:"Play root note, hold for 4 beats",
    pattern:[{beat:1,note:"root",hold:4}],
    bpmRange:[60,70], unlockAt:1 },
  { id:"R2", name:"Half Note Bass", level:"R2",
    desc:"Root on beat 1, root again on beat 3",
    pattern:[{beat:1,note:"root",hold:2},{beat:3,note:"root",hold:2}],
    bpmRange:[65,75], unlockAt:3 },
  { id:"R3", name:"Root-Fifth", level:"R3",
    desc:"Root on beat 1, fifth on beat 3",
    pattern:[{beat:1,note:"root",hold:2},{beat:3,note:"fifth",hold:2}],
    bpmRange:[70,80], unlockAt:4 },
  { id:"R4", name:"Root-Fifth-Octave", level:"R4",
    desc:"Root, fifth, octave, fifth (4 notes per bar)",
    pattern:[{beat:1,note:"root",hold:1},{beat:2,note:"fifth",hold:1},
             {beat:3,note:"octave",hold:1},{beat:4,note:"fifth",hold:1}],
    bpmRange:[70,80], unlockAt:5 },
  { id:"R5", name:"Alberti Bass", level:"R5",
    desc:"Root-fifth-third-fifth (the classic pattern)",
    pattern:[{beat:1,note:"root",hold:1},{beat:2,note:"fifth",hold:1},
             {beat:3,note:"third",hold:1},{beat:4,note:"fifth",hold:1}],
    bpmRange:[75,85], unlockAt:6 },
  { id:"R6", name:"Syncopated Patterns", level:"R6",
    desc:"Pop ballad, swing, and Latin-inspired bass lines",
    pattern:[{beat:1,note:"root",hold:1},{beat:2.5,note:"fifth",hold:0.5},
             {beat:3,note:"root",hold:1}],
    bpmRange:[80,95], unlockAt:7 },
  { id:"R7", name:"Walking Bass", level:"R7",
    desc:"Stepwise bass lines connecting chord roots",
    pattern:[{beat:1,note:"root",hold:1},{beat:2,note:"step2",hold:1},
             {beat:3,note:"step3",hold:1},{beat:4,note:"step4",hold:1}],
    bpmRange:[75,90], unlockAt:8 }
];

// ── REWARD_PHASES (stickiness #1 + #4) ──
var REWARD_PHASES = [
  { sessions:[1,5], schedule:"continuous", xpPerAction:25,
    celebrateEvery:1, sounds:true, visualFx:true },
  { sessions:[6,14], schedule:"VR-2-3", jackpotChance:0,
    celebrateEvery:2.5 },
  { sessions:[15,30], schedule:"VR-5-8", jackpotChance:0.07,
    jackpotMultiplier:10 },
  { sessions:[31,50], schedule:"intrinsic", jackpotChance:0.05,
    jackpotMultiplier:15, surpriseSongUnlock:true }
];

function getRewardPhase(sessionNum) {
  for (var i = 0; i < REWARD_PHASES.length; i++) {
    var p = REWARD_PHASES[i];
    if (sessionNum >= p.sessions[0] && sessionNum <= p.sessions[1]) return p;
  }
  return REWARD_PHASES[REWARD_PHASES.length - 1];
}

// ── SESSION_PLANS (all 50 sessions) ──
var SESSION_PLANS = [
  // Level 1: White Keys Only (Sessions 1-3)
  { num:1, title:"Hello, Piano", level:1,
    spark:{ text:"Listen to the 'Let It Be' intro \u2014 just the piano chords.", duration:60 },
    review:null,
    newMove:{ text:"Find middle C. Thumb (1) on C, middle finger (3) on E, pinky (5) on G. Press all three together. That's C major! Repeat 10x.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play C major as a drone under Row Row Row Your Boat.",
                song:"Row Row Row Your Boat", duration:120, observePriming:15 },
    victoryLap:{ text:"One clean C major chord. Record the sound.", duration:60 },
    lh:"Resting", bpm:60,
    ifThen:"If I open the piano lid, then I will play C-E-G three times." },

  { num:2, title:"The Chord Machine", level:1,
    spark:{ text:"Same clip \u2014 notice the chord changes now.", duration:60 },
    review:{ chords:["C"], text:"Play C major 4x clean, lift between each.", duration:60 },
    newMove:{ text:"Play C major in different octaves. C5-E5-G5, then C3-E3-G3. A chord is a shape, not a location!",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play C in rhythm \u2014 4 beats on, 4 beats rest. Metronome at 60 BPM.",
                song:"Twinkle Twinkle", duration:120, observePriming:15 },
    victoryLap:{ text:"Play C in three octaves. Record.", duration:60 },
    lh:"Resting", bpm:60,
    ifThen:"If I sit at the keyboard, then I will find C with my eyes closed." },

  { num:3, title:"Both Hands Wake Up", level:1,
    spark:{ text:"Listen for the bass notes in 'Let It Be'.", duration:60 },
    review:{ chords:["C"], text:"C major in rhythm at 60 BPM.", duration:60 },
    newMove:{ text:"LH plays C3 (one note, one finger). Then RH chord alone. Then BOTH together \u2014 bass C + C-E-G.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"LH C + RH C major together, hold 4 beats, repeat.",
                song:"Row Row Row Your Boat", duration:120, observePriming:15 },
    victoryLap:{ text:"LH + RH together, clean. Record.", duration:60 },
    lh:"Single C bass note (whole notes)", bpm:60,
    ifThen:"If I hear music playing, then I will think about the bass notes." },

  // Level 2: The Neighbor Chords (Sessions 4-8)
  { num:4, title:"The F Chord (Your Hand Barely Moves)", level:2,
    spark:{ text:"Listen to 'La Bamba' \u2014 feel the energy.", duration:60 },
    review:{ chords:["C"], text:"LH C + RH C major, 4 reps at 60 BPM.", duration:60 },
    newMove:{ text:"F major as 2nd inversion (C-F-A). Keep thumb on C! Move E\u2192F, G\u2192A. Two fingers, one key each.",
              chord:"F", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Alternate C and F every 4 beats with metronome.",
                song:"La Bamba", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean C \u2192 F transition.", duration:60 },
    lh:"C (under C), F (under F) \u2014 whole notes", bpm:65,
    ifThen:"If I play C, then I will try F next." },

  { num:5, title:"The G Chord (Smooth Slide)", level:2,
    spark:{ text:"Listen to 'Wild Thing' \u2014 three chords, total energy.", duration:60 },
    review:{ chords:["C","F"], text:"C \u2192 F transitions, back and forth.", duration:60 },
    newMove:{ text:"G major as 1st inversion (B-D-G). From F: thumb C\u2192B, middle F\u2192D, pinky A\u2192G.",
              chord:"G", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Full C \u2192 F \u2192 G \u2192 C cycle. This is 'La Bamba'!",
                song:"La Bamba", duration:120, observePriming:15 },
    victoryLap:{ text:"Full C-F-G-C cycle, clean.", duration:60 },
    lh:"C, F, G, C \u2014 whole notes", bpm:65,
    ifThen:"If I can play C and F, then I will add G." },

  { num:6, title:"I-IV-V Power", level:2,
    spark:{ text:"Listen to 'Twist and Shout' \u2014 same three chords!", duration:60 },
    review:{ chords:["C","F","G"], text:"C \u2192 F \u2192 G \u2192 C cycle.", duration:60 },
    newMove:{ text:"Play the cycle continuously at 65 BPM. No pauses between chords. Count: '1-2-3-4, change...'",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Happy Birthday' \u2014 C, F, G. Play along slowly.",
                song:"Happy Birthday", duration:120, observePriming:15 },
    victoryLap:{ text:"Continuous C-F-G-C loop, no hesitation.", duration:60 },
    lh:"C, F, G \u2014 whole notes", bpm:65,
    ifThen:"If I hesitate on a change, then I will slow down 5 BPM." },

  { num:7, title:"12-Bar Blues on Piano", level:2,
    spark:{ text:"Listen to a boogie-woogie blues clip.", duration:60 },
    review:{ chords:["C","F","G"], text:"C-F-G cycle, smooth.", duration:60 },
    newMove:{ text:"12-bar blues: C(4) \u2192 F(2) \u2192 C(2) \u2192 G(1) \u2192 F(1) \u2192 C(2). Count bars.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play 12-bar blues with backing track. Slow tempo.",
                song:"12-Bar Blues", duration:120, observePriming:15 },
    victoryLap:{ text:"One complete 12-bar cycle.", duration:60 },
    lh:"Bass notes following chord roots", bpm:70,
    ifThen:"If I lose my place, then I will restart at the C chord." },

  { num:8, title:"LH Upgrade \u2014 Half Notes", level:2,
    spark:{ text:"Listen to how the bass moves in a real recording.", duration:60 },
    review:{ chords:["C","F","G"], text:"12-bar blues pattern.", duration:60 },
    newMove:{ text:"LH upgrade: root on beat 1 AND beat 3. Same note, twice as often. Practice LH alone first.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'La Bamba' with half-note bass. Sounds fuller!",
                song:"La Bamba", duration:120, observePriming:15 },
    victoryLap:{ text:"Full song with half-note bass.", duration:60 },
    lh:"Half notes (root on beats 1 and 3)", bpm:70,
    ifThen:"If I struggle with both hands, then I will practice LH alone first." },

  // Level 3: The Emotional Turn (Sessions 9-14)
  { num:9, title:"The Am Chord (One Finger Moves!)", level:3,
    spark:{ text:"Listen to 'Let It Be' \u2014 hear the Am chord.", duration:60 },
    review:{ chords:["C","F","G"], text:"C \u2192 F \u2192 G cycle with half-note bass.", duration:60 },
    newMove:{ text:"Am (A-C-E). From C major: C and E STAY, only G moves to A. ONE finger!",
              chord:"Am", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"C \u2192 Am \u2192 C \u2192 Am. Hear the emotional shift. Major to minor.",
                song:"Let It Be", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean C \u2192 Am transitions.", duration:60 },
    lh:"C (under C), A (under Am)", bpm:70,
    ifThen:"If I play C, then I will notice how Am sounds different." },

  { num:10, title:"The Em Chord", level:3,
    spark:{ text:"Listen to 'Zombie' by Cranberries.", duration:60 },
    review:{ chords:["C","Am"], text:"C \u2192 Am transitions.", duration:60 },
    newMove:{ text:"Em (E-G-B). From Am: share E. Move A\u2192G, C\u2192B. Smooth!",
              chord:"Em", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Em \u2192 Am \u2192 C chain. Three chords, all connected by voice leading.",
                song:"Stand By Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Em \u2192 Am \u2192 C clean.", duration:60 },
    lh:"E, A, C bass notes", bpm:70,
    ifThen:"If I learn Em, then I will try it with Am right away." },

  { num:11, title:"The Pop Loop", level:3,
    spark:{ text:"Listen to 'I'm Yours' or 'Let It Be' \u2014 the four-chord song.", duration:60 },
    review:{ chords:["Em","Am","C"], text:"Em \u2192 Am \u2192 C chain.", duration:60 },
    newMove:{ text:"The legendary C \u2192 G \u2192 Am \u2192 F. The I-V-vi-IV. Use voice-led inversions.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Loop C \u2192 G \u2192 Am \u2192 F with backing track.",
                song:"Let It Be", duration:120, observePriming:15 },
    victoryLap:{ text:"Full loop with LH. Record \u2014 it sounds like a real song!", duration:60 },
    lh:"C, G, A, F \u2014 half notes", bpm:72,
    ifThen:"If I can play the pop loop, then I will try it at different speeds." },

  { num:12, title:"Let It Be", level:3,
    spark:{ text:"Full 'Let It Be' intro.", duration:60 },
    review:{ chords:["C","G","Am","F"], text:"Pop loop.", duration:60 },
    newMove:{ text:"Map the specific 'Let It Be' chord timing. Each chord for 2 or 4 beats.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play along with 'Let It Be' at 0.85x speed.",
                song:"Let It Be", duration:120, observePriming:15 },
    victoryLap:{ text:"Record the verse progression.", duration:60 },
    lh:"Half-note bass", bpm:72,
    ifThen:"If I can play the verse, then I will try the chorus next time." },

  { num:13, title:"Stand By Me", level:3,
    spark:{ text:"Listen to 'Stand By Me'.", duration:60 },
    review:{ chords:["C","G","Am","F"], text:"'Let It Be' progression.", duration:60 },
    newMove:{ text:"Different order: C \u2192 Am \u2192 F \u2192 G. The doo-wop progression. Practice F \u2192 G transition.",
              chord:"Am", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Stand By Me' play-along at 0.8x speed.",
                song:"Stand By Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Half-note bass", bpm:72,
    ifThen:"If I know two songs, then I will practice both in one sitting." },

  { num:14, title:"Level 3 Boss \u2014 Root-Fifth Bass", level:3,
    spark:{ text:"Hear how bass sounds with two different notes.", duration:60 },
    review:{ chords:["C","Am","F","G"], text:"Learner's choice song from Level 3.", duration:60 },
    newMove:{ text:"LH root-fifth! C then G (beat 1, beat 3). Then A then E. Practice LH alone 2 min.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Let It Be' or 'Stand By Me' with root-fifth bass.",
                song:"Let It Be", duration:120, observePriming:15 },
    victoryLap:{ text:"Full progression with root-fifth bass. Record.", duration:60 },
    lh:"Root-fifth pattern", bpm:72,
    ifThen:"If I struggle with root-fifth, then I will drop back to whole notes." },

  // Level 4: Complete Key of C (Sessions 15-20)
  { num:15, title:"The Dm Chord", level:4,
    spark:{ text:"Listen to 'Autumn Leaves'.", duration:60 },
    review:{ chords:["C","Am","F"], text:"Pop loop with root-fifth bass.", duration:60 },
    newMove:{ text:"Dm (D-F-A). From Am: A stays, C\u2192D, E\u2192F. Voice-led!",
              chord:"Dm", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Am \u2192 Dm cycle with root-fifth bass.",
                song:"Autumn Leaves", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean Am \u2192 Dm.", duration:60 },
    lh:"A-E (Am), D-A (Dm)", bpm:72,
    ifThen:"If I know Am well, then Dm will be easy \u2014 just shift two fingers." },

  { num:16, title:"The G7 Chord \u2014 The Magnet", level:4,
    spark:{ text:"Listen for the 'pull' \u2014 a chord that wants to resolve.", duration:60 },
    review:{ chords:["Am","Dm"], text:"Am \u2192 Dm transitions.", duration:60 },
    newMove:{ text:"G7 = G major + F. The F in G7 'wants' to move to E in C major. Satisfying resolution!",
              chord:"G7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Dm \u2192 G7 \u2192 C (the ii-V-I). THE most important 3-chord progression.",
                song:"Autumn Leaves", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean ii-V-I with root-fifth bass.", duration:60 },
    lh:"D-A, G-D, C-G", bpm:72,
    ifThen:"If I hear a chord wanting to resolve, then it's probably a dominant 7th." },

  { num:17, title:"Jazz Day", level:4,
    spark:{ text:"Listen to 'Fly Me to the Moon'.", duration:60 },
    review:{ chords:["Dm","G7","C"], text:"ii-V-I pattern.", duration:60 },
    newMove:{ text:"Extended chain: Am \u2192 Dm \u2192 G7 \u2192 C \u2192 F. Circle of motion.",
              chord:"Dm", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Simplified 'Autumn Leaves' \u2014 Am, Dm, G7, C, F.",
                song:"Autumn Leaves", duration:120, observePriming:15 },
    victoryLap:{ text:"Full turnaround, clean.", duration:60 },
    lh:"Root-fifth", bpm:75,
    ifThen:"If I can play ii-V-I, then I will chain it into longer progressions." },

  { num:18, title:"Hallelujah", level:4,
    spark:{ text:"Listen to 'Hallelujah' piano intro.", duration:60 },
    review:{ chords:["Am","Dm","G7","C"], text:"Jazz turnaround.", duration:60 },
    newMove:{ text:"'Hallelujah' uses C, Am, F, G \u2014 chords you already know!",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play along at 0.8x speed.",
                song:"Hallelujah", duration:120, observePriming:15 },
    victoryLap:{ text:"Record the intro/verse.", duration:60 },
    lh:"Root-fifth", bpm:70,
    ifThen:"If I know the chords, then I will focus on timing." },

  { num:19, title:"Piano Man", level:4,
    spark:{ text:"Listen to 'Piano Man' intro.", duration:60 },
    review:{ chords:["C","Am","F","G"], text:"'Hallelujah' progression.", duration:60 },
    newMove:{ text:"'Piano Man' uses every chord in key of C! It's in 3/4 time (waltz). Count: '1-2-3, 1-2-3.'",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Simplified 'Piano Man' with waltz bass.",
                song:"Piano Man", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Root on beat 1, fifth on beat 3 (waltz)", bpm:70,
    ifThen:"If I can count in 4, then I can learn to count in 3." },

  { num:20, title:"Level 4 Boss \u2014 Root-Fifth-Octave", level:4,
    spark:{ text:"Hear full-range bass in a recording.", duration:60 },
    review:{ chords:["C","Dm","G7","F","Am"], text:"Learner's choice song.", duration:60 },
    newMove:{ text:"LH upgrade: Root, fifth, octave, fifth. C-G-C'-G. Practice on C then F.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Let It Be' with root-fifth-octave bass.",
                song:"Let It Be", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Root-fifth-octave", bpm:72,
    ifThen:"If I master root-fifth-octave, then songs will sound professional." },

  // Level 5: Key of G (Sessions 21-28)
  { num:21, title:"Welcome to G \u2014 Meet F#", level:5,
    spark:{ text:"Listen to 'Wonderwall' \u2014 different key, familiar feel.", duration:60 },
    review:{ chords:["C","G","Am"], text:"Pop loop, root-fifth-octave bass.", duration:60 },
    newMove:{ text:"D major (D-F#-A). Your first black key! F# sits right between F and G.",
              chord:"D", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"G \u2192 D \u2192 Em \u2192 C. Key of G basics.",
                song:"Wonderwall", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean D major with F#.", duration:60 },
    lh:"Root-fifth-octave", bpm:70,
    ifThen:"If I see a black key, then I will find it by feel between the white keys." },

  { num:22, title:"Bm \u2014 The Dark Horse", level:5,
    spark:{ text:"Listen to 'Country Roads'.", duration:60 },
    review:{ chords:["G","D"], text:"G \u2192 D transitions.", duration:60 },
    newMove:{ text:"Bm (B-D-F#). Shares D and F# with D major! Move A\u2192B.",
              chord:"Bm", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Em \u2192 Bm \u2192 D \u2192 G progression.",
                song:"Country Roads", duration:120, observePriming:15 },
    victoryLap:{ text:"Smooth Bm transitions.", duration:60 },
    lh:"Root-fifth-octave", bpm:72,
    ifThen:"If I know D, then Bm shares two notes with it." },

  { num:23, title:"Em7 \u2014 Your First 7th Chord", level:5,
    spark:{ text:"Listen for the dreamy quality of 7th chords.", duration:60 },
    review:{ chords:["G","D","Bm"], text:"Key of G chords.", duration:60 },
    newMove:{ text:"Em7 (E-G-B-D). Just add D to Em! One extra note, whole new color.",
              chord:"Em7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"G \u2192 Em7 \u2192 C \u2192 D. A dreamy pop sound.",
                song:"Perfect", duration:120, observePriming:15 },
    victoryLap:{ text:"Em7 clean, all 4 notes ringing.", duration:60 },
    lh:"Root-fifth-octave", bpm:72,
    ifThen:"If I know Em, then Em7 is just one extra finger." },

  { num:24, title:"Wonderwall Deep Dive", level:5,
    spark:{ text:"Full 'Wonderwall' intro.", duration:60 },
    review:{ chords:["Em7","G","D"], text:"Key of G with Em7.", duration:60 },
    newMove:{ text:"Map the Wonderwall progression: Em7 \u2192 G \u2192 D \u2192 A. Practice at 0.75x.",
              chord:"Em7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Wonderwall' play-along.",
                song:"Wonderwall", duration:120, observePriming:15 },
    victoryLap:{ text:"Record the verse.", duration:60 },
    lh:"Root-fifth-octave", bpm:75,
    ifThen:"If I can play Wonderwall slowly, then I will speed up 5 BPM each day." },

  { num:25, title:"Country Roads", level:5,
    spark:{ text:"'Country Roads' \u2014 an anthem.", duration:60 },
    review:{ chords:["G","D","Em","C"], text:"Key of G progressions.", duration:60 },
    newMove:{ text:"Country Roads: G \u2192 Em \u2192 D \u2192 C. Familiar chords, new order.",
              chord:"G", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play along with 'Country Roads'.",
                song:"Country Roads", duration:120, observePriming:15 },
    victoryLap:{ text:"Full verse, smooth transitions.", duration:60 },
    lh:"Root-fifth-octave", bpm:75,
    ifThen:"If I can play in G, then I can play hundreds of songs." },

  { num:26, title:"Perfect by Ed Sheeran", level:5,
    spark:{ text:"Listen to 'Perfect'.", duration:60 },
    review:{ chords:["G","Em","C","D"], text:"Country Roads progression.", duration:60 },
    newMove:{ text:"'Perfect': G \u2192 Em \u2192 C \u2192 D. Same chords, beautiful ballad timing.",
              chord:"G", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play along with 'Perfect' at slow tempo.",
                song:"Perfect", duration:120, observePriming:15 },
    victoryLap:{ text:"Record your version.", duration:60 },
    lh:"Root-fifth-octave", bpm:63,
    ifThen:"If I can play a ballad slowly, then I'm really making music." },

  { num:27, title:"Key of G Review", level:5,
    spark:{ text:"How many songs can you play now? Count them!", duration:60 },
    review:{ chords:["G","D","Bm","Em7","C"], text:"All key of G chords.", duration:60 },
    newMove:{ text:"Mix and match: create your own 4-chord progression in key of G.",
              chord:"G", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Your choice: Wonderwall, Country Roads, or Perfect.",
                song:"Wonderwall", duration:120, observePriming:15 },
    victoryLap:{ text:"Play your favorite song from this level.", duration:60 },
    lh:"Root-fifth-octave", bpm:78,
    ifThen:"If I know two keys, then I'm becoming a real pianist." },

  { num:28, title:"Level 5 Boss \u2014 Alberti Bass Preview", level:5,
    spark:{ text:"Listen to classical piano \u2014 that rolling bass pattern is Alberti.", duration:60 },
    review:{ chords:["G","D","Em","C","Bm"], text:"Full key of G.", duration:60 },
    newMove:{ text:"Alberti preview: root-fifth-third-fifth. C-G-E-G. LH alone first, then add RH.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Simple song with Alberti bass on just C and G.",
                song:"Let It Be", duration:120, observePriming:15 },
    victoryLap:{ text:"Alberti bass on C, clean.", duration:60 },
    lh:"Alberti bass preview", bpm:75,
    ifThen:"If Alberti feels hard, then I will practice LH alone for 2 minutes first." },

  // Level 6: Key of F (Sessions 29-34)
  { num:29, title:"Meet Bb \u2014 The Flat Side", level:6,
    spark:{ text:"Listen to 'Lean on Me'.", duration:60 },
    review:{ chords:["F","C","G"], text:"I-IV-V in C with Alberti bass.", duration:60 },
    newMove:{ text:"Bb major (Bb-D-F). Your first flat! Same shape, shifted left.",
              chord:"Bb", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"F \u2192 Bb \u2192 C \u2192 F. Key of F basics.",
                song:"Lean on Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean Bb chord.", duration:60 },
    lh:"Alberti bass", bpm:75,
    ifThen:"If I found F#, then Bb is just as easy \u2014 it's between A and B." },

  { num:30, title:"Gm \u2014 Minor in F", level:6,
    spark:{ text:"Listen for minor chords in pop songs.", duration:60 },
    review:{ chords:["F","Bb","C"], text:"Key of F basics.", duration:60 },
    newMove:{ text:"Gm (G-Bb-D). Shares Bb and D with Bb major! Just move F\u2192G.",
              chord:"Gm", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Bb \u2192 Gm \u2192 F \u2192 C progression.",
                song:"Can't Help Falling in Love", duration:120, observePriming:15 },
    victoryLap:{ text:"Smooth Gm transitions.", duration:60 },
    lh:"Alberti bass", bpm:77,
    ifThen:"If I know Bb, then Gm shares two notes." },

  { num:31, title:"Dm7 \u2014 Adding Color", level:6,
    spark:{ text:"Notice how 7th chords add sophistication.", duration:60 },
    review:{ chords:["F","Bb","Gm"], text:"Key of F chords.", duration:60 },
    newMove:{ text:"Dm7 (D-F-A-C). Just add C to Dm! Four notes, richer sound.",
              chord:"Dm7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Dm7 \u2192 G7 \u2192 C \u2192 F. Jazz-pop fusion.",
                song:"Lean on Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Dm7 clean, all 4 notes.", duration:60 },
    lh:"Alberti bass", bpm:78,
    ifThen:"If I know Dm, then Dm7 is one extra note." },

  { num:32, title:"Lean on Me Deep Dive", level:6,
    spark:{ text:"Full 'Lean on Me'.", duration:60 },
    review:{ chords:["F","Bb","Gm","Dm7"], text:"Key of F review.", duration:60 },
    newMove:{ text:"Map 'Lean on Me' \u2014 C \u2192 F \u2192 C \u2192 G. Simple but powerful.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Lean on Me' play-along.",
                song:"Lean on Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Alberti bass", bpm:80,
    ifThen:"If I can play Lean on Me, then I'll try Can't Help Falling in Love." },

  { num:33, title:"Can't Help Falling in Love", level:6,
    spark:{ text:"Elvis classic.", duration:60 },
    review:{ chords:["C","F","Bb","Gm"], text:"Key of F songs.", duration:60 },
    newMove:{ text:"C \u2192 Em \u2192 Am \u2192 F \u2192 C \u2192 G. Beautiful chord movement.",
              chord:"Am", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Play along with 'Can't Help Falling in Love'.",
                song:"Can't Help Falling in Love", duration:120, observePriming:15 },
    victoryLap:{ text:"Record your version.", duration:60 },
    lh:"Alberti bass", bpm:72,
    ifThen:"If I play with feeling, then the music sounds better than perfect technique." },

  { num:34, title:"Level 6 Boss \u2014 Syncopated Bass", level:6,
    spark:{ text:"Hear the groove in R&B and soul music.", duration:60 },
    review:{ chords:["F","Bb","Dm7","C"], text:"Key of F mastery.", duration:60 },
    newMove:{ text:"Syncopated bass: root on 1, fifth on the 'and' of 2, root on 3. Boom-chick-boom.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Any Level 6 song with syncopated bass.",
                song:"Lean on Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Syncopated bass on C and F, smooth.", duration:60 },
    lh:"Syncopated (boom-chick-boom)", bpm:82,
    ifThen:"If syncopation feels awkward, then I will tap the rhythm first without playing." },

  // Level 7: Color Chords (Sessions 35-42)
  { num:35, title:"Cmaj7 \u2014 The Dreamy Sound", level:7,
    spark:{ text:"Listen to 'Imagine' by John Lennon.", duration:60 },
    review:{ chords:["C","F","Am","G"], text:"Pop loop with syncopated bass.", duration:60 },
    newMove:{ text:"Cmaj7 (C-E-G-B). Just add B to C major! One note transforms everything.",
              chord:"Cmaj7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"C \u2192 Cmaj7 \u2192 F \u2192 Fmaj7. Color chord sequence.",
                song:"Imagine", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean Cmaj7.", duration:60 },
    lh:"Syncopated patterns", bpm:76,
    ifThen:"If I know C, then Cmaj7 is my pinky on B." },

  { num:36, title:"Fmaj7 \u2014 Dreamy Part 2", level:7,
    spark:{ text:"More 'Imagine' \u2014 notice the Fmaj7.", duration:60 },
    review:{ chords:["C","Cmaj7"], text:"C to Cmaj7 transitions.", duration:60 },
    newMove:{ text:"Fmaj7 (F-A-C-E). Just add E to F major!",
              chord:"Fmaj7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Imagine' chord sequence.",
                song:"Imagine", duration:120, observePriming:15 },
    victoryLap:{ text:"Cmaj7 \u2192 Fmaj7 smooth.", duration:60 },
    lh:"Syncopated", bpm:76,
    ifThen:"If I love the dreamy sound, then maj7 chords are my new favorite." },

  { num:37, title:"Am7 \u2014 Jazz Minor", level:7,
    spark:{ text:"'Fly Me to the Moon' clip.", duration:60 },
    review:{ chords:["Cmaj7","Fmaj7"], text:"Maj7 transitions.", duration:60 },
    newMove:{ text:"Am7 (A-C-E-G). Just add G to Am! The jazz ii chord.",
              chord:"Am7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Am7 \u2192 Dm7 \u2192 G7 \u2192 Cmaj7. The jazz ii-V-I-IV.",
                song:"Fly Me to the Moon", duration:120, observePriming:15 },
    victoryLap:{ text:"Jazz ii-V-I clean.", duration:60 },
    lh:"Syncopated", bpm:78,
    ifThen:"If I can play ii-V-I with 7ths, then I'm playing jazz." },

  { num:38, title:"Imagine Deep Dive", level:7,
    spark:{ text:"Full 'Imagine'.", duration:60 },
    review:{ chords:["Am7","Dm7","G7","Cmaj7"], text:"Jazz progression.", duration:60 },
    newMove:{ text:"Map 'Imagine': C \u2192 Cmaj7 \u2192 F. Simple but the 7ths make it special.",
              chord:"Cmaj7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Imagine' play-along.",
                song:"Imagine", duration:120, observePriming:15 },
    victoryLap:{ text:"Record 'Imagine'.", duration:60 },
    lh:"Syncopated", bpm:76,
    ifThen:"If I can play Imagine, then I've come a very long way." },

  { num:39, title:"Fly Me to the Moon", level:7,
    spark:{ text:"The classic jazz standard.", duration:60 },
    review:{ chords:["Cmaj7","Fmaj7","Am7"], text:"Color chord review.", duration:60 },
    newMove:{ text:"Am7 \u2192 Dm7 \u2192 G7 \u2192 Cmaj7 \u2192 Fmaj7. The full jazz turnaround.",
              chord:"Am7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Simplified 'Fly Me to the Moon'.",
                song:"Fly Me to the Moon", duration:120, observePriming:15 },
    victoryLap:{ text:"Jazz turnaround, smooth.", duration:60 },
    lh:"Syncopated", bpm:80,
    ifThen:"If I can play a jazz standard, then I can play anything." },

  { num:40, title:"All of Me (John Legend)", level:7,
    spark:{ text:"Listen to 'All of Me'.", duration:60 },
    review:{ chords:["Am7","Dm7","G7","Cmaj7","Fmaj7"], text:"Jazz chords.", duration:60 },
    newMove:{ text:"'All of Me': Am \u2192 F \u2192 C \u2192 G. Familiar chords, new feel at 63 BPM.",
              chord:"Am", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'All of Me' play-along.",
                song:"All of Me", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Syncopated", bpm:63,
    ifThen:"If I play with emotion, then every song sounds unique." },

  { num:41, title:"Color Chord Mixdown", level:7,
    spark:{ text:"Mix maj7, min7, and dom7 \u2014 hear the differences.", duration:60 },
    review:{ chords:["Cmaj7","Am7","Dm7","G7","Fmaj7"], text:"All 7th chords.", duration:60 },
    newMove:{ text:"Rapid switching: Cmaj7 \u2192 Am7 \u2192 Dm7 \u2192 G7 \u2192 Fmaj7. All the colors.",
              chord:"Cmaj7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Your choice of Level 7 song.",
                song:"Imagine", duration:120, observePriming:15 },
    victoryLap:{ text:"All 7th chords clean and smooth.", duration:60 },
    lh:"Syncopated", bpm:82,
    ifThen:"If I know all the 7ths, then I have a pro-level chord vocabulary." },

  { num:42, title:"Level 7 Boss \u2014 Walking Bass Preview", level:7,
    spark:{ text:"Listen to walking bass in jazz.", duration:60 },
    review:{ chords:["Cmaj7","Am7","Fmaj7","G7"], text:"Level 7 mastery.", duration:60 },
    newMove:{ text:"Walking bass: stepwise lines connecting roots. C-D-E-F under C\u2192Dm.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Simple jazz progression with walking bass attempt.",
                song:"Fly Me to the Moon", duration:120, observePriming:15 },
    victoryLap:{ text:"Walking bass on C\u2192Am, clean.", duration:60 },
    lh:"Walking bass preview", bpm:78,
    ifThen:"If walking bass is hard, then I will walk slowly first." },

  // Level 8: Graduation (Sessions 43-50)
  { num:43, title:"Eb Major \u2014 New Territory", level:8,
    spark:{ text:"Listen to 'Clocks' by Coldplay.", duration:60 },
    review:{ chords:["Cmaj7","Am7","G7"], text:"Jazz progression with walking bass.", duration:60 },
    newMove:{ text:"Eb major (Eb-G-Bb). Two flats! But same shape as every other major chord.",
              chord:"Eb", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Eb \u2192 Bb \u2192 Fm. 'Clocks' progression!",
                song:"Clocks", duration:120, observePriming:15 },
    victoryLap:{ text:"Clean Eb major.", duration:60 },
    lh:"Walking bass", bpm:80,
    ifThen:"If I've learned sharps and naturals, then flats are the same skill." },

  { num:44, title:"Fm \u2014 Minor in Eb", level:8,
    spark:{ text:"'Clocks' deeper \u2014 the minor chord.", duration:60 },
    review:{ chords:["Eb","Bb"], text:"Eb \u2192 Bb transitions.", duration:60 },
    newMove:{ text:"Fm (F-Ab-C). The iii chord in Eb. Ab is between G and A.",
              chord:"Fm", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Clocks' full progression: Eb \u2192 Bb \u2192 Fm.",
                song:"Clocks", duration:120, observePriming:15 },
    victoryLap:{ text:"Smooth Clocks progression.", duration:60 },
    lh:"Walking bass", bpm:82,
    ifThen:"If I can find Ab, then Fm is easy." },

  { num:45, title:"C7 \u2014 The Blues Chord", level:8,
    spark:{ text:"Listen to blues piano \u2014 C7 is everywhere.", duration:60 },
    review:{ chords:["Eb","Fm","Bb"], text:"Key of Eb.", duration:60 },
    newMove:{ text:"C7 (C-E-G-Bb). Like C major + Bb. The gateway to blues and soul.",
              chord:"C7", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"C7 \u2192 F \u2192 G7 \u2192 C7. 12-bar blues with 7th chords!",
                song:"12-Bar Blues", duration:120, observePriming:15 },
    victoryLap:{ text:"Blues with 7th chords.", duration:60 },
    lh:"Walking bass", bpm:80,
    ifThen:"If I add 7ths to the blues, then everything sounds more authentic." },

  { num:46, title:"Bohemian Rhapsody", level:8,
    spark:{ text:"The legendary 'Bohemian Rhapsody'.", duration:60 },
    review:{ chords:["C7","Eb","Fm","Bb"], text:"Level 8 chords.", duration:60 },
    newMove:{ text:"Simplified Bohemian Rhapsody: Bb \u2192 C \u2192 F \u2192 Gm \u2192 Eb \u2192 Bb.",
              chord:"Bb", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Bohemian Rhapsody' simplified play-along.",
                song:"Bohemian Rhapsody", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Walking bass", bpm:72,
    ifThen:"If I can play Bohemian Rhapsody, then nothing is impossible." },

  { num:47, title:"Moonlight Sonata (Simplified)", level:8,
    spark:{ text:"Beethoven's Moonlight Sonata.", duration:60 },
    review:{ chords:["Bb","C","Eb","Gm","Fm"], text:"Level 8 review.", duration:60 },
    newMove:{ text:"Simplified Moonlight: Am \u2192 E \u2192 Am \u2192 Dm \u2192 Am. Arpeggiated.",
              chord:"Am", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Moonlight Sonata' arpeggiated play-along.",
                song:"Moonlight Sonata", duration:120, observePriming:15 },
    victoryLap:{ text:"Record your arrangement.", duration:60 },
    lh:"Walking bass / arpeggiated", bpm:56,
    ifThen:"If I play classical music, then I am a real pianist." },

  { num:48, title:"Prelude in C (Bach)", level:8,
    spark:{ text:"Bach's Prelude in C Major.", duration:60 },
    review:{ chords:["Am","Dm","G7","C"], text:"Classical progressions.", duration:60 },
    newMove:{ text:"Prelude: C \u2192 Dm7 \u2192 G7 \u2192 C \u2192 Am \u2192 Fmaj7. All arpeggiated.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"'Prelude in C' play-along.",
                song:"Prelude in C", duration:120, observePriming:15 },
    victoryLap:{ text:"Record.", duration:60 },
    lh:"Arpeggiated pattern", bpm:66,
    ifThen:"If I can play Bach, then 300 years of music is mine." },

  { num:49, title:"Your Recital", level:8,
    spark:{ text:"Pick your three favorite songs from the entire curriculum.", duration:60 },
    review:{ chords:["C","Am","G","F","Dm","Em"], text:"All core chords.", duration:60 },
    newMove:{ text:"Create a 3-song setlist. Practice transitions between songs.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:45, refineDuration:30 },
    songSlice:{ text:"Perform your setlist straight through.",
                song:"Let It Be", duration:300, observePriming:15 },
    victoryLap:{ text:"Record your recital!", duration:60 },
    lh:"Your choice", bpm:80,
    ifThen:"If I can perform a setlist, then I am a musician." },

  { num:50, title:"Graduation Day", level:8,
    spark:{ text:"Look back at Session 1. You played one chord. Now listen to what you can do.", duration:90 },
    review:{ chords:["C","F","G","Am","Em","Dm","G7","D","Bm"], text:"Grand review.", duration:180 },
    newMove:{ text:"Free play. Improvise. Create. You have all the tools.",
              chord:"C", steps:["watch","shadow","try","refine"],
              watchDuration:30, shadowDuration:30, tryDuration:60, refineDuration:30 },
    songSlice:{ text:"Play any song you want. You earned it.",
                song:"Let It Be", duration:300, observePriming:15 },
    victoryLap:{ text:"Graduation! Record your best performance. You are a pianist.", duration:60 },
    lh:"Walking bass", bpm:90,
    ifThen:"If I have graduated, then I will keep playing every day." }
];

// ── SONGS (expanded, 30+) ──
var SONGS = [
  { title:"Row Row Row Your Boat", artist:"Traditional",
    chords:["C"], level:1, style:"block", bpm:60,
    progression:["C","C","C","C","C","C","C","C"],
    practiceStart:55, target:60 },
  { title:"Ode to Joy", artist:"Ludwig van Beethoven",
    chords:["C","G"], level:1, style:"block", bpm:90,
    progression:["C","G","C","G","C","G","C","C"],
    practiceStart:60, target:90, midi:"content/songs/midi/ode_to_joy.mid" },
  { title:"Amazing Grace", artist:"Traditional",
    chords:["C","F","G"], level:2, style:"block", bpm:80,
    progression:["C","G","F","C","C","G","C","C"],
    practiceStart:55, target:80, midi:"content/songs/midi/amazing_grace.mid" },
  { title:"Twinkle Twinkle", artist:"Traditional",
    chords:["C","F","G"], level:1, style:"block", bpm:100,
    progression:["C","C","F","C","F","C","G","C"],
    practiceStart:60, target:100 },
  { title:"Happy Birthday", artist:"Traditional",
    chords:["C","G","F"], level:2, style:"block", bpm:100,
    progression:["C","C","G","G","G","C","F","C"],
    practiceStart:60, target:90 },
  { title:"La Bamba", artist:"Ritchie Valens",
    chords:["C","F","G"], level:2, style:"block", bpm:138,
    progression:["C","F","G","G","C","F","G","G"],
    practiceStart:65, target:110, midi:"content/songs/midi/la_bamba.mid" },
  { title:"Let It Be", artist:"The Beatles",
    chords:["C","G","Am","F"], level:3, style:"block", bpm:72,
    progression:["C","G","Am","F","C","G","F","C"],
    practiceStart:55, target:72, midi:"content/songs/midi/let_it_be.mid" },
  { title:"Stand By Me", artist:"Ben E. King",
    chords:["C","Am","F","G"], level:3, style:"block", bpm:120,
    progression:["C","C","Am","Am","F","G","C","C"],
    practiceStart:70, target:100, midi:"content/songs/midi/stand_by_me.mid" },
  { title:"All of Me", artist:"John Legend",
    chords:["Am","F","C","G"], level:3, style:"block", bpm:63,
    progression:["Am","F","C","G","Am","F","C","G"],
    practiceStart:50, target:63 },
  { title:"Hallelujah", artist:"Leonard Cohen",
    chords:["C","Am","F","G"], level:4, style:"arp_up", bpm:56,
    progression:["C","Am","C","Am","F","G","C","G"],
    practiceStart:50, target:56 },
  { title:"Autumn Leaves", artist:"Jazz Standard",
    chords:["Am","Dm","G7","C","F"], level:4, style:"block", bpm:110,
    progression:["Am","Dm","G7","C","F","Am","Dm","G7"],
    practiceStart:65, target:90 },
  { title:"Piano Man", artist:"Billy Joel",
    chords:["C","G","F","Am","Dm","G7"], level:4, style:"waltz", bpm:100,
    progression:["C","G","F","C","Am","Dm","G7","C"],
    practiceStart:60, target:90 },
  { title:"Wonderwall", artist:"Oasis",
    chords:["Em7","G","D","A"], level:5, style:"block", bpm:87,
    progression:["Em7","G","D","A","Em7","G","D","A"],
    practiceStart:65, target:85 },
  { title:"Country Roads", artist:"John Denver",
    chords:["G","Em","D","C"], level:5, style:"block", bpm:82,
    progression:["G","G","Em","Em","D","D","C","G"],
    practiceStart:60, target:82 },
  { title:"Perfect", artist:"Ed Sheeran",
    chords:["G","Em","C","D"], level:5, style:"arp_up", bpm:63,
    progression:["G","Em","C","D","G","Em","C","D"],
    practiceStart:50, target:63 },
  { title:"Someone Like You", artist:"Adele",
    chords:["A","E","Bm","D"], level:5, style:"arp_up", bpm:68,
    progression:["A","E","Bm","D","A","E","Bm","D"],
    practiceStart:55, target:68 },
  { title:"Lean on Me", artist:"Bill Withers",
    chords:["C","F","G","Em"], level:6, style:"block", bpm:80,
    progression:["C","F","C","C","C","F","G","C"],
    practiceStart:60, target:80 },
  { title:"Can't Help Falling in Love", artist:"Elvis Presley",
    chords:["C","Em","Am","F","G"], level:6, style:"arp_up", bpm:72,
    progression:["C","Em","Am","F","C","G","Am","F","C","G","C","C"],
    practiceStart:55, target:72 },
  { title:"Viva la Vida", artist:"Coldplay",
    chords:["C","D","G","Em"], level:5, style:"block", bpm:138,
    progression:["C","D","G","Em","C","D","G","Em"],
    practiceStart:80, target:120 },
  { title:"Stay With Me", artist:"Sam Smith",
    chords:["Am","F","C"], level:3, style:"block", bpm:84,
    progression:["Am","F","C","C","Am","F","C","C"],
    practiceStart:65, target:84 },
  { title:"Skinny Love", artist:"Bon Iver",
    chords:["Am","C","Em"], level:3, style:"arp_up", bpm:72,
    progression:["Am","C","Am","C","Em","C","Am","C"],
    practiceStart:55, target:72 },
  { title:"Imagine", artist:"John Lennon",
    chords:["C","Cmaj7","F"], level:7, style:"arp_up", bpm:76,
    progression:["C","Cmaj7","F","F","C","Cmaj7","F","F"],
    practiceStart:60, target:76 },
  { title:"Fly Me to the Moon", artist:"Frank Sinatra",
    chords:["Am7","Dm7","G7","Cmaj7","Fmaj7"], level:7, style:"block", bpm:120,
    progression:["Am7","Dm7","G7","Cmaj7","Fmaj7","Am7","Dm7","G7"],
    practiceStart:70, target:100 },
  { title:"Clocks", artist:"Coldplay",
    chords:["Eb","Bb","Fm"], level:8, style:"arp_up", bpm:131,
    progression:["Eb","Bb","Fm","Eb","Bb","Fm","Eb","Bb"],
    practiceStart:75, target:110 },
  { title:"Bohemian Rhapsody", artist:"Queen",
    chords:["Bb","C","F","Gm","Eb"], level:8, style:"block", bpm:72,
    progression:["Bb","C","F","F","Bb","Gm","Eb","F"],
    practiceStart:55, target:72 },
  { title:"Moonlight Sonata", artist:"Beethoven",
    chords:["Am","E","Dm"], level:8, style:"arp_up", bpm:56,
    progression:["Am","Am","E","E","Am","Am","Dm","E"],
    practiceStart:42, target:56 },
  { title:"Prelude in C", artist:"J.S. Bach",
    chords:["C","Dm7","G7","Am","Fmaj7","Em7"], level:8, style:"arp_up", bpm:66,
    progression:["C","Dm7","G7","C","Am","Fmaj7","Em7","G7"],
    practiceStart:50, target:66 },
  { title:"River Flows in You", artist:"Yiruma",
    chords:["A","E","Bm","D"], level:5, style:"arp_up", bpm:68,
    progression:["A","E","Bm","D","A","E","D","E"],
    practiceStart:50, target:68 },
  { title:"12-Bar Blues", artist:"Traditional",
    chords:["C","F","G"], level:2, style:"block", bpm:90,
    progression:["C","C","C","C","F","F","C","C","G","F","C","G"],
    practiceStart:60, target:90 },
  { title:"Knockin' on Heaven's Door", artist:"Bob Dylan",
    chords:["G","D","Am","C"], level:5, style:"block", bpm:69,
    progression:["G","D","Am","Am","G","D","C","C"],
    practiceStart:55, target:69, midi:"content/songs/midi/knockin_on_heavens_door.mid" }
];

// ── BADGES (expanded 15+) ──
// Each badge has a check() function so pianoCheckBadges() in ui.js is data-driven.
// To add a badge: add it here only — no other file needs updating.
var BADGES = [
  { id:"first_chord",  label:"First Note",     icon:"\u{1F3B9}", desc:"Complete Session 1", check:function(){return S.sessions>=1||S.completedSessions.length>=1;} },
  { id:"streak_3",     label:"On Fire!",        icon:"\u{1F525}", desc:"3-day streak", check:function(){return S.streak>=3;} },
  { id:"streak_7",     label:"Unstoppable",     icon:"\u{1F31F}", desc:"7-day streak", check:function(){return S.streak>=7;} },
  { id:"streak_30",    label:"Iron Will",       icon:"\u{1F48E}", desc:"30-day streak", check:function(){return S.streak>=30;} },
  { id:"level_2",      label:"Neighbor Chords", icon:"\u{1F3E0}", desc:"Reach Level 2", check:function(){return S.level>=2;} },
  { id:"level_3",      label:"Emotional",       icon:"\u{1F3AD}", desc:"Reach Level 3", check:function(){return S.level>=3;} },
  { id:"level_4",      label:"Full Palette",    icon:"\u{1F3A8}", desc:"Reach Level 4", check:function(){return S.level>=4;} },
  { id:"level_5",      label:"Black Keys",      icon:"\u{2B50}",  desc:"Reach Level 5", check:function(){return S.level>=5;} },
  { id:"level_6",      label:"Flat Side",       icon:"\u{1F30A}", desc:"Reach Level 6", check:function(){return S.level>=6;} },
  { id:"level_7",      label:"Color Master",    icon:"\u{1F308}", desc:"Reach Level 7", check:function(){return S.level>=7;} },
  { id:"level_8",      label:"Graduate",        icon:"\u{1F393}", desc:"Reach Level 8", check:function(){return S.level>=8;} },
  { id:"sessions_10",  label:"Dedicated",       icon:"\u{1F4AA}", desc:"Complete 10 sessions", check:function(){return S.sessions>=10||S.completedSessions.length>=10;} },
  { id:"sessions_25",  label:"Halfway",         icon:"\u{1F3C3}", desc:"Complete 25 sessions", check:function(){return S.sessions>=25||S.completedSessions.length>=25;} },
  { id:"sessions_50",  label:"Maestro",         icon:"\u{1F3C6}", desc:"Complete all 50 sessions", check:function(){return S.completedSessions.length>=50;} },
  { id:"drills_5",     label:"Quick Fingers",   icon:"\u{26A1}",  desc:"Complete 5 drills", check:function(){return S.drillsDone>=5;} },
  { id:"songs_3",      label:"Performer",       icon:"\u{1F3B6}", desc:"Practice 3 songs", check:function(){return S.songsDone&&S.songsDone.length>=3;} },
  { id:"songs_10",     label:"Repertoire",      icon:"\u{1F4DA}", desc:"Practice 10 songs", check:function(){return S.songsDone&&S.songsDone.length>=10;} },
  { id:"comeback",     label:"Comeback Kid",    icon:"\u{1F49A}", desc:"Return after 3+ days" },
  { id:"jackpot",      label:"Lucky Break",     icon:"\u{1F340}", desc:"Hit a jackpot reward", check:function(){return S.jackpotsHit>=1;} },
  { id:"speed_demon",  label:"Speed Demon",     icon:"\u{1F680}", desc:"Beat your personal best BPM" }
];

// ── Daily challenge types ──
var DAILY_TYPES = [
  { id:"speed",    name:"Speed Round",    desc:"Play 10 chords as fast as you can", dur:60 },
  { id:"iron",     name:"Iron Hands",     desc:"Hold each chord shape for 10 seconds", dur:90 },
  { id:"marathon", name:"Marathon",        desc:"Play for 3 minutes straight", dur:180 },
  { id:"clean",    name:"Clean Keys",     desc:"Play each chord cleanly (detection)", dur:90 },
  { id:"blind",    name:"Blind Play",     desc:"Play chords from memory (hidden keyboard)", dur:60 },
];

// ── Playing styles ──
var PLAY_STYLES = [
  { name:"Block Chord", level:1, id:"block",
    desc:"Play all notes together at once",
    pattern:["all","all","all","all"], bpm:80 },
  { name:"Arpeggio Up", level:1, id:"arp_up",
    desc:"Play notes one by one from low to high",
    pattern:["1","2","3","1","2","3","1","2"], bpm:100 },
  { name:"Arpeggio Down", level:1, id:"arp_down",
    desc:"Play notes one by one from high to low",
    pattern:["3","2","1","3","2","1","3","2"], bpm:100 },
  { name:"Alberti Bass", level:2, id:"alberti",
    desc:"Classic pattern: low-high-mid-high",
    pattern:["1","3","2","3","1","3","2","3"], bpm:120 },
  { name:"Waltz", level:2, id:"waltz",
    desc:"Bass note then chord, in 3/4 time",
    pattern:["1","all","all","1","all","all"], bpm:90 },
  { name:"Broken Ballad", level:3, id:"broken",
    desc:"Expressive broken chord pattern",
    pattern:["1","2","3","all","3","2","1","all"], bpm:70 },
];

// ── Scale definitions ──
var SCALES = {
  "C Major":      { notes:[60,62,64,65,67,69,71,72], pattern:"W W H W W W H" },
  "A Minor":      { notes:[57,59,60,62,64,65,67,69], pattern:"W H W W H W W" },
  "G Major":      { notes:[55,57,59,60,62,64,66,67], pattern:"W W H W W W H" },
  "D Major":      { notes:[62,64,66,67,69,71,73,74], pattern:"W W H W W W H" },
  "F Major":      { notes:[65,67,69,70,72,74,76,77], pattern:"W W H W W W H" },
  "C Pentatonic": { notes:[60,62,64,67,69,72], pattern:"W W m3 W m3" },
  "A Minor Pent": { notes:[57,60,62,64,67,69], pattern:"m3 W W m3 W" },
  "C Blues":      { notes:[60,63,65,66,67,70,72], pattern:"m3 W H H m3 W" },
};

// ── Transition tips ──
var TRANSITION_TIPS = {
  "C_F":   "Thumb stays on C \u2014 shift fingers up to F position",
  "C_G":   "From C to G(inv1): thumb C\u2192B, middle E\u2192D, pinky G stays",
  "C_Am":  "C and E stay! Only G moves to A. One finger!",
  "C_Em":  "E and G stay \u2014 drop C to B",
  "F_G":   "All fingers step down one key \u2014 smooth slide",
  "G_C":   "Reverse of C\u2192G \u2014 B\u2192C, D\u2192E",
  "Am_Em": "Share E \u2014 move A\u2192G and C\u2192B",
  "Am_F":  "Similar shape \u2014 shift down to F position",
  "Am_Dm": "A stays, C\u2192D and E\u2192F \u2014 two fingers, one step each",
  "Dm_G7": "Shift to G7 shape",
  "G7_C":  "F pulls to E \u2014 the resolution",
  "G_D":   "Move your hand right \u2014 F# is the new note",
  "D_Bm":  "Share D and F# \u2014 just move A\u2192B",
  "Em_D":  "Step up from Em to D shape",
  "C_Cmaj7":"Just add pinky on B",
  "F_Fmaj7":"Just add pinky on E",
  "Am_Am7": "Just add pinky on G",
};

// ── Onboarding placement thresholds ──
var PLACEMENT_TESTS = [
  { prompt:"Play a C major chord (C-E-G)", failsTo:1 },
  { prompt:"Play an F major chord", failsTo:4 },
  { prompt:"Play an Am chord", failsTo:9 },
  { prompt:"Switch between C and Am at 70 BPM", failsTo:11 },
  { prompt:"Play C \u2192 G \u2192 Am \u2192 F", failsTo:15 },
  { prompt:"Play Dm \u2192 G7 \u2192 C", passesTo:21 }
];

// ── Keyboard size configs ──
var KEYBOARD_SIZES = [
  { keys:88, label:"Full Piano (88 keys)", range:[21,108], lhAvailable:true },
  { keys:76, label:"76-key keyboard", range:[28,103], lhAvailable:true },
  { keys:61, label:"61-key keyboard", range:[36,96], lhAvailable:true },
  { keys:49, label:"49-key keyboard", range:[36,84], lhAvailable:true, lhLimited:true },
  { keys:25, label:"25-key mini controller", range:[48,72], lhAvailable:false }
];

// ── Style preferences ──
var STYLE_PREFS = [
  "Pop", "Classical", "Jazz", "Blues", "R&B/Soul",
  "Lo-fi", "Rock", "Gospel", "Film/TV", "Singer-songwriter"
];

// ── Finger exercises (Piano Part 2 from fingering-mastery-module) ──
var FINGER_EXERCISES = [
  // Tier 1: Off-instrument
  { id:"P-OFF-1", tier:1, name:"Table Taps",
    desc:"Both hands flat on table, curved as if on keys. Tap one finger at a time: RH 1-2-3-4-5, then reverse. Then LH. Then both hands simultaneously with opposing fingers.",
    duration:120, frequency:"daily", sessionRange:[1,50], offInstrument:true,
    goal:"Clean, isolated taps. No sympathy movement from neighboring fingers.",
    bpmStart:60, bpmTarget:100 },
  { id:"P-OFF-2", tier:1, name:"Isolated Lifts",
    desc:"Hand flat on table, all fingers pressing down. Lift ONLY the ring finger (4), hold 2 seconds, lower. Then ONLY pinky (5). Then alternate ring/pinky 10 reps.",
    duration:60, frequency:"daily", sessionRange:[1,50], offInstrument:true,
    goal:"Ring lifts without pinky moving. The single most effective isolation exercise." },
  { id:"P-OFF-3", tier:1, name:"Finger Pair Independence",
    desc:"Table surface. Tap pairs keeping other fingers still: Thumb+Pinky (1+5), Index+Ring (2+4), Ring+Pinky (4+5). 10 taps per pair, double reps for weak pairs.",
    duration:120, frequency:"every_other_day", sessionRange:[1,50], offInstrument:true,
    goal:"All pairs tap cleanly without other fingers moving." },

  // Tier 2: On-instrument, single-hand (Sessions 1-14)
  { id:"P-ON-1", tier:2, name:"5-Finger Position",
    desc:"RH fingers 1-2-3-4-5 on C-D-E-F-G. Play up then down. Each note equal volume and duration. Then LH on octave below. Use metronome.",
    duration:120, frequency:"daily", sessionRange:[1,14], offInstrument:false,
    goal:"All 5 notes sound even. Ring finger (4) matches middle finger (3) in volume.",
    bpmStart:60, bpmTarget:90,
    variation:"Dotted rhythm: long-short then short-long patterns to build quick-fire finger control." },
  { id:"P-ON-2", tier:2, name:"Held-Finger Independence",
    desc:"RH on C-D-E-F-G. Hold ALL five keys down. Lift ONLY finger 1, play C, put back. Then finger 2, etc. Challenge: when lifting finger 4, keep finger 3 down.",
    duration:120, frequency:"daily", sessionRange:[4,14], offInstrument:false,
    goal:"Each finger lifts independently without disturbing held neighbors. Cortot isolation principle." },
  { id:"P-ON-3", tier:2, name:"Accent Shift",
    desc:"Play C-D-E-F-G ascending in a loop. Accent finger 1 on first pass, finger 2 on second, etc. Finger 4 accent is hardest.",
    duration:120, frequency:"daily", sessionRange:[8,14], offInstrument:false,
    goal:"Dynamic control per finger. Every accent clearly louder than surrounding notes." },

  // Tier 3: Chord-specific (Sessions 8-30)
  { id:"P-CHORD-1", tier:3, name:"Shape Drop",
    desc:"Hover hand above keyboard in correct chord shape. Drop all fingers simultaneously. ALL notes should sound at exactly the same time. Lift, hover, drop. 10 reps per chord.",
    duration:60, frequency:"daily", sessionRange:[8,30], offInstrument:false,
    goal:"All chord tones sound simultaneously. No late fingers.",
    sessionIntegration:"victoryLap" },
  { id:"P-CHORD-2", tier:3, name:"Silent Transition",
    desc:"Play chord A, then move to chord B with eyes CLOSED. Forces proprioceptive memory \u2014 your hand learns distance by feel, not sight. Start with voice-led transitions.",
    duration:120, frequency:"daily", sessionRange:[9,30], offInstrument:false,
    goal:"Accurate chord placement without looking. Under 1 second transition time." },
  { id:"P-CHORD-3", tier:3, name:"Broken-to-Block",
    desc:"Play chord broken (one note at a time), then blocked (all at once). Alternate: broken, blocked, broken, blocked. Trains both individual placement and simultaneous coordination.",
    duration:120, frequency:"daily", sessionRange:[8,30], offInstrument:false,
    goal:"Smooth alternation between broken and blocked voicing." },
  { id:"P-CHORD-4", tier:3, name:"Voice-Leading Path",
    desc:"Choose a 2-chord transition. Identify which finger stays (shared note) and which moves. Practice moving ONLY the changing fingers. The shared finger doesn't budge.",
    duration:120, frequency:"daily", sessionRange:[9,30], offInstrument:false,
    goal:"Only moving fingers move. Shared-note fingers stay perfectly still.",
    sessionIntegration:"newMove" },

  // Tier 4: Advanced (Sessions 30+)
  { id:"P-ADV-1", tier:4, name:"Hanon #1 (Simplified)",
    desc:"RH: C-E-F-G-A ascending pattern repeating up the keyboard. LH same, one octave lower. Hands separately first, then together.",
    duration:180, frequency:"daily", sessionRange:[30,50], offInstrument:false,
    goal:"EVENNESS, not speed. Every note same volume, same duration.",
    bpmStart:60, bpmTarget:100 },
  { id:"P-ADV-2", tier:4, name:"Thumb Under (Scale Prep)",
    desc:"Play C-D-E (fingers 1-2-3), then pass thumb UNDER to play F (finger 1 again). Continue F-G-A-B-C. Practice the crossing point in isolation: E with finger 3, F with thumb, back and forth.",
    duration:120, frequency:"daily", sessionRange:[30,50], offInstrument:false,
    goal:"Smooth thumb crossing with no bump or accent at the crossing point." },
  { id:"P-ADV-3", tier:4, name:"Trill Builder",
    desc:"Pick two adjacent keys. Alternate as fast as possible: fingers 2-3 (10s fast, 10s rest, 5 reps). Then 3-4 (harder). Then 4-5 (hardest). Count trills per 10 seconds.",
    duration:120, frequency:"every_other_day", sessionRange:[30,50], offInstrument:false,
    goal:"Track trills per 10 seconds. Progress weekly.",
    trackMetric:"trillSpeed" },
  { id:"P-ADV-4", tier:4, name:"Independence Gauntlet",
    desc:"RH on C-D-E-F-G. Play C-E-C-E rapidly (fingers 1-3) while holding D down. Then D-F-D-F (2-4) holding C+E. Then E-G-E-G (3-5) holding C+D. The Cortot gold standard.",
    duration:180, frequency:"every_other_day", sessionRange:[30,50], offInstrument:false,
    goal:"Each finger pair plays freely while others hold. No tension buildup." }
];

// Finger exercise badges
var FINGER_BADGES = [
  { id:"table_tapper",   label:"Table Tapper",   icon:"\u{1F44B}", desc:"7 days of off-instrument exercises" },
  { id:"spider_fingers", label:"Spider Fingers",  icon:"\u{1F577}", desc:"Complete all Tier 2 exercises" },
  { id:"thirty_club",    label:"30 Club",         icon:"\u{1F4AA}", desc:"30 clean chord changes in 60 seconds" },
  { id:"sixty_club",     label:"60 Club",         icon:"\u{1F525}", desc:"60 clean chord changes in 60 seconds" },
  { id:"pinky_power",    label:"Pinky Power",     icon:"\u{1F91A}", desc:"Ring/pinky trill 10 seconds clean" },
  { id:"even_steven",    label:"Even Steven",     icon:"\u{2696}",  desc:"All 5 fingers produce equal volume" },
  { id:"thumb_ninja",    label:"Thumb Ninja",     icon:"\u{1F977}", desc:"Clean thumb-under crossing at 80 BPM" },
  { id:"cortot_master",  label:"Cortot Master",   icon:"\u{1F3B9}", desc:"Complete the Independence Gauntlet" }
];

// Get exercises available for current session
function getAvailableExercises(sessionNum) {
  return FINGER_EXERCISES.filter(function(ex) {
    return sessionNum >= ex.sessionRange[0] && sessionNum <= ex.sessionRange[1];
  });
}

// Get exercises by tier
function getExercisesByTier(tier) {
  return FINGER_EXERCISES.filter(function(ex) { return ex.tier === tier; });
}

// Get warm-up exercise for session start (off-instrument, Tier 1)
function getWarmUpExercise(sessionNum) {
  var available = FINGER_EXERCISES.filter(function(ex) {
    return ex.tier === 1 && sessionNum >= ex.sessionRange[0];
  });
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Get exercise for a specific session integration point
function getSessionExercise(sessionNum, integrationPoint) {
  var available = FINGER_EXERCISES.filter(function(ex) {
    return ex.sessionIntegration === integrationPoint &&
           sessionNum >= ex.sessionRange[0] && sessionNum <= ex.sessionRange[1];
  });
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Piano injury prevention tips
var INJURY_TIPS = [
  "Arm weight, not finger muscle \u2014 drop relaxed arm weight through the keys.",
  "Keep fingers curved. Flat fingers strain your tendons.",
  "Relaxed wrist \u2014 it should float, not lock.",
  "If your forearm feels tight, STOP. Shake out and resume slower.",
  "Ring/pinky exercises every OTHER day \u2014 small muscles need recovery.",
  "Do NOT use grip strengtheners. Piano needs sensitivity, not crushing strength.",
  "Gentle wrist stretches before playing: flexion/extension, 10 seconds each."
];

// Expose as namespaced globals for SparkSuite piano module
window.PIANO_DATA = {
  SCR: PIANO_SCR,
  TAB: PIANO_TAB,
  APP_NAME: PIANO_APP_NAME,
  NOTE_NAMES: NOTE_NAMES,
  FLAT_NAMES: FLAT_NAMES,
  LC: LC,
  LN: LN,
  CHORD_COLORS: CHORD_COLORS,
  CURRICULUM: CURRICULUM,
  CHORDS: CHORDS,
  CHORD_NOTES: CHORD_NOTES,
  LH_PATTERNS: LH_PATTERNS,
  REWARD_PHASES: REWARD_PHASES,
  SESSION_PLANS: SESSION_PLANS,
  SONGS: SONGS,
  BADGES: BADGES,
  DAILY_TYPES: DAILY_TYPES,
  PLAY_STYLES: PLAY_STYLES,
  SCALES: SCALES,
  TRANSITION_TIPS: TRANSITION_TIPS,
  PLACEMENT_TESTS: PLACEMENT_TESTS,
  KEYBOARD_SIZES: KEYBOARD_SIZES,
  STYLE_PREFS: STYLE_PREFS,
  FINGER_EXERCISES: FINGER_EXERCISES,
  FINGER_BADGES: FINGER_BADGES,
  INJURY_TIPS: INJURY_TIPS
};

// Also expose key items as individual globals for piano pages
window.PIANO_CHORDS_FULL = CHORDS;
window.PIANO_SONGS = SONGS;
window.PIANO_SESSIONS = SESSION_PLANS;
window.PIANO_CURRICULUM = CURRICULUM;
window.PIANO_LH_PATTERNS = LH_PATTERNS;
window.PIANO_VOICINGS = CHORD_NOTES;

// Helper functions exposed globally for piano module
window.midiToNote = typeof window.midiToNote === "undefined" ? midiToNote : window.midiToNote;
window.midiToOctave = typeof window.midiToOctave === "undefined" ? midiToOctave : window.midiToOctave;
window.midiToFreq = typeof window.midiToFreq === "undefined" ? midiToFreq : window.midiToFreq;
window.noteToMidi = typeof window.noteToMidi === "undefined" ? noteToMidi : window.noteToMidi;

// Core data exposed globally for piano (namespaced where possible, direct where needed)
// Piano pages and app.js reference CHORDS, SONGS, SESSION_PLANS, CURRICULUM, LC, LN etc directly
window.PIANO_REWARD_PHASES = REWARD_PHASES;
window.PIANO_BADGES = BADGES;
window.PIANO_DAILY_TYPES = DAILY_TYPES;
window.PIANO_SCALES = SCALES;
window.PIANO_FINGER_EXERCISES = FINGER_EXERCISES;
window.PIANO_FINGER_BADGES = FINGER_BADGES;
window.PIANO_INJURY_TIPS = INJURY_TIPS;
window.PIANO_CHORD_COLORS = CHORD_COLORS;
window.PIANO_LC = LC;
window.PIANO_LN = LN;

// Direct globals needed by piano pages (IIFE hides vars, pages reference them bare)
var _exports = {
  DAILY_TYPES:DAILY_TYPES, FINGER_BADGES:FINGER_BADGES, KEYBOARD_SIZES:KEYBOARD_SIZES,
  BADGES:BADGES, REWARD_PHASES:REWARD_PHASES, SCALES:SCALES, FINGER_EXERCISES:FINGER_EXERCISES,
  CHORDS:CHORDS, SONGS:SONGS, SESSION_PLANS:SESSION_PLANS, CURRICULUM:CURRICULUM,
  LC:LC, LN:LN, PLAY_STYLES:PLAY_STYLES, CHORD_COLORS:CHORD_COLORS, INJURY_TIPS:INJURY_TIPS,
  LH_PATTERNS:LH_PATTERNS, PLACEMENT_TESTS:PLACEMENT_TESTS,
  STYLE_PREFS:STYLE_PREFS, CHORD_NOTES:CHORD_NOTES, NOTE_NAMES:NOTE_NAMES, FLAT_NAMES:FLAT_NAMES
};
for (var _k in _exports) { if (_exports.hasOwnProperty(_k) && typeof window[_k] === "undefined") window[_k] = _exports[_k]; }
// TRANSITION_TIPS: stored under a piano-specific global because js/data.js
// unconditionally declares its own guitar TRANSITION_TIPS after this file loads.
window.PIANO_TRANSITION_TIPS = TRANSITION_TIPS;

// Chord/data helper functions needed by piano pages and app engine
window.allChordKeys = allChordKeys;
window.allChords = allChords;
window.findChord = findChord;
window.chordsForLevel = chordsForLevel;
window.chordsUpToLevel = chordsUpToLevel;
window.chordMidi = chordMidi;
window.chordFingers = chordFingers;
window.chordNoteNames = chordNoteNames;
window.getAvailableExercises = getAvailableExercises;
window.getExercisesByTier = getExercisesByTier;
window.getWarmUpExercise = getWarmUpExercise;
window.getSessionExercise = getSessionExercise;

})();
