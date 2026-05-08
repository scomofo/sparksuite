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

function pianoPerformanceResultsView(results, mastery) {
  var core = typeof window !== "undefined" && window.sparkCore ? window.sparkCore : (typeof sparkCore !== "undefined" ? sparkCore : null);
  if (core && core.progressEngine && typeof core.progressEngine.buildPerformanceResultsView === "function") {
    return core.progressEngine.buildPerformanceResultsView(results, { mastery: mastery });
  }
  return {
    metrics: {
      accuracyFormatted: "0%",
      scoreFormatted: "0",
      starsFormatted: "0",
      maxComboFormatted: "0",
      masteryFormatted: String(mastery || "None")
    },
    phrases: [],
    weakestPhraseId: null
  };
}

function pianoPerformancePhraseRatingColor(rating) {
  if (rating === "excellent") return "#5a9e6a";
  if (rating === "good") return "#d4a843";
  return "#c44";
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
  var resultView = pianoPerformanceResultsView(r, mastery);
  var resultMetrics = resultView.metrics || {};

  var h = '<div class="card mb16">';
  h += '<h2>Performance Results</h2>';
  h += '<div class="muted">' + escHTML(resultTitle) + '</div>';
  h += '<div class="split-row" style="margin-top:8px;gap:12px"><span class="metric-label">Accuracy</span><span class="metric-value">' + escHTML(resultMetrics.accuracyFormatted || "0%") + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Score</span><span class="metric-value">' + escHTML(resultMetrics.scoreFormatted || "0") + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Stars</span><span class="metric-value">' + escHTML(resultMetrics.starsFormatted || "0") + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Max Combo</span><span class="metric-value">' + escHTML(resultMetrics.maxComboFormatted || "0") + '</span></div>';
  h += '<div class="split-row" style="gap:12px"><span class="metric-label">Mastery</span><span class="metric-value">' + escHTML(resultMetrics.masteryFormatted || "None") + '</span></div>';
  h += '</div>';

  // Phrase breakdown
  if(Array.isArray(resultView.phrases) && resultView.phrases.length){
    h += '<div class="card mb16">';
    h += '<div class="card-section-heading">Phrase Breakdown</div>';
    for(var i=0;i<resultView.phrases.length;i++){
      var p = resultView.phrases[i];
      if(!p) continue;
      var pAcc = typeof p.accuracy === "number" ? p.accuracy : 0;
      h += '<div class="split-row" style="align-items:center;padding:4px 0;border-bottom:1px solid var(--bg-input);gap:12px">';
      h += '<span class="card-micro-heading">' + escHTML(pianoFirstPerformanceResultTextToken(p.name, "Phrase " + (i+1))) + '</span>';
      h += '<span class="metric-value" style="font-size:13px;color:' + escHTML(pianoPerformancePhraseRatingColor(p.rating)) + '">' + escHTML(p.accuracyFormatted || (pAcc + "%")) + '</span>';
      h += '</div>';
    }
    if(resultView.weakestPhraseId != null){
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
