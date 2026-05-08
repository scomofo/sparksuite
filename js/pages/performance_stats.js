/* ===== ChordSpark: Performance Stats Page ===== */

function prettyPerformanceStatsToken(value){
  var text;
  var lower;
  if(value == null) return "";
  if(typeof value !== "string" && typeof value !== "number") return "";
  text = String(value || "").replace(/_/g, " ").trim();
  if(!text) return "";
  lower = text.toLowerCase();
  if(lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function getPerformanceStatsCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function performanceStatsPage(){
  var statsView = getPerformanceStatsView();
  var focus = statsView.focus;
  var h='<div class="perform-page">';
  h+='<div class="perform-header"><button class="back-btn" onclick="act(\'performStatsBack\')">&larr; Back</button>';
  h+='<div class="perform-title"><strong>Performance Stats</strong></div></div>';
  h+='<div class="card mb20" style="padding:12px;border-radius:18px;border:1px solid rgba(69,183,209,.16);background:linear-gradient(180deg,rgba(15,19,30,.94),rgba(8,10,16,.94))">';
  h+='<div class="card-section-heading" style="margin-bottom:10px">View</div>';
  h+='<div class="perform-toggle-group action-row" style="justify-content:flex-start;gap:6px;margin:0">';
  var focuses=["overview","recent","top","weak","daily"];
  for(var fi=0;fi<focuses.length;fi++){
    var focusId=focuses[fi];
    h+='<button class="btn btn-sm'+(focus===focusId?' active':'')+'" onclick="act(\'performStatsFocus\',\''+focusId+'\')">'+focusId+'</button>';
  }
  h+='</div></div>';

  // Overview
  var totals=typeof getPerformanceTotals==="function"?getPerformanceTotals():{runs:0,songsPlayed:0,masteredSongs:0,avgAccuracy:0,totalStars:0};
  if(focus==="overview"){
    h+='<div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap;gap:12px">';
    h+='<div><div class="metric-value" style="color:#FFE66D">'+totals.runs+'</div><div class="metric-label">Total Runs</div></div>';
    h+='<div><div class="metric-value" style="color:#4ECDC4">'+totals.songsPlayed+'</div><div class="metric-label">Songs Played</div></div>';
    h+='<div><div class="metric-value" style="color:#FF6B6B">'+totals.masteredSongs+'</div><div class="metric-label">Mastered</div></div>';
    h+='<div><div class="metric-value" style="color:#45B7D1">'+totals.avgAccuracy+'%</div><div class="metric-label">Avg Accuracy</div></div>';
    h+='</div></div>';
  }

  // Recent runs
  var recent=typeof getPerformanceRecentRuns==="function"?getPerformanceRecentRuns():[];
  if((focus==="recent"||focus==="overview")&&recent.length){
    h+='<div class="card mb20"><div class="card-section-heading" style="margin-bottom:10px">Recent Runs</div>';
    for(var i=0;i<recent.length;i++){
      var r=recent[i];
      var mColor=typeof getMasteryColor==="function"?getMasteryColor(r.mastery):"var(--text-muted)";
      var songLabel = prettyPerformanceStatsToken(r.songId) || "song";
      var arrangementLabel = prettyPerformanceStatsToken(r.arrangement) || "chords";
      var difficultyLabel = prettyPerformanceStatsToken(r.difficulty) || "normal";
      h+='<div class="split-row" style="align-items:center;padding:6px 0;border-bottom:1px solid var(--border);gap:12px">';
      h+='<div><span class="card-micro-heading">'+escHTML(songLabel)+'</span>';
      h+=' <span class="metric-label">'+escHTML(arrangementLabel)+' / '+escHTML(difficultyLabel)+'</span></div>';
      h+='<div style="text-align:right"><span class="metric-value" style="font-size:12px;color:'+mColor+'">'+r.bestAccuracy+'%</span>';
      h+=' <span class="metric-label">'+r.bestStars+'&#11088;</span></div>';
      h+='</div>';
    }
    h+='</div>';
  }

  // Top songs
  var top=typeof getPerformanceTopSongs==="function"?getPerformanceTopSongs():[];
  if((focus==="top"||focus==="overview")&&top.length){
    h+='<div class="card mb20"><div class="card-section-heading" style="margin-bottom:10px">Top Scores</div>';
    for(var t=0;t<top.length;t++){
      var ts=top[t];
      var topSongLabel = prettyPerformanceStatsToken(ts.songId) || "song";
      h+='<div class="split-row" style="padding:4px 0;border-bottom:1px solid var(--border);gap:12px">';
      h+='<span class="card-micro-heading">'+escHTML(topSongLabel)+'</span>';
      h+='<span class="metric-value" style="font-size:13px;color:#FFE66D">'+ts.bestScore+' pts</span>';
      h+='</div>';
    }
    h+='</div>';
  }

  // Weak songs
  var weak=typeof getPerformanceWeakSongs==="function"?getPerformanceWeakSongs():[];
  if((focus==="weak"||focus==="overview")&&weak.length){
    h+='<div class="card mb20"><div class="card-section-heading" style="margin-bottom:10px">Needs Work</div>';
    for(var w=0;w<weak.length;w++){
      var ws=weak[w];
      var weakSongLabel = prettyPerformanceStatsToken(ws.songId) || "song";
      h+='<div class="split-row" style="padding:4px 0;border-bottom:1px solid var(--border);gap:12px">';
      h+='<span class="card-micro-heading">'+escHTML(weakSongLabel)+'</span>';
      h+='<span class="metric-value" style="font-size:13px;color:#FF6B6B">'+ws.bestAccuracy+'%</span>';
      h+='</div>';
    }
    h+='</div>';
  }

  // Daily challenge history
  if((focus==="daily"||focus==="overview")&&Array.isArray(S.performanceDailyHistory)&&S.performanceDailyHistory.length){
    h+='<div class="card mb20"><div class="card-section-heading" style="margin-bottom:10px">Daily Challenges ('+S.performanceDailyHistory.length+' completed)</div>';
    var dh=S.performanceDailyHistory.slice(-5).reverse();
    for(var di=0;di<dh.length;di++){
      var dateLabel = prettyPerformanceStatsToken(dh[di].date) || "unknown date";
      var typeLabel = prettyPerformanceStatsToken(dh[di].type) || "challenge";
      h+='<div style="font-size:12px;color:var(--text-muted);padding:3px 0">'+escHTML(dateLabel)+' &mdash; '+escHTML(typeLabel)+' +'+dh[di].xp+'XP</div>';
    }
    h+='</div>';
  }

  h+='</div>';
  return h;
}

function getPerformanceStatsView(){
  var coreView = getPerformanceStatsCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var focus = prettyPerformanceStatsToken(runtimeState && runtimeState.performanceStatsFocus);
  var allowedFocuses = { overview: true, recent: true, top: true, weak: true, daily: true };
  return {
    focus: allowedFocuses[focus] ? focus : "overview"
  };
}
