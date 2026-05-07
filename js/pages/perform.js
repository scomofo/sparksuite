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

function formatTechniqueFocusLabel(key) {
  var normalizedKey;
  var labels = {
    open: "Open-note timing",
    tap: "Tap-note consistency",
    forced: "Forced-note transitions",
    specialPhrase: "Phrase section control"
  };
  if (typeof key === "string") {
    normalizedKey = key.trim();
    if (normalizedKey) {
      normalizedKey = normalizedKey.toLowerCase();
      if (normalizedKey === "undefined" || normalizedKey === "null" || normalizedKey === "nan") {
        normalizedKey = "";
      }
    }
  } else {
    normalizedKey = "";
  }
  return labels[normalizedKey] || (normalizedKey ? normalizedKey : "Technique");
}

function eventMatchesTechniqueFocus(evt, key) {
  var flags = evt && evt.sourceFlags ? evt.sourceFlags : null;
  var normalizedKey = typeof key === "string" ? key.trim() : "";
  if (normalizedKey) {
    normalizedKey = normalizedKey.toLowerCase();
    if (normalizedKey === "undefined" || normalizedKey === "null" || normalizedKey === "nan") {
      normalizedKey = "";
    }
  }
  if (!flags || !normalizedKey) return false;
  return !!flags[normalizedKey];
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
    S.performMicOffsetMs = avg;
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

// Wrapper — see js/utils/normalize.js for the canonical implementation.
(function(root){
  if(!root)return;
  root.SparkPerformanceRunCalibration = {
    start: startCalibration,
    tap: recordCalibrationTap,
    cancel: cancelCalibration
  };
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : null));

function normalizePerformPageTextToken(value) { return SparkNormalize.textToken(value); }

function firstPerformPageTextToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = normalizePerformPageTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizePerformPageNumber(value, fallback) { return SparkNormalize.number(value, fallback); }

function getPerformancePracticePresetOptions() {
  var stemLabel = typeof getPerformancePracticePresetStemLabel === "function"
    ? getPerformancePracticePresetStemLabel()
    : "Guitar";
  return [
    { id: "full_mix", label: "Full" },
    { id: "no_guitar", label: "No " + stemLabel },
    { id: "guitar_quiet", label: "Quiet " + stemLabel },
    { id: "guitar_solo", label: "Solo " + stemLabel }
  ];
}

function getPerformPageMicOffsetMs() {
  if (typeof S.performMicOffsetMs === "number" && isFinite(S.performMicOffsetMs)) return S.performMicOffsetMs;
  return 0;
}

function renderPerformControlSection(label, body, accentColor) {
  var borderColor = accentColor || "rgba(255,255,255,.08)";
  return '<div style="display:flex;flex-direction:column;gap:8px;min-width:0;padding:12px;border-radius:16px;border:1px solid ' + borderColor + ';background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.14));box-shadow:inset 0 1px 0 rgba(255,255,255,.03)">' +
    '<div class="card-section-heading">' + escHTML(label) + '</div>' +
    '<div class="perform-toggle-group" style="justify-content:flex-start;gap:6px;margin:0">' + body + '</div>' +
    '</div>';
}

function getPerformPageCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function performPage() {
  var chart = S.performChart;
  if (!chart) return '<div class="perform-page text-center"><p>No chart loaded.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';
  var coreView = getPerformPageCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var targetTechnique = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceTargetTechnique")
    ? runtimeState.performanceTargetTechnique
    : S.performTargetTechnique;

  var nowSec = runtimeState && typeof runtimeState.transport.positionMs === "number"
    ? runtimeState.transport.positionMs / 1000
    : S.performCurrentSec;
  var phrase = getPerformancePhraseForTime(chart, nowSec);
  var phraseName = firstPerformPageTextToken(phrase ? phrase.name : "", "Phrase");
  var chartTitle = firstPerformPageTextToken(chart.title, chart.songTitle, chart.id, "Performance chart");
  var chartArtist = firstPerformPageTextToken(chart.artist, "Unknown Artist");
  var performLastHitLabel = firstPerformPageTextToken(S.performLastHitLabel);
  var previewEvent = getNextPerformEvent(chart, nowSec);
  var techniquePreview = typeof getImportedTechniquePreview === "function"
    ? getImportedTechniquePreview(chart, nowSec, 3)
    : [];

  var h = '<div class="perform-page">';

  // Header bar
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'stopPerform\')">&larr; Exit</button>';
  h += '<div class="perform-title">';
  h += '<strong>' + escHTML(chartTitle) + '</strong>';
  h += '<span class="perform-artist">' + escHTML(chartArtist) + '</span>';
  h += '</div>';
  h += '<div class="perform-phrase-name">' + escHTML(phraseName) + '</div>';
  h += '</div>';

  if (targetTechnique) {
    h += '<div style="display:flex;justify-content:center;padding:4px 12px 0">';
    h += '<span style="background:linear-gradient(135deg,#FF8A5C,#FFE66D);color:#3a2b00;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.03em">FOCUS: ' + escHTML(formatTechniqueFocusLabel(targetTechnique).toUpperCase()) + '</span>';
    h += '</div>';
  }

  // Score strip
  h += '<div class="perform-score-strip">';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performScore + '</span><span class="perform-stat-label">Score</span></div>';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performAccuracy + '%</span><span class="perform-stat-label">Accuracy</span></div>';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performCombo + 'x</span><span class="perform-stat-label">Combo</span></div>';
  h += '</div>';

  // Hit feedback
  if (performLastHitLabel && Date.now() - S.performLastHitTime < ((typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.ui.hitBadgeMs : 800)) {
    h += '<div class="perform-hit-feedback">' + escHTML(performLastHitLabel) + '</div>';
  }

  // Count-in overlay
  if (S.performCountdownActive && S.performCountdownBeats > 0) {
    h += '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:20;background:rgba(0,0,0,.6);pointer-events:none">';
    h += '<div data-count-in style="font-size:72px;font-weight:900;color:#FFE66D;text-shadow:0 4px 20px rgba(0,0,0,.5)">' + S.performCountdownBeats + '</div>';
    h += '</div>';
  }

  // Highway
  h += renderPerformanceHighway(chart, nowSec);

  if (techniquePreview.length) {
    h += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;padding:6px 12px 0">';
    for (var ti = 0; ti < techniquePreview.length; ti++) {
      var previewLabel = firstPerformPageTextToken(techniquePreview[ti].label, "Technique");
      h += '<span style="background:' + techniquePreview[ti].color + ';color:#fff;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.02em">'
        + escHTML(previewLabel) + '</span>';
    }
    h += '</div>';
  }

  if (previewEvent && previewEvent.sourceFlags && hasImportedTechniqueFlags(previewEvent.sourceFlags)) {
    h += '<div style="text-align:center;padding:4px 12px;margin:4px 12px 0">';
    h += '<span style="font-size:11px;font-weight:700;color:var(--text-muted)">Technique: ' + escHTML(renderImportedTechniqueFlags(previewEvent.sourceFlags)) + '</span>';
    h += '</div>';
  }

  if (targetTechnique && previewEvent && eventMatchesTechniqueFocus(previewEvent, targetTechnique)) {
    h += '<div style="text-align:center;padding:4px 12px;margin:0 12px 0">';
    h += '<span style="font-size:11px;font-weight:800;color:#FF8A5C">Focused technique note incoming</span>';
    h += '</div>';
  }

  // Input source badge + detected notes
  h += '<div class="perform-input-badge" style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:6px 12px;margin:6px 12px 0;border-radius:999px;background:rgba(9,12,20,.7);border:1px solid rgba(255,255,255,.08);box-shadow:0 12px 28px rgba(0,0,0,.18)">' + (S.performInputSource === "midi" ? "MIDI" : "MIC");
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
    var debugTime = normalizePerformPageNumber(nowSec, 0);
    var debugLoopStart = S.performLoop ? normalizePerformPageNumber(S.performLoop.startSec, 0) : 0;
    var debugLoopEnd = S.performLoop ? normalizePerformPageNumber(S.performLoop.endSec, 0) : 0;
    h += '<div style="background:rgba(0,0,0,.85);color:#0f0;font-family:monospace;font-size:11px;padding:8px;border-radius:6px;margin:4px 12px">';
    h += 'time: ' + debugTime.toFixed(2) + 's | phrase: ' + (debugPhrase ? debugPhrase.name : '-') + '<br>';
    h += 'speed: ' + S.performSpeed + ' | diff: ' + S.performDifficulty + '<br>';
    h += 'combo: ' + S.performCombo + '/' + S.performMaxCombo + ' | score: ' + S.performScore + '<br>';
    h += 'notes: [' + (S.performInputNotes || []).join(',') + ']<br>';
    h += 'loop: ' + (S.performLoop ? debugLoopStart.toFixed(1) + '-' + debugLoopEnd.toFixed(1) : 'off') + '<br>';
    h += 'windows: P' + S.performWindowPerfectMs + '/G' + S.performWindowGoodMs + '/M' + S.performWindowMissMs;
    h += '</div>';
  }

  // Loop practice banner
  if (S.performLoop) {
    var loopPhrase = null;
    var loopPhraseName;
    if (chart && chart.phrases) {
      for (var li = 0; li < chart.phrases.length; li++) {
        if (chart.phrases[li].id === S.performLoop.phraseId) { loopPhrase = chart.phrases[li]; break; }
      }
    }
    loopPhraseName = firstPerformPageTextToken(loopPhrase ? loopPhrase.name : "", "Phrase");
    h += '<div style="text-align:center;padding:4px 12px;background:#FFE66D22;border-radius:8px;margin:4px 12px"><span style="font-size:11px;font-weight:700;color:#FFE66D">&#128257; Looping: ' + escHTML(loopPhraseName) + '</span></div>';
  }

  // Controls
  h += '<div class="card" style="margin:10px 12px 0;padding:14px;border-radius:18px;border:1px solid rgba(120,206,255,.12);background:linear-gradient(180deg,rgba(15,19,31,.94),rgba(7,10,18,.94));box-shadow:0 18px 36px rgba(0,0,0,.24)">';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px">';

  // Pause/Resume
  var performPaused = runtimeState && runtimeState.transport ? runtimeState.transport.status === "paused" : S.performPaused;
  if (performPaused) {
    h += '<button class="btn perform-ctrl-btn" onclick="act(\'resumePerform\')" style="background:linear-gradient(135deg,#37d6c8,#6ef1df);color:#06262a;box-shadow:0 10px 24px rgba(78,205,196,.24)">&#9654; Resume</button>';
  } else {
    h += '<button class="btn perform-ctrl-btn" onclick="act(\'pausePerform\')" style="background:linear-gradient(135deg,#FFE66D,#FFD36E);color:#3b3000;box-shadow:0 10px 24px rgba(255,230,109,.22)">&#9208; Pause</button>';
  }
  h += '<div style="font-size:11px;color:var(--text-muted);font-weight:700">Tighten timing, change feel, or loop a weak phrase without leaving the run.</div>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">';

  // Mode toggle
  var inputControls = '';
  var performMode = runtimeState && runtimeState.performanceInputMode ? runtimeState.performanceInputMode : S.performMode;
  inputControls += '<button class="btn btn-sm' + (performMode === "midi" ? " active" : "") + '" onclick="act(\'performMode\',\'midi\')">MIDI</button>';
  inputControls += '<button class="btn btn-sm' + (performMode === "mic" ? " active" : "") + '" onclick="act(\'performMode\',\'mic\')">Mic</button>';
  h += renderPerformControlSection("Input", inputControls, "rgba(69,183,209,.28)");

  // Difficulty toggle
  var difficultyControls = '';
  var diffs = ["easy", "normal", "pro"];
  var performDifficulty = runtimeState && runtimeState.performanceDifficultyId ? runtimeState.performanceDifficultyId : S.performDifficulty;
  for (var d = 0; d < diffs.length; d++) {
    difficultyControls += '<button class="btn btn-sm' + (performDifficulty === diffs[d] ? " active" : "") + '" onclick="act(\'performDifficulty\',\'' + diffs[d] + '\')">' + diffs[d].charAt(0).toUpperCase() + diffs[d].slice(1) + '</button>';
  }
  h += renderPerformControlSection("Difficulty", difficultyControls, "rgba(255,138,92,.24)");

  // Speed toggle
  var speedControls = '';
  var speeds = [0.5, 0.75, 1.0];
  var performSpeed = runtimeState && runtimeState.performanceSpeed ? runtimeState.performanceSpeed : S.performSpeed;
  for (var sp = 0; sp < speeds.length; sp++) {
    speedControls += '<button class="btn btn-sm' + (performSpeed === speeds[sp] ? " active" : "") + '" onclick="act(\'performSpeed\',' + speeds[sp] + ')">' + Math.round(speeds[sp] * 100) + '%</button>';
  }
  h += renderPerformControlSection("Speed", speedControls, "rgba(255,230,109,.22)");

  // Practice presets
  var mixControls = '';
  var presets = getPerformancePracticePresetOptions();
  var performPracticePreset = runtimeState && runtimeState.performancePracticePreset ? runtimeState.performancePracticePreset : S.performPracticePreset;
  for (var pr = 0; pr < presets.length; pr++) {
    mixControls += '<button class="btn btn-sm' + (performPracticePreset === presets[pr].id ? " active" : "") + '" onclick="act(\'performPracticePreset\',\'' + presets[pr].id + '\')">' + presets[pr].label + '</button>';
  }
  h += renderPerformControlSection("Mix", mixControls, "rgba(78,205,196,.24)");

  // Loop phrase
  var utilityControls = '';
  var performLoop = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceLoop")
    ? runtimeState.performanceLoop
    : S.performLoop;
  if (performLoop) {
    utilityControls += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performClearLoop\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128260; Clear Loop</button>';
  } else {
    utilityControls += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performLoopPhrase\')" style="background:linear-gradient(135deg,#37d6c8,#4ECDC4);color:#083232">&#128257; Loop Phrase</button>';
  }

  // Calibration
  utilityControls += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performCalibrate\')" style="background:var(--input-bg);color:var(--text-secondary)">&#9201; Calibrate</button>';
  var curOffset = normalizePerformPageNumber(
      S.performMode === "midi" ? S.performMidiOffsetMs : getPerformPageMicOffsetMs(),
    0
  );
  if (curOffset !== 0) {
    utilityControls += '<span style="font-size:10px;color:var(--text-muted);margin-left:4px">offset: ' + curOffset + 'ms</span>';
  }
  h += renderPerformControlSection("Utilities", utilityControls, "rgba(255,255,255,.08)");

  h += '</div>';
  h += '</div>';

  // Calibration section
  if (S._calibrating) {
    var calibCurrentBeat = normalizePerformPageNumber(S._calibCurrentBeat, 0);
    var calibTotalBeats = normalizePerformPageNumber(S._calibTotalBeats, 8);
    h += '<div class="card" style="margin:8px 12px;text-align:center">';
    h += '<div class="card-micro-heading" style="margin-bottom:8px">Calibrating...</div>';
    h += '<div style="font-size:48px;font-weight:900;color:#FFE66D;animation:bn .3s ease">' + calibCurrentBeat + '/' + calibTotalBeats + '</div>';
    h += '<p style="font-size:12px;color:var(--text-muted)">Tap spacebar or click when you hear the beat</p>';
    h += '<div class="action-row" style="justify-content:center"><button class="btn" onclick="act(\'performCalibrationTap\')" style="background:#4ECDC4;color:#fff;padding:16px 32px;font-size:16px">TAP</button>';
    h += '<button class="btn btn-sm" onclick="act(\'performCalibrationCancel\')">Cancel</button></div>';
    h += '</div>';
  }

  h += '</div>'; // .perform-page
  return h;
}

function performDonePage() {
  var coreView = getPerformPageCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var r = runtimeState && runtimeState.performanceResults ? runtimeState.performanceResults : S.performResults;
  var targetTechnique = runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceTargetTechnique")
    ? runtimeState.performanceTargetTechnique
    : S.performTargetTechnique;
  if (!r) return '<div class="perform-page text-center"><p>No results.</p><button class="btn" onclick="act(\'performDoneSongs\')">Songs</button></div>';
  var resultTitle = firstPerformPageTextToken(r.title, r.songTitle, runtimeState && runtimeState.performanceChartId, S.performChartId, "Performance");
  var resultArtist = firstPerformPageTextToken(r.artist, "Unknown Artist");

  var h = '<div class="perform-page text-center" style="padding-top:20px">';
  h += '<div style="font-size:56px;animation:bn .6s ease">&#127928;</div>';
  h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Performance Complete!</h2>';
  h += '<p style="color:var(--text-dim)">' + escHTML(resultTitle) + ' by ' + escHTML(resultArtist) + '</p>';

  // Stars
  h += '<div style="font-size:32px;margin:12px 0">';
  for (var s = 0; s < 5; s++) {
    h += s < r.stars ? '&#11088;' : '&#9734;';
  }
  h += '</div>';

  // Previous best
  var songKey = runtimeState && runtimeState.performanceChartId ? runtimeState.performanceChartId : (S.performChartId || "unknown");
  var prevBest = (S.performSongStats && S.performSongStats[songKey]) || null;
  if (prevBest && prevBest.runs > 1) {
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Previous best: ' + prevBest.bestScore + ' pts / ' + prevBest.bestAccuracy + '% / ' + prevBest.bestStars + ' stars (' + prevBest.runs + ' runs)</div>';
  }

  // Summary stats
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">' + (r.totalEvents || 0) + ' events &mdash; ' + ((r.totalEvents || 0) - (r.accuracy ? Math.round(r.accuracy * (r.totalEvents || 0) / 100) : 0)) + ' missed</div>';

  // Mastery badge
  if (typeof getPerformanceStats === "function") {
    var arrType = (S.performChart && S.performChart.arrangementType)
      || (runtimeState && runtimeState.performanceArrangementType)
      || "chords";
    var difficultyId = runtimeState && runtimeState.performanceDifficultyId ? runtimeState.performanceDifficultyId : S.performDifficulty;
    var pStats = getPerformanceStats(songKey, arrType, difficultyId);
    if (pStats.mastery !== "none") {
      h += '<div style="margin-bottom:12px"><span class="guided-pill" style="background:' + getMasteryColor(pStats.mastery) + '22;color:' + getMasteryColor(pStats.mastery) + '">' + getMasteryIcon(pStats.mastery) + ' ' + pStats.mastery.charAt(0).toUpperCase() + pStats.mastery.slice(1) + '</span></div>';
    }
  }

  // Unlock celebrations
  if (r.unlocks && r.unlocks.length > 0) {
    for (var ui = 0; ui < r.unlocks.length; ui++) {
      var unlockLabel = firstPerformPageTextToken(r.unlocks[ui].label, "Unlock");
      h += '<div style="background:linear-gradient(135deg,#FFE66D22,#FF8A5C22);border:1px solid #FFE66D44;border-radius:12px;padding:8px 16px;margin-bottom:8px;text-align:center"><span style="font-weight:800;color:#FFE66D">' + escHTML(unlockLabel) + '</span> <span style="font-size:12px;color:var(--text-muted)">+' + r.unlocks[ui].xp + ' XP</span></div>';
    }
  }

  // Stats cards
  h += '<div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:12px">';
  h += '<div><div class="metric-value" style="color:#FFE66D">' + r.score + '</div><div class="metric-label">Score</div></div>';
  h += '<div><div class="metric-value" style="color:#4ECDC4">' + r.accuracy + '%</div><div class="metric-label">Accuracy</div></div>';
  h += '<div><div class="metric-value" style="color:#FF6B6B">' + r.maxCombo + 'x</div><div class="metric-label">Max Combo</div></div>';
  h += '</div></div>';

  // Phrase breakdown
  if (r.phraseStats && r.phraseStats.length > 0) {
    h += '<div class="card mb20" style="text-align:left"><div class="card-section-heading" style="margin-bottom:10px">Phrase Breakdown</div>';
    for (var pi = 0; pi < r.phraseStats.length; pi++) {
      var ps = r.phraseStats[pi];
      var pct = ps.total > 0 ? Math.round(ps.scoreSum / ps.total * 100) : 0;
      var phraseLabel = firstPerformPageTextToken(ps.name, "Phrase " + (pi + 1));
      h += '<div class="split-row" style="align-items:center;padding:4px 0;border-bottom:1px solid var(--border);gap:12px">';
      h += '<span class="card-micro-heading">' + escHTML(phraseLabel) + '</span>';
      h += '<span class="metric-label">' + ps.perfects + 'P / ' + ps.goods + 'G / ' + ps.oks + 'O / ' + ps.misses + 'M &mdash; ' + pct + '%</span>';
      h += '</div>';
    }
    h += '</div>';
  }

  if (r.importedTechniqueSummary && hasImportedTechniqueResultData(r.importedTechniqueSummary)) {
    h += '<div class="card mb20" style="text-align:left"><div class="card-section-heading" style="margin-bottom:10px">Technique Summary</div>';
    h += renderImportedTechniqueSummaryRows(r.importedTechniqueSummary);
    h += '</div>';
  }

  if (targetTechnique) {
    h += '<div class="card mb20" style="text-align:left;border:1px solid #FF8A5C44;background:linear-gradient(135deg,#FF8A5C12,#FFE66D12)">';
    h += '<div class="card-section-heading" style="margin-bottom:6px">Technique Focus</div>';
    h += '<div class="card-micro-heading">' + escHTML(formatTechniqueFocusLabel(targetTechnique)) + '</div>';
    h += '<div style="font-size:11px;color:var(--text-dim);margin-top:4px">Keep this same focus on retry so the next run stays aimed at the weak spot.</div>';
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
    h += '<div class="card" style="flex:1;text-align:center;border:2px solid #4ECDC4;padding:10px"><div class="metric-label">Best Phrase</div><div class="card-micro-heading" style="color:#4ECDC4">' + escHTML(firstPerformPageTextToken(r.phraseStats[bestIdx].name, "Phrase " + (bestIdx + 1))) + '</div></div>';
    h += '<div class="card" style="flex:1;text-align:center;border:2px solid #FF6B6B;padding:10px"><div class="metric-label">Weakest Phrase</div><div class="card-micro-heading" style="color:#FF6B6B">' + escHTML(firstPerformPageTextToken(r.phraseStats[worstIdx].name, "Phrase " + (worstIdx + 1))) + '</div></div>';
    h += '</div>';
  }

  // Buttons
  h += '<div class="flex-col action-row">';
  h += '<button class="btn" onclick="act(\'performRetry\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128257; ' + escHTML(targetTechnique ? ("Retry " + formatTechniqueFocusLabel(targetTechnique)) : "Retry") + '</button>';
  if (hasPerformDoneWeakestPhraseTarget(r)) {
    h += '<button class="btn" onclick="act(\'performRetryPhrase\')" style="background:linear-gradient(135deg,#FF6B6B,#FFE66D);color:#333">&#128170; ' + escHTML(targetTechnique ? ("Retry Weakest " + formatTechniqueFocusLabel(targetTechnique)) : "Retry Weakest") + '</button>';
  } else {
    h += '<div style="font-size:12px;color:var(--text-muted);padding:8px 10px;text-align:center">Finish a phrase-tracked run to unlock weakest-phrase retry.</div>';
  }
  h += '<button class="btn" onclick="act(\'performDoneSongs\')" style="background:#4ECDC4;color:#fff">&#127968; Songs</button>';
  h += '</div>';

  // Next step recommendation
  var focusedTechniqueRow = targetTechnique ? getTechniqueSummaryRow(r.importedTechniqueSummary, targetTechnique) : null;
  if (focusedTechniqueRow) {
    h += '<div class="card" style="margin-top:12px;text-align:left"><div class="card-section-heading" style="margin-bottom:6px">Next Step</div>';
    h += '<div style="font-size:13px;color:var(--text-primary)">' + escHTML("Stay on " + formatTechniqueFocusLabel(targetTechnique)) + '</div>';
    h += '<div style="font-size:11px;color:var(--text-dim)">' + escHTML("You hit " + focusedTechniqueRow.hits + " of " + focusedTechniqueRow.total + " focused notes. Retry this same target to lock it in.") + '</div></div>';
  } else if(typeof buildPerformanceRecommendationsForSong==="function"&&r.title){
    var songId = typeof resolvePerformanceSongId === "function"
      ? resolvePerformanceSongId(r, r.title)
      : (r.title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
    var nextRecs=buildPerformanceRecommendationsForSong(songId);
    if(nextRecs&&nextRecs.length){
      var nextStepLabel = firstPerformPageTextToken(nextRecs[0].label, "Recommendation");
      var nextStepReason = firstPerformPageTextToken(nextRecs[0].reason);
      h+='<div class="card" style="margin-top:12px;text-align:left"><div class="card-section-heading" style="margin-bottom:6px">Next Step</div>';
      h+='<div style="font-size:13px;color:var(--text-primary)">'+escHTML(nextStepLabel)+'</div>';
      h+='<div style="font-size:11px;color:var(--text-dim)">'+escHTML(nextStepReason)+'</div></div>';
    }
  }

  h += '</div>';
  return h;
}

function hasPerformDoneWeakestPhraseTarget(results) {
  var phraseStats = results && results.phraseStats;
  var phrases = S.performChart && S.performChart.phrases;
  if (!phraseStats || !phraseStats.length || !phrases || !phrases.length) return false;
  for (var i = 0; i < phraseStats.length; i++) {
    if (phrases[i] && phraseStats[i] && phraseStats[i].total > 0) return true;
  }
  return false;
}

function getNextPerformEvent(chart, nowSec) {
  if (!chart || !chart.events) return null;
  for (var i = 0; i < chart.events.length; i++) {
    if (chart.events[i].t + (chart.events[i].dur || 0) >= nowSec) return chart.events[i];
  }
  return chart.events.length ? chart.events[chart.events.length - 1] : null;
}

function hasImportedTechniqueFlags(flags) {
  return !!(flags && (flags.open || flags.tap || flags.forced || flags.specialPhrase));
}

function hasImportedTechniqueResultData(summary) {
  if (!summary) return false;
  for (var key in summary) {
    if (summary[key] && summary[key].total > 0) return true;
  }
  return false;
}

function renderImportedTechniqueSummaryRows(summary) {
  var order = ["open", "tap", "forced", "specialPhrase"];
  var h = "";
  for (var i = 0; i < order.length; i++) {
    var row = summary[order[i]];
    if (!row || !row.total) continue;
    var rowLabel = firstPerformPageTextToken(row.label, formatTechniqueFocusLabel(order[i]), "Technique");
    h += '<div class="split-row" style="align-items:center;padding:4px 0;border-bottom:1px solid var(--border);gap:12px">';
    h += '<span class="card-micro-heading">' + escHTML(rowLabel) + '</span>';
    h += '<span class="metric-label">' + row.hits + '/' + row.total + ' hit &mdash; ' + row.accuracy + '%</span>';
    h += '</div>';
  }
  return h;
}

function getTechniqueSummaryRow(summary, key) {
  if (!summary || !key || !Object.prototype.hasOwnProperty.call(summary, key)) return null;
  return summary[key] || null;
}

function renderImportedTechniqueFlags(flags) {
  var labels = [];
  if (!flags) return "";
  if (flags.open) labels.push("Open");
  if (flags.tap) labels.push("Tap");
  if (flags.forced) labels.push("Forced");
  if (flags.specialPhrase) labels.push("Phrase");
  return labels.join(" • ");
}
