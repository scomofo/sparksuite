/* PianoSpark - Shared page components */

function pianoSharedRead(path, fallback) {
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(path, fallback);
  }
  var root = null;
  if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
    var sparkRoot = SparkState.getRoot();
    if (sparkRoot) root = sparkRoot;
  }
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  if (!root) return fallback;
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  for (i = 0; i < parts.length; i++) {
    if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function resolvePianoSharedActiveInstrument() {
  if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
    return null;
  }
  var instrument = SparkInstruments.getActive();
  if (!instrument) return null;
  if (instrument.getData || instrument.ui || instrument.pages || instrument.tabs || instrument.tabRenderers) {
    return instrument;
  }
  var instrumentId = instrument.id || instrument.appId || null;
  if (!instrumentId || typeof SparkInstruments.getAll !== "function") return instrument;
  var instruments = SparkInstruments.getAll() || [];
  for (var i = 0; i < instruments.length; i++) {
    if (!instruments[i]) continue;
    if (instruments[i].id === instrumentId || instruments[i].appId === instrumentId) return instruments[i];
  }
  return instrument;
}

// Performance helpers
function getPerformanceBest(songId, arrangementType, difficulty) {
  var key = (songId || "") + "_" + (arrangementType || "chords") + "_" + (difficulty || "normal");
  var performanceStats = pianoSharedRead("performanceStats", {}) || {};
  var stats = performanceStats[key];
  if (!stats) return { bestScore: 0, bestAccuracy: 0, bestStars: 0, runs: 0 };
  return stats;
}

function getPerformanceMasteryLabel(best) {
  if (!best || !best.runs) return "New";
  if (best.bestStars >= 5) return "Mastered";
  if (best.bestStars >= 3) return "Proficient";
  if (best.bestAccuracy >= 70) return "Developing";
  return "Beginner";
}

// Header
function pianoHeaderHTML() {
  var html = '<header class="app-header" role="banner">';
  html += '<h1 class="logo">PianoSpark</h1>';
  html += '<div class="header-actions">';
  html += '<span class="xp-badge" aria-label="XP" aria-live="polite">' + (pianoSharedRead("xp", 0) || 0) + ' XP</span>';
  if (pianoSharedRead("onboardingComplete", false)) {
    html += '<span class="session-badge">S' + (pianoSharedRead("currentSession", 0) || 0) + '/50</span>';
  }
  html += '<span class="streak-badge" aria-label="Streak" aria-live="polite">' + ((pianoSharedRead("streak", 0) || 0) > 0 ? "\u{1F525}" + (pianoSharedRead("streak", 0) || 0) : "") + '</span>';
  html += '<button class="icon-btn" onclick="act(\'toggle_dark\')" title="Toggle dark mode" aria-label="Toggle dark mode">' + (pianoSharedRead("darkMode", false) ? "\u2600" : "\u{1F319}") + '</button>';
  html += '</div></header>';
  return html;
}

// Tab navigation (4 tabs)
function pianoTabNavHTML() {
  var tabs = [
    { id: "practice", label: "Practice", icon: "\u{1F3B9}" },
    { id: "games", label: "Games", icon: "\u26A1" },
    { id: "songs", label: "Songs", icon: "\u{1F3B6}" },
    { id: "tools", label: "Tools", icon: "\u{1F527}" }
  ];

  var activeTab = pianoSharedRead("tab", null);
  var html = '<nav class="tab-nav" role="tablist">';
  tabs.forEach(function(t) {
    var active = activeTab === t.id ? "active" : "";
    html += '<button class="tab-btn ' + active + '" role="tab" aria-selected="' + (activeTab === t.id ? "true" : "false") + '" onclick="act(\'tab\',\'' + t.id + '\')">' + t.icon + ' ' + t.label + '</button>';
  });
  html += '</nav>';
  return html;
}

// Toast
var toastTimeout = null;
function showToast(msg) {
  var el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "alert");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function() { el.classList.remove("show"); }, 3000);
}

// Back button
function backBtnHTML(action) {
  return '<button class="btn btn-secondary btn-sm" onclick="act(\'' + action + '\')">\u2190 Back</button>';
}

// Level color helper
function levelColor(lvl) {
  var activeInstrument = resolvePianoSharedActiveInstrument();
  var D = activeInstrument && activeInstrument.getData ? activeInstrument.getData() : {};
  return (D.LC && D.LC[lvl]) ? D.LC[lvl] : "#7c3aed";
}

// Chord type color tag
function chordTypeTag(chord) {
  if (!chord) return "";
  var activeInstrument = resolvePianoSharedActiveInstrument();
  var D = activeInstrument && activeInstrument.getData ? activeInstrument.getData() : {};
  var color = chord.color || (D.CHORD_COLORS && D.CHORD_COLORS[chord.type]) || "#888";
  return '<span class="song-chord-tag" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44">' + escHTML(chord.short) + '</span>';
}

window.pianoHeaderHTML = pianoHeaderHTML;
window.pianoTabNavHTML = pianoTabNavHTML;
