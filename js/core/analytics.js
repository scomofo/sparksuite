(function(){
  function recordPerformanceAnalytics(result){
    if(!S.analytics) S.analytics = {
      performances: []
    };
    S.analytics.performances.push(result);
    if(typeof saveState === "function") saveState();
  }

  function getAverageAccuracy(){
    var arr = (S.analytics && S.analytics.performances) || [];
    if(!arr.length) return 0;
    var total = 0;
    for(var i=0;i<arr.length;i++){
      total += arr[i].accuracy || 0;
    }
    return total / arr.length;
  }

  window.recordPerformanceAnalytics = recordPerformanceAnalytics;
  window.getAverageAccuracy = getAverageAccuracy;
})();
