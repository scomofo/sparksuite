#!/usr/bin/env node
// Analyzes curriculum data and suggests fixes.
var fs = require("fs"); var path = require("path");
global.window = global;
global.document = { getElementById:function(){return null}, querySelector:function(){return null}, querySelectorAll:function(){return []}, createElement:function(){return {getContext:function(){return {}},style:{}}} };
global.localStorage = (function(){var s={};return{getItem:function(k){return s[k]||null},setItem:function(k,v){s[k]=String(v)},removeItem:function(k){delete s[k]},clear:function(){s={}}}})();
global.navigator={userAgent:"node"}; global.AudioContext=null; global.webkitAudioContext=null;
global.Audio=function(){return{preload:"",play:function(){return Promise.resolve()}}};
global.performance={now:function(){return Date.now()}};
global.S={completedLessons:[],mastery:{chords:{},lessons:{},rhythm:{}},chordProgress:{},playerLevel:1};
global.SparkHighway={GUITAR_SKIN:{laneCount:6},PIANO_SKIN:{laneCount:24}};
global.escHTML=function(s){return String(s)};
global.SparkProfile={createEmpty:function(){return{schemaVersion:1,suite:"spark",userId:"local",apps:{},suiteRewards:{badges:[],cosmetics:[],challengeProgress:{}}}},ensureApp:function(p,id,i){p.apps=p.apps||{};if(!p.apps[id])p.apps[id]={instrument:i,stats:{level:1,xp:0,streakDays:0}}}};
global.SparkStorage={load:function(){return SparkProfile.createEmpty()}};
global.buildSkillTree=function(){return{branches:[]}};

function se(f){try{eval(fs.readFileSync(path.join(__dirname,"..",f),"utf8"));return true}catch(e){return false}}
se("js/launcher.js"); se("js/data.js"); se("js/instruments/piano/data.js"); se("js/instruments/bass/data.js");
se("js/sparksuite/instruments/ukulele/ukulele_lessons.js"); se("js/sparksuite/instruments/ukulele/ukulele_skill_tree.js");
se("js/instruments/guitar/register.js"); se("js/instruments/piano/register.js"); se("js/instruments/bass/register.js"); se("js/instruments/ukulele/register.js");

console.log("Curriculum Fix Suggestions"); console.log("========================="); console.log("");
var instruments = typeof SparkInstruments !== "undefined" ? SparkInstruments.getAll() : [];
var fixes = [];
instruments.forEach(function(inst) {
  var id = inst.id;
  var map = typeof inst.getCurriculumMap === "function" ? inst.getCurriculumMap() : [];
  var data = typeof inst.getData === "function" ? inst.getData() : {};
  var lc = data.LC || {}; var ln = data.LN || {};
  if (!map.length) { fixes.push("[" + id + "] getCurriculumMap() empty. Add lessons."); return; }
  var nums = map.map(function(i){return i.num}).filter(function(n){return n!=null});
  nums.forEach(function(n) {
    if (!lc[n]) fixes.push("[" + id + "] Add LC[" + n + "] (missing level color)");
    if (!ln[n]) fixes.push("[" + id + "] Add LN[" + n + "] (missing level name)");
  });
});
if (typeof SparkUkuleleLessons !== "undefined" && typeof SparkUkuleleSkillTree !== "undefined") {
  var sids = SparkUkuleleSkillTree.map(function(s){return s.id});
  SparkUkuleleLessons.forEach(function(l) {
    if (l.skill && sids.indexOf(l.skill) < 0) fixes.push("[ukespark] Add skill " + JSON.stringify(l.skill) + " to SkillTree (lesson " + l.id + ")");
    if (l.prerequisites) l.prerequisites.forEach(function(p) { if (sids.indexOf(p) < 0) fixes.push("[ukespark] Add skill " + JSON.stringify(p) + " to SkillTree (prereq of " + l.id + ")"); });
  });
}
if (!fixes.length) console.log("No issues found.");
else { fixes.forEach(function(f){console.log("  FIX: "+f)}); console.log(""); console.log(fixes.length+" fix(es) suggested."); }
