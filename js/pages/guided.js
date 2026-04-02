// ===== ChordSpark: Guided Session Pages =====
// Mirrors PianoSpark's 5-phase session flow: Spark → Review → NewMove → SongSlice → VictoryLap
// NewMove uses Watch→Shadow→Try→Refine (stickiness technique #3)

function guidedStepIndicator(step) {
  var steps = [
    {id:"spark",label:"Spark",icon:"&#10024;"},
    {id:"review",label:"Review",icon:"&#128260;"},
    {id:"newMove",label:"New Move",icon:"&#127919;"},
    {id:"songSlice",label:"Song",icon:"&#127925;"},
    {id:"victoryLap",label:"Victory",icon:"&#127942;"}
  ];
  var h = '<div style="display:flex;gap:4px;justify-content:center;margin-bottom:16px">';
  var reached = false;
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i], active = step === s.id;
    if (active) reached = true;
    var done = !reached && !active;
    h += '<div style="flex:1;text-align:center;padding:6px 2px;border-radius:10px;font-size:11px;font-weight:700;background:' +
      (active ? 'linear-gradient(135deg,#FF6B6B,#FF8A5C)' : done ? '#4ECDC422' : 'var(--input-bg)') +
      ';color:' + (active ? '#fff' : done ? '#4ECDC4' : 'var(--text-muted)') + '">' +
      (done ? '&#9989; ' : '') + s.icon + '<br>' + s.label + '</div>';
  }
  h += '</div>';
  return h;
}

function newMovePhaseIndicator(phase) {
  var phases = [
    {id:"watch",label:"Watch",icon:"&#128064;"},
    {id:"shadow",label:"Shadow",icon:"&#129306;"},
    {id:"try",label:"Try",icon:"&#127919;"},
    {id:"refine",label:"Refine",icon:"&#128161;"}
  ];
  var h = '<div style="display:flex;gap:6px;justify-content:center;margin:10px 0">';
  var reached = false;
  for (var i = 0; i < phases.length; i++) {
    var p = phases[i], active = phase === p.id;
    if (active) reached = true;
    var done = !reached && !active;
    h += '<span style="padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;background:' +
      (active ? '#4ECDC4' : done ? '#4ECDC422' : 'var(--input-bg)') +
      ';color:' + (active ? '#fff' : done ? '#4ECDC4' : 'var(--text-muted)') + '">' +
      p.icon + ' ' + p.label + '</span>';
  }
  h += '</div>';
  return h;
}

function guidedSessionPage() {
  var plan = S.guidedPlan;
  if (!plan) return '<div class="card text-center"><p>No session loaded.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

  var h = '<div class="text-center">';
  h += '<button class="back-btn" onclick="if(confirm(\'End session early?\'))act(\'guidedStop\')">&#8592; Exit</button>';
  h += '<h2 style="font-size:20px;font-weight:900;color:var(--text-primary);margin:8px 0">Session ' + plan.num + ': ' + escHTML(plan.title) + '</h2>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Level ' + plan.level + ' &bull; ' + plan.bpm + ' BPM</div>';

  h += guidedStepIndicator(S.guidedStep);

  // Render current step
  switch (S.guidedStep) {
    case "spark": h += _guidedSpark(plan); break;
    case "review": h += _guidedReview(plan); break;
    case "newMove": h += _guidedNewMove(plan); break;
    case "songSlice": h += _guidedSongSlice(plan); break;
    case "victoryLap": h += _guidedVictoryLap(plan); break;
    default: h += '<div class="card"><p>Session complete!</p></div>';
  }

  h += '</div>';
  return h;
}

function _guidedSpark(plan) {
  var h = '<div class="card mb16" style="border-left:4px solid #FFE66D">';
  h += '<h3 style="margin:0 0 8px;font-size:16px;color:#FFE66D;font-weight:800">&#10024; Spark</h3>';
  h += '<p style="margin:0 0 16px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(plan.spark.text) + '</p>';
  if (plan.ifThen) {
    h += '<div style="background:var(--input-bg);border-radius:12px;padding:10px;margin-bottom:12px;font-size:12px;color:var(--text-muted);font-style:italic">&#8220;' + escHTML(plan.ifThen) + '&#8221;</div>';
  }
  h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333;padding:12px 28px;font-weight:800">Next &#8594;</button>';
  h += '</div>';
  return h;
}

function _guidedReview(plan) {
  if (!plan.review) {
    return '<div class="card mb16"><h3 style="margin:0 0 8px;font-size:16px;color:#4ECDC4;font-weight:800">&#128260; Review</h3>' +
      '<p style="color:var(--text-muted)">No review for this session \u2014 it\'s your first!</p>' +
      '<button class="btn" onclick="act(\'guidedNext\')" style="background:#4ECDC4;color:#fff;padding:12px 28px;font-weight:800">Next &#8594;</button></div>';
  }
  var h = '<div class="card mb16" style="border-left:4px solid #4ECDC4">';
  h += '<h3 style="margin:0 0 8px;font-size:16px;color:#4ECDC4;font-weight:800">&#128260; Review</h3>';
  h += '<p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(plan.review.text) + '</p>';
  // Show review chord diagrams
  if (plan.review.chords) {
    h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px">';
    for (var i = 0; i < plan.review.chords.length; i++) {
      var ch = null;
      for (var j = 0; j < ALL_CHORDS.length; j++) if (ALL_CHORDS[j].name === plan.review.chords[i]) { ch = ALL_CHORDS[j]; break; }
      if (ch) {
        h += '<div style="text-align:center"><div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:4px">' + ch.short + '</div>';
        h += chordSVG(ch, 100) + '</div>';
      }
    }
    h += '</div>';
  }
  h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:#4ECDC4;color:#fff;padding:12px 28px;font-weight:800">Next &#8594;</button>';
  h += '</div>';
  return h;
}

function _guidedNewMove(plan) {
  if (!plan.newMove) return '';
  var h = '<div class="card mb16" style="border-left:4px solid #FF6B6B">';
  h += '<h3 style="margin:0 0 8px;font-size:16px;color:#FF6B6B;font-weight:800">&#127919; New Move</h3>';
  h += newMovePhaseIndicator(S.newMovePhase);

  // Find chord
  var ch = null;
  for (var i = 0; i < ALL_CHORDS.length; i++) if (ALL_CHORDS[i].name === plan.newMove.chord) { ch = ALL_CHORDS[i]; break; }

  switch (S.newMovePhase) {
    case "watch":
      h += '<div style="background:#FF6B6B11;border-radius:12px;padding:12px;margin-bottom:12px">';
      h += '<div style="font-size:14px;font-weight:800;color:#FF6B6B;margin-bottom:6px">&#128064; Watch \u2014 Hands Off!</div>';
      h += '<p style="margin:0;font-size:13px;color:var(--text-secondary)">Observe the chord shape and finger placement. Don\'t play yet.</p>';
      h += '</div>';
      if (ch) {
        h += '<div class="flex-center" style="margin-bottom:12px">' + chordSVG(ch, 200, ch.name, true) + '</div>';
        h += '<button onclick="act(\'previewChord\',\'' + ch.name + '\')" style="background:none;font-size:14px;color:var(--text-muted);margin-bottom:12px">&#128264; Listen</button><br>';
      }
      h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#FF6B6B;color:#fff;padding:12px 28px;font-weight:800">I\'ve Watched &#8594;</button>';
      break;

    case "shadow":
      h += '<div style="background:#45B7D111;border-radius:12px;padding:12px;margin-bottom:12px">';
      h += '<div style="font-size:14px;font-weight:800;color:#45B7D1;margin-bottom:6px">&#129306; Shadow \u2014 Mirror Slowly</div>';
      h += '<p style="margin:0;font-size:13px;color:var(--text-secondary)">Copy what you saw. Place your fingers on the strings. No pressure to be perfect.</p>';
      h += '</div>';
      if (ch) h += '<div class="flex-center" style="margin-bottom:12px">' + chordSVG(ch, 200) + '</div>';
      h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#45B7D1;color:#fff;padding:12px 28px;font-weight:800">I\'ve Shadowed &#8594;</button>';
      break;

    case "try":
      h += '<p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(plan.newMove.text) + '</p>';
      if (ch) {
        h += '<div class="flex-center" style="margin-bottom:12px">' + chordSVG(ch, 180) + '</div>';
        h += '<button onclick="act(\'previewChord\',\'' + ch.name + '\')" style="background:none;font-size:13px;color:var(--text-muted);margin-bottom:8px">&#128264; Listen</button><br>';
      }
      if (plan.newMove.strum) {
        h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Strum: <strong>' + escHTML(plan.newMove.strum) + '</strong> at ' + plan.bpm + ' BPM</div>';
      }
      h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#4ECDC4;color:#fff;padding:12px 28px;font-weight:800">I Can Play It &#8594;</button>';
      break;

    case "refine":
      h += '<div style="background:#A78BFA11;border-radius:12px;padding:12px;margin-bottom:12px">';
      h += '<div style="font-size:14px;font-weight:800;color:#A78BFA;margin-bottom:6px">&#128161; Refine</div>';
      h += '<p style="margin:0;font-size:13px;color:var(--text-secondary)">Focus on clean transitions and consistent finger placement.</p>';
      h += '</div>';
      if (ch) h += '<div class="flex-center" style="margin-bottom:12px">' + chordSVG(ch, 160) + '</div>';
      // Transition tip
      var tipKey = plan.review && plan.review.chords ? plan.review.chords[0] + "->" + plan.newMove.chord : null;
      var tip = tipKey ? TRANSITION_TIPS[tipKey] : null;
      if (tip) {
        h += '<div style="background:var(--input-bg);border-radius:12px;padding:10px;margin-bottom:12px;font-size:12px">';
        h += '<span style="color:#4ECDC4;font-weight:700">&#128161; Tip:</span> <span style="color:var(--text-secondary)">' + escHTML(tip) + '</span></div>';
      }
      h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:#A78BFA;color:#fff;padding:12px 28px;font-weight:800">Done &#8594;</button>';
      break;
  }
  h += '</div>';
  return h;
}

function _guidedSongSlice(plan) {
  if (!plan.songSlice) return '';
  var h = '<div class="card mb16" style="border-left:4px solid #45B7D1">';
  h += '<h3 style="margin:0 0 8px;font-size:16px;color:#45B7D1;font-weight:800">&#127925; Song Slice</h3>';
  h += '<p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(plan.songSlice.text) + '</p>';
  if (plan.songSlice.song) {
    h += '<div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:12px">&#127926; ' + escHTML(plan.songSlice.song) + '</div>';
  }
  h += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">';
  h += '<button class="btn" onclick="act(\'toggleMetro\')" style="padding:8px 16px;font-size:13px;background:' + (S.metronomeOn ? '#FFE66D' : '#4ECDC4') + ';color:' + (S.metronomeOn ? '#333' : '#fff') + '">' + (S.metronomeOn ? '&#9632; Metro' : '&#9654; Metro') + '</button>';
  h += '</div>';
  h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:#45B7D1;color:#fff;padding:12px 28px;font-weight:800">Done &#8594;</button>';
  h += '</div>';
  return h;
}

function _guidedVictoryLap(plan) {
  if (!plan.victoryLap) return '';
  var h = '<div class="card mb16" style="border-left:4px solid #FFE66D;background:linear-gradient(135deg,#FFE66D11,#FF8A5C11)">';
  h += '<h3 style="margin:0 0 8px;font-size:16px;color:#FFE66D;font-weight:800">&#127942; Victory Lap!</h3>';
  h += '<p style="margin:0 0 16px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(plan.victoryLap.text) + '</p>';
  // Show the session's main chord
  var ch = null;
  if (plan.newMove) {
    for (var i = 0; i < ALL_CHORDS.length; i++) if (ALL_CHORDS[i].name === plan.newMove.chord) { ch = ALL_CHORDS[i]; break; }
  }
  if (ch) {
    h += '<div class="flex-center" style="margin-bottom:12px">' + chordSVG(ch, 160) + '</div>';
    h += '<button onclick="act(\'previewChord\',\'' + ch.name + '\')" style="background:none;font-size:13px;color:var(--text-muted);margin-bottom:12px">&#128264; Listen</button><br>';
  }
  h += '<button class="btn" onclick="act(\'guidedComplete\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333;padding:14px 32px;font-size:16px;font-weight:900">&#127881; Complete Session!</button>';
  h += '</div>';
  return h;
}

function guidedDonePage() {
  var plan = S.guidedPlan;
  var title = plan ? plan.title : "";
  var num = plan ? plan.num : 0;
  var h = '<div class="text-center" style="padding-top:30px">';
  h += '<div style="font-size:56px;animation:bn .6s ease">&#127881;</div>';
  h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Session ' + num + ' Complete!</h2>';
  h += '<p style="color:var(--text-dim);font-size:15px;margin-bottom:20px">' + escHTML(title) + '</p>';
  h += '<div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center">';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FFE66D">+30</div><div style="font-size:11px;color:var(--text-muted)">XP</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FF6B6B">&#128293;' + S.streak + '</div><div style="font-size:11px;color:var(--text-muted)">Streak</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#4ECDC4">' + (S.completedGuidedSessions ? S.completedGuidedSessions.length : 0) + '/22</div><div style="font-size:11px;color:var(--text-muted)">Sessions</div></div>';
  h += '</div></div>';
  h += '<div class="flex-col"><button class="btn" onclick="act(\'guidedStart\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#9654; Next Session</button>';
  h += '<button class="btn" onclick="act(\'tab\',\'practice\')" style="background:#4ECDC4;color:#fff;margin-top:8px">&#127968; Home</button></div>';
  h += '</div>';
  return h;
}
