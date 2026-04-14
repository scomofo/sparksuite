/* ===== Shared Editor Preview ===== */
/* Handoff 7: preview launch and return-to-editor flow */

(function(){

  function editorPreviewRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorPreviewRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorPreviewRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorPreviewWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorPreviewRoot();
    if(root) root[path] = value;
    return value;
  }

  function previewEditorObject(){
    var editorObject = editorPreviewRead("editorObject", null);
    if(!editorObject) return false;
    if(Array.isArray(editorObject.events) && window.SparkExecutionGateway && typeof window.SparkExecutionGateway.runDirectExercise==="function"){
      editorPreviewWrite("editorPreviewOrigin", {
        screen: SCR.EDITOR,
        mode: editorPreviewRead("editorMode", null)
      });
      window.SparkExecutionGateway.runDirectExercise({
        id: "editor_preview",
        type: "song",
        chart: editorObject,
        meta: {
          difficultyId: editorPreviewRead("performDifficulty", "normal") || "normal",
          speed: editorPreviewRead("performSpeed", 1) || 1
        }
      }, {
        source: "editor_preview",
        difficulty: editorPreviewRead("performDifficulty", "normal") || "normal",
        speed: editorPreviewRead("performSpeed", 1) || 1
      });
      return true;
    }
    console.warn("Spark editor: preview not available for this object");
    return false;
  }

  function returnFromPreviewToEditor(){
    if(!editorPreviewRead("editorPreviewOrigin", null)) return false;
    editorPreviewWrite("screen", SCR.EDITOR);
    editorPreviewWrite("editorPreviewOrigin", null);
    render();
    return true;
  }

  window.previewEditorObject = previewEditorObject;
  window.returnFromPreviewToEditor = returnFromPreviewToEditor;

})();
