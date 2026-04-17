/* ===== Shared Editor IO ===== */
/* Handoff 6: save/load/export/import */

(function(){

  function editorIoRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function editorIoRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = editorIoRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorIoWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = editorIoRoot();
    if(root) root[path] = value;
    return value;
  }

  function saveEditorObjectToLibrary(){
    var editorObject = editorIoRead("editorObject", null);
    var editorLibrary = Array.isArray(editorIoRead("editorLibrary", [])) ? editorIoRead("editorLibrary", []) : [];
    if(!editorObject) return false;
    var obj = JSON.parse(JSON.stringify(editorObject));
    var idx = -1;
    for(var i=0;i<editorLibrary.length;i++){
      if(editorLibrary[i].id===obj.id){
        idx = i;
        break;
      }
    }
    if(idx >= 0) editorLibrary[idx] = obj;
    else editorLibrary.push(obj);
    editorIoWrite("editorLibrary", editorLibrary);
    editorIoWrite("editorDirty", false);
    saveState();
    return true;
  }

  function loadEditorObjectFromLibrary(id){
    var editorLibrary = Array.isArray(editorIoRead("editorLibrary", [])) ? editorIoRead("editorLibrary", []) : [];
    for(var i=0;i<editorLibrary.length;i++){
      if(String(editorLibrary[i].id)===String(id)){
        return JSON.parse(JSON.stringify(editorLibrary[i]));
      }
    }
    return null;
  }

  function exportEditorObject(){
    var editorObject = editorIoRead("editorObject", null);
    if(!editorObject) return false;
    var raw = JSON.stringify(editorObject, null, 2);
    var blob = new Blob([raw], { type:"application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (editorObject.id || "spark_object") + ".json";
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  function importEditorObjectFromJson(raw){
    try{
      var obj = JSON.parse(raw);
      editorIoWrite("editorObject", obj);
      editorIoWrite("editorDirty", true);
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
