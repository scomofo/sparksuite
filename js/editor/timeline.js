/* ===== Shared Editor Timeline ===== */
/* Handoff 8: playhead, zoom, visible range, add-at-playhead, nudge */

(function(){

  function editorTimelineRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorTimelineRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorTimelineRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorTimelineWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorTimelineRoot();
    if(root) root[path] = value;
    return value;
  }

  function getEditorTimelineRange(){
    var playheadSec = editorTimelineRead("editorPlayheadSec", 0) || 0;
    var windowSec = editorTimelineRead("editorTimelineWindowSec", 16) || 16;
    var start = Math.max(0, playheadSec - (windowSec / 4));
    var end = start + windowSec;
    return { startSec:start, endSec:end };
  }

  function setEditorPlayhead(sec){
    editorTimelineWrite("editorPlayheadSec", Math.max(0, sec || 0));
  }

  function moveEditorPlayhead(direction){
    var gridDivision = editorTimelineRead("editorGridDivision", "1/4") || "1/4";
    var playheadSec = editorTimelineRead("editorPlayheadSec", 0) || 0;
    var step = getGridStepSec(gridDivision, getEditorBpm());
    if(direction==="left") editorTimelineWrite("editorPlayheadSec", Math.max(0, playheadSec - step));
    if(direction==="right") editorTimelineWrite("editorPlayheadSec", playheadSec + step);
  }

  function addEventAtPlayhead(base){
    var evt = JSON.parse(JSON.stringify(base || {}));
    evt.id = evt.id || ("evt_" + Date.now());
    evt.t = snapTimeSec(editorTimelineRead("editorPlayheadSec", 0) || 0);
    evt.dur = evt.dur != null ? evt.dur : getGridStepSec(editorTimelineRead("editorGridDivision", "1/4") || "1/4", getEditorBpm());
    addEditorItem("event", evt);
    editorTimelineWrite("editorSelectedId", evt.id);
  }

  function addPhraseAtPlayhead(){
    var start = snapTimeSec(editorTimelineRead("editorPlayheadSec", 0) || 0);
    var len = getGridStepSec("1/1", getEditorBpm());
    var phrase = {
      id:"phrase_" + Date.now(),
      name:"Phrase",
      startSec:start,
      endSec:start + len
    };
    addEditorItem("phrase", phrase);
    editorTimelineWrite("editorSelectedId", phrase.id);
  }

  function nudgeSelectedEditorItem(direction){
    var item = getSelectedEditorItem ? getSelectedEditorItem() : null;
    var kind = getSelectedEditorItemKind ? getSelectedEditorItemKind() : null;
    if(!item || !kind) return false;
    if(kind==="event"){
      item.t = nudgeTimeSec(item.t || 0, direction);
    }
    if(kind==="phrase"){
      item.startSec = nudgeTimeSec(item.startSec || 0, direction);
      item.endSec = nudgeTimeSec(item.endSec || 0, direction);
      snapPhraseBounds(item);
    }
    if(kind==="step" && item.t != null){
      item.t = nudgeTimeSec(item.t || 0, direction);
    }
    editorTimelineWrite("editorDirty", true);
    return true;
  }

  function getEditorItemDisplayTime(item, kind){
    if(kind==="event") return item.t || 0;
    if(kind==="phrase") return item.startSec || 0;
    if(kind==="step") return item.t || 0;
    return 0;
  }

  window.getEditorTimelineRange = getEditorTimelineRange;
  window.setEditorPlayhead = setEditorPlayhead;
  window.moveEditorPlayhead = moveEditorPlayhead;
  window.addEventAtPlayhead = addEventAtPlayhead;
  window.addPhraseAtPlayhead = addPhraseAtPlayhead;
  window.nudgeSelectedEditorItem = nudgeSelectedEditorItem;
  window.getEditorItemDisplayTime = getEditorItemDisplayTime;

})();
