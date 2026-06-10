function analyticsPage(){
  var summary = typeof buildAnalyticsSummary === "function" ? buildAnalyticsSummary() : null;
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

function prettyAnalyticsToken(value){
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

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizeAnalyticsNumber(value, fallback){ return SparkNormalize.number(value, fallback); }

function renderAnalyticsWeaknesses(summary){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Weakest Skills</div>';
  var hasAny = false;

  if(summary.weakestTransitions && summary.weakestTransitions.length){
    hasAny = true;
    h += '<div class="card-micro-heading" style="margin-bottom:6px">Transitions</div>';
    for(var i=0;i<summary.weakestTransitions.length;i++){
      var t = summary.weakestTransitions[i];
      var transitionLabel = prettyAnalyticsToken(t && t.label) || "Transition";
      h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">'+escHTML(transitionLabel)+'</span><span class="metric-value" style="font-size:13px">'+normalizeAnalyticsNumber(t && t.avgMs, 0)+' ms</span></div>';
    }
  }

  if(summary.weakestSongs && summary.weakestSongs.length){
    hasAny = true;
    h += '<div class="card-micro-heading" style="margin:10px 0 6px">Songs</div>';
    for(var j=0;j<summary.weakestSongs.length;j++){
      var s = summary.weakestSongs[j];
      var songLabel = prettyAnalyticsToken(s && s.label) || "Song";
      h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">'+escHTML(songLabel)+'</span><span class="metric-value" style="font-size:13px">'+normalizeAnalyticsNumber(s && s.accuracy, 0)+'%</span></div>';
    }
  }

  if(summary.weakestPhrases && summary.weakestPhrases.length){
    hasAny = true;
    h += '<div class="card-micro-heading" style="margin:10px 0 6px">Phrases</div>';
    for(var k=0;k<summary.weakestPhrases.length;k++){
      var p = summary.weakestPhrases[k];
      var phraseLabel = prettyAnalyticsToken(p && p.label) || "Phrase";
      h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">'+escHTML(phraseLabel)+'</span><span class="metric-value" style="font-size:13px">'+normalizeAnalyticsNumber(p && p.accuracy, 0)+'%</span></div>';
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
  h += '<div class="card-section-heading mb8">Strongest Areas</div>';
  if(!summary.strongestSkills || !summary.strongestSkills.length){
    h += '<div class="muted">Not enough data yet.</div>';
  }else{
    for(var i=0;i<summary.strongestSkills.length;i++){
      var s = summary.strongestSkills[i];
      var label = prettyAnalyticsToken(s && s.label);
      if(!label) continue;
      h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">'+escHTML(label)+'</span><span class="metric-value" style="font-size:13px">'+escHTML(String(s.value))+'</span></div>';
    }
  }
  h += '</div>';
  return h;
}

function renderAnalyticsImprovement(summary){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Recent Improvement</div>';
  if(!summary.recentImprovement || !summary.recentImprovement.length){
    h += '<div class="muted">No trend data yet.</div>';
  }else{
    for(var i=0;i<summary.recentImprovement.length;i++){
      var r = summary.recentImprovement[i];
      var label = prettyAnalyticsToken(r && r.label);
      if(!label) continue;
      h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">'+escHTML(label)+'</span><span class="metric-value" style="font-size:13px">'+escHTML(String(r.value))+'</span></div>';
    }
  }
  h += '</div>';
  return h;
}

function renderAnalyticsConsistency(summary){
  var c = summary.practiceConsistency || {};
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Practice Consistency</div>';
  h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">Streak:</span> <span class="metric-value" style="font-size:13px">'+normalizeAnalyticsNumber(c.streak, 0)+'</span></div>';
  h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">Sessions:</span> <span class="metric-value" style="font-size:13px">'+normalizeAnalyticsNumber(c.sessions, 0)+'</span></div>';
  h += '<div class="split-row" style="margin-bottom:6px"><span class="metric-label">History Entries:</span> <span class="metric-value" style="font-size:13px">'+normalizeAnalyticsNumber(c.historyCount, 0)+'</span></div>';
  h += '</div>';
  return h;
}

function renderAnalyticsRecommendations(summary){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Recommended Next</div>';
  if(!summary.recommendations || !summary.recommendations.length){
    h += '<div class="muted">No recommendations yet.</div>';
  }else{
    for(var i=0;i<summary.recommendations.length;i++){
      var r = summary.recommendations[i];
      var label = prettyAnalyticsToken(r && r.label) || "Recommendation";
      var reason = prettyAnalyticsToken(r && r.reason);
      h += '<div style="padding:10px;border-radius:10px;background:var(--input-bg);margin-bottom:8px">';
      h += '<div class="card-micro-heading">'+escHTML(label)+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);margin:4px 0 8px">'+escHTML(reason)+'</div>';
      h += '<div class="action-row"><button class="btn" onclick="act(\'launchAnalyticsRecommendation\','+i+')">Start</button></div>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}
