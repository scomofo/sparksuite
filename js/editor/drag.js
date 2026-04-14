/* ===== Shared Editor Drag ===== */
/* Handoff 9: drag start/move/end, lane-aware event dragging */

(function(){

  function editorDragRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorDragRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorDragRoot();
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

  function editorDragWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorDragRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function beginEditorDrag(kind, id, startX, startY){
    var item = getSelectedEditorItem && getSelectedEditorItem();
    if(!item || String(item.id)!==String(id)) selectEditorItem(id);
    item = getSelectedEditorItem && getSelectedEditorItem();
    if(!item) return false;
    editorDragWrite("editorDragState", {
      kind:kind,
      id:id,
      startX:startX,
      startY:startY,
      original:JSON.parse(JSON.stringify(item))
    });
    return true;
  }

  function updateEditorDrag(x, y){
    var ds = editorDragRead("editorDragState", null);
    var editorObject = editorDragRead("editorObject", null);
    if(!ds || !editorObject) return false;
    var item = getSelectedEditorItem && getSelectedEditorItem();
    if(!item) return false;
    var dx = x - ds.startX;
    var dy = y - ds.startY;
    var m = getTimelinePixelMetrics();
    var deltaSec = dx / m.pxPerSec;
    var targetTime;
    if(ds.kind==="event"){
      targetTime = (ds.original.t || 0) + deltaSec;
      item.t = snapTimeSec(Math.max(0, targetTime));
      applyLaneDragToEvent(item, y, editorObject);
    }
    if(ds.kind==="phrase"){
      targetTime = (ds.original.startSec || 0) + deltaSec;
      var dur = (ds.original.endSec || 0) - (ds.original.startSec || 0);
      item.startSec = snapTimeSec(Math.max(0, targetTime));
      item.endSec = snapTimeSec(item.startSec + Math.max(0, dur));
      snapPhraseBounds(item);
    }
    editorDragWrite("editorDirty", true);
    return true;
  }

  function endEditorDrag(){
    editorDragWrite("editorDragState", null);
    return true;
  }

  function applyLaneDragToEvent(item, y, obj){
    var lanes = getEditorLanes(obj);
    var laneIndex = Math.max(0, Math.min(lanes.length - 1, editorYToLaneIndex(y)));
    var lane = lanes[laneIndex];
    if(!lane) return;
    if((obj.arrangementType || "")==="rhythm_chords"){
      if(!item.rhythm) item.rhythm = {};
      item.rhythm.dir = lane.id==="up" ? "U" : "D";
      if(item.performance) item.performance.laneLabel = (item.rhythm.dir==="U" ? "\u2191 " : "\u2193 ") + ((item.target && item.target.chordShort) || "");
    }
    if((obj.arrangementType || "")==="single_note"){
      if(!item.target) item.target = {};
      var pitch = lane.label || "C";
      item.target.pitchClass = pitch;
      if(item.performance) item.performance.laneLabel = item.target.note || pitch;
    }
    if((obj.arrangementType || "")==="left_hand_patterns"){
      if(item.performance) item.performance.laneLabel = lane.label;
    }
  }

  window.beginEditorDrag = beginEditorDrag;
  window.updateEditorDrag = updateEditorDrag;
  window.endEditorDrag = endEditorDrag;

})();
