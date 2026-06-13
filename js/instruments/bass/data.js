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

// ── Target notes per shape (MIDI/mic verification) ──
// Derived from the tablature itself so verification needs no separate map:
// open-string pitch classes (E A D G) offset by each fretted position, from
// both the static frets array and the fingers sequence — walks and arpeggios
// visit notes the static shape alone doesn't hold.
var BASS_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var BASS_OPEN_PCS = [4, 9, 2, 7]; // E A D G
var BASS_CHORD_NOTES = {};
(function() {
  function addNote(name, stringIdx, fret) {
    if (typeof stringIdx !== "number" || stringIdx < 0 || stringIdx >= BASS_OPEN_PCS.length) return;
    if (typeof fret !== "number" || fret < 0) return;
    var note = BASS_NOTE_NAMES[(BASS_OPEN_PCS[stringIdx] + fret) % 12];
    if (!BASS_CHORD_NOTES[name]) BASS_CHORD_NOTES[name] = [];
    if (BASS_CHORD_NOTES[name].indexOf(note) === -1) BASS_CHORD_NOTES[name].push(note);
  }
  for (var i = 0; i < BASS_ALL_CHORDS.length; i++) {
    var shape = BASS_ALL_CHORDS[i];
    if (!shape || !shape.name) continue;
    var f;
    if (Array.isArray(shape.frets)) {
      for (f = 0; f < shape.frets.length; f++) addNote(shape.name, f, shape.frets[f]);
    }
    if (Array.isArray(shape.fingers)) {
      for (f = 0; f < shape.fingers.length; f++) {
        if (Array.isArray(shape.fingers[f])) addNote(shape.name, shape.fingers[f][0], shape.fingers[f][1]);
      }
    }
  }
})();

// ── Sessions (guided, 30 total) ──
var BASS_SESSIONS = [
  // Level 1: First Groove
  { num: 1, title: "Hello, Bass", level: 1, bpm: 60,
    spark: { text: "Listen to 'Seven Nation Army' — that iconic riff is just one string." },
    review: null,
    newMove: { text: "Find the E string. Pluck it with your index finger.", chord: "E Open" },
    songSlice: { text: "Play the E string in quarter notes along with the metronome." },
    victoryLap: { text: "4 clean plucks in time. You're a bassist!" } },
  { num: 2, title: "Two Strings", level: 1, bpm: 60,
    spark: { text: "Bass players anchor the whole band. Two strings is all you need to start." },
    review: null,
    newMove: { text: "Find the A string. Alternate between E and A.", chord: "A Open" },
    songSlice: { text: "Play E-E-A-A pattern in time." },
    victoryLap: { text: "Smooth string crossing at 60 BPM." } },
  { num: 3, title: "First Riff", level: 1, bpm: 65,
    spark: { text: "Seven Nation Army uses just the E string with simple fret positions." },
    review: null,
    newMove: { text: "Learn the F# on E string (fret 2).", chord: "E2 (Fret 2)" },
    songSlice: { text: "Play the Seven Nation Army riff: E-E-G-E-D-C-B" },
    victoryLap: { text: "Full riff at 65 BPM!" } },
  { num: 4, title: "Groove Lock", level: 1, bpm: 65,
    spark: { text: "The bassist's job is to lock with the drummer. Timing is everything." },
    review: null,
    newMove: { text: "G note on E string (fret 3). Listen for the click.", chord: "G (E string)" },
    songSlice: { text: "Play quarter notes on G, locking to metronome." },
    victoryLap: { text: "8 bars locked to the beat." } },
  { num: 5, title: "Riff Master", level: 1, bpm: 70,
    spark: { text: "Another One Bites The Dust — one of the most iconic bass riffs ever." },
    review: null,
    newMove: { text: "Practice the riff pattern using E and G." },
    songSlice: { text: "Play the riff along with the backing track." },
    victoryLap: { text: "Full riff performance at 70 BPM!" } },
  // Level 2: Finding Notes
  { num: 6, title: "The A String", level: 2, bpm: 70,
    spark: { text: "The A string is where you find C, D, and most root notes." },
    review: null,
    newMove: { text: "C on A string (fret 3). Most important note in Western music.", chord: "C (A string)" },
    songSlice: { text: "Play root notes: C-C-G-G pattern." },
    victoryLap: { text: "Clean C notes ringing out." } },
  { num: 7, title: "Root Motion", level: 2, bpm: 75,
    spark: { text: "Come Together by The Beatles — a masterclass in root note bass." },
    review: null,
    newMove: { text: "D on A string (fret 5).", chord: "D (A string)" },
    songSlice: { text: "Play root notes following a chord chart: C-D-E-A" },
    victoryLap: { text: "Root notes in time across two strings." } },
  { num: 8, title: "Note Duration", level: 2, bpm: 75,
    spark: { text: "Long notes and short notes create groove. Duration matters as much as pitch." },
    review: null,
    newMove: { text: "B on A string (fret 2). Practice letting notes ring vs muting.", chord: "B (A string)" },
    songSlice: { text: "Play With Or Without You — sustained whole notes." },
    victoryLap: { text: "Clean sustained notes, 4 beats each." } },
  { num: 9, title: "Chromatic Walk", level: 2, bpm: 80,
    spark: { text: "Feel Good Inc. uses a hypnotic chromatic pattern." },
    review: null,
    newMove: { text: "F on E string (fret 1). The chromatic note.", chord: "F (E string)" },
    songSlice: { text: "Practice the chromatic walk: E-F-F#-G" },
    victoryLap: { text: "Smooth chromatic walk at 80 BPM." } },
  { num: 10, title: "String Mastery", level: 2, bpm: 80,
    spark: { text: "You now know notes on both the E and A strings. Time to combine them." },
    review: null,
    newMove: { text: "Play patterns crossing between E and A strings freely." },
    songSlice: { text: "Pumped Up Kicks bassline using E and A string notes." },
    victoryLap: { text: "Fluid string crossing with confidence." } },
  // Level 3: Movement (Root-Fifth Patterns)
  { num: 11, title: "Root-Fifth Basics", level: 3, bpm: 75,
    spark: { text: "The root-fifth pattern drives Motown, country, and rock. Paul McCartney built a career on it." },
    review: null,
    newMove: { text: "Play the root on E, then the fifth on A string (2 frets up). This is the E5 power shape.", chord: "Root-Fifth E-B" },
    songSlice: { text: "Play root-fifth on E through a simple 4-bar loop." },
    victoryLap: { text: "Solid root-fifth pattern at 75 BPM!" } },
  { num: 12, title: "Fifth on A String", level: 3, bpm: 78,
    spark: { text: "Stand By Me uses a root-fifth pattern that everyone recognizes instantly." },
    review: null,
    newMove: { text: "Root-fifth starting from A string. Root on A, fifth on D string.", chord: "Root-Fifth A-E" },
    songSlice: { text: "Play the Stand By Me bassline using root-fifth shapes." },
    victoryLap: { text: "Two root-fifth shapes in the bag!" } },
  { num: 13, title: "Octave Power", level: 3, bpm: 80,
    spark: { text: "Octaves add depth. Flea, Jaco, and Geddy Lee all use octave jumps constantly." },
    review: null,
    newMove: { text: "Play E open, then its octave on the D string (fret 2). Same note, higher pitch.", chord: "Octave E" },
    songSlice: { text: "Play a root-octave groove alternating every 2 beats." },
    victoryLap: { text: "Clean octave jumps across two strings!" } },
  { num: 14, title: "Eighth Note Drive", level: 3, bpm: 85,
    spark: { text: "Eighth notes double the energy. Smells Like Teen Spirit is driven by pumping eighth notes." },
    review: null,
    newMove: { text: "Play two notes per beat instead of one. Keep them even and locked to the click." },
    songSlice: { text: "Play the Smells Like Teen Spirit bassline with eighth note feel." },
    victoryLap: { text: "Driving eighth notes at 85 BPM!" } },
  { num: 15, title: "Major Scale Run", level: 3, bpm: 90,
    spark: { text: "The major scale is the backbone of all Western music. Learn it and you unlock every song." },
    review: null,
    newMove: { text: "Play the G major scale starting from E string fret 3: G-A-B-C-D-E-F#-G." },
    songSlice: { text: "Use scale notes to connect root-fifth patterns in Sweet Child O Mine." },
    victoryLap: { text: "Full major scale run connected to real music!" } },
  // Level 4: Real Bass (Walking Patterns)
  { num: 16, title: "Walking Intro", level: 4, bpm: 80,
    spark: { text: "Walking bass connects chords with stepwise motion. It is the heartbeat of jazz and blues." },
    review: null,
    newMove: { text: "Walk from C to G using passing notes: C-D-E-F#-G. Every note leads to the next.", chord: "Walk C-E-G" },
    songSlice: { text: "Play a 4-bar walking line over a C-G chord progression." },
    victoryLap: { text: "Your first walking bassline!" } },
  { num: 17, title: "Walk the Changes", level: 4, bpm: 84,
    spark: { text: "Money by Pink Floyd uses a walking pattern in 7/4 time. Walking bass can go anywhere." },
    review: null,
    newMove: { text: "Walk from G down to C: G-F#-E-D-C. Practice descending walks.", chord: "Walk G-B-D" },
    songSlice: { text: "Walk up and down between G and C over 8 bars." },
    victoryLap: { text: "Ascending and descending walks connected!" } },
  { num: 18, title: "Arpeggio Shapes", level: 4, bpm: 88,
    spark: { text: "Arpeggios outline the chord. Hysteria by Muse is one giant arpeggio riff." },
    review: null,
    newMove: { text: "Play Am arpeggio: A-C-E. Hit the root, third, and fifth of the chord.", chord: "Arpeggio Am" },
    songSlice: { text: "Arpeggiate through an Am-C-G progression, 4 beats each." },
    victoryLap: { text: "Smooth arpeggios outlining chord changes!" } },
  { num: 19, title: "Syncopation", level: 4, bpm: 92,
    spark: { text: "Syncopation means accenting the off-beats. It is what makes funk and R&B grooves feel alive." },
    review: null,
    newMove: { text: "Play notes on the and of beats 2 and 4. Feel the push against the click.", chord: "Synco Pattern" },
    songSlice: { text: "Play a syncopated groove over a simple two-chord vamp." },
    victoryLap: { text: "Off-beat syncopation locked in at 92 BPM!" } },
  { num: 20, title: "Groove with Drums", level: 4, bpm: 96,
    spark: { text: "The bass and drums are one unit. Lock your notes to the kick drum and everything grooves." },
    review: null,
    newMove: { text: "Listen to the kick pattern. Place your root notes right on top of each kick hit." },
    songSlice: { text: "Play along with a drum loop, matching the kick pattern with root notes and fills." },
    victoryLap: { text: "Locked in with the drums. You are the groove!" } }
];

// ── Songs ──
var BASS_SONGS = [
  // Level 1
  { title: "Seven Nation Army", artist: "White Stripes", level: 1, bpm: 60, chords: ["E", "G", "F#"], difficulty: 1, midi: "content/songs/midi/seven_nation_army.mid" },
  { title: "Another One Bites The Dust", artist: "Queen", level: 1, bpm: 65, chords: ["E", "G", "A"], difficulty: 1, midi: "content/songs/midi/another_one_bites_the_dust.mid" },
  { title: "Sunshine Of Your Love", artist: "Cream", level: 1, bpm: 66, chords: ["E", "G", "A"], difficulty: 2, midi: "content/songs/midi/sunshine_of_your_love.mid" },
  { title: "Billie Jean", artist: "Michael Jackson", level: 1, bpm: 58, chords: ["F#", "G", "A"], difficulty: 2, midi: "content/songs/midi/billie_jean.mid" },
  { title: "Stand By Me", artist: "Ben E. King", level: 1, bpm: 60, chords: ["A", "F#", "E"], difficulty: 1, midi: "content/songs/midi/stand_by_me.mid" },
  // Level 2
  { title: "Come Together", artist: "The Beatles", level: 2, bpm: 75, chords: ["D", "C", "A", "B"], difficulty: 2, midi: "content/songs/midi/come_together.mid" },
  { title: "With Or Without You", artist: "U2", level: 2, bpm: 55, chords: ["D", "A", "B", "F#"], difficulty: 1, midi: "content/songs/midi/with_or_without_you.mid" },
  { title: "Feel Good Inc", artist: "Gorillaz", level: 2, bpm: 80, chords: ["E", "F", "F#", "G"], difficulty: 3, midi: "content/songs/midi/feel_good_inc.mid" },
  { title: "Pumped Up Kicks", artist: "Foster The People", level: 2, bpm: 63, chords: ["F", "D", "C", "A"], difficulty: 2, midi: "content/songs/midi/pumped_up_kicks.mid" },
  { title: "Zombie", artist: "The Cranberries", level: 2, bpm: 83, chords: ["E", "C", "G", "D"], difficulty: 2, midi: "content/songs/midi/zombie.mid" },
  // Level 3
  { title: "Longview", artist: "Green Day", level: 3, bpm: 75, chords: ["E5", "A5", "E8"], difficulty: 3, midi: "content/songs/midi/longview.mid" },
  { title: "Under Pressure", artist: "Queen & Bowie", level: 3, bpm: 74, chords: ["E5", "A5", "D"], difficulty: 3, midi: "content/songs/midi/under_pressure.mid" },
  { title: "Sweet Child O Mine", artist: "GNR", level: 3, bpm: 63, chords: ["E5", "A5", "A8"], difficulty: 3, midi: "content/songs/midi/sweet_child_o_mine.mid" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", level: 3, bpm: 56, chords: ["E5", "A5", "E8"], difficulty: 2, midi: "content/songs/midi/smells_like_teen_spirit.mid" },
  // Level 4+
  { title: "Money", artist: "Pink Floyd", level: 4, bpm: 62, chords: ["Cwalk", "Gwalk"], difficulty: 4, midi: "content/songs/midi/money.mid" },
  { title: "Hysteria", artist: "Muse", level: 4, bpm: 93, chords: ["Am-arp", "Cwalk"], difficulty: 5, midi: "content/songs/midi/hysteria.mid" },
  { title: "Higher Ground", artist: "RHCP", level: 5, bpm: 100, chords: ["Sl-EG", "HO-A"], difficulty: 5, midi: "content/songs/midi/higher_ground.mid" },
  { title: "Superstition", artist: "Stevie Wonder", level: 5, bpm: 100, chords: ["Ghost", "Mute", "Funk"], difficulty: 5 },
  { title: "Come As You Are", artist: "Nirvana", level: 4, bpm: 60, chords: ["Sl-EG", "E5"], difficulty: 3, midi: "content/songs/midi/come_as_you_are.mid" },
  // Longview, Under Pressure, and Money already appear above with shape-based
  // chords and MIDI paths — this later plain-letter batch duplicated them.
  { title: "Schism", artist: "Tool", level: 5, bpm: 87, chords: ["E", "A", "D", "G"], difficulty: 4 },
  { title: "YYZ", artist: "Rush", level: 5, bpm: 105, chords: ["A", "E", "B", "F#"], difficulty: 5 },
  { title: "My Generation", artist: "The Who", level: 2, bpm: 96, chords: ["G", "F", "E"], difficulty: 2 }
];

// ── Skill Tree ──
var BASS_SKILL_TREE = {
  fundamentals: ["posture", "plucking", "alternating_fingers", "string_names", "quarter_note_timing", "metronome_playing"],
  fretboard: ["notes_E_string", "notes_A_string", "notes_D_string", "notes_G_string", "octaves", "position_shifting", "fretboard_navigation", "root_note_finding"],
  rhythm: ["quarter_notes", "eighth_notes", "rests", "note_duration", "groove_consistency", "syncopation", "swing_feel", "drum_loop_playing"],
  basslines: ["root_notes", "root_fifth", "octaves", "walking_bass", "passing_notes", "arpeggios", "scale_runs", "chord_tones", "groove_patterns", "song_basslines"],
  technique: ["muting_right_hand", "muting_left_hand", "string_crossing", "slides", "hammer_ons", "pull_offs", "ghost_notes", "slap", "pop"],
  performance: ["funk_grooves", "groove_accents", "improvisation", "walking_multi_key", "jam_tracks"]
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
  { id: "B-GHOST", name: "Ghost Notes", desc: "Add ghost notes between beats", duration: 60, level: 5 },
  { id: "B-ROOT5", name: "Root-Fifth Lock", desc: "Alternate root and fifth on each chord, locked to metronome clicks", duration: 60, level: 3 },
  { id: "B-WALK", name: "Walking Quarter Notes", desc: "Walk through chord tones on quarter notes, building bass lines step by step", duration: 90, level: 4 },
  { id: "B-SYNC", name: "Syncopation Drill", desc: "Play off-beat eighth notes with anticipation, feel the push against the pulse", duration: 60, level: 4 },
  { id: "B-SLAP", name: "Slap Basics", desc: "Thumb slap technique on E and A strings, focus on clean percussive tone", duration: 60, level: 6 },
  { id: "B-POP", name: "Pop Technique", desc: "Index finger pop on D and G strings, snap the string for a bright attack", duration: 60, level: 6 },
  { id: "B-HAMMER", name: "Hammer-On Chains", desc: "Legato hammer-on sequences ascending the neck, smooth connected notes", duration: 60, level: 5 },
  { id: "B-PULL", name: "Pull-Off Chains", desc: "Legato pull-off sequences descending the neck, maintain even volume", duration: 60, level: 5 },
  { id: "B-FUNK", name: "Funk Groove", desc: "Combine ghost notes, slap, and pop into a funky groove pattern", duration: 90, level: 6 }
];

// ── Expose globals ──
window.BASS_STRINGS = BASS_STRINGS;
window.BASS_LC = BASS_LC;
window.BASS_LN = BASS_LN;
window.BASS_CURRICULUM = BASS_CURRICULUM;
window.BASS_CHORDS = BASS_CHORDS;
window.BASS_ALL_CHORDS = BASS_ALL_CHORDS;
window.BASS_CHORD_NOTES = BASS_CHORD_NOTES;
window.BASS_SESSIONS = BASS_SESSIONS;
window.BASS_SONGS = BASS_SONGS;
window.BASS_SKILL_TREE = BASS_SKILL_TREE;
window.BASS_EXERCISES = BASS_EXERCISES;

})();
