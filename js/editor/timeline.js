/* ===== Shared Editor Timeline ===== */
/* Handoff 8: playhead, zoom, visible range, add-at-playhead, nudge */

(function(){

  function getEditorTimelineRange(){
    var start = Math.max(0, S.editorPlayheadSec - (S.editorTimelineWindowSec / 4));
    var end = start + (S.editorTimelineWindowSec || 16);
    return { startSec:start, endSec:end };
  }

  function setEditorPlayhead(sec){
    S.editorPlayheadSec = Math.max(0, sec || 0);
  }

  function moveEditorPlayhead(direction){
    var step = getGridStepSec(S.editorGridDivision || "1/4", getEditorBpm());
    if(direction==="left") S.editorPlayheadSec = Math.max(0, (S.editorPlayheadSec || 0) - step);
    if(direction==="right") S.editorPlayheadSec = (S.editorPlayheadSec || 0) + step;
  }

  function addEventAtPlayhead(base){
    var evt = JSON.parse(JSON.stringify(base || {}));
    evt.id = evt.id || ("evt_" + Date.now());
    evt.t = snapTimeSec(S.editorPlayheadSec || 0);
    evt.dur = evt.dur != null ? evt.dur : getGridStepSec(S.editorGridDivision || "1/4", getEditorBpm());
    addEditorItem("event", evt);
    S.editorSelectedId = evt.id;
  }

  function addPhraseAtPlayhead(){
    var start = snapTimeSec(S.editorPlayheadSec || 0);
    var len = getGridStepSec("1/1", getEditorBpm());
    var phrase = {
      id:"phrase_" + Date.now(),
      name:"Phrase",
      startSec:start,
      endSec:start + len
    };
    addEditorItem("phrase", phrase);
    S.editorSelectedId = phrase.id;
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
    S.editorDirty = true;
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
