/* PianoSpark - Guided session flow */
/* Heart of the overhaul: Spark > Review > New Move > Song Slice > Victory Lap */

function pianoSessionRead(path, fallback) {
  var root = null;
  if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
    var sparkRoot = SparkState.getRoot();
    if (sparkRoot) root = sparkRoot;
  }
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

function pianoSessionPage() {
  var plan = pianoSessionRead("sessionPlan", null);
  var sessionStep = pianoSessionRead("sessionStep", null);
  var sessionTimer = pianoSessionRead("sessionTimer", 0);
  var paused = !!pianoSessionRead("paused", false);
  if (!plan) return '<div class="card"><p>No session loaded.</p>' + backBtnHTML("go_home") + '</div>';

  var html = '<div class="session-screen">';
  html += '<div class="session-title">Session ' + plan.num + ': ' + escHTML(plan.title) + '</div>';
  html += '<div class="session-subtitle">Level ' + plan.level + ' - ' + plan.bpm + ' BPM</div>';
  html += sessionStepIndicator(sessionStep);

  if (sessionTimer > 0) {
    html += '<div class="timer-display">' + pianoFormatTime(sessionTimer) + '</div>';
  }

  switch (sessionStep) {
    case "spark":
      html += renderSpark(plan);
      break;
    case "review":
      html += renderReview(plan);
      break;
    case "newMove":
      html += renderNewMove(plan);
      break;
    case "songSlice":
      html += renderSongSlice(plan);
      break;
    case "victoryLap":
      html += renderVictoryLap(plan);
      break;
    default:
      html += '<div class="card"><p>Session complete!</p></div>';
  }

  html += '<div class="session-btns">';
  if (sessionStep) {
    html += '<button class="btn" onclick="act(\'pause\')">' + (paused ? "\u25B6 Resume" : "\u23F8 Pause") + '</button>';
    html += '<button class="btn btn-secondary" onclick="act(\'stop_session_confirm\')">End Session</button>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function renderSpark(plan) {
  var html = '';
  var fingerWarmUpDone = !!pianoSessionRead("fingerWarmUpDone", false);

  if (!fingerWarmUpDone) {
    var warmUp = getWarmUpExercise(plan.num);
    if (warmUp) {
      html += '<div class="session-step-card" style="border:1px solid var(--warning);border-left:4px solid var(--warning)">';
      html += '<h4>\u270B Quick Warm-Up (30s)</h4>';
      html += '<div class="session-text">' + escHTML(warmUp.name) + ': ' + escHTML(warmUp.desc) + '</div>';
      if (warmUp.offInstrument) {
        html += '<div class="text-muted">No keyboard needed - do this on any flat surface!</div>';
      }
      html += '<button class="btn btn-sm" onclick="act(\'complete_warmup\')">\u2705 Done</button>';
      html += '<button class="btn btn-sm btn-secondary" onclick="act(\'skip_warmup\')">Skip</button>';
      html += '</div>';
    }
  }

  html += '<div class="session-step-card spark-card">';
  html += '<h3>\u2728 Spark</h3>';
  html += '<div class="session-text">' + escHTML(plan.spark.text) + '</div>';
  html += '<button class="btn btn-accent" onclick="act(\'next_step\')">Next \u2192</button>';
  html += '</div>';
  return html;
}

function renderReview(plan) {
  if (!plan.review) {
    return '<div class="session-step-card review-card"><h3>Review</h3>' +
      '<p>No review for this session - it\'s your first!</p>' +
      '<button class="btn btn-accent" onclick="act(\'next_step\')">Next \u2192</button></div>';
  }

  var html = '<div class="session-step-card review-card">';
  html += '<h3>Review</h3>';
  html += '<div class="session-text">' + escHTML(plan.review.text) + '</div>';

  if (plan.review.chords && plan.review.chords.length) {
    html += '<div class="song-chords">';
    plan.review.chords.forEach(function(ch) {
      var chord = findChord(ch);
      if (chord) html += chordTypeTag(chord);
    });
    html += '</div>';

    var firstChord = findChord(plan.review.chords[0]);
    if (firstChord) {
      html += pianoSVG(firstChord);
      html += '<button class="btn btn-sm" onclick="act(\'play_chord\',\'' + firstChord.short + '\')">Play</button>';
    }
  }

  html += '<button class="btn btn-accent" style="margin-top:12px" onclick="act(\'next_step\')">Next \u2192</button>';
  html += '</div>';
  return html;
}

function renderPianoNewMovePhaseIndicator(currentPhase) {
  var phases = [
    { id: "watch", label: "Watch", icon: "👀", color: "#FF6B6B" },
    { id: "shadow", label: "Shadow", icon: "🤖", color: "#45B7D1" },
    { id: "try", label: "Try", icon: "🎯", color: "#4ECDC4" },
    { id: "refine", label: "Refine", icon: "💡", color: "#A78BFA" }
  ];
  var phaseIdx = -1;
  var html = '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:10px 0 14px">';
  phases.forEach(function(phase, index) {
    if (phase.id === currentPhase) phaseIdx = index;
  });
  phases.forEach(function(phase, index) {
    var active = phase.id === currentPhase;
    var done = phaseIdx > index;
    var background = active ? phase.color : (done ? phase.color + "22" : "var(--input-bg)");
    var color = active ? "#fff" : (done ? phase.color : "var(--text-muted)");
    var extraStyle = active ? "transform:translateY(-1px) scale(1.02);box-shadow:0 8px 20px rgba(0,0,0,0.18);" : "";
    html += '<span style="padding:6px 12px;border-radius:999px;font-size:11px;font-weight:800;background:' + background + ';color:' + color + ';transition:all .18s ease;' + extraStyle + '">' +
      phase.icon + ' ' + phase.label + '</span>';
  });
  html += '</div>';
  return html;
}

function renderPianoNewMoveAnimationStyles() {
  return '' +
    '<style>' +
    '@keyframes pianoWatchPulse{0%{transform:scale(.92);opacity:.45}50%{transform:scale(1.06);opacity:1}100%{transform:scale(.92);opacity:.45}}' +
    '@keyframes pianoShadowFloat{0%{transform:translateX(-12px);opacity:.18}50%{transform:translateX(0);opacity:.62}100%{transform:translateX(12px);opacity:.18}}' +
    '@keyframes pianoTryTarget{0%{transform:scale(.82);opacity:.22}70%{transform:scale(1.08);opacity:.78}100%{transform:scale(1.2);opacity:0}}' +
    '@keyframes pianoRefineGlow{0%{opacity:.25;transform:translateX(-10px)}50%{opacity:.85;transform:translateX(0)}100%{opacity:.25;transform:translateX(10px)}}' +
    '</style>';
}

function renderPianoNewMoveAnimation(phase, chord) {
  var label = chord && chord.short ? chord.short : "MOVE";
  var html = '<div style="display:flex;justify-content:center;margin:6px 0 14px">' +
    '<div style="position:relative;width:220px;height:92px;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08)">';

  if (phase === "watch") {
    html += '<div style="position:absolute;inset:16px;border-radius:16px;background:radial-gradient(circle,rgba(255,107,107,.35),rgba(255,107,107,0));animation:pianoWatchPulse 1.8s ease-in-out infinite"></div>';
    html += '<div style="position:absolute;left:24px;right:24px;top:34px;height:10px;border-radius:999px;background:linear-gradient(90deg,rgba(255,107,107,.12),rgba(255,107,107,.72),rgba(255,107,107,.12))"></div>';
    html += '<div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:.08em;color:#FF6B6B;text-transform:uppercase">Observe</div>';
  } else if (phase === "shadow") {
    html += '<div style="position:absolute;left:34px;top:20px;width:68px;height:52px;border-radius:16px;background:rgba(69,183,209,.22);animation:pianoShadowFloat 1.7s ease-in-out infinite"></div>';
    html += '<div style="position:absolute;right:34px;top:20px;width:68px;height:52px;border-radius:16px;background:rgba(69,183,209,.22);animation:pianoShadowFloat 1.7s ease-in-out .22s infinite reverse"></div>';
    html += '<div style="position:absolute;inset:24px 58px;border-radius:16px;border:2px dashed rgba(69,183,209,.6)"></div>';
    html += '<div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:.08em;color:#45B7D1;text-transform:uppercase">Mirror</div>';
  } else if (phase === "try") {
    html += '<div style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin-left:-13px;margin-top:-13px;border-radius:50%;background:rgba(78,205,196,.85)"></div>';
    html += '<div style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin-left:-13px;margin-top:-13px;border:3px solid rgba(78,205,196,.65);border-radius:50%;animation:pianoTryTarget 1.4s ease-out infinite"></div>';
    html += '<div style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin-left:-13px;margin-top:-13px;border:3px solid rgba(78,205,196,.45);border-radius:50%;animation:pianoTryTarget 1.4s ease-out .45s infinite"></div>';
    html += '<div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:.08em;color:#4ECDC4;text-transform:uppercase">Hit It</div>';
  } else if (phase === "refine") {
    html += '<div style="position:absolute;left:24px;right:24px;top:28px;height:6px;border-radius:999px;background:rgba(167,139,250,.18)"></div>';
    html += '<div style="position:absolute;left:34px;right:34px;top:26px;height:10px;border-radius:999px;background:linear-gradient(90deg,rgba(167,139,250,.08),rgba(167,139,250,.88),rgba(167,139,250,.08));animation:pianoRefineGlow 1.6s ease-in-out infinite"></div>';
    html += '<div style="position:absolute;left:44px;right:44px;bottom:24px;height:10px;border-radius:999px;background:linear-gradient(90deg,rgba(167,139,250,.08),rgba(167,139,250,.72),rgba(167,139,250,.08));animation:pianoRefineGlow 1.6s ease-in-out .35s infinite reverse"></div>';
    html += '<div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:.08em;color:#A78BFA;text-transform:uppercase">Polish</div>';
  }

  html += '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 14px;border-radius:999px;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.12);font-weight:900;color:#fff;letter-spacing:.08em">' + escHTML(label) + '</div>';
  html += '</div></div>';
  return html;
}

function renderNewMove(plan) {
  if (!plan.newMove) return '';

  var html = '<div class="session-step-card newmove-card">';
  var newMovePhase = pianoSessionRead("newMovePhase", null);
  if (!newMovePhase) newMovePhase = "watch";
  var feedbackMessage = pianoSessionRead("feedbackMessage", null);
  var detecting = !!pianoSessionRead("detecting", false);
  var lastReviewChords = Array.isArray(pianoSessionRead("lastReviewChords", [])) ? pianoSessionRead("lastReviewChords", []) : [];
  var chord = findChord(plan.newMove.chord);

  html += '<h3>New Move</h3>';
  html += renderPianoNewMoveAnimationStyles();
  html += renderPianoNewMovePhaseIndicator(newMovePhase);

  switch (newMovePhase) {
    case "watch":
      html += '<div style="background:#FF6B6B11;border-radius:14px;padding:14px;margin-bottom:14px;border:1px solid #FF6B6B33">';
      html += '<div style="font-size:14px;font-weight:800;color:#FF6B6B;margin-bottom:6px">👀 Watch - Hands Off!</div>';
      html += '<div class="session-text">Observe the chord shape and finger placement. Don\'t play yet.</div>';
      html += renderPianoNewMoveAnimation("watch", chord);
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-sm" onclick="act(\'play_watch_demo\',\'' + plan.newMove.chord + '\')">Play Demo</button>';
      html += '</div>';
      html += '<button class="btn btn-accent" onclick="act(\'advance_phase\')">I\'ve Watched \u2192</button>';
      break;

    case "shadow":
      html += '<div style="background:#45B7D111;border-radius:14px;padding:14px;margin-bottom:14px;border:1px solid #45B7D133">';
      html += '<div style="font-size:14px;font-weight:800;color:#45B7D1;margin-bottom:6px">🤖 Shadow - Mirror Slowly</div>';
      html += '<div class="session-text">Mirror slowly. Copy what you saw. No feedback yet.</div>';
      html += renderPianoNewMoveAnimation("shadow", chord);
      if (chord) html += pianoSVG(chord);
      html += '</div>';
      html += '<button class="btn btn-accent" onclick="act(\'advance_phase\')">I\'ve Shadowed \u2192</button>';
      break;

    case "try":
      html += '<div style="background:#4ECDC411;border-radius:14px;padding:14px;margin-bottom:14px;border:1px solid #4ECDC433">';
      html += '<div style="font-size:14px;font-weight:800;color:#4ECDC4;margin-bottom:6px">🎯 Try - Your Turn</div>';
      html += '<div class="session-text">' + escHTML(plan.newMove.text) + '</div>';
      html += renderPianoNewMoveAnimation("try", chord);
      if (chord) {
        html += pianoSVG(chord);
        html += '<button class="btn btn-sm" onclick="act(\'play_chord\',\'' + chord.short + '\')">Play</button>';
      }
      if (feedbackMessage) {
        html += delayedFeedbackCard(feedbackMessage, true);
      }
      if (detecting && chord) {
        var match = getChordMatch(chord);
        html += '<div class="detection-box">';
        html += '<div class="match-pct ' + (match >= 80 ? 'match-good' : match >= 50 ? 'match-ok' : 'match-low') + '">' + match + '%</div>';
        html += '<div class="coach-tip">' + getCoachFeedback(chord) + '</div>';
        html += detectionConfidenceHTML();
        html += '</div>';
      }
      html += '</div>';
      html += '<button class="btn btn-sm" onclick="act(\'toggle_detect\')">' + (detecting ? "Stop Detect" : "Detect Chord") + '</button>';
      html += '<button class="btn btn-accent" style="margin-top:8px" onclick="act(\'advance_phase\')">I Can Play It \u2192</button>';
      break;

    case "refine":
      html += '<div style="background:#A78BFA11;border-radius:14px;padding:14px;margin-bottom:14px;border:1px solid #A78BFA33">';
      html += '<div style="font-size:14px;font-weight:800;color:#A78BFA;margin-bottom:6px">💡 Refine</div>';
      html += '<div class="session-text">Focus on clean transitions and consistent finger placement.</div>';
      html += renderPianoNewMoveAnimation("refine", chord);
      if (chord) html += pianoSVG(chord);
      var tipKey = lastReviewChords.length ? lastReviewChords[0] + "_" + plan.newMove.chord : null;
      var _tips = typeof PIANO_TRANSITION_TIPS !== "undefined" ? PIANO_TRANSITION_TIPS : TRANSITION_TIPS;
      if (tipKey && _tips[tipKey]) {
        html += '<div class="intention-card">Tip: ' + escHTML(_tips[tipKey]) + '</div>';
      }
      var vlExercise = getSessionExercise(plan.num, "newMove");
      if (vlExercise) {
        html += '<div class="finger-exercise-inline">';
        html += '<h4>\u270B Finger Focus: ' + escHTML(vlExercise.name) + '</h4>';
        html += '<div class="text-muted">' + escHTML(vlExercise.desc) + '</div>';
        html += '</div>';
      }
      html += '</div>';
      html += '<button class="btn btn-accent" onclick="act(\'next_step\')">Done \u2192</button>';
      break;

    default:
      html += '<div class="session-text">' + escHTML(plan.newMove.text) + '</div>';
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-accent" onclick="act(\'next_step\')">Next \u2192</button>';
  }

  html += '</div>';
  return html;
}

function renderSongSlice(plan) {
  if (!plan.songSlice) return '';

  var html = '<div class="session-step-card songslice-card">';
  var adaptiveBpm = pianoSessionRead("adaptiveBpm", 72);
  var personalBests = pianoSessionRead("personalBests", {}) || {};
  html += '<h3>Song Slice</h3>';
  html += '<div class="session-text">' + escHTML(plan.songSlice.text) + '</div>';

  if (plan.songSlice.song) {
    html += '<div style="font-weight:700;margin:8px 0">Song: ' + escHTML(plan.songSlice.song) + '</div>';
  }

  html += adaptiveBpmDisplay(adaptiveBpm, personalBests.bpm);

  if (plan.lh && plan.lh !== "Resting") {
    var lvlObj = getCurrentLevel();
    if (lvlObj && lvlObj.lhPattern) {
      html += lhPatternViz(lvlObj.lhPattern, adaptiveBpm);
    }
    html += '<div class="text-muted">LH: ' + escHTML(plan.lh) + '</div>';
  }

  html += '<div class="session-btns">';
  html += '<button class="btn" onclick="act(\'start_metronome\')">Metronome</button>';
  html += '<button class="btn btn-secondary" onclick="act(\'stop_metronome\')">Stop</button>';
  html += '</div>';

  html += '<button class="btn btn-accent" style="margin-top:12px" onclick="act(\'next_step\')">Done \u2192</button>';
  html += '</div>';
  return html;
}

function renderVictoryLap(plan) {
  if (!plan.victoryLap) return '';

  var html = '<div class="session-step-card victorylap-card">';
  html += '<h3>Victory Lap</h3>';
  html += '<div class="session-text">' + escHTML(plan.victoryLap.text) + '</div>';

  var chord = findChord(plan.newMove ? plan.newMove.chord : "C");
  if (chord) {
    html += pianoSVG(chord);
    html += '<button class="btn btn-sm" onclick="act(\'play_chord\',\'' + chord.short + '\')">Play</button>';
  }

  var vlExercise = getSessionExercise(plan.num, "victoryLap");
  if (vlExercise) {
    html += '<div class="finger-exercise-inline">';
    html += '<h4>\u270B Finger Check: ' + escHTML(vlExercise.name) + '</h4>';
    html += '<div class="text-muted">' + escHTML(vlExercise.desc) + '</div>';
    html += '</div>';
  }

  html += '<button class="btn btn-lg btn-accent" style="margin-top:16px" onclick="act(\'complete_victory_lap\')">\u2705 Session Complete!</button>';
  html += '</div>';
  return html;
}

function legacySessionHTML() {
  var chordShort = pianoSessionRead("chord", null);
  var timer = pianoSessionRead("timer", 0);
  var paused = !!pianoSessionRead("paused", false);
  var detecting = !!pianoSessionRead("detecting", false);
  var detectedNotes = Array.isArray(pianoSessionRead("detectedNotes", [])) ? pianoSessionRead("detectedNotes", []) : [];
  var c = findChord(chordShort);
  var html = '<div class="session-active card">';
  html += '<h2>' + (c ? escHTML(c.name) : escHTML(chordShort)) + '</h2>';
  html += '<div class="timer-display">' + pianoFormatTime(timer) + '</div>';
  if (c) html += pianoSVG(c);
  html += '<div class="session-btns">';
  html += '<button class="btn" onclick="act(\'pause\')">' + (paused ? "\u25B6 Resume" : "\u23F8 Pause") + '</button>';
  html += '<button class="btn btn-secondary" onclick="act(\'stop_session\')">Stop</button>';
  html += '<button class="btn btn-accent" onclick="act(\'play_chord\',\'' + (c ? c.short : '') + '\')">Play</button>';
  html += '</div>';

  if (detecting && c) {
    var match = getChordMatch(c);
    html += '<div class="detection-box">';
    html += '<div class="match-pct ' + (match >= 80 ? 'match-good' : match >= 50 ? 'match-ok' : 'match-low') + '">' + match + '% match</div>';
    html += '<div class="detected-notes">' + (detectedNotes.length ? "Detected: " + detectedNotes.join(" ") : "Listening...") + '</div>';
    html += '<div class="coach-tip">' + getCoachFeedback(c) + '</div>';
    html += detectionConfidenceHTML();
    html += '</div>';
  }
  html += '<button class="btn btn-sm" onclick="act(\'toggle_detect\')">' + (detecting ? "Stop Detect" : "Detect Chord") + '</button>';
  html += '</div>';
  return html;
}
