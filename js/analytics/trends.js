(function(){

  function average(arr, field){
    if(!arr.length) return 0;
    var total = 0;
    for(var i=0;i<arr.length;i++){
      total += arr[i][field] || 0;
    }
    return total / arr.length;
  }

  function getAverageAccuracy(){
    return average(S.analytics.accuracyHistory || [], "accuracy");
  }

  function getAveragePracticeMinutes(){
    return average(S.analytics.practiceHistory || [], "minutes");
  }

  function getRecentAccuracyTrend(){
    var arr = S.analytics.accuracyHistory || [];
    if(arr.length < 2) return 0;
    return arr[arr.length-1].accuracy - arr[arr.length-2].accuracy;
  }

  function getXPTrend(){
    var arr = S.analytics.xpHistory || [];
    if(arr.length < 2) return 0;
    return arr[arr.length-1].xp - arr[arr.length-2].xp;
  }

  window.getAverageAccuracy = getAverageAccuracy;
  window.getAveragePracticeMinutes = getAveragePracticeMinutes;
  window.getRecentAccuracyTrend = getRecentAccuracyTrend;
  window.getXPTrend = getXPTrend;

})();
