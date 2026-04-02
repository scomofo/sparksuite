/* ===== Shared Editor Preview ===== */
/* Handoff 7: preview launch and return-to-editor flow */

(function(){

  function previewEditorObject(){
    if(!S.editorObject) return false;
    if(Array.isArray(S.editorObject.events) && typeof startPerformance==="function"){
      S.editorPreviewOrigin = {
        screen: SCR.EDITOR,
        mode: S.editorMode
      };
      startPerformance(S.editorObject, {
        difficulty:S.performDifficulty || "normal",
        speed:S.performSpeed || 1
      });
      return true;
    }
    console.warn("Spark editor: preview not available for this object");
    return false;
  }

  function returnFromPreviewToEditor(){
    if(!S.editorPreviewOrigin) return false;
    S.screen = SCR.EDITOR;
    S.editorPreviewOrigin = null;
    render();
    return true;
  }

  window.previewEditorObject = previewEditorObject;
  window.returnFromPreviewToEditor = returnFromPreviewToEditor;

})();
