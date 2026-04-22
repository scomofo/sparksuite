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

function prettyAnalyticsToken(value){
  var text;
  var lower;
  if(value == null) return "";
  if(typeof value === "number" || typeof value === "boolean" || typeof value === "object" || typeof value === "function" || typeof value === "symbol") return "";
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
  h += '<div class="mb8"><b>Weakest Skills</b></div>';
  var hasAny = false;

  if(summary.weakestTransitions && summary.weakestTransitions.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">Transitions</div>';
    for(var i=0;i<summary.weakestTransitions.length;i++){
      var t = summary.weakestTransitions[i];
      var transitionLabel = prettyAnalyticsToken(t && t.label) || "Transition";
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(transitionLabel)+' \u00b7 '+normalizeAnalyticsNumber(t && t.avgMs, 0)+' ms</div>';
    }
  }

  if(summary.weakestSongs && summary.weakestSongs.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px">Songs</div>';
    for(var j=0;j<summary.weakestSongs.length;j++){
      var s = summary.weakestSongs[j];
      var songLabel = prettyAnalyticsToken(s && s.label) || "Song";
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(songLabel)+' \u00b7 '+normalizeAnalyticsNumber(s && s.accuracy, 0)+'%</div>';
    }
  }

  if(summary.weakestPhrases && summary.weakestPhrases.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px">Phrases</div>';
    for(var k=0;k<summary.weakestPhrases.length;k++){
      var p = summary.weakestPhrases[k];
      var phraseLabel = prettyAnalyticsToken(p && p.label) || "Phrase";
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(phraseLabel)+' \u00b7 '+normalizeAnalyticsNumber(p && p.accuracy, 0)+'%</div>';
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
      var label = prettyAnalyticsToken(s && s.label);
      if(!label) continue;
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(label)+': '+escHTML(String(s.value))+'</div>';
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
      var label = prettyAnalyticsToken(r && r.label);
      if(!label) continue;
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(label)+': '+escHTML(String(r.value))+'</div>';
    }
  }
  h += '</div>';
  return h;
}

function renderAnalyticsConsistency(summary){
  var c = summary.practiceConsistency || {};
  var h = '<div class="card mb16">';
  h += '<div class="mb8"><b>Practice Consistency</b></div>';
  h += '<div style="font-size:13px;margin-bottom:6px">Streak: '+normalizeAnalyticsNumber(c.streak, 0)+'</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">Sessions: '+normalizeAnalyticsNumber(c.sessions, 0)+'</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">History Entries: '+normalizeAnalyticsNumber(c.historyCount, 0)+'</div>';
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
      var label = prettyAnalyticsToken(r && r.label) || "Recommendation";
      var reason = prettyAnalyticsToken(r && r.reason);
      h += '<div style="padding:10px;border-radius:10px;background:var(--input-bg);margin-bottom:8px">';
      h += '<div style="font-size:13px;font-weight:800">'+escHTML(label)+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);margin:4px 0 8px">'+escHTML(reason)+'</div>';
      h += '<button class="btn" onclick="act(\'launchAnalyticsRecommendation\','+i+')">Start</button>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}
