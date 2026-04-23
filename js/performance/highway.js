/* ===== ChordSpark Performance: Highway Renderer (Canvas) ===== */

var _sparkHighway = null;

function performancePitchClassToSemitone(name) {
  var map = {
    C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
    "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11
  };
  return Object.prototype.hasOwnProperty.call(map, name) ? map[name] : null;
}

function performanceNoteNameToMidi(noteName) {
  var match;
  var pitchClass;
  var octave;
  var semitone;
  if (typeof noteName !== "string") return null;
  match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(noteName.trim());
  if (!match) return null;
  pitchClass = match[1];
  octave = parseInt(match[2], 10);
  semitone = performancePitchClassToSemitone(pitchClass);
  if (semitone == null || !isFinite(octave)) return null;
  return (octave + 1) * 12 + semitone;
}

function deriveBassLaneIndexFromMidi(midi) {
  if (!isFinite(midi)) return 0;
  if (midi >= 43) return 3; // G string and above
  if (midi >= 38) return 2; // D string range
  if (midi >= 33) return 1; // A string range
  return 0; // E string range
}

function clampPerformanceLaneIndex(lane, laneCount) {
  lane = Math.round(Number(lane) || 0);
  if (lane < 0) return 0;
  if (lane >= laneCount) return laneCount - 1;
  return lane;
}

function resolvePerformanceLaneCount(chart) {
  var skin = resolvePerformanceHighwaySkin(chart);
  return (skin && skin.laneCount) || 6;
}

function distributePerformanceValuesAcrossLanes(values, laneCount) {
  var lanes = [];
  var used = {};
  var i;
  var lane;
  if (!values.length || laneCount <= 0) return lanes;
  if (values.length === 1) {
    lanes.push(((values[0] % laneCount) + laneCount) % laneCount);
    return lanes;
  }
  for (i = 0; i < values.length; i++) {
    lane = Math.round((i * (laneCount - 1)) / Math.max(values.length - 1, 1));
    lane = clampPerformanceLaneIndex(lane, laneCount);
    while (used[lane] && lane < laneCount - 1) lane += 1;
    while (used[lane] && lane > 0) lane -= 1;
    if (!used[lane]) {
      used[lane] = true;
      lanes.push(lane);
    }
  }
  return lanes;
}

function derivePianoLaneIndexFromMidi(chart, midi) {
  var skin = resolvePerformanceHighwaySkin(chart) || {};
  var laneCount = resolvePerformanceLaneCount(chart);
  var centerNote = isFinite(skin.centerNote) ? skin.centerNote : 60;
  var lowestNote = centerNote - Math.floor(laneCount / 2);
  return clampPerformanceLaneIndex(midi - lowestNote, laneCount);
}

function collectPerformancePitchValues(notes) {
  var values = [];
  var i;
  var midi;
  var semitone;
  var name;
  var match;
  for (i = 0; i < notes.length; i++) {
    name = notes[i];
    midi = performanceNoteNameToMidi(name);
    if (midi != null) {
      values.push(midi);
      continue;
    }
    if (typeof name !== "string") continue;
    match = /^([A-G](?:#|b)?)/.exec(name.trim());
    if (!match) continue;
    semitone = performancePitchClassToSemitone(match[1]);
    if (semitone != null) values.push(semitone);
  }
  return values.sort(function(a, b) { return a - b; });
}

function derivePerformanceLaneMask(chart, evt) {
  var instrument = resolvePerformanceHighwayInstrument(chart);
  var laneCount = resolvePerformanceLaneCount(chart);
  var notes = evt && Array.isArray(evt.notes) ? evt.notes : [];
  var values;
  var lanes;
  var mask = 0;
  var i;
  if (evt && typeof evt.laneMask === "number" && evt.laneMask > 0) return evt.laneMask;
  if (evt && typeof evt.lane === "number" && isFinite(evt.lane)) {
    return 1 << clampPerformanceLaneIndex(evt.lane, laneCount);
  }
  if (!notes.length) return 0;
  values = collectPerformancePitchValues(notes);
  if (!values.length) return 0;
  if (instrument === "bass") {
    for (i = 0; i < values.length; i++) {
      mask |= (1 << deriveBassLaneIndexFromMidi(values[i]));
    }
    return mask;
  }
  if (instrument === "piano") {
    for (i = 0; i < values.length; i++) {
      mask |= (1 << derivePianoLaneIndexFromMidi(chart, values[i]));
    }
    return mask;
  }
  lanes = distributePerformanceValuesAcrossLanes(values, laneCount);
  for (i = 0; i < lanes.length; i++) mask |= (1 << lanes[i]);
  return mask;
}

function derivePerformanceLaneIndex(chart, evt) {
  var laneMask = derivePerformanceLaneMask(chart, evt);
  if (laneMask > 0) return getPrimaryLaneIndex(laneMask);
  return null;
}

function resolvePerformanceHighwayInstrument(chart) {
  var instrument = chart && chart.instrument ? chart.instrument : null;
  if (!instrument && typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
    var active = SparkInstruments.getActive();
    if (active) instrument = active.instrument || active.instrumentType || active.id || active.appId || null;
  }
  if (instrument && typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getAll === "function") {
    var all = SparkInstruments.getAll() || [];
    for (var i = 0; i < all.length; i++) {
      var entry = all[i] || {};
      if (entry.id === instrument || entry.appId === instrument) {
        instrument = entry.instrument || entry.instrumentType || instrument;
        break;
      }
    }
  }
  return instrument || "guitar";
}

function resolvePerformanceHighwaySkin(chart) {
  var instrument = resolvePerformanceHighwayInstrument(chart);
  var all;
  var i;
  var entry;
  if (instrument === "piano" && SparkHighway.PIANO_SKIN) return SparkHighway.PIANO_SKIN;
  if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getAll === "function") {
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if ((entry.instrument || entry.instrumentType) === instrument && entry.skin) return entry.skin;
    }
  }
  // Fall through to the active instrument's registered skin (bass, ukulele, ...)
  // before the guitar default, so non-guitar instruments render their own lane
  // count / colors instead of being forced into a 6-lane guitar highway.
  if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function") {
    var active = SparkInstruments.getActive();
    if (active && active.skin) return active.skin;
  }
  return SparkHighway.GUITAR_SKIN;
}

function ensureSparkHighway(canvasEl, chart) {
  if (_sparkHighway && _sparkHighway.canvas === canvasEl) return _sparkHighway;
  if (_sparkHighway) _sparkHighway.destroy();
  _sparkHighway = new SparkHighway(canvasEl, resolvePerformanceHighwaySkin(chart));
  _sparkHighway._initPromise = _sparkHighway.init();
  return _sparkHighway;
}

function destroySparkHighway() {
  if (_sparkHighway) { _sparkHighway.destroy(); _sparkHighway = null; }
}

function feedChartToHighway(chart) {
  if (!_sparkHighway || !chart) return;
  var events = chart.events || [];
  var derivedLaneMask;
  for (var i = 0; i < events.length; i++) {
    derivedLaneMask = derivePerformanceLaneMask(chart, events[i]);
    if ((!events[i].laneMask || events[i].laneMask <= 0) && derivedLaneMask > 0) {
      events[i].laneMask = derivedLaneMask;
    }
    if (events[i].lane === undefined && events[i].laneMask) {
      events[i].lane = getPrimaryLaneIndex(events[i].laneMask);
    }
  }
  _sparkHighway.setChart(events, chart.phrases || []);
}

function updateSparkHighway(nowSec, combo) {
  if (!_sparkHighway || !_sparkHighway._ready) return;
  _sparkHighway.update(nowSec, combo);
}

function notifyHighwayHit(evt) {
  if (!_sparkHighway || !evt._screenX) return;
  _sparkHighway.notifyHit(evt._screenX, evt._screenY, getPerformanceEventHitColor(evt));
}

function renderPerformanceHighway(chart, nowSec) {
  var height = 400;
  var h = '<div class="perform-highway" style="height:' + height + 'px;padding:0;border:none;background:transparent;position:relative;overflow:hidden">';
  h += '<canvas id="spark-highway-canvas" style="width:100%;height:100%;display:block"></canvas>';
  h += '<div id="perform-imported-overlay" style="position:absolute;inset:0;pointer-events:none">';
  h += renderImportedTechniqueOverlay(chart, nowSec, 3);
  h += '</div>';
  h += '</div>';
  return h;
}

function renderPerformancePhraseBanner(chart, nowSec) {
  var phrase = getPerformancePhraseForTime(chart, nowSec);
  if (!phrase) return "";
  return '<div class="perform-phrase-banner">' + escHTML(phrase.name) + '</div>';
}

function getPerformanceEventHitColor(evt) {
  if (evt && evt.sourceFlags) {
    if (evt.sourceFlags.tap) return [255, 210, 90];
    if (evt.sourceFlags.open) return [110, 220, 255];
    if (evt.sourceFlags.forced) return [255, 140, 200];
    if (evt.sourceFlags.specialPhrase) return [140, 255, 140];
  }
  return (evt && evt._screenColor) || [100, 255, 100];
}

function getImportedTechniquePreview(chart, nowSec, lookaheadSec) {
  if (!chart || !Array.isArray(chart.events)) return [];
  lookaheadSec = typeof lookaheadSec === "number" ? lookaheadSec : 2.5;
  var previews = [];
  var seen = {};
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (evt.t < nowSec) continue;
    if (evt.t > nowSec + lookaheadSec) break;
    var label = getImportedTechniqueLabel(evt);
    if (!label || seen[label]) continue;
    seen[label] = true;
    previews.push({
      label: label,
      eventId: evt.id,
      color: getImportedTechniqueBadgeColor(evt)
    });
  }
  return previews;
}

function getImportedTechniqueLabel(evt) {
  if (!evt || !evt.sourceFlags) return "";
  if (evt.sourceFlags.tap) return "Tap";
  if (evt.sourceFlags.open) return "Open";
  if (evt.sourceFlags.forced) return "Forced";
  if (evt.sourceFlags.specialPhrase) return "Phrase";
  return "";
}

function getImportedTechniqueBadgeColor(evt) {
  if (!evt || !evt.sourceFlags) return "#64748b";
  if (evt.sourceFlags.tap) return "#f59e0b";
  if (evt.sourceFlags.open) return "#38bdf8";
  if (evt.sourceFlags.forced) return "#f472b6";
  if (evt.sourceFlags.specialPhrase) return "#34d399";
  return "#64748b";
}

function renderImportedTechniqueOverlay(chart, nowSec, lookaheadSec) {
  if (!chart || !Array.isArray(chart.events)) return "";
  lookaheadSec = typeof lookaheadSec === "number" ? lookaheadSec : 3;
  var preview = [];
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (evt.t < nowSec) continue;
    if (evt.t > nowSec + lookaheadSec) break;
    if (!hasImportedTechniqueFlagsForOverlay(evt.sourceFlags)) continue;
    preview.push(evt);
  }
  var h = "";
  if (preview.length > 6) {
    var groups = {};
    var groupOrder = [];
    for (var gi = 0; gi < preview.length; gi++) {
      var gEvt = preview[gi];
      var gLabel = gEvt.sourceLabel || getImportedTechniqueLabel(gEvt) || "Note";
      if (!groups[gLabel]) {
        groups[gLabel] = { label: gLabel, count: 0, evt: gEvt };
        groupOrder.push(gLabel);
      }
      groups[gLabel].count++;
    }
    var summaries = groupOrder.slice(0, 6);
    for (var si = 0; si < summaries.length; si++) {
      var grp = groups[summaries[si]];
      var displayLabel = grp.count > 1 ? grp.label + " x" + grp.count : grp.label;
      h += renderImportedTechniqueToken({ id: grp.label, t: grp.evt.t, dur: grp.evt.dur, laneMask: grp.evt.laneMask, sourceFlags: grp.evt.sourceFlags, laneLabel: displayLabel }, nowSec, lookaheadSec, si);
    }
  } else {
    for (var pi = 0; pi < preview.length; pi++) {
      h += renderImportedTechniqueToken(preview[pi], nowSec, lookaheadSec, pi);
    }
  }
  return h;
}

function renderImportedTechniqueToken(evt, nowSec, lookaheadSec, index) {
  var progress = (evt.t - nowSec) / lookaheadSec;
  progress = Math.max(0, Math.min(1, progress));
  var top = Math.round(20 + progress * 250);
  var left = getImportedTechniqueTokenLeft(evt, index);
  var color = getImportedTechniqueBadgeColor(evt);
  var label = getImportedTechniqueLabel(evt);
  var laneText = getImportedTechniqueLaneText(evt);
  return '<div data-imported-token="' + escapePerformanceHtml(String(evt.id || index)) + '" style="position:absolute;left:' + left + ';top:' + top + 'px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:rgba(15,23,42,.78);border:1px solid ' + color + ';border-radius:999px;padding:4px 8px;box-shadow:0 6px 18px rgba(0,0,0,.22)">' +
    '<span style="width:10px;height:10px;border-radius:999px;background:' + color + ';display:inline-block"></span>' +
    '<span style="font-size:10px;font-weight:900;color:#fff;letter-spacing:.04em;text-transform:uppercase">' + escapePerformanceHtml(label) + '</span>' +
    (laneText ? '<span style="font-size:10px;color:#cbd5e1;font-weight:700">' + escapePerformanceHtml(laneText) + '</span>' : '') +
    '</div>';
}

function getImportedTechniqueTokenLeft(evt, index) {
  if (evt && typeof evt.laneMask === "number" && evt.laneMask > 0) {
    var laneIndex = getPrimaryLaneIndex(evt.laneMask);
    return (18 + laneIndex * 16) + '%';
  }
  return (50 + ((index % 3) - 1) * 18) + '%';
}

function getPrimaryLaneIndex(laneMask) {
  for (var i = 0; i < 31; i++) {
    if (laneMask & (1 << i)) return i;
  }
  return 2;
}

function getImportedTechniqueLaneText(evt) {
  if (!evt) return "";
  if (evt.sourceFlags && evt.sourceFlags.open) return "Open";
  if (typeof evt.laneLabel === "string" && evt.laneLabel) return evt.laneLabel;
  return "";
}

function hasImportedTechniqueFlagsForOverlay(flags) {
  return !!(flags && (flags.open || flags.tap || flags.forced || flags.specialPhrase));
}

function escapePerformanceHtml(value) {
  if (typeof escHTML === "function") return escHTML(value);
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
