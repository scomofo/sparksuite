/* PianoSpark - Shared page components */

// ── Header ──
function headerHTML() {
  var html = '<header class="app-header" role="banner">';
  html += '<h1 class="logo">PianoSpark</h1>';
  html += '<div class="header-actions">';
  html += '<span class="xp-badge" aria-label="XP">' + S.xp + ' XP</span>';
  if (S.onboardingComplete) {
    html += '<span class="session-badge">S' + S.currentSession + '/50</span>';
  }
  html += '<span class="streak-badge" aria-label="Streak">' + (S.streak > 0 ? "\u{1F525}" + S.streak : "") + '</span>';
  html += '<button class="icon-btn" onclick="act(\'toggle_dark\')" title="Toggle dark mode" aria-label="Toggle dark mode">' + (S.darkMode ? "\u{2600}" : "\u{1F319}") + '</button>';
  html += '</div></header>';
  return html;
}

// ── Tab navigation (4 tabs) ──
function tabNavHTML() {
  var tabs = [
    { id: TAB.PRACTICE, label: "Practice", icon: "\u{1F3B9}" },
    { id: TAB.GAMES,    label: "Games",    icon: "\u{26A1}" },
    { id: TAB.SONGS,    label: "Songs",    icon: "\u{1F3B6}" },
    { id: TAB.TOOLS,    label: "Tools",    icon: "\u{1F527}" }
  ];

  var html = '<nav class="tab-nav" role="tablist">';
  tabs.forEach(function(t) {
    var active = S.tab === t.id ? "active" : "";
    html += '<button class="tab-btn ' + active + '" role="tab" aria-selected="' + (S.tab === t.id ? 'true' : 'false') + '" onclick="act(\'tab\',' + t.id + ')">' + t.icon + ' ' + t.label + '</button>';
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
  return LC[lvl] || "#7c3aed";
}

// ── Chord type color tag ──
function chordTypeTag(chord) {
  if (!chord) return "";
  var color = chord.color || CHORD_COLORS[chord.type] || "#888";
  return '<span class="song-chord-tag" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44">' + escHTML(chord.short) + '</span>';
}
