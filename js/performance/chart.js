/* ===== ChordSpark Performance: Chart Loader ===== */

function loadPerformanceChart(chartId) {
  return fetch("data/performance_charts/" + chartId + ".json")
    .then(function(r) {
      if (!r.ok) throw new Error("Chart not found: " + chartId);
      return r.json();
    })
    .then(function(chart) {
      return normalizePerformanceChart(chart);
    });
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
