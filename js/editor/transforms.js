(function(){
  function editorTransformRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorTransformRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = editorTransformRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorTransformWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = editorTransformRoot();
    if(root) root[path] = value;
    return value;
  }

  function duplicateBarRange(startBar, endBar, insertAtBar){
    var editorObject = editorTransformRead("editorObject", null);
    if(!editorObject || !Array.isArray(editorObject.events)) return false;
    markEditorCheckpoint("Duplicate Bars");
    var bpm = getEditorBpm();
    var barSec = getGridStepSec("1/1", bpm);
    var startSec = (startBar - 1) * barSec;
    var endSec = endBar * barSec;
    var insertSec = (insertAtBar - 1) * barSec;
    var copied = [];
    for(var i=0;i<editorObject.events.length;i++){
      var e = editorObject.events[i];
      if((e.t || 0) >= startSec && (e.t || 0) < endSec){
        var c = JSON.parse(JSON.stringify(e));
        c.id = (c.id || "evt") + "_dup_" + Date.now() + "_" + i;
        c.t = insertSec + ((e.t || 0) - startSec);
        copied.push(c);
      }
    }
    for(var j=0;j<copied.length;j++){
      addEditorItem("event", copied[j]);
    }
    editorTransformWrite("editorDirty", true);
    return copied.length > 0;
  }

  function duplicateSelectedPhraseRegion(){
    var item = getSelectedEditorItem && getSelectedEditorItem();
    var kind = getSelectedEditorItemKind && getSelectedEditorItemKind();
    if(!item || kind!=="phrase") return false;
    markEditorCheckpoint("Duplicate Phrase Region");
    var dur = (item.endSec || 0) - (item.startSec || 0);
    var offset = dur;
    var copied = [];
    var editorObject = editorTransformRead("editorObject", {}) || {};
    for(var i=0;i<(editorObject.events || []).length;i++){
      var e = editorObject.events[i];
      if((e.t || 0) >= (item.startSec || 0) && (e.t || 0) < (item.endSec || 0)){
        var c = JSON.parse(JSON.stringify(e));
        c.id = (c.id || "evt") + "_phrdup_" + Date.now() + "_" + i;
        c.t = (e.t || 0) + offset;
        copied.push(c);
      }
    }
    for(var j=0;j<copied.length;j++){
      addEditorItem("event", copied[j]);
    }
    addEditorItem("phrase", {
      id:"phrase_dup_" + Date.now(),
      name:(item.name || "Phrase") + " Copy",
      startSec:(item.startSec || 0) + offset,
      endSec:(item.endSec || 0) + offset
    });
    editorTransformWrite("editorDirty", true);
    return true;
  }

  function deleteSelectedEditorItems(){
    markEditorCheckpoint("Delete Selection");
    var ids = (editorTransformRead("editorSelectionIds", []) || []).slice();
    var selectedId = editorTransformRead("editorSelectedId", null);
    if(!ids.length && selectedId!=null) ids = [String(selectedId)];
    for(var i=0;i<ids.length;i++){
      var kind = getEditorItemKindById(ids[i]);
      if(kind) removeEditorItem(kind, ids[i]);
    }
    clearEditorSelection();
    editorTransformWrite("editorDirty", true);
  }

  function getEditorItemKindById(id){
    var editorObject = editorTransformRead("editorObject", null);
    if(!editorObject) return null;
    var groups = [
      { kind:"event", arr:editorObject.events || [] },
      { kind:"phrase", arr:editorObject.phrases || [] },
      { kind:"step", arr:editorObject.steps || [] }
    ];
    for(var g=0;g<groups.length;g++){
      for(var i=0;i<groups[g].arr.length;i++){
        if(String(groups[g].arr[i].id)===String(id)) return groups[g].kind;
      }
    }
    return null;
  }

  function nudgeSelectedEditorGroup(direction, multiplier){
    multiplier = multiplier || 1;
    var items = getSelectedEditorItems ? getSelectedEditorItems() : [];
    var step = getGridStepSec(editorTransformRead("editorGridDivision", "1/4") || "1/4", getEditorBpm()) * multiplier;
    for(var i=0;i<items.length;i++){
      var kind = getEditorItemKindById(items[i].id);
      if(kind==="event"){
        items[i].t = direction==="left"
          ? Math.max(0, (items[i].t || 0) - step)
          : (items[i].t || 0) + step;
        items[i].t = snapTimeSec(items[i].t);
      }
      if(kind==="phrase"){
        items[i].startSec = direction==="left"
          ? Math.max(0, (items[i].startSec || 0) - step)
          : (items[i].startSec || 0) + step;
        items[i].endSec = direction==="left"
          ? Math.max(items[i].startSec || 0, (items[i].endSec || 0) - step)
          : (items[i].endSec || 0) + step;
        snapPhraseBounds(items[i]);
      }
    }
    editorTransformWrite("editorDirty", true);
  }

  window.duplicateBarRange = duplicateBarRange;
  window.duplicateSelectedPhraseRegion = duplicateSelectedPhraseRegion;
  window.deleteSelectedEditorItems = deleteSelectedEditorItems;
  window.getEditorItemKindById = getEditorItemKindById;
  window.nudgeSelectedEditorGroup = nudgeSelectedEditorGroup;
})();
