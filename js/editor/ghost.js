(function(){
  function editorGhostRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorGhostRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorGhostRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function editorGhostWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorGhostRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function beginGhostPreview(kind, id, bounds){
    editorGhostWrite("editorGhostState", {
      kind:kind,
      id:String(id),
      bounds:bounds ? JSON.parse(JSON.stringify(bounds)) : null
    });
  }

  function updateGhostPreview(bounds){
    var state = editorGhostRead("editorGhostState", null);
    if(!state) return false;
    state.bounds = bounds ? JSON.parse(JSON.stringify(bounds)) : null;
    editorGhostWrite("editorGhostState", state);
    return true;
  }

  function clearGhostPreview(){
    editorGhostWrite("editorGhostState", null);
  }

  window.beginGhostPreview = beginGhostPreview;
  window.updateGhostPreview = updateGhostPreview;
  window.clearGhostPreview = clearGhostPreview;
})();
