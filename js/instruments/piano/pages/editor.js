/* pages/editor.js — Editor shell page (handoffs 6-9) */

function pianoNormalizeEditorTextToken(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function pianoFirstEditorTextToken(){
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = pianoNormalizeEditorTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function pianoNormalizeEditorItemId(value){
  var text;
  var lower;
  if (typeof value !== "string") return null;
  text = value.trim();
  if (!text) return null;
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return null;
  return text;
}

function pianoNormalizeEditorNumber(value, fallback){
  var num = typeof value === "number" ? value : Number(value);
  return isFinite(num) ? num : fallback;
}

function pianoEditorPage(){
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
  h += '<div><span class="metric-label">Mode:</span> <span class="metric-value" style="font-size:13px">'+escHTML(pianoFirstEditorTextToken(S.editorMode, "chart"))+'</span></div>';
  h += '<div><span class="metric-label">ID:</span> <span class="metric-value" style="font-size:13px">'+escHTML(pianoFirstEditorTextToken(obj.id))+'</span></div>';
  h += '<div><span class="metric-label">Dirty:</span> <span class="metric-value" style="font-size:13px">'+(S.editorDirty ? 'Yes' : 'No')+'</span></div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Metadata</div>';
  h += '<input class="set-input mb8" value="'+escHTML(pianoFirstEditorTextToken(obj.title, obj.id))+'" oninput="act(\'editorField\',\'title|\' + this.value)"/>';
  if(obj.artist !== undefined){
    h += '<input class="set-input mb8" value="'+escHTML(pianoFirstEditorTextToken(obj.artist))+'" oninput="act(\'editorField\',\'artist|\' + this.value)"/>';
  }
  if(obj.bpm !== undefined){
    h += '<input class="set-input mb8" type="number" value="'+pianoNormalizeEditorNumber(obj.bpm, 80)+'" oninput="act(\'editorField\',\'bpm|\' + this.value)"/>';
  }
  h += '</div>';

  h += pianoRenderEditorObjectSummary(obj);

  /* Timeline toolbar + visual timeline (handoffs 8-9) */
  h += pianoRenderEditorTimelineToolbar(obj);
  h += '<div class="card mb16">';
  h += renderVisualTimeline(obj);
  h += '</div>';

  /* Items list + inspector (handoff 7) */
  h += pianoRenderEditorItemsList(obj);
  h += renderEditorInspector ? renderEditorInspector() : '';

  h += pianoRenderEditorControls();

  if(errors.length){
    h += '<div class="card mb16">';
    h += '<div class="card-section-heading mb8">Validation</div>';
    for(var i=0;i<errors.length;i++){
      h += '<div style="font-size:12px;color:#ef4444;margin-bottom:4px">'+escHTML(errors[i])+'</div>';
    }
    h += '</div>';
  }

  return h;
}

function pianoRenderEditorObjectSummary(obj){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Contents</div>';
  if(Array.isArray(obj.events)){
    h += '<div style="font-size:13px;margin-bottom:6px"><span class="metric-label">Events:</span> <span class="metric-value" style="font-size:13px">'+obj.events.length+'</span></div>';
    h += '<div style="font-size:13px;margin-bottom:6px"><span class="metric-label">Phrases:</span> <span class="metric-value" style="font-size:13px">'+((obj.phrases||[]).length)+'</span></div>';
  }
  if(Array.isArray(obj.steps)){
    h += '<div style="font-size:13px;margin-bottom:6px"><span class="metric-label">Steps:</span> <span class="metric-value" style="font-size:13px">'+obj.steps.length+'</span></div>';
  }
  return h + '</div>';
}

/* Timeline toolbar (handoff 9) */
function pianoRenderEditorTimelineToolbar(obj){
  var h = '<div class="card mb16">';
  var playheadSec = pianoNormalizeEditorNumber(S.editorPlayheadSec, 0);
  h += '<div class="card-section-heading mb8">Timeline</div>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Playhead: '+playheadSec.toFixed(2)+'s \u00b7 Grid: '+escHTML(pianoFirstEditorTextToken(S.editorGridDivision, "1/4"))+'</div>';
  h += '<div class="action-row">';
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
function pianoRenderEditorItemsList(obj){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Items</div>';
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
      var itemId = pianoNormalizeEditorItemId(item.id);
      var selected = itemId && String(S.editorSelectedId)===String(itemId);
      h += '<div style="padding:8px;border-radius:10px;margin-bottom:6px;background:'+(selected?'var(--chip-bg)':'var(--input-bg)')+'"'+(itemId?' role="button" tabindex="0" onclick="act(\'editorSelect\',\''+itemId+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'editorSelect\',\''+itemId+'\')}"':'')+'>';
      h += '<div class="card-micro-heading">'+escHTML(entry.kind)+' \u00b7 '+escHTML(pianoFirstEditorTextToken(item.id, entry.kind))+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(pianoGetEditorItemSummary(entry.kind, item))+'</div>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}

function pianoGetEditorItemSummary(kind, item){
  if(kind==="event"){
    return pianoFirstEditorTextToken(item.type, "event") + " @ " + pianoNormalizeEditorNumber(item.t, 0);
  }
  if(kind==="phrase"){
    return pianoFirstEditorTextToken(item.name, "phrase") + " \u00b7 " + pianoNormalizeEditorNumber(item.startSec, 0) + " \u2192 " + pianoNormalizeEditorNumber(item.endSec, 0);
  }
  if(kind==="step"){
    return pianoFirstEditorTextToken(item.chord, item.note, item.type, "step");
  }
  return kind;
}

/* Controls (handoffs 7-8) */
function pianoRenderEditorControls(){
  var h = '<div class="card mb16 action-row">';
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
