function recommendationUiRoot(){
  if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
    return SparkState.getRoot();
  }
  return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
}

function recommendationUiRead(path, fallback){
  var root = recommendationUiRoot();
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

function getRecommendationUiList(runtimeState){
  if(runtimeState && Array.isArray(runtimeState.dashboardRecommendations) && runtimeState.dashboardRecommendations.length){
    return runtimeState.dashboardRecommendations;
  }
  return recommendationUiRead("recommendations", []);
}

function recommendationsPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var arr = getRecommendationUiList(runtimeState);
  var h = '<div class="card">';
  h += '<div><b>Recommended Next</b></div>';
  if(!arr || !arr.length){
    h += '<div style="font-size:12px;color:#aaa">No recommendations are ready right now.</div>';
    h += '</div>';
    return h;
  }
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

function executeDashboardRecommendationLaunch(request){
  var launch;
  var i;
  if(!request) return false;
  launch = request.launch || null;
  if(!launch) return false;

  if(launch.helper === "play_along_section" && typeof sparkPlayAlongJumpToSectionRecommendation === "function"){
    sparkPlayAlongJumpToSectionRecommendation(launch.payload && launch.payload.trackId, launch.payload && launch.payload.sectionIndex);
    return true;
  }
  if(launch.helper === "play_along_bookmark" && typeof sparkPlayAlongLaunchBookmarkByKey === "function"){
    sparkPlayAlongLaunchBookmarkByKey(launch.payload && launch.payload.trackId, launch.payload && launch.payload.sectionIndex);
    return true;
  }
  if(Array.isArray(launch.sequence) && typeof act === "function"){
    for(i = 0; i < launch.sequence.length; i++){
      if(launch.sequence[i] && launch.sequence[i].action){
        act(launch.sequence[i].action, launch.sequence[i].value);
      }
    }
    return launch.sequence.length > 0;
  }
  if(launch.action && typeof act === "function"){
    act(launch.action, launch.value);
    return true;
  }
  return false;
}

function launchGenericRecommendationItem(item){
  if(!item || typeof act !== "function") return false;
  if(item.type === "drill"){
    if(recommendationUiRead("activeInstrument", null) === "pianospark"){
      act("goHome");
      act("tab", "games");
      act("start_drill", "level");
      return true;
    }
    act("startDrill");
    return true;
  }
  if(item.type === "review"){
    act("quickStart");
    return true;
  }
  if(item.type === "challenge"){
    act("openChallengeHub");
    return true;
  }
  if(item.type === "lesson"){
    act("guidedStart");
    return true;
  }
  return false;
}

function launchRecommendationItem(item){
  if(!item) return false;
  if(typeof launchPracticeItem === "function" && launchPracticeItem(item)) return true;
  return launchGenericRecommendationItem(item);
}

function launchRecommendationById(id){
  var arr = recommendationUiRead("recommendations", []);
  function showRecommendationLaunchError(){
    if(typeof showToast === "function") showToast("That recommendation couldn't be opened right now.");
  }
  if (window.sparkCore && typeof window.sparkCore.launchDashboardRecommendation === "function") {
    var coreRequest = window.sparkCore.launchDashboardRecommendation(id);
    if (coreRequest && coreRequest.recommendation) {
      recordRecommendationUse(coreRequest.recommendation);
      if(executeDashboardRecommendationLaunch(coreRequest)) return;
      if(launchRecommendationItem(coreRequest.recommendation)) return;
      showRecommendationLaunchError();
      return;
    }
  } else if (window.sparkCore && typeof window.sparkCore.getDashboardRecommendationById === "function") {
    var coreRecommendation = window.sparkCore.getDashboardRecommendationById(id);
    if (coreRecommendation) {
      recordRecommendationUse(coreRecommendation);
      if(launchRecommendationItem(coreRecommendation)) return;
      showRecommendationLaunchError();
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
      if(launchRecommendationItem(arr[i])) return;
      showRecommendationLaunchError();
      return;
    }
  }
}
