(function(){
  function copySelectedEditorItem(){
    var item = getSelectedEditorItem && getSelectedEditorItem();
    var kind = getSelectedEditorItemKind && getSelectedEditorItemKind();
    if(!item || !kind) return false;
    S.editorClipboard = {
      kind:kind,
      payload:JSON.parse(JSON.stringify(item))
    };
    return true;
  }

  function pasteEditorClipboardAtPlayhead(){
    if(!S.editorClipboard || !S.editorObject) return false;
    markEditorCheckpoint("Paste Item");
    var clone = JSON.parse(JSON.stringify(S.editorClipboard.payload));
    clone.id = (clone.id || "copy") + "_p_" + Date.now();
    if(S.editorClipboard.kind==="event"){
      clone.t = snapTimeSec(S.editorPlayheadSec || 0);
      addEditorItem("event", clone);
      S.editorSelectedId = clone.id;
      return true;
    }
    if(S.editorClipboard.kind==="phrase"){
      var dur = (clone.endSec || 0) - (clone.startSec || 0);
      clone.startSec = snapTimeSec(S.editorPlayheadSec || 0);
      clone.endSec = clone.startSec + Math.max(0, dur);
      addEditorItem("phrase", clone);
      S.editorSelectedId = clone.id;
      return true;
    }
    if(S.editorClipboard.kind==="step"){
      addEditorItem("step", clone);
      S.editorSelectedId = clone.id;
      return true;
    }
    return false;
  }

  function duplicateSelectedEditorItem(){
    markEditorCheckpoint("Duplicate Selection");
    if(!copySelectedEditorItem()) return false;
    return pasteEditorClipboardAtPlayhead();
  }

  function copySelectedEditorItemGroup(){
    var items = getSelectedEditorItems ? getSelectedEditorItems() : [];
    if(!items.length){
      return copySelectedEditorItem ? copySelectedEditorItem() : false;
    }
    var payload = [];
    for(var i=0;i<items.length;i++){
      payload.push(JSON.parse(JSON.stringify(items[i])));
    }
    S.editorClipboard = {
      kind:"group",
      payload:payload
    };
    return true;
  }

  function pasteEditorClipboardGroupAtPlayhead(){
    if(!S.editorClipboard) return false;
    if(S.editorClipboard.kind!=="group"){
      return pasteEditorClipboardAtPlayhead ? pasteEditorClipboardAtPlayhead() : false;
    }
    markEditorCheckpoint("Paste Group");
    var payload = JSON.parse(JSON.stringify(S.editorClipboard.payload || []));
    if(!payload.length) return false;
    var minTime = 999999;
    for(var i=0;i<payload.length;i++){
      if(payload[i].t != null) minTime = Math.min(minTime, payload[i].t);
      if(payload[i].startSec != null) minTime = Math.min(minTime, payload[i].startSec);
    }
    if(minTime===999999) minTime = 0;
    var offset = (S.editorPlayheadSec || 0) - minTime;
    clearEditorSelection();
    for(var j=0;j<payload.length;j++){
      var item = payload[j];
      item.id = (item.id || "copy") + "_grp_" + Date.now() + "_" + j;
      if(item.t != null) item.t = snapTimeSec(item.t + offset);
      if(item.startSec != null) item.startSec = snapTimeSec(item.startSec + offset);
      if(item.endSec != null) item.endSec = snapTimeSec(item.endSec + offset);
      var kind = item.type && item.target ? "event" : (item.name && item.startSec != null ? "phrase" : "step");
      addEditorItem(kind, item);
      addEditorSelection(item.id);
    }
    return true;
  }

  function duplicateSelectedEditorGroup(){
    markEditorCheckpoint("Duplicate Selection");
    if(!copySelectedEditorItemGroup()) return false;
    return pasteEditorClipboardGroupAtPlayhead();
  }

  window.copySelectedEditorItem = copySelectedEditorItem;
  window.pasteEditorClipboardAtPlayhead = pasteEditorClipboardAtPlayhead;
  window.duplicateSelectedEditorItem = duplicateSelectedEditorItem;
  window.copySelectedEditorItemGroup = copySelectedEditorItemGroup;
  window.pasteEditorClipboardGroupAtPlayhead = pasteEditorClipboardGroupAtPlayhead;
  window.duplicateSelectedEditorGroup = duplicateSelectedEditorGroup;
})();
