/* ===== ChordSpark: Performance Chart Editor ===== */

function performanceEditorPage() {
  var chart = S.performEditorChart;
  var h = '<div class="perform-page">';

  // Header
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'editorBack\')">&larr; Back</button>';
  h += '<div class="perform-title"><strong>Chart Editor</strong>';
  if (chart) h += '<span class="perform-artist">' + escHTML(chart.title || "Untitled") + '</span>';
  h += '</div>';
  if (S.performEditorDirty) h += '<span style="color:#FF6B6B;font-size:11px;font-weight:700">unsaved</span>';
  h += '</div>';

  // Toolbar
  h += '<div class="perform-controls">';
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Type</span>';
  var modes = ["chords", "rhythm_chords", "lead"];
  for (var m = 0; m < modes.length; m++) {
    h += '<button class="btn btn-sm' + (S.performEditorMode === modes[m] ? " active" : "") + '" onclick="act(\'editorMode\',\'' + modes[m] + '\')">' + modes[m].replace("_", " ") + '</button>';
  }
  h += '</div>';
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Snap</span>';
  var snaps = ["1/4", "1/8", "1/16", "free"];
  for (var sn = 0; sn < snaps.length; sn++) {
    h += '<button class="btn btn-sm' + (S.performEditorSnap === snaps[sn] ? " active" : "") + '" onclick="act(\'editorSnap\',\'' + snaps[sn] + '\')">' + snaps[sn] + '</button>';
  }
  h += '</div>';
  h += '<button class="btn btn-sm" onclick="act(\'editorAddEvent\')" style="background:#4ECDC4;color:#fff">+ Add Event</button>';
  h += '<button class="btn btn-sm" onclick="act(\'editorAddPhrase\')" style="background:#45B7D1;color:#fff">+ Phrase</button>';
  h += '<button class="btn btn-sm" onclick="act(\'editorPreview\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333">&#9654; Preview</button>';
  h += '</div>';

  if (!chart) {
    // New chart or load existing
    h += '<div class="card mb20" style="text-align:center;padding:24px">';
    h += '<h3 style="font-size:18px;font-weight:900;color:var(--text-primary)">Start a New Chart</h3>';
    h += '<div class="flex-col" style="gap:8px;margin-top:16px">';
    h += '<button class="btn" onclick="act(\'editorNew\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#10133; Blank Chart</button>';
    h += '<button class="btn" onclick="act(\'editorFromSong\')" style="background:#FF8A5C;color:#fff">&#127925; From Current Song</button>';
    h += '</div>';

    // Library
    if (S.performEditorLibrary && S.performEditorLibrary.length) {
      h += '<h4 style="margin-top:20px;font-size:14px;font-weight:800;color:var(--text-primary)">Saved Charts</h4>';
      for (var li = 0; li < S.performEditorLibrary.length; li++) {
        var lc = S.performEditorLibrary[li];
        h += '<div class="card" style="cursor:pointer;margin-top:8px" onclick="act(\'editorLoad\',' + li + ')">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center">';
        h += '<div><strong>' + escHTML(lc.title || "Untitled") + '</strong><br><span style="font-size:11px;color:var(--text-muted)">' + (lc.events ? lc.events.length : 0) + ' events &bull; ' + escHTML(lc.arrangementType || "chords") + '</span></div>';
        h += '<button class="btn btn-sm" onclick="event.stopPropagation();act(\'editorDelete\',' + li + ')" style="color:#FF6B6B;background:none;font-size:16px">&times;</button>';
        h += '</div></div>';
      }
    }
    h += '</div>';
  } else {
    // Chart info
    h += '<div class="card mb20" style="display:flex;gap:12px;align-items:center">';
    h += '<div style="flex:1"><input type="text" class="set-input" value="' + escHTML(chart.title || "") + '" onchange="act(\'editorTitle\',this.value)" placeholder="Chart title" style="font-weight:800;font-size:15px"></div>';
    h += '<div><input type="number" class="set-input" value="' + (chart.bpm || 90) + '" onchange="act(\'editorBpm\',this.value)" style="width:60px;text-align:center" min="40" max="300"> BPM</div>';
    h += '</div>';

    // Phrases
    if (chart.phrases && chart.phrases.length) {
      h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Phrases</div>';
      for (var pi = 0; pi < chart.phrases.length; pi++) {
        var p = chart.phrases[pi];
        h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:12px">';
        h += '<span style="font-weight:700;color:var(--text-primary)">' + escHTML(p.name || "Phrase " + (pi + 1)) + '</span>';
        h += '<span style="color:var(--text-muted)">' + (p.startSec || 0).toFixed(1) + 's - ' + (p.endSec || 0).toFixed(1) + 's</span>';
        h += '</div>';
      }
      h += '</div>';
    }

    // Event list
    h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Events (' + (chart.events ? chart.events.length : 0) + ')</div>';
    if (chart.events) {
      for (var ei = 0; ei < chart.events.length; ei++) {
        var evt = chart.events[ei];
        var sel = S.performEditorSelectedEventId === evt.id;
        h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;margin:2px 0;border-radius:6px;background:' + (sel ? "#4ECDC422" : "transparent") + ';border:1px solid ' + (sel ? "#4ECDC4" : "transparent") + ';cursor:pointer" onclick="act(\'editorSelectEvent\',' + evt.id + ')">';
        h += '<div><span style="font-size:13px;font-weight:700;color:var(--text-primary)">' + escHTML(evt.laneLabel || evt.chord || evt.note || "?") + '</span>';
        h += ' <span style="font-size:11px;color:var(--text-muted)">' + (evt.t || 0).toFixed(2) + 's / ' + (evt.dur || 0).toFixed(2) + 's</span></div>';
        h += '<button class="btn btn-sm" onclick="event.stopPropagation();act(\'editorDeleteEvent\',' + evt.id + ')" style="color:#FF6B6B;background:none;padding:2px 6px">&times;</button>';
        h += '</div>';
      }
    }
    h += '</div>';

    // Selected event editor
    if (S.performEditorSelectedEventId && chart.events) {
      var selEvt = null;
      for (var se = 0; se < chart.events.length; se++) {
        if (chart.events[se].id === S.performEditorSelectedEventId) { selEvt = chart.events[se]; break; }
      }
      if (selEvt) {
        var eid = selEvt.id;
        h += '<div class="card mb20" style="border:2px solid #4ECDC4">';
        h += '<div style="font-size:12px;font-weight:700;color:#4ECDC4;margin-bottom:8px">Edit Event #' + eid + '</div>';
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
        h += '<div><label style="font-size:10px;color:var(--text-muted)">Chord/Note</label>'
          + '<input type="text" class="set-input" value="' + escHTML(selEvt.laneLabel || "") + '"'
          + ' onchange="act(\'editorEvt\',JSON.stringify({id:' + eid + ',prop:\'label\',val:this.value}))"'
          + ' style="width:80px"></div>';
        h += '<div><label style="font-size:10px;color:var(--text-muted)">Time (s)</label>'
          + '<input type="number" class="set-input" value="' + (selEvt.t || 0) + '"'
          + ' onchange="act(\'editorEvt\',JSON.stringify({id:' + eid + ',prop:\'t\',val:this.value}))"'
          + ' style="width:70px" step="0.25"></div>';
        h += '<div><label style="font-size:10px;color:var(--text-muted)">Duration (s)</label>'
          + '<input type="number" class="set-input" value="' + (selEvt.dur || 0) + '"'
          + ' onchange="act(\'editorEvt\',JSON.stringify({id:' + eid + ',prop:\'dur\',val:this.value}))"'
          + ' style="width:70px" step="0.25"></div>';
        h += '</div></div>';
      }
    }

    // Save/Export controls
    h += '<div class="flex-col" style="gap:8px">';
    h += '<button class="btn" onclick="act(\'editorSave\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#128190; Save to Library</button>';
    h += '<button class="btn" onclick="act(\'editorExport\')" style="background:var(--input-bg);color:var(--text-primary)">&#128228; Export JSON</button>';
    h += '</div>';
  }

  h += '</div>';
  return h;
}
