/* ===== Shared Editor Seeds ===== */
/* Handoff 7: seed from song/exercise + duplication */

(function(){

  function seedChartFromSong(song, arrangementType){
    if(!song || typeof buildPerformanceChartFromSong!=="function") return null;
    return JSON.parse(JSON.stringify(
      buildPerformanceChartFromSong(song, arrangementType || defaultSeedArrangementType())
    ));
  }

  function seedExerciseFromGenerated(type, options){
    if(typeof generateExercise!=="function") return null;
    var ex = generateExercise(type, options || {});
    return ex ? JSON.parse(JSON.stringify(ex)) : null;
  }

  function duplicateEditorObject(obj){
    if(!obj) return null;
    var clone = JSON.parse(JSON.stringify(obj));
    clone.id = (clone.id || "copy") + "_copy_" + Date.now();
    if(clone.title) clone.title = clone.title + " Copy";
    return clone;
  }

  function defaultSeedArrangementType(){
    if(typeof APP_NAME!=="undefined" && /piano/i.test(APP_NAME)) return "block_chords";
    return "chords";
  }

  window.seedChartFromSong = seedChartFromSong;
  window.seedExerciseFromGenerated = seedExerciseFromGenerated;
  window.duplicateEditorObject = duplicateEditorObject;

})();

/* ===== ChordSpark-specific seed workflows ===== */

(function(){

  function seedChordSparkTransitionExercise(from, to){
    return {
      id:"exercise_transition_" + Date.now(),
      type:"transition",
      title:(from || "Chord") + " \u2192 " + (to || "Chord") + " Drill",
      description:"Seeded transition drill",
      bpm:S.drillAdaptiveBpm || 60,
      durationSec:60,
      steps:[
        { id:1, chord:from || "G", dur:2 },
        { id:2, chord:to || "C", dur:2 }
      ],
      meta:{ from:from || "G", to:to || "C" }
    };
  }

  window.seedChordSparkTransitionExercise = seedChordSparkTransitionExercise;

})();

/* ===== ChordSpark-specific seed entry points ===== */

function getSongByEditorParam(param){
  var idx = parseInt(param, 10);
  if(!isNaN(idx) && SONGS[idx]) return SONGS[idx];
  return null;
}

function getSeedArrangementForEditor(){
  return S.performArrangementType || "chords";
}

function getExerciseSeedByParam(param){
  if(param && param.indexOf("transition|")===0){
    var rest = param.split("|")[1] || "G,C";
    var parts = rest.split(",");
    return seedChordSparkTransitionExercise(parts[0], parts[1]);
  }
  return null;
}
