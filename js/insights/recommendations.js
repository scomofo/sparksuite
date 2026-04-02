(function(){

  function buildRecommendationInsights(){
    var hist = S.recommendationHistory || [];
    var counts = {};
    for(var i=0;i<hist.length;i++){
      var src = hist[i].source || "unknown";
      counts[src] = (counts[src] || 0) + 1;
    }
    return {
      totalAccepted: hist.length,
      bySource: counts
    };
  }

  function getMostUsedRecommendationSource(){
    var data = buildRecommendationInsights().bySource;
    var best = null;
    for(var k in data){
      if(!best || data[k] > best.count){
        best = { source:k, count:data[k] };
      }
    }
    return best;
  }

  window.buildRecommendationInsights = buildRecommendationInsights;
  window.getMostUsedRecommendationSource = getMostUsedRecommendationSource;

})();
