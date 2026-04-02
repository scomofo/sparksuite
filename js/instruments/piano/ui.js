/* ───────── PianoSpark – ui.js ───────── */
/* Enhanced: voice-leading, chord type colors, session indicators, rewards */

// ── Piano keyboard SVG ──
function pianoSVG(chordObj, opts) {
  if (!opts) opts = {};
  var width = opts.width || 380;
  var startMidi = opts.startMidi || 48;
  var endMidi = opts.endMidi || 72;
  var showFingers = opts.showFingers !== false;
  var animate = opts.animate !== false;
  var hideKeys = opts.hideKeys || false;
  var useTypeColors = opts.useTypeColors !== false;

  // Determine which MIDI notes to highlight
  var highlighted = {};
  if (chordObj && !hideKeys) {
    var midis = chordMidi(chordObj);
    var fingers = chordFingers(chordObj);
    var color = useTypeColors ? (chordObj.color || "#FF6B6B") : "#FF6B6B";
    midis.forEach(function(m, i) {
      highlighted[m] = {
        color: color,
        finger: fingers[i] || ""
      };
    });
  }

  var whiteKeys = [];
  var blackKeys = [];
  for (var m = startMidi; m <= endMidi; m++) {
    var note = m % 12;
    if ([1,3,6,8,10].indexOf(note) >= 0) blackKeys.push(m);
    else whiteKeys.push(m);
  }

  var wkW = width / whiteKeys.length;
  var wkH = wkW * 5;
  var bkW = wkW * 0.6;
  var bkH = wkH * 0.62;
  var svgH = wkH + 30;

  var whiteX = {};
  whiteKeys.forEach(function(m, i) { whiteX[m] = i * wkW; });

  function blackKeyX(midi) {
    var leftWhite = midi - 1;
    var rightWhite = midi + 1;
    if (whiteX[leftWhite] !== undefined && whiteX[rightWhite] !== undefined) {
      return (whiteX[leftWhite] + whiteX[rightWhite]) / 2 + wkW / 2 - bkW / 2;
    }
    if (whiteX[leftWhite] !== undefined) {
      return whiteX[leftWhite] + wkW - bkW / 2;
    }
    return 0;
  }

  var accLabel = "Piano keyboard";
  if (chordObj && !hideKeys) {
    var noteNames = chordMidi(chordObj).map(function(m) { return midiToNote(m) + midiToOctave(m); });
    accLabel = "Piano keyboard showing: " + noteNames.join(", ");
  }

  var svg = '<svg viewBox="0 0 ' + width + ' ' + svgH + '" width="' + width + '" style="max-width:100%" role="img" aria-label="' + escHTML(accLabel) + '"><title>' + escHTML(accLabel) + '</title>';

  // White keys
  whiteKeys.forEach(function(m, i) {
    var x = i * wkW;
    var hl = highlighted[m];
    var fill = hl ? hl.color : (hideKeys ? "var(--bg-card)" : "#fff");
    var stroke = "var(--svg-string, #999)";
    var animStr = animate && hl ? ' style="animation:keyPress 0.4s ' + (i * 0.08) + 's both"' : "";
    svg += '<rect x="' + x + '" y="0" width="' + (wkW - 1) + '" height="' + wkH + '" rx="2" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1"' + animStr + ' class="piano-key piano-white" data-midi="' + m + '"/>';

    if (!hideKeys) {
      var noteName = midiToNote(m);
      var oct = midiToOctave(m);
      var isC = noteName === "C";
      svg += '<text x="' + (x + wkW/2) + '" y="' + (wkH - 6) + '" text-anchor="middle" font-size="' + (wkW * 0.32) + '" fill="' + (hl ? '#fff' : 'var(--text-muted, #999)') + '" font-weight="' + (isC ? 'bold' : 'normal') + '">' + noteName + (isC ? oct : '') + '</text>';
    }

    if (showFingers && hl && hl.finger) {
      svg += '<text x="' + (x + wkW/2) + '" y="' + (wkH + 18) + '" text-anchor="middle" font-size="' + (wkW * 0.38) + '" fill="var(--text-primary, #333)" font-weight="bold">' + hl.finger + '</text>';
    }
  });

  // Black keys
  blackKeys.forEach(function(m) {
    var x = blackKeyX(m);
    var hl = highlighted[m];
    var fill = hl ? hl.color : (hideKeys ? "var(--bg-card)" : "#222");
    var animStr = animate && hl ? ' style="animation:keyPress 0.4s 0.1s both"' : "";
    svg += '<rect x="' + x + '" y="0" width="' + bkW + '" height="' + bkH + '" rx="2" fill="' + fill + '" stroke="#000" stroke-width="1"' + animStr + ' class="piano-key piano-black" data-midi="' + m + '"/>';

    if (showFingers && hl && hl.finger) {
      svg += '<text x="' + (x + bkW/2) + '" y="' + (bkH + 14) + '" text-anchor="middle" font-size="' + (bkW * 0.55) + '" fill="' + hl.color + '" font-weight="bold">' + hl.finger + '</text>';
    }
  });

  svg += '</svg>';
  return svg;
}

// ── Progress ring ──
function ringHTML(pct, size, color) {
  if (!size) size = 48;
  if (!color) color = "var(--accent)";
  var r = (size - 6) / 2;
  var circ = 2 * Math.PI * r;
  var offset = circ * (1 - pct / 100);
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="var(--bg-input, #eee)" stroke-width="4"/>' +
    '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 ' + (size/2) + ' ' + (size/2) + ')" style="transition:stroke-dashoffset 0.5s"/>' +
    '<text x="' + (size/2) + '" y="' + (size/2 + 4) + '" text-anchor="middle" font-size="' + (size * 0.28) + '" fill="var(--text-primary)" font-weight="bold">' + Math.round(pct) + '%</text></svg>';
}

// ── Session step indicator (Spark/Review/NewMove/SongSlice/VictoryLap) ──
function sessionStepIndicator(currentStep) {
  var steps = ["spark","review","newMove","songSlice","victoryLap"];
  var labels = ["Spark","Review","New Move","Song","Victory"];
  var stepIdx = steps.indexOf(currentStep);

  var html = '<div class="step-indicator">';
  steps.forEach(function(s, i) {
    var cls = "step-dot";
    if (i < stepIdx) cls += " done";
    else if (i === stepIdx) cls += " active";
    html += '<div class="' + cls + '"></div>';
    if (i < steps.length - 1) {
      html += '<div class="step-line' + (i < stepIdx ? ' done' : '') + '"></div>';
    }
  });
  html += '</div>';
  html += '<div class="step-labels">';
  labels.forEach(function(l, i) {
    var color = i === stepIdx ? "var(--accent)" : (i < stepIdx ? "var(--success)" : "var(--text-muted)");
    html += '<span class="step-label" style="color:' + color + '">' + l + '</span>';
  });
  html += '</div>';
  return html;
}

// ── New Move phase indicator (Watch/Shadow/Try/Refine) ──
function newMovePhaseIndicator(currentPhase) {
  var phases = ["watch","shadow","try","refine"];
  var labels = ["Watch","Shadow","Try","Refine"];
  var phaseIdx = phases.indexOf(currentPhase);

  var html = '<div class="phase-indicator">';
  phases.forEach(function(p, i) {
    var cls = "phase-pill";
    if (i < phaseIdx) cls += " done";
    else if (i === phaseIdx) cls += " active";
    html += '<span class="' + cls + '">' + labels[i] + '</span>';
  });
  html += '</div>';
  return html;
}

// ── Adaptive BPM display ──
function adaptiveBpmDisplay(current, personalBest) {
  var html = '<div class="bpm-display">';
  html += '<div><span class="bpm-current">' + current + '</span><div class="bpm-label">BPM</div></div>';
  if (personalBest && personalBest > 0) {
    html += '<div class="bpm-pb">PB: ' + personalBest + '</div>';
  }
  html += '</div>';
  return html;
}

// ── If-Then intention card (stickiness #2) ──
function ifThenCard(intention) {
  if (!intention) return "";
  return '<div class="intention-card"><span class="intention-icon">\u{1F3AF}</span> <strong>Your intention:</strong> ' + escHTML(intention) + '</div>';
}

// ── Delayed feedback card (stickiness #5) ──
function delayedFeedbackCard(message, isCorrect) {
  var cls = isCorrect ? "correct" : "incorrect";
  return '<div class="feedback-card ' + cls + '">' +
    '<div class="feedback-text">' + escHTML(message) + '</div>' +
    '</div>';
}

// ── LH pattern visualization ──
function lhPatternViz(patternId, bpm) {
  var pattern = null;
  for (var i = 0; i < LH_PATTERNS.length; i++) {
    if (LH_PATTERNS[i].id === patternId) { pattern = LH_PATTERNS[i]; break; }
  }
  if (!pattern) return "";

  var html = '<div class="lh-pattern-viz">';
  for (var beat = 1; beat <= 4; beat++) {
    var matched = null;
    for (var j = 0; j < pattern.pattern.length; j++) {
      if (Math.floor(pattern.pattern[j].beat) === beat) {
        matched = pattern.pattern[j];
        break;
      }
    }
    var height = matched ? (matched.note === "root" ? 50 : matched.note === "fifth" ? 35 : 25) : 10;
    var cls = "lh-beat" + (matched ? " " + matched.note : "");
    html += '<div class="' + cls + '" style="height:' + height + 'px" title="Beat ' + beat + (matched ? ": " + matched.note : "") + '"></div>';
  }
  html += '</div>';
  html += '<div class="text-center text-muted">' + escHTML(pattern.name) + ' \u2022 ' + escHTML(pattern.desc) + '</div>';
  return html;
}

// ── Reward animation HTML ──
function rewardAnimationHTML(type, xpAmount) {
  var variant = Math.floor(Math.random() * 4) + 1;
  var icons = ["\u{2B50}", "\u{1F31F}", "\u{1F389}", "\u{1F3B5}", "\u{26A1}", "\u{1F525}"];
  var icon = icons[Math.floor(Math.random() * icons.length)];

  if (type === "jackpot") {
    return '<div class="reward-popup jackpot-popup">' +
      '<div class="reward-icon">\u{1F340}\u{1F4B0}\u{1F340}</div>' +
      '<div class="reward-text">JACKPOT!</div>' +
      '<div class="reward-xp">+' + xpAmount + ' XP</div></div>';
  }

  return '<div class="reward-popup reward-anim-' + variant + '">' +
    '<div class="reward-icon">' + icon + '</div>' +
    '<div class="reward-xp">+' + xpAmount + ' XP</div></div>';
}

// ── Play style visualization ──
function styleHTML(styleObj) {
  if (!styleObj) return "";
  var beats = styleObj.pattern;
  var html = '<div class="style-vis">';
  beats.forEach(function(b, i) {
    var label = b;
    if (b === "all") label = "\u{1D160}";
    else if (b === "1") label = "L";
    else if (b === "2") label = "M";
    else if (b === "3") label = "H";
    var cls = b === "all" ? "beat-all" : "beat-single";
    html += '<span class="beat ' + cls + '" style="animation-delay:' + (i * 0.1) + 's">' + label + '</span>';
  });
  html += '</div>';
  return html;
}

// ── Badge checking (expanded for 8 levels) ──
function checkBadges() {
  var newBadges = [];
  for (var i = 0; i < BADGES.length; i++) {
    var b = BADGES[i];
    if (b.check && b.check() && S.earned.indexOf(b.id) < 0) {
      S.earned.push(b.id);
      newBadges.push(b.id);
    }
  }
  if (newBadges.length) {
    saveState();
    playSound("badge");
  }
  return newBadges;
}

// ── Chord mastery tier ──
function getChordTier(pct) {
  if (pct >= 75) return { tier: "gold", icon: "\u{1F947}", color: "#FFD700" };
  if (pct >= 50) return { tier: "silver", icon: "\u{1F948}", color: "#C0C0C0" };
  if (pct >= 25) return { tier: "bronze", icon: "\u{1F949}", color: "#CD7F32" };
  return { tier: "none", icon: "", color: "" };
}

function tierBadgeHTML(pct) {
  var t = getChordTier(pct);
  return t.icon ? '<span class="tier-badge" title="' + t.tier + '">' + t.icon + '</span>' : "";
}

// ── Micro achievements during session ──
function fireMicro(elapsed, total) {
  if (Math.abs(elapsed - Math.floor(total * 0.5)) < 1) return "Halfway there!";
  if (Math.abs(elapsed - Math.floor(total * 0.75)) < 1) return "Almost done!";
  if (Math.abs(elapsed - 30) < 1) return "Great start!";
  return null;
}

// ── Confetti ──
function showConfetti() {
  var container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  var colors = ["#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
  for (var i = 0; i < 30; i++) {
    var piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = (Math.random() * 100) + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.5) + "s";
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    container.appendChild(piece);
  }

  setTimeout(function() {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 2500);
}

// ── Scale keyboard visualization ──
function scaleSVG(scaleNotes, width) {
  if (!width) width = 380;
  var startMidi = Math.min.apply(null, scaleNotes) - 2;
  var endMidi = Math.max.apply(null, scaleNotes) + 2;

  var fakeChord = {
    short: "_scale",
    color: "hsl(200, 70%, 55%)",
    rootPosition: {
      midi: scaleNotes,
      fingers_rh: scaleNotes.map(function() { return ""; }),
      notes: scaleNotes.map(function(m) { return midiToNote(m) + midiToOctave(m); })
    },
    bassMidi: 0,
    type: "major"
  };

  return pianoSVG(fakeChord, { width: width, startMidi: startMidi, endMidi: endMidi, showFingers: false });
}

// ── Helpers ──
function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function clickableDiv(onclick, content, cls) {
  if (!cls) cls = "";
  return '<div class="' + cls + '" role="button" tabindex="0" onclick="' + onclick + '" onkeydown="if(event.key===\'Enter\')' + onclick + '">' + content + '</div>';
}

function formatTime(s) {
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return m + ":" + (sec < 10 ? "0" : "") + sec;
}

// ── Chord detection confidence bar ──
function detectionConfidenceHTML() {
  var conf = getDetectionConfidence();
  if (conf.samples === 0) return "";
  var color = conf.avg >= 70 ? "var(--success, #10b981)"
            : conf.avg >= 40 ? "var(--warning, #f59e0b)"
            : "var(--danger, #ef4444)";
  return '<div class="confidence-bar-wrap" title="Rolling chord match accuracy">' +
    '<div class="confidence-bar" style="width:' + conf.avg + '%;background:' + color + '"></div>' +
    '<span class="confidence-label">' + conf.avg + '% match</span>' +
    '</div>';
}
