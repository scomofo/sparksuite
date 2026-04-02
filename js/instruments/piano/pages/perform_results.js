/* ───────── PianoSpark – pages/perform_results.js ───────── */
/* Performance results page with phrase breakdown and retry options */

function performanceResultsPage(){
  var r = S.performResults || S.performanceResult;
  if(!r) return '<div class="card">No result</div>';

  var best = getPerformanceBest(r.songId, r.arrangementType || "block_chords", r.difficultyId || "normal");
  var mastery = getPerformanceMasteryLabel(best);

  var h = '<div class="card mb16">';
  h += '<h2>Performance Results</h2>';
  h += '<div class="muted">' + escHTML(r.title || "") + '</div>';
  h += '<div style="margin-top:8px">Accuracy: <b>' + (r.accuracy || 0) + '%</b></div>';
  h += '<div>Score: <b>' + (r.score || 0) + '</b></div>';
  h += '<div>Stars: <b>' + (r.stars || 0) + '</b></div>';
  h += '<div>Max Combo: <b>' + (r.maxCombo || 0) + '</b></div>';
  h += '<div>Mastery: <b>' + escHTML(mastery) + '</b></div>';
  h += '</div>';

  // Phrase breakdown
  if(Array.isArray(r.phrases) && r.phrases.length){
    h += '<div class="card mb16">';
    h += '<div><b>Phrase Breakdown</b></div>';
    var weakestId = null;
    var weakestAcc = 999;
    for(var i=0;i<r.phrases.length;i++){
      var p = r.phrases[i];
      var pAcc = p.total ? Math.round((p.hits / p.total) * 100) : 0;
      if(pAcc < weakestAcc){ weakestAcc = pAcc; weakestId = p.phraseId; }
      var color = pAcc >= 90 ? '#5a9e6a' : pAcc >= 70 ? '#d4a843' : '#c44';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--bg-input)">';
      h += '<span>' + escHTML(p.name || ("Phrase " + (i+1))) + '</span>';
      h += '<span style="color:' + color + ';font-weight:600">' + pAcc + '%</span>';
      h += '</div>';
    }
    if(weakestId != null){
      h += '<div style="margin-top:8px">';
      h += '<button class="btn" onclick="act(\'retryWeakestPhrase\')">Retry Weakest Phrase</button>';
      h += '</div>';
    }
    h += '</div>';
  }

  h += '<div class="card mb16">';
  h += '<button class="btn btn-primary" onclick="act(\'performRetry\')">Retry Song</button> ';
  h += '<button class="btn" onclick="act(\'stopPerform\')">Back to Songs</button>';
  h += '</div>';

  return h;
}
