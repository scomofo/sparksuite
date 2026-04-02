/* ===== Shared Editor Grid ===== */
/* Handoff 8: beat/grid line generation, BPM math, display labels */

(function(){

  function getEditorBpm(){
    return S.editorObject && S.editorObject.bpm ? S.editorObject.bpm : 80;
  }

  function getGridStepSec(div, bpm){
    bpm = bpm || getEditorBpm();
    var beatSec = 60 / bpm;
    if(div==="1/1") return beatSec * 4;
    if(div==="1/2") return beatSec * 2;
    if(div==="1/4") return beatSec;
    if(div==="1/8") return beatSec / 2;
    if(div==="1/16") return beatSec / 4;
    return beatSec;
  }

  function buildTimelineGridLines(startSec, endSec, bpm, div){
    bpm = bpm || getEditorBpm();
    div = div || S.editorGridDivision || "1/4";
    var step = getGridStepSec(div, bpm);
    var lines = [];
    var t = Math.max(0, Math.floor(startSec / step) * step);
    while(t <= endSec){
      lines.push({
        t:t,
        label:formatGridLabel(t, bpm)
      });
      t += step;
    }
    return lines;
  }

  function formatGridLabel(sec, bpm){
    bpm = bpm || getEditorBpm();
    var beatSec = 60 / bpm;
    var beat = Math.round(sec / beatSec) + 1;
    var bar = Math.floor((beat - 1) / 4) + 1;
    var beatInBar = ((beat - 1) % 4) + 1;
    return "Bar " + bar + " \u00b7 Beat " + beatInBar;
  }

  window.getEditorBpm = getEditorBpm;
  window.getGridStepSec = getGridStepSec;
  window.buildTimelineGridLines = buildTimelineGridLines;
  window.formatGridLabel = formatGridLabel;

})();
