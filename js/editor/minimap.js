(function(){
  function getEditorObjectDurationSec(){
    if(!S.editorObject) return 0;
    var maxSec = 0;
    var events = S.editorObject.events || [];
    var phrases = S.editorObject.phrases || [];
    for(var i=0;i<events.length;i++){
      maxSec = Math.max(maxSec, (events[i].t || 0) + (events[i].dur || 0));
    }
    for(var p=0;p<phrases.length;p++){
      maxSec = Math.max(maxSec, phrases[p].endSec || 0);
    }
    return maxSec;
  }

  function renderMiniMap(){
    if(!S.editorMiniMapEnabled || !S.editorObject) return '';
    var total = Math.max(1, getEditorObjectDurationSec());
    var viewStart = S.editorViewportStartSec || 0;
    var viewDur = S.editorTimelineWindowSec || 16;
    var viewEnd = Math.min(total, viewStart + viewDur);
    var h = '<div id="editorMiniMap" style="position:relative;height:70px;border-radius:12px;background:var(--input-bg);overflow:hidden"';
    h += ' onclick="act(\'editorMiniMapClick\', event)">';

    var events = S.editorObject.events || [];
    for(var i=0;i<events.length;i++){
      var left = ((events[i].t || 0) / total) * 100;
      var width = Math.max(0.5, (((events[i].dur || 0.2) / total) * 100));
      h += '<div style="position:absolute;left:'+left+'%;top:20px;width:'+width+'%;height:20px;background:rgba(255,255,255,.25);border-radius:4px"></div>';
    }

    var boxLeft = (viewStart / total) * 100;
    var boxWidth = ((viewEnd - viewStart) / total) * 100;
    h += '<div style="position:absolute;left:'+boxLeft+'%;top:0;bottom:0;width:'+boxWidth+'%;border:2px solid #22c55e;background:rgba(34,197,94,.08);box-sizing:border-box"></div>';
    h += '</div>';
    return h;
  }

  function jumpViewportFromMiniMap(clientX, el){
    if(!el) return false;
    var rect = el.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    var total = Math.max(1, getEditorObjectDurationSec());
    var windowSec = S.editorTimelineWindowSec || 16;
    var centerSec = ratio * total;
    S.editorViewportStartSec = Math.max(0, centerSec - (windowSec / 2));
    return true;
  }

  window.getEditorObjectDurationSec = getEditorObjectDurationSec;
  window.renderMiniMap = renderMiniMap;
  window.jumpViewportFromMiniMap = jumpViewportFromMiniMap;
})();
