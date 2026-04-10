/* ===== Shared Editor Preview ===== */
/* Handoff 7: preview launch and return-to-editor flow */

(function(){

  function previewEditorObject(){
    if(!S.editorObject) return false;
    if(Array.isArray(S.editorObject.events) && window.SparkExecutionGateway && typeof window.SparkExecutionGateway.runDirectExercise==="function"){
      S.editorPreviewOrigin = {
        screen: SCR.EDITOR,
        mode: S.editorMode
      };
      window.SparkExecutionGateway.runDirectExercise({
        id: "editor_preview",
        type: "song",
        chart: S.editorObject,
        meta: {
          difficultyId: S.performDifficulty || "normal",
          speed: S.performSpeed || 1
        }
      }, {
        source: "editor_preview",
        difficulty: S.performDifficulty || "normal",
        speed: S.performSpeed || 1
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
