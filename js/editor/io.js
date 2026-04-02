/* ===== Shared Editor IO ===== */
/* Handoff 6: save/load/export/import */

(function(){

  function saveEditorObjectToLibrary(){
    if(!S.editorObject) return false;
    if(!Array.isArray(S.editorLibrary)) S.editorLibrary = [];
    var obj = JSON.parse(JSON.stringify(S.editorObject));
    var idx = -1;
    for(var i=0;i<S.editorLibrary.length;i++){
      if(S.editorLibrary[i].id===obj.id){
        idx = i;
        break;
      }
    }
    if(idx >= 0) S.editorLibrary[idx] = obj;
    else S.editorLibrary.push(obj);
    S.editorDirty = false;
    saveState();
    return true;
  }

  function loadEditorObjectFromLibrary(id){
    if(!Array.isArray(S.editorLibrary)) return null;
    for(var i=0;i<S.editorLibrary.length;i++){
      if(String(S.editorLibrary[i].id)===String(id)){
        return JSON.parse(JSON.stringify(S.editorLibrary[i]));
      }
    }
    return null;
  }

  function exportEditorObject(){
    if(!S.editorObject) return false;
    var raw = JSON.stringify(S.editorObject, null, 2);
    var blob = new Blob([raw], { type:"application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (S.editorObject.id || "spark_object") + ".json";
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  function importEditorObjectFromJson(raw){
    try{
      var obj = JSON.parse(raw);
      S.editorObject = obj;
      S.editorDirty = true;
      return true;
    }catch(e){
      console.error("Spark editor: import failed", e);
      return false;
    }
  }

  window.saveEditorObjectToLibrary = saveEditorObjectToLibrary;
  window.loadEditorObjectFromLibrary = loadEditorObjectFromLibrary;
  window.exportEditorObject = exportEditorObject;
  window.importEditorObjectFromJson = importEditorObjectFromJson;

})();
