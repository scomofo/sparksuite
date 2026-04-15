/* PianoSpark - Guided session flow */
/* Heart of the overhaul: Spark > Review > New Move > Song Slice > Victory Lap */

function pianoSessionRead(path, fallback) {
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

function renderNewMove(plan) {
  if (!plan.newMove) return '';

  var html = '<div class="session-step-card newmove-card">';
  var newMovePhase = pianoSessionRead("newMovePhase", null);
  var feedbackMessage = pianoSessionRead("feedbackMessage", null);
  var detecting = !!pianoSessionRead("detecting", false);
  var lastReviewChords = Array.isArray(pianoSessionRead("lastReviewChords", [])) ? pianoSessionRead("lastReviewChords", []) : [];
  var chord = findChord(plan.newMove.chord);

  html += '<h3>New Move</h3>';
  html += newMovePhaseIndicator(newMovePhase);

  switch (newMovePhase) {
    case "watch":
      html += '<div class="watch-overlay">';
      html += '<div class="watch-label">Watch - Hands Off!</div>';
      html += '<div class="session-text">Observe the chord shape and finger placement. Don\'t play yet.</div>';
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-sm" onclick="act(\'play_watch_demo\',\'' + plan.newMove.chord + '\')">Play Demo</button>';
      html += '</div>';
      html += '<button class="btn btn-accent" onclick="act(\'advance_phase\')">I\'ve Watched \u2192</button>';
      break;

    case "shadow":
      html += '<div class="session-text">Mirror slowly. Copy what you saw. No feedback yet.</div>';
      if (chord) html += pianoSVG(chord);
      html += '<button class="btn btn-accent" onclick="act(\'advance_phase\')">I\'ve Shadowed \u2192</button>';
      break;

    case "try":
      html += '<div class="session-text">' + escHTML(plan.newMove.text) + '</div>';
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
      html += '<button class="btn btn-sm" onclick="act(\'toggle_detect\')">' + (detecting ? "Stop Detect" : "Detect Chord") + '</button>';
      html += '<button class="btn btn-accent" style="margin-top:8px" onclick="act(\'advance_phase\')">I Can Play It \u2192</button>';
      break;

    case "refine":
      html += '<div class="session-text">Refine: Focus on clean transitions and consistent finger placement.</div>';
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
