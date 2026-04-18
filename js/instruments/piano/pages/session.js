/* PianoSpark - Guided session flow */
/* Heart of the overhaul: Spark > Review > New Move > Song Slice > Victory Lap */

function pianoSessionTextToken(value) {
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function pianoFirstSessionTextToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = pianoSessionTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function pianoNormalizeSessionBpm(value, fallback) {
  var numeric = Number(value);
  if (!isFinite(numeric)) return fallback;
  numeric = Math.round(numeric);
  if (numeric <= 0) return fallback;
  return numeric;
}

function pianoSessionPage() {
  var plan = S.sessionPlan;
  var planBpm;
  if (!plan) return '<div class="card"><p>No session loaded.</p>' + backBtnHTML("go_home") + '</div>';
  planBpm = pianoNormalizeSessionBpm(plan.bpm, 80);

  var html = '<div class="session-screen">';

  // Session header
  html += '<div class="session-title">Session ' + plan.num + ': ' + escHTML(pianoFirstSessionTextToken(plan.title, "Guided session")) + '</div>';
  html += '<div class="session-subtitle">Level ' + plan.level + ' \u2022 ' + planBpm + ' BPM</div>';

  // Step indicator
  html += sessionStepIndicator(S.sessionStep);

  // Timer
  if (S.sessionTimer > 0) {
    html += '<div class="timer-display">' + pianoFormatTime(S.sessionTimer) + '</div>';
  }

  // Render current step
  switch (S.sessionStep) {
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

  // Bottom controls
  html += '<div class="session-btns">';
  if (S.sessionStep) {
    html += '<button class="btn" onclick="act(\'pause\')">' + (S.paused ? "\u25B6 Resume" : "\u23F8 Pause") + '</button>';
    html += '<button class="btn btn-secondary" onclick="if(confirm(\'End session early?\'))act(\'stop_session\')">End Session</button>';
  }
  html += '</div>';

  html += '</div>'; // session-screen
  return html;
}

function renderSpark(plan) {
  var html = '';

  // Warm-up prompt (30s finger exercise before Spark)
  if (!S.fingerWarmUpDone) {
    var warmUp = getWarmUpExercise(plan.num);
    if (warmUp) {
      html += '<div class="session-step-card" style="border:1px solid var(--warning);border-left:4px solid var(--warning)">';
      html += '<h4>\u{270B} Quick Warm-Up (30s)</h4>';
      html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(warmUp.name, "Warm-up")) + ': ' + escHTML(pianoFirstSessionTextToken(warmUp.desc)) + '</div>';
      if (warmUp.offInstrument) {
        html += '<div class="text-muted">No keyboard needed \u2014 do this on any flat surface!</div>';
      }
      html += '<button class="btn btn-sm" onclick="act(\'complete_warmup\')">\u2705 Done</button>';
      html += '<button class="btn btn-sm btn-secondary" onclick="act(\'skip_warmup\')">Skip</button>';
      html += '</div>';
    }
  }

  html += '<div class="session-step-card spark-card">';
  html += '<h3>\u{2728} Spark</h3>';
  html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(plan.spark.text, "Get started.")) + '</div>';
  html += '<button class="btn btn-accent" onclick="act(\'next_step\')">Next \u2192</button>';
  html += '</div>';
  return html;
}

function renderReview(plan) {
  if (!plan.review) {
    return '<div class="session-step-card review-card"><h3>\u{1F504} Review</h3>' +
      '<p>No review for this session \u2014 it\'s your first!</p>' +
      '<button class="btn btn-accent" onclick="act(\'next_step\')">Next \u2192</button></div>';
  }

  var html = '<div class="session-step-card review-card">';
  html += '<h3>\u{1F504} Review</h3>';
  html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(plan.review.text, "Review your last move.")) + '</div>';

  // Show interleaved review chords (stickiness #8)
  if (plan.review.chords && plan.review.chords.length) {
    html += '<div class="song-chords">';
    plan.review.chords.forEach(function(ch) {
      var chord = findChord(ch);
      if (chord) html += chordTypeTag(chord);
    });
    html += '</div>';

    // Show first chord's keyboard
    var firstChord = findChord(plan.review.chords[0]);
    if (firstChord) {
      html += pianoSVG(firstChord);
      html += '<button class="btn btn-sm" onclick="act(\'play_chord\',\'' + firstChord.short + '\')">\u{1F50A} Play</button>';
    }
  }

  html += '<button class="btn btn-accent" style="margin-top:12px" onclick="act(\'next_step\')">Next \u2192</button>';
  html += '</div>';
  return html;
}

function renderNewMove(plan) {
  if (!plan.newMove) return '';

  var html = '<div class="session-step-card newmove-card">';
  html += '<h3>\u{1F3AF} New Move</h3>';

  // Phase indicator (Watch/Shadow/Try/Refine)
  html += newMovePhaseIndicator(S.newMovePhase);

  var chord = findChord(plan.newMove.chord);

  switch (S.newMovePhase) {
    case "watch":
      html += '<div class="watch-overlay">';
      html += '<div class="watch-label">\u{1F440} Watch \u2014 Hands Off!</div>';
      html += '<div class="session-text">Observe the chord shape and finger placement. Don\'t play yet.</div>';
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-sm" onclick="act(\'play_watch_demo\',\'' + plan.newMove.chord + '\')">\u{1F50A} Demo</button>';
      html += '</div>';
      html += '<button class="btn btn-accent" onclick="act(\'advance_phase\')">I\'ve Watched \u2192</button>';
      break;

    case "shadow":
      html += '<div class="session-text">\u{1F91A} Mirror slowly. Copy what you saw. No feedback yet.</div>';
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-accent" onclick="act(\'advance_phase\')">I\'ve Shadowed \u2192</button>';
      break;

    case "try":
      html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(plan.newMove.text, "Try the new move.")) + '</div>';
      if (chord) {
        html += pianoSVG(chord);
        html += '<button class="btn btn-sm" onclick="act(\'play_chord\',\'' + chord.short + '\')">\u{1F50A} Play</button>';
      }
      // Delayed feedback area (stickiness #5)
      if (S.feedbackMessage) {
        html += delayedFeedbackCard(S.feedbackMessage, true);
      }
      // Detection
      if (S.detecting && chord) {
        var match = getChordMatch(chord);
        html += '<div class="detection-box">';
        html += '<div class="match-pct ' + (match >= 80 ? 'match-good' : match >= 50 ? 'match-ok' : 'match-low') + '">' + match + '%</div>';
        html += '<div class="coach-tip">' + getCoachFeedback(chord) + '</div>';
        html += detectionConfidenceHTML();
        html += '</div>';
      }
      html += '<button class="btn btn-sm" onclick="act(\'toggle_detect\')">' + (S.detecting ? "\u{1F3A4} Stop" : "\u{1F3A4} Detect") + '</button>';
      html += '<button class="btn btn-accent" style="margin-top:8px" onclick="act(\'advance_phase\')">I Can Play It \u2192</button>';
      break;

    case "refine":
      html += '<div class="session-text">Refine: Focus on clean transitions and consistent finger placement.</div>';
      if (chord) html += pianoSVG(chord);
      // Show transition tip if available
      var tipKey = S.lastReviewChords.length ? S.lastReviewChords[0] + "_" + plan.newMove.chord : null;
      var _tips = typeof PIANO_TRANSITION_TIPS !== "undefined" ? PIANO_TRANSITION_TIPS : TRANSITION_TIPS;
      var transitionTip = tipKey && _tips ? pianoFirstSessionTextToken(_tips[tipKey]) : "";
      if (transitionTip) {
        html += '<div class="intention-card">\u{1F4A1} ' + escHTML(transitionTip) + '</div>';
      }
      // Voice-Leading Path exercise integration (P-CHORD-4)
      var vlExercise = getSessionExercise(plan.num, "newMove");
      if (vlExercise) {
        var newMoveExerciseName = pianoFirstSessionTextToken(vlExercise.name, "Finger Focus");
        var newMoveExerciseDesc = pianoFirstSessionTextToken(vlExercise.desc, "Practice this motion slowly.");
        html += '<div class="finger-exercise-inline">';
        html += '<h4>\u{270B} Finger Focus: ' + escHTML(newMoveExerciseName) + '</h4>';
        html += '<div class="text-muted">' + escHTML(newMoveExerciseDesc) + '</div>';
        html += '</div>';
      }
      html += '<button class="btn btn-accent" onclick="act(\'next_step\')">Done \u2192</button>';
      break;

    default:
      html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(plan.newMove.text, "Try the new move.")) + '</div>';
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-accent" onclick="act(\'next_step\')">Next \u2192</button>';
  }

  html += '</div>';
  return html;
}

function renderSongSlice(plan) {
  if (!plan.songSlice) return '';

  var html = '<div class="session-step-card songslice-card">';
  html += '<h3>\u{1F3B5} Song Slice</h3>';
  html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(plan.songSlice.text, "Play a short song slice.")) + '</div>';

  // Show the song name
  if (plan.songSlice.song) {
    html += '<div style="font-weight:700;margin:8px 0">\u{1F3B6} ' + escHTML(pianoFirstSessionTextToken(plan.songSlice.song, "Song slice")) + '</div>';
  }

  // BPM display
  html += adaptiveBpmDisplay(S.adaptiveBpm, S.personalBests.bpm);

  // LH pattern info
  if (plan.lh && plan.lh !== "Resting") {
    var lvlObj = getCurrentLevel();
    if (lvlObj && lvlObj.lhPattern) {
      html += lhPatternViz(lvlObj.lhPattern, S.adaptiveBpm);
    }
    html += '<div class="text-muted">LH: ' + escHTML(pianoFirstSessionTextToken(plan.lh, "Pattern")) + '</div>';
  }

  html += '<div class="session-btns">';
  html += '<button class="btn" onclick="act(\'start_metronome\')">\u{1F3B5} Metronome</button>';
  html += '<button class="btn btn-secondary" onclick="act(\'stop_metronome\')">Stop</button>';
  html += '</div>';

  html += '<button class="btn btn-accent" style="margin-top:12px" onclick="act(\'next_step\')">Done \u2192</button>';
  html += '</div>';
  return html;
}

function renderVictoryLap(plan) {
  if (!plan.victoryLap) return '';

  var html = '<div class="session-step-card victorylap-card">';
  html += '<h3>\u{1F3C6} Victory Lap</h3>';
  html += '<div class="session-text">' + escHTML(pianoFirstSessionTextToken(plan.victoryLap.text, "Lock it in.")) + '</div>';

  var chord = findChord(plan.newMove ? plan.newMove.chord : "C");
  if (chord) {
    html += pianoSVG(chord);
    html += '<button class="btn btn-sm" onclick="act(\'play_chord\',\'' + chord.short + '\')">\u{1F50A} Play</button>';
  }

  // Shape Drop exercise integration (P-CHORD-1)
  var vlExercise = getSessionExercise(plan.num, "victoryLap");
  if (vlExercise) {
    var victoryExerciseName = pianoFirstSessionTextToken(vlExercise.name, "Finger Check");
    var victoryExerciseDesc = pianoFirstSessionTextToken(vlExercise.desc, "Lock it in with one more rep.");
    html += '<div class="finger-exercise-inline">';
    html += '<h4>\u{270B} Finger Check: ' + escHTML(victoryExerciseName) + '</h4>';
    html += '<div class="text-muted">' + escHTML(victoryExerciseDesc) + '</div>';
    html += '</div>';
  }

  html += '<button class="btn btn-lg btn-accent" style="margin-top:16px" onclick="act(\'complete_victory_lap\')">\u2705 Session Complete!</button>';
  html += '</div>';
  return html;
}

// ── Legacy session (free practice with a single chord) ──
function legacySessionHTML() {
  var c = findChord(S.chord);
  var html = '<div class="session-active card">';
  html += '<h2>' + (c ? escHTML(c.name) : escHTML(pianoFirstSessionTextToken(S.chord, "Chord"))) + '</h2>';
  html += '<div class="timer-display">' + pianoFormatTime(S.timer) + '</div>';
  if (c) html += pianoSVG(c);
  html += '<div class="session-btns">';
  html += '<button class="btn" onclick="act(\'pause\')">' + (S.paused ? "\u25B6 Resume" : "\u23F8 Pause") + '</button>';
  html += '<button class="btn btn-secondary" onclick="act(\'stop_session\')">Stop</button>';
  html += '<button class="btn btn-accent" onclick="act(\'play_chord\',\'' + (c ? c.short : '') + '\')">\u{1F50A} Play</button>';
  html += '</div>';

  if (S.detecting && c) {
    var match = getChordMatch(c);
    html += '<div class="detection-box">';
    html += '<div class="match-pct ' + (match >= 80 ? 'match-good' : match >= 50 ? 'match-ok' : 'match-low') + '">' + match + '% match</div>';
    html += '<div class="detected-notes">' + (S.detectedNotes.length ? "Detected: " + S.detectedNotes.join(" ") : "\u{1F3A4} Listening...") + '</div>';
    html += '<div class="coach-tip">' + getCoachFeedback(c) + '</div>';
    html += detectionConfidenceHTML();
    html += '</div>';
  }
  html += '<button class="btn btn-sm" onclick="act(\'toggle_detect\')">' + (S.detecting ? "\u{1F3A4} Stop Detect" : "\u{1F3A4} Detect Chord") + '</button>';
  html += '</div>';
  return html;
}
