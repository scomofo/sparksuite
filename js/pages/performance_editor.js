/* ===== ChordSpark: Performance Chart Editor ===== */

function _normalizePerformanceEditorTextToken(value) {
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function _firstPerformanceEditorTextToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = _normalizePerformanceEditorTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function _normalizePerformanceEditorNumber(value, fallback) {
  var num = typeof value === "number" ? value : Number(value);
  return isFinite(num) ? num : fallback;
}

function getPerformanceEditorCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function getPerformanceEditorDocumentView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getPerformanceEditorDocumentView === "function"
    ? core.getPerformanceEditorDocumentView()
    : null;
}

function performanceEditorPage() {
  var editorView = getPerformanceEditorView();
  var chart = editorView.chart || S.performEditorChart;
  var editorMode = editorView.mode;
  var editorSnap = editorView.snap;
  var editorTitle = _firstPerformanceEditorTextToken(editorView.chartTitle, chart && chart.title, "Untitled");
  var editorSource = _firstPerformanceEditorTextToken(editorView.source, "blank");
  var editorDirty = !!editorView.dirty;
  var selectedEventId = editorView.selectedEventId;
  var selectedEventLabel = editorView.selectedEventLabel;
  var selectedEventTime = editorView.selectedEventTime;
  var selectedEventDuration = editorView.selectedEventDuration;
  var selectedPhraseId = editorView.selectedPhraseId;
  var selectedPhraseName = editorView.selectedPhraseName;
  var selectedPhraseStart = editorView.selectedPhraseStart;
  var selectedPhraseEnd = editorView.selectedPhraseEnd;
  var editorBpm = _normalizePerformanceEditorNumber(
    editorView.bpm != null ? editorView.bpm : (chart && chart.bpm != null ? chart.bpm : 90),
    90
  );
  var displayPhraseStart = _normalizePerformanceEditorNumber(selectedPhraseStart != null ? selectedPhraseStart : 0, 0);
  var displayPhraseEnd = _normalizePerformanceEditorNumber(selectedPhraseEnd != null ? selectedPhraseEnd : 0, 0);
  var editorEventCount = editorView.eventCount;
  var editorPhraseCount = editorView.phraseCount;
  var editorLibrary = editorView.library || S.performEditorLibrary || [];
  var h = '<div class="perform-page">';

  // Header
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'editorBack\')">&larr; Back</button>';
  h += '<div class="perform-title"><strong>Chart Editor</strong>';
  h += '<span class="perform-artist">' + escHTML(editorTitle) + ' | ' + escHTML(editorSource) + ' | ' + editorEventCount + ' events</span>';
  h += '</div>';
  if (editorDirty) h += '<span class="metric-label" style="color:#FF6B6B">unsaved</span>';
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
    h += '<h3 class="card-section-heading">Start a New Chart</h3>';
    h += '<div class="flex-col" style="gap:8px;margin-top:16px">';
    h += '<button class="btn" onclick="act(\'editorNew\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#10133; Blank Chart</button>';
    h += '<button class="btn" onclick="act(\'editorFromSong\')" style="background:#FF8A5C;color:#fff">&#127925; From Current Song</button>';
    h += '</div>';

    // Library
    if (editorLibrary && editorLibrary.length) {
      h += '<h4 class="card-section-heading" style="margin-top:20px">Saved Charts</h4>';
      for (var li = 0; li < editorLibrary.length; li++) {
        var lc = editorLibrary[li];
        var libraryTitle = _firstPerformanceEditorTextToken(lc.title, lc.id, "Untitled");
        var libraryArrangement = _firstPerformanceEditorTextToken(lc.arrangementType, "chords");
        h += '<div class="card" role="button" tabindex="0" style="cursor:pointer;margin-top:8px" onclick="if(event.target&&event.target.closest&&event.target.closest(\'button,input,select,textarea,a\')){return;}act(\'editorLoad\',' + li + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'editorLoad\',' + li + ')}">';
        h += '<div class="split-row">';
        h += '<div><span class="card-micro-heading">' + escHTML(libraryTitle) + '</span><br><span class="metric-label">' + (lc.events ? lc.events.length : 0) + ' events &bull; ' + escHTML(libraryArrangement) + '</span></div>';
        h += '<button class="btn btn-sm" onclick="act(\'editorDelete\',' + li + ')" style="color:#FF6B6B;background:none;font-size:16px">&times;</button>';
        h += '</div></div>';
      }
    }
    h += '</div>';
  } else {
    // Chart info
    h += '<div class="card mb20" style="display:flex;gap:12px;align-items:center">';
    h += '<div style="flex:1"><input type="text" class="set-input" value="' + escHTML(_firstPerformanceEditorTextToken(chart.title, chart.id)) + '" onchange="act(\'editorTitle\',this.value)" placeholder="Chart title" style="font-weight:800;font-size:15px"></div>';
    h += '<div><input type="number" class="set-input" value="' + editorBpm + '" onchange="act(\'editorBpm\',this.value)" style="width:60px;text-align:center" min="40" max="300"> BPM</div>';
    h += '</div>';

    // Phrases
    if (editorPhraseCount) {
      h += '<div class="card mb20"><div class="card-section-heading" style="margin-bottom:6px">Phrases</div>';
      for (var pi = 0; pi < chart.phrases.length; pi++) {
        var p = chart.phrases[pi];
        var phraseSelected = selectedPhraseId === p.id;
        var phraseName = _firstPerformanceEditorTextToken(p.name, "Phrase " + (pi + 1));
        var phraseStart = _normalizePerformanceEditorNumber(p.startSec, 0);
        var phraseEnd = _normalizePerformanceEditorNumber(p.endSec, 0);
        h += '<div class="split-row" role="button" tabindex="0" style="padding:3px 6px;font-size:12px;border-radius:6px;cursor:pointer;background:'+(phraseSelected?"#45B7D122":"transparent")+';border:1px solid '+(phraseSelected?"#45B7D1":"transparent")+'" onclick="act(\'editorSelectPhrase\','+p.id+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'editorSelectPhrase\','+p.id+')}">';
        h += '<span class="card-micro-heading">' + escHTML(phraseName) + '</span>';
        h += '<span class="metric-value" style="font-size:12px">' + phraseStart.toFixed(1) + 's - ' + phraseEnd.toFixed(1) + 's</span>';
        h += '</div>';
      }
      h += '</div>';
      if (selectedPhraseId != null) {
        h += '<div class="card mb20" style="border:2px solid #45B7D1">';
        h += '<div class="card-section-heading" style="color:#45B7D1;margin-bottom:8px">Selected Phrase</div>';
        h += '<div class="action-row">';
        h += '<div><label class="metric-label" style="display:block">Name</label>'
          + '<input type="text" class="set-input" value="' + escHTML(_firstPerformanceEditorTextToken(selectedPhraseName, "Phrase " + (selectedPhraseId + 1))) + '"'
          + ' onchange="act(\'editorPhrase\',JSON.stringify({id:' + selectedPhraseId + ',prop:\'name\',val:this.value}))"'
          + ' style="width:120px"></div>';
        h += '<div><label class="metric-label" style="display:block">Start (s)</label>'
          + '<input type="number" class="set-input" value="' + displayPhraseStart + '"'
          + ' onchange="act(\'editorPhrase\',JSON.stringify({id:' + selectedPhraseId + ',prop:\'startSec\',val:this.value}))"'
          + ' style="width:80px" step="0.25"></div>';
        h += '<div><label class="metric-label" style="display:block">End (s)</label>'
          + '<input type="number" class="set-input" value="' + displayPhraseEnd + '"'
          + ' onchange="act(\'editorPhrase\',JSON.stringify({id:' + selectedPhraseId + ',prop:\'endSec\',val:this.value}))"'
          + ' style="width:80px" step="0.25"></div>';
        h += '</div>';
        h += '<button class="btn btn-sm" onclick="act(\'editorDeletePhrase\',' + selectedPhraseId + ')" style="margin-top:10px;color:#FF6B6B;background:none">Delete Phrase</button>';
        h += '</div>';
      }
    }

    // Event list
    h += '<div class="card mb20"><div class="card-section-heading" style="margin-bottom:6px">Events (' + editorEventCount + ')</div>';
    if (chart.events) {
      for (var ei = 0; ei < chart.events.length; ei++) {
        var evt = chart.events[ei];
        var sel = selectedEventId === evt.id;
        var eventLabel = _firstPerformanceEditorTextToken(evt.laneLabel, evt.chord, evt.note, "?");
        var listEventTime = _normalizePerformanceEditorNumber(evt.t, 0);
        var listEventDuration = _normalizePerformanceEditorNumber(evt.dur, 0);
        h += '<div class="split-row" style="padding:4px 6px;margin:2px 0;border-radius:6px;background:' + (sel ? "#4ECDC422" : "transparent") + ';border:1px solid ' + (sel ? "#4ECDC4" : "transparent") + ';cursor:pointer" role="button" tabindex="0" onclick="if(event.target&&event.target.closest&&event.target.closest(\'button,input,select,textarea,a\')){return;}act(\'editorSelectEvent\',' + evt.id + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'editorSelectEvent\',' + evt.id + ')}">';
        h += '<div><span class="card-micro-heading">' + escHTML(eventLabel) + '</span>';
        h += ' <span class="metric-value" style="font-size:11px">' + listEventTime.toFixed(2) + 's / ' + listEventDuration.toFixed(2) + 's</span></div>';
        h += '<button class="btn btn-sm" onclick="act(\'editorDeleteEvent\',' + evt.id + ')" style="color:#FF6B6B;background:none;padding:2px 6px">&times;</button>';
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
        var selectedDisplayLabel = _firstPerformanceEditorTextToken(selectedEventLabel, selEvt.laneLabel, selEvt.chord, selEvt.note, "?");
        var displayEventTime = _normalizePerformanceEditorNumber(selectedEventTime != null ? selectedEventTime : selEvt.t, 0);
        var displayEventDuration = _normalizePerformanceEditorNumber(selectedEventDuration != null ? selectedEventDuration : selEvt.dur, 0);
        var eventTimeValue = _normalizePerformanceEditorNumber(selEvt.t, 0);
        var eventDurationValue = _normalizePerformanceEditorNumber(selEvt.dur, 0);
        h += '<div class="card mb20" style="border:2px solid #4ECDC4">';
        h += '<div class="card-section-heading" style="color:#4ECDC4;margin-bottom:8px">Edit Event #' + eid + '</div>';
        h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Selected: '
          + escHTML(selectedDisplayLabel)
          + ' @ ' + displayEventTime.toFixed(2)
          + 's for ' + displayEventDuration.toFixed(2)
          + 's</div>';
        h += '<div class="action-row">';
        h += '<div><label class="metric-label" style="display:block">Chord/Note</label>'
          + '<input type="text" class="set-input" value="' + escHTML(_firstPerformanceEditorTextToken(selEvt.laneLabel)) + '"'
          + ' onchange="act(\'editorEvt\',JSON.stringify({id:' + eid + ',prop:\'label\',val:this.value}))"'
          + ' style="width:80px"></div>';
        h += '<div><label class="metric-label" style="display:block">Time (s)</label>'
          + '<input type="number" class="set-input" value="' + eventTimeValue + '"'
          + ' onchange="act(\'editorEvt\',JSON.stringify({id:' + eid + ',prop:\'t\',val:this.value}))"'
          + ' style="width:70px" step="0.25"></div>';
        h += '<div><label class="metric-label" style="display:block">Duration (s)</label>'
          + '<input type="number" class="set-input" value="' + eventDurationValue + '"'
          + ' onchange="act(\'editorEvt\',JSON.stringify({id:' + eid + ',prop:\'dur\',val:this.value}))"'
          + ' style="width:70px" step="0.25"></div>';
        h += '</div></div>';
      }
    }

    // Save/Export controls
    h += '<div class="action-row">';
    h += '<button class="btn" onclick="act(\'editorSave\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#128190; Save to Library</button>';
    h += '<button class="btn" onclick="act(\'editorExport\')" style="background:var(--input-bg);color:var(--text-primary)">&#128228; Export JSON</button>';
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function getPerformanceEditorView() {
  var documentView = getPerformanceEditorDocumentView();
  var coreView = getPerformanceEditorCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  return {
    chart: documentView && documentView.chart
      ? documentView.chart
      : (S.performEditorChart || null),
    library: documentView && documentView.library
      ? documentView.library
      : (S.performEditorLibrary || []),
    mode: documentView && documentView.mode
      ? documentView.mode
      : ((runtimeState && runtimeState.performanceEditorMode)
      ? runtimeState.performanceEditorMode
      : (S.performEditorMode || "chords")),
    snap: documentView && documentView.snap
      ? documentView.snap
      : ((runtimeState && runtimeState.performanceEditorSnap)
      ? runtimeState.performanceEditorSnap
      : (S.performEditorSnap || "1/8")),
    chartId: documentView && Object.prototype.hasOwnProperty.call(documentView, "chartId")
      ? documentView.chartId
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorChartId"))
      ? runtimeState.performanceEditorChartId
      : (S.performEditorChart && S.performEditorChart.id ? S.performEditorChart.id : null)),
    chartTitle: documentView && Object.prototype.hasOwnProperty.call(documentView, "title")
      ? documentView.title
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorChartTitle"))
      ? runtimeState.performanceEditorChartTitle
      : (S.performEditorChart && S.performEditorChart.title ? S.performEditorChart.title : null)),
    source: documentView && Object.prototype.hasOwnProperty.call(documentView, "source")
      ? documentView.source
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSource"))
      ? runtimeState.performanceEditorSource
      : (S.performEditorChart ? "existing" : "blank")),
    dirty: documentView && Object.prototype.hasOwnProperty.call(documentView, "dirty")
      ? documentView.dirty
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorDirty"))
      ? runtimeState.performanceEditorDirty
      : !!S.performEditorDirty),
    selectedEventId: documentView && documentView.selectedEvent ? documentView.selectedEvent.id
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventId"))
      ? runtimeState.performanceEditorSelectedEventId
      : S.performEditorSelectedEventId),
    selectedEventLabel: documentView && documentView.selectedEvent ? documentView.selectedEvent.label
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventLabel"))
      ? runtimeState.performanceEditorSelectedEventLabel
      : null),
    selectedEventTime: documentView && documentView.selectedEvent ? documentView.selectedEvent.time
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventTime"))
      ? runtimeState.performanceEditorSelectedEventTime
      : null),
    selectedEventDuration: documentView && documentView.selectedEvent ? documentView.selectedEvent.duration
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedEventDuration"))
      ? runtimeState.performanceEditorSelectedEventDuration
      : null),
    selectedPhraseId: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.id
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseId"))
      ? runtimeState.performanceEditorSelectedPhraseId
      : null),
    selectedPhraseName: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.name
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseName"))
      ? runtimeState.performanceEditorSelectedPhraseName
      : null),
    selectedPhraseStart: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.start
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseStart"))
      ? runtimeState.performanceEditorSelectedPhraseStart
      : null),
    selectedPhraseEnd: documentView && documentView.selectedPhrase ? documentView.selectedPhrase.end
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorSelectedPhraseEnd"))
      ? runtimeState.performanceEditorSelectedPhraseEnd
      : null),
    bpm: documentView && Object.prototype.hasOwnProperty.call(documentView, "bpm")
      ? documentView.bpm
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorBpm"))
      ? runtimeState.performanceEditorBpm
      : (S.performEditorChart && S.performEditorChart.bpm ? S.performEditorChart.bpm : null)),
    eventCount: documentView && Object.prototype.hasOwnProperty.call(documentView, "eventCount")
      ? documentView.eventCount
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorEventCount"))
      ? runtimeState.performanceEditorEventCount
      : (S.performEditorChart && S.performEditorChart.events ? S.performEditorChart.events.length : 0)),
    phraseCount: documentView && Object.prototype.hasOwnProperty.call(documentView, "phraseCount")
      ? documentView.phraseCount
      : ((runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceEditorPhraseCount"))
      ? runtimeState.performanceEditorPhraseCount
      : (S.performEditorChart && S.performEditorChart.phrases ? S.performEditorChart.phrases.length : 0))
  };
}
