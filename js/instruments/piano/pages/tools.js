/* PianoSpark - Tools tab (stats, settings, guide) */

function pianoToolRead(path, fallback) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(path, fallback);
  }
  if (!cursor) return fallback;
  for (i = 0; i < parts.length; i++) {
    if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function pianoToolWrite(path, value) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
    return SparkState.write(path, value);
  }
  if (!cursor || !parts.length) return value;
  for (i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  return value;
}

function setPianoToolTab(tabId) {
  pianoToolWrite("_toolTab", tabId || "stats");
  render();
}

function normalizePianoToolVolume(value, fallback) {
  var resolvedFallback = typeof fallback === "number" ? fallback : 0.8;
  var numeric = Number(value);
  if (!isFinite(numeric)) return resolvedFallback;
  if (numeric > 1 && numeric <= 100) return numeric / 100;
  return Math.max(0, Math.min(1, numeric));
}

function pianoToolsTab() {
  var html = '';
  var subtabs = [
    { id: "stats", label: "Stats" },
    { id: "settings", label: "Settings" },
    { id: "clips", label: "Clips" },
    { id: "guide", label: "Guide" }
  ];
  var activeToolTab = pianoToolRead("_toolTab", "stats") || "stats";

  html += '<div class="level-tabs">';
  subtabs.forEach(function(t) {
    var active = activeToolTab === t.id ? " active" : "";
    html += '<div class="level-tab' + active + '" style="color:var(--accent)" onclick="act(\'pianoToolTab\',\'' + t.id + '\')">' + t.label + '</div>';
  });
  html += '</div>';

  switch (activeToolTab) {
    case "stats": html += statsTab(); break;
    case "settings": html += settingsTab(); break;
    case "clips": html += clipsTab(); break;
    case "guide": html += pianoGuideTab(); break;
  }
  return html;
}

function statsTab() {
  var html = '<div class="card"><h2>Statistics</h2>';
  var xp = pianoToolRead("xp", 0);
  var streak = pianoToolRead("streak", 0);
  var completedSessions = Array.isArray(pianoToolRead("completedSessions", [])) ? pianoToolRead("completedSessions", []) : [];
  var level = pianoToolRead("level", 1);
  var personalBests = pianoToolRead("personalBests", {}) || {};
  var fingerExercisesDone = pianoToolRead("fingerExercisesDone", 0);
  var fingerDaysLogged = pianoToolRead("fingerDaysLogged", 0);
  var fingerStats = pianoToolRead("fingerStats", {}) || {};
  var chordProg = pianoToolRead("chordProg", {}) || {};
  var history = Array.isArray(pianoToolRead("history", [])) ? pianoToolRead("history", []) : [];
  var earned = Array.isArray(pianoToolRead("earned", [])) ? pianoToolRead("earned", []) : [];

  html += '<div class="stats-grid">';
  html += '<div class="stat-item"><div class="stat-val">' + xp + '</div><div class="stat-label">XP</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + streak + '</div><div class="stat-label">Streak</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + completedSessions.length + '</div><div class="stat-label">Sessions</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + level + '/8</div><div class="stat-label">Level</div></div>';
  html += '</div>';

  html += '<h3>Personal Bests</h3>';
  html += '<div class="stats-grid">';
  html += '<div class="stat-item"><div class="stat-val">' + (personalBests.bpm || '-') + '</div><div class="stat-label">Best BPM</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + (personalBests.streak || '-') + '</div><div class="stat-label">Best Streak</div></div>';
  html += '</div>';

  if (fingerExercisesDone > 0) {
    html += '<h3>Finger Training</h3>';
    html += '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">';
    html += '<div class="stat-item"><div class="stat-val">' + fingerExercisesDone + '</div><div class="stat-label">Exercises</div></div>';
    html += '<div class="stat-item"><div class="stat-val">' + fingerDaysLogged + '</div><div class="stat-label">Days</div></div>';
    var chordBest = fingerStats._chordChangeBest || 0;
    html += '<div class="stat-item"><div class="stat-val">' + (chordBest || '-') + '</div><div class="stat-label">Best 60s</div></div>';
    html += '</div>';
  }

  html += '<h3>Chord Mastery</h3><div class="mastery-list">';
  var unlocked = chordsUpToLevel(level);
  unlocked.forEach(function(c) {
    var prog = chordProg[c.short] || 0;
    html += '<div class="mastery-row">';
    html += '<span class="mastery-name" style="color:' + (c.color || '#888') + '">' + escHTML(c.short) + '</span>';
    html += pianoTierBadgeHTML(prog);
    html += '<div class="mastery-bar"><div class="mastery-fill" style="width:' + prog + '%"></div></div>';
    html += '<span class="mastery-pct">' + prog + '%</span>';
    html += '</div>';
  });
  html += '</div>';

  html += '<h3>Practice Calendar</h3><div class="calendar-grid">';
  for (var i = 29; i >= 0; i--) {
    var d = new Date(Date.now() - i * 86400000);
    var ds = d.toDateString();
    var practiced = history.some(function(h) { return new Date(h.ts).toDateString() === ds; });
    html += '<div class="cal-day ' + (practiced ? 'cal-active' : '') + '" title="' + ds + '"></div>';
  }
  html += '</div>';

  html += '<h3>Recent Activity</h3><div class="history-list">';
  var recent = history.slice(-10).reverse();
  recent.forEach(function(h) {
    var d = new Date(h.ts || h.timestamp);
    var time = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    html += '<div class="history-row"><span>' + h.type + (h.chord ? ": " + h.chord : "") + (h.session ? " (S" + h.session + ")" : "") + '</span><span class="text-muted">' + time + '</span></div>';
  });
  if (!recent.length) html += '<div class="text-muted">No activity yet</div>';
  html += '</div>';

  var D = SparkInstruments.getActive() ? SparkInstruments.getActive().getData() : {};
  var BADGES = D.BADGES || [];
  html += '<h3>Badges</h3><div class="badges-grid">';
  BADGES.forEach(function(b) {
    var isEarned = earned.indexOf(b.id) >= 0;
    html += '<div class="badge-card ' + (isEarned ? 'earned' : 'locked') + '">';
    html += '<span class="badge-icon">' + b.icon + '</span>';
    html += '<span class="badge-label">' + b.label + '</span>';
    html += '<span class="badge-desc text-muted">' + b.desc + '</span>';
    html += '</div>';
  });
  html += '</div>';

  html += '</div>';
  return html;
}

function settingsTab() {
  var html = '<div class="card"><h2>Settings</h2>';
  var dailyGoal = pianoToolRead("dailyGoal", 15);
  var volume = normalizePianoToolVolume(pianoToolRead("volume", 0.8), 0.8);
  var tone = pianoToolRead("tone", "grand");
  var keyboardSize = pianoToolRead("keyboardSize", 61);
  var focusMode = !!pianoToolRead("focusMode", false);
  var practiceIntention = pianoToolRead("practiceIntention", "") || "";
  var midiEnabled = !!pianoToolRead("midiEnabled", false);
  var reverbAmount = pianoToolRead("reverbAmount", 0) || 0;
  var metronomeSound = pianoToolRead("metronomeSound", "sine") || "sine";
  var a4Tuning = pianoToolRead("a4Tuning", 440) || 440;
  var pitchDetectionMode = pianoToolRead("pitchDetectionMode", "fft") || "fft";
  var undoBackup = pianoToolRead("_undoBackup", null);

  html += '<div class="setting-row"><label>Daily Goal: ' + dailyGoal + ' min</label>';
  html += '<input type="range" min="5" max="60" step="5" value="' + dailyGoal + '" onchange="act(\'set_goal\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Volume: ' + Math.round(volume * 100) + '%</label>';
  html += '<input type="range" min="0" max="100" value="' + Math.round(volume * 100) + '" onchange="act(\'set_volume\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Tone:</label>';
  html += '<select onchange="act(\'set_tone\', this.value)">';
  ["grand", "bright", "warm", "electric"].forEach(function(t) {
    html += '<option value="' + t + '" ' + (tone === t ? "selected" : "") + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
  });
  html += '</select></div>';

  html += '<div class="setting-row"><label>Keyboard:</label>';
  html += '<select onchange="act(\'set_keyboard\', this.value)">';
  KEYBOARD_SIZES.forEach(function(ks) {
    html += '<option value="' + ks.keys + '" ' + (keyboardSize === ks.keys ? "selected" : "") + '>' + ks.label + '</option>';
  });
  html += '</select></div>';

  html += '<div class="setting-row"><label>Focus Mode:</label>';
  html += '<button class="btn btn-sm ' + (focusMode ? 'btn-accent' : 'btn-secondary') + '" onclick="act(\'toggle_focus\')">' + (focusMode ? 'ON' : 'OFF') + '</button></div>';

  html += '<div class="setting-row"><label>Practice Intention:</label></div>';
  html += '<input class="intention-input" type="text" placeholder="When I [event], I will open PianoSpark" value="' + escHTML(practiceIntention) + '" onchange="act(\'set_intention\',this.value)" style="width:100%" />';

  html += '<h3 style="margin-top:20px">MIDI Input</h3>';
  if (!navigator.requestMIDIAccess) {
    html += '<div class="text-muted">Web MIDI API not supported in this browser.</div>';
  } else {
    var midiBtn = midiEnabled ? 'btn-accent' : 'btn-secondary';
    var midiLabel = midiEnabled ? 'MIDI On' : 'MIDI Off';
    html += '<div class="setting-row"><label>MIDI keyboard:</label>';
    html += '<button class="btn btn-sm ' + midiBtn + '" onclick="act(\'toggle_midi\')">' + midiLabel + '</button></div>';
    if (midiEnabled) {
      var deviceNames = getMidiInputNames();
      html += '<div class="text-muted" style="font-size:0.85em;margin-bottom:8px">';
      html += deviceNames.length ? 'Connected: ' + escHTML(deviceNames.join(', ')) : 'No MIDI devices detected';
      html += '</div>';
      html += '<div class="text-muted" style="font-size:0.82em">Play notes on your MIDI keyboard - chord detection uses exact note data instead of the microphone.</div>';
    }
  }

  html += '<h3 style="margin-top:20px">Audio</h3>';

  html += '<div class="setting-row"><label>Reverb: ' + Math.round(reverbAmount * 100) + '%</label>';
  html += '<input type="range" min="0" max="100" value="' + Math.round(reverbAmount * 100) + '" oninput="act(\'set_reverb\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Metronome sound:</label>';
  html += '<select onchange="act(\'set_metronome_sound\', this.value)">';
  [["sine", "Click"], ["woodblock", "Woodblock"], ["clap", "Clap"], ["hihat", "Hi-Hat"]].forEach(function(o) {
    html += '<option value="' + o[0] + '" ' + (metronomeSound === o[0] ? "selected" : "") + '>' + o[1] + '</option>';
  });
  html += '</select></div>';

  html += '<div class="setting-row"><label>A4 tuning: ' + a4Tuning + ' Hz</label>';
  html += '<input type="range" min="432" max="446" step="1" value="' + a4Tuning + '" oninput="act(\'set_a4_tuning\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Chord detection:</label>';
  html += '<select onchange="act(\'set_pitch_detection\', this.value)">';
  [["fft", "FFT (polyphonic)"], ["yin", "YIN (more accurate)"]].forEach(function(o) {
    html += '<option value="' + o[0] + '" ' + (pitchDetectionMode === o[0] ? "selected" : "") + '>' + o[1] + '</option>';
  });
  html += '</select></div>';

  html += '<h3 style="margin-top:20px">Data</h3>';
  html += '<div class="setting-row">';
  html += '<button class="btn" onclick="act(\'exportProgress\')" style="background:#F59E0B;color:#fff">Export JSON</button>';
  html += '</div>';
  html += '<div class="setting-row">';
  html += '<button class="btn btn-danger" onclick="act(\'reset_confirm\')">Reset Progress</button>';
  if (undoBackup) {
    html += '<button class="btn" onclick="act(\'undo_reset\')">Undo Reset</button>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function clipsTab() {
  var html = '<div class="card"><h2>Practice Clips</h2>';

  var recActive = isRecording();
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
  html += '<button class="btn ' + (recActive ? 'btn-danger' : 'btn-accent') + '" onclick="act(\'toggle_record\')" style="min-width:120px">';
  html += (recActive ? '\u23F9 Stop Recording' : '\u23FA Record') + '</button>';
  if (recActive) {
    html += '<span class="text-muted" style="font-size:0.85em;animation:pulse 1s infinite">Recording... (max 30s)</span>';
  } else {
    html += '<span class="text-muted" style="font-size:0.85em">Captures everything you play through PianoSpark</span>';
  }
  html += '</div>';

  var clips = Array.isArray(pianoToolRead("practiceClips", [])) ? pianoToolRead("practiceClips", []) : [];
  if (!clips.length) {
    html += '<div class="text-muted">No clips yet. Hit Record, play some chords, then stop to save a clip.</div>';
  } else {
    html += '<div class="clips-list">';
    clips.slice().reverse().forEach(function(clip, ri) {
      var idx = clips.length - 1 - ri;
      var d = new Date(clip.ts);
      var time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      html += '<div class="clip-row">';
      html += '<div class="clip-info">';
      html += '<span class="clip-time">' + time + '</span>';
      html += '<span class="clip-dur text-muted">' + clip.duration + 's</span>';
      html += '</div>';
      html += '<div class="clip-actions">';
      html += '<button class="btn btn-sm btn-secondary" onclick="act(\'play_clip\',\'' + clip.url + '\')">\u25B6 Play</button>';
      html += '<button class="btn btn-sm btn-danger" onclick="act(\'delete_clip\',\'' + idx + '\')">Delete</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function pianoGuideTab() {
  var html = '<div class="card"><h2>Learning Guide</h2>';

  var lessons = [
    { title: "Getting Started", content:
      '<p>Welcome to PianoSpark! Start your guided sessions from the <strong>Practice</strong> tab.</p>' +
      '<p>Each session follows 5 steps:</p>' +
      '<ul><li><strong>Spark</strong> - Listen and get inspired</li>' +
      '<li><strong>Review</strong> - Revisit older chords</li>' +
      '<li><strong>New Move</strong> - Learn something new (Watch -> Shadow -> Try -> Refine)</li>' +
      '<li><strong>Song Slice</strong> - Play along with a real song</li>' +
      '<li><strong>Victory Lap</strong> - Celebrate what you learned</li></ul>' },
    { title: "Finger Numbers", content:
      '<ul><li><strong>1</strong> = Thumb</li><li><strong>2</strong> = Index</li><li><strong>3</strong> = Middle</li><li><strong>4</strong> = Ring</li><li><strong>5</strong> = Pinky</li></ul>' +
      '<p>Right hand: thumb on the left. Left hand: thumb on the right.</p>' },
    { title: "Voice Leading", content:
      '<p>Voice leading means moving as few fingers as possible between chords. Shared notes stay put!</p>' +
      '<p>Example: C to Am - C and E stay, only G moves to A. One finger!</p>' },
    { title: "Left Hand Patterns", content:
      '<p>Your left hand plays bass notes in rhythmic patterns that grow in complexity:</p>' +
      '<ul><li>R1: Whole notes (1 note per bar)</li><li>R2: Half notes (2 per bar)</li><li>R3: Root-Fifth</li><li>R4: Root-Fifth-Octave</li><li>R5: Alberti Bass</li><li>R6: Syncopated</li><li>R7: Walking Bass</li></ul>' },
    { title: "Keyboard Shortcuts", content:
      '<ul><li><strong>Space</strong> - Pause / Resume</li>' +
      '<li><strong>Left / Right</strong> - BPM -5 / +5</li>' +
      '<li><strong>M</strong> - Toggle metronome</li>' +
      '<li><strong>D</strong> - Toggle dark mode</li>' +
      '<li><strong>1-4</strong> - Switch tabs</li></ul>' }
  ];

  lessons.forEach(function(l, i) {
    html += '<details class="guide-lesson" ' + (i === 0 ? "open" : "") + '>';
    html += '<summary>' + l.title + '</summary>';
    html += '<div class="lesson-content">' + l.content + '</div>';
    html += '</details>';
  });

  html += '</div>';
  return html;
}

if (typeof window !== "undefined") {
  window.setPianoToolTab = setPianoToolTab;
}
