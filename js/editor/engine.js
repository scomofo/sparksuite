/* ===== Shared Chart/Exercise Editor Engine ===== */
/* Handoff 6: editor state, object creation, item manipulation */

(function(){

  function editorStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorStateRead(path, fallback){
    var root = editorStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function editorStateWrite(path, value){
    var root = editorStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function openEditor(mode, object){
    var editorMode = mode || "chart";
    editorStateWrite("editorMode", editorMode);
    editorStateWrite("editorObject", object ? deepClone(object) : createEmptyEditorObject(editorMode));
    editorStateWrite("editorDirty", false);
    editorStateWrite("editorSelectedId", null);
    editorStateWrite("screen", SCR.EDITOR);
  }

  function createEmptyEditorObject(mode){
    if(mode==="exercise"){
      return createEmptyExercise();
    }
    return createEmptyChart();
  }

  function createEmptyChart(){
    var chart = createPerformanceChartShell ? createPerformanceChartShell() : {
      id:"",
      songId:"",
      title:"",
      artist:"",
      arrangementType:"",
      bpm:80,
      phrases:[],
      events:[]
    };
    chart.id = "custom_" + Date.now();
    chart.title = "Untitled Chart";
    chart.artist = "";
    chart.arrangementType = defaultArrangementType();
    chart.bpm = 80;
    chart.phrases = [{ id:0, name:"Phrase 1", startSec:0, endSec:4 }];
    chart.events = [];
    return chart;
  }

  function createEmptyExercise(){
    return {
      id:"exercise_" + Date.now(),
      type:"exercise",
      title:"Untitled Exercise",
      description:"",
      bpm:80,
      durationSec:60,
      steps:[],
      meta:{}
    };
  }

  function updateEditorField(path, value){
    var editorObject = editorStateRead("editorObject", null);
    if(!editorObject) return;
    setByPath(editorObject, path, value);
    editorStateWrite("editorObject", editorObject);
    editorStateWrite("editorDirty", true);
  }

  function addEditorItem(kind, item){
    var editorObject = editorStateRead("editorObject", null);
    if(!editorObject) return;
    if(kind==="event"){
      if(!Array.isArray(editorObject.events)) editorObject.events = [];
      editorObject.events.push(item);
      editorObject.events.sort(function(a,b){ return (a.t||0) - (b.t||0); });
    }
    if(kind==="phrase"){
      if(!Array.isArray(editorObject.phrases)) editorObject.phrases = [];
      editorObject.phrases.push(item);
    }
    if(kind==="step"){
      if(!Array.isArray(editorObject.steps)) editorObject.steps = [];
      editorObject.steps.push(item);
    }
    editorStateWrite("editorObject", editorObject);
    editorStateWrite("editorDirty", true);
  }

  function removeEditorItem(kind, id){
    var editorObject = editorStateRead("editorObject", null);
    if(!editorObject) return;
    if(kind==="event" && Array.isArray(editorObject.events)){
      editorObject.events = editorObject.events.filter(function(x){ return String(x.id)!==String(id); });
    }
    if(kind==="phrase" && Array.isArray(editorObject.phrases)){
      editorObject.phrases = editorObject.phrases.filter(function(x){ return String(x.id)!==String(id); });
    }
    if(kind==="step" && Array.isArray(editorObject.steps)){
      editorObject.steps = editorObject.steps.filter(function(x){ return String(x.id)!==String(id); });
    }
    editorStateWrite("editorObject", editorObject);
    if(String(editorStateRead("editorSelectedId", null))===String(id)) editorStateWrite("editorSelectedId", null);
    editorStateWrite("editorDirty", true);
  }

  function selectEditorItem(id){
    editorStateWrite("editorSelectedId", id);
  }

  function defaultArrangementType(){
    if(typeof APP_NAME!=="undefined" && /piano/i.test(APP_NAME)) return "block_chords";
    return "chords";
  }

  function deepClone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function setByPath(obj, path, value){
    var parts = String(path || "").split(".");
    var cur = obj;
    for(var i=0;i<parts.length-1;i++){
      if(cur[parts[i]]==null || typeof cur[parts[i]]!=="object") cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length-1]] = value;
  }

  /* Handoff 7: default item creators */

  function addDefaultEditorEvent(){
    if(!editorStateRead("editorObject", null)) return;
    addEditorItem("event", {
      id:"evt_" + Date.now(),
      t:0,
      dur:1,
      type:"event",
      target:{},
      performance:{ laneLabel:"New Event", phraseId:0 }
    });
  }

  function addDefaultEditorPhrase(){
    var editorObject = editorStateRead("editorObject", null);
    if(!editorObject) return;
    var idx = Array.isArray(editorObject.phrases) ? editorObject.phrases.length : 0;
    addEditorItem("phrase", {
      id:"phrase_" + Date.now(),
      name:"Phrase " + (idx + 1),
      startSec:0,
      endSec:4
    });
  }

  function addDefaultEditorStep(){
    if(!editorStateRead("editorObject", null)) return;
    addEditorItem("step", {
      id:"step_" + Date.now(),
      dur:1
    });
  }

  /* Handoff 8: ChordSpark-specific default event at playhead */

  function addSeededDefaultEventAtPlayhead(){
    var editorObject = editorStateRead("editorObject", null);
    var arrangement = editorObject && editorObject.arrangementType || "chords";
    if(arrangement==="rhythm_chords"){
      addEventAtPlayhead({
        type:"strum",
        target:{ chordShort:"G", chordName:"G Major", pitchClasses:["G","B","D"] },
        rhythm:{ dir:"D" },
        performance:{ laneLabel:"\u2193 G", phraseId:0 }
      });
      return;
    }
    if(arrangement==="single_note"){
      addEventAtPlayhead({
        type:"single_note",
        target:{ midi:64, note:"E4", pitchClass:"E" },
        performance:{ laneLabel:"E4", phraseId:0 }
      });
      return;
    }
    addEventAtPlayhead({
      type:"chord",
      target:{ chordShort:"G", chordName:"G Major", pitchClasses:["G","B","D"] },
      performance:{ laneLabel:"G", phraseId:0 }
    });
  }

  window.openEditor = openEditor;
  window.createEmptyEditorObject = createEmptyEditorObject;
  window.createEmptyChart = createEmptyChart;
  window.createEmptyExercise = createEmptyExercise;
  window.updateEditorField = updateEditorField;
  window.addEditorItem = addEditorItem;
  window.removeEditorItem = removeEditorItem;
  window.selectEditorItem = selectEditorItem;
  window.addDefaultEditorEvent = addDefaultEditorEvent;
  window.addDefaultEditorPhrase = addDefaultEditorPhrase;
  window.addDefaultEditorStep = addDefaultEditorStep;
  window.addSeededDefaultEventAtPlayhead = addSeededDefaultEventAtPlayhead;
  window.editorStateRead = editorStateRead;
  window.editorStateWrite = editorStateWrite;

})();
