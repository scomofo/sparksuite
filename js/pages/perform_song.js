/* ===== ChordSpark: Performance Song Detail Page ===== */

function performSongPage() {
  var song = S.performSongData;
  if (!song) return '<div class="perform-page text-center"><p>No song selected.</p><button class="btn" onclick="act(\'tab\',\'songs\')">Back</button></div>';

  var sid = S.performSongId || "unknown";
  var arrType = S.performArrangementType || "chords";
  var diff = S.performDifficulty || "normal";

  var h = '<div class="perform-page">';

  // Header
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'tab\',\'songs\')">&larr; Back</button>';
  h += '<div class="perform-title"><strong>' + escHTML(song.title) + '</strong>';
  h += '<span class="perform-artist">' + escHTML(song.artist || "") + '</span></div>';
  h += '</div>';

  // Mastery + best stats
  h += '<div class="card mb20" style="text-align:center">';
  if (typeof getPerformanceStats === "function") {
    var pStats = getPerformanceStats(sid + "_" + arrType, arrType, diff);
    if (pStats.mastery !== "none") {
      h += '<div style="margin-bottom:8px"><span style="background:' + getMasteryColor(pStats.mastery) + '22;color:' + getMasteryColor(pStats.mastery) + ';padding:6px 16px;border-radius:12px;font-size:14px;font-weight:800">' + getMasteryIcon(pStats.mastery) + ' ' + pStats.mastery.charAt(0).toUpperCase() + pStats.mastery.slice(1) + '</span></div>';
    }
    if (pStats.runs > 0) {
      h += '<div style="display:flex;justify-content:space-around;text-align:center;margin-top:8px">';
      h += '<div><div style="font-size:20px;font-weight:900;color:#FFE66D">' + pStats.bestScore + '</div><div style="font-size:10px;color:var(--text-muted)">Best Score</div></div>';
      h += '<div><div style="font-size:20px;font-weight:900;color:#4ECDC4">' + pStats.bestAccuracy + '%</div><div style="font-size:10px;color:var(--text-muted)">Best Accuracy</div></div>';
      h += '<div><div style="font-size:20px;font-weight:900">';
      for (var si = 0; si < 5; si++) h += si < pStats.bestStars ? '&#11088;' : '&#9734;';
      h += '</div><div style="font-size:10px;color:var(--text-muted)">Best Stars</div></div>';
      h += '</div>';
    } else {
      h += '<div style="font-size:13px;color:var(--text-muted)">Not yet played with these settings</div>';
    }
  }
  h += '</div>';

  // Song info
  h += '<div class="card mb20" style="display:flex;justify-content:space-around;text-align:center">';
  h += '<div><div style="font-size:16px;font-weight:800;color:var(--text-primary)">' + (song.bpm || "?") + '</div><div style="font-size:10px;color:var(--text-muted)">BPM</div></div>';
  h += '<div><div style="font-size:16px;font-weight:800;color:var(--text-primary)">' + (song.chords ? song.chords.length : 0) + '</div><div style="font-size:10px;color:var(--text-muted)">Chords</div></div>';
  h += '<div><div style="font-size:16px;font-weight:800;color:var(--text-primary)">' + (song.progression ? song.progression.length : 0) + '</div><div style="font-size:10px;color:var(--text-muted)">Bars</div></div>';
  h += '</div>';

  // Arrangement selector
  h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Arrangement</div>';
  h += '<div class="perform-toggle-group" style="justify-content:center">';
  h += '<button class="btn btn-sm' + (arrType === "chords" ? " active" : "") + '" onclick="act(\'performArrangement\',\'chords\')">&#127928; Chords</button>';
  h += '<button class="btn btn-sm' + (arrType === "rhythm_chords" ? " active" : "") + '" onclick="act(\'performArrangement\',\'rhythm_chords\')">&#127925; Rhythm</button>';
  h += '<button class="btn btn-sm' + (arrType === "lead" ? " active" : "") + '" onclick="act(\'performArrangement\',\'lead\')">&#127925; Lead</button>';
  h += '</div></div>';

  // Difficulty selector
  h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Difficulty</div>';
  h += '<div class="perform-toggle-group" style="justify-content:center">';
  var diffs = ["easy", "normal", "pro"];
  for (var d = 0; d < diffs.length; d++) {
    h += '<button class="btn btn-sm' + (diff === diffs[d] ? " active" : "") + '" onclick="act(\'performDifficulty\',\'' + diffs[d] + '\')">' + diffs[d].charAt(0).toUpperCase() + diffs[d].slice(1) + '</button>';
  }
  h += '</div></div>';

  // Speed selector
  h += '<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Speed</div>';
  h += '<div class="perform-toggle-group" style="justify-content:center">';
  var speeds = [0.5, 0.75, 1.0];
  for (var sp = 0; sp < speeds.length; sp++) {
    h += '<button class="btn btn-sm' + (S.performSpeed === speeds[sp] ? " active" : "") + '" onclick="act(\'performSpeed\',' + speeds[sp] + ')">' + Math.round(speeds[sp] * 100) + '%</button>';
  }
  h += '</div></div>';

  // Recommendations
  if(typeof buildPerformanceRecommendationsForSong==="function"){
    var recs=buildPerformanceRecommendationsForSong(sid);
    if(recs&&recs.length){
      h+='<div class="card mb20"><div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Recommended</div>';
      for(var ri=0;ri<Math.min(3,recs.length);ri++){
        h+='<div style="font-size:13px;color:var(--text-primary);margin-bottom:4px">'+escHTML(recs[ri].label)+'</div>';
        h+='<div style="font-size:11px;color:var(--text-dim);margin-bottom:8px">'+escHTML(recs[ri].reason)+'</div>';
      }
      h+='</div>';
    }
  }

  // Audio import
  var songId = (song.title || "song").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  var audioData = S.songAudioData[songId];

  h += '<div class="card mb20">';
  h += '<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Song Audio</div>';

  if (audioData && audioData.stemPaths) {
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    h += '<span style="color:#4ECDC4;font-weight:700">&#9989; Audio loaded</span>';
    if (audioData.detectedBpm) {
      h += '<span style="font-size:11px;color:var(--text-muted)">Detected BPM: ' + Math.round(audioData.detectedBpm) + '</span>';
      var authored = song.bpm || 100;
      var diff = Math.abs(audioData.detectedBpm - authored) / authored;
      if (diff > 0.1) {
        h += '<span style="font-size:11px;color:#FF6B6B"> (authored: ' + authored + ' — sync may be imperfect)</span>';
      }
    }
    h += '</div>';
    h += '<button class="btn btn-sm" onclick="act(\'removeSongAudio\',\'' + songId + '\')" style="background:var(--input-bg);color:var(--text-secondary)">Remove Audio</button>';
  } else if (S.songAudioImporting) {
    h += '<div style="margin-bottom:8px">';
    h += '<div style="font-size:13px;color:var(--text-primary);margin-bottom:4px">Separating stems... ' + (S.songAudioProgress || 0) + '%</div>';
    h += '<div style="background:var(--input-bg);border-radius:4px;height:6px;overflow:hidden"><div style="width:' + (S.songAudioProgress || 0) + '%;height:100%;background:#4ECDC4;transition:width .3s"></div></div>';
    h += '</div>';
  } else {
    h += '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Import an MP3 to play along with the actual song during performance.</p>';
    h += '<button class="btn" onclick="act(\'importSongAudio\',\'' + songId + '\')" style="background:linear-gradient(135deg,#45B7D1,#4ECDC4);color:#fff">&#127925; Import Song Audio</button>';
  }
  h += '</div>';

  // Start buttons
  h += '<div class="flex-col" style="gap:8px">';
  h += '<button class="btn" onclick="act(\'performStartFromSong\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:14px;font-size:16px;font-weight:800">&#127918; Start Performance</button>';
  h += '<button class="btn" onclick="act(\'performRetryPhrase\')" style="background:#4ECDC4;color:#fff">&#128170; Practice Weakest Phrase</button>';
  h += '<button class="btn btn-sm" onclick="act(\'openPerformCalibration\')" style="background:var(--input-bg);color:var(--text-secondary)">&#9881; Calibrate Timing</button>';
  h += '</div>';

  h += '</div>';
  return h;
}
