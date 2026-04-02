function performSongPage(){
  if(!S.performSongData) return '<div class="card">No song selected</div>';

  var sid = S.performSongId;
  var best = getPerformanceBest(sid, S.performArrangementType, S.performDifficulty);
  var mastery = getPerformanceMasteryLabel(best);

  var h = '<div class="card mb16">';
  h += '<h2>'+escHTML(S.performSongData.title)+'</h2>';
  h += '<div class="muted">'+escHTML(S.performSongData.artist || "")+'</div>';
  h += '<div style="margin-top:8px">Mastery: <b>'+escHTML(mastery)+'</b></div>';
  if(best){
    h += '<div>Best Accuracy: '+Math.round(best.bestAccuracy||0)+'%</div>';
    h += '<div>Best Stars: '+(best.bestStars||0)+'</div>';
  }
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div><b>Arrangement</b></div>';
  h += '<button class="btn'+(S.performArrangementType==="block_chords"?" btn-primary":"")+'" onclick="act(\'performArrangement\',\'block_chords\')">Block Chords</button> ';
  h += '<button class="btn'+(S.performArrangementType==="left_hand_patterns"?" btn-primary":"")+'" onclick="act(\'performArrangement\',\'left_hand_patterns\')">Left Hand</button> ';
  h += '<button class="btn'+(S.performArrangementType==="melody"?" btn-primary":"")+'" onclick="act(\'performArrangement\',\'melody\')">Melody</button>';
  h += '</div>';

  if(S.performArrangementType==="left_hand_patterns"){
    var pat = typeof getCurrentLHPattern==="function" ? getCurrentLHPattern() : null;
    h += '<div class="card mb16">';
    h += '<div><b>LH Pattern</b></div>';
    h += '<div class="muted">'+escHTML(pat ? pat.name : "Unknown pattern")+'</div>';
    h += '</div>';
  }

  h += '<div class="card mb16">';
  h += '<div><b>Difficulty</b></div>';
  h += '<button class="btn'+(S.performDifficulty==="easy"?" btn-primary":"")+'" onclick="act(\'performDifficulty\',\'easy\')">Easy</button> ';
  h += '<button class="btn'+(S.performDifficulty==="normal"?" btn-primary":"")+'" onclick="act(\'performDifficulty\',\'normal\')">Normal</button> ';
  h += '<button class="btn'+(S.performDifficulty==="pro"?" btn-primary":"")+'" onclick="act(\'performDifficulty\',\'pro\')">Pro</button>';
  h += '</div>';

  // Audio import
  var songId = normalizeSongId(S.performSongData);
  var audioData = S.songAudioData[songId];

  h += '<div class="card mb16">';
  h += '<div><b>Song Audio</b></div>';

  if (audioData && audioData.stemPaths) {
    h += '<div style="color:#5a9e6a;font-weight:600">Audio loaded</div>';
    if (audioData.detectedBpm) {
      h += '<div class="muted" style="font-size:12px">Detected BPM: ' + Math.round(audioData.detectedBpm) + '</div>';
    }
    h += '<button class="btn" onclick="act(\'removeSongAudio\',\'' + songId + '\')">Remove Audio</button>';
  } else if (S.songAudioImporting) {
    h += '<div>Separating stems... ' + (S.songAudioProgress || 0) + '%</div>';
    h += '<div style="background:var(--bg-input);border-radius:4px;height:6px;overflow:hidden;margin-top:4px"><div style="width:' + (S.songAudioProgress || 0) + '%;height:100%;background:var(--accent);transition:width .3s"></div></div>';
  } else {
    h += '<div class="muted" style="font-size:12px;margin-bottom:6px">Import an MP3 to play along with the actual song.</div>';
    h += '<button class="btn btn-primary" onclick="act(\'importSongAudio\',\'' + songId + '\')">Import Song Audio</button>';
  }
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<button class="btn btn-primary" onclick="act(\'performStart\')">Start Performance</button> ';
  h += '<button class="btn" onclick="act(\'back\')">Back</button>';
  h += '</div>';

  return h;
}
