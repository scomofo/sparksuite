// ===== SCREEN & TAB CONSTANTS =====
var SCR={
  HOME:"home",SESSION:"session",COMPLETE:"complete",
  DRILL:"drill",DRILL_DONE:"drillDone",DAILY:"daily",
  QUIZ:"quiz",STRUM:"strumDetail",SONG:"songDetail",
  SONG_DONE:"songDone",STEMS:"stems",GUIDED:"guided",GUIDED_DONE:"guidedDone",
  PERFORM:"perform",PERFORM_DONE:"performDone",
  PERFORM_SONG:"performSong",
  PERF_STATS:"perfStats",
  PERF_EDITOR:"perfEditor",
  SKILL_TREE:"skillTree",
  PLAN:"practicePlan",
  PERFORM_CALIBRATE:"perfCalibrate",
  MIDI_SETTINGS:"midi_settings",
  MIDI_IMPORT:"midi_import",
  CLOUD_SETTINGS:"cloud_settings",
  CURRICULUM:"curriculum",
  RECOMMENDATIONS:"recommendations",
  CAREER:"career",
  INSIGHTS:"insights",
  CHALLENGES:"challenges",
  HOME_DASH:"homeDash",
  SETTINGS:"settings",
  ONBOARDING:"onboarding",
  LAUNCHER:"launcher"
};
var TAB={
  PRACTICE:"practice",DRILL:"drill",DAILY:"daily",QUIZ:"quiz",
  EAR:"ear",STRUM:"strum",SONGS:"songs",RHYTHM:"rhythm",RUNNER:"runner",
  BUILD:"build",TUNER:"tuner",DUAL:"dual",STATS:"stats",GUIDE:"guide"
};

// ===== DUAL-INSTRUMENT DATA (Pianospark + Chordspark integration) =====
// Piano chord voicings: notes (octave-qualified) + RH finger IDs (1=thumb..5=pinky)
var PIANO_CHORDS={
  "C Major":{notes:["G3","C4","E4"],fingers:[1,2,5],quality:"Major"},
  "F Major":{notes:["A3","C4","F4"],fingers:[1,2,5],quality:"Major"},
  "G Major":{notes:["G3","B3","D4"],fingers:[1,2,4],quality:"Major"},
  "A Minor":{notes:["A3","C4","E4"],fingers:[1,2,5],quality:"Minor"},
  "D Minor":{notes:["A3","D4","F4"],fingers:[1,2,5],quality:"Minor"},
  "D Major":{notes:["F#3","A3","D4"],fingers:[1,2,5],quality:"Major"},
  "E Minor":{notes:["G3","B3","E4"],fingers:[1,2,5],quality:"Minor"},
  "A Major":{notes:["A3","C#4","E4"],fingers:[1,2,5],quality:"Major"},
  "E Major":{notes:["G#3","B3","E4"],fingers:[1,2,5],quality:"Major"}
};

// ChordEngine: dynamic chord calculation for chords not in PIANO_CHORDS
var ChordEngine={
  NOTES:["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
  intervals:{Major:[0,4,7],Minor:[0,3,7]},
  get:function(root,quality){
    quality=quality||"Major";
    var idx=this.NOTES.indexOf(root);
    if(idx===-1)return null;
    var ivs=this.intervals[quality]||this.intervals.Major;
    return ivs.map(function(i){return ChordEngine.NOTES[(idx+i)%12];});
  }
};

// Guitar anchor mapping: Ring finger stays locked on B-string 3rd fret during G→Cadd9→D
var GUITAR_ANCHOR={
  targetString:4, // B string (0-indexed from low E)
  fret:3,
  finger:3, // ring finger
  activeChords:["G Major","C Major","Cadd9","D Major"],
  instruction:"Lock Ring Finger on B-string 3rd fret throughout G-C-D transitions."
};

// ===== CONSTANTS =====
var NOTE_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var GUITAR_STRINGS=[{note:"E",freq:82.41},{note:"A",freq:110},{note:"D",freq:146.83},{note:"G",freq:196},{note:"B",freq:246.94},{note:"E",freq:329.63}];
var STRING_NAMES=["E","A","D","G","B","e"];
var LC={1:"#22c55e",2:"#3b82f6",3:"#f97316",4:"#06b6d4",5:"#6366f1",6:"#14b8a6",7:"#0369a1",8:"#7c3aed"};
var LN={1:"First Spark",2:"The Anchor",3:"Power Trio",4:"Open Road",5:"Seventh Wonder",6:"Minor Territory",7:"The F Barrier",8:"Graduation"};

// ===== CHORDS =====
// Each chord: {name, short, fingers:[[string,fret,fingerNum,color],...], frets:[per string, -1=muted], open:[bool per string], muted:[string indices], barFret?, barStrings?}
var CHORDS={
1:[
  // --- Level 1: First Spark (Two-Finger) ---
  {name:"E Minor",short:"Em",fingers:[[1,2,2,"#FF6B6B"],[2,2,3,"#4ECDC4"]],frets:[0,2,2,0,0,0],open:[true,false,false,true,true,true],muted:[]},
  {name:"Em7",short:"Em7",fingers:[[1,2,2,"#FF6B6B"]],frets:[0,2,0,0,0,0],open:[true,false,true,true,true,true],muted:[]}
],
2:[
  // --- Level 2: The Anchor (Shared-Finger) ---
  {name:"E Major",short:"E",fingers:[[3,1,1,"#FF6B6B"],[1,2,2,"#4ECDC4"],[2,2,3,"#45B7D1"]],frets:[0,2,2,1,0,0],open:[true,false,false,false,true,true],muted:[]},
  {name:"A Minor",short:"Am",fingers:[[4,1,1,"#FF6B6B"],[2,2,2,"#4ECDC4"],[3,2,3,"#45B7D1"]],frets:[-1,0,2,2,1,0],open:[false,true,false,false,false,true],muted:[0]}
],
3:[
  // --- Level 3: Power Trio (Cowboy Chords) ---
  {name:"A Major",short:"A",fingers:[[2,2,2,"#FF6B6B"],[3,2,3,"#4ECDC4"],[4,2,4,"#45B7D1"]],frets:[-1,0,2,2,2,0],open:[false,true,false,false,false,true],muted:[0]},
  {name:"D Major",short:"D",fingers:[[3,2,1,"#FF6B6B"],[4,3,2,"#4ECDC4"],[5,2,3,"#45B7D1"]],frets:[-1,-1,0,2,3,2],open:[false,false,true,false,false,false],muted:[0,1]}
],
4:[
  // --- Level 4: Open Road (G and C) ---
  {name:"G Major",short:"G",fingers:[[0,3,2,"#FF6B6B"],[1,2,1,"#4ECDC4"],[5,3,3,"#45B7D1"]],frets:[3,2,0,0,0,3],open:[false,false,true,true,true,false],muted:[]},
  {name:"C Major",short:"C",fingers:[[1,3,3,"#FF6B6B"],[2,2,2,"#4ECDC4"],[4,1,1,"#45B7D1"]],frets:[-1,3,2,0,1,0],open:[false,false,false,true,false,true],muted:[0]}
],
5:[
  // --- Level 5: Seventh Wonder (Blues) ---
  {name:"E7",short:"E7",fingers:[[3,1,1,"#FF6B6B"],[1,2,2,"#4ECDC4"]],frets:[0,2,0,1,0,0],open:[true,false,true,false,true,true],muted:[]},
  {name:"A7",short:"A7",fingers:[[2,2,2,"#FF6B6B"],[4,2,3,"#4ECDC4"]],frets:[-1,0,2,0,2,0],open:[false,true,false,true,false,true],muted:[0]},
  {name:"D7",short:"D7",fingers:[[3,2,1,"#FF6B6B"],[4,1,2,"#4ECDC4"],[5,2,3,"#45B7D1"]],frets:[-1,-1,0,2,1,2],open:[false,false,true,false,false,false],muted:[0,1]},
  {name:"B7",short:"B7",fingers:[[1,2,2,"#FF6B6B"],[2,1,1,"#4ECDC4"],[3,2,3,"#45B7D1"],[5,2,4,"#FFE66D"]],frets:[-1,2,1,2,0,2],open:[false,false,false,false,true,false],muted:[0]},
  {name:"Am7",short:"Am7",fingers:[[4,1,1,"#FF6B6B"],[2,2,2,"#4ECDC4"]],frets:[-1,0,2,0,1,0],open:[false,true,false,true,false,true],muted:[0]},
  {name:"G7",short:"G7",fingers:[[0,3,3,"#FF6B6B"],[1,2,2,"#4ECDC4"],[5,1,1,"#45B7D1"]],frets:[3,2,0,0,0,1],open:[false,false,true,true,true,false],muted:[]},
  {name:"C7",short:"C7",fingers:[[1,3,4,"#FF6B6B"],[2,2,3,"#4ECDC4"],[3,3,2,"#45B7D1"],[4,1,1,"#FFE66D"]],frets:[-1,3,2,3,1,0],open:[false,false,false,false,false,true],muted:[0]},
  {name:"Dm7",short:"Dm7",fingers:[[3,2,2,"#FF6B6B"],[4,1,1,"#4ECDC4"],[5,1,3,"#45B7D1"]],frets:[-1,-1,0,2,1,1],open:[false,false,true,false,false,false],muted:[0,1]}
],
6:[
  // --- Level 6: Minor Territory ---
  {name:"D Minor",short:"Dm",fingers:[[5,1,1,"#FF6B6B"],[3,2,2,"#4ECDC4"],[4,3,3,"#45B7D1"]],frets:[-1,-1,0,2,3,1],open:[false,false,true,false,false,false],muted:[0,1]},
  {name:"Cadd9",short:"Cadd9",fingers:[[1,3,3,"#FF6B6B"],[2,2,2,"#4ECDC4"],[4,3,4,"#45B7D1"]],frets:[-1,3,2,0,3,0],open:[false,false,false,true,false,true],muted:[0]},
  {name:"Dsus2",short:"Dsus2",fingers:[[3,2,1,"#FF6B6B"],[4,3,3,"#4ECDC4"]],frets:[-1,-1,0,2,3,0],open:[false,false,true,false,false,true],muted:[0,1]},
  {name:"Dsus4",short:"Dsus4",fingers:[[3,2,1,"#FF6B6B"],[4,3,3,"#4ECDC4"],[5,3,4,"#45B7D1"]],frets:[-1,-1,0,2,3,3],open:[false,false,true,false,false,false],muted:[0,1]},
  {name:"Asus2",short:"Asus2",fingers:[[2,2,1,"#FF6B6B"],[3,2,2,"#4ECDC4"]],frets:[-1,0,2,2,0,0],open:[false,true,false,false,true,true],muted:[0]},
  {name:"Em7 Full",short:"Em7*",fingers:[[1,2,1,"#FF6B6B"],[2,2,2,"#4ECDC4"],[4,3,3,"#45B7D1"]],frets:[0,2,2,0,3,0],open:[true,false,false,true,false,true],muted:[]}
],
7:[
  // --- Level 7: The F Barrier ---
  {name:"F Major 7",short:"Fmaj7",fingers:[[2,3,3,"#FF6B6B"],[3,2,2,"#4ECDC4"],[4,1,1,"#45B7D1"]],frets:[-1,-1,3,2,1,0],open:[false,false,false,false,false,true],muted:[0,1]},
  {name:"F Mini Barre",short:"F(m)",fingers:[[0,1,1,"#FF6B6B"],[1,1,1,"#FF6B6B"],[2,3,3,"#4ECDC4"],[3,2,2,"#45B7D1"]],frets:[1,1,3,2,1,1],open:[],muted:[],barFret:1,barStrings:[0,5]},
  {name:"F Major",short:"F",fingers:[[2,3,3,"#4ECDC4"],[3,2,2,"#45B7D1"]],frets:[-1,-1,3,2,1,1],open:[],muted:[0,1],barFret:1,barStrings:[4,5]}
],
8:[
  // --- Level 8: Graduation ---
  {name:"B Minor",short:"Bm",fingers:[[1,2,1,"#FF6B6B"],[2,4,3,"#4ECDC4"],[3,4,4,"#45B7D1"],[4,3,2,"#FFE66D"]],frets:[-1,2,4,4,3,2],open:[],muted:[0],barFret:2,barStrings:[1,5]},
  {name:"E5 Power",short:"E5",fingers:[[1,2,1,"#FF6B6B"],[2,2,3,"#4ECDC4"]],frets:[0,2,2,-1,-1,-1],open:[true,false,false,false,false,false],muted:[3,4,5]},
  {name:"F# Minor",short:"F#m",fingers:[[2,4,3,"#4ECDC4"],[3,4,4,"#45B7D1"],[4,2,1,"#FF6B6B"]],frets:[-1,-1,4,4,2,2],open:[],muted:[0,1],barFret:2,barStrings:[4,5]},
  {name:"A/C#",short:"A/C#",fingers:[[1,4,4,"#FF6B6B"],[2,2,1,"#4ECDC4"],[3,2,2,"#45B7D1"],[4,2,3,"#FFE66D"]],frets:[-1,4,2,2,2,0],open:[false,false,false,false,false,true],muted:[0]},
  {name:"D/F#",short:"D/F#",fingers:[[0,2,1,"#FF6B6B"],[3,2,2,"#4ECDC4"],[4,3,3,"#45B7D1"],[5,2,4,"#FFE66D"]],frets:[2,0,0,2,3,2],open:[false,true,true,false,false,false],muted:[]},
  {name:"G Minor",short:"Gm",fingers:[[0,3,1,"#FF6B6B"],[1,3,1,"#FF6B6B"],[2,5,3,"#4ECDC4"],[3,5,4,"#45B7D1"],[4,3,1,"#FF6B6B"],[5,3,1,"#FF6B6B"]],frets:[3,5,5,3,3,3],open:[],muted:[],barFret:3,barStrings:[0,5]},
  {name:"C Minor",short:"Cm",fingers:[[1,3,1,"#FF6B6B"],[2,5,3,"#4ECDC4"],[3,5,4,"#45B7D1"],[4,4,2,"#FFE66D"],[5,3,1,"#FF6B6B"]],frets:[-1,3,5,5,4,3],open:[],muted:[0],barFret:3,barStrings:[1,5]}
]};

var ALL_CHORDS=[].concat(CHORDS[1],CHORDS[2],CHORDS[3],CHORDS[4],CHORDS[5],CHORDS[6],CHORDS[7],CHORDS[8]);

// ===== CHORD NOTES (pitch classes for detection) =====
// NOTE: When adding a chord to CHORDS, add its pitch classes here too (keyed by full name).
var CHORD_NOTES={
  // Original
  "E Major":["E","G#","B"],"A Major":["A","C#","E"],"D Major":["D","F#","A"],
  "G Major":["G","B","D"],"C Major":["C","E","G"],"E Minor":["E","G","B"],
  "A Minor":["A","C","E"],"D Minor":["D","F","A"],"F Major":["F","A","C"],
  // New Level 1
  "E7":["E","G#","B","D"],"A7":["A","C#","E","G"],"D7":["D","F#","A","C"],
  // New Level 2
  "Am7":["A","C","E","G"],"Em7":["E","G","B","D"],"Dm7":["D","F","A","C"],
  "G7":["G","B","D","F"],"C7":["C","E","G","A#"],
  "Cadd9":["C","E","G","D"],"Dsus2":["D","E","A"],"Dsus4":["D","G","A"],"Asus2":["A","B","E"],
  // New Level 3
  "B7":["B","D#","F#","A"],"B Minor":["B","D","F#"],"F# Minor":["F#","A","C#"],
  "A/C#":["C#","A","E"],"D/F#":["F#","D","A"],
  // New chords
  "F Major 7":["F","A","C","E"],"G Minor":["G","A#","D"],"C Minor":["C","D#","G"],
  "Em7 Full":["E","G","B","D"],
  "F Mini Barre":["F","A","C"],
  "E5 Power":["E","B"]
};

// Integrity check: warn at startup if any chord in CHORDS is missing from CHORD_NOTES
(function(){
  for(var _i=0;_i<ALL_CHORDS.length;_i++){
    if(!CHORD_NOTES[ALL_CHORDS[_i].name]){
      console.warn("ChordSpark: chord '"+ALL_CHORDS[_i].name+"' has no entry in CHORD_NOTES — chord detection will not work for it");
    }
  }
})();

// Maps chord short names to their curriculum level — derived from CHORDS so it stays in sync automatically
var CHORD_LEVEL_MAP={};
(function(){
  for(var _lvl=1;_lvl<=8;_lvl++){
    var _cs=CHORDS[_lvl]||[];
    for(var _i=0;_i<_cs.length;_i++)CHORD_LEVEL_MAP[_cs[_i].short]=_lvl;
  }
})();
function getSongLevel(song){
  var mx=0;
  for(var i=0;i<song.chords.length;i++){
    var cl=CHORD_LEVEL_MAP[song.chords[i]];
    if(cl&&cl>mx)mx=cl;
  }
  return mx||1;
}

// ===== CURRICULUM (8-level learning journey) =====
var CURRICULUM=[
  {num:1,title:"First Spark",sub:"Two-Finger",sessions:"1-3",chords:["E Minor","Em7"],icon:"&#127928;",
   desc:"Max sound, min fingers. Em uses just two fingers and rings out beautifully.",
   tip:"Em to Em7: just lift your ring finger. One of the easiest changes!",
   songs:["Horse With No Name","Eleanor Rigby","The Beat Goes On","Who is He"],
   transitions:[{a:"E Minor",b:"Em7",difficulty:1,anchor:"Middle finger stays put"}]},
  {num:2,title:"The Anchor",sub:"Shared-Finger",sessions:"4-7",chords:["E Major","A Minor"],icon:"&#128260;",
   desc:"Add index finger to Em and you get E Major. Shift the shape and you get Am.",
   tip:"Em to E: just add your index finger on G string fret 1.",
   songs:["Smokestack Lightning","Peter Gunn","Mannish Boy","Fever"],
   transitions:[{a:"E Minor",b:"E Major",difficulty:1,anchor:"Middle+ring anchor"},{a:"E Major",b:"A Minor",difficulty:2,anchor:"Same shape shifts strings"}]},
  {num:3,title:"Power Trio",sub:"Cowboy Chords",sessions:"8-14",chords:["A Major","D Major"],icon:"&#129312;",
   desc:"A, D, E together unlock a dopamine motherlode of classic songs.",
   tip:"A to D: keep index finger near 2nd fret on G string.",
   songs:["Three Little Birds","Stand By Me","Jambalaya","Achy Breaky Heart","Shakedown Street","Whole Lotta Love"],
   transitions:[{a:"A Major",b:"D Major",difficulty:2,anchor:"Index near 2nd fret G"},{a:"A Major",b:"E Major",difficulty:2,anchor:"Index slides"}]},
  {num:4,title:"Open Road",sub:"G and C",sessions:"15-22",chords:["G Major","C Major"],icon:"&#128165;",
   desc:"G, C, D, Em covers roughly 60% of pop music. Massive song explosion.",
   tip:"G to C: ring finger stays anchored on 3rd fret.",
   songs:["Knockin on Heavens Door","Wonderful Tonight","Love Me Do","Bad Moon Rising","Brown Eyed Girl","Riptide","Leaving on a Jet Plane","Hey Soul Sister","Eleanor Rigby","Royals","What I Got"],
   transitions:[{a:"G Major",b:"C Major",difficulty:3,anchor:"Ring finger on 3rd fret"},{a:"C Major",b:"A Minor",difficulty:1,anchor:"Index+middle anchor"}]},
  {num:5,title:"Seventh Wonder",sub:"Blues Flavor",sessions:"23-28",chords:["E7","A7","D7","B7"],icon:"&#127927;",
   desc:"Lift a finger from a major chord and unlock the blues.",
   tip:"E to E7: just remove your ring finger. Instant blues!",
   songs:["Coconut","12-Bar Blues in A","Folsom Prison Blues"],
   transitions:[{a:"E Major",b:"E7",difficulty:1,anchor:"Lift ring finger"},{a:"A Major",b:"A7",difficulty:1,anchor:"Lift middle finger"}]},
  {num:6,title:"Minor Territory",sub:"Dm, Em7*, Cadd9",sessions:"29-34",chords:["D Minor","Em7 Full","Cadd9"],icon:"&#128141;",
   desc:"Same chord names, different moods. Minor territory expands your palette.",
   tip:"C to Cadd9: just add your pinky on B string fret 3.",
   songs:["Run Through the Jungle","Zombie","Good Riddance"],
   transitions:[{a:"A Minor",b:"D Minor",difficulty:2,anchor:"Index to 1st fret"},{a:"C Major",b:"Cadd9",difficulty:1,anchor:"Add pinky"}]},
  {num:7,title:"The F Barrier",sub:"Boss Battle",sessions:"35-42",chords:["F Major 7","F Mini Barre","F Major"],icon:"&#9876;&#65039;",
   desc:"The famous F chord wall. We sneak past it: cheat shape, mini barre, then full barre.",
   tip:"C to Fmaj7: index goes to 1st fret. Easiest F voicing.",
   songs:["Dreams","Let It Be","Have You Ever Seen the Rain","Hallelujah","Ill Take You There"],
   transitions:[{a:"C Major",b:"F Major 7",difficulty:2,anchor:"Index on 1st fret"}]},
  {num:8,title:"Graduation",sub:"Moveable Shapes",sessions:"43-50",chords:["B Minor","E5 Power"],icon:"&#127942;",
   desc:"Barre chords + power chords. Any song, any key.",
   tip:"Am shape + barre at fret 2 = Bm. Power chord = root + 5th.",
   songs:["Hotel California","Creep","Moves Like Jagger","Get the Party Started"],
   transitions:[{a:"A Minor",b:"B Minor",difficulty:3,anchor:"Am shape at 2nd fret"}]}
];

// ===== BADGES =====
// Each badge has a check() function so checkBadges() in ui.js is data-driven.
// To add a badge: add it here only — no other file needs updating.
var BADGES=[
  {id:"first_chord",label:"First Chord!",icon:"&#11088;",desc:"Complete your first practice",check:function(){return S.sessions>=1;}},
  {id:"streak_3",label:"On Fire!",icon:"&#128293;",desc:"3-day streak",check:function(){return S.streak>=3;}},
  {id:"streak_7",label:"Unstoppable!",icon:"&#128142;",desc:"7-day streak",check:function(){return S.streak>=7;}},
  {id:"level_4",label:"Open Road!",icon:"&#128640;",desc:"Reach Level 4",check:function(){return S.level>=4;}},
  {id:"level_8",label:"Chord Master",icon:"&#128081;",desc:"Complete all 8 levels",check:function(){return S.level>=8;}},
  {id:"ten_sessions",label:"Dedicated!",icon:"&#127919;",desc:"Complete 10 sessions",check:function(){return S.sessions>=10;}},
  {id:"drill_5",label:"Quick Fingers!",icon:"&#9889;",desc:"Complete 5 drills",check:function(){return S.drillCount>=5;}},
  {id:"daily_3",label:"Challenger!",icon:"&#127941;",desc:"Complete 3 daily challenges",check:function(){return S.dailyDone>=3;}},
  {id:"quiz_10",label:"Brain Power!",icon:"&#129504;",desc:"10 quiz questions right",check:function(){return S.quizCorrect>=10;}},
  {id:"songs_3",label:"Songwriter!",icon:"&#127925;",desc:"Practice 3 songs",check:function(){return S.songsPlayed>=3;}},
  {id:"perf_first",label:"First Performance",desc:"Complete your first performance run",icon:"\u{1F3B8}"},
  {id:"perf_3star",label:"Rising Star",desc:"Earn 3 stars on any performance",icon:"\u{2B50}"},
  {id:"perf_5star",label:"Guitar Hero",desc:"Earn 5 stars on any performance",icon:"\u{1F31F}"},
  {id:"perf_10runs",label:"Dedicated Performer",desc:"Complete 10 performance runs",icon:"\u{1F3AF}"},
  {id:"perf_mastered",label:"Song Master",desc:"Master a song in performance mode",icon:"\u{1F451}"},
  {id:"perf_rhythm",label:"Rhythm Player",desc:"Complete a rhythm arrangement",icon:"\u{1F941}"},
  {id:"perf_pro",label:"Pro Player",desc:"Earn 3+ stars on Pro difficulty",icon:"\u{1F525}"},
  {id:"perf_daily",label:"Daily Performer",desc:"Complete a performance daily challenge",icon:"\u{1F4C5}"},
  {id:"perf_streak3",label:"Performance Streak",desc:"Complete 3 daily performance challenges",icon:"\u{1F525}"},
  {id:"perf_allsongs",label:"Completionist",desc:"Play every song in performance mode",icon:"\u{1F3C6}"}
];

// ===== STRUM PATTERNS =====
var STRUM_PATTERNS=[
  {name:"Basic Down",level:1,bpm:80,pattern:["D","D","D","D"],desc:"Simple downstrokes"},
  {name:"Down-Up",level:1,bpm:90,pattern:["D","U","D","U","D","U","D","U"],desc:"Alternate down and up"},
  {name:"Folk Strum",level:2,bpm:100,pattern:["D","D","U","U","D","U"],desc:"Classic acoustic pattern"},
  {name:"Pop Rock",level:2,bpm:110,pattern:["D","x","D","U","x","U","D","U"],desc:"Skip beats for drive"},
  {name:"Island Strum",level:2,bpm:95,pattern:["D","x","U","x","U","D","x","U"],desc:"Reggae-inspired groove"},
  {name:"Ballad Strum",level:3,bpm:70,pattern:["D","x","x","U","x","U","D","U"],desc:"Slow and expressive"}
];

// ===== SONGS =====
var SONGS=[
  {title:"Three Little Birds",artist:"Bob Marley",chords:["A","D","E"],level:3,pattern:["D","D","U","U","D","U"],bpm:75,progression:["A","A","D","A","A","A","E","A"],leadNotes:[
    {note:"A",t:0,dur:0.5},{note:"A",t:0.5,dur:0.5},{note:"B",t:1,dur:0.5},
    {note:"C#",t:1.5,dur:0.5},{note:"A",t:2,dur:1},{note:"E",t:3,dur:0.5},
    {note:"D",t:3.5,dur:0.5},{note:"C#",t:4,dur:0.5},{note:"A",t:4.5,dur:1.5}
  ]},
  {title:"Horse With No Name",artist:"America",chords:["Em","D"],level:3,pattern:["D","D","U","U","D","U"],bpm:90,progression:["Em","Em","D","D","Em","Em","D","D"]},
  {title:"Knockin on Heavens Door",artist:"Bob Dylan",chords:["G","D","Am","C"],level:4,pattern:["D","D","U","U","D","U"],bpm:68,progression:["G","D","Am","Am","G","D","C","C"]},
  {title:"Wonderful Tonight",artist:"Eric Clapton",chords:["G","D","C","Em"],level:4,pattern:["D","x","D","U","x","U","D","U"],bpm:95,progression:["G","D","C","D","G","D","C","D"]},
  {title:"Let It Be",artist:"The Beatles",chords:["C","G","Am","F"],level:7,pattern:["D","D","U","U","D","U"],bpm:72,progression:["C","G","Am","F","C","G","F","C"]},
  {title:"Wish You Were Here",artist:"Pink Floyd",chords:["Em","G","A","C","D"],level:4,pattern:["D","x","U","x","U","D","x","U"],bpm:62,progression:["Em","G","Em","G","Em","A","Em","A","G","C","D","Am","G","D","C","Am"]},
  // --- Added Songs ---
  {title:"Love Me Do",artist:"The Beatles",chords:["G","C","D"],level:4,pattern:["D","D","U","U","D","U"],bpm:148,progression:["G","G","C","G","G","G","C","G"]},
  {title:"Stand By Me",artist:"Ben E. King",chords:["A","D","E"],level:3,pattern:["D","D","U","U","D","U"],bpm:118,progression:["A","A","D","E","A","A","D","E"]},
  {title:"Jambalaya",artist:"Hank Williams",chords:["A","D","E"],level:3,pattern:["D","U","D","U","D","U","D","U"],bpm:120,progression:["A","A","D","D","A","A","E","A"]},
  {title:"Achy Breaky Heart",artist:"Billy Ray Cyrus",chords:["A","E"],level:3,pattern:["D","D","U","U","D","U"],bpm:120,progression:["A","A","E","E","E","E","A","A"]},
  {title:"Bad Moon Rising",artist:"CCR",chords:["D","A","G"],level:4,pattern:["D","D","U","U","D","U"],bpm:176,progression:["D","D","A","G","D","D","A","G"]},
  {title:"Brown Eyed Girl",artist:"Van Morrison",chords:["G","C","D","Em"],level:4,pattern:["D","D","U","U","D","U"],bpm:150,progression:["G","C","G","D","G","C","G","D"]},
  {title:"Riptide",artist:"Vance Joy",chords:["Am","G","C"],level:4,pattern:["D","x","D","U","x","U","D","U"],bpm:102,progression:["Am","G","C","C","Am","G","C","C"]},
  {title:"Leaving on a Jet Plane",artist:"John Denver",chords:["G","C","D"],level:4,pattern:["D","D","U","U","D","U"],bpm:136,progression:["G","C","G","C","G","C","D","D"]},
  {title:"Hey Soul Sister",artist:"Train",chords:["G","D","Em","C"],level:4,pattern:["D","x","U","x","U","D","x","U"],bpm:97,progression:["G","D","Em","C","G","D","Em","C"]},
  {title:"Have You Ever Seen the Rain",artist:"CCR",chords:["C","G","Am","F"],level:7,pattern:["D","D","U","U","D","U"],bpm:116,progression:["Am","F","C","G","Am","F","C","C"]},
  {title:"Hotel California",artist:"Eagles",chords:["Am","E","G","D","F","C","Dm"],level:7,pattern:["D","x","U","x","U","D","x","U"],bpm:74,progression:["Am","Am","E","E","G","G","D","D","F","F","C","C","Dm","Dm","E","E"]},
  {title:"Creep",artist:"Radiohead",chords:["G","B7","C","Cm"],level:8,pattern:["D","D","U","U","D","U"],bpm:92,progression:["G","G","B7","B7","C","C","Cm","Cm"]},
  {title:"Hallelujah",artist:"Leonard Cohen",chords:["C","Am","F","G","E7"],level:7,pattern:["D","x","U","x","U","D","x","U"],bpm:56,progression:["C","Am","C","Am","F","G","C","G"]},
  {title:"Tears in Heaven",artist:"Eric Clapton",chords:["A","E","F#m","D","E7","A/C#"],level:8,pattern:["D","x","D","U","x","U","D","U"],bpm:80,progression:["A","E","F#m","A/C#","D","E7","A","A"]},
  // --- One-Chord Songs ---
  {title:"Tomorrow Never Knows",artist:"The Beatles",chords:["C"],level:4,pattern:["D","D","U","U","D","U"],bpm:125,progression:["C","C","C","C","C","C","C","C"]},
  {title:"Smokestack Lightning",artist:"Howlin' Wolf",chords:["E"],level:2,pattern:["D","U","D","U","D","U","D","U"],bpm:130,progression:["E","E","E","E","E","E","E","E"]},
  {title:"Coconut",artist:"Harry Nilsson",chords:["C7"],level:5,pattern:["D","D","U","U","D","U"],bpm:118,progression:["C7","C7","C7","C7","C7","C7","C7","C7"]},
  {title:"Run Through the Jungle",artist:"CCR",chords:["Dm"],level:6,pattern:["D","D","U","U","D","U"],bpm:130,progression:["Dm","Dm","Dm","Dm","Dm","Dm","Dm","Dm"]},
  {title:"Get the Party Started",artist:"P!nk",chords:["Bm"],level:8,pattern:["D","x","D","U","x","U","D","U"],bpm:130,progression:["Bm","Bm","Bm","Bm","Bm","Bm","Bm","Bm"]},
  {title:"The Beat Goes On",artist:"Sonny & Cher",chords:["Em"],level:1,pattern:["D","D","U","U","D","U"],bpm:130,progression:["Em","Em","Em","Em","Em","Em","Em","Em"]},
  {title:"Peter Gunn",artist:"Duane Eddy",chords:["E"],level:2,pattern:["D","U","D","U","D","U","D","U"],bpm:130,progression:["E","E","E","E","E","E","E","E"]},
  {title:"Mannish Boy",artist:"Muddy Waters",chords:["E"],level:2,pattern:["D","D","U","U","D","U"],bpm:80,progression:["E","E","E","E","E","E","E","E"]},
  {title:"Boom Boom",artist:"John Lee Hooker",chords:["E"],level:2,pattern:["D","U","D","U","D","U","D","U"],bpm:135,progression:["E","E","E","E","E","E","E","E"]},
  {title:"Within You Without You",artist:"The Beatles",chords:["C"],level:4,pattern:["D","D","U","U","D","U"],bpm:110,progression:["C","C","C","C","C","C","C","C"]},
  {title:"Who is He",artist:"Bill Withers",chords:["Em"],level:1,pattern:["D","x","D","U","x","U","D","U"],bpm:105,progression:["Em","Em","Em","Em","Em","Em","Em","Em"]},
  {title:"Jump into the Fire",artist:"Harry Nilsson",chords:["E"],level:2,pattern:["D","U","D","U","D","U","D","U"],bpm:135,progression:["E","E","E","E","E","E","E","E"]},
  {title:"Fever",artist:"Peggy Lee",chords:["Am"],level:2,pattern:["D","x","D","U","x","U","D","U"],bpm:115,progression:["Am","Am","Am","Am","Am","Am","Am","Am"]},
  {title:"Its All Good",artist:"Bob Dylan",chords:["Gm"],level:8,pattern:["D","D","U","U","D","U"],bpm:100,progression:["Gm","Gm","Gm","Gm","Gm","Gm","Gm","Gm"]},
  {title:"Shakedown Street",artist:"Grateful Dead",chords:["A"],level:3,pattern:["D","x","U","x","U","D","x","U"],bpm:110,progression:["A","A","A","A","A","A","A","A"]},
  // --- Two-Chord Songs ---
  {title:"Eleanor Rigby",artist:"The Beatles",chords:["Em","C"],level:4,pattern:["D","D","U","U","D","U"],bpm:138,progression:["Em","Em","C","C","Em","Em","C","Em"]},
  {title:"Royals",artist:"Lorde",chords:["C","D"],level:4,pattern:["D","D","U","U","D","U"],bpm:85,progression:["C","C","D","D","C","C","D","D"]},
  {title:"What I Got",artist:"Sublime",chords:["D","G"],level:4,pattern:["D","U","D","U","D","U","D","U"],bpm:94,progression:["D","D","G","G","D","D","G","G"]},
  {title:"Whole Lotta Love",artist:"Led Zeppelin",chords:["E","A"],level:3,pattern:["D","D","U","U","D","U"],bpm:92,progression:["E","E","A","A","E","E","A","E"]},
  {title:"Ill Take You There",artist:"The Staple Singers",chords:["C","F"],level:7,pattern:["D","x","U","x","U","D","x","U"],bpm:108,progression:["C","C","F","F","C","C","F","C"]},
  {title:"Moves Like Jagger",artist:"Maroon 5",chords:["Em","Bm"],level:8,pattern:["D","x","D","U","x","U","D","U"],bpm:128,progression:["Em","Em","Bm","Bm","Em","Em","Bm","Bm"]},
  // --- Previously skipped (new chord defs added) ---
  {title:"Dreams",artist:"Fleetwood Mac",chords:["Fmaj7","G"],level:7,pattern:["D","D","U","U","D","U"],bpm:120,progression:["Fmaj7","Fmaj7","G","G","Fmaj7","Fmaj7","G","G"]},
  {title:"Do I Wanna Know",artist:"Arctic Monkeys",chords:["Gm","Cm"],level:8,pattern:["D","x","D","U","x","U","D","U"],bpm:85,progression:["Gm","Gm","Cm","Cm","Gm","Gm","Cm","Cm"]},
  {title:"Chain of Fools",artist:"Aretha Franklin",chords:["Cm"],level:8,pattern:["D","U","D","U","D","U","D","U"],bpm:112,progression:["Cm","Cm","Cm","Cm","Cm","Cm","Cm","Cm"]},
  {title:"Get Up Stand Up",artist:"Bob Marley",chords:["Cm"],level:8,pattern:["D","x","U","x","U","D","x","U"],bpm:100,progression:["Cm","Cm","Cm","Cm","Cm","Cm","Cm","Cm"]},
  {title:"Music",artist:"Madonna",chords:["Gm"],level:8,pattern:["D","x","D","U","x","U","D","U"],bpm:120,progression:["Gm","Gm","Gm","Gm","Gm","Gm","Gm","Gm"]}
];

// ===== DAILY CHALLENGES =====
var DAILY_CHALLENGES=[
  {id:"speed",title:"Speed Switch",desc:"Switch between 2 chords fast in 60s",xp:50,icon:"&#9889;"},
  {id:"hold",title:"Iron Grip",desc:"Hold a chord shape for 30 seconds",xp:30,icon:"&#128170;"},
  {id:"marathon",title:"Mini Marathon",desc:"Practice 3 chords back to back",xp:75,icon:"&#127939;"},
  {id:"clean",title:"Clean Strum",desc:"Strum each string - no buzzing!",xp:40,icon:"&#10024;"},
  {id:"blind",title:"Blind Switch",desc:"Switch chords without looking",xp:60,icon:"&#128584;"}
];

// ===== ALTERNATE VOICINGS =====
var VOICINGS={
  "E Major":[
    {label:"Open (Standard)",fingers:[[3,1,1,"#FF6B6B"],[1,2,2,"#4ECDC4"],[2,2,3,"#45B7D1"]],frets:[0,2,2,1,0,0],open:[true,false,false,false,true,true],muted:[]},
    {label:"Barre (7th fret)",fingers:[[0,7,1,"#FF6B6B"],[1,7,1,"#FF6B6B"],[2,9,3,"#4ECDC4"],[3,9,4,"#45B7D1"],[4,9,2,"#FFE66D"],[5,7,1,"#FF6B6B"]],frets:[7,7,9,9,9,7],open:[],muted:[],barFret:7,barStrings:[0,5]}
  ],
  "A Major":[
    {label:"Open (Standard)",fingers:[[2,2,2,"#FF6B6B"],[3,2,3,"#4ECDC4"],[4,2,4,"#45B7D1"]],frets:[-1,0,2,2,2,0],open:[false,true,false,false,false,true],muted:[0]},
    {label:"Barre (5th fret)",fingers:[[0,5,1,"#FF6B6B"],[1,5,1,"#FF6B6B"],[2,7,3,"#4ECDC4"],[3,7,4,"#45B7D1"],[4,7,2,"#FFE66D"],[5,5,1,"#FF6B6B"]],frets:[5,5,7,7,7,5],open:[],muted:[],barFret:5,barStrings:[0,5]}
  ],
  "D Major":[
    {label:"Open (Standard)",fingers:[[3,2,1,"#FF6B6B"],[4,3,2,"#4ECDC4"],[5,2,3,"#45B7D1"]],frets:[-1,-1,0,2,3,2],open:[false,false,true,false,false,false],muted:[0,1]},
    {label:"Barre (5th fret)",fingers:[[1,5,1,"#FF6B6B"],[2,7,3,"#4ECDC4"],[3,7,4,"#45B7D1"],[4,7,2,"#FFE66D"],[5,5,1,"#FF6B6B"]],frets:[-1,5,7,7,7,5],open:[],muted:[0],barFret:5,barStrings:[1,5]}
  ],
  "G Major":[
    {label:"Open (Standard)",fingers:[[0,3,2,"#FF6B6B"],[1,2,1,"#4ECDC4"],[5,3,3,"#45B7D1"]],frets:[3,2,0,0,0,3],open:[false,false,true,true,true,false],muted:[]},
    {label:"Barre (3rd fret)",fingers:[[0,3,1,"#FF6B6B"],[1,3,1,"#FF6B6B"],[2,5,3,"#4ECDC4"],[3,5,4,"#45B7D1"],[4,5,2,"#FFE66D"],[5,3,1,"#FF6B6B"]],frets:[3,3,5,5,5,3],open:[],muted:[],barFret:3,barStrings:[0,5]}
  ],
  "C Major":[
    {label:"Open (Standard)",fingers:[[1,3,3,"#FF6B6B"],[2,2,2,"#4ECDC4"],[4,1,1,"#45B7D1"]],frets:[-1,3,2,0,1,0],open:[false,false,false,true,false,true],muted:[0]},
    {label:"Barre (3rd fret)",fingers:[[1,3,1,"#FF6B6B"],[2,5,3,"#4ECDC4"],[3,5,4,"#45B7D1"],[4,5,2,"#FFE66D"],[5,3,1,"#FF6B6B"]],frets:[-1,3,5,5,5,3],open:[],muted:[0],barFret:3,barStrings:[1,5]}
  ],
  "E Minor":[
    {label:"Open (Standard)",fingers:[[1,2,2,"#FF6B6B"],[2,2,3,"#4ECDC4"]],frets:[0,2,2,0,0,0],open:[true,false,false,true,true,true],muted:[]},
    {label:"Barre (7th fret)",fingers:[[0,7,1,"#FF6B6B"],[1,7,1,"#FF6B6B"],[2,9,3,"#4ECDC4"],[3,9,4,"#45B7D1"],[4,8,2,"#FFE66D"],[5,7,1,"#FF6B6B"]],frets:[7,7,9,9,8,7],open:[],muted:[],barFret:7,barStrings:[0,5]}
  ],
  "A Minor":[
    {label:"Open (Standard)",fingers:[[4,1,1,"#FF6B6B"],[2,2,2,"#4ECDC4"],[3,2,3,"#45B7D1"]],frets:[-1,0,2,2,1,0],open:[false,true,false,false,false,true],muted:[0]},
    {label:"Barre (5th fret)",fingers:[[0,5,1,"#FF6B6B"],[1,5,1,"#FF6B6B"],[2,7,3,"#4ECDC4"],[3,7,4,"#45B7D1"],[4,6,2,"#FFE66D"],[5,5,1,"#FF6B6B"]],frets:[5,5,7,7,6,5],open:[],muted:[],barFret:5,barStrings:[0,5]}
  ],
  "D Minor":[
    {label:"Open (Standard)",fingers:[[5,1,1,"#FF6B6B"],[3,2,2,"#4ECDC4"],[4,3,3,"#45B7D1"]],frets:[-1,-1,0,2,3,1],open:[false,false,true,false,false,false],muted:[0,1]},
    {label:"Barre (5th fret)",fingers:[[1,5,1,"#FF6B6B"],[2,7,3,"#4ECDC4"],[3,7,4,"#45B7D1"],[4,6,2,"#FFE66D"],[5,5,1,"#FF6B6B"]],frets:[-1,5,7,7,6,5],open:[],muted:[0],barFret:5,barStrings:[1,5]}
  ],
  "F Major":[
    {label:"Partial Barre",fingers:[[2,3,3,"#4ECDC4"],[3,2,2,"#45B7D1"]],frets:[-1,-1,3,2,1,1],open:[],muted:[0,1],barFret:1,barStrings:[4,5]},
    {label:"Full Barre (1st fret)",fingers:[[0,1,1,"#FF6B6B"],[1,1,1,"#FF6B6B"],[2,3,3,"#4ECDC4"],[3,3,4,"#45B7D1"],[4,2,2,"#FFE66D"],[5,1,1,"#FF6B6B"]],frets:[1,1,3,3,2,1],open:[],muted:[],barFret:1,barStrings:[0,5]}
  ]
};

// ===== CHORD NAME MAP (shorthand → full name for import parsing) =====
var CHORD_NAME_MAP={
  "C":"C Major","Cm":"C Minor","C7":"C7","Cm7":"Cm7","Cmaj7":"Cmaj7","Cdim":"Cdim","Caug":"Caug","Csus2":"Csus2","Csus4":"Csus4","Cadd9":"Cadd9",
  "D":"D Major","Dm":"D Minor","D7":"D7","Dm7":"Dm7","Dmaj7":"Dmaj7","Ddim":"Ddim","Dsus2":"Dsus2","Dsus4":"Dsus4",
  "E":"E Major","Em":"E Minor","E7":"E7","Em7":"Em7","Emaj7":"Emaj7",
  "F":"F Major","Fm":"F Minor","F7":"F7","Fm7":"Fm7","Fmaj7":"Fmaj7",
  "G":"G Major","Gm":"G Minor","G7":"G7","Gm7":"Gm7","Gmaj7":"Gmaj7","Gsus4":"Gsus4",
  "A":"A Major","Am":"A Minor","A7":"A7","Am7":"Am7","Amaj7":"Amaj7","Asus2":"Asus2","Asus4":"Asus4",
  "B":"B Major","Bm":"B Minor","B7":"B7","Bm7":"Bm7",
  "C#":"C# Major","C#m":"C# Minor","Db":"Db Major","Dbm":"Db Minor",
  "D#":"D# Major","D#m":"D# Minor","Eb":"Eb Major","Ebm":"Eb Minor",
  "F#":"F# Major","F#m":"F# Minor","Gb":"Gb Major","Gbm":"Gb Minor",
  "G#":"G# Major","G#m":"G# Minor","Ab":"Ab Major","Abm":"Ab Minor",
  "A#":"A# Major","A#m":"A# Minor","Bb":"Bb Major","Bbm":"Bb Minor",
  "Em7*":"Em7 Full","F(m)":"F Mini Barre","E5":"E5 Power"
};

// ===== TRANSITION TIPS =====
var TRANSITION_TIPS={
  "E Major->A Major":"Slide your index finger from G string fret 1 to B string fret 2. Middle and ring fingers move as a pair.",
  "A Major->E Major":"Keep fingers close to fretboard. Move index to G string fret 1, shift the pair back.",
  "A Major->D Major":"Lift all fingers and reposition - practice the D shape claw separately.",
  "D Major->A Major":"Index finger drops from G string. Keep the motion small and deliberate.",
  "E Major->D Major":"Biggest jump at Level 1. Practice lifting and placing as one motion.",
  "D Major->E Major":"Reverse the big jump - land index finger first on G string fret 1.",
  "E Major->E7":"Simply lift your ring finger off the D string. One of the easiest changes!",
  "A Major->A7":"Lift your middle finger off the D string. Ring finger stays put.",
  "D Major->D7":"Middle finger moves from B string fret 3 to fret 1. Index and ring stay close.",
  "G Major->C Major":"Keep your ring finger anchored on A string fret 3 - it stays for both chords!",
  "C Major->G Major":"Ring finger is your anchor on A string fret 3. Pivot around it.",
  "G Major->D Major":"Ring finger moves from high E fret 3 to B string fret 3 - same fret, one string over.",
  "D Major->G Major":"Open up your hand shape - index goes to A string, pinky to high E fret 3.",
  "G Major->E Minor":"Simply lift your pinky and index finger. Middle and ring drop to A and D strings.",
  "E Minor->G Major":"Add index on A string fret 2, pinky on high E fret 3. Middle and ring slide over.",
  "C Major->A Minor":"Keep index finger on B string fret 1! Middle slides from D to G string. Ring lifts off.",
  "A Minor->C Major":"Index stays on B string fret 1 as anchor. Add ring finger to A string fret 3.",
  "E Minor->A Minor":"Index finger goes to B string fret 1. The two-finger shape shifts across one string.",
  "A Minor->E Minor":"Lift index from B string. Shift down to E minor shape. Quick change!",
  "E Minor->C Major":"Index to B fret 1, middle to D fret 2, ring to A fret 3 - build from the inside.",
  "C Major->E Minor":"Strip down to just middle and ring on A and D strings fret 2.",
  "D Major->E Minor":"Big shape change - go to the simple two-finger Em shape. Relax your hand.",
  "C Major->D Major":"Completely different shape. Lift all fingers and reposition above D-G-B strings.",
  "C Major->F Major":"Index finger becomes a mini barre. Keep middle and ring in similar position.",
  "A Minor->F Major":"Index becomes a barre across B and high E at fret 1. Middle to G fret 2, ring to D fret 3.",
  "F Major->C Major":"Release the barre. Ring stays around A string area. Reshape to open C.",
  "C Major->F Major":"Hardest beginner transition! Index barres fret 1, add middle and ring. Practice slowly.",
  "A Minor->D Minor":"Both minor chords - index moves from B fret 1 to G fret 1. Similar feeling shapes.",
  "E Minor->B7":"Add index to D fret 1, middle to A fret 2, ring to G fret 2. Build from the bottom.",
  "D Major->Bm":"Requires barre at fret 2. Plant the barre first, then add remaining fingers.",
  "G Major->D/F#":"Keep the G base, add index to grab the F# bass note on low E fret 2."
};

function getTransitionTip(from,to){
  var key=from+"->"+to;
  if(TRANSITION_TIPS[key])return TRANSITION_TIPS[key];
  var rev=to+"->"+from;
  if(TRANSITION_TIPS[rev])return "Reverse: "+TRANSITION_TIPS[rev];
  return null;
}

// ===== SCALES =====
var SCALES={
  "C":{major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],pentatonic:[0,2,4,7,9],minorPent:[0,3,5,7,10],blues:[0,3,5,6,7,10]},
  "D":{major:[2,4,6,7,9,11,1],minor:[2,4,5,7,9,10,0],pentatonic:[2,4,6,9,11],minorPent:[2,5,7,9,0],blues:[2,5,7,8,9,0]},
  "E":{major:[4,6,8,9,11,1,3],minor:[4,6,7,9,11,0,2],pentatonic:[4,6,8,11,1],minorPent:[4,7,9,11,2],blues:[4,7,9,10,11,2]},
  "F":{major:[5,7,9,10,0,2,4],minor:[5,7,8,10,0,1,3],pentatonic:[5,7,9,0,2],minorPent:[5,8,10,0,3],blues:[5,8,10,11,0,3]},
  "G":{major:[7,9,11,0,2,4,6],minor:[7,9,10,0,2,3,5],pentatonic:[7,9,11,2,4],minorPent:[7,10,0,2,5],blues:[7,10,0,1,2,5]},
  "A":{major:[9,11,1,2,4,6,8],minor:[9,11,0,2,4,5,7],pentatonic:[9,11,1,4,6],minorPent:[9,0,2,4,7],blues:[9,0,2,3,4,7]},
  "B":{major:[11,1,3,4,6,8,10],minor:[11,1,2,4,6,7,9],pentatonic:[11,1,3,6,8],minorPent:[11,2,4,6,9],blues:[11,2,4,5,6,9]}
};
var SCALE_NAMES={major:"Major",minor:"Natural Minor",pentatonic:"Major Pentatonic",minorPent:"Minor Pentatonic",blues:"Blues"};

function getScaleFrets(key,scaleType){
  var sc=SCALES[key];if(!sc||!sc[scaleType])return [];
  var intervals=sc[scaleType];
  var positions=[];
  var stringNotes=[4,9,2,7,11,4]; // E A D G B E as semitone indices
  for(var s=0;s<6;s++){
    for(var f=0;f<=12;f++){
      var noteIdx=(stringNotes[s]+f)%12;
      if(intervals.indexOf(noteIdx)!==-1){
        positions.push({string:s,fret:f,note:NOTE_NAMES[noteIdx],isRoot:noteIdx===intervals[0]});
      }
    }
  }
  return positions;
}

// ===== MICRO-ACHIEVEMENTS =====
var MICRO_ACHIEVEMENTS=[
  {id:"halfway",trigger:"sessionTime",val:60,msg:"Halfway there!",icon:"&#128170;"},
  {id:"clean_switch",trigger:"drillSwitch",val:1,msg:"Smooth switch!",icon:"&#9889;"},
  {id:"three_switches",trigger:"drillSwitch",val:3,msg:"On fire!",icon:"&#128293;"},
  {id:"full_song",trigger:"songComplete",val:1,msg:"Rockstar!",icon:"&#127908;"},
  {id:"quiz_streak",trigger:"quizStreak",val:3,msg:"Hat trick!",icon:"&#127913;"}
];

// ===== FINGER EXERCISES (from fingering-mastery-module.md) =====
var FINGER_EXERCISES=[
  // Tier 1: Off-Instrument
  {id:"G-OFF-1",name:"Table Taps",tier:1,duration:120,frequency:"daily",offInstrument:true,
    desc:"Lift ONE finger at a time, keeping all others flat. Index\u2192Middle\u2192Ring\u2192Pinky and back. Then pairs: Index+Ring, Middle+Pinky.",
    goal:"Clean, isolated lifts. No sympathy movement from neighboring fingers.",bpm:60},
  {id:"G-OFF-2",name:"Rasgueado Flicks",tier:1,duration:120,frequency:"every other day",offInstrument:true,
    desc:"Curl fingers into a loose fist. Flick out one at a time: Pinky\u2192Ring\u2192Middle\u2192Index. Each fully extends then returns.",
    goal:"30 clean reps. Builds extensor strength \u2014 the muscles that OPEN your fingers.",bpm:0},
  {id:"G-OFF-3",name:"Finger Pairs",tier:1,duration:60,frequency:"daily",offInstrument:true,
    desc:"Tap pairs simultaneously: Index+Pinky, Middle+Ring (hardest \u2014 shared tendon), Index+Ring, Middle+Pinky. 10 taps per pair.",
    goal:"All four pairs clean with no extra finger movement.",bpm:0},
  // Tier 2: On-Instrument
  {id:"G-ON-1",name:"Chromatic Walk (1234)",tier:2,duration:120,frequency:"daily warmup",offInstrument:false,
    desc:"Index on fret 1, middle fret 2, ring fret 3, pinky fret 4. Play 1-2-3-4 across all 6 strings. Reverse: 4-3-2-1.",
    goal:"Clean notes, no buzz. Fingers stay down after placed. One finger per fret, always.",bpm:60},
  {id:"G-ON-2",name:"Sticky Finger Hold",tier:2,duration:120,frequency:"sessions 4+",offInstrument:false,
    desc:"All four fingers on frets 1-4. Lift ONLY index, move to next string. Then middle. Then ring. Then pinky. Other fingers stay planted.",
    goal:"Keep non-moving fingers perfectly still \u2014 the exact skill for chord transitions.",bpm:0},
  {id:"G-ON-3",name:"The Spider",tier:2,duration:120,frequency:"sessions 8+",offInstrument:false,
    desc:"Index fret 1 on low E, middle fret 2 on A, ring fret 3 on D, pinky fret 4 on G. Play each, then shift diagonally up and across the fretboard.",
    goal:"Cross-string, cross-fret coordination. The ultimate warmup.",bpm:60},
  // Tier 3: Chord-Specific
  {id:"G-CHORD-1",name:"Air Change",tier:3,duration:60,frequency:"any time",offInstrument:false,
    desc:"Hold a chord shape. Memorize it. Remove hand completely, shake out. Place hand back into chord shape as fast as possible. Repeat 10x.",
    goal:"Under 1 second to reform chord shape from scratch.",bpm:0},
  {id:"G-CHORD-3",name:"60-Second Challenge",tier:3,duration:60,frequency:"daily from session 10",offInstrument:false,
    desc:"Set timer for 60 seconds. Switch between two chords as many times as possible. Count CLEAN transitions only.",
    goal:"30 clean changes = competent. 60 = fluent. (JustinGuitar benchmark)",bpm:0}
];

// ===== COMMON PROGRESSIONS =====
var COMMON_PROGRESSIONS=[
  {name:"I-IV-V (Blues)",chords:["E Major","A Major","B7"],key:"E"},
  {name:"I-V-vi-IV (Pop)",chords:["G Major","D Major","E Minor","C Major"],key:"G"},
  {name:"I-vi-IV-V (50s)",chords:["C Major","A Minor","F Major","G Major"],key:"C"},
  {name:"ii-V-I (Jazz)",chords:["D Minor","G7","C Major"],key:"C"},
  {name:"I-IV (Folk)",chords:["A Major","D Major"],key:"A"},
  {name:"I-bVII-IV (Rock)",chords:["A Major","G Major","D Major"],key:"A"}
];

// ===== GUIDED SESSION PLANS (22 sessions across Levels 1-4) =====
// Each plan follows: Spark → Review → New Move (Watch→Shadow→Try→Refine) → Song Slice → Victory Lap
var GUITAR_SESSIONS=[
  // Level 1: First Spark (Sessions 1-3)
  {num:1,title:"Hello, Guitar",level:1,bpm:60,
    spark:{text:"Listen to 'Horse With No Name' \u2014 just two chords, hypnotic groove."},
    review:null,
    newMove:{text:"Learn Em chord. Place middle finger on A string fret 2, ring finger on D string fret 2. Strum all 6 strings. Repeat 10x.",chord:"E Minor",strum:"D D D D"},
    songSlice:{text:"Play Em as a drone under 'Horse With No Name'. Just Em, nothing else. Feel the rhythm.",song:"Horse With No Name"},
    victoryLap:{text:"One clean Em strum. Listen to it ring out."},
    ifThen:"If I sit down with my guitar, then I will play Em three times."},

  {num:2,title:"One Less Finger",level:1,bpm:60,
    spark:{text:"Same clip \u2014 now notice how the chord subtly changes."},
    review:{chords:["E Minor"],text:"Play Em 4x clean. Lift and replace."},
    newMove:{text:"Learn Em7 by lifting your ring finger from Em. That's it. One finger less = new chord!",chord:"Em7",strum:"D D D D"},
    songSlice:{text:"Alternate Em \u2192 Em7 every 4 beats. This IS the 'Horse With No Name' pattern.",song:"Horse With No Name"},
    victoryLap:{text:"Play the Em \u2192 Em7 cycle. You just played your first song!"},
    ifThen:"If I hear music playing, then I will air-guitar the chord shape."},

  {num:3,title:"Smooth Moves",level:1,bpm:65,
    spark:{text:"Full 'Horse With No Name' chorus. You know these chords!"},
    review:{chords:["E Minor","Em7"],text:"Em \u2192 Em7 cycle at 60 BPM."},
    newMove:{text:"Speed up the transition. Target: change chords every 2 beats instead of 4. Practice the lift-place motion until automatic.",chord:"Em7",strum:"D D D D"},
    songSlice:{text:"Play along with 'Horse With No Name' at 0.75x speed.",song:"Horse With No Name"},
    victoryLap:{text:"Play the cycle at full speed. Personal best!"}},

  // Level 2: The Anchor (Sessions 4-7)
  {num:4,title:"Add a Finger",level:2,bpm:65,
    spark:{text:"Listen to 'Achy Breaky Heart' \u2014 bright, punchy E chord."},
    review:{chords:["E Minor","Em7"],text:"Em \u2192 Em7 cycle."},
    newMove:{text:"Learn E Major. Start from Em position. Add index finger on 1st fret, G string. Middle and ring stay EXACTLY where they are.",chord:"E Major",strum:"D D D D"},
    songSlice:{text:"Alternate Em \u2192 E \u2192 Em \u2192 E every 4 beats.",song:"Achy Breaky Heart"},
    victoryLap:{text:"Clean E major chord. Record it."}},

  {num:5,title:"Shape Shift",level:2,bpm:65,
    spark:{text:"Listen to 'Fallin' by Alicia Keys. Dramatic Em \u2192 Am feel."},
    review:{chords:["E Minor","E Major"],text:"Em \u2192 E transitions."},
    newMove:{text:"Learn Am. Same shape as E major, moved one string set toward the floor. Practice the slide from E \u2192 Am.",chord:"A Minor",strum:"D D D D"},
    songSlice:{text:"E \u2192 Am \u2192 E \u2192 Am cycle.",song:"Fallin"},
    victoryLap:{text:"Em \u2192 E \u2192 Am chain. Three chords!"}},

  {num:6,title:"The Triangle",level:2,bpm:70,
    spark:{text:"Preview a song using all three chords."},
    review:{chords:["E Major","A Minor"],text:"E \u2192 Am transitions."},
    newMove:{text:"Practice the full triangle: Em \u2192 E \u2192 Am \u2192 E \u2192 Em. Focus on the anchor finger.",chord:"A Minor",strum:"D D D D"},
    songSlice:{text:"Simplified 'Fallin' \u2014 Em and Am, back and forth with dramatic strumming.",song:"Fallin"},
    victoryLap:{text:"Full triangle, clean."}},

  {num:7,title:"Speed Round",level:2,bpm:70,
    spark:{text:"'Eleanor Rigby' clip \u2014 feel the urgency."},
    review:{chords:["E Minor","E Major","A Minor"],text:"Full triangle at 70 BPM."},
    newMove:{text:"Chord Flash: random chord name appears, play it within 3 seconds. Em, E, Am in random order. Repeat 20x.",chord:"A Minor",strum:"D D D D"},
    songSlice:{text:"Simplified 'Eleanor Rigby' \u2014 Em focus, feel the rhythm.",song:"Eleanor Rigby"},
    victoryLap:{text:"Record your fastest clean triangle cycle."}},

  // Level 3: Power Trio (Sessions 8-14)
  {num:8,title:"The A Chord",level:3,bpm:65,
    spark:{text:"'Three Little Birds' \u2014 bright, happy, A-D-E."},
    review:{chords:["E Minor","E Major","A Minor"],text:"Em \u2192 E \u2192 Am triangle."},
    newMove:{text:"Learn A Major. Three fingers lined up on 2nd fret (strings 2,3,4). Compact shape. Strum from 5th string down.",chord:"A Major",strum:"D D U"},
    songSlice:{text:"A \u2192 E \u2192 A \u2192 E cycle.",song:"Three Little Birds"},
    victoryLap:{text:"Clean A chord."}},

  {num:9,title:"The D Chord",level:3,bpm:65,
    spark:{text:"'Sweet Caroline' clip."},
    review:{chords:["A Major","E Major"],text:"A \u2192 E transitions."},
    newMove:{text:"Learn D Major. Triangle shape on top 3 strings. Only strum top 4 strings. Index finger anchor on 2nd fret G string shared with A.",chord:"D Major",strum:"D D U"},
    songSlice:{text:"A \u2192 D \u2192 A \u2192 D cycle. Feel the index finger anchor.",song:"Stand By Me"},
    victoryLap:{text:"Clean D chord."}},

  {num:10,title:"Cowboy Chords Unite",level:3,bpm:70,
    spark:{text:"'Bad Moon Rising' \u2014 the classic I-IV-V."},
    review:{chords:["A Major","D Major"],text:"A \u2192 D transitions."},
    newMove:{text:"Chain all three: A \u2192 D \u2192 E \u2192 A. This is the I-IV-V in A!",chord:"E Major",strum:"D D U"},
    songSlice:{text:"'Three Little Birds' \u2014 A, D, E. Play along.",song:"Three Little Birds"},
    victoryLap:{text:"Full A \u2192 D \u2192 E \u2192 A cycle."}},

  {num:11,title:"Blues Day",level:3,bpm:70,
    spark:{text:"12-bar blues \u2014 the backbone of rock & roll."},
    review:{chords:["A Major","D Major","E Major"],text:"A \u2192 D \u2192 E cycle."},
    newMove:{text:"Learn the 12-bar blues: A(4) \u2192 D(2) \u2192 A(2) \u2192 E(1) \u2192 D(1) \u2192 A(2). Count bars out loud.",chord:"A Major",strum:"D D U"},
    songSlice:{text:"Play the 12-bar blues with feeling.",song:"12-Bar Blues in A"},
    victoryLap:{text:"One full 12-bar cycle, no stops."}},

  {num:12,title:"Campfire Strum",level:3,bpm:70,
    spark:{text:"Full chorus of 'Sweet Caroline'."},
    review:{chords:["A Major","D Major","E Major"],text:"12-bar blues."},
    newMove:{text:"Learn the campfire strum: \u2193 \u2193 \u2191 \u2191 \u2193 \u2191. The 'miss' on beat 3's downstroke gives it swing.",chord:"A Major",strum:"D D U U D U"},
    songSlice:{text:"Play 'Sweet Caroline' chorus with campfire strum.",song:"Achy Breaky Heart"},
    victoryLap:{text:"Record the chorus."}},

  {num:13,title:"Strum Doesn't Stop",level:3,bpm:75,
    spark:{text:"'Stir It Up' \u2014 smooth reggae groove."},
    review:{chords:["A Major"],text:"Campfire strum on A chord."},
    newMove:{text:"Campfire strum across A \u2192 D \u2192 E transitions. Key rule: strum arm NEVER stops moving, even if you miss a beat during the chord change.",chord:"D Major",strum:"D D U U D U"},
    songSlice:{text:"'Three Little Birds' with campfire strum.",song:"Three Little Birds"},
    victoryLap:{text:"60-second jam, campfire strum, A \u2192 D \u2192 E."}},

  {num:14,title:"Level 3 Boss",level:3,bpm:80,
    spark:{text:"Medley of all Level 3 songs."},
    review:{chords:["E Minor","E Major","A Minor","A Major","D Major"],text:"Random chord drill \u2014 any order."},
    newMove:{text:"Chord Roulette: random chord name every 4 beats. All chords learned so far. React fast!",chord:"D Major",strum:"D D U U D U"},
    songSlice:{text:"Pick ANY song from the unlocked list. Your choice!",song:"Three Little Birds"},
    victoryLap:{text:"Record your best song."}},

  // Level 4: Open Road (Sessions 15-22)
  {num:15,title:"The G Chord",level:4,bpm:75,
    spark:{text:"'Love Me Do' \u2014 G, C, D. Massive sound."},
    review:{chords:["A Major","D Major","E Major"],text:"Campfire strum on A \u2192 D \u2192 E."},
    newMove:{text:"Learn G Major. Ring finger 3rd fret low E, middle finger 2nd fret A string. Just two fingers. Strum all 6 strings. Full, resonant sound!",chord:"G Major",strum:"D D U U D U"},
    songSlice:{text:"G \u2192 D \u2192 G \u2192 D cycle. New territory!",song:"Love Me Do"},
    victoryLap:{text:"Clean G chord."}},

  {num:16,title:"The C Chord",level:4,bpm:65,
    spark:{text:"'Leaving on a Jet Plane' \u2014 warm G and C."},
    review:{chords:["G Major","D Major"],text:"G \u2192 D transitions."},
    newMove:{text:"Learn C Major. Ring finger 3rd fret A string (anchor from G!), middle 2nd fret D, index 1st fret B. Strum from 5th string. Give this one extra time.",chord:"C Major",strum:"D D D D"},
    songSlice:{text:"G \u2192 C \u2192 G \u2192 C. Focus on ring finger anchor.",song:"Leaving on a Jet Plane"},
    victoryLap:{text:"Clean C chord."}},

  {num:17,title:"G-C-D Power Trio",level:4,bpm:70,
    spark:{text:"'Sweet Home Alabama' \u2014 the classic G-C-D feel."},
    review:{chords:["G Major","C Major"],text:"G \u2192 C transitions."},
    newMove:{text:"G \u2192 C \u2192 D chain. Practice each: G\u2192C (ring anchor), C\u2192D (index near-anchor), D\u2192G (no anchor \u2014 practice extra).",chord:"D Major",strum:"D D U U D U"},
    songSlice:{text:"'Love Me Do' \u2014 G, C, D play-along.",song:"Love Me Do"},
    victoryLap:{text:"G \u2192 C \u2192 D \u2192 G clean cycle."}},

  {num:18,title:"The Four Chord Song",level:4,bpm:75,
    spark:{text:"'Knockin' on Heaven's Door' \u2014 the I-V-vi-IV."},
    review:{chords:["G Major","C Major","D Major"],text:"G \u2192 C \u2192 D chain."},
    newMove:{text:"Learn G \u2192 D \u2192 Em \u2192 C. This 'axis of awesome' progression powers hundreds of songs!",chord:"E Minor",strum:"D D U U D U"},
    songSlice:{text:"'Knockin' on Heaven's Door' \u2014 G, D, Am, C.",song:"Knockin on Heavens Door"},
    victoryLap:{text:"Full progression loop."}},

  {num:19,title:"I'm Yours",level:4,bpm:80,
    spark:{text:"'I'm Yours' by Jason Mraz \u2014 same four chords!"},
    review:{chords:["G Major","D Major","E Minor","C Major"],text:"G \u2192 D \u2192 Em \u2192 C progression."},
    newMove:{text:"'I'm Yours' timing: G(2 bars) \u2192 D(2 bars) \u2192 Em(2 bars) \u2192 C(2 bars). Relaxed.",chord:"G Major",strum:"D D U U D U"},
    songSlice:{text:"Play along with 'I'm Yours' at 0.85x speed.",song:"Riptide"},
    victoryLap:{text:"Record the verse."}},

  {num:20,title:"Stand By Me",level:4,bpm:80,
    spark:{text:"'Stand By Me' \u2014 timeless."},
    review:{chords:["G Major","D Major","E Minor","C Major"],text:"G \u2192 D \u2192 Em \u2192 C."},
    newMove:{text:"Same chords, different order: G \u2192 Em \u2192 C \u2192 D. Different emotion. Practice the reordering.",chord:"C Major",strum:"D D U U D U"},
    songSlice:{text:"'Stand By Me' play-along.",song:"Stand By Me"},
    victoryLap:{text:"Record."}},

  {num:21,title:"Brown Eyed Girl",level:4,bpm:80,
    spark:{text:"'Brown Eyed Girl' \u2014 the ultimate campfire song."},
    review:{chords:["G Major","E Minor","C Major","D Major"],text:"G \u2192 Em \u2192 C \u2192 D."},
    newMove:{text:"All Level 4 chords in different orders. Build fluency by shuffling: C \u2192 G \u2192 D \u2192 Em, then Em \u2192 C \u2192 G \u2192 D.",chord:"G Major",strum:"D D U U D U"},
    songSlice:{text:"'Brown Eyed Girl' play-along.",song:"Brown Eyed Girl"},
    victoryLap:{text:"Record your best song from the library."}},

  {num:22,title:"Level 4 Boss",level:4,bpm:85,
    spark:{text:"Medley of all songs you've unlocked."},
    review:{chords:["G Major","C Major","D Major","E Minor","A Major","A Minor"],text:"All chords random drill."},
    newMove:{text:"Chord Roulette with ALL chords. Every 3 beats, switch. This is your graduation test!",chord:"C Major",strum:"D D U U D U"},
    songSlice:{text:"Pick any song. Play it start to finish.",song:"Knockin on Heavens Door"},
    victoryLap:{text:"Record your signature song. You've graduated Level 4!"}}
];
