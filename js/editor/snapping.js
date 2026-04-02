/* ===== Shared Editor Snapping ===== */
/* Handoff 8: snap-to-grid, nudge helpers, phrase snapping */

(function(){

  function snapTimeSec(sec, bpm, div){
    if(!S.editorSnapEnabled) return sec;
    bpm = bpm || getEditorBpm();
    div = div || S.editorGridDivision || "1/4";
    var step = getGridStepSec(div, bpm);
    return Math.round(sec / step) * step;
  }

  function nudgeTimeSec(sec, direction, bpm, div){
    bpm = bpm || getEditorBpm();
    div = div || S.editorGridDivision || "1/4";
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
