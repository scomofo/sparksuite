/* ===== Shared Editor Inspector ===== */
/* Handoff 7: item selection, per-type inspection, field updating */

(function(){

  function getSelectedEditorItem(){
    var obj = S.editorObject;
    if(!obj || S.editorSelectedId==null) return null;
    var buckets = [obj.events || [], obj.phrases || [], obj.steps || []];
    for(var b=0;b<buckets.length;b++){
      for(var i=0;i<buckets[b].length;i++){
        if(String(buckets[b][i].id)===String(S.editorSelectedId)){
          return buckets[b][i];
        }
      }
    }
    return null;
  }

  function getSelectedEditorItemKind(){
    var obj = S.editorObject;
    if(!obj || S.editorSelectedId==null) return null;
    var groups = [
      { kind:"event", arr:obj.events || [] },
      { kind:"phrase", arr:obj.phrases || [] },
      { kind:"step", arr:obj.steps || [] }
    ];
    for(var g=0;g<groups.length;g++){
      for(var i=0;i<groups[g].arr.length;i++){
        if(String(groups[g].arr[i].id)===String(S.editorSelectedId)){
          return groups[g].kind;
        }
      }
    }
    return null;
  }

  function renderEditorInspector(){
    var item = getSelectedEditorItem();
    var kind = getSelectedEditorItemKind();
    var h = '<div class="card mb16">';
    h += '<div class="mb8"><b>Inspector</b></div>';
    if(!item || !kind){
      h += '<div class="muted">Select an item to edit.</div>';
      h += '</div>';
      return h;
    }
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">'+escHTML(kind)+'</div>';
    if(kind==="event") h += renderEventInspector(item);
    if(kind==="phrase") h += renderPhraseInspector(item);
    if(kind==="step") h += renderStepInspector(item);
    h += '<button class="btn" onclick="act(\'editorDeleteSelected\')">Delete Selected</button>';
    h += '</div>';
    return h;
  }

  function renderEventInspector(item){
    var h = '';
    h += '<input class="set-input mb8" type="number" step="0.05" value="'+(item.t||0)+'" oninput="act(\'editorItemField\',\'t|\' + this.value)"/>';
    h += '<input class="set-input mb8" type="number" step="0.05" value="'+(item.dur||0)+'" oninput="act(\'editorItemField\',\'dur|\' + this.value)"/>';
    h += '<input class="set-input mb8" value="'+escHTML(item.type || "")+'" oninput="act(\'editorItemField\',\'type|\' + this.value)"/>';
    if(item.performance && item.performance.laneLabel !== undefined){
      h += '<input class="set-input mb8" value="'+escHTML(item.performance.laneLabel || "")+'" oninput="act(\'editorItemField\',\'performance.laneLabel|\' + this.value)"/>';
    }
    if(item.target && item.target.chordShort !== undefined){
      h += '<input class="set-input mb8" value="'+escHTML(item.target.chordShort || "")+'" oninput="act(\'editorItemField\',\'target.chordShort|\' + this.value)"/>';
    }
    if(item.target && item.target.midi !== undefined && !Array.isArray(item.target.midi)){
      h += '<input class="set-input mb8" type="number" value="'+(item.target.midi || 60)+'" oninput="act(\'editorItemField\',\'target.midi|\' + this.value)"/>';
    }
    if(item.target && item.target.note !== undefined){
      h += '<input class="set-input mb8" value="'+escHTML(item.target.note || "")+'" oninput="act(\'editorItemField\',\'target.note|\' + this.value)"/>';
    }
    return h;
  }

  function renderPhraseInspector(item){
    var h = '';
    h += '<input class="set-input mb8" value="'+escHTML(item.name || "")+'" oninput="act(\'editorItemField\',\'name|\' + this.value)"/>';
    h += '<input class="set-input mb8" type="number" step="0.05" value="'+(item.startSec||0)+'" oninput="act(\'editorItemField\',\'startSec|\' + this.value)"/>';
    h += '<input class="set-input mb8" type="number" step="0.05" value="'+(item.endSec||0)+'" oninput="act(\'editorItemField\',\'endSec|\' + this.value)"/>';
    return h;
  }

  function renderStepInspector(item){
    var h = '';
    if(item.chord !== undefined){
      h += '<input class="set-input mb8" value="'+escHTML(item.chord || "")+'" oninput="act(\'editorItemField\',\'chord|\' + this.value)"/>';
    }
    if(item.dur !== undefined){
      h += '<input class="set-input mb8" type="number" step="0.05" value="'+(item.dur||0)+'" oninput="act(\'editorItemField\',\'dur|\' + this.value)"/>';
    }
    if(item.note !== undefined){
      h += '<input class="set-input mb8" value="'+escHTML(item.note || "")+'" oninput="act(\'editorItemField\',\'note|\' + this.value)"/>';
    }
    return h;
  }

  function updateSelectedEditorItemField(path, value){
    var item = getSelectedEditorItem();
    if(!item) return false;
    setNestedField(item, path, value);
    /* Handoff 8: snap time fields when snap is enabled */
    if(path==="t" || path==="startSec" || path==="endSec"){
      if(typeof snapTimeSec === "function"){
        if(path==="t") item.t = snapTimeSec(item.t || 0);
        if(path==="startSec") item.startSec = snapTimeSec(item.startSec || 0);
        if(path==="endSec") item.endSec = snapTimeSec(item.endSec || 0);
      }
    }
    normalizeSelectedEditorItem(item);
    S.editorDirty = true;
    return true;
  }

  function normalizeSelectedEditorItem(item){
    if(!item) return;
    if(item.target && item.target.chordShort && item.performance && !item.performance.laneLabel){
      item.performance.laneLabel = item.target.chordShort;
    }
    if(item.target && item.target.note && item.performance && !item.performance.laneLabel){
      item.performance.laneLabel = item.target.note;
    }
  }

  function setNestedField(obj, path, value){
    var parts = String(path || "").split(".");
    var cur = obj;
    for(var i=0;i<parts.length-1;i++){
      if(cur[parts[i]]==null || typeof cur[parts[i]]!=="object") cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    var key = parts[parts.length-1];
    if(key==="t" || key==="dur" || key==="startSec" || key==="endSec" || key==="midi"){
      value = parseFloat(value);
      if(isNaN(value)) value = 0;
    }
    cur[key] = value;
  }

  window.getSelectedEditorItem = getSelectedEditorItem;
  window.getSelectedEditorItemKind = getSelectedEditorItemKind;
  window.renderEditorInspector = renderEditorInspector;
  window.updateSelectedEditorItemField = updateSelectedEditorItemField;

})();
