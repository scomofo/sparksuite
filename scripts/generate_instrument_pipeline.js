#!/usr/bin/env node
var fs = require("fs");
var path = require("path");
var NL = String.fromCharCode(10);
var Q = String.fromCharCode(34);
function q(s) { return Q + s + Q; }

var args = process.argv.slice(2);
if (!args.length) { console.log("Usage: node scripts/generate_instrument_pipeline.js <name> [--type T] [--strings N] [--id ID] [--levels N] [--dry-run]"); process.exit(0); }

var name = args[0].toLowerCase();
var Name = name.charAt(0).toUpperCase() + name.slice(1);
function ga(f,d) { var i=args.indexOf(f); return (i>=0&&args[i+1])?args[i+1]:d; }
var type = ga("--type","stringed"), strings = parseInt(ga("--strings","6")), appId = ga("--id",name+"spark"), levels = parseInt(ga("--levels","4")), dryRun = args.indexOf("--dry-run")>=0, isStr = type==="stringed";
var colors=["#22c55e","#3b82f6","#f97316","#8b5cf6","#06b6d4","#14b8a6","#0369a1","#7c3aed"];
var lnames=["First Steps","Building Blocks","Smooth Flow","Open Road","Deep Dive","New Territory","Advanced","Mastery"];

function wf(fp,c){if(dryRun){console.log("  [dry-run] "+fp);return}fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,c);console.log("  Created "+fp)}
console.log("Generating: " + Name + " (" + type + ", id=" + appId + ")");
var sd = "js/sparksuite/instruments/" + name + "/";
var rd = "js/instruments/" + name + "/";

var st = "(function() {" + NL + "  window.Spark" + Name + "SkillTree = [" + NL;
st += "    { id: " + q("basic_"+name) + ", category: " + q("fundamentals") + ", label: " + q("Basic "+Name) + " }," + NL;
st += "    { id: " + q("rhythm") + ", category: " + q("rhythm") + ", label: " + q("Rhythm") + " }," + NL;
st += "    { id: " + q("technique") + ", category: " + q("technique") + ", label: " + q("Technique") + " }" + NL;
st += "  ];" + NL + "})();" + NL;
wf(sd + name + "_skill_tree.js", st);

var ls = "(function() {" + NL + "  window.Spark" + Name + "Lessons = [" + NL;
for (var i = 1; i <= levels; i++) {
  var lid = name + "_" + String(i).padStart(2, "0");
  var sk = i===1 ? "basic_"+name : i===2 ? "rhythm" : "technique";
  var pr = i > 1 ? q("basic_"+name) : "";
  var cm = i < levels ? "," : "";
  ls += "    { id: "+q(lid)+", num: "+i+", title: "+q("Lesson "+i)+", skill: "+q(sk)+", prerequisites: ["+pr+"], masteryRequired: 0.6, desc: "+q(Name+" lesson "+i)+" }"+cm+NL;
}
ls += "  ];" + NL + "})();" + NL;
wf(sd + name + "_lessons.js", ls);

var ex = "(function() {" + NL + "  window.Spark" + Name + "Exercises = [" + NL;
ex += "    { id: "+q(name+"_ex_01")+", skill: "+q("basic_"+name)+", type: "+q("drill")+", desc: "+q("Basic "+Name+" drill")+" }," + NL;
ex += "    { id: "+q(name+"_ex_02")+", skill: "+q("rhythm")+", type: "+q("rhythm")+", desc: "+q("Rhythm exercise")+" }," + NL;
ex += "    { id: "+q(name+"_ex_03")+", skill: "+q("technique")+", type: "+q("drill")+", desc: "+q("Technique drill")+" }" + NL;
ex += "  ];" + NL + "})();" + NL;
wf(sd + name + "_exercises.js", ex);

var mo = "(function() {" + NL;
mo += "  var lessons = window.Spark"+Name+"Lessons || [];" + NL;
mo += "  var exercises = window.Spark"+Name+"Exercises || [];" + NL;
mo += "  var skillTree = window.Spark"+Name+"SkillTree || [];" + NL + NL;
mo += "  window.Spark"+Name+"Module = {" + NL;
mo += "    getCurriculumMap: function() { return lessons; }," + NL;
mo += "    getExercises: function(s) { if(!s)return exercises; return exercises.filter(function(e){return e.skill===s}); }," + NL;
mo += "    getSkillTree: function() { return skillTree; }," + NL;
mo += "    getSongs: function() { return []; }," + NL;
mo += "    getRhythmAdapter: function() { return null; }" + NL;
mo += "  };" + NL + "})();" + NL;
wf(sd + name + "_module.js", mo);
var ad = "(function() {" + NL;
ad += "  function "+Name+"Adapter() {}" + NL + NL;
ad += "  "+Name+"Adapter.prototype.getId = function() { return "+q(appId)+"; };" + NL;
ad += "  "+Name+"Adapter.prototype.getType = function() { return "+q(name)+"; };" + NL;
ad += "  "+Name+"Adapter.prototype.getCurriculumMap = function() { return window.Spark"+Name+"Module ? window.Spark"+Name+"Module.getCurriculumMap() : []; };" + NL;
ad += "  "+Name+"Adapter.prototype.getSongs = function() { return window.Spark"+Name+"Module ? window.Spark"+Name+"Module.getSongs() : []; };" + NL;
ad += "  "+Name+"Adapter.prototype.getRhythmAdapter = function() { return window.Spark"+Name+"Module ? window.Spark"+Name+"Module.getRhythmAdapter() : null; };" + NL;
ad += NL + "  window.Spark"+Name+"Adapter = "+Name+"Adapter;" + NL;
ad += "})();" + NL;
wf(sd + name + "_adapter.js", ad);

var ix = "(function() {" + NL;
ix += "  window.SparkSuiteInstrumentAdapters = window.SparkSuiteInstrumentAdapters || {};" + NL;
ix += "  window.SparkSuiteInstrumentAdapters." + name + " = function() { return new Spark" + Name + "Adapter(); };" + NL;
ix += "})();" + NL;
wf(sd + "index.js", ix);

var lc="", ln="";
for(var ci=0;ci<Math.max(levels,8);ci++){
  lc+="    "+(ci+1)+": "+q(colors[ci%colors.length])+(ci<Math.max(levels,8)-1?",":"")+NL;
  ln+="    "+(ci+1)+": "+q(lnames[ci%lnames.length])+(ci<Math.max(levels,8)-1?",":"")+NL;
}
var rg = "(function() {" + NL;
rg += "  var LC = {" + NL + lc + "  };" + NL;
rg += "  var LN = {" + NL + ln + "  };" + NL + NL;
rg += "  SparkInstruments.register({" + NL;
rg += "    id: "+q(appId)+"," + NL;
rg += "    instrument: "+q(name)+"," + NL;
rg += "    name: "+q(Name)+"," + NL;
rg += "    icon: "+q("🎵")+"," + NL;
rg += "    skin: null, available: true," + NL;
rg += "    capabilities: { stringCount: "+(isStr?strings:"null")+", noteLaneType: "+q(isStr?"string":type==="keys"?"key":"pad")+", chordShapeSupport: "+isStr+", midiInput: false, capoSupport: false, performanceModes: ["+q("rhythm")+"] }," + NL + NL;
rg += "    getData: function() { return { CHORDS:{}, ALL_CHORDS:{}, CURRICULUM: window.Spark"+Name+"Lessons||[], SKILL_TREE: window.Spark"+Name+"SkillTree||[], LC:LC, LN:LN, SESSIONS:[], SONGS:[] }; }," + NL + NL;
rg += "    init: function() {}," + NL;
rg += "    getSkillTree: function() { var t=window.Spark"+Name+"SkillTree||[]; return {branches:[{id:"+q("fundamentals")+",label:"+q("Fundamentals")+",nodes:t}]}; }," + NL;
rg += "    getCurriculumMap: function() { return window.Spark"+Name+"Lessons||[]; }," + NL;
rg += "    getExercises: function(s) { var e=window.Spark"+Name+"Exercises||[]; if(!s)return e; return e.filter(function(x){return x.skill===s}); }," + NL;
rg += "    getSongs: function() { return []; }," + NL;
rg += "    getExercisesForLesson: function() { return this.getExercises(); }," + NL;
rg += "    getPerformanceConfig: function() { return {laneCount:"+(isStr?strings:1)+",laneLabels:[],defaultBpm:80,supportedModes:["+q("rhythm")+"],inputType:"+q(isStr?"strum":type==="keys"?"key":"tap")+"}; }," + NL + NL;
rg += "    tabs: ["+q("practice")+"]," + NL;
rg += "    stemMutePreset: {}," + NL;
rg += "    pages: { home: function() { return "+q("<div>"+Name+" Home</div>")+"; } }," + NL;
rg += "    ui: {" + NL;
rg += "      chord: function() { return "+q("<svg width=80 height=80><text x=40 y=45 text-anchor=middle>"+Name+"</text></svg>")+"; }," + NL;
rg += "      header: function() { return "+q("<h2>"+Name+"</h2>")+"; }," + NL;
rg += "      ring: function(p) { return "+q("<span>")+"+Math.round(p*100)+"+q("%</span>")+"; }" + NL;
rg += "    }" + NL;
rg += "  });" + NL;
rg += "})();" + NL;
wf(rd + "register.js", rg);

var ap = "(function() {" + NL;
ap += "  window."+name+"Act = function(action) {" + NL;
ap += "    switch (action) {" + NL;
ap += "      case "+q("quickStart")+": return { started: true };" + NL;
ap += "      case "+q("resumeSession")+": return { resumed: true };" + NL;
ap += "      case "+q("startSession")+": return { session: true };" + NL;
ap += "      default: return null;" + NL;
ap += "    }" + NL;
ap += "  };" + NL;
ap += "})();" + NL;
wf(rd + "app.js", ap);

console.log("");
console.log("Done. Next: add data, update index.html, run tests.");
