/* ===== Shared Editor Snapping ===== */
/* Handoff 8: snap-to-grid, nudge helpers, phrase snapping */

(function(){

  function editorSnapRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorSnapRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorSnapRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function snapTimeSec(sec, bpm, div){
    if(!editorSnapRead("editorSnapEnabled", false)) return sec;
    bpm = bpm || getEditorBpm();
    div = div || editorSnapRead("editorGridDivision", "1/4") || "1/4";
    var step = getGridStepSec(div, bpm);
    return Math.round(sec / step) * step;
  }

  function nudgeTimeSec(sec, direction, bpm, div){
    bpm = bpm || getEditorBpm();
    div = div || editorSnapRead("editorGridDivision", "1/4") || "1/4";
    var step = getGridStepSec(div, bpm);
    if(direction==="left") return Math.max(0, sec - step);
    if(direction==="right") return sec + step;
    return sec;
  }

  function snapPhraseBounds(phrase){
    if(!phrase) return phrase;
    phrase.startSec = snapTimeSec(phrase.startSec || 0);
    phrase.endSec = snapTimeSec(phrase.endSec || 0);
    if(phrase.endSec < phrase.startSec) phrase.endSec = phrase.startSec;
    return phrase;
  }

  window.snapTimeSec = snapTimeSec;
  window.nudgeTimeSec = nudgeTimeSec;
  window.snapPhraseBounds = snapPhraseBounds;

})();
