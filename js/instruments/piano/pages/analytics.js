function pianoAnalyticsTextToken(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function pianoFirstAnalyticsTextToken(){
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = pianoAnalyticsTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function pianoAnalyticsValueToken(value) {
  if (typeof value === "number") {
    return isFinite(value) ? String(value) : "";
  }
  if (typeof value !== "string") return "";
  return pianoAnalyticsTextToken(value);
}

function pianoAnalyticsCountValue(value) {
  return typeof value === "number" && isFinite(value) ? value : 0;
}

function pianoAnalyticsPage(){
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

function renderAnalyticsWeaknesses(summary){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Weakest Skills</div>';
  var hasAny = false;

  if(summary.weakestTransitions && summary.weakestTransitions.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">Transitions</div>';
    for(var i=0;i<summary.weakestTransitions.length;i++){
      var t = summary.weakestTransitions[i];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(pianoFirstAnalyticsTextToken(t.label, "Transition"))+' \u00b7 '+(t.avgMs||0)+' ms</div>';
    }
  }

  if(summary.weakestSongs && summary.weakestSongs.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px">Songs</div>';
    for(var j=0;j<summary.weakestSongs.length;j++){
      var s = summary.weakestSongs[j];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(pianoFirstAnalyticsTextToken(s.label, "Song"))+' \u00b7 '+(s.accuracy||0)+'%</div>';
    }
  }

  if(summary.weakestPhrases && summary.weakestPhrases.length){
    hasAny = true;
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px">Phrases</div>';
    for(var k=0;k<summary.weakestPhrases.length;k++){
      var p = summary.weakestPhrases[k];
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(pianoFirstAnalyticsTextToken(p.label, "Phrase"))+' \u00b7 '+(p.accuracy||0)+'%</div>';
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
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(pianoFirstAnalyticsTextToken(s.label, "Skill"))+': '+escHTML(pianoFirstAnalyticsTextToken(pianoAnalyticsValueToken(s.value), "Skill"))+'</div>';
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
      h += '<div style="font-size:13px;margin-bottom:6px">'+escHTML(pianoFirstAnalyticsTextToken(r.label, "Improvement"))+': '+escHTML(pianoFirstAnalyticsTextToken(pianoAnalyticsValueToken(r.value), "Improvement"))+'</div>';
    }
  }
  h += '</div>';
  return h;
}

function renderAnalyticsConsistency(summary){
  var c = summary.practiceConsistency || {};
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading mb8">Practice Consistency</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">Streak: '+pianoAnalyticsCountValue(c.streak)+'</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">Sessions: '+pianoAnalyticsCountValue(c.sessions)+'</div>';
  h += '<div style="font-size:13px;margin-bottom:6px">History Entries: '+pianoAnalyticsCountValue(c.historyCount)+'</div>';
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
      h += '<div style="padding:10px;border-radius:10px;background:var(--input-bg);margin-bottom:8px">';
      h += '<div class="card-micro-heading">'+escHTML(pianoFirstAnalyticsTextToken(r.label, "Recommendation"))+'</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);margin:4px 0 8px">'+escHTML(pianoFirstAnalyticsTextToken(r.reason))+'</div>';
      h += '<button class="btn" onclick="act(\'launchAnalyticsRecommendation\','+i+')">Start</button>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}
