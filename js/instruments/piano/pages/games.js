/* PianoSpark - Games tab (drill, daily, quiz, ear, rhythm, runner) */

function gamesTab() {
  var html = '';
  // Sub-tab selector
  var subtabs = [
    { id:"drill",   label:"Drill",   icon:"\u{26A1}" },
    { id:"fingers", label:"Fingers", icon:"\u{270B}" },
    { id:"daily",   label:"Daily",   icon:"\u{1F3AF}" },
    { id:"quiz",    label:"Quiz",    icon:"\u{2753}" },
    { id:"ear",     label:"Ear",     icon:"\u{1F442}" },
    { id:"rhythm",  label:"Rhythm",  icon:"\u{1F941}" },
    { id:"runner",  label:"Runner",  icon:"\u{1F3C3}" }
  ];

  if (!S._gameTab) S._gameTab = "drill";
  html += '<div class="level-tabs">';
  subtabs.forEach(function(t) {
    var active = S._gameTab === t.id ? " active" : "";
    html += '<div class="level-tab' + active + '" style="color:var(--accent)" onclick="S._gameTab=\'' + t.id + '\';render()">' + t.icon + ' ' + t.label + '</div>';
  });
  html += '</div>';

  switch (S._gameTab) {
    case "drill":   html += drillTab(); break;
    case "fingers": html += fingersTab(); break;
    case "daily":   html += dailyTab(); break;
    case "quiz":    html += quizTab(); break;
    case "ear":     html += earTrainTab(); break;
    case "rhythm":  html += rhythmTab(); break;
    case "runner":  html += runnerTab(); break;
  }
  return html;
}

// ── Drill ──
function drillTab() {
  var html = '<div class="card">';
  if (S.drillActive) {
    var c = S.drillChords[S.drillIdx];
    var chordObj = findChord(c);
    html += '<h2>Drill: ' + escHTML(c) + '</h2>';
    html += '<div class="timer-display">' + formatTime(S.drillTimer) + '</div>';
    html += '<div class="drill-progress">' + (S.drillIdx + 1) + ' / ' + S.drillChords.length + '</div>';
    if (chordObj) html += pianoSVG(chordObj);
    html += '<div class="drill-dots">';
    S.drillChords.forEach(function(dc, i) {
      html += '<span class="drill-dot ' + (i === S.drillIdx ? 'current' : (i < S.drillIdx ? 'done' : '')) + '">' + escHTML(dc) + '</span>';
    });
    html += '</div>';
    html += '<button class="btn" onclick="act(\'drill_next\')">Next \u27A1</button>';
    html += '<button class="btn btn-secondary" onclick="act(\'stop_drill\')">Stop</button>';
    html += '<button class="btn btn-accent" onclick="act(\'play_chord\',\'' + c + '\')">\u{1F50A}</button>';
    // Transition stats
    if (S.drillIdx > 0) {
      var prev = S.drillChords[S.drillIdx - 1];
      var tipKey = prev + "_" + c;
      if (TRANSITION_TIPS[tipKey]) {
        html += '<div class="intention-card" style="margin-top:8px">\u{1F4A1} ' + escHTML(TRANSITION_TIPS[tipKey]) + '</div>';
      }
    }
  } else {
    html += '<h2>Chord Drill</h2>';
    html += '<p>Rapidly switch between chords to build muscle memory.</p>';
    html += '<button class="btn" onclick="act(\'start_drill\',\'level\')">Level ' + S.level + ' Chords</button>';
    html += '<button class="btn" onclick="act(\'start_drill\',\'all\')">All Learned</button>';
    html += '<button class="btn" onclick="act(\'start_drill\',\'random\')">Random Mix</button>';
  }
  html += '</div>';
  return html;
}

// ── Daily ──
function dailyTab() {
  var html = '<div class="card">';
  if (S.dailyActive && S.dailyType) {
    var dt = DAILY_TYPES.find(function(d) { return d.id === S.dailyType; });
    html += '<h2>' + (dt ? dt.name : "Challenge") + '</h2>';
    html += '<div class="timer-display">' + formatTime(S.dailyTimer) + '</div>';
    html += '<div class="daily-score">Score: ' + S.dailyScore + '</div>';
    if (S.dailyType === "blind") {
      html += pianoSVG(findChord(S.chord), { hideKeys: true });
    } else if (S.chord) {
      html += pianoSVG(findChord(S.chord));
    }
    html += '<button class="btn" onclick="act(\'daily_action\')">Next</button>';
    html += '<button class="btn btn-secondary" onclick="act(\'stop_daily\')">Stop</button>';
  } else {
    html += '<h2>Daily Challenges</h2><p>Push yourself with special missions!</p>';
    DAILY_TYPES.forEach(function(dt) {
      html += clickableDiv("act('start_daily','" + dt.id + "')",
        '<strong>' + dt.name + '</strong><br><span class="text-muted">' + dt.desc + '</span>', "daily-card");
    });
    html += '<div class="text-muted">Completed: ' + S.dailiesDone + '</div>';
  }
  html += '</div>';
  return html;
}

// ── Quiz (with delayed feedback - stickiness #5) ──
function quizTab() {
  var html = '<div class="card"><h2>Chord Quiz</h2>';
  if (S.quizQ) {
    html += '<p>Which chord is shown below?</p>';
    html += pianoSVG(findChord(S.quizQ.answer), { showFingers: false });
    html += '<div class="quiz-options">';
    S.quizQ.options.forEach(function(opt) {
      var cls = "btn quiz-btn";
      if (S.quizAns) {
        if (opt === S.quizQ.answer) cls += " correct";
        else if (opt === S.quizAns && opt !== S.quizQ.answer) cls += " wrong";
      }
      html += '<button class="' + cls + '" onclick="act(\'quiz_answer\',\'' + opt + '\')" ' + (S.quizAns ? "disabled" : "") + '>' + escHTML(opt) + '</button>';
    });
    html += '</div>';
    if (S.quizAns) {
      var correct = S.quizAns === S.quizQ.answer;
      html += '<div class="quiz-result ' + (correct ? 'correct' : 'wrong') + '">' + (correct ? "\u2705 Correct!" : "\u274C It was " + S.quizQ.answer) + '</div>';
      html += '<button class="btn" onclick="act(\'next_quiz\')">Next Question</button>';
    }
    html += '<div class="text-muted">Score: ' + S.quizCorrect + '</div>';
  } else {
    html += '<p>Test your chord knowledge!</p>';
    html += '<button class="btn" onclick="act(\'start_quiz\')">Start Quiz</button>';
    html += '<div class="text-muted">Total correct: ' + S.quizCorrect + '</div>';
  }
  html += '</div>';
  return html;
}

// ── Ear Training ──
function earTrainTab() {
  var html = '<div class="card"><h2>Ear Training</h2>';
  if (S.earChord) {
    html += '<p>Listen and identify the chord:</p>';
    html += '<button class="btn btn-accent" onclick="act(\'ear_play\')">\u{1F50A} Play Again</button>';
    html += '<div class="quiz-options">';
    var pool = chordsUpToLevel(Math.min(S.level + 1, 8)).slice(0, 12);
    pool.forEach(function(c) {
      var cls = "btn quiz-btn";
      if (S.earRevealed && c.short === S.earChord) cls += " correct";
      html += '<button class="' + cls + '" onclick="act(\'ear_guess\',\'' + c.short + '\')" ' + (S.earRevealed ? "disabled" : "") + '>' + escHTML(c.short) + '</button>';
    });
    html += '</div>';
    if (S.earRevealed) {
      html += '<div class="reveal-box">It was: <strong>' + escHTML(S.earChord) + '</strong></div>';
      html += pianoSVG(findChord(S.earChord));
      html += '<button class="btn" onclick="act(\'next_ear\')">Next</button>';
    }
  } else {
    html += '<p>Train your ear to recognize chords by sound.</p>';
    html += '<button class="btn" onclick="act(\'start_ear\')">Start Training</button>';
  }
  html += '</div>';
  return html;
}

// ── Rhythm Game ──
function rhythmTab() {
  var html = '<div class="card"><h2>Rhythm Game</h2>';
  if (S.rhythmActive) {
    html += '<div class="rhythm-display">';
    html += '<div class="rhythm-score">Score: ' + S.rhythmScore + ' | Combo: ' + S.rhythmCombo + 'x</div>';
    html += '<div class="rhythm-track">';
    for (var i = 0; i < 4; i++) {
      html += '<div class="rhythm-beat ' + (S.rhythmBeat % 4 === i ? 'beat-active' : '') + '"></div>';
    }
    html += '</div>';
    html += '<button class="btn btn-lg btn-accent rhythm-hit" onclick="act(\'rhythm_hit\')">HIT!</button>';
    html += '<button class="btn btn-secondary" onclick="act(\'stop_rhythm\')">Stop</button>';
    html += '</div>';
  } else {
    html += '<p>Hit the beat in time with the music!</p>';
    html += '<div class="setting-row"><label>BPM: ' + S.bpm + '</label>';
    html += '<input type="range" min="60" max="180" value="' + S.bpm + '" onchange="act(\'set_bpm\', this.value)"/></div>';
    html += '<button class="btn" onclick="act(\'start_rhythm\')">Start Game</button>';
  }
  html += '</div>';
  return html;
}

// ── Runner Game ──
function runnerTab() {
  var html = '<div class="card"><h2>Chord Runner</h2>';
  if (S.runnerActive) {
    html += '<div class="runner-display">';
    html += '<div class="runner-score">Score: ' + S.runnerScore + '</div>';
    html += '<div class="runner-target">Play: <strong>' + (S.runnerTarget ? escHTML(S.runnerTarget) : "...") + '</strong></div>';
    html += '<div class="runner-lanes">';
    var options = getRunnerOptions();
    options.forEach(function(opt) {
      html += '<button class="btn runner-lane" onclick="act(\'runner_pick\',\'' + opt + '\')">' + escHTML(opt) + '</button>';
    });
    html += '</div>';
    html += '<button class="btn btn-secondary" onclick="act(\'stop_runner\')">Stop</button>';
    html += '</div>';
  } else {
    html += '<p>Tap the correct chord as fast as you can!</p>';
    html += '<button class="btn" onclick="act(\'start_runner\')">Start Game</button>';
  }
  html += '</div>';
  return html;
}

// ── Finger Exercises Tab ──
function fingersTab() {
  var html = '<div class="card">';

  // 60-Second Chord Change Challenge
  if (S.chordChangeActive) {
    html += '<h2>60-Second Challenge</h2>';
    html += '<div class="timer-display">' + formatTime(S.chordChangeTimer) + '</div>';
    html += '<div style="font-size:2rem;font-weight:800;color:var(--accent);margin:8px 0">' + S.chordChangeCount + '</div>';
    html += '<div class="text-muted">clean changes</div>';
    if (S.chordChangePair.length === 2) {
      html += '<div style="font-size:1.2rem;margin:12px 0">' + escHTML(S.chordChangePair[0]) + ' \u2194 ' + escHTML(S.chordChangePair[1]) + '</div>';
    }
    html += '<button class="btn btn-lg btn-accent" onclick="act(\'chord_change_tap\')" style="width:100%;padding:20px;margin:8px 0">TAP for each clean change</button>';
    html += '<button class="btn btn-secondary" onclick="act(\'stop_chord_change\')">Stop</button>';
    html += '</div>';
    return html;
  }

  html += '<h2>\u{270B} Finger Exercises</h2>';
  html += '<p>Build finger independence, strength, and speed.</p>';

  // Stats summary
  html += '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">';
  html += '<div class="stat-item"><div class="stat-val">' + S.fingerExercisesDone + '</div><div class="stat-label">Done</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + S.fingerDaysLogged + '</div><div class="stat-label">Days</div></div>';
  html += '<div class="stat-item"><div class="stat-val">' + S.fingerBadges.length + '/' + FINGER_BADGES.length + '</div><div class="stat-label">Badges</div></div>';
  html += '</div>';

  // 60-Second Challenge launcher
  html += '<div class="card" style="background:linear-gradient(135deg,var(--accent-bg),rgba(236,72,153,0.08));margin-bottom:12px">';
  html += '<h3>\u{23F1} 60-Second Chord Change Challenge</h3>';
  html += '<p>Switch between two chords as many times as possible. 30 = competent, 60 = fluent.</p>';
  var chordPairs = _getChordChangePairs();
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">';
  chordPairs.forEach(function(pair) {
    html += '<button class="btn btn-sm" onclick="act(\'start_chord_change\',\'' + pair[0] + ',' + pair[1] + '\')">' + pair[0] + ' \u2194 ' + pair[1] + '</button>';
  });
  html += '</div>';
  // Personal best
  var bestCount = S.fingerStats._chordChangeBest || 0;
  if (bestCount > 0) {
    html += '<div class="text-muted">Personal best: ' + bestCount + ' changes</div>';
  }
  html += '</div>';

  // Exercise tiers
  var available = getAvailableExercises(S.currentSession);
  for (var tier = 1; tier <= 4; tier++) {
    var tierExercises = available.filter(function(ex) { return ex.tier === tier; });
    if (!tierExercises.length) continue;

    var tierNames = ["","Off-Instrument","On-Instrument","Chord-Specific","Advanced"];
    var tierIcons = ["","\u{1F4A1}","\u{1F3B9}","\u{1F3AF}","\u{1F525}"];
    html += '<h3>' + tierIcons[tier] + ' Tier ' + tier + ': ' + tierNames[tier] + '</h3>';

    tierExercises.forEach(function(ex) {
      var stats = S.fingerStats[ex.id] || { completions: 0, lastDone: null };
      var doneToday = stats.lastDone && new Date(stats.lastDone).toDateString() === new Date().toDateString();
      html += '<div class="finger-exercise-card' + (doneToday ? ' done' : '') + '">';
      html += '<div class="finger-exercise-header">';
      html += '<strong>' + escHTML(ex.name) + '</strong>';
      if (ex.offInstrument) html += ' <span class="level-tag">No keyboard</span>';
      if (doneToday) html += ' <span style="color:var(--success)">\u2705</span>';
      html += '</div>';
      html += '<div class="text-muted" style="margin:4px 0">' + escHTML(ex.desc) + '</div>';
      html += '<div style="display:flex;gap:6px;align-items:center;margin-top:6px">';
      html += '<span class="text-muted">' + Math.floor(ex.duration / 60) + ':' + (ex.duration % 60 < 10 ? '0' : '') + (ex.duration % 60) + ' \u2022 ' + escHTML(ex.frequency) + '</span>';
      html += '<span class="text-muted">\u2022 ' + stats.completions + 'x done</span>';
      html += '<button class="btn btn-sm" onclick="act(\'complete_finger_exercise\',\'' + ex.id + '\')">' + (doneToday ? 'Again' : 'Done') + '</button>';
      html += '</div>';
      if (ex.goal) {
        html += '<div class="text-muted" style="font-style:italic;margin-top:4px">\u{1F3AF} ' + escHTML(ex.goal) + '</div>';
      }
      html += '</div>';
    });
  }

  // Locked tiers preview
  var allExercises = FINGER_EXERCISES;
  var lockedTiers = [];
  for (var lt = 1; lt <= 4; lt++) {
    var tierAll = allExercises.filter(function(ex) { return ex.tier === lt; });
    var tierAvail = available.filter(function(ex) { return ex.tier === lt; });
    if (tierAll.length > 0 && tierAvail.length === 0) lockedTiers.push(lt);
  }
  if (lockedTiers.length) {
    html += '<div class="text-muted" style="margin-top:12px">';
    html += 'More exercises unlock as you progress through sessions.';
    html += '</div>';
  }

  // Injury prevention tip
  var tipIdx = Math.floor(Date.now() / 86400000) % INJURY_TIPS.length;
  html += '<div class="intention-card" style="margin-top:16px">';
  html += '<span class="intention-icon">\u{26A0}</span> <strong>Injury Prevention:</strong> ' + escHTML(INJURY_TIPS[tipIdx]);
  html += '</div>';

  // Finger badges
  html += '<h3 style="margin-top:16px">Finger Badges</h3>';
  html += '<div class="badges-row">';
  FINGER_BADGES.forEach(function(b) {
    var earned = S.fingerBadges.indexOf(b.id) >= 0;
    html += '<span class="badge ' + (earned ? 'earned' : 'locked') + '" title="' + escHTML(b.desc) + '">' + b.icon + '</span>';
  });
  html += '</div>';

  html += '</div>';
  return html;
}

function _getChordChangePairs() {
  var unlocked = chordsUpToLevel(S.level).map(function(c) { return c.short; });
  var pairs = [];
  // Generate common pairs from unlocked chords
  var commonPairs = [["C","Am"],["C","F"],["C","G"],["Am","Em"],["Am","Dm"],
                     ["F","G"],["Dm","G7"],["G","D"],["C","Em"]];
  commonPairs.forEach(function(p) {
    if (unlocked.indexOf(p[0]) >= 0 && unlocked.indexOf(p[1]) >= 0) {
      pairs.push(p);
    }
  });
  if (pairs.length < 3) {
    // Fallback: first few unlocked chords
    for (var i = 0; i < unlocked.length - 1 && pairs.length < 4; i++) {
      pairs.push([unlocked[i], unlocked[i+1]]);
    }
  }
  return pairs.slice(0, 6);
}

function getRunnerOptions() {
  if (!S.runnerTarget) return ["C", "Am", "F"];
  var all = chordsUpToLevel(S.level).map(function(c) { return c.short; });
  var opts = [S.runnerTarget];
  while (opts.length < 3 && all.length >= 3) {
    var r = all[Math.floor(Math.random() * all.length)];
    if (opts.indexOf(r) < 0) opts.push(r);
  }
  for (var i = opts.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
  }
  return opts;
}
