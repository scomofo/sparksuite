/* ===== Shared Editor Visual Render ===== */
/* Handoff 9: lane-aware visual timeline, event boxes, phrase overlays, playhead */

(function(){

  function renderVisualTimeline(obj){
    var lanes = getEditorLanes(obj);
    var range = getEditorTimelineRange();
    var grid = buildTimelineGridLines(range.startSec, range.endSec, getEditorBpm(), S.editorGridDivision || "1/4");
    var m = getTimelinePixelMetrics();
    var totalHeight = lanes.length * m.laneHeight;
    var h = '';
    h += '<div id="editorTimelineCanvas" style="position:relative;height:'+totalHeight+'px;border-radius:14px;background:var(--card-bg);overflow:hidden;border:1px solid rgba(255,255,255,.08)"';
    h += ' onmousedown="act(\'editorPointerDown\', event)"';
    h += ' onmousemove="act(\'editorPointerMove\', event)"';
    h += ' onmouseup="act(\'editorPointerUp\', event)"';
    h += ' onmouseleave="act(\'editorPointerUp\', event)">';

    if(S.editorShowGrid){
      for(var g=0; g<grid.length; g++){
        var gx = timeToEditorX(grid[g].t);
        h += '<div style="position:absolute;left:'+gx+'px;top:0;bottom:0;width:1px;background:rgba(255,255,255,.08)"></div>';
      }
    }

    for(var l=0; l<lanes.length; l++){
      var y = l * m.laneHeight;
      h += '<div style="position:absolute;left:0;right:0;top:'+y+'px;height:'+m.laneHeight+'px;border-top:1px solid rgba(255,255,255,.06)"></div>';
      h += '<div style="position:absolute;left:8px;top:'+(y+6)+'px;font-size:11px;color:var(--text-muted)">'+escHTML(lanes[l].label)+'</div>';
    }

    if(S.editorShowPhrases && Array.isArray(obj.phrases)){
      for(var p=0;p<obj.phrases.length;p++){
        var pb = getEditorItemBounds("phrase", obj.phrases[p], obj);
        if(!pb) continue;
        h += '<div style="position:absolute;left:'+pb.x+'px;top:'+pb.y+'px;width:'+pb.w+'px;height:'+pb.h+'px;background:rgba(99,102,241,.08);border:1px dashed rgba(99,102,241,.35)"></div>';
      }
    }

    if(Array.isArray(obj.events)){
      for(var i=0;i<obj.events.length;i++){
        var evt = obj.events[i];
        var b = getEditorItemBounds("event", evt, obj);
        if(!b) continue;
        var selected = String(S.editorSelectedId)===String(evt.id);
        h += '<div style="position:absolute;left:'+b.x+'px;top:'+b.y+'px;width:'+b.w+'px;height:'+b.h+'px;border-radius:10px;';
        h += 'background:'+(selected?'rgba(34,197,94,.18)':'rgba(255,255,255,.08)')+';';
        h += 'border:2px solid '+(selected?'#22c55e':'rgba(255,255,255,.12)')+';';
        h += 'box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;';
        h += 'pointer-events:none;">';
        h += escHTML(getVisualEditorEventLabel(evt, obj));
        h += '</div>';
      }
    }

    var playheadX = timeToEditorX(S.editorPlayheadSec || 0);
    h += '<div style="position:absolute;left:'+playheadX+'px;top:0;bottom:0;width:2px;background:#22c55e"></div>';
    h += '</div>';
    return h;
  }

  function getVisualEditorEventLabel(evt, obj){
    if((obj.arrangementType || "")==="single_note"){
      return (evt.target && (evt.target.note || evt.target.pitchClass)) || "Note";
    }
    if((obj.arrangementType || "")==="left_hand_patterns"){
      return (evt.target && evt.target.note) || "LH";
    }
    if((obj.arrangementType || "")==="rhythm_chords"){
      return (evt.rhythm && evt.rhythm.dir==="U" ? "\u2191 " : "\u2193 ") + ((evt.target && evt.target.chordShort) || "");
    }
    return (evt.target && (evt.target.chordShort || evt.target.note)) || (evt.performance && evt.performance.laneLabel) || "Event";
  }

  window.renderVisualTimeline = renderVisualTimeline;

})();
