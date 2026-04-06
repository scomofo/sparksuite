/* ===== ChordSpark Performance: Highway Renderer (Canvas) ===== */

var _sparkHighway = null;

function ensureSparkHighway(canvasEl) {
  if (_sparkHighway && _sparkHighway.canvas === canvasEl) return _sparkHighway;
  if (_sparkHighway) _sparkHighway.destroy();
  var _inst = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive() : null;
  var _skin = (_inst && _inst.skin) ? _inst.skin : SparkHighway.GUITAR_SKIN;
  _sparkHighway = new SparkHighway(canvasEl, _skin);
  _sparkHighway._initPromise = _sparkHighway.init();
  return _sparkHighway;
}

function destroySparkHighway() {
  if (_sparkHighway) { _sparkHighway.destroy(); _sparkHighway = null; }
}

function feedChartToHighway(chart) {
  if (!_sparkHighway || !chart) return;
  _sparkHighway.setChart(chart.events || [], chart.phrases || []);
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
  for (var i = 0; i < 5; i++) {
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
