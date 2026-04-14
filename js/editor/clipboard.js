(function(){
  function editorClipboardRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      return SparkState.getRoot();
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || null) : null;
  }

  function editorClipboardRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = editorClipboardRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorClipboardWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = editorClipboardRoot();
    if(root) root[path] = value;
    return value;
  }

  function copySelectedEditorItem(){
    var item = getSelectedEditorItem && getSelectedEditorItem();
    var kind = getSelectedEditorItemKind && getSelectedEditorItemKind();
    if(!item || !kind) return false;
    editorClipboardWrite("editorClipboard", {
      kind:kind,
      payload:JSON.parse(JSON.stringify(item))
    });
    return true;
  }

  function pasteEditorClipboardAtPlayhead(){
    var editorClipboard = editorClipboardRead("editorClipboard", null);
    var editorObject = editorClipboardRead("editorObject", null);
    var playheadSec = editorClipboardRead("editorPlayheadSec", 0) || 0;
    if(!editorClipboard || !editorObject) return false;
    markEditorCheckpoint("Paste Item");
    var clone = JSON.parse(JSON.stringify(editorClipboard.payload));
    clone.id = (clone.id || "copy") + "_p_" + Date.now();
    if(editorClipboard.kind==="event"){
      clone.t = snapTimeSec(playheadSec);
      addEditorItem("event", clone);
      editorClipboardWrite("editorSelectedId", clone.id);
      return true;
    }
    if(editorClipboard.kind==="phrase"){
      var dur = (clone.endSec || 0) - (clone.startSec || 0);
      clone.startSec = snapTimeSec(playheadSec);
      clone.endSec = clone.startSec + Math.max(0, dur);
      addEditorItem("phrase", clone);
      editorClipboardWrite("editorSelectedId", clone.id);
      return true;
    }
    if(editorClipboard.kind==="step"){
      addEditorItem("step", clone);
      editorClipboardWrite("editorSelectedId", clone.id);
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
    editorClipboardWrite("editorClipboard", {
      kind:"group",
      payload:payload
    });
    return true;
  }

  function pasteEditorClipboardGroupAtPlayhead(){
    var editorClipboard = editorClipboardRead("editorClipboard", null);
    var playheadSec = editorClipboardRead("editorPlayheadSec", 0) || 0;
    if(!editorClipboard) return false;
    if(editorClipboard.kind!=="group"){
      return pasteEditorClipboardAtPlayhead ? pasteEditorClipboardAtPlayhead() : false;
    }
    markEditorCheckpoint("Paste Group");
    var payload = JSON.parse(JSON.stringify(editorClipboard.payload || []));
    if(!payload.length) return false;
    var minTime = 999999;
    for(var i=0;i<payload.length;i++){
      if(payload[i].t != null) minTime = Math.min(minTime, payload[i].t);
      if(payload[i].startSec != null) minTime = Math.min(minTime, payload[i].startSec);
    }
    if(minTime===999999) minTime = 0;
    var offset = playheadSec - minTime;
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
