function insightsDashboardPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var pi = runtimeState && runtimeState.dashboardInsights ? runtimeState.dashboardInsights : S.personalInsights;
  if(!pi || !S.lastInsightRun){
    generatePersonalInsights();
    pi = S.personalInsights || {};
  }
  var h = '';
  h += '<div class="card mb16">';
  h += '<div><b>Personal Progress Insights</b></div>';
  h += '<div class="muted">Your strongest areas, weak spots, trends, and career progress.</div>';
  h += '</div>';
  h += renderStrengthWeaknessCard(pi);
  h += renderMasteryTrendCard(pi);
  h += renderPracticeTrendCard(pi);
  h += renderRecommendationInsightCard(pi);
  h += renderCareerInsightCard(pi);
  return h;
}

function renderStrengthWeaknessCard(pi){
  var h = '<div class="card mb16">';
  h += '<div><b>Strengths & Weak Spots</b></div>';
  h += '<div style="margin-top:8px"><b>Strongest</b></div>';
  var strong = pi.strongestSkills || [];
  for(var i=0;i<strong.length;i++){
    h += '<div>'+escHTML(strong[i].bucket + ': ' + strong[i].id)+' — '+Math.round((strong[i].value || 0)*100)+'%</div>';
  }
  h += '<div style="margin-top:8px"><b>Weakest</b></div>';
  var weak = pi.weakestSkills || [];
  for(var j=0;j<weak.length;j++){
    h += '<div>'+escHTML(weak[j].bucket + ': ' + weak[j].id)+' — '+Math.round((weak[j].value || 0)*100)+'%</div>';
  }
  h += '</div>';
  return h;
}

function renderMasteryTrendCard(pi){
  var h = '<div class="card mb16">';
  h += '<div><b>Mastery Trend</b></div>';
  h += renderInsightLineChart((pi.masteryTrend && pi.masteryTrend.chords) || [], 320, 120);
  h += '</div>';
  return h;
}

function renderPracticeTrendCard(pi){
  var h = '<div class="card mb16">';
  h += '<div><b>Practice Trend</b></div>';
  h += renderInsightLineChart((pi.practiceTrend && pi.practiceTrend.minutes) || [], 320, 120);
  h += '</div>';
  return h;
}

function renderRecommendationInsightCard(pi){
  var h = '<div class="card mb16">';
  h += '<div><b>Recommendation Use</b></div>';
  var rq = (pi.recommendationQuality || {});
  h += '<div>Total accepted: '+(rq.totalAccepted || 0)+'</div>';
  if(rq.focusedTechnique){
    h += '<div style="margin-top:8px;color:#8fd5c4"><b>Focused Technique</b></div>';
    h += '<div>' + escHTML(prettyFocusedTechniqueInsight(rq.focusedTechnique)) + '</div>';
  }
  h += '</div>';
  return h;
}

function prettyFocusedTechniqueInsight(insight){
  if(!insight) return "";
  var songLabel = String(insight.songId || "song").replace(/_/g, " ");
  return insight.techniqueLabel + " is still at " + insight.accuracy + "% in " + songLabel;
}

function renderCareerInsightCard(pi){
  var h = '<div class="card mb16">';
  h += '<div><b>Career Progress</b></div>';
  var c = pi.careerTrend || {};
  var averageStars = typeof c.averageStars === "number" ? c.averageStars.toFixed(2) : (c.averageStars || 0);
  h += '<div>Cleared songs: '+(c.clearedSongs || 0)+'</div>';
  h += '<div>Average stars: '+averageStars+'</div>';
  h += '<div>Completed stages: '+(c.completedStages || 0)+'</div>';
  h += '</div>';
  return h;
}
