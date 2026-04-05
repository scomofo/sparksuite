/* ===== ChordSpark: Performance Stats Page ===== */

var sc = window.sparkCore;
function performanceStatsPage(){
  var statsView = getPerformanceStatsView();
  var focus = statsView.focus;
  var h='<div class="perform-page">';
  h+='<div class="perform-header"><button class="back-btn" onclick="act(\'performStatsBack\')">&larr; Back</button>';
  h+='<div class="perform-title"><strong>Performance Stats</strong></div></div>';
  h+='<div class="perform-controls">';
  h+='<div class="perform-toggle-group"><span class="perform-toggle-label">View</span>';
  var focuses=["overview","recent","top","weak","daily"];
  for(var fi=0;fi<focuses.length;fi++){
    var focusId=focuses[fi];
    h+='<button class="btn btn-sm'+(focus===focusId?' active':'')+'" onclick="act(\'performStatsFocus\',\''+focusId+'\')">'+focusId+'</button>';
  }
  h+='</div></div>';

  // Overview
  var totals=typeof getPerformanceTotals==="function"?getPerformanceTotals():{runs:0,songsPlayed:0,masteredSongs:0,avgAccuracy:0,totalStars:0};
  if(focus==="overview"){
    h+='<div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap">';
    h+='<div><div style="font-size:22px;font-weight:900;color:#FFE66D">'+totals.runs+'</div><div style="font-size:10px;color:var(--text-muted)">Total Runs</div></div>';
    h+='<div><div style="font-size:22px;font-weight:900;color:#4ECDC4">'+totals.songsPlayed+'</div><div style="font-size:10px;color:var(--text-muted)">Songs Played</div></div>';
    h+='<div><div style="font-size:22px;font-weight:900;color:#FF6B6B">'+totals.masteredSongs+'</div><div style="font-size:10px;color:var(--text-muted)">Mastered</div></div>';
    h+='<div><div style="font-size:22px;font-weight:900;color:#45B7D1">'+totals.avgAccuracy+'%</div><div style="font-size:10px;color:var(--text-muted)">Avg Accuracy</div></div>';
    h+='</div></div>';
  }

  // Recent runs
  var recent=typeof getPerformanceRecentRuns==="function"?getPerformanceRecentRuns():[];
  if((focus==="recent"||focus==="overview")&&recent.length){
    h+='<div class="card mb20"><h3 style="font-size:14px;font-weight:800;margin:0 0 10px;color:var(--text-primary)">Recent Runs</h3>';
    for(var i=0;i<recent.length;i++){
      var r=recent[i];
      var mColor=typeof getMasteryColor==="function"?getMasteryColor(r.mastery):"var(--text-muted)";
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">';
      h+='<div><span style="font-size:13px;font-weight:700;color:var(--text-primary)">'+escHTML(r.songId)+'</span>';
      h+=' <span style="font-size:11px;color:var(--text-muted)">'+escHTML(r.arrangement||"chords")+' / '+escHTML(r.difficulty||"normal")+'</span></div>';
      h+='<div style="text-align:right"><span style="font-size:12px;font-weight:700;color:'+mColor+'">'+r.bestAccuracy+'%</span>';
      h+=' <span style="font-size:11px;color:var(--text-muted)">'+r.bestStars+'&#11088;</span></div>';
      h+='</div>';
    }
    h+='</div>';
  }

  // Top songs
  var top=typeof getPerformanceTopSongs==="function"?getPerformanceTopSongs():[];
  if((focus==="top"||focus==="overview")&&top.length){
    h+='<div class="card mb20"><h3 style="font-size:14px;font-weight:800;margin:0 0 10px;color:var(--text-primary)">Top Scores</h3>';
    for(var t=0;t<top.length;t++){
      var ts=top[t];
      h+='<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">';
      h+='<span style="font-size:13px;font-weight:700;color:var(--text-primary)">'+escHTML(ts.songId)+'</span>';
      h+='<span style="font-size:13px;font-weight:800;color:#FFE66D">'+ts.bestScore+' pts</span>';
      h+='</div>';
    }
    h+='</div>';
  }

  // Weak songs
  var weak=typeof getPerformanceWeakSongs==="function"?getPerformanceWeakSongs():[];
  if((focus==="weak"||focus==="overview")&&weak.length){
    h+='<div class="card mb20"><h3 style="font-size:14px;font-weight:800;margin:0 0 10px;color:var(--text-primary)">Needs Work</h3>';
    for(var w=0;w<weak.length;w++){
      var ws=weak[w];
      h+='<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">';
      h+='<span style="font-size:13px;font-weight:700;color:var(--text-primary)">'+escHTML(ws.songId)+'</span>';
      h+='<span style="font-size:13px;font-weight:700;color:#FF6B6B">'+ws.bestAccuracy+'%</span>';
      h+='</div>';
    }
    h+='</div>';
  }

  // Daily challenge history
  if((focus==="daily"||focus==="overview")&&Array.isArray(sc.p("performanceDailyHistory"))&&(sc.p("performanceDailyHistory")||[]).length){
    h+='<div class="card mb20"><h3 style="font-size:14px;font-weight:800;margin:0 0 10px;color:var(--text-primary)">Daily Challenges ('+(sc.p("performanceDailyHistory")||[]).length+' completed)</h3>';
    var dh=(sc.p("performanceDailyHistory")||[]).slice(-5).reverse();
    for(var di=0;di<dh.length;di++){
      h+='<div style="font-size:12px;color:var(--text-muted);padding:3px 0">'+escHTML(dh[di].date)+' &mdash; '+escHTML(dh[di].type)+' +'+dh[di].xp+'XP</div>';
    }
    h+='</div>';
  }

  h+='</div>';
  return h;
}

function getPerformanceStatsView(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  return {
    focus: runtimeState && runtimeState.performanceStatsFocus
      ? runtimeState.performanceStatsFocus
      : "overview"
  };
}
