/* ===== Shared Chart/Exercise Editor Engine ===== */
/* Handoff 6: editor state, object creation, item manipulation */

(function(){

  function openEditor(mode, object){
    S.editorMode = mode || "chart";
    S.editorObject = object ? deepClone(object) : createEmptyEditorObject(S.editorMode);
    S.editorDirty = false;
    S.editorSelectedId = null;
    S.screen = SCR.EDITOR;
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
    if(!S.editorObject) return;
    setByPath(S.editorObject, path, value);
    S.editorDirty = true;
  }

  function addEditorItem(kind, item){
    if(!S.editorObject) return;
    if(kind==="event"){
      if(!Array.isArray(S.editorObject.events)) S.editorObject.events = [];
      S.editorObject.events.push(item);
      S.editorObject.events.sort(function(a,b){ return (a.t||0) - (b.t||0); });
    }
    if(kind==="phrase"){
      if(!Array.isArray(S.editorObject.phrases)) S.editorObject.phrases = [];
      S.editorObject.phrases.push(item);
    }
    if(kind==="step"){
      if(!Array.isArray(S.editorObject.steps)) S.editorObject.steps = [];
      S.editorObject.steps.push(item);
    }
    S.editorDirty = true;
  }

  function removeEditorItem(kind, id){
    if(!S.editorObject) return;
    if(kind==="event" && Array.isArray(S.editorObject.events)){
      S.editorObject.events = S.editorObject.events.filter(function(x){ return String(x.id)!==String(id); });
    }
    if(kind==="phrase" && Array.isArray(S.editorObject.phrases)){
      S.editorObject.phrases = S.editorObject.phrases.filter(function(x){ return String(x.id)!==String(id); });
    }
    if(kind==="step" && Array.isArray(S.editorObject.steps)){
      S.editorObject.steps = S.editorObject.steps.filter(function(x){ return String(x.id)!==String(id); });
    }
    if(String(S.editorSelectedId)===String(id)) S.editorSelectedId = null;
    S.editorDirty = true;
  }

  function selectEditorItem(id){
    S.editorSelectedId = id;
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
    if(!S.editorObject) return;
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
    if(!S.editorObject) return;
    var idx = Array.isArray(S.editorObject.phrases) ? S.editorObject.phrases.length : 0;
    addEditorItem("phrase", {
      id:"phrase_" + Date.now(),
      name:"Phrase " + (idx + 1),
      startSec:0,
      endSec:4
    });
  }

  function addDefaultEditorStep(){
    if(!S.editorObject) return;
    addEditorItem("step", {
      id:"step_" + Date.now(),
      dur:1
    });
  }

  /* Handoff 8: ChordSpark-specific default event at playhead */

  function addSeededDefaultEventAtPlayhead(){
    var arrangement = S.editorObject && S.editorObject.arrangementType || "chords";
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

})();
