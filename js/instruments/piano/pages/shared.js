/* PianoSpark - Shared page components */

// ── Performance helpers ──
function getPerformanceBest(songId, arrangementType, difficulty) {
  var key = (songId || "") + "_" + (arrangementType || "chords") + "_" + (difficulty || "normal");
  var stats = S.performanceStats && S.performanceStats[key];
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

// ── Header ──
function pianoHeaderHTML() {
  var html = '<header class="app-header" role="banner">';
  html += '<h1 class="logo">PianoSpark</h1>';
  html += '<div class="header-actions">';
  html += '<span class="xp-badge" aria-label="XP" aria-live="polite">' + S.xp + ' XP</span>';
  if (S.onboardingComplete) {
    html += '<span class="session-badge">S' + S.currentSession + '/50</span>';
  }
  html += '<span class="streak-badge" aria-label="Streak" aria-live="polite">' + (S.streak > 0 ? "\u{1F525}" + S.streak : "") + '</span>';
  html += '<button class="icon-btn" onclick="act(\'toggle_dark\')" title="Toggle dark mode" aria-label="Toggle dark mode">' + (S.darkMode ? "\u{2600}" : "\u{1F319}") + '</button>';
  html += '</div></header>';
  return html;
}

// ── Tab navigation (4 tabs) ──
function pianoTabNavHTML() {
  // Use string literals — global TAB lacks GAMES/TOOLS keys (guitar-centric)
  var tabs = [
    { id: "practice", label: "Practice", icon: "\u{1F3B9}" },
    { id: "games",    label: "Games",    icon: "\u{26A1}" },
    { id: "songs",    label: "Songs",    icon: "\u{1F3B6}" },
    { id: "tools",    label: "Tools",    icon: "\u{1F527}" }
  ];

  var html = '<nav class="tab-nav" role="tablist">';
  tabs.forEach(function(t) {
    var active = S.tab === t.id ? "active" : "";
    html += '<button class="tab-btn ' + active + '" role="tab" aria-selected="' + (S.tab === t.id ? 'true' : 'false') + '" onclick="act(\'tab\',\'' + t.id + '\')">' + t.icon + ' ' + t.label + '</button>';
  });
  html += '</nav>';
  return html;
}

// ── Toast ──
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

// ── Back button ──
function backBtnHTML(action) {
  return '<button class="btn btn-secondary btn-sm" onclick="act(\'' + action + '\')">\u2190 Back</button>';
}

// ── Level color helper ──
function levelColor(lvl) {
  var D = SparkInstruments.getActive() ? SparkInstruments.getActive().getData() : {};
  return (D.LC && D.LC[lvl]) ? D.LC[lvl] : "#7c3aed";
}

// ── Chord type color tag ──
function chordTypeTag(chord) {
  if (!chord) return "";
  var D = SparkInstruments.getActive() ? SparkInstruments.getActive().getData() : {};
  var color = chord.color || (D.CHORD_COLORS && D.CHORD_COLORS[chord.type]) || "#888";
  return '<span class="song-chord-tag" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44">' + escHTML(chord.short) + '</span>';
}

// ── Direct global exports for ui bag ──
window.pianoHeaderHTML = pianoHeaderHTML;
window.pianoTabNavHTML = pianoTabNavHTML;
