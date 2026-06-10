/* ===== Shared Editor Page ===== */
/* Handoffs 6-9: editor shell with items list, inspector, timeline, visual timeline */

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizeEditorTextToken(value){ return SparkNormalize.textToken(value); }

function firstEditorTextToken(){
  var i;
  var token;
  for(i = 0; i < arguments.length; i++){
    token = normalizeEditorTextToken(arguments[i]);
    if(token) return token;
  }
  return "";
}

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizeEditorNumber(value, fallback){ return SparkNormalize.number(value, fallback); }

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

  var errors = typeof validateEditorObject === "function" ? validateEditorObject(obj) : [];

  h += '<div class="card mb16">';
  h += '<div><span class="metric-label">Mode:</span> <span class="metric-value" style="font-size:13px">'+escHTML(firstEditorTextToken(S.editorMode, "chart"))+'</span></div>';
  h += '<div><span class="metric-label">ID:</span> <span class="metric-value" style="font-size:13px">'+escHTML(firstEditorTextToken(obj.id))+'</span></div>';
  h += '<div><span class="metric-label">Dirty:</span> <span class="metric-value" style="font-size:13px">'+(S.editorDirty ? 'Yes' : 'No')+'</span></div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Metadata</div>';
  h += '<input class="set-input mb8" value="'+escHTML(firstEditorTextToken(obj.title, obj.id))+'" oninput="act(\'editorField\',\'title|\' + this.value)"/>';
  if(obj.artist !== undefined){
    h += '<input class="set-input mb8" value="'+escHTML(firstEditorTextToken(obj.artist))+'" oninput="act(\'editorField\',\'artist|\' + this.value)"/>';
  }
  if(obj.bpm !== undefined){
    h += '<input class="set-input mb8" type="number" value="'+normalizeEditorNumber(obj.bpm, 80)+'" oninput="act(\'editorField\',\'bpm|\' + this.value)"/>';
  }
  h += '</div>';

  h += renderEditorObjectSummary(obj);

  /* Handoff 9: visual timeline toolbar + lane-aware canvas */
  h += renderEditorTimelineToolbar(obj);
  h += '<div class="card mb16">';
  h += typeof renderVisualTimeline === "function" ? renderVisualTimeline(obj) : renderEditorTimeline(obj);
  h += '</div>';

  /* Handoff 7: items list + inspector */
  h += renderEditorItemsList(obj);
  h += typeof renderEditorInspector === "function" ? renderEditorInspector() : '';

  h += renderEditorControls();

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

function renderEditorObjectSummary(obj){
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

/* Handoff 8: timeline card (text-based fallback) */
function renderEditorTimeline(obj){
  var range = typeof getEditorTimelineRange === "function" ? getEditorTimelineRange() : { startSec:0, endSec:16 };
  var bpm = typeof getEditorBpm === "function" ? getEditorBpm() : 80;
  var grid = typeof buildTimelineGridLines === "function" ? buildTimelineGridLines(range.startSec, range.endSec, bpm, S.editorGridDivision || "1/4") : [];
  var playheadSec = normalizeEditorNumber(S.editorPlayheadSec, 0);
  var h = '';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Playhead: '+playheadSec.toFixed(2)+'s \u00b7 Grid: '+escHTML(firstEditorTextToken(S.editorGridDivision, "1/4"))+'</div>';
  h += '<div style="padding:12px;border-radius:12px;background:var(--input-bg)">';
  for(var i=0;i<grid.length;i++){
    h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">'+escHTML(grid[i].label)+' ('+normalizeEditorNumber(grid[i].t, 0).toFixed(2)+'s)</div>';
  }
  h += '</div>';
  return h;
}

/* Handoff 9: timeline toolbar with playhead, grid, snap, zoom */
function renderEditorTimelineToolbar(obj){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Timeline</div>';
  h += '<div class="action-row">';
  h += '<button class="btn" onclick="act(\'editorPlayheadLeft\')">\u25c0</button>';
  h += '<button class="btn" onclick="act(\'editorPlayheadRight\')">\u25b6</button>';
  h += '<button class="btn" onclick="act(\'editorToggleSnap\')">'+(S.editorSnapEnabled?'Snap On':'Snap Off')+'</button>';
  h += '<button class="btn" onclick="act(\'editorGrid\',\'1/4\')">1/4</button>';
  h += '<button class="btn" onclick="act(\'editorGrid\',\'1/8\')">1/8</button>';
  h += '<button class="btn" onclick="act(\'editorGrid\',\'1/16\')">1/16</button>';
  h += '<button class="btn" onclick="act(\'editorZoomOut\')">- Zoom</button>';
  h += '<button class="btn" onclick="act(\'editorZoomIn\')">+ Zoom</button>';
  h += '</div>';
  h += '</div>';
  return h;
}

/* Handoff 7: items list with selection */
function renderEditorItemsList(obj){
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
      var rawItemId = firstEditorTextToken(item && item.id);
      var selected = rawItemId ? String(S.editorSelectedId)===rawItemId : false;
      var itemId = firstEditorTextToken(rawItemId, entry.kind);
      h += '<div style="padding:8px;border-radius:10px;margin-bottom:6px;background:'+(selected?'var(--chip-bg)':'var(--input-bg)')+(rawItemId?';cursor:pointer':'')+'"'+(rawItemId?' role="button" tabindex="0" onclick="act(\'editorSelect\',\''+rawItemId+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'editorSelect\',\''+rawItemId+'\')}"':'')+'>';
      h += '<div class="card-micro-heading">'+escHTML(entry.kind)+' \u00b7 '+escHTML(itemId)+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(getEditorItemSummary(entry.kind, item))+'</div>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}

function getEditorItemSummary(kind, item){
  if(kind==="event"){
    return firstEditorTextToken(item.type, "event") + " @ " + (item.t || 0);
  }
  if(kind==="phrase"){
    return firstEditorTextToken(item.name, "phrase") + " \u00b7 " + (item.startSec || 0) + " \u2192 " + (item.endSec || 0);
  }
  if(kind==="step"){
    return firstEditorTextToken(item.chord, item.note, item.type, "step");
  }
  return kind;
}

/* Handoff 8+9: timing-aware controls */
function renderEditorControls(){
  var h = '<div class="card mb16 action-row">';
  h += '<button class="btn" onclick="act(\'editorAddAtPlayhead\')">Add Event @ Playhead</button> ';
  h += '<button class="btn" onclick="act(\'editorAddPhraseAtPlayhead\')">Add Phrase @ Playhead</button> ';
  h += '<button class="btn" onclick="act(\'editorNudgeLeft\')">Nudge \u25c0</button> ';
  h += '<button class="btn" onclick="act(\'editorNudgeRight\')">Nudge \u25b6</button> ';
  h += '<button class="btn" onclick="act(\'editorAddEvent\')">Add Event</button> ';
  h += '<button class="btn" onclick="act(\'editorAddPhrase\')">Add Phrase</button> ';
  h += '<button class="btn" onclick="act(\'editorAddStep\')">Add Step</button> ';
  h += '<button class="btn" onclick="act(\'editorDuplicate\')">Duplicate</button> ';
  h += '<button class="btn" onclick="act(\'editorSave\')">Save</button> ';
  h += '<button class="btn" onclick="act(\'editorExport\')">Export</button> ';
  h += '<button class="btn" onclick="act(\'editorPreview\')">Preview</button> ';
  h += '<button class="btn" onclick="act(\'editorClose\')">Close</button>';
  h += '</div>';
  return h;
}
