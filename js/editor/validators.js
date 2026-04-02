/* ===== Shared Editor Validators ===== */
/* Handoff 6 + 7 + 8: shape, ordering, and timing validation */

(function(){

  function validateEditorObject(obj){
    var errors = [];
    if(!obj) return ["No object loaded"];
    if(isChartObject(obj)){
      validateChart(obj, errors);
      validateChartOrdering(obj, errors);
      validateChartTiming(obj, errors);
    }else if(isExerciseObject(obj)){
      validateExercise(obj, errors);
    }else{
      errors.push("Unknown editor object type");
    }
    return errors;
  }

  function isChartObject(obj){
    return Array.isArray(obj.events) || Array.isArray(obj.phrases);
  }

  function isExerciseObject(obj){
    return Array.isArray(obj.steps) || obj.type==="exercise";
  }

  function validateChart(chart, errors){
    if(!chart.id) errors.push("Chart id is required");
    if(!chart.title) errors.push("Chart title is required");
    if(!chart.arrangementType) errors.push("Arrangement type is required");
    if(typeof chart.bpm!=="number" || chart.bpm <= 0) errors.push("Chart BPM must be > 0");
    if(Array.isArray(chart.events)){
      for(var i=0;i<chart.events.length;i++){
        var e = chart.events[i];
        if(typeof e.t!=="number") errors.push("Event " + i + " missing time");
        if(!e.type) errors.push("Event " + i + " missing type");
      }
    }
    if(Array.isArray(chart.phrases)){
      for(var p=0;p<chart.phrases.length;p++){
        var ph = chart.phrases[p];
        if(typeof ph.startSec!=="number" || typeof ph.endSec!=="number"){
          errors.push("Phrase " + p + " missing time bounds");
        }
        if(ph.endSec < ph.startSec){
          errors.push("Phrase " + p + " ends before it starts");
        }
      }
    }
  }

  function validateExercise(ex, errors){
    if(!ex.id) errors.push("Exercise id is required");
    if(!ex.title) errors.push("Exercise title is required");
    if(typeof ex.durationSec!=="number" || ex.durationSec <= 0){
      errors.push("Exercise duration must be > 0");
    }
  }

  function validateChartOrdering(chart, errors){
    if(!Array.isArray(chart.events)) return;
    for(var i=1;i<chart.events.length;i++){
      if((chart.events[i].t||0) < (chart.events[i-1].t||0)){
        errors.push("Events are out of time order");
        break;
      }
    }
  }

  function validateChartTiming(chart, errors){
    if(Array.isArray(chart.events)){
      for(var i=0;i<chart.events.length;i++){
        if((chart.events[i].dur || 0) < 0){
          errors.push("Event " + i + " has negative duration");
        }
      }
    }
    if(Array.isArray(chart.phrases)){
      for(var p=1;p<chart.phrases.length;p++){
        if((chart.phrases[p].startSec || 0) < (chart.phrases[p-1].startSec || 0)){
          errors.push("Phrases are out of order");
          break;
        }
      }
    }
  }

  function validateLanePlacement(chart, errors){
    if(!Array.isArray(chart.events)) return;
    for(var i=0;i<chart.events.length;i++){
      if(!chart.events[i].type){
        errors.push("Event " + i + " has no type for lane resolution");
      }
    }
  }

  window.validateEditorObject = validateEditorObject;

})();
