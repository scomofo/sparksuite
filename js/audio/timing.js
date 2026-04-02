(function(){

  function getTimingRating(errorMs){
    var abs = Math.abs(errorMs);
    if(abs <= S.timingWindows.perfect) return "perfect";
    if(abs <= S.timingWindows.good) return "good";
    if(abs <= S.timingWindows.ok) return "ok";
    return "miss";
  }

  function getTimingScore(errorMs){
    var r = getTimingRating(errorMs);
    if(r==="perfect") return 1.0;
    if(r==="good") return 0.75;
    if(r==="ok") return 0.4;
    return 0;
  }

  window.getTimingRating = getTimingRating;
  window.getTimingScore = getTimingScore;

})();
