var assert=require("assert");
var fs=require("fs");
var path=require("path");
var passed=0,failed=0;
function test(n,fn){try{fn();passed++;console.log("  PASS: "+n)}catch(e){failed++;console.error("  FAIL: "+n);console.error("    "+e.message)}}
function loadJS(f){return fs.readFileSync(path.join(__dirname,"..",f),"utf8")}
global.window=global;
global.document={getElementById:function(){return null},querySelector:function(){return null}};
global.localStorage={getItem:function(){return null},setItem:function(){}};
global.AudioContext=null;global.webkitAudioContext=null;
global.Audio=function(){return{preload:"",play:function(){return Promise.resolve()}}};
global.performance={now:function(){return Date.now()}};
global.S={};global.T={};
global.SCR={HOME:"home",GUIDED:"guided",SESSION:"session",DRILL:"drill"};
global.TAB={PRACTICE:"practice"};
global.render=function(){};global.saveState=function(){};global.snd=function(){};
eval(loadJS("js/data.js"));
eval(loadJS("js/instruments/bass/data.js"));
eval(loadJS("js/instruments/piano/data.js"));
eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));

console.log("\n=== Phase 1: Session Data Schema ===");
function validateSession(s,l){
  ["num","title","level","bpm"].forEach(function(f){assert.ok(s[f]!==undefined,l+" missing "+f)});
  assert.ok(s.spark&&typeof s.spark.text==="string",l+" spark.text must be string");
  assert.ok(s.review===null||(s.review&&typeof s.review.text==="string"),l+" review must be null or have text");
  assert.ok(s.newMove===null||(s.newMove&&typeof s.newMove.text==="string"),l+" newMove must be null or have text");
  assert.ok(s.songSlice===null||(s.songSlice&&typeof s.songSlice.text==="string"),l+" songSlice must be null or have text");
  assert.ok(s.victoryLap&&typeof s.victoryLap.text==="string",l+" victoryLap.text must be string");
}

test("Guitar: all sessions 5-phase",function(){GUITAR_SESSIONS.forEach(function(s,i){validateSession(s,"Guitar "+(i+1))})});
test("Piano: all sessions 5-phase",function(){var p=window.PIANO_SESSIONS||window.SESSION_PLANS;assert.ok(Array.isArray(p)&&p.length>=50);p.forEach(function(s,i){validateSession(s,"Piano "+(i+1))})});
test("Bass: all sessions 5-phase",function(){BASS_SESSIONS.forEach(function(s,i){validateSession(s,"Bass "+(i+1))})});
// Ukulele moved off the legacy 5-phase guided-session shape to engine-driven
// curriculum-track lessons (id/skill/objectives/masteryRequired) — see
// ukulele_lessons.js and ukulele_curriculum.js. Validate that contract instead.
test("Ukulele: lessons are curriculum-track shaped",function(){var u=window.SparkUkuleleLessons;assert.ok(u.length>=12);u.forEach(function(s,i){var l="Uke "+(i+1);assert.ok(typeof s.id==="string"&&s.id.length>0,l+" id");assert.ok(typeof s.skill==="string"&&s.skill.length>0,l+" skill");assert.ok(Array.isArray(s.objectives)&&s.objectives.length>0,l+" objectives");assert.ok(typeof s.masteryRequired==="number",l+" masteryRequired");assert.ok(typeof s.trackId==="string"&&s.trackId.length>0,l+" trackId")})});

console.log("\n=== Phase 2: Dispatch Unification ===");
test("Guitar handles start_guided_session",function(){assert.ok(loadJS("js/instruments/guitar/app.js").indexOf("start_guided_session")!==-1)});
test("Bass handles start_guided_session",function(){assert.ok(loadJS("js/instruments/bass/app.js").indexOf("start_guided_session")!==-1)});
test("No guidedStart in pages",function(){var t=loadJS("js/pages/guided.js")+loadJS("js/pages/practice.js");assert.ok(t.indexOf("guidedStart")===-1)});
test("No guidedStart in launchers",function(){assert.ok(loadJS("js/practice/launchers.js").indexOf("guidedStart")===-1)});

console.log("\n=== Phase 3: Guided Flow ===");
test("Phase order: spark first, victoryLap last",function(){var o=["spark","review","newMove","songSlice","victoryLap"];var p=GUITAR_SESSIONS[0];var a=o.filter(function(k){return p[k]!==null&&p[k]!==undefined});assert.strictEqual(a[0],"spark");assert.strictEqual(a[a.length-1],"victoryLap")});
test("Bass session 1 has review defined",function(){assert.ok(BASS_SESSIONS[0].hasOwnProperty("review"))});
test("Uke lesson 1 has title and objectives",function(){var p=window.SparkUkuleleLessons[0];assert.ok(typeof p.title==="string"&&p.title.length>0);assert.ok(Array.isArray(p.objectives)&&p.objectives.length>0)});
test("Every bass spark.text non-empty",function(){BASS_SESSIONS.forEach(function(s){assert.ok(s.spark.text.length>0)})});

console.log("\n=== Phase 4: MIDI verification targets ===");
test("Bass target notes derive from the tablature data",function(){
  assert.deepStrictEqual(BASS_CHORD_NOTES["E Open"],["E"]);
  assert.deepStrictEqual(BASS_CHORD_NOTES["C (A string)"],["C"]);
  assert.deepStrictEqual(BASS_CHORD_NOTES["Root-Fifth E-B"],["E","B"]);
  ["C","E","G"].forEach(function(n){assert.ok(BASS_CHORD_NOTES["Walk C-E-G"].indexOf(n)!==-1,"walk should visit "+n)});
});
test("Every bass guided newMove chord has derived target notes",function(){
  BASS_SESSIONS.forEach(function(s){
    if(s.newMove&&s.newMove.chord){
      var notes=BASS_CHORD_NOTES[s.newMove.chord];
      assert.ok(Array.isArray(notes)&&notes.length>0,"no target notes for '"+s.newMove.chord+"'");
    }
  });
});
eval(loadJS("js/pages/guided.js"));
test("guidedMidiChordMatch scores enharmonic spellings as equal",function(){
  global.getExpectedNotes=function(){return ["Bb","D","F"]};
  S.detectedNotes=["A#","D","F"];
  assert.strictEqual(guidedMidiChordMatch({name:"Bb"}),100,"A# must satisfy a Bb target");
  S.detectedNotes=["A#","D"];
  var partial=guidedMidiChordMatch({name:"Bb"});
  assert.ok(partial>0&&partial<100,"partial hold scores between 0 and 100, got "+partial);
  S.detectedNotes=[];
  assert.strictEqual(guidedMidiChordMatch({name:"Bb"}),-1,"no held notes cannot score");
  delete global.getExpectedNotes;
});
test("renderGuidedDoneGoalNudge survives an undefined S",function(){
  var savedS=global.S;
  delete global.S;
  assert.strictEqual(renderGuidedDoneGoalNudge(),"");
  global.S=savedS;
});

console.log("\n"+passed+" passed, "+failed+" failed");
if(failed>0)process.exit(1);
