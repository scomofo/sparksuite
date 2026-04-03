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
    h += '<div style="font-size:12px;color:#aaa">Type: ' + escHTML(arr[i].type) + ' · Source: ' + escHTML(arr[i].source) + '</div>';
    h += '<div style="font-size:12px;color:#aaa">Reason: ' + escHTML((arr[i].reasons || []).join(", ")) + '</div>';
    h += '<button onclick="act(\'launchRecommendation\', \''+arr[i].id+'\')">Start</button>';
    h += '</div>';
  }
  h += '</div>';
  return h;
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
      if(typeof launchPracticeItem === "function") launchPracticeItem(arr[i]);
      return;
    }
  }
}
