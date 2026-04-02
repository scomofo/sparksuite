/* PianoSpark - Tools tab (stats, settings, guide) */

function toolsTab() {
  var html = '';
  var subtabs = [
    { id:"stats",    label:"Stats" },
    { id:"settings", label:"Settings" },
    { id:"clips",    label:"Clips" },
    { id:"guide",    label:"Guide" }
  ];

  if (!S._toolTab) S._toolTab = "stats";
  html += '<div class="level-tabs">';
  subtabs.forEach(function(t) {
    var active = S._toolTab === t.id ? " active" : "";
    html += '<div class="level-tab' + active + '" style="color:var(--accent)" onclick="S._toolTab=\'' + t.id + '\';render()">' + t.label + '</div>';
  });
  html += '</div>';

  switch (S._toolTab) {
    case "stats":    html += statsTab(); break;
    case "settings": html += settingsTab(); break;
    case "clips":    html += clipsTab(); break;
    case "guide":    html += guideTab(); break;
  }
  return html;
}

// ── Stats ──
function statsTab() {
  var html = '<div class="card"><h2>Statistics</h2>';

  // Overview
  html += '<div class="stats-grid">';
  html += '<div class="stat-item"><div class="stat-val">' + S.xp + '</div><div class="stat-label">XP</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + S.streak + '</div><div class="stat-label">Streak</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + S.completedSessions.length + '</div><div class="stat-label">Sessions</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + S.level + '/8</div><div class="stat-label">Level</div></div>';
  html += '</div>';

  // Personal bests (stickiness #6 - never compare to others)
  html += '<h3>Personal Bests</h3>';
  html += '<div class="stats-grid">';
  html += '<div class="stat-item"><div class="stat-val">' + (S.personalBests.bpm || '-') + '</div><div class="stat-label">Best BPM</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + (S.personalBests.streak || '-') + '</div><div class="stat-label">Best Streak</div></div>';
  html += '</div>';

  // Finger exercise stats
  if (S.fingerExercisesDone > 0) {
    html += '<h3>Finger Training</h3>';
    html += '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">';
    html += '<div class="stat-item"><div class="stat-val">' + S.fingerExercisesDone + '</div><div class="stat-label">Exercises</div></div>';
    html += '<div class="stat-item"><div class="stat-val">' + S.fingerDaysLogged + '</div><div class="stat-label">Days</div></div>';
    var chordBest = S.fingerStats._chordChangeBest || 0;
    html += '<div class="stat-item"><div class="stat-val">' + (chordBest || '-') + '</div><div class="stat-label">Best 60s</div></div>';
    html += '</div>';
  }

  // Chord mastery
  html += '<h3>Chord Mastery</h3><div class="mastery-list">';
  var unlocked = chordsUpToLevel(S.level);
  unlocked.forEach(function(c) {
    var prog = S.chordProg[c.short] || 0;
    html += '<div class="mastery-row">';
    html += '<span class="mastery-name" style="color:' + (c.color || '#888') + '">' + escHTML(c.short) + '</span>';
    html += tierBadgeHTML(prog);
    html += '<div class="mastery-bar"><div class="mastery-fill" style="width:' + prog + '%"></div></div>';
    html += '<span class="mastery-pct">' + prog + '%</span>';
    html += '</div>';
  });
  html += '</div>';

  // Practice calendar
  html += '<h3>Practice Calendar</h3><div class="calendar-grid">';
  for (var i = 29; i >= 0; i--) {
    var d = new Date(Date.now() - i * 86400000);
    var ds = d.toDateString();
    var practiced = S.history.some(function(h) { return new Date(h.ts).toDateString() === ds; });
    html += '<div class="cal-day ' + (practiced ? 'cal-active' : '') + '" title="' + ds + '"></div>';
  }
  html += '</div>';

  // Recent history
  html += '<h3>Recent Activity</h3><div class="history-list">';
  var recent = S.history.slice(-10).reverse();
  recent.forEach(function(h) {
    var d = new Date(h.ts);
    var time = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    html += '<div class="history-row"><span>' + h.type + (h.chord ? ": " + h.chord : "") + (h.session ? " (S" + h.session + ")" : "") + '</span><span class="text-muted">' + time + '</span></div>';
  });
  if (!recent.length) html += '<div class="text-muted">No activity yet</div>';
  html += '</div>';

  // Badges
  html += '<h3>Badges</h3><div class="badges-grid">';
  BADGES.forEach(function(b) {
    var earned = S.earned.indexOf(b.id) >= 0;
    html += '<div class="badge-card ' + (earned ? 'earned' : 'locked') + '">';
    html += '<span class="badge-icon">' + b.icon + '</span>';
    html += '<span class="badge-label">' + b.label + '</span>';
    html += '<span class="badge-desc text-muted">' + b.desc + '</span>';
    html += '</div>';
  });
  html += '</div>';

  html += '</div>';
  return html;
}

// ── Settings ──
function settingsTab() {
  var html = '<div class="card"><h2>Settings</h2>';

  html += '<div class="setting-row"><label>Daily Goal: ' + S.dailyGoal + ' min</label>';
  html += '<input type="range" min="5" max="60" step="5" value="' + S.dailyGoal + '" onchange="act(\'set_goal\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Volume: ' + Math.round(S.volume * 100) + '%</label>';
  html += '<input type="range" min="0" max="100" value="' + Math.round(S.volume * 100) + '" onchange="act(\'set_volume\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Tone:</label>';
  html += '<select onchange="act(\'set_tone\', this.value)">';
  ["grand","bright","warm","electric"].forEach(function(t) {
    html += '<option value="' + t + '" ' + (S.tone === t ? "selected" : "") + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
  });
  html += '</select></div>';

  html += '<div class="setting-row"><label>Keyboard:</label>';
  html += '<select onchange="act(\'set_keyboard\', this.value)">';
  KEYBOARD_SIZES.forEach(function(ks) {
    html += '<option value="' + ks.keys + '" ' + (S.keyboardSize === ks.keys ? "selected" : "") + '>' + ks.label + '</option>';
  });
  html += '</select></div>';

  html += '<div class="setting-row"><label>Focus Mode:</label>';
  html += '<button class="btn btn-sm ' + (S.focusMode ? 'btn-accent' : 'btn-secondary') + '" onclick="act(\'toggle_focus\')">' + (S.focusMode ? 'ON' : 'OFF') + '</button></div>';

  html += '<div class="setting-row"><label>Practice Intention:</label></div>';
  html += '<input class="intention-input" type="text" placeholder="When I [event], I will open PianoSpark" value="' + escHTML(S.practiceIntention) + '" onchange="act(\'set_intention\',this.value)" style="width:100%" />';

  // ── MIDI ──
  html += '<h3 style="margin-top:20px">MIDI Input</h3>';
  if (!navigator.requestMIDIAccess) {
    html += '<div class="text-muted">Web MIDI API not supported in this browser.</div>';
  } else {
    var midiBtn = S.midiEnabled ? 'btn-accent' : 'btn-secondary';
    var midiLabel = S.midiEnabled ? 'MIDI On' : 'MIDI Off';
    html += '<div class="setting-row"><label>MIDI keyboard:</label>';
    html += '<button class="btn btn-sm ' + midiBtn + '" onclick="act(\'toggle_midi\')">' + midiLabel + '</button></div>';
    if (S.midiEnabled) {
      var deviceNames = getMidiInputNames();
      html += '<div class="text-muted" style="font-size:0.85em;margin-bottom:8px">';
      html += deviceNames.length ? 'Connected: ' + escHTML(deviceNames.join(', ')) : 'No MIDI devices detected';
      html += '</div>';
      html += '<div class="text-muted" style="font-size:0.82em">Play notes on your MIDI keyboard — chord detection uses exact note data instead of the microphone.</div>';
    }
  }

  // ── Audio ──
  html += '<h3 style="margin-top:20px">Audio</h3>';

  html += '<div class="setting-row"><label>Reverb: ' + Math.round((S.reverbAmount || 0) * 100) + '%</label>';
  html += '<input type="range" min="0" max="100" value="' + Math.round((S.reverbAmount || 0) * 100) + '" oninput="act(\'set_reverb\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Metronome sound:</label>';
  html += '<select onchange="act(\'set_metronome_sound\', this.value)">';
  [["sine","Click"],["woodblock","Woodblock"],["clap","Clap"],["hihat","Hi-Hat"]].forEach(function(o) {
    html += '<option value="' + o[0] + '" ' + (S.metronomeSound === o[0] ? "selected" : "") + '>' + o[1] + '</option>';
  });
  html += '</select></div>';

  html += '<div class="setting-row"><label>A4 tuning: ' + (S.a4Tuning || 440) + ' Hz</label>';
  html += '<input type="range" min="432" max="446" step="1" value="' + (S.a4Tuning || 440) + '" oninput="act(\'set_a4_tuning\', this.value)"/></div>';

  html += '<div class="setting-row"><label>Chord detection:</label>';
  html += '<select onchange="act(\'set_pitch_detection\', this.value)">';
  [["fft","FFT (polyphonic)"],["yin","YIN (more accurate)"]].forEach(function(o) {
    html += '<option value="' + o[0] + '" ' + (S.pitchDetectionMode === o[0] ? "selected" : "") + '>' + o[1] + '</option>';
  });
  html += '</select></div>';

  // Export / Import / Reset
  html += '<h3 style="margin-top:20px">Data</h3>';
  html += '<div class="setting-row">';
  html += '<button class="btn" onclick="exportState()" style="background:#F59E0B;color:#fff">Export JSON</button>';
  html += '</div>';
  html += '<div class="setting-row">';
  html += '<button class="btn btn-danger" onclick="if(confirm(\'Reset all progress?\'))act(\'reset\')">Reset Progress</button>';
  if (S._undoBackup) {
    html += '<button class="btn" onclick="act(\'undo_reset\')">Undo Reset</button>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

// ── Clips ──
function clipsTab() {
  var html = '<div class="card"><h2>Practice Clips</h2>';

  // Record button
  var recActive = isRecording();
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
  html += '<button class="btn ' + (recActive ? 'btn-danger' : 'btn-accent') + '" onclick="act(\'toggle_record\')" style="min-width:120px">';
  html += (recActive ? '\u23F9 Stop Recording' : '\u23FA Record') + '</button>';
  if (recActive) {
    html += '<span class="text-muted" style="font-size:0.85em;animation:pulse 1s infinite">Recording\u2026 (max 30s)</span>';
  } else {
    html += '<span class="text-muted" style="font-size:0.85em">Captures everything you play through PianoSpark</span>';
  }
  html += '</div>';

  var clips = S.practiceClips || [];
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

// ── Guide ──
function guideTab() {
  var html = '<div class="card"><h2>Learning Guide</h2>';

  var lessons = [
    { title:"Getting Started", content:
      '<p>Welcome to PianoSpark! Start your guided sessions from the <strong>Practice</strong> tab.</p>' +
      '<p>Each session follows 5 steps:</p>' +
      '<ul><li><strong>Spark</strong> \u2014 Listen and get inspired</li>' +
      '<li><strong>Review</strong> \u2014 Revisit older chords</li>' +
      '<li><strong>New Move</strong> \u2014 Learn something new (Watch \u2192 Shadow \u2192 Try \u2192 Refine)</li>' +
      '<li><strong>Song Slice</strong> \u2014 Play along with a real song</li>' +
      '<li><strong>Victory Lap</strong> \u2014 Celebrate what you learned</li></ul>' },
    { title:"Finger Numbers", content:
      '<ul><li><strong>1</strong> = Thumb</li><li><strong>2</strong> = Index</li><li><strong>3</strong> = Middle</li><li><strong>4</strong> = Ring</li><li><strong>5</strong> = Pinky</li></ul>' +
      '<p>Right hand: thumb on the left. Left hand: thumb on the right.</p>' },
    { title:"Voice Leading", content:
      '<p>Voice leading means moving as few fingers as possible between chords. Shared notes stay put!</p>' +
      '<p>Example: C to Am \u2014 C and E stay, only G moves to A. One finger!</p>' },
    { title:"Left Hand Patterns", content:
      '<p>Your left hand plays bass notes in rhythmic patterns that grow in complexity:</p>' +
      '<ul><li>R1: Whole notes (1 note per bar)</li><li>R2: Half notes (2 per bar)</li><li>R3: Root-Fifth</li><li>R4: Root-Fifth-Octave</li><li>R5: Alberti Bass</li><li>R6: Syncopated</li><li>R7: Walking Bass</li></ul>' },
    { title:"Keyboard Shortcuts", content:
      '<ul><li><strong>Space</strong> \u2013 Pause / Resume</li>' +
      '<li><strong>\u2190 / \u2192</strong> \u2013 BPM -5 / +5</li>' +
      '<li><strong>M</strong> \u2013 Toggle metronome</li>' +
      '<li><strong>D</strong> \u2013 Toggle dark mode</li>' +
      '<li><strong>1\u20134</strong> \u2013 Switch tabs</li></ul>' }
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
