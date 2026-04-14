(function(){
  function editorHistoryRoot(){
    if(typeof window !== "undefined" && typeof window.editorStateRead === "function" && typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sharedRoot = SparkState.getRoot();
      if(sharedRoot) return sharedRoot;
    }
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorHistoryRead(path, fallback){
    if(typeof window !== "undefined" && typeof window.editorStateRead === "function"){
      return window.editorStateRead(path, fallback);
    }
    var root = editorHistoryRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function editorHistoryWrite(path, value){
    if(typeof window !== "undefined" && typeof window.editorStateWrite === "function"){
      return window.editorStateWrite(path, value);
    }
    var root = editorHistoryRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function editorHistoryEnsureArray(path){
    var current = editorHistoryRead(path, null);
    if(!Array.isArray(current)){
      current = [];
      editorHistoryWrite(path, current);
    }
    return current;
  }

  function beginEditorTransaction(label){
    if(!editorHistoryRead("editorObject", null)) return false;
    if(editorHistoryRead("editorTransaction", null)) return true;
    editorHistoryWrite("editorTransaction", {
      label: label || "Edit",
      before: createEditorHistoryEntry(label || "Edit")
    });
    return true;
  }

  function commitEditorTransaction(label){
    var editorTransaction = editorHistoryRead("editorTransaction", null);
    var editorObject = editorHistoryRead("editorObject", null);
    if(!editorObject) return false;
    var entry = createEditorHistoryEntry(label || (editorTransaction && editorTransaction.label) || "Edit");
    if(editorTransaction && sameEditorHistoryState(editorTransaction.before, entry)){
      editorHistoryWrite("editorTransaction", null);
      return false;
    }
    pushUndoEntry(editorTransaction ? editorTransaction.before : entry);
    editorHistoryWrite("editorRedoStack", []);
    editorHistoryWrite("editorTransaction", null);
    editorHistoryWrite("editorLastCommittedHash", hashEditorObjectState(editorObject));
    return true;
  }

  function cancelEditorTransaction(){
    editorHistoryWrite("editorTransaction", null);
    return true;
  }

  function createEditorHistoryEntry(label){
    return {
      label: label || "Edit",
      object: deepCloneEditorObject(editorHistoryRead("editorObject", null)),
      selectedId: editorHistoryRead("editorSelectedId", null) || null,
      selectionIds: Array.isArray(editorHistoryRead("editorSelectionIds", [])) ? editorHistoryRead("editorSelectionIds", []).slice() : [],
      ts: Date.now()
    };
  }

  function pushUndoEntry(entry){
    if(!entry) return false;
    var editorUndoStack = editorHistoryEnsureArray("editorUndoStack");
    editorUndoStack.push(entry);
    var maxLen = editorHistoryRead("editorHistoryLimit", 100) || 100;
    if(editorUndoStack.length > maxLen){
      editorUndoStack = editorUndoStack.slice(editorUndoStack.length - maxLen);
      editorHistoryWrite("editorUndoStack", editorUndoStack);
    }
    return true;
  }

  function pushRedoEntry(entry){
    if(!entry) return false;
    var editorRedoStack = editorHistoryEnsureArray("editorRedoStack");
    editorRedoStack.push(entry);
    var maxLen = editorHistoryRead("editorHistoryLimit", 100) || 100;
    if(editorRedoStack.length > maxLen){
      editorRedoStack = editorRedoStack.slice(editorRedoStack.length - maxLen);
      editorHistoryWrite("editorRedoStack", editorRedoStack);
    }
    return true;
  }

  function undoEditorChange(){
    var editorUndoStack = editorHistoryRead("editorUndoStack", []);
    if(!Array.isArray(editorUndoStack) || !editorUndoStack.length || !editorHistoryRead("editorObject", null)) return false;
    pushRedoEntry(createEditorHistoryEntry("Redo Point"));
    var entry = editorUndoStack.pop();
    restoreEditorHistoryEntry(entry);
    editorHistoryWrite("editorDirty", true);
    return true;
  }

  function redoEditorChange(){
    var editorRedoStack = editorHistoryRead("editorRedoStack", []);
    if(!Array.isArray(editorRedoStack) || !editorRedoStack.length || !editorHistoryRead("editorObject", null)) return false;
    pushUndoEntry(createEditorHistoryEntry("Undo Point"));
    var entry = editorRedoStack.pop();
    restoreEditorHistoryEntry(entry);
    editorHistoryWrite("editorDirty", true);
    return true;
  }

  function restoreEditorHistoryEntry(entry){
    if(!entry) return false;
    var selectionIds = Array.isArray(entry.selectionIds) ? entry.selectionIds.slice() : [];
    editorHistoryWrite("editorObject", deepCloneEditorObject(entry.object));
    editorHistoryWrite("editorSelectedId", entry.selectedId || null);
    editorHistoryWrite("editorSelectionIds", selectionIds);
    editorHistoryWrite("editorPrimarySelectionId", (entry.selectedId || null) || (selectionIds[0] || null));
    return true;
  }

  function sameEditorHistoryState(a, b){
    if(!a || !b) return false;
    return hashHistoryEntry(a) === hashHistoryEntry(b);
  }

  function hashHistoryEntry(entry){
    return JSON.stringify({
      object: entry.object || null,
      selectedId: entry.selectedId || null,
      selectionIds: entry.selectionIds || []
    });
  }

  function hashEditorObjectState(obj){
    return JSON.stringify(obj || null);
  }

  function deepCloneEditorObject(obj){
    return JSON.parse(JSON.stringify(obj || null));
  }

  function markEditorCheckpoint(label){
    if(!editorHistoryRead("editorObject", null)) return false;
    pushUndoEntry(createEditorHistoryEntry(label || "Checkpoint"));
    editorHistoryWrite("editorRedoStack", []);
    return true;
  }

  window.beginEditorTransaction = beginEditorTransaction;
  window.commitEditorTransaction = commitEditorTransaction;
  window.cancelEditorTransaction = cancelEditorTransaction;
  window.createEditorHistoryEntry = createEditorHistoryEntry;
  window.undoEditorChange = undoEditorChange;
  window.redoEditorChange = redoEditorChange;
  window.markEditorCheckpoint = markEditorCheckpoint;
  window.hashEditorObjectState = hashEditorObjectState;
})();
