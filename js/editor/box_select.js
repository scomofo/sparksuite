(function(){
  function beginBoxSelection(startX, startY){
    S.editorBoxSelectState = {
      startX:startX,
      startY:startY,
      endX:startX,
      endY:startY
    };
    return true;
  }

  function updateBoxSelection(x, y){
    if(!S.editorBoxSelectState) return false;
    S.editorBoxSelectState.endX = x;
    S.editorBoxSelectState.endY = y;
    return true;
  }

  function endBoxSelection(obj, additive){
    if(!S.editorBoxSelectState || !obj) return false;
    var rect = normalizeSelectionRect(S.editorBoxSelectState);
    var hits = getItemsIntersectingBox(rect, obj);
    if(!additive) clearEditorSelection();
    for(var i=0;i<hits.length;i++){
      addEditorSelection(hits[i].id);
    }
    S.editorBoxSelectState = null;
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
