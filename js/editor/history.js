(function(){
  function beginEditorTransaction(label){
    if(!S.editorObject) return false;
    if(S.editorTransaction) return true;
    S.editorTransaction = {
      label: label || "Edit",
      before: createEditorHistoryEntry(label || "Edit")
    };
    return true;
  }

  function commitEditorTransaction(label){
    if(!S.editorObject) return false;
    var entry = createEditorHistoryEntry(label || (S.editorTransaction && S.editorTransaction.label) || "Edit");
    if(S.editorTransaction && sameEditorHistoryState(S.editorTransaction.before, entry)){
      S.editorTransaction = null;
      return false;
    }
    pushUndoEntry(S.editorTransaction ? S.editorTransaction.before : entry);
    S.editorRedoStack = [];
    S.editorTransaction = null;
    S.editorLastCommittedHash = hashEditorObjectState(S.editorObject);
    return true;
  }

  function cancelEditorTransaction(){
    S.editorTransaction = null;
    return true;
  }

  function createEditorHistoryEntry(label){
    return {
      label: label || "Edit",
      object: deepCloneEditorObject(S.editorObject),
      selectedId: S.editorSelectedId || null,
      selectionIds: Array.isArray(S.editorSelectionIds) ? S.editorSelectionIds.slice() : [],
      ts: Date.now()
    };
  }

  function pushUndoEntry(entry){
    if(!entry) return false;
    if(!Array.isArray(S.editorUndoStack)) S.editorUndoStack = [];
    S.editorUndoStack.push(entry);
    var maxLen = S.editorHistoryLimit || 100;
    if(S.editorUndoStack.length > maxLen){
      S.editorUndoStack = S.editorUndoStack.slice(S.editorUndoStack.length - maxLen);
    }
    return true;
  }

  function pushRedoEntry(entry){
    if(!entry) return false;
    if(!Array.isArray(S.editorRedoStack)) S.editorRedoStack = [];
    S.editorRedoStack.push(entry);
    var maxLen = S.editorHistoryLimit || 100;
    if(S.editorRedoStack.length > maxLen){
      S.editorRedoStack = S.editorRedoStack.slice(S.editorRedoStack.length - maxLen);
    }
    return true;
  }

  function undoEditorChange(){
    if(!Array.isArray(S.editorUndoStack) || !S.editorUndoStack.length || !S.editorObject) return false;
    pushRedoEntry(createEditorHistoryEntry("Redo Point"));
    var entry = S.editorUndoStack.pop();
    restoreEditorHistoryEntry(entry);
    S.editorDirty = true;
    return true;
  }

  function redoEditorChange(){
    if(!Array.isArray(S.editorRedoStack) || !S.editorRedoStack.length || !S.editorObject) return false;
    pushUndoEntry(createEditorHistoryEntry("Undo Point"));
    var entry = S.editorRedoStack.pop();
    restoreEditorHistoryEntry(entry);
    S.editorDirty = true;
    return true;
  }

  function restoreEditorHistoryEntry(entry){
    if(!entry) return false;
    S.editorObject = deepCloneEditorObject(entry.object);
    S.editorSelectedId = entry.selectedId || null;
    S.editorSelectionIds = Array.isArray(entry.selectionIds) ? entry.selectionIds.slice() : [];
    S.editorPrimarySelectionId = S.editorSelectedId || (S.editorSelectionIds[0] || null);
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
    if(!S.editorObject) return false;
    pushUndoEntry(createEditorHistoryEntry(label || "Checkpoint"));
    S.editorRedoStack = [];
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
