/* pages/editor.js — Editor shell page (handoffs 6-9) */

function editorPage(){
  var obj = S.editorObject;
  var h = '';
  h += '<div class="card mb16">';
  h += '<h2>Editor</h2>';
  h += '<div class="muted">Create and refine charts and exercises.</div>';
  h += '</div>';

  if(!obj){
    h += '<div class="card mb16">';
    h += '<button class="btn" onclick="act(\'openChartEditor\')">New Chart</button> ';
    h += '<button class="btn" onclick="act(\'openExerciseEditor\')">New Exercise</button>';
    h += '</div>';
    return h;
  }

  var errors = validateEditorObject ? validateEditorObject(obj) : [];

  h += '<div class="card mb16">';
  h += '<div><b>Mode:</b> '+escHTML(S.editorMode || "chart")+'</div>';
  h += '<div><b>ID:</b> '+escHTML(obj.id || "")+'</div>';
  h += '<div><b>Dirty:</b> '+(S.editorDirty ? 'Yes' : 'No')+'</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div class="mb8"><b>Metadata</b></div>';
  h += '<input class="set-input mb8" value="'+escHTML(obj.title || "")+'" oninput="act(\'editorField\',\'title|\' + this.value)"/>';
  if(obj.artist !== undefined){
    h += '<input class="set-input mb8" value="'+escHTML(obj.artist || "")+'" oninput="act(\'editorField\',\'artist|\' + this.value)"/>';
  }
  if(obj.bpm !== undefined){
    h += '<input class="set-input mb8" type="number" value="'+(obj.bpm || 80)+'" oninput="act(\'editorField\',\'bpm|\' + this.value)"/>';
  }
  h += '</div>';

  h += renderEditorObjectSummary(obj);

  /* Timeline toolbar + visual timeline (handoffs 8-9) */
  h += renderEditorTimelineToolbar(obj);
  h += '<div class="card mb16">';
  h += renderVisualTimeline(obj);
  h += '</div>';

  /* Items list + inspector (handoff 7) */
  h += renderEditorItemsList(obj);
  h += renderEditorInspector ? renderEditorInspector() : '';

  h += renderEditorControls();

  if(errors.length){
    h += '<div class="card mb16">';
    h += '<div class="mb8"><b>Validation</b></div>';
    for(var i=0;i<errors.length;i++){
      h += '<div style="font-size:12px;color:#ef4444;margin-bottom:4px">'+escHTML(errors[i])+'</div>';
    }
    h += '</div>';
  }

  return h;
}

function renderEditorObjectSummary(obj){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Contents</b></div>';
  if(Array.isArray(obj.events)){
    h += '<div style="font-size:13px;margin-bottom:6px">Events: '+obj.events.length+'</div>';
    h += '<div style="font-size:13px;margin-bottom:6px">Phrases: '+((obj.phrases||[]).length)+'</div>';
  }
  if(Array.isArray(obj.steps)){
    h += '<div style="font-size:13px;margin-bottom:6px">Steps: '+obj.steps.length+'</div>';
  }
  return h + '</div>';
}

/* Timeline toolbar (handoff 9) */
function renderEditorTimelineToolbar(obj){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Timeline</b></div>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Playhead: '+(S.editorPlayheadSec||0).toFixed(2)+'s \u00b7 Grid: '+escHTML(S.editorGridDivision||"1/4")+'</div>';
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  h += '<button class="btn" onclick="act(\'editorPlayheadLeft\')">\u25C0</button>';
  h += '<button class="btn" onclick="act(\'editorPlayheadRight\')">\u25B6</button>';
  h += '<button class="btn" onclick="act(\'editorToggleSnap\')">'+(S.editorSnapEnabled ? 'Snap On' : 'Snap Off')+'</button>';
  h += '<button class="btn" onclick="act(\'editorGrid\',\'1/4\')">1/4</button>';
  h += '<button class="btn" onclick="act(\'editorGrid\',\'1/8\')">1/8</button>';
  h += '<button class="btn" onclick="act(\'editorGrid\',\'1/16\')">1/16</button>';
  h += '<button class="btn" onclick="act(\'editorZoomOut\')">- Zoom</button>';
  h += '<button class="btn" onclick="act(\'editorZoomIn\')">+ Zoom</button>';
  h += '</div>';
  h += '</div>';
  return h;
}

/* Items list (handoff 7) */
function renderEditorItemsList(obj){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Items</b></div>';
  var entries = [];
  if(Array.isArray(obj.events)){
    for(var i=0;i<obj.events.length;i++) entries.push({ kind:"event", item:obj.events[i] });
  }
  if(Array.isArray(obj.phrases)){
    for(var j=0;j<obj.phrases.length;j++) entries.push({ kind:"phrase", item:obj.phrases[j] });
  }
  if(Array.isArray(obj.steps)){
    for(var k=0;k<obj.steps.length;k++) entries.push({ kind:"step", item:obj.steps[k] });
  }
  if(!entries.length){
    h += '<div class="muted">No items yet.</div>';
  }else{
    for(var e=0;e<entries.length;e++){
      var entry = entries[e];
      var item = entry.item;
      var selected = String(S.editorSelectedId)===String(item.id);
      h += '<div style="padding:8px;border-radius:10px;margin-bottom:6px;background:'+(selected?'var(--chip-bg)':'var(--input-bg)')+'" onclick="act(\'editorSelect\',\''+item.id+'\')">';
      h += '<div style="font-size:12px;font-weight:800">'+escHTML(entry.kind)+' \u00b7 '+escHTML(String(item.id))+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(getEditorItemSummary(entry.kind, item))+'</div>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}

function getEditorItemSummary(kind, item){
  if(kind==="event"){
    return (item.type || "event") + " @ " + (item.t || 0);
  }
  if(kind==="phrase"){
    return (item.name || "phrase") + " \u00b7 " + (item.startSec || 0) + " \u2192 " + (item.endSec || 0);
  }
  if(kind==="step"){
    return item.chord || item.note || item.type || "step";
  }
  return kind;
}

/* Controls (handoffs 7-8) */
function renderEditorControls(){
  var h = '<div class="card mb16">';
  h += '<button class="btn" onclick="act(\'editorAddAtPlayhead\')">Add Event @ Playhead</button> ';
  h += '<button class="btn" onclick="act(\'editorAddPhraseAtPlayhead\')">Add Phrase @ Playhead</button> ';
  h += '<button class="btn" onclick="act(\'editorAddEvent\')">Add Event</button> ';
  h += '<button class="btn" onclick="act(\'editorAddPhrase\')">Add Phrase</button> ';
  h += '<button class="btn" onclick="act(\'editorAddStep\')">Add Step</button> ';
  h += '<button class="btn" onclick="act(\'editorNudgeLeft\')">Nudge \u25C0</button> ';
  h += '<button class="btn" onclick="act(\'editorNudgeRight\')">Nudge \u25B6</button> ';
  h += '<button class="btn" onclick="act(\'editorDuplicate\')">Duplicate</button> ';
  h += '<button class="btn" onclick="act(\'editorSave\')">Save</button> ';
  h += '<button class="btn" onclick="act(\'editorExport\')">Export</button> ';
  h += '<button class="btn" onclick="act(\'editorPreview\')">Preview</button> ';
  h += '<button class="btn" onclick="act(\'editorClose\')">Close</button>';
  h += '</div>';
  return h;
}
