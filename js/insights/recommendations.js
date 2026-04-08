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
      bySource: counts,
      focusedTechnique: buildFocusedTechniqueInsight()
    };
  }

  function buildFocusedTechniqueInsight(){
    var perf = S.performanceStats || {};
    var best = null;
    for(var key in perf){
      if(!Object.prototype.hasOwnProperty.call(perf, key)) continue;
      var bucket = perf[key];
      if(!bucket || !bucket.lastFocusedTechnique || !bucket.importedTechniqueTotals) continue;
      var focused = bucket.importedTechniqueTotals[bucket.lastFocusedTechnique];
      if(!focused || !focused.total) continue;
      var accuracy = Math.round(((focused.hits || 0) / focused.total) * 100);
      if(accuracy >= 90) continue;
      var priority = (100 - accuracy) + Math.min(20, (bucket.focusedTechniqueRuns && bucket.focusedTechniqueRuns[bucket.lastFocusedTechnique]) || 0);
      if(!best || priority > best.priority){
        best = {
          songId: bucket.songId || key,
          arrangementType: bucket.arrangement || "imported_chart",
          difficultyId: bucket.difficulty || "normal",
          techniqueKey: bucket.lastFocusedTechnique,
          techniqueLabel: formatTechniqueInsightLabel(bucket.lastFocusedTechnique),
          accuracy: accuracy,
          focusedRuns: bucket.focusedTechniqueRuns && bucket.focusedTechniqueRuns[bucket.lastFocusedTechnique] || 0,
          priority: priority
        };
      }
    }
    return best;
  }

  function formatTechniqueInsightLabel(key){
    var labels = {
      open: "open-note timing",
      tap: "tap-note consistency",
      forced: "forced-note transitions",
      specialPhrase: "phrase section control"
    };
    return labels[key] || String(key || "imported technique");
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
  window.buildFocusedTechniqueInsight = buildFocusedTechniqueInsight;

})();
