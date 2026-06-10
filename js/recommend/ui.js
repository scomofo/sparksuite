function prettyRecommendationUiToken(value){
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

function getRecommendationUiCore(){
  return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
}

function recommendationsPage(){
  var core = getRecommendationUiCore();
  var coreView = core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var arr = runtimeState && runtimeState.dashboardRecommendations ? runtimeState.dashboardRecommendations : S.recommendations;
  if(!arr || !arr.length){
    generateRecommendations();
    arr = S.recommendations || [];
  }
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Recommended Next</div>';
  for(var i=0;i<arr.length;i++){
    h += '<div style="margin-bottom:12px;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:8px">';
    h += '<div class="card-micro-heading">' + escHTML(arr[i].title) + '</div>';
    h += '<div style="font-size:12px;color:#aaa">Type: ' + escHTML(arr[i].type) + ' | Source: ' + escHTML(arr[i].source) + '</div>';
    h += '<div style="font-size:12px;color:#aaa">Reason: ' + escHTML((arr[i].reasons || []).join(", ")) + '</div>';
    h += renderRecommendationModuleProgress(arr[i]);
    h += '<button onclick="act(\'launchRecommendation\', \''+arr[i].id+'\')">Start</button>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function renderRecommendationModuleProgress(recommendation){
  if(!recommendation || recommendation.source !== "module_progress" || !recommendation.meta) return "";
  var bits = [];
  var focus = prettyRecommendationUiToken(recommendation.meta.recommendationFocus);
  if(focus){
    bits.push("Focus: " + focus);
  }
  var summary = recommendation.meta.progressSummary;
  var weakestMetric = prettyRecommendationUiToken(summary && summary.weakestMetric);
  if(summary && weakestMetric && typeof summary[summary.weakestMetric] === "number"){
    bits.push("Weakest: " + weakestMetric + " " + Math.round(summary[summary.weakestMetric] * 100) + "%");
  }
  if(!bits.length) return "";
  return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(bits.join(" | ")) + '</div>';
}

function launchRecommendationById(id){
  var arr = S.recommendations || [];
  var core = getRecommendationUiCore();
  if (core && typeof core.launchDashboardRecommendation === "function") {
    var coreRequest = core.launchDashboardRecommendation(id);
    if (coreRequest && coreRequest.recommendation) {
      recordRecommendationUse(coreRequest.recommendation);
      if(typeof launchPracticeItem === "function") launchPracticeItem(coreRequest.recommendation);
      return;
    }
  } else if (core && typeof core.getDashboardRecommendationById === "function") {
    var coreRecommendation = core.getDashboardRecommendationById(id);
    if (coreRecommendation) {
      recordRecommendationUse(coreRecommendation);
      if(typeof launchPracticeItem === "function") launchPracticeItem(coreRecommendation);
      return;
    }
  }
  for(var i=0;i<arr.length;i++){
    if(arr[i].id === id){
      recordRecommendationUse(arr[i]);
      if(typeof launchPracticeItem === "function") launchPracticeItem(arr[i]);
      return;
    }
  }
}
