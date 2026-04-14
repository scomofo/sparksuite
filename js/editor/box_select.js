(function(){
  function editorBoxSelectRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorBoxSelectRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorBoxSelectRoot();
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

  function editorBoxSelectWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorBoxSelectRoot();
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

  function beginBoxSelection(startX, startY){
    editorBoxSelectWrite("editorBoxSelectState", {
      startX:startX,
      startY:startY,
      endX:startX,
      endY:startY
    });
    return true;
  }

  function updateBoxSelection(x, y){
    var state = editorBoxSelectRead("editorBoxSelectState", null);
    if(!state) return false;
    state.endX = x;
    state.endY = y;
    editorBoxSelectWrite("editorBoxSelectState", state);
    return true;
  }

  function endBoxSelection(obj, additive){
    var state = editorBoxSelectRead("editorBoxSelectState", null);
    if(!state || !obj) return false;
    var rect = normalizeSelectionRect(state);
    var hits = getItemsIntersectingBox(rect, obj);
    if(!additive) clearEditorSelection();
    for(var i=0;i<hits.length;i++){
      addEditorSelection(hits[i].id);
    }
    editorBoxSelectWrite("editorBoxSelectState", null);
    return true;
  }

  function normalizeSelectionRect(box){
    return {
      x1:Math.min(box.startX, box.endX),
      y1:Math.min(box.startY, box.endY),
      x2:Math.max(box.startX, box.endX),
      y2:Math.max(box.startY, box.endY)
    };
  }

  function getItemsIntersectingBox(rect, obj){
    var out = [];
    var items = [];
    if(Array.isArray(obj.events)){
      for(var i=0;i<obj.events.length;i++) items.push({ kind:"event", item:obj.events[i] });
    }
    if(Array.isArray(obj.phrases)){
      for(var p=0;p<obj.phrases.length;p++) items.push({ kind:"phrase", item:obj.phrases[p] });
    }
    for(var j=0;j<items.length;j++){
      var b = getEditorItemBounds(items[j].kind, items[j].item, obj);
      if(!b) continue;
      var overlap = !(rect.x2 < b.x || rect.x1 > (b.x + b.w) || rect.y2 < b.y || rect.y1 > (b.y + b.h));
      if(overlap){
        out.push({
          kind:items[j].kind,
          id:String(items[j].item.id)
        });
      }
    }
    return out;
  }

  window.beginBoxSelection = beginBoxSelection;
  window.updateBoxSelection = updateBoxSelection;
  window.endBoxSelection = endBoxSelection;
  window.normalizeSelectionRect = normalizeSelectionRect;
  window.getItemsIntersectingBox = getItemsIntersectingBox;
})();
