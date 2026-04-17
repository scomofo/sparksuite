function insightsUiRoot(){
  if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
    var sparkRoot = SparkState.getRoot();
    if(sparkRoot) return sparkRoot;
  }
  return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
}

function insightsUiRead(path, fallback){
  var root = insightsUiRoot();
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
    return SparkState.read(path, fallback);
  }
  if(!cursor) return fallback;
  for(i = 0; i < parts.length; i++){
    if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function insightsDashboardPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var pi = runtimeState && runtimeState.dashboardInsights ? runtimeState.dashboardInsights : insightsUiRead("personalInsights", null);
  if(!pi || !insightsUiRead("lastInsightRun", null)) pi = pi || {};
  var h = '';
  h += '<div class="card mb16">';
  h += '<div><b>Personal Progress Insights</b></div>';
  h += '<div class="muted">Your strongest areas, weak spots, trends, and career progress.</div>';
  h += '</div>';
  h += renderStrengthWeaknessCard(pi);
  h += renderMasteryTrendCard(pi);
  h += renderPracticeTrendCard(pi);
  h += renderRecommendationInsightCard(pi);
  h += renderSmartCoachCard(pi);
  h += renderCareerInsightCard(pi);
  return h;
}

function renderStrengthWeaknessCard(pi){
  var h = '<div class="card mb16">';
  h += '<div><b>Strengths & Weak Spots</b></div>';
  h += '<div style="margin-top:8px"><b>Strongest</b></div>';
  var strong = pi.strongestSkills || [];
  for(var i=0;i<strong.length;i++){
    h += '<div>'+escHTML((strong[i].bucket || '') + ': ' + (strong[i].id || ''))+'  '+Math.round((strong[i].value || 0)*100)+'%</div>';
  }
  h += '<div style="margin-top:8px"><b>Weakest</b></div>';
  var weak = pi.weakestSkills || [];
  for(var j=0;j<weak.length;j++){
    h += '<div>'+escHTML((weak[j].bucket || '') + ': ' + (weak[j].id || ''))+'  '+Math.round((weak[j].value || 0)*100)+'%</div>';
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

function renderSmartCoachCard(pi){
  var smartCoach = pi && pi.recommendationQuality ? pi.recommendationQuality.smartCoach : null;
  var coach = pi && pi.coach ? pi.coach : null;
  var trace = window.sparkCore && window.sparkCore.runtimeState ? window.sparkCore.runtimeState.lastExecutionTrace : (window.__sparkExecutionTrace || null);
  var recent = insightsUiRead("playAlongRecent", []);
  var latest = recent.length ? recent[0] : null;
  if (!smartCoach && !(coach && coach.message)) return '';
  var h = '<div class="card mb16">';
  h += '<div><b>Smart Coach</b></div>';
  if (coach && coach.message) {
    h += '<div style="margin-top:8px;color:#8fd5c4">' + escHTML(coach.message) + '</div>';
  }
  if (smartCoach) {
    if (smartCoach.focusSkill) h += '<div style="margin-top:8px">Focus: ' + escHTML(String(smartCoach.focusSkill).replace(/_/g, " ")) + '</div>';
    if (smartCoach.weakArea) h += '<div>Weak area: ' + escHTML(String(smartCoach.weakArea).replace(/_/g, " ")) + '</div>';
    if (smartCoach.recommendedDifficultyId) h += '<div>Suggested difficulty: ' + escHTML(smartCoach.recommendedDifficultyId) + '</div>';
  }
  if (trace) {
    h += '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Latest execution: ' + escHTML(trace.source || trace.status || "unknown") + '</div>';
  }
  if (latest) {
    h += '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Recent play along: ' + escHTML(latest.title || latest.trackId || "song") + '</div>';
  }
  if (pi && pi.playAlongSummary) {
    if (pi.playAlongSummary.accuracy != null) {
      h += '<div style="font-size:12px;color:var(--text-muted)">Last play-along accuracy: ' + escHTML(String(pi.playAlongSummary.accuracy)) + '%</div>';
    }
    if (pi.playAlongSummary.weakAreas && pi.playAlongSummary.weakAreas.length) {
      h += '<div style="font-size:12px;color:var(--text-muted)">Play-along weak spots: ' + escHTML(pi.playAlongSummary.weakAreas.join(" | ").replace(/lane_/g, "lane ")) + '</div>';
    }
    if (pi.playAlongSummary.weakSection) {
      h += '<div style="font-size:12px;color:var(--text-muted)">Weak section: ' + escHTML(pi.playAlongSummary.weakSection) + '</div>';
    }
    if (pi.playAlongSummary.bookmarks && pi.playAlongSummary.bookmarks.length) {
      h += '<div style="font-size:12px;color:var(--text-muted)">Saved section: ' + escHTML(pi.playAlongSummary.bookmarks[0].sectionLabel || "Section") + '</div>';
    }
  }
  h += '</div>';
  return h;
}

function prettyFocusedTechniqueInsight(insight){
  if(!insight) return "";
  var songLabel = String(insight.songId || "song").replace(/_/g, " ");
  return (insight.techniqueLabel || "skill") + " is still at " + (insight.accuracy || 0) + "% in " + songLabel;
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
