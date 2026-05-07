/* ───────── PianoSpark – pages/perform_results.js ───────── */
/* Performance results page with phrase breakdown and retry options */

function pianoPerformanceResultTextToken(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function pianoFirstPerformanceResultTextToken(){
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = pianoPerformanceResultTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function pianoPerformanceResultsPage(){
  try{ return _pianoPerformResultsInner(); }catch(e){
    console.error("Piano results render error:",e);
    return '<div class="card"><p>Results error: '+escHTML(String(e.message||e))+'</p><button class="btn" onclick="act(&apos;stopPerform&apos;)">Back</button></div>';
  }
}
function _pianoPerformResultsInner(){
  var r = S.performResults || S.performanceResult;
  if(!r) return '<div class="card">No result</div>';

  var best = getPerformanceBest(r.songId, r.arrangementType || "block_chords", r.difficultyId || "normal");
  var mastery = getPerformanceMasteryLabel(best);
  var resultTitle = pianoFirstPerformanceResultTextToken(r.title, r.songTitle, r.songId, "Song");

  var h = '<div class="card mb16">';
  h += '<h2>Performance Results</h2>';
  h += '<div class="muted">' + escHTML(resultTitle) + '</div>';
  h += '<div class="split-row" style="margin-top:8px;gap:12px"><span class="metric-label">Accuracy</span><span class="metric-value">' + (r.accuracy || 0) + '%</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Score</span><span class="metric-value">' + (r.score || 0) + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Stars</span><span class="metric-value">' + (r.stars || 0) + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Max Combo</span><span class="metric-value">' + (r.maxCombo || 0) + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Mastery</span><span class="metric-value">' + escHTML(mastery) + '</span></div>';
  h += '</div>';

  // Phrase breakdown
  if(Array.isArray(r.phrases) && r.phrases.length){
    h += '<div class="card mb16">';
    h += '<div class="card-section-heading">Phrase Breakdown</div>';
    var weakestId = null;
    var weakestAcc = 999;
    for(var i=0;i<r.phrases.length;i++){
      var p = r.phrases[i];
      if(!p) continue;
      var pAcc = p.total ? Math.round((p.hits / p.total) * 100) : 0;
      if(pAcc < weakestAcc){ weakestAcc = pAcc; weakestId = p.phraseId; }
      var color = pAcc >= 90 ? '#5a9e6a' : pAcc >= 70 ? '#d4a843' : '#c44';
      h += '<div class="split-row" style="align-items:center;padding:4px 0;border-bottom:1px solid var(--bg-input);gap:12px">';
      h += '<span class="card-micro-heading">' + escHTML(pianoFirstPerformanceResultTextToken(p.name, "Phrase " + (i+1))) + '</span>';
      h += '<span class="metric-value" style="font-size:13px;color:' + color + '">' + pAcc + '%</span>';
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
  h += '<div class="action-row">';
  h += '<button class="btn btn-primary" onclick="act(\'performRetry\')">Retry Song</button> ';
  h += '<button class="btn" onclick="act(\'stopPerform\')">Back to Songs</button>';
  h += '</div>';
  h += '</div>';

  return h;
}
