(function(){
  function duplicateBarRange(startBar, endBar, insertAtBar){
    if(!S.editorObject || !Array.isArray(S.editorObject.events)) return false;
    markEditorCheckpoint("Duplicate Bars");
    var bpm = getEditorBpm();
    var barSec = getGridStepSec("1/1", bpm);
    var startSec = (startBar - 1) * barSec;
    var endSec = endBar * barSec;
    var insertSec = (insertAtBar - 1) * barSec;
    var copied = [];
    for(var i=0;i<S.editorObject.events.length;i++){
      var e = S.editorObject.events[i];
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
    S.editorDirty = true;
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
    for(var i=0;i<(S.editorObject.events || []).length;i++){
      var e = S.editorObject.events[i];
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
    S.editorDirty = true;
    return true;
  }

  function deleteSelectedEditorItems(){
    markEditorCheckpoint("Delete Selection");
    var ids = (S.editorSelectionIds || []).slice();
    if(!ids.length && S.editorSelectedId!=null) ids = [String(S.editorSelectedId)];
    for(var i=0;i<ids.length;i++){
      var kind = getEditorItemKindById(ids[i]);
      if(kind) removeEditorItem(kind, ids[i]);
    }
    clearEditorSelection();
    S.editorDirty = true;
  }

  function getEditorItemKindById(id){
    if(!S.editorObject) return null;
    var groups = [
      { kind:"event", arr:S.editorObject.events || [] },
      { kind:"phrase", arr:S.editorObject.phrases || [] },
      { kind:"step", arr:S.editorObject.steps || [] }
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
    var step = getGridStepSec(S.editorGridDivision || "1/4", getEditorBpm()) * multiplier;
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
    S.editorDirty = true;
  }

  window.duplicateBarRange = duplicateBarRange;
  window.duplicateSelectedPhraseRegion = duplicateSelectedPhraseRegion;
  window.deleteSelectedEditorItems = deleteSelectedEditorItems;
  window.getEditorItemKindById = getEditorItemKindById;
  window.nudgeSelectedEditorGroup = nudgeSelectedEditorGroup;
})();
