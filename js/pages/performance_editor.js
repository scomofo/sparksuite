/* ===== ChordSpark: Performance Chart Editor ===== */

function performanceEditorStateRoot() {
  if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
    return SparkState.getRoot();
  }
  return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
}

function performanceEditorStateRead(path, fallback) {
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(path, fallback);
  }
  var root = performanceEditorStateRoot();
  if (!root) return fallback;
  return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
}

function performanceEditorPage() {
  var editorView = getPerformanceEditorView();
  var chart = editorView.chart || performanceEditorStateRead("performEditorChart", null);
  var editorMode = editorView.mode;
  var editorSnap = editorView.snap;
  var editorTitle = editorView.chartTitle || (chart && chart.title) || "Untitled";
  var editorSource = editorView.source || "blank";
  var editorDirty = !!editorView.dirty;
  var selectedEventId = editorView.selectedEventId;
  var selectedEventLabel = editorView.selectedEventLabel;
  var selectedEventTime = editorView.selectedEventTime;
  var selectedEventDuration = editorView.selectedEventDuration;
  var selectedPhraseId = editorView.selectedPhraseId;
  var selectedPhraseName = editorView.selectedPhraseName;
  var selectedPhraseStart = editorView.selectedPhraseStart;
  var selectedPhraseEnd = editorView.selectedPhraseEnd;
  var editorBpm = editorView.bpm != null ? editorView.bpm : (chart && chart.bpm ? chart.bpm : 90);
  var editorEventCount = editorView.eventCount;
  var editorPhraseCount = editorView.phraseCount;
  var editorLibrary = editorView.library || performanceEditorStateRead("performEditorLibrary", []) || [];
  var h = '<div class="perform-page">';

  // Header
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'editorBack\')">&larr; Back</button>';
  h += '<div class="perform-title"><strong>Chart Editor</strong>';
  h += '<span class="perform-artist">' + escHTML(editorTitle) + ' | ' + escHTML(editorSource) + ' | ' + editorEventCount + ' events</span>';
  h += '</div>';
  if (editorDirty) h += '<span style="color:#FF6B6B;font-size:11px;font-weight:700">unsaved</span>';
  h += '</div>';

  // Toolbar
  h += '<div class="perform-controls">';
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Type</span>';
  var modes = ["chords", "rhythm_chords", "lead"];
  for (var m = 0; m < modes.length; m++) {
    h += '<button class="btn btn-sm' + (editorMode === modes[m] ? " active" : "") + '" onclick="act(\'editorMode\',\'' + modes[m] + '\')">' + modes[m].replace("_", " ") + '</button>';
  }
  h += '</div>';
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Snap</span>';
  var snaps = ["1/4", "1/8", "1/16", "free"];
  for (var sn = 0; sn < snaps.length; sn++) {
    h += '<button class="btn btn-sm' + (editorSnap === snaps[sn] ? " active" : "") + '" onclick="act(\'editorSnap\',\'' + snaps[sn] + '\')">' + snaps[sn] + '</button>';
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
    if (editorLibrary && editorLibrary.length) {
      h += '<h4 style="margin-top:20px;font-size:14px;font-weight:800;color:var(--text-primary)">Saved Charts</h4>';
      for (var li = 0; li < editorLibrary.length; li++) {
        var lc = editorLibrary[li];
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
    h += '<div><input type="number" class="set-input" value="' + editorBpm + '" onchange="act(\'editorBpm\',this.value)" style="width:60px;text-align:center" min="40" max="300"> BPM</div>';
    h += '</div>';

    // Phrases
    if (editorPhraseCount) {
      h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Phrases</div>';
      for (var pi = 0; pi < chart.phrases.length; pi++) {
        var p = chart.phrases[pi];
        var phraseSelected = selectedPhraseId === p.id;
        h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 6px;font-size:12px;border-radius:6px;cursor:pointer;background:'+(phraseSelected?"#45B7D122":"transparent")+';border:1px solid '+(phraseSelected?"#45B7D1":"transparent")+'" onclick="act(\'editorSelectPhrase\','+p.id+')">';
        h += '<span style="font-weight:700;color:var(--text-primary)">' + escHTML(p.name || "Phrase " + (pi + 1)) + '</span>';
        h += '<span style="color:var(--text-muted)">' + (p.startSec || 0).toFixed(1) + 's - ' + (p.endSec || 0).toFixed(1) + 's</span>';
        h += '</div>';
      }
      h += '</div>';
      if (selectedPhraseId != null) {
        h += '<div class="card mb20" style="border:2px solid #45B7D1">';
        h += '<div style="font-size:12px;font-weight:700;color:#45B7D1;margin-bottom:8px">Selected Phrase</div>';
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
        h += '<div><label style="font-size:10px;color:var(--text-muted)">Name</label>'
          + '<input type="text" class="set-input" value="' + escHTML(selectedPhraseName || ("Phrase " + (selectedPhraseId + 1))) + '"'
          + ' onchange="act(\'editorPhrase\',JSON.stringify({id:' + selectedPhraseId + ',prop:\'name\',val:this.value}))"'
          + ' style="width:120px"></div>';
        h += '<div><label style="font-size:10px;color:var(--text-muted)">Start (s)</label>'
          + '<input type="number" class="set-input" value="' + (selectedPhraseStart != null ? selectedPhraseStart : 0) + '"'
          + ' onchange="act(\'editorPhrase\',JSON.stringify({id:' + selectedPhraseId + ',prop:\'startSec\',val:this.value}))"'
          + ' style="width:80px" step="0.25"></div>';
        h += '<div><label style="font-size:10px;color:var(--text-muted)">End (s)</label>'
          + '<input type="number" class="set-input" value="' + (selectedPhraseEnd != null ? selectedPhraseEnd : 0) + '"'
          + ' onchange="act(\'editorPhrase\',JSON.stringify({id:' + selectedPhraseId + ',prop:\'endSec\',val:this.value}))"'
          + ' style="width:80px" step="0.25"></div>';
        h += '</div>';
        h += '<button class="btn btn-sm" onclick="act(\'editorDeletePhrase\',' + selectedPhraseId + ')" style="margin-top:10px;color:#FF6B6B;background:none">Delete Phrase</button>';
        h += '</div>';
      }
    }

    // Event list
    h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Events (' + editorEventCount + ')</div>';
    if (chart.events) {
      for (var ei = 0; ei < chart.events.length; ei++) {
        var evt = chart.events[ei];
        var sel = selectedEventId === evt.id;
        h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;margin:2px 0;border-radius:6px;background:' + (sel ? "#4ECDC422" : "transparent") + ';border:1px solid ' + (sel ? "#4ECDC4" : "transparent") + ';cursor:pointer" onclick="act(\'editorSelectEvent\',' + evt.id + ')">';
        h += '<div><span style="font-size:13px;font-weight:700;color:var(--text-primary)">' + escHTML(evt.laneLabel || evt.chord || evt.note || "?") + '</span>';
        h += ' <span style="font-size:11px;color:var(--text-muted)">' + (evt.t || 0).toFixed(2) + 's / ' + (evt.dur || 0).toFixed(2) + 's</span></div>';
        h += '<button class="btn btn-sm" onclick="event.stopPropagation();act(\'editorDeleteEvent\',' + evt.id + ')" style="color:#FF6B6B;background:none;padding:2px 6px">&times;</button>';
        h += '</div>';
      }
    }
    h += '</div>';

    // Selected event editor
    if (selectedEventId && chart.events) {
      var selEvt = null;
      for (var se = 0; se < chart.events.length; se++) {
        if (chart.events[se].id === selectedEventId) { selEvt = chart.events[se]; break; }
      }
      if (selEvt) {
        var eid = selEvt.id;
        h += '<div class="card mb20" style="border:2px solid #4ECDC4">';
        h += '<div style="font-size:12px;font-weight:700;color:#4ECDC4;margin-bottom:8px">Edit Event #' + eid + '</div>';
        h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Selected: '
          + escHTML(selectedEventLabel || selEvt.laneLabel || selEvt.chord || selEvt.note || "?")
          + ' @ ' + ((selectedEventTime != null ? selectedEventTime : selEvt.t || 0).toFixed(2))
          + 's for ' + ((selectedEventDuration != null ? selectedEventDuration : selEvt.dur || 0).toFixed(2))
          + 's</div>';
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

function getPerformanceEditorView() {
  var documentView = window.sparkCore && typeof window.sparkCore.getPerformanceEditorDocumentView === "function"
    ? window.sparkCore.getPerformanceEditorDocumentView()
    : null;
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  return {
    chart: documentView && documentView.chart
      ? documentView.chart
      : (performanceEditorStateRead("performEditorChart", null) || null),
    library: documentView && documentView.library
      ? documentView.library
      : (performanceEditorStateRead("performEditorLibrary", []) || []),
    mode: documentView && documentView.mode
      ? documentView.mode
      : (runtimeState && runtimeState.performanceEditorMode
      ? runtimeState.performanceEditorMode
      : (performanceEditorStateRead("performEditorMode", "chords") || "chords")),
    snap: documentView && documentView.snap
      ? documentView.snap
      : (runtimeState && runtimeState.performanceEditorSnap
      ? runtimeState.performanceEditorSnap
      : (performanceEditorStateRead("performEditorSnap", "1/8") || "1/8")),
    chartId: documentView && Object.prototype.hasOwnProperty.call(documentView, "chartId")
      ? documentView.chartId
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorChartId")
      ? runtimeState.performanceEditorChartId
      : (performanceEditorStateRead("performEditorChart", null) && performanceEditorStateRead("performEditorChart", null).id ? performanceEditorStateRead("performEditorChart", null).id : null)),
    chartTitle: documentView && Object.prototype.hasOwnProperty.call(documentView, "title")
      ? documentView.title
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorChartTitle")
      ? runtimeState.performanceEditorChartTitle
      : (performanceEditorStateRead("performEditorChart", null) && performanceEditorStateRead("performEditorChart", null).title ? performanceEditorStateRead("performEditorChart", null).title : null)),
    source: documentView && Object.prototype.hasOwnProperty.call(documentView, "source")
      ? documentView.source
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSource")
      ? runtimeState.performanceEditorSource
      : (performanceEditorStateRead("performEditorChart", null) ? "existing" : "blank")),
    dirty: documentView && Object.prototype.hasOwnProperty.call(documentView, "dirty")
      ? documentView.dirty
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorDirty")
      ? runtimeState.performanceEditorDirty
      : !!performanceEditorStateRead("performEditorDirty", false)),
    selectedEventId: documentView && documentView.selectedEvent ? documentView.selectedEvent.id
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventId")
      ? runtimeState.performanceEditorSelectedEventId
      : performanceEditorStateRead("performEditorSelectedEventId", null)),
    selectedEventLabel: documentView && documentView.selectedEvent ? documentView.selectedEvent.label
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventLabel")
      ? runtimeState.performanceEditorSelectedEventLabel
      : null),
    selectedEventTime: documentView && documentView.selectedEvent ? documentView.selectedEvent.time
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventTime")
      ? runtimeState.performanceEditorSelectedEventTime
      : null),
    selectedEventDuration: documentView && documentView.selectedEvent ? documentView.selectedEvent.duration
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventDuration")
      ? runtimeState.performanceEditorSelectedEventDuration
      : null),
    selectedPhraseId: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.id
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseId")
      ? runtimeState.performanceEditorSelectedPhraseId
      : null),
    selectedPhraseName: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.name
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseName")
      ? runtimeState.performanceEditorSelectedPhraseName
      : null),
    selectedPhraseStart: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.start
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseStart")
      ? runtimeState.performanceEditorSelectedPhraseStart
      : null),
    selectedPhraseEnd: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.end
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseEnd")
      ? runtimeState.performanceEditorSelectedPhraseEnd
      : null),
    bpm: documentView && Object.prototype.hasOwnProperty.call(documentView, "bpm")
      ? documentView.bpm
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorBpm")
      ? runtimeState.performanceEditorBpm
      : (performanceEditorStateRead("performEditorChart", null) && performanceEditorStateRead("performEditorChart", null).bpm ? performanceEditorStateRead("performEditorChart", null).bpm : null)),
    eventCount: documentView && Object.prototype.hasOwnProperty.call(documentView, "eventCount")
      ? documentView.eventCount
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorEventCount")
      ? runtimeState.performanceEditorEventCount
      : (performanceEditorStateRead("performEditorChart", null) && performanceEditorStateRead("performEditorChart", null).events ? performanceEditorStateRead("performEditorChart", null).events.length : 0)),
    phraseCount: documentView && Object.prototype.hasOwnProperty.call(documentView, "phraseCount")
      ? documentView.phraseCount
      : (runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorPhraseCount")
      ? runtimeState.performanceEditorPhraseCount
      : (performanceEditorStateRead("performEditorChart", null) && performanceEditorStateRead("performEditorChart", null).phrases ? performanceEditorStateRead("performEditorChart", null).phrases.length : 0))
  };
}
