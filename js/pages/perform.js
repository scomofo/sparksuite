/* ===== ChordSpark: Perform Page ===== */

var _calibTaps = [];
var _calibInterval = null;
var _calibBeat = 0;

function startCalibration() {
  _calibTaps = [];
  _calibBeat = 0;
  var bpm = (typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.latency.calibrationBpm : 100;
  var beatMs = 60000 / bpm;
  var totalBeats = (typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.latency.calibrationTaps : 8;

  S._calibrating = true;
  S._calibBeatMs = beatMs;
  S._calibTotalBeats = totalBeats;
  S._calibCurrentBeat = 0;
  S._calibExpectedTime = Date.now() + beatMs;

  // Play metronome clicks
  _calibInterval = setInterval(function() {
    _calibBeat++;
    S._calibCurrentBeat = _calibBeat;
    if (S.soundOn && typeof metroClick === "function") metroClick(_calibBeat === 1);
    S._calibExpectedTime = Date.now() + beatMs;
    render();
    if (_calibBeat >= totalBeats) {
      clearInterval(_calibInterval);
      _calibInterval = null;
      finishCalibration();
    }
  }, beatMs);

  render();
}

function recordCalibrationTap() {
  if (!S._calibrating) return;
  var expected = S._calibExpectedTime - S._calibBeatMs;
  var actual = Date.now();
  var offset = actual - expected;
  _calibTaps.push(offset);
  render();
}

function finishCalibration() {
  S._calibrating = false;
  if (_calibTaps.length < 3) {
    render();
    return;
  }
  // Remove outliers (first tap and any > 2 stddev)
  _calibTaps.shift(); // first tap is usually late
  var sum = 0;
  for (var i = 0; i < _calibTaps.length; i++) sum += _calibTaps[i];
  var avg = sum / _calibTaps.length;

  // Clamp to valid range
  var maxOff = (typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.latency.maxOffsetMs : 200;
  var minOff = (typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.latency.minOffsetMs : -200;
  avg = Math.max(minOff, Math.min(maxOff, Math.round(avg)));

  if (S.performMode === "midi") {
    S.performMidiOffsetMs = avg;
  } else {
    S.performAudioOffsetMs = avg;
  }
  S.performCalibrated = true;
  saveState();
  render();
}

function cancelCalibration() {
  S._calibrating = false;
  if (_calibInterval) { clearInterval(_calibInterval); _calibInterval = null; }
  render();
}

function performPage() {
  var chart = S.performChart;
  if (!chart) return '<div class="perform-page text-center"><p>No chart loaded.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

  var nowSec = S.performCurrentSec;
  var phrase = getPerformancePhraseForTime(chart, nowSec);
  var phraseName = phrase ? phrase.name : "";

  var h = '<div class="perform-page">';

  // Header bar
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'stopPerform\')">&larr; Exit</button>';
  h += '<div class="perform-title">';
  h += '<strong>' + escHTML(chart.title) + '</strong>';
  h += '<span class="perform-artist">' + escHTML(chart.artist || "") + '</span>';
  h += '</div>';
  h += '<div class="perform-phrase-name">' + escHTML(phraseName) + '</div>';
  h += '</div>';

  // Score strip
  h += '<div class="perform-score-strip">';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performScore + '</span><span class="perform-stat-label">Score</span></div>';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performAccuracy + '%</span><span class="perform-stat-label">Accuracy</span></div>';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performCombo + 'x</span><span class="perform-stat-label">Combo</span></div>';
  h += '</div>';

  // Hit feedback
  if (S.performLastHitLabel && Date.now() - S.performLastHitTime < ((typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.ui.hitBadgeMs : 800)) {
    h += '<div class="perform-hit-feedback">' + escHTML(S.performLastHitLabel) + '</div>';
  }

  // Count-in overlay
  if (S.performCountdownActive && S.performCountdownBeats > 0) {
    h += '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:20;background:rgba(0,0,0,.6);pointer-events:none">';
    h += '<div data-count-in style="font-size:72px;font-weight:900;color:#FFE66D;text-shadow:0 4px 20px rgba(0,0,0,.5)">' + S.performCountdownBeats + '</div>';
    h += '</div>';
  }

  // Highway
  h += renderPerformanceHighway(chart, nowSec);

  // Input source badge + detected notes
  h += '<div class="perform-input-badge">' + (S.performInputSource === "midi" ? "MIDI" : "MIC");
  if (S.performInputNotes && S.performInputNotes.length) {
    h += ' &mdash; ';
    for (var ni = 0; ni < S.performInputNotes.length; ni++) {
      h += '<span style="background:var(--chip-bg);color:var(--chip-color);padding:2px 6px;border-radius:6px;margin-left:3px;font-size:11px;font-weight:700">' + escHTML(S.performInputNotes[ni]) + '</span>';
    }
  }
  h += '</div>';

  // Debug overlay
  if (S.performDebug) {
    var debugPhrase = getPerformancePhraseForTime(chart, nowSec);
    h += '<div style="background:rgba(0,0,0,.85);color:#0f0;font-family:monospace;font-size:11px;padding:8px;border-radius:6px;margin:4px 12px">';
    h += 'time: ' + nowSec.toFixed(2) + 's | phrase: ' + (debugPhrase ? debugPhrase.name : '-') + '<br>';
    h += 'speed: ' + S.performSpeed + ' | diff: ' + S.performDifficulty + '<br>';
    h += 'combo: ' + S.performCombo + '/' + S.performMaxCombo + ' | score: ' + S.performScore + '<br>';
    h += 'notes: [' + (S.performInputNotes || []).join(',') + ']<br>';
    h += 'loop: ' + (S.performLoop ? S.performLoop.startSec.toFixed(1) + '-' + S.performLoop.endSec.toFixed(1) : 'off') + '<br>';
    h += 'windows: P' + S.performWindowPerfectMs + '/G' + S.performWindowGoodMs + '/M' + S.performWindowMissMs;
    h += '</div>';
  }

  // Loop practice banner
  if (S.performLoop) {
    var loopPhrase = null;
    if (chart && chart.phrases) {
      for (var li = 0; li < chart.phrases.length; li++) {
        if (chart.phrases[li].id === S.performLoop.phraseId) { loopPhrase = chart.phrases[li]; break; }
      }
    }
    h += '<div style="text-align:center;padding:4px 12px;background:#FFE66D22;border-radius:8px;margin:4px 12px"><span style="font-size:11px;font-weight:700;color:#FFE66D">&#128257; Looping: ' + escHTML(loopPhrase ? loopPhrase.name : 'Phrase') + '</span></div>';
  }

  // Controls
  h += '<div class="perform-controls">';

  // Pause/Resume
  if (S.performPaused) {
    h += '<button class="btn perform-ctrl-btn" onclick="act(\'resumePerform\')" style="background:#4ECDC4;color:#fff">&#9654; Resume</button>';
  } else {
    h += '<button class="btn perform-ctrl-btn" onclick="act(\'pausePerform\')" style="background:#FFE66D;color:#333">&#9208; Pause</button>';
  }

  // Mode toggle
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Input</span>';
  h += '<button class="btn btn-sm' + (S.performMode === "midi" ? " active" : "") + '" onclick="act(\'performMode\',\'midi\')">MIDI</button>';
  h += '<button class="btn btn-sm' + (S.performMode === "mic" ? " active" : "") + '" onclick="act(\'performMode\',\'mic\')">Mic</button>';
  h += '</div>';

  // Difficulty toggle
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Difficulty</span>';
  var diffs = ["easy", "normal", "pro"];
  for (var d = 0; d < diffs.length; d++) {
    h += '<button class="btn btn-sm' + (S.performDifficulty === diffs[d] ? " active" : "") + '" onclick="act(\'performDifficulty\',\'' + diffs[d] + '\')">' + diffs[d].charAt(0).toUpperCase() + diffs[d].slice(1) + '</button>';
  }
  h += '</div>';

  // Speed toggle
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Speed</span>';
  var speeds = [0.5, 0.75, 1.0];
  for (var sp = 0; sp < speeds.length; sp++) {
    h += '<button class="btn btn-sm' + (S.performSpeed === speeds[sp] ? " active" : "") + '" onclick="act(\'performSpeed\',' + speeds[sp] + ')">' + Math.round(speeds[sp] * 100) + '%</button>';
  }
  h += '</div>';

  // Practice presets
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Mix</span>';
  var presets = [
    { id: "full_mix", label: "Full" },
    { id: "no_guitar", label: "No Guitar" },
    { id: "guitar_quiet", label: "Quiet Guitar" },
    { id: "guitar_solo", label: "Solo Guitar" }
  ];
  for (var pr = 0; pr < presets.length; pr++) {
    h += '<button class="btn btn-sm' + (S.performPracticePreset === presets[pr].id ? " active" : "") + '" onclick="act(\'performPracticePreset\',\'' + presets[pr].id + '\')">' + presets[pr].label + '</button>';
  }
  h += '</div>';

  // Loop phrase
  if (S.performLoop) {
    h += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performClearLoop\')" style="background:#FF6B6B;color:#fff">&#128260; Clear Loop</button>';
  } else {
    h += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performLoopPhrase\')" style="background:#4ECDC4;color:#fff">&#128257; Loop Phrase</button>';
  }

  // Calibration
  h += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performCalibrate\')" style="background:var(--input-bg);color:var(--text-secondary)">&#9201; Calibrate</button>';
  var curOffset = S.performMode === "midi" ? S.performMidiOffsetMs : S.performAudioOffsetMs;
  if (curOffset !== 0) {
    h += '<span style="font-size:10px;color:var(--text-muted);margin-left:4px">offset: ' + curOffset + 'ms</span>';
  }

  h += '</div>'; // .perform-controls

  // Calibration section
  if (S._calibrating) {
    h += '<div class="card" style="margin:8px 12px;text-align:center">';
    h += '<div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Calibrating...</div>';
    h += '<div style="font-size:48px;font-weight:900;color:#FFE66D;animation:bn .3s ease">' + (S._calibCurrentBeat || 0) + '/' + (S._calibTotalBeats || 8) + '</div>';
    h += '<p style="font-size:12px;color:var(--text-muted)">Tap spacebar or click when you hear the beat</p>';
    h += '<button class="btn" onclick="recordCalibrationTap()" style="background:#4ECDC4;color:#fff;padding:16px 32px;font-size:16px">TAP</button>';
    h += ' <button class="btn btn-sm" onclick="cancelCalibration()" style="margin-left:8px">Cancel</button>';
    h += '</div>';
  }

  h += '</div>'; // .perform-page
  return h;
}

function performDonePage() {
  var r = S.performResults;
  if (!r) return '<div class="perform-page text-center"><p>No results.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

  var h = '<div class="perform-page text-center" style="padding-top:20px">';
  h += '<div style="font-size:56px;animation:bn .6s ease">&#127928;</div>';
  h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Performance Complete!</h2>';
  h += '<p style="color:var(--text-dim)">' + escHTML(r.title || "") + ' by ' + escHTML(r.artist || "") + '</p>';

  // Stars
  h += '<div style="font-size:32px;margin:12px 0">';
  for (var s = 0; s < 5; s++) {
    h += s < r.stars ? '&#11088;' : '&#9734;';
  }
  h += '</div>';

  // Previous best
  var songKey = S.performChartId || "unknown";
  var prevBest = S.performSongStats[songKey];
  if (prevBest && prevBest.runs > 1) {
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Previous best: ' + prevBest.bestScore + ' pts / ' + prevBest.bestAccuracy + '% / ' + prevBest.bestStars + ' stars (' + prevBest.runs + ' runs)</div>';
  }

  // Summary stats
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">' + (r.totalEvents || 0) + ' events &mdash; ' + ((r.totalEvents || 0) - (r.accuracy ? Math.round(r.accuracy * (r.totalEvents || 0) / 100) : 0)) + ' missed</div>';

  // Mastery badge
  if (typeof getPerformanceStats === "function") {
    var arrType = (S.performChart && S.performChart.arrangementType) || "chords";
    var pStats = getPerformanceStats(S.performChartId || "unknown", arrType, S.performDifficulty);
    if (pStats.mastery !== "none") {
      h += '<div style="margin-bottom:12px"><span style="background:' + getMasteryColor(pStats.mastery) + '22;color:' + getMasteryColor(pStats.mastery) + ';padding:6px 16px;border-radius:12px;font-size:13px;font-weight:800">' + getMasteryIcon(pStats.mastery) + ' ' + pStats.mastery.charAt(0).toUpperCase() + pStats.mastery.slice(1) + '</span></div>';
    }
  }

  // Unlock celebrations
  if (r.unlocks && r.unlocks.length > 0) {
    for (var ui = 0; ui < r.unlocks.length; ui++) {
      h += '<div style="background:linear-gradient(135deg,#FFE66D22,#FF8A5C22);border:1px solid #FFE66D44;border-radius:12px;padding:8px 16px;margin-bottom:8px;text-align:center"><span style="font-weight:800;color:#FFE66D">' + escHTML(r.unlocks[ui].label) + '</span> <span style="font-size:12px;color:var(--text-muted)">+' + r.unlocks[ui].xp + ' XP</span></div>';
    }
  }

  // Stats cards
  h += '<div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap">';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FFE66D">' + r.score + '</div><div style="font-size:11px;color:var(--text-muted)">Score</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#4ECDC4">' + r.accuracy + '%</div><div style="font-size:11px;color:var(--text-muted)">Accuracy</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FF6B6B">' + r.maxCombo + 'x</div><div style="font-size:11px;color:var(--text-muted)">Max Combo</div></div>';
  h += '</div></div>';

  // Phrase breakdown
  if (r.phraseStats && r.phraseStats.length > 0) {
    h += '<div class="card mb20" style="text-align:left"><h3 style="font-size:14px;font-weight:800;margin:0 0 10px;color:var(--text-primary)">Phrase Breakdown</h3>';
    for (var pi = 0; pi < r.phraseStats.length; pi++) {
      var ps = r.phraseStats[pi];
      var pct = ps.total > 0 ? Math.round(ps.scoreSum / ps.total * 100) : 0;
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">';
      h += '<span style="font-size:13px;font-weight:700;color:var(--text-primary)">' + escHTML(ps.name || "Phrase " + (pi + 1)) + '</span>';
      h += '<span style="font-size:12px;color:var(--text-muted)">' + ps.perfects + 'P / ' + ps.goods + 'G / ' + ps.oks + 'O / ' + ps.misses + 'M &mdash; ' + pct + '%</span>';
      h += '</div>';
    }
    h += '</div>';
  }

  // Best and weakest phrases
  if (r.phraseStats && r.phraseStats.length > 1) {
    var bestIdx = 0, worstIdx = 0;
    for (var bi = 1; bi < r.phraseStats.length; bi++) {
      var bAvg = r.phraseStats[bi].total > 0 ? r.phraseStats[bi].scoreSum / r.phraseStats[bi].total : 0;
      var bestAvg = r.phraseStats[bestIdx].total > 0 ? r.phraseStats[bestIdx].scoreSum / r.phraseStats[bestIdx].total : 0;
      var worstAvg = r.phraseStats[worstIdx].total > 0 ? r.phraseStats[worstIdx].scoreSum / r.phraseStats[worstIdx].total : 0;
      if (bAvg > bestAvg) bestIdx = bi;
      if (bAvg < worstAvg) worstIdx = bi;
    }
    h += '<div style="display:flex;gap:10px;margin-bottom:16px">';
    h += '<div class="card" style="flex:1;text-align:center;border:2px solid #4ECDC4;padding:10px"><div style="font-size:11px;color:var(--text-muted)">Best Phrase</div><div style="font-size:14px;font-weight:800;color:#4ECDC4">' + escHTML(r.phraseStats[bestIdx].name) + '</div></div>';
    h += '<div class="card" style="flex:1;text-align:center;border:2px solid #FF6B6B;padding:10px"><div style="font-size:11px;color:var(--text-muted)">Weakest Phrase</div><div style="font-size:14px;font-weight:800;color:#FF6B6B">' + escHTML(r.phraseStats[worstIdx].name) + '</div></div>';
    h += '</div>';
  }

  // Buttons
  h += '<div class="flex-col">';
  h += '<button class="btn" onclick="act(\'performRetry\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128257; Retry</button>';
  h += '<button class="btn" onclick="act(\'performRetryPhrase\')" style="background:linear-gradient(135deg,#FF6B6B,#FFE66D);color:#333">&#128170; Retry Weakest</button>';
  h += '<button class="btn" onclick="act(\'tab\',\'songs\')" style="background:#4ECDC4;color:#fff">&#127968; Songs</button>';
  h += '</div>';

  // Next step recommendation
  if(typeof buildPerformanceRecommendationsForSong==="function"&&r.title){
    var songId=(r.title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
    var nextRecs=buildPerformanceRecommendationsForSong(songId);
    if(nextRecs&&nextRecs.length){
      h+='<div class="card" style="margin-top:12px;text-align:left"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Next Step</div>';
      h+='<div style="font-size:13px;color:var(--text-primary)">'+escHTML(nextRecs[0].label)+'</div>';
      h+='<div style="font-size:11px;color:var(--text-dim)">'+escHTML(nextRecs[0].reason)+'</div></div>';
    }
  }

  h += '</div>';
  return h;
}
