// js/instruments/bass/data.js
// BassSpark curriculum, notes, sessions, songs
(function() {

// ── Tuning ──
var BASS_STRINGS = [
  { note: "E", freq: 41.20, string: 0 },
  { note: "A", freq: 55.00, string: 1 },
  { note: "D", freq: 73.42, string: 2 },
  { note: "G", freq: 98.00, string: 3 }
];

// ── Level Colors & Names ──
var BASS_LC = {
  1: "#22c55e", 2: "#3b82f6", 3: "#f97316",
  4: "#06b6d4", 5: "#6366f1", 6: "#7c3aed"
};
var BASS_LN = {
  1: "First Groove", 2: "Finding Notes", 3: "Movement",
  4: "Real Bass", 5: "Technique", 6: "Advanced"
};

// ── Curriculum (6 levels) ──
var BASS_CURRICULUM = [
  { num: 1, title: "First Groove", sub: "Simple Riffs", sessions: "1-5",
    skills: ["posture", "plucking", "string_names", "quarter_notes", "metronome"],
    desc: "Play simple riffs in time. Timing before notes.",
    tip: "Focus on keeping steady time with the metronome, not speed.",
    icon: "\uD83C\uDFB5", bpmRange: [60, 70] },
  { num: 2, title: "Finding Notes", sub: "Root Notes", sessions: "6-10",
    skills: ["notes_E_string", "notes_A_string", "root_notes", "note_duration", "timing_stability"],
    desc: "Find notes on the E and A strings. Play root notes to songs.",
    tip: "Every song has a root note pattern. Find the roots first.",
    icon: "\uD83C\uDFBC", bpmRange: [70, 80] },
  { num: 3, title: "Movement", sub: "Fretboard Navigation", sessions: "11-15",
    skills: ["root_fifth", "octaves", "eighth_notes", "major_scale", "minor_scale", "position_shifting"],
    desc: "Move around the fretboard. Build real basslines.",
    tip: "Root-fifth is the most common bassline pattern in all music.",
    icon: "\uD83C\uDFB8", bpmRange: [80, 90] },
  { num: 4, title: "Real Bass", sub: "Groove & Walk", sessions: "16-20",
    skills: ["walking_bass", "passing_notes", "arpeggios", "syncopation", "groove_variations", "drum_loop_playing"],
    desc: "Build real basslines and groove with drums.",
    tip: "Listen to the kick drum. Lock your notes to it.",
    icon: "\uD83E\uDD41", bpmRange: [90, 100] },
  { num: 5, title: "Technique", sub: "Expression", sessions: "21-25",
    skills: ["slides", "hammer_ons", "pull_offs", "ghost_notes", "muting_mastery", "dynamic_control", "groove_accents"],
    desc: "Add expression and dynamics to your playing.",
    tip: "Ghost notes are what make bass grooves feel alive.",
    icon: "\u26A1", bpmRange: [100, 110] },
  { num: 6, title: "Advanced", sub: "Slap & Improv", sessions: "26-30",
    skills: ["slap", "pop", "funk_grooves", "improvisation", "walking_multi_key", "jam_tracks"],
    desc: "Slap bass, funk, improvisation, and jam tracks.",
    tip: "Slap is about the thumb bounce, not force.",
    icon: "\uD83C\uDFC6", bpmRange: [110, 120] }
];

// ── Notes by level (fretboard positions) ──
// Each "chord" is actually a bass note/pattern with fret positions
var BASS_CHORDS = {
  1: [
    { name: "E Open", short: "E", fingers: [], frets: [0, -1, -1, -1], string: 0 },
    { name: "A Open", short: "A", fingers: [], frets: [-1, 0, -1, -1], string: 1 },
    { name: "E2 (Fret 2)", short: "F#", fingers: [[0, 2, 1, "#FF6B6B"]], frets: [2, -1, -1, -1], string: 0 },
    { name: "G (E string)", short: "G", fingers: [[0, 3, 2, "#4ECDC4"]], frets: [3, -1, -1, -1], string: 0 }
  ],
  2: [
    { name: "C (A string)", short: "C", fingers: [[1, 3, 2, "#FF6B6B"]], frets: [-1, 3, -1, -1], string: 1 },
    { name: "D (A string)", short: "D", fingers: [[1, 5, 3, "#4ECDC4"]], frets: [-1, 5, -1, -1], string: 1 },
    { name: "B (A string)", short: "B", fingers: [[1, 2, 1, "#45B7D1"]], frets: [-1, 2, -1, -1], string: 1 },
    { name: "F (E string)", short: "F", fingers: [[0, 1, 1, "#FFE66D"]], frets: [1, -1, -1, -1], string: 0 }
  ],
  3: [
    { name: "Root-Fifth E-B", short: "E5", fingers: [[0, 0, 0, "#FF6B6B"], [1, 2, 2, "#4ECDC4"]], frets: [0, 2, -1, -1] },
    { name: "Root-Fifth A-E", short: "A5", fingers: [[1, 0, 0, "#FF6B6B"], [2, 2, 2, "#4ECDC4"]], frets: [-1, 0, 2, -1] },
    { name: "Octave E", short: "E8", fingers: [[0, 0, 0, "#FF6B6B"], [2, 2, 3, "#45B7D1"]], frets: [0, -1, 2, -1] },
    { name: "Octave A", short: "A8", fingers: [[1, 0, 0, "#FF6B6B"], [3, 2, 3, "#45B7D1"]], frets: [-1, 0, -1, 2] }
  ],
  4: [
    { name: "Walk C-E-G", short: "Cwalk", fingers: [[1, 3, 2, "#FF6B6B"], [2, 2, 1, "#4ECDC4"], [2, 5, 4, "#45B7D1"]], frets: [-1, 3, 2, -1] },
    { name: "Walk G-B-D", short: "Gwalk", fingers: [[0, 3, 2, "#FF6B6B"], [1, 2, 1, "#4ECDC4"], [1, 5, 4, "#45B7D1"]], frets: [3, 2, -1, -1] },
    { name: "Arpeggio Am", short: "Am-arp", fingers: [[1, 0, 0, "#FF6B6B"], [2, 2, 2, "#4ECDC4"], [2, 0, 0, "#45B7D1"]], frets: [-1, 0, 2, -1] },
    { name: "Synco Pattern", short: "Sync", fingers: [[0, 0, 0, "#FF6B6B"]], frets: [0, -1, -1, -1] }
  ],
  5: [
    { name: "Slide E-G", short: "Sl-EG", fingers: [[0, 0, 0, "#FF6B6B"]], frets: [0, -1, -1, -1] },
    { name: "Hammer-on A", short: "HO-A", fingers: [[1, 0, 0, "#FF6B6B"], [1, 2, 2, "#4ECDC4"]], frets: [-1, 0, -1, -1] },
    { name: "Ghost Note", short: "Ghost", fingers: [], frets: [-1, -1, -1, -1] },
    { name: "Muted Groove", short: "Mute", fingers: [], frets: [0, -1, -1, -1] }
  ],
  6: [
    { name: "Slap E", short: "Slap-E", fingers: [[0, 0, 0, "#FF6B6B"]], frets: [0, -1, -1, -1] },
    { name: "Pop G", short: "Pop-G", fingers: [[3, 0, 0, "#4ECDC4"]], frets: [-1, -1, -1, 0] },
    { name: "Funk Pattern", short: "Funk", fingers: [[0, 0, 0, "#FF6B6B"], [3, 2, 3, "#45B7D1"]], frets: [0, -1, -1, 2] },
    { name: "Improv Root", short: "Improv", fingers: [[0, 0, 0, "#FF6B6B"]], frets: [0, -1, -1, -1] }
  ]
};

var BASS_ALL_CHORDS = [];
for (var lv = 1; lv <= 6; lv++) {
  BASS_ALL_CHORDS = BASS_ALL_CHORDS.concat(BASS_CHORDS[lv] || []);
}

// ── Sessions (guided, 30 total) ──
var BASS_SESSIONS = [
  // Level 1: First Groove
  { num: 1, title: "Hello, Bass", level: 1, bpm: 60,
    spark: { text: "Listen to 'Seven Nation Army' — that iconic riff is just one string." },
    newMove: { text: "Find the E string. Pluck it with your index finger.", chord: "E Open" },
    songSlice: { text: "Play the E string in quarter notes along with the metronome." },
    victoryLap: { text: "4 clean plucks in time. You're a bassist!" } },
  { num: 2, title: "Two Strings", level: 1, bpm: 60,
    spark: { text: "Bass players anchor the whole band. Two strings is all you need to start." },
    newMove: { text: "Find the A string. Alternate between E and A.", chord: "A Open" },
    songSlice: { text: "Play E-E-A-A pattern in time." },
    victoryLap: { text: "Smooth string crossing at 60 BPM." } },
  { num: 3, title: "First Riff", level: 1, bpm: 65,
    spark: { text: "Seven Nation Army uses just the E string with simple fret positions." },
    newMove: { text: "Learn the F# on E string (fret 2).", chord: "E2 (Fret 2)" },
    songSlice: { text: "Play the Seven Nation Army riff: E-E-G-E-D-C-B" },
    victoryLap: { text: "Full riff at 65 BPM!" } },
  { num: 4, title: "Groove Lock", level: 1, bpm: 65,
    spark: { text: "The bassist's job is to lock with the drummer. Timing is everything." },
    newMove: { text: "G note on E string (fret 3). Listen for the click.", chord: "G (E string)" },
    songSlice: { text: "Play quarter notes on G, locking to metronome." },
    victoryLap: { text: "8 bars locked to the beat." } },
  { num: 5, title: "Riff Master", level: 1, bpm: 70,
    spark: { text: "Another One Bites The Dust — one of the most iconic bass riffs ever." },
    newMove: { text: "Practice the riff pattern using E and G." },
    songSlice: { text: "Play the riff along with the backing track." },
    victoryLap: { text: "Full riff performance at 70 BPM!" } },
  // Level 2: Finding Notes
  { num: 6, title: "The A String", level: 2, bpm: 70,
    spark: { text: "The A string is where you find C, D, and most root notes." },
    newMove: { text: "C on A string (fret 3). Most important note in Western music.", chord: "C (A string)" },
    songSlice: { text: "Play root notes: C-C-G-G pattern." },
    victoryLap: { text: "Clean C notes ringing out." } },
  { num: 7, title: "Root Motion", level: 2, bpm: 75,
    spark: { text: "Come Together by The Beatles — a masterclass in root note bass." },
    newMove: { text: "D on A string (fret 5).", chord: "D (A string)" },
    songSlice: { text: "Play root notes following a chord chart: C-D-E-A" },
    victoryLap: { text: "Root notes in time across two strings." } },
  { num: 8, title: "Note Duration", level: 2, bpm: 75,
    spark: { text: "Long notes and short notes create groove. Duration matters as much as pitch." },
    newMove: { text: "B on A string (fret 2). Practice letting notes ring vs muting.", chord: "B (A string)" },
    songSlice: { text: "Play With Or Without You — sustained whole notes." },
    victoryLap: { text: "Clean sustained notes, 4 beats each." } },
  { num: 9, title: "Chromatic Walk", level: 2, bpm: 80,
    spark: { text: "Feel Good Inc. uses a hypnotic chromatic pattern." },
    newMove: { text: "F on E string (fret 1). The chromatic note.", chord: "F (E string)" },
    songSlice: { text: "Practice the chromatic walk: E-F-F#-G" },
    victoryLap: { text: "Smooth chromatic walk at 80 BPM." } },
  { num: 10, title: "String Mastery", level: 2, bpm: 80,
    spark: { text: "You now know notes on both the E and A strings. Time to combine them." },
    newMove: { text: "Play patterns crossing between E and A strings freely." },
    songSlice: { text: "Pumped Up Kicks bassline using E and A string notes." },
    victoryLap: { text: "Fluid string crossing with confidence." } }
];

// ── Songs ──
var BASS_SONGS = [
  // Level 1
  { title: "Seven Nation Army", artist: "White Stripes", level: 1, bpm: 60, chords: ["E", "G", "F#"], difficulty: 1 },
  { title: "Another One Bites The Dust", artist: "Queen", level: 1, bpm: 65, chords: ["E", "G", "A"], difficulty: 1 },
  { title: "Sunshine Of Your Love", artist: "Cream", level: 1, bpm: 66, chords: ["E", "G", "A"], difficulty: 2 },
  { title: "Billie Jean", artist: "Michael Jackson", level: 1, bpm: 58, chords: ["F#", "G", "A"], difficulty: 2 },
  { title: "Stand By Me", artist: "Ben E. King", level: 1, bpm: 60, chords: ["A", "F#", "E"], difficulty: 1 },
  // Level 2
  { title: "Come Together", artist: "The Beatles", level: 2, bpm: 75, chords: ["D", "C", "A", "B"], difficulty: 2 },
  { title: "With Or Without You", artist: "U2", level: 2, bpm: 55, chords: ["D", "A", "B", "F#"], difficulty: 1 },
  { title: "Feel Good Inc", artist: "Gorillaz", level: 2, bpm: 80, chords: ["E", "F", "F#", "G"], difficulty: 3 },
  { title: "Pumped Up Kicks", artist: "Foster The People", level: 2, bpm: 63, chords: ["F", "D", "C", "A"], difficulty: 2 },
  { title: "Zombie", artist: "The Cranberries", level: 2, bpm: 83, chords: ["E", "C", "G", "D"], difficulty: 2 },
  // Level 3
  { title: "Longview", artist: "Green Day", level: 3, bpm: 75, chords: ["E5", "A5", "E8"], difficulty: 3 },
  { title: "Under Pressure", artist: "Queen & Bowie", level: 3, bpm: 74, chords: ["E5", "A5", "D"], difficulty: 3 },
  { title: "Sweet Child O Mine", artist: "GNR", level: 3, bpm: 63, chords: ["E5", "A5", "A8"], difficulty: 3 },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", level: 3, bpm: 56, chords: ["E5", "A5", "E8"], difficulty: 2 },
  // Level 4+
  { title: "Money", artist: "Pink Floyd", level: 4, bpm: 62, chords: ["Cwalk", "Gwalk"], difficulty: 4 },
  { title: "Hysteria", artist: "Muse", level: 4, bpm: 93, chords: ["Am-arp", "Cwalk"], difficulty: 5 },
  { title: "Higher Ground", artist: "RHCP", level: 5, bpm: 100, chords: ["Sl-EG", "HO-A"], difficulty: 5 },
  { title: "Superstition", artist: "Stevie Wonder", level: 5, bpm: 100, chords: ["Ghost", "Mute", "Funk"], difficulty: 5 },
  { title: "Come As You Are", artist: "Nirvana", level: 4, bpm: 60, chords: ["Sl-EG", "E5"], difficulty: 3 }
];

// ── Skill Tree ──
var BASS_SKILL_TREE = {
  fundamentals: ["posture", "plucking", "alternating_fingers", "string_names", "quarter_note_timing", "metronome_playing"],
  fretboard: ["notes_E_string", "notes_A_string", "notes_D_string", "notes_G_string", "octaves", "position_shifting", "fretboard_navigation", "root_note_finding"],
  rhythm: ["quarter_notes", "eighth_notes", "rests", "note_duration", "groove_consistency", "syncopation", "swing_feel", "drum_loop_playing"],
  basslines: ["root_notes", "root_fifth", "octaves", "walking_bass", "passing_notes", "arpeggios", "scale_runs", "chord_tones", "groove_patterns", "song_basslines"],
  technique: ["muting_right_hand", "muting_left_hand", "string_crossing", "slides", "hammer_ons", "pull_offs", "ghost_notes", "slap", "pop"]
};

// ── Exercises ──
var BASS_EXERCISES = [
  { id: "B-CHROM", name: "1-2-3-4 Chromatic", desc: "Walk up frets 1-2-3-4 on each string", duration: 60, level: 1 },
  { id: "B-SPIDER", name: "Spider Exercise", desc: "Alternating fingers across strings", duration: 60, level: 1 },
  { id: "B-CROSS", name: "String Crossing", desc: "Alternate between adjacent strings cleanly", duration: 60, level: 2 },
  { id: "B-OCTAVE", name: "Octave Jumps", desc: "Play root then octave on each note", duration: 60, level: 3 },
  { id: "B-SHIFT", name: "Position Shift", desc: "Shift hand position up and down the neck", duration: 60, level: 3 },
  { id: "B-MUTE", name: "Muting Exercise", desc: "Practice left and right hand muting", duration: 60, level: 4 },
  { id: "B-GROOVE", name: "Groove w/ Metronome", desc: "Play a groove pattern locked to the click", duration: 90, level: 2 },
  { id: "B-GHOST", name: "Ghost Notes", desc: "Add ghost notes between beats", duration: 60, level: 5 }
];

// ── Expose globals ──
window.BASS_STRINGS = BASS_STRINGS;
window.BASS_LC = BASS_LC;
window.BASS_LN = BASS_LN;
window.BASS_CURRICULUM = BASS_CURRICULUM;
window.BASS_CHORDS = BASS_CHORDS;
window.BASS_ALL_CHORDS = BASS_ALL_CHORDS;
window.BASS_SESSIONS = BASS_SESSIONS;
window.BASS_SONGS = BASS_SONGS;
window.BASS_SKILL_TREE = BASS_SKILL_TREE;
window.BASS_EXERCISES = BASS_EXERCISES;

})();
