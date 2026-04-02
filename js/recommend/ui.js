function recommendationsPage(){
  if(!S.recommendations || !S.recommendations.length){
    generateRecommendations();
  }
  var h = '<div class="card">';
  h += '<div><b>Recommended Next</b></div>';
  var arr = S.recommendations || [];
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
  for(var i=0;i<arr.length;i++){
    if(arr[i].id === id){
      recordRecommendationUse(arr[i]);
      if(typeof launchPracticeItem === "function") launchPracticeItem(arr[i]);
      return;
    }
  }
}
