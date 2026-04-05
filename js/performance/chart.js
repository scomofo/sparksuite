/* ===== ChordSpark Performance: Chart Loader ===== */

var PERFORMANCE_CHART_LIBRARY_FALLBACK = [
  {
    id: "demo_progression",
    title: "Demo Progression",
    artist: "ChordSpark",
    bpm: 90,
    description: "ChordSpark demo chart with 8 steady chord hits.",
    sourceType: "built_in",
    accentColor: "#4ECDC4",
    badge: "Demo",
    instrument: "guitar"
  },
  {
    id: "demo_imported_package",
    title: "Imported MIDI Demo",
    artist: "SparkSuite Import",
    bpm: 120,
    description: "Package-backed import using notes.mid plus song.ini through SparkChartIO.",
    sourceType: "imported_package",
    accentColor: "#f59e0b",
    badge: "Import",
    instrument: "guitar"
  }
];

function normalizePerformanceInstrument(instrument) {
  var candidate = instrument || null;
  if (!candidate) return null;
  if (window.SparkInstruments && typeof SparkInstruments.getAll === "function") {
    var all = SparkInstruments.getAll() || [];
    for (var i = 0; i < all.length; i++) {
      var entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) {
        return entry.instrument || entry.instrumentType || candidate;
      }
    }
  }
  return candidate;
}

function loadPerformanceChart(chartId) {
  return fetch("data/performance_charts/" + chartId + ".json")
    .then(function(r) {
      if (!r.ok) throw new Error("Chart not found: " + chartId);
      return r.json();
    })
    .then(function(chartDefinition) {
      return normalizePerformanceChartDefinition(chartDefinition);
    });
}

function getPerformanceChartManifest() {
  if (window.PERFORMANCE_CHART_MANIFEST && Array.isArray(window.PERFORMANCE_CHART_MANIFEST.charts)) {
    return window.PERFORMANCE_CHART_MANIFEST.charts.slice();
  }
  return PERFORMANCE_CHART_LIBRARY_FALLBACK.slice();
}

function getPerformanceChartLibrary(options) {
  options = options || {};
  var charts = getPerformanceChartManifest();
  if (options.instrument) {
    var requestedInstrument = normalizePerformanceInstrument(options.instrument);
    charts = charts.filter(function(chart) {
      return !chart.instrument || chart.instrument === requestedInstrument;
    });
  }
  return charts;
}

function getPerformanceChartMeta(chartId) {
  var library = getPerformanceChartLibrary();
  for (var i = 0; i < library.length; i++) {
    if (library[i].id === chartId) return library[i];
  }
  return null;
}

function normalizePerformanceChartDefinition(chartDefinition) {
  if (!chartDefinition) throw new Error("Performance chart is empty");
  if (chartDefinition.events) return normalizePerformanceChart(chartDefinition);
  if (chartDefinition.songChart) {
    return convertSparkSongChartToPerformanceChart(chartDefinition.songChart, chartDefinition.importOptions || {});
  }
  if (chartDefinition.chartImport || chartDefinition.packageFormat === "sparksuite_import_v1") {
    return importPerformanceChartPackage(chartDefinition);
  }
  throw new Error("Unsupported performance chart definition");
}

function importPerformanceChartPackage(chartDefinition) {
  if (typeof SparkChartIO !== "function") throw new Error("SparkChartIO is not available");
  var chartIO = new SparkChartIO();
  var adapter = getPerformanceImportAdapter(chartDefinition);
  var sparkChart = chartIO.fromPackage(chartDefinition.chartImport || chartDefinition, adapter, chartDefinition.importOptions || {});
  return convertSparkSongChartToPerformanceChart(sparkChart, {
    chartId: chartDefinition.id,
    title: chartDefinition.title,
    artist: chartDefinition.artist,
    arrangementType: chartDefinition.arrangementType,
    audio: chartDefinition.audio
  });
}

function getPerformanceImportAdapter(chartDefinition) {
  var adapterType = normalizePerformanceInstrument(chartDefinition && chartDefinition.adapterType);
  var instrumentType = normalizePerformanceInstrument(chartDefinition && chartDefinition.instrument);
  if (chartDefinition && chartDefinition.adapter && typeof chartDefinition.adapter.getLaneCount === "function") {
    return chartDefinition.adapter;
  }
  if (chartDefinition && (adapterType === "bass" || instrumentType === "bass")) {
    if (typeof SparkBassRhythmAdapter === "function") return new SparkBassRhythmAdapter();
    if (window.SparkBassModule && typeof window.SparkBassModule.getRhythmAdapter === "function") {
      return window.SparkBassModule.getRhythmAdapter();
    }
    return {
      getLaneCount: function() { return 4; }
    };
  }
  if (chartDefinition && (adapterType === "ukulele" || instrumentType === "ukulele")) {
    if (typeof SparkUkuleleRhythmAdapter === "function") return new SparkUkuleleRhythmAdapter();
    if (window.SparkUkuleleModule && typeof window.SparkUkuleleModule.getRhythmAdapter === "function") {
      return window.SparkUkuleleModule.getRhythmAdapter();
    }
    return {
      getLaneCount: function() { return 4; }
    };
  }
  if (typeof SparkGuitarRhythmAdapter === "function") return new SparkGuitarRhythmAdapter();
  return {
    getLaneCount: function() { return 5; }
  };
}

function convertSparkSongChartToPerformanceChart(songChart, options) {
  options = options || {};
  if (!songChart || !songChart.tempoMap || !songChart.tracks) throw new Error("Invalid Spark song chart");
  var track = pickSparkPerformanceTrack(songChart);
  var notes = track.notes || [];
  var phrases = track.phrases || [];
  var events = [];
  var bpm = 100;
  if (songChart.tempoMap.segments && songChart.tempoMap.segments.length) {
    var segs = songChart.tempoMap.segments;
    if (segs.length === 1) {
      bpm = segs[0].bpm;
    } else {
      var bestBpm = segs[0].bpm;
      var bestDur = 0;
      for (var si = 0; si < segs.length; si++) {
        var segStart = segs[si].startTick !== undefined ? segs[si].startTick : 0;
        var segEnd = si + 1 < segs.length && segs[si + 1].startTick !== undefined ? segs[si + 1].startTick : segStart;
        var segDur = segEnd - segStart;
        if (segDur > bestDur) {
          bestDur = segDur;
          bestBpm = segs[si].bpm;
        }
      }
      bpm = bestBpm;
    }
  }

  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var startSec = songChart.tempoMap.tickToSeconds(note.tick) + (songChart.song.offsetSec || 0);
    var endTick = note.tick + (note.tickLength || 0);
    var endSec = songChart.tempoMap.tickToSeconds(endTick) + (songChart.song.offsetSec || 0);
    var eventNotes = sparkNoteToPitchClasses(note);
    var importFlags = cloneImportFlags(note.flags);
    var eventType = deriveImportedPerformanceEventType(note, eventNotes);
    var laneLabel = note.label || formatPitchClasses(eventNotes) || maskToLaneLabel(note.laneMask, importFlags);
    events.push({
      id: note.id || ("spark_evt_" + i),
      t: startSec,
      dur: Math.max(0.05, endSec - startSec),
      type: eventType,
      chord: note.label || formatPitchClasses(eventNotes),
      laneLabel: laneLabel,
      notes: eventNotes,
      strum: eventType === "tap" ? "tap" : (importFlags.open ? "open" : "down"),
      sourceEventId: note.id || null,
      laneMask: note.laneMask || 0,
      sourceFlags: importFlags,
      sourceLabel: note.label || "",
      sourceSkillId: note.skillId || null
    });
  }

  var normalizedPhrases = [];
  for (var j = 0; j < phrases.length; j++) {
    normalizedPhrases.push({
      id: phrases[j].id,
      name: phrases[j].name,
      startSec: songChart.tempoMap.tickToSeconds(phrases[j].startTick) + (songChart.song.offsetSec || 0),
      endSec: songChart.tempoMap.tickToSeconds(phrases[j].endTick) + (songChart.song.offsetSec || 0)
    });
  }
  if (!normalizedPhrases.length || (normalizedPhrases.length === 1 && normalizedPhrases[0].name === "Full Song")) {
    var inferredPhrases = [];
    var GAP_SEC = 2;
    if (events.length > 1) {
      var phraseStartIdx = 0;
      for (var pi = 1; pi < events.length; pi++) {
        var prevEnd = events[pi - 1].t + (events[pi - 1].dur || 0);
        if (events[pi].t - prevEnd > GAP_SEC) {
          inferredPhrases.push({
            id: inferredPhrases.length,
            name: "Section " + (inferredPhrases.length + 1),
            startSec: events[phraseStartIdx].t,
            endSec: events[pi - 1].t + (events[pi - 1].dur || 0)
          });
          phraseStartIdx = pi;
        }
      }
      if (inferredPhrases.length > 0) {
        inferredPhrases.push({
          id: inferredPhrases.length,
          name: "Section " + (inferredPhrases.length + 1),
          startSec: events[phraseStartIdx].t,
          endSec: events[events.length - 1].t + (events[events.length - 1].dur || 0)
        });
        normalizedPhrases = inferredPhrases;
      }
    }
    if (!normalizedPhrases.length) {
      normalizedPhrases.push({
        id: 0,
        name: "Full Song",
        startSec: 0,
        endSec: songChart.song.durationSec || (events.length ? events[events.length - 1].t + events[events.length - 1].dur : 0)
      });
    }
  }

  var chartDef = {
    id: options.chartId || songChart.song.id || "imported_chart",
    title: options.title || songChart.song.title || "Imported Chart",
    artist: options.artist || songChart.song.artist || "Unknown Artist",
    bpm: bpm,
    beatsPerBar: normalizedPhrases.length ? 4 : 4,
    offsetSec: songChart.song.offsetSec || 0,
    arrangementType: options.arrangementType || "imported_chart",
    audio: options.audio || { type: "silent" },
    events: events,
    phrases: normalizedPhrases,
    sourceFormat: songChart.metadata ? songChart.metadata.sourceFormat : null
  };
  var builtChart = normalizePerformanceChart(chartDef);
  var lastEvtEnd = builtChart.events.length
    ? builtChart.events[builtChart.events.length - 1].t + (builtChart.events[builtChart.events.length - 1].dur || 0)
    : 0;
  builtChart.durationSec = Math.max(lastEvtEnd, songChart.song.audioDurationSec || 0);
  return builtChart;
}

function validatePerformanceChart(chart) {
  var errors = [];
  if (!chart) { return { valid: false, errors: ["Chart is null or undefined"] }; }
  if (!chart.id) errors.push("Missing required field: id");
  if (!chart.title) errors.push("Missing required field: title");
  if (typeof chart.bpm !== "number" || chart.bpm <= 0) errors.push("Missing or invalid bpm");
  if (!Array.isArray(chart.phrases) || chart.phrases.length === 0) errors.push("Missing or empty phrases array");
  if (!Array.isArray(chart.events) || chart.events.length === 0) errors.push("Missing or empty events array");

  if (Array.isArray(chart.phrases)) {
    for (var i = 0; i < chart.phrases.length; i++) {
      var p = chart.phrases[i];
      if (typeof p.startSec !== "number" || typeof p.endSec !== "number") {
        errors.push("Phrase " + i + ": missing startSec or endSec");
      } else if (p.endSec <= p.startSec) {
        errors.push("Phrase " + i + ": endSec must be greater than startSec");
      }
      if (i > 0 && typeof p.startSec === "number" && typeof chart.phrases[i - 1].endSec === "number") {
        if (p.startSec < chart.phrases[i - 1].endSec) {
          errors.push("Phrase " + i + ": overlaps with previous phrase");
        }
      }
    }
  }

  if (Array.isArray(chart.events)) {
    for (var j = 0; j < chart.events.length; j++) {
      var evt = chart.events[j];
      if (typeof evt.t !== "number" || evt.t < 0) {
        errors.push("Event " + j + ": missing or negative time (t)");
      }
      if (evt.type === "chord" && (!Array.isArray(evt.notes) || evt.notes.length === 0)) {
        errors.push("Event " + j + ": chord event missing notes array");
      }
      if (!evt.laneLabel) {
        errors.push("Event " + j + ": missing laneLabel");
      }
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

function normalizePerformanceChart(chart) {
  if (!chart.phrases) chart.phrases = [];
  if (!chart.events) chart.events = [];
  chart.events.sort(function(a, b) { return a.t - b.t; });
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    evt.phraseId = _findPhraseIdForTime(chart, evt.t);
    evt._hit = false;
    evt._miss = false;
    evt._scored = false;
    evt._result = null;
    evt._score = 0;
  }
  return chart;
}

function _findPhraseIdForTime(chart, sec) {
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    if (sec >= p.startSec && sec < p.endSec) return p.id;
  }
  return chart.phrases.length > 0 ? chart.phrases[chart.phrases.length - 1].id : 0;
}

function getPerformanceEventsInWindow(chart, fromSec, toSec) {
  var result = [];
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    var evtEnd = evt.t + (evt.dur || 0);
    if (evt.t < toSec && evtEnd > fromSec) result.push(evt);
  }
  return result;
}

function getPerformancePhraseForTime(chart, sec) {
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    if (sec >= p.startSec && sec < p.endSec) return p;
  }
  return chart.phrases[chart.phrases.length - 1] || null;
}

function getPerformancePhraseIndicesForTechnique(chart, techniqueKey) {
  if (!chart || !Array.isArray(chart.phrases) || !Array.isArray(chart.events) || !techniqueKey) return [];
  var matches = [];
  for (var i = 0; i < chart.phrases.length; i++) {
    var phrase = chart.phrases[i];
    var found = false;
    for (var j = 0; j < chart.events.length; j++) {
      var evt = chart.events[j];
      if (!evt || !evt.sourceFlags || !evt.sourceFlags[techniqueKey]) continue;
      if (evt.t >= phrase.startSec && evt.t < phrase.endSec) {
        found = true;
        break;
      }
    }
    if (found) matches.push(i);
  }
  return matches;
}

function getPerformancePhraseIndexForTime(chart, sec) {
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    if (sec >= p.startSec && sec < p.endSec) return i;
  }
  return chart.phrases.length - 1;
}

function clonePerformanceChart(chart) {
  return normalizePerformanceChart(JSON.parse(JSON.stringify(chart)));
}

function pickSparkPerformanceTrack(songChart) {
  if (songChart.tracks.guitar) return songChart.tracks.guitar;
  for (var key in songChart.tracks) {
    if (songChart.tracks[key]) return songChart.tracks[key];
  }
  return { notes: [], phrases: [] };
}

function sparkNoteToPitchClasses(note) {
  var midiNotes = note && note.flags ? note.flags.midiNotes : null;
  var pitchClasses = [];
  if (Array.isArray(midiNotes) && midiNotes.length) {
    for (var i = 0; i < midiNotes.length; i++) {
      pitchClasses.push(midiNumberToPitchClass(midiNotes[i]));
    }
    return dedupePerformancePitchClasses(pitchClasses);
  }
  if (note && note.label) {
    var labelMatches = String(note.label).match(/[A-G](?:#|b)?/g);
    if (labelMatches && labelMatches.length) return dedupePerformancePitchClasses(labelMatches);
  }
  return dedupePerformancePitchClasses(maskToPitchClasses(note ? note.laneMask : 0));
}

function deriveImportedPerformanceEventType(note, eventNotes) {
  var flags = note && note.flags ? note.flags : {};
  if (flags.tap) return "tap";
  if (flags.open) return "open";
  if (eventNotes.length > 1) return "chord";
  return "note";
}

function cloneImportFlags(flags) {
  var out = {};
  flags = flags || {};
  for (var key in flags) {
    if (!Object.prototype.hasOwnProperty.call(flags, key)) continue;
    if (Array.isArray(flags[key])) out[key] = flags[key].slice();
    else if (flags[key] && typeof flags[key] === "object") out[key] = JSON.parse(JSON.stringify(flags[key]));
    else out[key] = flags[key];
  }
  return out;
}

function midiNumberToPitchClass(midi) {
  var names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return names[((midi % 12) + 12) % 12];
}

function maskToPitchClasses(laneMask) {
  var labels = ["G", "R", "Y", "B", "O"];
  var out = [];
  for (var i = 0; i < labels.length; i++) {
    if (laneMask & (1 << i)) out.push(labels[i]);
  }
  return out;
}

function maskToLaneLabel(laneMask, flags) {
  flags = flags || {};
  if (flags.open) return "Open";
  var labels = maskToPitchClasses(laneMask);
  return labels.length ? labels.join("+") : "Open";
}

function formatPitchClasses(notes) {
  return notes && notes.length ? notes.join(" ") : "";
}

function dedupePerformancePitchClasses(notes) {
  var seen = {};
  var out = [];
  for (var i = 0; i < notes.length; i++) {
    if (!notes[i] || seen[notes[i]]) continue;
    seen[notes[i]] = true;
    out.push(notes[i]);
  }
  return out;
}

window.getPerformanceChartManifest = getPerformanceChartManifest;
