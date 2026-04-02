// ═══════════════════════════════════════════════════════════════════
// ChordSpark Curriculum Data — ADHD-Optimized Guitar Chord Learning
// ═══════════════════════════════════════════════════════════════════

const CHORDS = {
  Em:    { id:"Em",    name:"Em",     fullName:"E minor",       fingers:2, frets:[0,2,2,0,0,0],    fingerMap:[0,2,3,0,0,0],     barFret:0, strings:6, color:"#22c55e", level:1 },
  Em7e:  { id:"Em7e",  name:"Em7",    fullName:"E minor 7 (easy)", fingers:1, frets:[0,2,0,0,0,0], fingerMap:[0,2,0,0,0,0],     barFret:0, strings:6, color:"#4ade80", level:1 },
  E:     { id:"E",     name:"E",      fullName:"E major",       fingers:3, frets:[0,2,2,1,0,0],    fingerMap:[0,3,2,1,0,0],     barFret:0, strings:6, color:"#3b82f6", level:2 },
  Am:    { id:"Am",    name:"Am",     fullName:"A minor",       fingers:3, frets:[-1,0,2,2,1,0],   fingerMap:[0,0,3,2,1,0],     barFret:0, strings:5, color:"#a855f7", level:2 },
  A:     { id:"A",     name:"A",      fullName:"A major",       fingers:3, frets:[-1,0,2,2,2,0],   fingerMap:[0,0,1,2,3,0],     barFret:0, strings:5, color:"#f97316", level:3 },
  D:     { id:"D",     name:"D",      fullName:"D major",       fingers:3, frets:[-1,-1,0,2,3,2],  fingerMap:[0,0,0,1,3,2],     barFret:0, strings:4, color:"#eab308", level:3 },
  G:     { id:"G",     name:"G",      fullName:"G major",       fingers:3, frets:[3,2,0,0,0,3],    fingerMap:[2,1,0,0,0,3],     barFret:0, strings:6, color:"#06b6d4", level:4 },
  C:     { id:"C",     name:"C",      fullName:"C major",       fingers:3, frets:[-1,3,2,0,1,0],   fingerMap:[0,3,2,0,1,0],     barFret:0, strings:5, color:"#ec4899", level:4 },
  E7:    { id:"E7",    name:"E7",     fullName:"E dominant 7",  fingers:2, frets:[0,2,0,1,0,0],    fingerMap:[0,2,0,1,0,0],     barFret:0, strings:6, color:"#6366f1", level:5 },
  A7:    { id:"A7",    name:"A7",     fullName:"A dominant 7",  fingers:2, frets:[-1,0,2,0,2,0],   fingerMap:[0,0,1,0,3,0],     barFret:0, strings:5, color:"#f43f5e", level:5 },
  D7:    { id:"D7",    name:"D7",     fullName:"D dominant 7",  fingers:3, frets:[-1,-1,0,2,1,2],  fingerMap:[0,0,0,3,1,2],     barFret:0, strings:4, color:"#84cc16", level:5 },
  B7:    { id:"B7",    name:"B7",     fullName:"B dominant 7",  fingers:4, frets:[-1,2,1,2,0,2],   fingerMap:[0,2,1,3,0,4],     barFret:0, strings:5, color:"#d946ef", level:5 },
  Dm:    { id:"Dm",    name:"Dm",     fullName:"D minor",       fingers:3, frets:[-1,-1,0,2,3,1],  fingerMap:[0,0,0,2,3,1],     barFret:0, strings:4, color:"#14b8a6", level:6 },
  Em7f:  { id:"Em7f",  name:"Em7*",   fullName:"E minor 7 (full)", fingers:3, frets:[0,2,2,0,3,0], fingerMap:[0,1,2,0,3,0],     barFret:0, strings:6, color:"#10b981", level:6 },
  Cadd9: { id:"Cadd9", name:"Cadd9",  fullName:"C add 9",       fingers:4, frets:[-1,3,2,0,3,0],  fingerMap:[0,2,1,0,3,0],     barFret:0, strings:5, color:"#e11d48", level:6 },
  Fmaj7: { id:"Fmaj7", name:"Fmaj7",  fullName:"F major 7",    fingers:3, frets:[-1,-1,3,2,1,0],  fingerMap:[0,0,3,2,1,0],     barFret:0, strings:4, color:"#0ea5e9", level:7 },
  Fmini: { id:"Fmini", name:"F(mini)",fullName:"F mini barre",  fingers:3, frets:[1,1,3,2,1,1],   fingerMap:["b","b",3,2,"b","b"], barFret:1, strings:4, color:"#0284c7", level:7 },
  F:     { id:"F",     name:"F",      fullName:"F major barre", fingers:4, frets:[1,3,3,2,1,1],   fingerMap:["b",3,4,2,"b","b"],   barFret:1, strings:6, color:"#0369a1", level:7 },
  Bm:    { id:"Bm",    name:"Bm",     fullName:"B minor barre", fingers:4, frets:[-1,2,4,4,3,2],  fingerMap:[0,"b",3,4,2,"b"],     barFret:2, strings:5, color:"#7c3aed", level:8 },
  Pwr:   { id:"Pwr",   name:"E5",     fullName:"Power chord",   fingers:2, frets:[0,2,2,-1,-1,-1],fingerMap:[0,1,2,0,0,0],     barFret:0, strings:3, color:"#dc2626", level:8 },
};

const LEVELS = [
  {
    num: 1, title: "First Spark", subtitle: "Two-Finger Foundation",
    sessions: "1–3", chords: ["Em", "Em7e"],
    badge: "First Strum", badgeIcon: "🎸",
    desc: "THE starter level. Maximum sound, minimum fingers. You'll play a recognizable song in 10 minutes.",
    anchorTip: "Em → Em7: just lift your ring finger. That's a whole new chord.",
    songUnlocks: [
      "Horse With No Name — America",
      "Eleanor Rigby (simplified) — Beatles"
    ],
    transitions: [
      { from: "Em", to: "Em7e", difficulty: 1, anchor: "Middle finger stays on A string, 2nd fret" }
    ]
  },
  {
    num: 2, title: "The Anchor", subtitle: "Shared-Finger Pairs",
    sessions: "4–7", chords: ["E", "Am"],
    badge: "Shape Shifter", badgeIcon: "🔄",
    desc: "Add one finger to Em and you've got E major. Slide that shape and you've got Am. Anchor fingers make it feel easy.",
    anchorTip: "Em → E: middle + ring stay put, just add your index finger.",
    songUnlocks: [
      "Fallin' — Alicia Keys",
      "Twisted — Keith Sweat"
    ],
    transitions: [
      { from: "Em", to: "E", difficulty: 1, anchor: "Middle + ring anchor on A & D strings" },
      { from: "E", to: "Am", difficulty: 2, anchor: "Same shape, shift one string set toward the floor" }
    ]
  },
  {
    num: 3, title: "The Power Trio", subtitle: "The Cowboy Chords",
    sessions: "8–14", chords: ["A", "D"],
    badge: "Cowboy Wrangler", badgeIcon: "🤠",
    desc: "A, D, E — the keys to a massive chunk of popular music. This is the dopamine motherlode.",
    anchorTip: "A → D: index finger anchors near 2nd fret of G string for both.",
    songUnlocks: [
      "Three Little Birds — Bob Marley",
      "Sweet Caroline — Neil Diamond",
      "Hound Dog — Elvis",
      "La Bamba (simplified)",
      "Stir It Up — Bob Marley",
      "Bad Moon Rising — CCR"
    ],
    transitions: [
      { from: "A", to: "D", difficulty: 2, anchor: "Index finger near 2nd fret G string" },
      { from: "A", to: "E", difficulty: 2, anchor: "Index slides, middle + ring shift" },
      { from: "D", to: "A", difficulty: 2, anchor: "Reverse of A→D" }
    ]
  },
  {
    num: 4, title: "Open Road", subtitle: "G and C",
    sessions: "15–22", chords: ["G", "C"],
    badge: "Hit Machine", badgeIcon: "💥",
    desc: "The holy grail. G, C, D, Em unlocks ~60% of popular music. This is where the song library EXPLODES.",
    anchorTip: "G → C: ring finger stays on 3rd fret (moves from low E to A string).",
    songUnlocks: [
      "Knockin' on Heaven's Door — Dylan",
      "I'm Yours — Jason Mraz",
      "Riptide — Vance Joy",
      "Stand By Me — Ben E. King",
      "Love Me Do — Beatles",
      "Wonderwall — Oasis",
      "Redemption Song — Bob Marley",
      "Let It Be (sub Fmaj7) — Beatles",
      "Leaving on a Jet Plane — John Denver"
    ],
    transitions: [
      { from: "G", to: "C", difficulty: 3, anchor: "Ring finger stays on 3rd fret" },
      { from: "G", to: "D", difficulty: 2, anchor: "Middle finger near 2nd fret area" },
      { from: "C", to: "Am", difficulty: 1, anchor: "Index + middle anchor, just lift ring" },
      { from: "G", to: "Em", difficulty: 2, anchor: "Ring lifts, middle shifts" }
    ]
  },
  {
    num: 5, title: "Seventh Wonder", subtitle: "Blues Flavor Chords",
    sessions: "23–28", chords: ["E7", "A7", "D7", "B7"],
    badge: "Blues Authority", badgeIcon: "🎷",
    desc: "You already know these chords — now add flavor. Lift a finger and unlock the blues.",
    anchorTip: "E → E7: remove your ring finger. That's it. One finger LESS = new chord.",
    songUnlocks: [
      "12-Bar Blues in A (genre unlock!)",
      "Folsom Prison Blues — Johnny Cash",
      "Before You Accuse Me — Clapton",
      "Country shuffle patterns"
    ],
    transitions: [
      { from: "E", to: "E7", difficulty: 1, anchor: "Lift ring finger" },
      { from: "A", to: "A7", difficulty: 1, anchor: "Lift middle finger" },
      { from: "E7", to: "A7", difficulty: 2, anchor: "Blues turnaround" },
      { from: "Am", to: "B7", difficulty: 2, anchor: "Ring finger anchors on 2nd fret" }
    ]
  },
  {
    num: 6, title: "Minor Territory", subtitle: "Dm, Em7, Cadd9",
    sessions: "29–34", chords: ["Dm", "Em7f", "Cadd9"],
    badge: "Mood Ring", badgeIcon: "💍",
    desc: "Same chords, different mood. Major vs minor, side by side. Modern pop and indie open up.",
    anchorTip: "C → Cadd9: just add your pinky. Often EASIER than regular C.",
    songUnlocks: [
      "Zombie — Cranberries",
      "Good Riddance — Green Day",
      "Modern pop catalog unlocked"
    ],
    transitions: [
      { from: "Am", to: "Dm", difficulty: 2, anchor: "Index anchors at 1st fret area" },
      { from: "C", to: "Cadd9", difficulty: 1, anchor: "Add pinky — that's it" },
      { from: "G", to: "Cadd9", difficulty: 2, anchor: "Ring-pinky pair on fret 3 shared" }
    ]
  },
  {
    num: 7, title: "The F Barrier", subtitle: "Conquering the Boss Battle",
    sessions: "35–42", chords: ["Fmaj7", "Fmini", "F"],
    badge: "Barre Breaker", badgeIcon: "⚔️",
    desc: "Where most guitarists quit. Not you. Three steps: cheat F → mini barre → full barre. At your pace.",
    anchorTip: "C → Fmaj7: index anchors at 1st fret. Fmaj7 works for 90% of songs.",
    songUnlocks: [
      "Let It Be (with real F) — Beatles",
      "No Woman No Cry — Bob Marley",
      "Key of C fully unlocked"
    ],
    transitions: [
      { from: "C", to: "Fmaj7", difficulty: 2, anchor: "Index anchors on 1st fret" },
      { from: "Fmaj7", to: "G", difficulty: 3, anchor: "No anchor — but you're ready for this" }
    ]
  },
  {
    num: 8, title: "Graduation", subtitle: "Moveable Shapes & Beyond",
    sessions: "43–50", chords: ["Bm", "Pwr"],
    badge: "Chord Master", badgeIcon: "🏆",
    desc: "You're not a beginner anymore. Barre chords, power chords, moveable shapes — the entire fretboard is yours.",
    anchorTip: "Am shape + barre at fret 2 = Bm. You already know this shape.",
    songUnlocks: [
      "Hotel California — Eagles",
      "Creep — Radiohead",
      "Virtually any song in any key"
    ],
    transitions: [
      { from: "Am", to: "Bm", difficulty: 3, anchor: "Am shape moved to 2nd fret with barre" }
    ]
  }
];

const SESSION_PHASES = [
  { name: "Spark",       duration: 60,  color: "#f59e0b", icon: "✨", desc: "Listen to the song you're working toward. Dopamine hit. Goal visualization." },
  { name: "Review Riff", duration: 120, color: "#8b5cf6", icon: "🔁", desc: "Play through yesterday's chord pair. Spaced retrieval." },
  { name: "New Move",    duration: 240, color: "#3b82f6", icon: "🆕", desc: "Learn today's micro-skill — one new chord or transition." },
  { name: "Song Slice",  duration: 240, color: "#22c55e", icon: "🎵", desc: "Apply the new skill in a real song fragment." },
  { name: "Victory Lap", duration: 60,  color: "#ec4899", icon: "🏆", desc: "Play your best progression. Celebrate!" },
];

const XP_TABLE = {
  session: 50, chord: 100, transition: 25,
  song: 150, streak3: 200, streak7: 500, firstTry: 75
};

const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4000, 6000, 8500, 11500, 15000];

const PRACTICE_MODES = [
  { id: "flash",      name: "Chord Flash",       icon: "⚡", desc: "Name appears, you play it. Speed increases." },
  { id: "transition", name: "Transition Trainer", icon: "🔄", desc: "Two chords, metronome clicks, switch on beat." },
  { id: "song",       name: "Song Slice",         icon: "🎵", desc: "Play a 4-bar section of a real song. Loop it." },
  { id: "roulette",   name: "Chord Roulette",     icon: "🎰", desc: "Random chord every 4 beats. Keep up!" },
  { id: "listen",     name: "Listen & Match",     icon: "👂", desc: "Hear a chord, identify from options." },
  { id: "jam",        name: "Free Jam",           icon: "🎸", desc: "Backing track plays, you choose chords." },
  { id: "challenge",  name: "Challenge Mode",     icon: "🏆", desc: "Timed sequences with scoring." },
];

const BADGES = [
  { id: "first-strum",     name: "First Strum",      icon: "🎸", trigger: "Complete first session",     test: p => p.completedSessions > 0 },
  { id: "shape-shifter",   name: "Shape Shifter",    icon: "🔄", trigger: "Learn Em → E → Am",          test: p => ["Em","E","Am"].every(c => p.learnedChords.includes(c)) },
  { id: "cowboy-wrangler", name: "Cowboy Wrangler",  icon: "🤠", trigger: "Master A, D, E",             test: p => ["A","D","E"].every(c => p.learnedChords.includes(c)) },
  { id: "hit-machine",     name: "Hit Machine",      icon: "💥", trigger: "Can play 20+ songs",         test: p => countPlayableSongs(p) >= 20 },
  { id: "blues-authority", name: "Blues Authority",   icon: "🎷", trigger: "Complete 7th chord level",   test: p => ["E7","A7","D7","B7"].every(c => p.learnedChords.includes(c)) },
  { id: "mood-ring",       name: "Mood Ring",        icon: "💍", trigger: "Learn major/minor pairs",    test: p => ["Dm","Em7f","Cadd9"].every(c => p.learnedChords.includes(c)) },
  { id: "barre-breaker",   name: "Barre Breaker",    icon: "⚔️", trigger: "Play F barre chord",         test: p => p.learnedChords.includes("F") },
  { id: "chord-master",    name: "Chord Master",     icon: "🏆", trigger: "Complete all 8 levels",      test: p => p.learnedChords.length >= 20 },
  { id: "song-10",         name: "Song Collector",   icon: "📀", trigger: "Unlock 10 songs",            test: p => countPlayableSongs(p) >= 10 },
  { id: "song-25",         name: "Song Hoarder",     icon: "💿", trigger: "Unlock 25 songs",            test: p => countPlayableSongs(p) >= 25 },
  { id: "iron-fingers",    name: "Iron Fingers",     icon: "🔥", trigger: "30-day streak",              test: p => p.streak >= 30 },
  { id: "comeback-kid",    name: "Comeback Kid",     icon: "💪", trigger: "Return after 7+ day absence",test: p => p.badges.includes("comeback-kid") },
  { id: "session-50",      name: "Session Pro",      icon: "⭐", trigger: "Complete 50 sessions",       test: p => p.completedSessions >= 50 },
];

function countPlayableSongs(progress) {
  let count = 0;
  for (const lvl of LEVELS) {
    if (lvl.chords.every(c => progress.learnedChords.includes(c))) {
      count += lvl.songUnlocks.length;
    }
  }
  return count;
}

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

const ANCHOR_PAIRS = [
  ["Em", "E"],  ["E", "Am"], ["A", "D"],
  ["G", "C"],   ["C", "Am"], ["D", "A"],
  ["E", "E7"],  ["A", "A7"], ["C", "Cadd9"],
];
