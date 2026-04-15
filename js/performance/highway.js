/* ===== ChordSpark Performance: Highway Renderer (Canvas) ===== */

var _sparkHighway = null;
var PERFORMANCE_HIGHWAY_ARCHIVE_ASSETS = {
  guitar: {
    background: "sparkgame/assets/highway/bg_concert.png",
    surface: "sparkgame/assets/highway/guitar_highway_v3.png"
  },
  piano: {
    background: "sparkgame/assets/highway/bg_recital.png",
    surface: "sparkgame/assets/highway/piano_highway_v3.png"
  }
};

function getPerformanceHighwayThemeManifest() {
  if (typeof window !== "undefined" && window.PERFORMANCE_HIGHWAY_THEME_MANIFEST) {
    return window.PERFORMANCE_HIGHWAY_THEME_MANIFEST;
  }
  return PERFORMANCE_HIGHWAY_ARCHIVE_ASSETS;
}

function getPerformanceHighwayStateRoot() {
  if (typeof SparkState !== "undefined" && SparkState && typeof SparkState.getRoot === "function") {
    return SparkState.getRoot();
  }
  if (typeof globalThis !== "undefined" && globalThis.__sparkState) {
    return globalThis.__sparkState;
  }
  if (typeof globalThis !== "undefined" && globalThis.S) {
    return globalThis.S;
  }
  if (typeof window !== "undefined" && window.__sparkState) {
    return window.__sparkState;
  }
  if (typeof window !== "undefined" && window.S) {
    return window.S;
  }
  return null;
}

function getStoredPerformanceHighwayThemeSelection() {
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(["settings", "performanceHighwayThemeSelection"], null);
  }
  var root = getPerformanceHighwayStateRoot();
  if (root && root.settings && root.settings.performanceHighwayThemeSelection) {
    return root.settings.performanceHighwayThemeSelection;
  }
  if (typeof window !== "undefined" && window.PERFORMANCE_HIGHWAY_THEME_SELECTION) {
    return window.PERFORMANCE_HIGHWAY_THEME_SELECTION;
  }
  return null;
}

function setStoredPerformanceHighwayThemeSelection(selection) {
  if (typeof window !== "undefined") window.PERFORMANCE_HIGHWAY_THEME_SELECTION = selection;
  if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
    SparkState.write(["settings", "performanceHighwayThemeSelection"], selection);
  } else {
    var root = getPerformanceHighwayStateRoot();
    if (root) {
      if (!root.settings || typeof root.settings !== "object") root.settings = {};
      root.settings.performanceHighwayThemeSelection = selection;
    }
  }
  return selection;
}

function getAvailablePerformanceHighwayThemes() {
  var manifest = getPerformanceHighwayThemeManifest();
  if (manifest && manifest.themes) return Object.keys(manifest.themes);
  return ["classic"];
}

function getPerformanceHighwayThemeId(chart, instrument) {
  if (chart) {
    if (typeof chart.highwayTheme === "string" && chart.highwayTheme) return chart.highwayTheme;
    if (chart.metadata && typeof chart.metadata.highwayTheme === "string" && chart.metadata.highwayTheme) return chart.metadata.highwayTheme;
  }
  var selection = getStoredPerformanceHighwayThemeSelection();
  if (selection) {
    if (typeof selection === "string" && selection) {
      return selection;
    }
    if (selection[instrument]) {
      return selection[instrument];
    }
  }
  var manifest = getPerformanceHighwayThemeManifest();
  if (manifest && typeof manifest.defaultTheme === "string" && manifest.defaultTheme) return manifest.defaultTheme;
  return "classic";
}

function setPerformanceHighwayThemeSelection(themeId, instrument) {
  themeId = typeof themeId === "string" && themeId ? themeId : "classic";
  instrument = instrument || getPerformanceHighwayInstrument(null);
  var selection = getStoredPerformanceHighwayThemeSelection();
  if (!selection || typeof selection !== "object") selection = {};
  selection[instrument] = themeId;
  return setStoredPerformanceHighwayThemeSelection(selection);
}

installSparkHighwayLanePatch();

function getPerformanceHighwayInstrument(chart) {
  if (chart) {
    if (typeof chart.instrument === "string" && chart.instrument) return chart.instrument;
    if (chart.metadata && typeof chart.metadata.instrument === "string" && chart.metadata.instrument) return chart.metadata.instrument;
  }
  if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
    var active = SparkInstruments.getActive();
    if (active && typeof active.instrument === "string" && active.instrument) return active.instrument;
    if (active && typeof active.id === "string" && active.id) return active.id;
  }
  return "guitar";
}

function getPerformanceHighwaySkin(instrument) {
  if (instrument === "piano" && typeof SparkHighway !== "undefined" && SparkHighway.PIANO_SKIN) {
    return SparkHighway.PIANO_SKIN;
  }
  return typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null;
}

function getPerformanceHighwayAssets(chart) {
  var manifest = getPerformanceHighwayThemeManifest();
  var instrument = getPerformanceHighwayInstrument(chart);
  var themeId = getPerformanceHighwayThemeId(chart, instrument);
  if (manifest && manifest.themes) {
    var themed = manifest.themes[themeId] || manifest.themes[manifest.defaultTheme] || null;
    if (themed && themed[instrument]) return themed[instrument];
    if (themed && themed.guitar) return themed.guitar;
  }
  if (instrument === "piano" && manifest.piano) return manifest.piano;
  return manifest.guitar || PERFORMANCE_HIGHWAY_ARCHIVE_ASSETS.guitar;
}

function ensureSparkHighway(canvasEl, chart) {
  var instrument = getPerformanceHighwayInstrument(chart);
  var desiredSkin = getPerformanceHighwaySkin(instrument);
  if (_sparkHighway && _sparkHighway.canvas === canvasEl && _sparkHighway.skin === desiredSkin) return _sparkHighway;
  if (_sparkHighway) _sparkHighway.destroy();
  _sparkHighway = new SparkHighway(canvasEl, desiredSkin);
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

function ensurePerformanceHighwayLaneData(chart) {
  if (!chart || !Array.isArray(chart.events)) return chart;
  repairPerformanceHighwayEventLanes(
    chart.events,
    chart && chart.metadata && typeof chart.metadata.laneCount === "number" && chart.metadata.laneCount > 0
      ? chart.metadata.laneCount
      : 5
  );
  return chart;
}

function repairPerformanceHighwayEventLanes(events, laneCount) {
  if (!Array.isArray(events)) return events;
  var shouldReassignCollapsed = shouldReassignCollapsedHighwayLanes(events);
  var laneMap = {};
  var nextLane = 0;
  laneCount = typeof laneCount === "number" && laneCount > 0 ? laneCount : 5;

  for (var i = 0; i < events.length; i++) {
    var evt = events[i];
    if (!evt) continue;
    if (shouldReassignCollapsed && !isPerformanceOpenEvent(evt)) {
      var reassignedKey = getPerformanceLaneAssignmentKey(evt);
      if (reassignedKey) {
        if (laneMap[reassignedKey] == null) {
          laneMap[reassignedKey] = nextLane % laneCount;
          nextLane++;
        }
        evt.lane = laneMap[reassignedKey];
        evt.laneMask = 1 << evt.lane;
      } else {
        evt.lane = null;
        evt.laneMask = 0;
      }
    } else if (evt.lane == null) {
      if (typeof evt.laneMask === "number" && evt.laneMask > 0) {
        evt.lane = getPrimaryLaneIndex(evt.laneMask);
      } else if (!isPerformanceOpenEvent(evt)) {
        var key = getPerformanceLaneAssignmentKey(evt);
        if (key) {
          if (laneMap[key] == null) {
            laneMap[key] = nextLane % laneCount;
            nextLane++;
          }
          evt.lane = laneMap[key];
          evt.laneMask = 1 << evt.lane;
        } else {
          evt.lane = null;
          evt.laneMask = 0;
        }
      } else {
        evt.lane = null;
        evt.laneMask = 0;
      }
    } else if (typeof evt.laneMask !== "number") {
      evt.laneMask = evt.lane >= 0 ? (1 << evt.lane) : 0;
    }
  }
  return events;
}

function installSparkHighwayLanePatch() {
  if (typeof SparkHighway === "undefined" || !SparkHighway.prototype) return;
  if (SparkHighway.prototype._performanceLaneRepairPatched) return;
  var originalSetChart = SparkHighway.prototype.setChart;
  if (typeof originalSetChart !== "function") return;
  SparkHighway.prototype.setChart = function(events, phrases) {
    var laneCount = this && this.skin && typeof this.skin.laneCount === "number" && this.skin.laneCount > 0
      ? this.skin.laneCount
      : 5;
    repairPerformanceHighwayEventLanes(events, laneCount);
    return originalSetChart.call(this, events, phrases);
  };
  SparkHighway.prototype._performanceLaneRepairPatched = true;
}

function shouldReassignCollapsedHighwayLanes(events) {
  if (!Array.isArray(events) || events.length < 2) return false;
  var keys = {};
  var assignedLanes = {};
  var keyCount = 0;
  var laneCount = 0;

  for (var i = 0; i < events.length; i++) {
    var evt = events[i];
    if (!evt || isPerformanceOpenEvent(evt)) continue;
    var key = getPerformanceLaneAssignmentKey(evt);
    if (!key) continue;
    if (!Object.prototype.hasOwnProperty.call(keys, key)) {
      keys[key] = true;
      keyCount++;
    }
    var lane = typeof evt.lane === "number" && evt.lane >= 0
      ? evt.lane
      : getPrimaryLaneIndex(evt.laneMask);
    if (lane != null && !Object.prototype.hasOwnProperty.call(assignedLanes, lane)) {
      assignedLanes[lane] = true;
      laneCount++;
    }
  }

  return keyCount > 1 && laneCount <= 1;
}

function isPerformanceOpenEvent(evt) {
  if (!evt) return false;
  if (evt.sourceFlags && evt.sourceFlags.open) return true;
  if (String(evt.type || "").toLowerCase() === "open") return true;
  return typeof evt.laneLabel === "string" && evt.laneLabel.toLowerCase() === "open";
}

function getPerformanceLaneAssignmentKey(evt) {
  if (!evt) return "";
  if (typeof evt.chord === "string" && evt.chord) return evt.chord;
  if (typeof evt.laneLabel === "string" && evt.laneLabel) return evt.laneLabel;
  if (typeof evt.note === "string" && evt.note) return evt.note;
  if (Array.isArray(evt.notes) && evt.notes.length) return evt.notes.join("+");
  return "";
}

function updateSparkHighway(nowSec, combo) {
  if (!_sparkHighway || !_sparkHighway._ready) return;
  _sparkHighway.update(nowSec, combo);
}

function notifyHighwayHit(evt) {
  if (!_sparkHighway || !evt._screenX) return;
  _sparkHighway.notifyHit(evt._screenX, evt._screenY, getPerformanceEventHitColor(evt));
}

function getPerformanceHighwayVfxAssets(assets) {
  return assets && assets.vfx && typeof assets.vfx === "object" ? assets.vfx : null;
}

function getPerformanceHighwayShellOverlayValue(assets, key, fallback) {
  if (!assets || typeof assets[key] !== "number") return fallback;
  return Math.max(0, Math.min(1, assets[key]));
}

function getPerformanceHighwayComboFlameOpacity(combo) {
  combo = typeof combo === "number" ? combo : 0;
  if (combo < 8) return 0;
  if (combo >= 30) return 0.92;
  return Math.max(0.35, Math.min(0.92, 0.35 + ((combo - 8) / 22) * 0.57));
}

function renderPerformanceHighwayVfx(vfxAssets, combo) {
  if (!vfxAssets) return "";
  var h = "";
  var strikelineOpacity = typeof vfxAssets.strikelineOpacity === "number"
    ? Math.max(0, Math.min(1, vfxAssets.strikelineOpacity))
    : 0.8;
  if (vfxAssets.strikeline) {
    h += '<div class="perform-highway-strikeline" data-highway-strikeline="' + escapePerformanceHtml(vfxAssets.strikeline) + '" style="position:absolute;left:50%;bottom:54px;width:78%;height:54px;transform:translateX(-50%);pointer-events:none;background:url(&quot;' + vfxAssets.strikeline + '&quot;) center/contain no-repeat;opacity:' + strikelineOpacity.toFixed(2) + ';mix-blend-mode:screen;z-index:2"></div>';
  }
  var comboFlameOpacity = getPerformanceHighwayComboFlameOpacity(combo);
  if (vfxAssets.comboFlame && comboFlameOpacity > 0) {
    h += '<div class="perform-highway-combo-flame" data-highway-combo-flame="' + escapePerformanceHtml(vfxAssets.comboFlame) + '" style="position:absolute;right:14px;bottom:72px;width:118px;height:118px;pointer-events:none;background:url(&quot;' + vfxAssets.comboFlame + '&quot;) center/contain no-repeat;opacity:' + comboFlameOpacity.toFixed(2) + ';mix-blend-mode:screen;filter:drop-shadow(0 8px 22px rgba(18,122,255,.3));z-index:2"></div>';
  }
  return h;
}

function getPerformanceHitFeedbackColor(grade) {
  switch (grade) {
    case "perfect": return "#00ffcc";
    case "good": return "#66ccff";
    case "ok": return "#ffaa00";
    case "miss": return "#ff4444";
    default: return "#FFE66D";
  }
}

function renderPerformanceHighwayHitFeedback(label, hitSparkAsset, grade) {
  if (!label) return "";
  var color = getPerformanceHitFeedbackColor(grade);
  var h = '<div class="perform-hit-feedback">';
  if (hitSparkAsset) {
    h += '<div class="perform-hit-feedback-spark" data-highway-hit-spark="' + escapePerformanceHtml(hitSparkAsset) + '" style="position:absolute;left:50%;top:50%;width:136px;height:136px;transform:translate(-50%,-50%);pointer-events:none;background:url(&quot;' + hitSparkAsset + '&quot;) center/contain no-repeat;opacity:.82;mix-blend-mode:screen;z-index:-1"></div>';
  }
  h += '<span style="color:' + color + '">' + escapePerformanceHtml(label) + '</span>';
  h += '</div>';
  return h;
}

function renderPerformanceHighway(chart, nowSec, options) {
  options = options || {};
  var assets = getPerformanceHighwayAssets(chart);
  var vfxAssets = getPerformanceHighwayVfxAssets(assets);
  var instrument = getPerformanceHighwayInstrument(chart);
  var combo = typeof options.combo === "number" ? options.combo : 0;
  var hitLabel = typeof options.hitLabel === "string" ? options.hitLabel : "";
  var height = 400;
  var shellOverlayTop = getPerformanceHighwayShellOverlayValue(assets, "shellOverlayTop", 0.68);
  var shellOverlayBottom = getPerformanceHighwayShellOverlayValue(assets, "shellOverlayBottom", 0.9);
  var surfaceOpacity = getPerformanceHighwayShellOverlayValue(assets, "surfaceOpacity", 0.3);
  var shellBackground = 'background:linear-gradient(180deg,rgba(10,16,28,' + shellOverlayTop.toFixed(2) + '),rgba(6,10,18,' + shellOverlayBottom.toFixed(2) + ')),url(&quot;' + assets.background + '&quot;) center/cover no-repeat;';
  var surfaceBackground = 'background:url(&quot;' + assets.surface + '&quot;) center/cover no-repeat;opacity:' + surfaceOpacity.toFixed(2) + ';mix-blend-mode:screen;';
  var h = '<div class="perform-highway" data-highway-instrument="' + escapePerformanceHtml(instrument) + '" style="height:' + height + 'px;padding:0;border:none;position:relative;overflow:hidden;' + shellBackground + '">';
  h += '<div class="perform-highway-surface" data-highway-surface="' + escapePerformanceHtml(assets.surface) + '" style="position:absolute;inset:0;pointer-events:none;' + surfaceBackground + '"></div>';
  h += renderPerformanceHighwayVfx(vfxAssets, combo);
  h += '<canvas id="spark-highway-canvas" style="width:100%;height:100%;display:block;position:relative;z-index:1"></canvas>';
  h += '<div id="perform-imported-overlay" style="position:absolute;inset:0;pointer-events:none">';
  h += renderImportedTechniqueOverlay(chart, nowSec, 3);
  h += '</div>';
  if (hitLabel) {
    h += renderPerformanceHighwayHitFeedback(hitLabel, vfxAssets && vfxAssets.hitSpark, options.hitGrade || "");
  }
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
  var h = "";
  var count = 0;
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (evt.t < nowSec) continue;
    if (evt.t > nowSec + lookaheadSec) break;
    if (!hasImportedTechniqueFlagsForOverlay(evt.sourceFlags)) continue;
    h += renderImportedTechniqueToken(evt, nowSec, lookaheadSec, count++);
    if (count >= 6) break;
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
