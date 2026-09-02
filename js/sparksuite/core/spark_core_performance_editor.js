/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Performance editor: document state, mutation, export and preview
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.getPerformanceEditorDocumentView = function() {
    var runtimeState = this.getRuntimeState();
    return {
      chart: this.cloneValue(this.performanceEditorDocument),
      library: this.cloneValue(this.performanceEditorLibrary),
      chartId: runtimeState.performanceEditorChartId,
      title: runtimeState.performanceEditorChartTitle,
      source: runtimeState.performanceEditorSource,
      dirty: !!runtimeState.performanceEditorDirty,
      mode: runtimeState.performanceEditorMode,
      snap: runtimeState.performanceEditorSnap,
      bpm: runtimeState.performanceEditorBpm,
      eventCount: runtimeState.performanceEditorEventCount,
      phraseCount: runtimeState.performanceEditorPhraseCount,
      selectedEvent: {
        id: runtimeState.performanceEditorSelectedEventId,
        label: runtimeState.performanceEditorSelectedEventLabel,
        time: runtimeState.performanceEditorSelectedEventTime,
        duration: runtimeState.performanceEditorSelectedEventDuration
      },
      selectedPhrase: {
        id: runtimeState.performanceEditorSelectedPhraseId,
        name: runtimeState.performanceEditorSelectedPhraseName,
        start: runtimeState.performanceEditorSelectedPhraseStart,
        end: runtimeState.performanceEditorSelectedPhraseEnd
      }
    };
  };

  SparkCore.prototype.buildPerformanceEditorDocumentState = function(chart, options) {
    var runtimeState = this.getRuntimeState();
    var payload = {};
    var events = chart && Array.isArray(chart.events) ? chart.events : [];
    var phrases = chart && Array.isArray(chart.phrases) ? chart.phrases : [];
    var selectedEventId;
    var selectedPhraseId;
    var selectedEvent = null;
    var selectedPhrase = null;
    var i;

    options = options || {};

    payload.mode = Object.prototype.hasOwnProperty.call(options, "mode")
      ? options.mode
      : runtimeState.performanceEditorMode;
    payload.snap = Object.prototype.hasOwnProperty.call(options, "snap")
      ? options.snap
      : runtimeState.performanceEditorSnap;
    payload.chartId = chart && Object.prototype.hasOwnProperty.call(chart, "id")
      ? chart.id
      : null;
    payload.chartTitle = chart && Object.prototype.hasOwnProperty.call(chart, "title")
      ? chart.title
      : null;
    payload.source = Object.prototype.hasOwnProperty.call(options, "source")
      ? options.source
      : (chart ? "existing" : "blank");
    payload.dirty = Object.prototype.hasOwnProperty.call(options, "dirty")
      ? !!options.dirty
      : !!runtimeState.performanceEditorDirty;
    payload.bpm = Object.prototype.hasOwnProperty.call(options, "bpm")
      ? options.bpm
      : (chart && Object.prototype.hasOwnProperty.call(chart, "bpm") ? chart.bpm : null);
    payload.eventCount = Object.prototype.hasOwnProperty.call(options, "eventCount")
      ? options.eventCount
      : events.length;
    payload.phraseCount = Object.prototype.hasOwnProperty.call(options, "phraseCount")
      ? options.phraseCount
      : phrases.length;

    selectedEventId = Object.prototype.hasOwnProperty.call(options, "selectedEventId")
      ? options.selectedEventId
      : runtimeState.performanceEditorSelectedEventId;
    if (Object.prototype.hasOwnProperty.call(options, "selectedEvent")) {
      selectedEvent = options.selectedEvent;
    } else if (selectedEventId != null) {
      for (i = 0; i < events.length; i++) {
        if (events[i] && events[i].id === selectedEventId) {
          selectedEvent = events[i];
          break;
        }
      }
    }
    payload.selectedEventId = selectedEventId != null ? selectedEventId : null;
    payload.selectedEventLabel = Object.prototype.hasOwnProperty.call(options, "selectedEventLabel")
      ? options.selectedEventLabel
      : (selectedEvent ? (selectedEvent.laneLabel || selectedEvent.chord || selectedEvent.note || "?") : null);
    payload.selectedEventTime = Object.prototype.hasOwnProperty.call(options, "selectedEventTime")
      ? options.selectedEventTime
      : (selectedEvent ? (selectedEvent.t || 0) : null);
    payload.selectedEventDuration = Object.prototype.hasOwnProperty.call(options, "selectedEventDuration")
      ? options.selectedEventDuration
      : (selectedEvent ? (selectedEvent.dur || 0) : null);

    selectedPhraseId = Object.prototype.hasOwnProperty.call(options, "selectedPhraseId")
      ? options.selectedPhraseId
      : runtimeState.performanceEditorSelectedPhraseId;
    if (Object.prototype.hasOwnProperty.call(options, "selectedPhrase")) {
      selectedPhrase = options.selectedPhrase;
    } else if (selectedPhraseId != null) {
      for (i = 0; i < phrases.length; i++) {
        if (phrases[i] && phrases[i].id === selectedPhraseId) {
          selectedPhrase = phrases[i];
          break;
        }
      }
    }
    payload.selectedPhraseId = selectedPhraseId != null ? selectedPhraseId : null;
    payload.selectedPhraseName = Object.prototype.hasOwnProperty.call(options, "selectedPhraseName")
      ? options.selectedPhraseName
      : (selectedPhrase ? selectedPhrase.name : null);
    payload.selectedPhraseStart = Object.prototype.hasOwnProperty.call(options, "selectedPhraseStart")
      ? options.selectedPhraseStart
      : (selectedPhrase ? selectedPhrase.startSec : null);
    payload.selectedPhraseEnd = Object.prototype.hasOwnProperty.call(options, "selectedPhraseEnd")
      ? options.selectedPhraseEnd
      : (selectedPhrase ? selectedPhrase.endSec : null);

    return payload;
  };

  SparkCore.prototype.syncPerformanceEditorDocument = function(chart, options) {
    var action;
    options = options || {};
    this.performanceEditorDocument = chart ? this.cloneValue(chart) : null;
    action = options.action || (this.runtimeState.activeScreen === "performance_editor" ? "configure_editor" : "open_editor");
    return this.syncPerformanceRuntimeState(action, this.buildPerformanceEditorDocumentState(chart, options));
  };

  SparkCore.prototype.applyPerformanceEditorMutation = function(action, payload) {
    var chart = this.performanceEditorDocument ? this.cloneValue(this.performanceEditorDocument) : null;
    var library = this.cloneValue(this.performanceEditorLibrary) || [];
    var i;
    var phrases;
    var events;
    var maxId;
    var lastEnd;
    var lastT;
    var beatDur;
    var libraryIndex;
    var result = {
      chart: chart,
      library: library,
      selectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      selectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId
    };

    payload = payload || {};

    if (action === "new_blank") {
      chart = {
        id: "custom_" + Date.now(),
        title: "New Chart",
        artist: "Custom",
        bpm: 90,
        beatsPerBar: 4,
        arrangementType: payload.mode || this.runtimeState.performanceEditorMode || "chords",
        events: [],
        phrases: [{ id: 0, name: "Phrase 1", startSec: 0, endSec: 8 }]
      };
      result.chart = chart;
      result.selectedEventId = null;
      result.selectedPhraseId = null;
      return result;
    }

    if (action === "save_to_library") {
      if (!chart) return result;
      libraryIndex = -1;
      for (i = 0; i < library.length; i++) {
        if (library[i] && library[i].id === chart.id) {
          libraryIndex = i;
          break;
        }
      }
      if (libraryIndex >= 0) library[libraryIndex] = this.cloneValue(chart);
      else library.push(this.cloneValue(chart));
      this.performanceEditorLibrary = library;
      result.library = this.cloneValue(library);
      return result;
    }

    if (action === "load_from_library") {
      libraryIndex = payload.index;
      if (library[libraryIndex]) {
        chart = this.cloneValue(library[libraryIndex]);
        result.chart = chart;
        result.library = this.cloneValue(library);
        result.selectedEventId = null;
        result.selectedPhraseId = null;
      }
      return result;
    }

    if (action === "delete_from_library") {
      libraryIndex = payload.index;
      if (library[libraryIndex]) {
        library.splice(libraryIndex, 1);
        this.performanceEditorLibrary = library;
        result.library = this.cloneValue(library);
      }
      return result;
    }

    if (!chart) return result;

    if (action === "set_title") {
      chart.title = payload.title;
    } else if (action === "set_bpm") {
      chart.bpm = payload.bpm;
    } else if (action === "add_phrase") {
      phrases = Array.isArray(chart.phrases) ? chart.phrases : [];
      lastEnd = phrases.length ? phrases[phrases.length - 1].endSec : 0;
      phrases.push({
        id: phrases.length,
        name: "Phrase " + (phrases.length + 1),
        startSec: lastEnd,
        endSec: lastEnd + 8
      });
      chart.phrases = phrases;
      result.selectedPhraseId = phrases[phrases.length - 1].id;
    } else if (action === "update_phrase") {
      phrases = Array.isArray(chart.phrases) ? chart.phrases : [];
      for (i = 0; i < phrases.length; i++) {
        if (phrases[i].id === payload.id) {
          if (payload.prop === "name") phrases[i].name = payload.val;
          if (payload.prop === "startSec") phrases[i].startSec = parseFloat(payload.val) || 0;
          if (payload.prop === "endSec") phrases[i].endSec = parseFloat(payload.val) || 0;
          result.selectedPhraseId = phrases[i].id;
          break;
        }
      }
    } else if (action === "delete_phrase") {
      phrases = Array.isArray(chart.phrases) ? chart.phrases : [];
      chart.phrases = phrases.filter(function(phrase) { return phrase.id !== payload.id; });
      result.selectedPhraseId = null;
    } else if (action === "select_phrase") {
      result.selectedPhraseId = payload.id;
    } else if (action === "add_event") {
      events = Array.isArray(chart.events) ? chart.events : [];
      maxId = 0;
      for (i = 0; i < events.length; i++) {
        if (events[i].id > maxId) maxId = events[i].id;
      }
      lastT = events.length ? events[events.length - 1].t + events[events.length - 1].dur : 0;
      beatDur = 60 / (chart.bpm || 90);
      events.push({
        id: maxId + 1,
        t: lastT,
        dur: beatDur,
        type: (payload.mode || this.runtimeState.performanceEditorMode) === "lead" ? "note" : "chord",
        chord: "",
        laneLabel: "?",
        notes: [],
        strum: "down"
      });
      chart.events = events;
    } else if (action === "select_event") {
      result.selectedEventId = payload.id;
    } else if (action === "update_event") {
      events = Array.isArray(chart.events) ? chart.events : [];
      for (i = 0; i < events.length; i++) {
        if (events[i].id === payload.id) {
          if (payload.prop === "label") {
            events[i].laneLabel = payload.val;
            events[i].chord = payload.val;
          }
          if (payload.prop === "t") events[i].t = parseFloat(payload.val) || 0;
          if (payload.prop === "dur") events[i].dur = parseFloat(payload.val) || 0;
          result.selectedEventId = events[i].id;
          break;
        }
      }
      chart.events = events;
    } else if (action === "delete_event") {
      events = Array.isArray(chart.events) ? chart.events : [];
      chart.events = events.filter(function(event) { return event.id !== payload.id; });
      result.selectedEventId = null;
    }

    result.chart = chart;
    return result;
  };

  SparkCore.prototype.getPerformanceEditorExportData = function() {
    var chart = this.performanceEditorDocument ? this.cloneValue(this.performanceEditorDocument) : null;
    var title = chart && chart.title ? chart.title : "chart";
    return {
      chart: chart,
      json: chart ? JSON.stringify(chart, null, 2) : "",
      fileName: String(title).replace(/\s+/g, "_") + ".json"
    };
  };

  SparkCore.prototype.getPerformanceEditorPreviewChart = function() {
    return this.performanceEditorDocument ? this.cloneValue(this.performanceEditorDocument) : null;
  };

  SparkCore.prototype.getPerformanceEditorPreviewRequest = function() {
    var chart = this.getPerformanceEditorPreviewChart();
    var runtimeState = this.getRuntimeState();
    return {
      chart: chart,
      chartId: chart && chart.id ? chart.id : "generated",
      arrangementType: chart && chart.arrangementType
        ? chart.arrangementType
        : (runtimeState.performanceArrangementType || runtimeState.performanceEditorMode || "chords"),
      difficulty: runtimeState.performanceDifficultyId || "normal",
      speed: runtimeState.performanceSpeed || 1,
      mode: runtimeState.performanceInputMode || "midi",
      preset: runtimeState.performancePracticePreset || null
    };
  };

  SparkCore.prototype.startPerformanceEditorPreview = function() {
    var request = this.getPerformanceEditorPreviewRequest();
    if (!request.chart || !request.chart.events || !request.chart.events.length) return null;
    this.syncPerformanceRuntimeState("start", {
      chartId: request.chartId,
      difficulty: request.difficulty,
      arrangementType: request.arrangementType,
      speed: request.speed,
      mode: request.mode,
      preset: request.preset,
      countIn: false
    });
    return request;
  };
})();
