/* ===== ChordSpark: Performance Song Detail Page ===== */

function prettyPerformSongToken(value) {
  var text;
  var lower;
  if (value == null) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";
  text = String(value || "").replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

// Wrapper - see js/utils/normalize.js for the canonical implementation.
function normalizePerformSongNumber(value, fallback) { return SparkNormalize.number(value, fallback); }

function getCanonicalPerformSongAudio(songId) {
  if (!songId) return null;
  if (typeof getContent === "function") {
    var canonicalSong = getContent("songs", songId);
    if (canonicalSong && canonicalSong.audio && canonicalSong.audio.src) return canonicalSong.audio;
    if (canonicalSong && canonicalSong.midi) {
      return { type: "midi", src: canonicalSong.midi, label: "Built-in MIDI Backing" };
    }
  }
  return null;
}

function ensureCanonicalPerformSongAudio(songId) {
  if (!songId || typeof resolvePerformanceSongAudioAsset !== "function") return;
  if (!window.__performSongAudioProbeState) window.__performSongAudioProbeState = {};
  if (window.__performSongAudioProbeState[songId]) return;
  window.__performSongAudioProbeState[songId] = "pending";
  resolvePerformanceSongAudioAsset(songId).then(function() {
    window.__performSongAudioProbeState[songId] = "done";
    if (typeof render === "function") render();
  }).catch(function() {
    window.__performSongAudioProbeState[songId] = "done";
  });
}

function renderPerformSongSection(title, body, accentColor) {
  var borderColor = accentColor || "rgba(255,255,255,.08)";
  return '<div class="card mb20" style="padding:14px;border-radius:18px;border:1px solid ' + borderColor + ';background:linear-gradient(180deg,rgba(18,22,33,.94),rgba(9,12,19,.94));box-shadow:0 16px 30px rgba(0,0,0,.2)">' +
    '<div class="card-section-heading" style="margin-bottom:10px">' + escHTML(title) + '</div>' +
    body +
    '</div>';
}

function getPerformanceSongCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function getPerformanceSongProgressEngine() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  if (core && core.progressEngine && typeof core.progressEngine.canPracticeWeakestPhrase === "function") {
    return core.progressEngine;
  }
  if (typeof SparkSuiteProgressEngine !== "undefined") return new SparkSuiteProgressEngine();
  return null;
}

function hasPerformSongWeakestPhraseTarget(performanceSongView) {
  var engine = getPerformanceSongProgressEngine();
  performanceSongView = performanceSongView || getPerformanceSongView();
  if (typeof performanceSongView.showWeakestPhraseAction === "boolean") return performanceSongView.showWeakestPhraseAction;
  return !!(engine && typeof engine.canPracticeWeakestPhrase === "function" && engine.canPracticeWeakestPhrase(
    performanceSongView.performChart,
    performanceSongView.performResults
  ));
}

function performSongPage() {
  var performanceSongView = getPerformanceSongView();
  var song = performanceSongView.song;
  if (!song) return '<div class="perform-page text-center"><p>No song selected.</p><button class="btn" onclick="act(\'performSongBack\')">Back</button></div>';

  var sid = performanceSongView.songId || "unknown";
  var arrType = performanceSongView.arrangementType || "chords";
  var diff = performanceSongView.difficultyId || "normal";
  var speed = performanceSongView.speed;
  var targetTechnique = performanceSongView.targetTechnique;
  var displayTitle = prettyPerformSongToken(song.title) || prettyPerformSongToken(performanceSongView.songId) || "Unknown Song";
  var displayArtist = prettyPerformSongToken(song.artist);
  var displayBpm = normalizePerformSongNumber(song.bpm, null);
  var displayChordCount = Array.isArray(song.chords) ? song.chords.length : 0;
  var displayBarCount = Array.isArray(song.progression) ? song.progression.length : 0;
  var normalizedSongId = typeof resolvePerformanceSongId === "function"
    ? resolvePerformanceSongId(song, displayTitle || "song")
    : (displayTitle || "song").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  var audioData = S.songAudioData[normalizedSongId];
  var canonicalAudio;
  var detectedSongBpm;
  var canPracticeWeakestPhrase;
  var settingsGrid;
  var arrangementBody;
  var difficultyBody;
  var speedBody;
  var recommendedBody;
  var audioBody;
  var recs;
  var songId;
  var h = '<div class="perform-page">';

  ensureCanonicalPerformSongAudio(normalizedSongId);
  canonicalAudio = getCanonicalPerformSongAudio(normalizedSongId);
  canPracticeWeakestPhrase = hasPerformSongWeakestPhraseTarget(performanceSongView);
  detectedSongBpm = audioData && audioData.stemPaths
    ? normalizePerformSongNumber(audioData.detectedBpm, null)
    : null;

  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'performSongBack\')">&larr; Back</button>';
  h += '<div class="perform-title"><strong>' + escHTML(displayTitle) + '</strong>';
  h += '<span class="perform-artist">' + escHTML(displayArtist) + '</span></div>';
  h += '</div>';

  h += '<div class="card mb20" style="text-align:center;padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(15,18,28,.92),rgba(8,10,16,.92))">';
  if (typeof getPerformanceStats === "function") {
    var pStats = getPerformanceStats(sid, arrType, diff);
    if (pStats.mastery !== "none") {
      h += '<div style="margin-bottom:8px"><span class="guided-pill" style="background:' + getMasteryColor(pStats.mastery) + '22;color:' + getMasteryColor(pStats.mastery) + '">' + getMasteryIcon(pStats.mastery) + ' ' + pStats.mastery.charAt(0).toUpperCase() + pStats.mastery.slice(1) + '</span></div>';
    }
    if (pStats.runs > 0) {
      h += '<div style="display:flex;justify-content:space-around;text-align:center;margin-top:8px;gap:12px;flex-wrap:wrap">';
      h += '<div><div class="metric-value" style="color:#FFE66D">' + pStats.bestScore + '</div><div class="metric-label">Best Score</div></div>';
      h += '<div><div class="metric-value" style="color:#4ECDC4">' + pStats.bestAccuracy + '%</div><div class="metric-label">Best Accuracy</div></div>';
      h += '<div><div class="metric-value">';
      for (var si = 0; si < 5; si++) h += si < pStats.bestStars ? '&#11088;' : '&#9734;';
      h += '</div><div class="metric-label">Best Stars</div></div>';
      h += '</div>';
    } else {
      h += '<div style="font-size:13px;color:var(--text-muted)">Not yet played with these settings</div>';
    }
  }
  h += '</div>';

  h += '<div class="card mb20" style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:12px;padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(15,18,28,.92),rgba(8,10,16,.92))">';
  h += '<div><div class="metric-value" style="font-size:16px;color:var(--text-primary)">' + (displayBpm != null ? displayBpm : "?") + '</div><div class="metric-label">BPM</div></div>';
  h += '<div><div class="metric-value" style="font-size:16px;color:var(--text-primary)">' + displayChordCount + '</div><div class="metric-label">Chords</div></div>';
  h += '<div><div class="metric-value" style="font-size:16px;color:var(--text-primary)">' + displayBarCount + '</div><div class="metric-label">Bars</div></div>';
  h += '</div>';

  settingsGrid = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">';
  arrangementBody = '<div class="perform-toggle-group action-row" style="justify-content:flex-start;gap:6px;margin:0">';
  arrangementBody += '<button class="btn btn-sm' + (arrType === "chords" ? " active" : "") + '" onclick="act(\'performArrangement\',\'chords\')">&#127928; Chords</button>';
  arrangementBody += '<button class="btn btn-sm' + (arrType === "rhythm_chords" ? " active" : "") + '" onclick="act(\'performArrangement\',\'rhythm_chords\')">&#127925; Rhythm</button>';
  arrangementBody += '<button class="btn btn-sm' + (arrType === "lead" ? " active" : "") + '" onclick="act(\'performArrangement\',\'lead\')">&#127925; Lead</button>';
  arrangementBody += '</div>';
  settingsGrid += renderPerformSongSection("Arrangement", arrangementBody, "rgba(69,183,209,.22)");

  difficultyBody = '<div class="perform-toggle-group action-row" style="justify-content:flex-start;gap:6px;margin:0">';
  var diffs = ["easy", "normal", "pro"];
  for (var d = 0; d < diffs.length; d++) {
    difficultyBody += '<button class="btn btn-sm' + (diff === diffs[d] ? " active" : "") + '" onclick="act(\'performDifficulty\',\'' + diffs[d] + '\')">' + diffs[d].charAt(0).toUpperCase() + diffs[d].slice(1) + '</button>';
  }
  difficultyBody += '</div>';
  settingsGrid += renderPerformSongSection("Difficulty", difficultyBody, "rgba(255,138,92,.22)");

  speedBody = '<div class="perform-toggle-group action-row" style="justify-content:flex-start;gap:6px;margin:0">';
  var speeds = [0.5, 0.75, 1.0];
  for (var sp = 0; sp < speeds.length; sp++) {
    speedBody += '<button class="btn btn-sm' + (speed === speeds[sp] ? " active" : "") + '" onclick="act(\'performSpeed\',' + speeds[sp] + ')">' + Math.round(speeds[sp] * 100) + '%</button>';
  }
  speedBody += '</div>';
  settingsGrid += renderPerformSongSection("Speed", speedBody, "rgba(255,230,109,.2)");
  settingsGrid += '</div>';
  h += settingsGrid;

  if(typeof buildPerformanceRecommendationsForSong==="function"){
    recs = buildPerformanceRecommendationsForSong(sid);
    if(recs&&recs.length){
      recommendedBody = '';
      for(var ri=0;ri<Math.min(3,recs.length);ri++){
        var recLabel = prettyPerformSongToken(recs[ri] && recs[ri].label) || "Recommendation";
        var recReason = prettyPerformSongToken(recs[ri] && recs[ri].reason);
        recommendedBody += '<div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);margin-bottom:8px">';
        recommendedBody += '<div class="card-micro-heading" style="margin-bottom:4px">' + escHTML(recLabel) + '</div>';
        if (recReason) {
          recommendedBody += '<div style="font-size:11px;color:var(--text-dim)">' + escHTML(recReason) + '</div>';
        }
        recommendedBody += '</div>';
      }
      h += renderPerformSongSection("Recommended", recommendedBody, "rgba(78,205,196,.22)");
    }
  }

  if (targetTechnique) {
    h += renderPerformSongSection(
      "Technique Focus",
      '<div class="card-micro-heading">' + escHTML(formatTechniqueLabel(targetTechnique)) + '</div>' +
      '<div style="font-size:12px;color:var(--text-dim);margin-top:6px">This practice launch came from an imported-chart weak spot. Keep that technique in focus during the run.</div>',
      "rgba(255,230,109,.18)"
    );
  }

  songId = normalizedSongId;
  audioBody = '';
  if (audioData && audioData.stemPaths) {
    audioBody += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
    audioBody += '<span class="card-micro-heading" style="color:#4ECDC4">&#9989; Audio loaded</span>';
    if (detectedSongBpm != null) {
      audioBody += '<span style="font-size:11px;color:var(--text-muted)">Detected BPM: ' + Math.round(detectedSongBpm) + '</span>';
      var authored = normalizePerformSongNumber(song.bpm, 100);
      var diffRatio = Math.abs(detectedSongBpm - authored) / authored;
      if (diffRatio > 0.1) {
        audioBody += '<span style="font-size:11px;color:#FF6B6B"> (authored: ' + authored + ' - sync may be imperfect)</span>';
      }
    }
    audioBody += '</div>';
    audioBody += '<button class="btn btn-sm" onclick="act(\'removeSongAudio\',\'' + songId + '\')" style="background:var(--input-bg);color:var(--text-secondary)">Remove Audio</button>';
  } else if (canonicalAudio && canonicalAudio.src) {
    audioBody += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
    audioBody += '<span class="card-micro-heading" style="color:#4ECDC4">&#9989; Built-in backing ready</span>';
    audioBody += '<span style="font-size:11px;color:var(--text-muted)">' + escHTML(canonicalAudio.label || (canonicalAudio.type === "midi" ? "Built-in MIDI Backing" : "Built-in Backing Track")) + '</span>';
    audioBody += '</div>';
    audioBody += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">This song includes a curated local backing track and will auto-play during performance. You can still import your own audio if you want stems instead.</p>';
    audioBody += '<button class="btn btn-sm" onclick="act(\'importSongAudio\',\'' + songId + '\')" style="background:var(--input-bg);color:var(--text-secondary)">Import Richer Audio / Stems</button>';
  } else if (S.songAudioImporting) {
    var songAudioProgress = Math.max(0, Math.min(100, normalizePerformSongNumber(S.songAudioProgress, 0)));
    audioBody += '<div style="margin-bottom:8px">';
    audioBody += '<div style="font-size:13px;color:var(--text-primary);margin-bottom:4px">Separating stems... ' + songAudioProgress + '%</div>';
    audioBody += '<div style="background:var(--input-bg);border-radius:4px;height:6px;overflow:hidden"><div style="width:' + songAudioProgress + '%;height:100%;background:#4ECDC4;transition:width .3s"></div></div>';
    audioBody += '</div>';
  } else {
    audioBody += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Drop a file like <code>content/songs/audio/' + escHTML(songId) + '.mp3</code> to make it a built-in backing track, or import an MP3 for per-song stems.</p>';
    audioBody += '<button class="btn" onclick="act(\'importSongAudio\',\'' + songId + '\')" style="background:linear-gradient(135deg,#45B7D1,#4ECDC4);color:#fff;box-shadow:0 12px 24px rgba(69,183,209,.2)">&#127925; Import Song Audio</button>';
  }
  h += renderPerformSongSection("Song Audio", audioBody, "rgba(69,183,209,.22)");

  h += '<div class="card" style="padding:14px;border-radius:18px;border:1px solid rgba(255,138,92,.18);background:linear-gradient(180deg,rgba(28,17,18,.88),rgba(13,11,15,.92));box-shadow:0 18px 36px rgba(0,0,0,.24)">';
  h += '<div class="card-section-heading" style="margin-bottom:10px">Play</div>';
  h += '<div class="flex-col action-row" style="gap:10px">';
  h += '<button class="btn perform-song-play-btn perform-song-play-btn-primary" onclick="act(\'performStartFromSong\')">&#127918; Start Performance</button>';
  if (canPracticeWeakestPhrase) {
    h += '<button class="btn perform-song-play-btn perform-song-play-btn-secondary" onclick="act(\'performRetryPhrase\')">&#128170; Practice Weakest Phrase</button>';
  } else {
    h += '<div class="metric-label" style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)">Finish a run to unlock weakest-phrase practice.</div>';
  }
  h += '<button class="btn btn-sm perform-song-play-btn perform-song-play-btn-utility" onclick="act(\'openPerformCalibration\')">&#9881; Calibrate Timing</button>';
  h += '</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

function getPerformanceSongView() {
  var coreView = getPerformanceSongCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var performanceSong = coreView
    && coreView.plan
    && coreView.plan.flow === "performance_song"
    && coreView.plan.context
    ? coreView.plan.context.performanceSong || null
    : null;

  return {
    song: performanceSong && performanceSong.songData
      ? performanceSong.songData
      : (runtimeState && runtimeState.performanceSongData ? runtimeState.performanceSongData : S.performSongData),
    songId: performanceSong && performanceSong.songId ? performanceSong.songId : S.performSongId,
    arrangementType: runtimeState && runtimeState.performanceArrangementType
      ? runtimeState.performanceArrangementType
      : (performanceSong && performanceSong.arrangementType ? performanceSong.arrangementType : S.performArrangementType),
    difficultyId: runtimeState && runtimeState.performanceDifficultyId
      ? runtimeState.performanceDifficultyId
      : (performanceSong && performanceSong.difficultyId ? performanceSong.difficultyId : S.performDifficulty),
    speed: runtimeState && runtimeState.performanceSpeed
      ? runtimeState.performanceSpeed
      : (performanceSong && performanceSong.speed ? performanceSong.speed : S.performSpeed),
    targetTechnique: runtimeState && Object.prototype.hasOwnProperty.call(runtimeState, "performanceTargetTechnique")
      ? runtimeState.performanceTargetTechnique
      : S.performTargetTechnique,
    performChart: runtimeState && runtimeState.performanceChart ? runtimeState.performanceChart : S.performChart,
    performResults: runtimeState && runtimeState.performanceResults ? runtimeState.performanceResults : S.performResults,
    showWeakestPhraseAction: coreView && typeof coreView.showWeakestPhraseAction === "boolean"
      ? coreView.showWeakestPhraseAction
      : (runtimeState && typeof runtimeState.showWeakestPhraseAction === "boolean" ? runtimeState.showWeakestPhraseAction : null)
  };
}

function formatTechniqueLabel(key) {
  var normalizedKey = prettyPerformSongToken(key);
  var labels = {
    open: "Open-note timing",
    tap: "Tap-note consistency",
    forced: "Forced-note transitions",
    specialPhrase: "Phrase section control"
  };
  return labels[normalizedKey] || (normalizedKey || "Technique");
}
