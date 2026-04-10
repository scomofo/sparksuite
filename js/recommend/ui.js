function recommendationsPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var arr = runtimeState && runtimeState.dashboardRecommendations ? runtimeState.dashboardRecommendations : S.recommendations;
  if(!arr || !arr.length){
    generateRecommendations();
    arr = S.recommendations || [];
  }
  var h = '<div class="card">';
  h += '<div><b>Recommended Next</b></div>';
  for(var i=0;i<arr.length;i++){
    h += '<div style="margin-bottom:12px;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:8px">';
    h += '<div><b>' + escHTML(arr[i].title) + '</b></div>';
    h += '<div style="font-size:12px;color:#aaa">Type: ' + escHTML(arr[i].type) + ' | Source: ' + escHTML(arr[i].source) + '</div>';
    h += '<div style="font-size:12px;color:#aaa">Reason: ' + escHTML((arr[i].reasons || []).join(", ")) + '</div>';
    h += renderRecommendationModuleProgress(arr[i]);
    h += renderRecommendationPlayAlongDetail(arr[i]);
    h += '<button onclick="act(\'launchRecommendation\', \''+arr[i].id+'\')">Start</button>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function renderRecommendationModuleProgress(recommendation){
  if(!recommendation || recommendation.source !== "module_progress" || !recommendation.meta) return "";
  var bits = [];
  if(recommendation.meta.recommendationFocus){
    bits.push("Focus: " + recommendation.meta.recommendationFocus.replace(/_/g, " "));
  }
  var summary = recommendation.meta.progressSummary;
  if(summary && summary.weakestMetric && typeof summary[summary.weakestMetric] === "number"){
    bits.push("Weakest: " + summary.weakestMetric.replace(/_/g, " ") + " " + Math.round(summary[summary.weakestMetric] * 100) + "%");
  }
  if(!bits.length) return "";
  return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(bits.join(" | ")) + '</div>';
}

function renderRecommendationPlayAlongDetail(recommendation){
  if(!recommendation || !recommendation.meta) return "";
  if(recommendation.source !== "play_along" && recommendation.source !== "play_along_bookmark") return "";
  var bits = [];
  if(recommendation.meta.trackTitle) bits.push("Song: " + recommendation.meta.trackTitle);
  if(recommendation.meta.sectionLabel) bits.push("Section: " + recommendation.meta.sectionLabel);
  if(recommendation.meta.weakAreas && recommendation.meta.weakAreas.length) bits.push("Weak: " + recommendation.meta.weakAreas.join(" | "));
  if(!bits.length) return "";
  return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(bits.join(" | ")) + '</div>';
}

function launchRecommendationById(id){
  var arr = S.recommendations || [];
  if (window.sparkCore && typeof window.sparkCore.launchDashboardRecommendation === "function") {
    var coreRequest = window.sparkCore.launchDashboardRecommendation(id);
    if (coreRequest && coreRequest.recommendation) {
      recordRecommendationUse(coreRequest.recommendation);
      if(typeof launchPracticeItem === "function") launchPracticeItem(coreRequest.recommendation);
      return;
    }
  } else if (window.sparkCore && typeof window.sparkCore.getDashboardRecommendationById === "function") {
    var coreRecommendation = window.sparkCore.getDashboardRecommendationById(id);
    if (coreRecommendation) {
      recordRecommendationUse(coreRecommendation);
      if(typeof launchPracticeItem === "function") launchPracticeItem(coreRecommendation);
      return;
    }
  }
  for(var i=0;i<arr.length;i++){
    if(arr[i].id === id){
      recordRecommendationUse(arr[i]);
      if(arr[i].source === "play_along" && typeof sparkPlayAlongJumpToSectionRecommendation === "function"){
        sparkPlayAlongJumpToSectionRecommendation(arr[i].meta && arr[i].meta.trackId, arr[i].meta && arr[i].meta.sectionIndex);
        return;
      }
      if(arr[i].source === "play_along_bookmark" && typeof sparkPlayAlongLaunchBookmarkByKey === "function"){
        sparkPlayAlongLaunchBookmarkByKey(arr[i].meta && arr[i].meta.trackId, arr[i].meta && arr[i].meta.sectionIndex);
        return;
      }
      if(typeof launchPracticeItem === "function") launchPracticeItem(arr[i]);
      return;
    }
  }
}
