function analyticsPage(){
  var summary = buildAnalyticsSummary ? buildAnalyticsSummary() : null;
  var h = '';
  h += '<div class="card mb16">';
  h += '<h2>Analytics</h2>';
  h += '<div class="muted">Your weak spots, strengths, and next best steps.</div>';
  h += '</div>';

  if(!summary){
    h += '<div class="card mb16"><div class="muted">No analytics available yet.</div></div>';
    return h;
  }

  h += renderAnalyticsWeaknesses(summary);
  h += renderAnalyticsStrengths(summary);
  h += renderAnalyticsImprovement(summary);
  h += renderAnalyticsConsistency(summary);
  h += renderAnalyticsRecommendations(summary);
  return h;
}

function renderAnalyticsWeaknesses(summary){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Weakest Skills</b></div>';
  var hasAny = false;

  if(summary.weakestTransitions && summary.weakestTransitions.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">Transitions</div>';
    for(var i=0;i<summary.weakestTransitions.length;i++){
      var t = summary.weakestTransitions[i];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(t.label)+' \u00b7 '+(t.avgMs||0)+' ms</div>';
    }
  }

  if(summary.weakestSongs && summary.weakestSongs.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px">Songs</div>';
    for(var j=0;j<summary.weakestSongs.length;j++){
      var s = summary.weakestSongs[j];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(s.label)+' \u00b7 '+(s.accuracy||0)+'%</div>';
    }
  }

  if(summary.weakestPhrases && summary.weakestPhrases.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px">Phrases</div>';
    for(var k=0;k<summary.weakestPhrases.length;k++){
      var p = summary.weakestPhrases[k];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(p.label)+' \u00b7 '+(p.accuracy||0)+'%</div>';
    }
  }

  if(!hasAny){
    h += '<div class="muted">No major weaknesses detected yet.</div>';
  }

  h += '</div>';
  return h;
}

function renderAnalyticsStrengths(summary){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Strongest Areas</b></div>';
  if(!summary.strongestSkills || !summary.strongestSkills.length){
    h += '<div class="muted">Not enough data yet.</div>';
  }else{
    for(var i=0;i<summary.strongestSkills.length;i++){
      var s = summary.strongestSkills[i];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(s.label)+': '+escHTML(String(s.value))+'</div>';
    }
  }
  h += '</div>';
  return h;
}

function renderAnalyticsImprovement(summary){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Recent Improvement</b></div>';
  if(!summary.recentImprovement || !summary.recentImprovement.length){
    h += '<div class="muted">No trend data yet.</div>';
  }else{
    for(var i=0;i<summary.recentImprovement.length;i++){
      var r = summary.recentImprovement[i];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(r.label)+': '+escHTML(String(r.value))+'</div>';
    }
  }
  h += '</div>';
  return h;
}

function renderAnalyticsConsistency(summary){
  var c = summary.practiceConsistency || {};
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Practice Consistency</b></div>';
  h += '<div style="font-size:13px;margin-bottom:6px">Streak: '+(c.streak||0)+'</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">Sessions: '+(c.sessions||0)+'</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">History Entries: '+(c.historyCount||0)+'</div>';
  h += '</div>';
  return h;
}

function renderAnalyticsRecommendations(summary){
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Recommended Next</b></div>';
  if(!summary.recommendations || !summary.recommendations.length){
    h += '<div class="muted">No recommendations yet.</div>';
  }else{
    for(var i=0;i<summary.recommendations.length;i++){
      var r = summary.recommendations[i];
      h += '<div style="padding:10px;border-radius:10px;background:var(--input-bg);margin-bottom:8px">';
      h += '<div style="font-size:13px;font-weight:800">'+escHTML(r.label)+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);margin:4px 0 8px">'+escHTML(r.reason||"")+'</div>';
      h += '<button class="btn" onclick="act(\'launchAnalyticsRecommendation\','+i+')">Start</button>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}
