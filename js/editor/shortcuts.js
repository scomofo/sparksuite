(function(){
  function handleEditorKeydown(e){
    if(!S.editorShortcutEnabled) return false;
    if(S.screen !== SCR.EDITOR) return false;
    var tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    var typing = tag==="input" || tag==="textarea" || document.activeElement && document.activeElement.isContentEditable;
    if(typing) return false;
    var key = e.key.toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;

    if(key==="delete" || key==="backspace"){
      e.preventDefault();
      deleteSelectedEditorItems();
      render();
      return true;
    }

    if(key==="arrowleft"){
      e.preventDefault();
      nudgeSelectedEditorGroup("left", shift ? 4 : 1);
      render();
      return true;
    }

    if(key==="arrowright"){
      e.preventDefault();
      nudgeSelectedEditorGroup("right", shift ? 4 : 1);
      render();
      return true;
    }

    if(ctrl && key==="c"){
      e.preventDefault();
      copySelectedEditorItemGroup();
      return true;
    }

    if(ctrl && key==="v"){
      e.preventDefault();
      pasteEditorClipboardGroupAtPlayhead();
      render();
      return true;
    }

    if(ctrl && key==="d"){
      e.preventDefault();
      duplicateSelectedEditorGroup();
      render();
      return true;
    }

    if(ctrl && key==="z" && !shift){
      e.preventDefault();
      undoEditorChange();
      render();
      return true;
    }

    if((ctrl && key==="y") || (ctrl && shift && key==="z")){
      e.preventDefault();
      redoEditorChange();
      render();
      return true;
    }

    if(key==="escape"){
      e.preventDefault();
      clearEditorSelection();
      clearGhostPreview && clearGhostPreview();
      render();
      return true;
    }

    return false;
  }

  function bindEditorShortcuts(){
    if(window.__sparkEditorShortcutsBound) return;
    window.__sparkEditorShortcutsBound = true;
    document.addEventListener("keydown", handleEditorKeydown);
  }

  window.handleEditorKeydown = handleEditorKeydown;
  window.bindEditorShortcuts = bindEditorShortcuts;
})();
