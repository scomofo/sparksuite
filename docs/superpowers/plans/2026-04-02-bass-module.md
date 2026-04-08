# BassSpark Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add electric bass as the third instrument in SparkSuite, with timing-first curriculum, 6 levels, groove-focused sessions, and full InstrumentModule interface — playable from the launcher.

**Architecture:** Follows the same pattern as guitar/piano: `register.js` with `getData()`, `ui`, `act()`, `pages`, and the 7 InstrumentModule methods. Bass data lives in `data.js` (curriculum, notes, sessions, songs). Bass uses the shared page system via `getData()` + `UI.chord()` for common pages, with bass-specific pages for groove drills. Fretboard SVG renders 4 strings instead of 6.

**Tech Stack:** Vanilla JavaScript (ES5, IIFEs, window globals)

---

## File Structure

| File | Responsibility | Status |
|------|---------------|--------|
| `js/instruments/bass/register.js` | Instrument registration + InstrumentModule interface | **Create** |
| `js/instruments/bass/data.js` | Curriculum, notes, sessions, songs, skill tree | **Create** |
| `js/instruments/bass/app.js` | Bass act() handler | **Create** |
| `js/instruments/bass/ui.js` | Bass fretboard SVG renderer | **Create** |
| `index.html` | Script tags + enable in launcher | Modify |

---

### Task 1: Create Bass Data

**Files:**
- Create: `js/instruments/bass/data.js`

- [ ] **Step 1: Create the bass data IIFE**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/bass/data.js
git commit -m "feat(bass): create BassSpark data — curriculum, notes, sessions, songs, skill tree"
```

---

### Task 2: Create Bass UI (Fretboard SVG)

**Files:**
- Create: `js/instruments/bass/ui.js`

- [ ] **Step 1: Create the bass fretboard SVG renderer**

```javascript
// js/instruments/bass/ui.js
// Bass fretboard SVG renderer (4 strings)
(function() {

  function bassSVG(noteObj, size, label, animate) {
    if (!noteObj) return "";
    size = size || 120;
    var strings = 4;
    var frets = 5;
    var w = size;
    var h = size * 1.2;
    var padL = 20, padR = 10, padT = 20, padB = 10;
    var fretW = (w - padL - padR) / frets;
    var strH = (h - padT - padB) / (strings - 1);

    var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"' +
      (animate ? ' class="chord-morph"' : '') + '>';

    // Nut
    svg += '<rect x="' + padL + '" y="' + (padT - 2) + '" width="3" height="' + ((strings - 1) * strH + 4) + '" fill="var(--text-primary)" rx="1"/>';

    // Fret lines
    for (var f = 1; f <= frets; f++) {
      var fx = padL + f * fretW;
      svg += '<line x1="' + fx + '" y1="' + padT + '" x2="' + fx + '" y2="' + (padT + (strings - 1) * strH) + '" stroke="var(--border)" stroke-width="1.5"/>';
    }

    // String lines + labels
    var stringNames = ["E", "A", "D", "G"];
    for (var s = 0; s < strings; s++) {
      var sy = padT + s * strH;
      var thick = 3 - s * 0.5;
      svg += '<line x1="' + padL + '" y1="' + sy + '" x2="' + (w - padR) + '" y2="' + sy + '" stroke="var(--text-muted)" stroke-width="' + thick + '" opacity="0.6"/>';
      svg += '<text x="8" y="' + (sy + 4) + '" font-size="10" fill="var(--text-muted)" text-anchor="middle">' + stringNames[s] + '</text>';
    }

    // Finger dots
    var fingers = noteObj.fingers || [];
    for (var i = 0; i < fingers.length; i++) {
      var fg = fingers[i];
      var fStr = fg[0], fFret = fg[1], fFinger = fg[2], fColor = fg[3] || "#FF6B6B";
      if (fFret > 0) {
        var cx = padL + (fFret - 0.5) * fretW;
        var cy = padT + fStr * strH;
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.min(fretW * 0.35, 12) + '" fill="' + fColor + '"/>';
        if (fFinger) {
          svg += '<text x="' + cx + '" y="' + (cy + 4) + '" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">' + fFinger + '</text>';
        }
      }
    }

    // Open string indicators
    var fretArr = noteObj.frets || [];
    for (var s2 = 0; s2 < fretArr.length; s2++) {
      if (fretArr[s2] === 0) {
        var oy = padT + s2 * strH;
        svg += '<circle cx="' + (padL - 6) + '" cy="' + oy + '" r="4" fill="none" stroke="var(--accent)" stroke-width="1.5"/>';
      }
    }

    // Label
    if (label || noteObj.name) {
      svg += '<text x="' + (w / 2) + '" y="' + (h - 2) + '" font-size="12" fill="var(--text-primary)" text-anchor="middle" font-weight="700">' + (label || noteObj.short || noteObj.name) + '</text>';
    }

    svg += '</svg>';
    return svg;
  }

  window.bassSVG = bassSVG;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/bass/ui.js
git commit -m "feat(bass): create bass fretboard SVG renderer (4 strings)"
```

---

### Task 3: Create Bass Act Handler

**Files:**
- Create: `js/instruments/bass/app.js`

- [ ] **Step 1: Create the bass act handler**

```javascript
// js/instruments/bass/app.js — Bass instrument action handler
(function() {

  function bassAct(a, v) {
    var D = SparkInstruments.getActive().getData();

    if (a === "quickStart") {
      var session = SparkSession.buildSession({ mode: "quickStart", level: S.level });
      if (!session) return true;
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      clearTimeout(T.session);
      T.session = setTimeout(tickS, 1000);
      saveState();
      return true;
    }

    if (a === "resumeSession") {
      var session = SparkSession.buildSession({ mode: "chord", chordName: S.lastChordName });
      if (!session) { act("quickStart"); return true; }
      S.sessionMicros = [];
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      clearTimeout(T.session);
      T.session = setTimeout(tickS, 1000);
      return true;
    }

    if (a === "startSession") {
      var session = SparkSession.buildSession({ mode: "chord", chordName: v });
      if (!session) return true;
      S.sessionMicros = [];
      S.lastChordName = session.chordName;
      snd("start");
      S.currentChord = session.chord;
      S.timer = session.duration;
      S.timerActive = true;
      S.selectedVoicing = 0;
      S.screen = SCR.SESSION;
      render();
      clearTimeout(T.session);
      T.session = setTimeout(tickS, 1000);
      saveState();
      return true;
    }

    if (a === "startDrill") {
      var session = SparkSession.buildSession({ mode: "drill", level: S.level });
      if (!session) return true;
      S.drillChords = session.chords;
      S.drillIdx = 0;
      S.drillTimer = session.duration;
      S.drillSwitches = 0;
      S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60;
      S.drillConsecutiveFast = 0;
      S.drillConsecutiveSlow = 0;
      snd("start");
      S.screen = SCR.DRILL;
      render();
      T.drill = setTimeout(tickD, 1000);
      return true;
    }

    if (a === "guidedStart") {
      var plan = D.SESSIONS[S.guidedSession - 1];
      if (!plan) { S.guidedSession = 1; plan = D.SESSIONS[0]; }
      S.guidedPlan = plan;
      S.guidedStep = "spark";
      S.newMovePhase = null;
      S.guidedPaused = false;
      S.screen = SCR.GUIDED;
      snd("start");
      render();
      return true;
    }

    if (a === "guidedComplete") {
      if (S.metronomeOn) stopMetronome();
      var plan = S.guidedPlan;
      if (plan) {
        if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
        if (S.completedGuidedSessions.indexOf(plan.num) < 0) S.completedGuidedSessions.push(plan.num);
        S.xp += 30;
        S.sessions++;
        var today = new Date().toISOString().split("T")[0];
        if (S.lastSessionDate !== today) { S.streak++; S.lastSessionDate = today; }
        S.guidedSession = Math.min(D.SESSIONS.length, plan.num + 1);
        logHistory("guided", "Session " + plan.num + ": " + plan.title, 30);
        checkBadges();
      }
      S.xpToast = { amount: 30, time: Date.now() };
      saveState();
      trigC();
      S.screen = SCR.GUIDED_DONE;
      render();
      return true;
    }

    // Not handled by bass
    return false;
  }

  window.bassAct = bassAct;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/bass/app.js
git commit -m "feat(bass): create bass act() handler with session/drill/guided actions"
```

---

### Task 4: Create Bass Registration

**Files:**
- Create: `js/instruments/bass/register.js`

- [ ] **Step 1: Create the registration with full InstrumentModule interface**

```javascript
// js/instruments/bass/register.js
(function() {
  SparkInstruments.register({
    id: "bassspark",
    instrument: "bass",
    name: "Bass",
    icon: "\uD83C\uDFB8",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null,
    available: true,

    getData: function() {
      return {
        CHORDS: typeof BASS_CHORDS !== "undefined" ? BASS_CHORDS : {},
        ALL_CHORDS: typeof BASS_ALL_CHORDS !== "undefined" ? BASS_ALL_CHORDS : [],
        SESSIONS: typeof BASS_SESSIONS !== "undefined" ? BASS_SESSIONS : [],
        SONGS: typeof BASS_SONGS !== "undefined" ? BASS_SONGS : [],
        LC: typeof BASS_LC !== "undefined" ? BASS_LC : {},
        LN: typeof BASS_LN !== "undefined" ? BASS_LN : {},
        CHORD_NOTES: {},
        STRINGS: typeof BASS_STRINGS !== "undefined" ? BASS_STRINGS : [],
        STRUM_PATTERNS: [],
        FINGER_EXERCISES: typeof BASS_EXERCISES !== "undefined" ? BASS_EXERCISES : [],
        CURRICULUM: typeof BASS_CURRICULUM !== "undefined" ? BASS_CURRICULUM : [],
        SKILL_TREE: typeof BASS_SKILL_TREE !== "undefined" ? BASS_SKILL_TREE : {}
      };
    },

    ui: {
      chord: function(chordObj, size, label, animate) {
        return typeof bassSVG === "function" ? bassSVG(chordObj, size, label, animate) : "";
      },
      header: function() {
        return typeof headerHTML === "function" ? headerHTML() : "";
      },
      tabNav: function() {
        return typeof tabNavHTML === "function" ? tabNavHTML() : "";
      },
      ring: function(pct, size, color) {
        return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
      }
    },

    act: function(a, v) {
      return bassAct(a, v);
    },

    pages: {},

    tabs: ["practice", "drill", "songs", "guide"],

    stemMutePreset: {
      bass: false, vocals: true, drums: true,
      guitar: true, piano: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "bassspark", "bass");
        SparkStorage.save(profile);
      }
    },

    // ── InstrumentModule interface ──

    getSkillTree: function() {
      var D = this.getData();
      var curriculum = D.CURRICULUM || [];
      var branches = [];
      for (var i = 0; i < curriculum.length; i++) {
        var lvl = curriculum[i];
        branches.push({
          id: "level_" + lvl.num,
          label: lvl.title,
          level: lvl.num,
          status: (S.level || 1) >= lvl.num ? "available" : "locked",
          progress: (S.level || 1) > lvl.num ? 100 : ((S.level || 1) === lvl.num ? 50 : 0)
        });
      }
      return { branches: branches };
    },

    getCurriculumMap: function() {
      return this.getData().CURRICULUM || [];
    },

    getExercises: function() {
      return this.getData().FINGER_EXERCISES || [];
    },

    getSongs: function() {
      return this.getData().SONGS || [];
    },

    getDifficultyRules: function(context) {
      if (typeof buildAdaptiveDecision === "function") return buildAdaptiveDecision(context);
      return { targetType: "generic", difficultyAction: "keep", currentValue: 0, nextValue: 0, reason: "No adaptive engine" };
    },

    analyzePerformance: function(sessionData) {
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill, level) {
      var D = this.getData();
      var chords = D.CHORDS[level] || D.CHORDS[1] || [];
      return chords.slice(0, 2);
    }
  });
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/bass/register.js
git commit -m "feat(bass): create BassSpark registration with full InstrumentModule interface"
```

---

### Task 5: Add Script Tags and Enable in Launcher

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add bass script tags**

Find the guitar and piano instrument script blocks. Add bass scripts in the same area:

```html
<!-- Bass instrument -->
<script src="js/instruments/bass/data.js"></script>
<script src="js/instruments/bass/ui.js"></script>
<script src="js/instruments/bass/register.js"></script>
<script src="js/instruments/bass/app.js"></script>
```

Add these after the piano instrument scripts and before the drums registration (if it exists). The order must be: data → ui → register → app.

- [ ] **Step 2: Remove drums "coming soon" stub if it conflicts**

Check if `js/instruments/drums/register.js` exists and is loaded. If so, leave it — it has `available: false`. Bass should appear between piano and drums in the launcher grid.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(bass): add BassSpark script tags to index.html"
```

---

### Task 6: Verify Bass in Launcher

**Files:** None (verification)

- [ ] **Step 1: Open browser and check launcher**

Bass should appear as a third option in the SparkSuite launcher with the bass icon.

- [ ] **Step 2: Click Bass and verify practice tab loads**

Should show Level 1 notes (E Open, A Open, F#, G) with bass fretboard diagrams.

- [ ] **Step 3: Start a Quick Start session**

Should start a 2-minute session with a random bass note from Level 1.

- [ ] **Step 4: Start a Guided Session**

Should show "Hello, Bass" session with spark/newMove/songSlice/victoryLap.

- [ ] **Step 5: Push**

```bash
git push
```
