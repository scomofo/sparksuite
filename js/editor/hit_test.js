/* ===== Shared Editor Hit Testing ===== */
/* Handoff 9: pointer-to-time/lane mapping, item bounds, click targeting */

(function(){

  function getTimelinePixelMetrics(){
    return {
      pxPerSec: S.editorViewportPxPerSec || 80,
      laneHeight: S.editorLaneHeightPx || 56,
      range: getEditorTimelineRange()
    };
  }

  function timeToEditorX(sec){
    var m = getTimelinePixelMetrics();
    return (sec - m.range.startSec) * m.pxPerSec;
  }

  function editorXToTime(x){
    var m = getTimelinePixelMetrics();
    return m.range.startSec + (x / m.pxPerSec);
  }

  function laneIndexToEditorY(idx){
    var m = getTimelinePixelMetrics();
    return idx * m.laneHeight;
  }

  function editorYToLaneIndex(y){
    var m = getTimelinePixelMetrics();
    return Math.max(0, Math.floor(y / m.laneHeight));
  }

  function getHitTargetAtPoint(x, y, obj){
    if(!obj) return null;
    var items = [];
    if(Array.isArray(obj.events)){
      for(var i=0;i<obj.events.length;i++) items.push({ kind:"event", item:obj.events[i] });
    }
    if(Array.isArray(obj.phrases)){
      for(var p=0;p<obj.phrases.length;p++) items.push({ kind:"phrase", item:obj.phrases[p] });
    }
    var best = null;
    var bestDist = 999999;
    for(var j=0;j<items.length;j++){
      var b = getEditorItemBounds(items[j].kind, items[j].item, obj);
      if(!b) continue;
      var inside = x >= b.x && x <= (b.x + b.w) && y >= b.y && y <= (b.y + b.h);
      if(inside){
        return {
          kind:items[j].kind,
          id:items[j].item.id,
          bounds:b
        };
      }
      var dx = Math.max(0, Math.max(b.x - x, x - (b.x + b.w)));
      var dy = Math.max(0, Math.max(b.y - y, y - (b.y + b.h)));
      var dist = dx + dy;
      if(dist < bestDist){
        bestDist = dist;
        best = {
          kind:items[j].kind,
          id:items[j].item.id,
          bounds:b
        };
      }
    }
    return best;
  }

  function getEditorItemBounds(kind, item, obj){
    var m = getTimelinePixelMetrics();
    if(kind==="event"){
      var lane = getLaneIndexForItem(item, obj);
      return {
        x: timeToEditorX(item.t || 0),
        y: laneIndexToEditorY(lane) + 6,
        w: Math.max(18, (item.dur || 0.25) * m.pxPerSec),
        h: m.laneHeight - 12
      };
    }
    if(kind==="phrase"){
      return {
        x: timeToEditorX(item.startSec || 0),
        y: 0,
        w: Math.max(20, ((item.endSec || 0) - (item.startSec || 0)) * m.pxPerSec),
        h: (getEditorLanes(obj).length * m.laneHeight)
      };
    }
    return null;
  }

  window.getTimelinePixelMetrics = getTimelinePixelMetrics;
  window.timeToEditorX = timeToEditorX;
  window.editorXToTime = editorXToTime;
  window.laneIndexToEditorY = laneIndexToEditorY;
  window.editorYToLaneIndex = editorYToLaneIndex;
  window.getHitTargetAtPoint = getHitTargetAtPoint;
  window.getEditorItemBounds = getEditorItemBounds;

})();
