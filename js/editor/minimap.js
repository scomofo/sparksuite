(function(){
  function editorMinimapRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorMinimapRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorMinimapRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function editorMinimapWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorMinimapRoot();
    if(root) root[path] = value;
    return value;
  }

  function getEditorObjectDurationSec(){
    var editorObject = editorMinimapRead("editorObject", null);
    if(!editorObject) return 0;
    var maxSec = 0;
    var events = editorObject.events || [];
    var phrases = editorObject.phrases || [];
    for(var i=0;i<events.length;i++){
      maxSec = Math.max(maxSec, (events[i].t || 0) + (events[i].dur || 0));
    }
    for(var p=0;p<phrases.length;p++){
      maxSec = Math.max(maxSec, phrases[p].endSec || 0);
    }
    return maxSec;
  }

  function renderMiniMap(){
    var editorMiniMapEnabled = editorMinimapRead("editorMiniMapEnabled", false);
    var editorObject = editorMinimapRead("editorObject", null);
    if(!editorMiniMapEnabled || !editorObject) return '';
    var total = Math.max(1, getEditorObjectDurationSec());
    var viewStart = editorMinimapRead("editorViewportStartSec", 0) || 0;
    var viewDur = editorMinimapRead("editorTimelineWindowSec", 16) || 16;
    var viewEnd = Math.min(total, viewStart + viewDur);
    var h = '<div id="editorMiniMap" style="position:relative;height:70px;border-radius:12px;background:var(--input-bg);overflow:hidden"';
    h += ' onclick="act(\'editorMiniMapClick\', event)">';

    var events = editorObject.events || [];
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
    var windowSec = editorMinimapRead("editorTimelineWindowSec", 16) || 16;
    var centerSec = ratio * total;
    editorMinimapWrite("editorViewportStartSec", Math.max(0, centerSec - (windowSec / 2)));
    return true;
  }

  window.getEditorObjectDurationSec = getEditorObjectDurationSec;
  window.renderMiniMap = renderMiniMap;
  window.jumpViewportFromMiniMap = jumpViewportFromMiniMap;
})();
