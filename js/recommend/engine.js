(function(){

  function generateRecommendations(appType){
    var candidates = collectRecommendationCandidates(appType || inferRecommendationAppType());
    candidates = filterRecommendationCandidates(candidates);
    for(var i=0;i<candidates.length;i++){
      scoreRecommendationCandidate(candidates[i]);
    }
    candidates.sort(function(a,b){
      return (b.score || 0) - (a.score || 0);
    });
    var maxSuggestions = (S.recommendationSettings && S.recommendationSettings.maxSuggestions) || 5;
    var picked = balanceRecommendationSet(candidates, maxSuggestions);
    S.recommendations = picked;
    S.lastRecommendationRun = Date.now();
    return picked;
  }

  function recordRecommendationUse(candidate){
    if(!candidate) return;
    if(!Array.isArray(S.recommendationHistory)){
      S.recommendationHistory = [];
    }
    S.recommendationHistory.push({
      id: candidate.id,
      type: candidate.type,
      source: candidate.source,
      ts: Date.now()
    });
    if(S.recommendationHistory.length > 200){
      S.recommendationHistory.shift();
    }
    saveState();
  }

  function inferRecommendationAppType(){
    return /piano/i.test(typeof APP_NAME !== "undefined" ? APP_NAME : "") ? "piano" : "guitar";
  }

  // Service wrapper for engine-first architecture
  window.SparkRecommendationService = {
    generate: function(appType) {
      return generateRecommendations(appType);
    },
    recordUse: function(candidate) {
      return recordRecommendationUse(candidate);
    },
    getActive: function() {
      return (typeof S !== "undefined" && Array.isArray(S.recommendations)) ? S.recommendations : [];
    }
  };

  window.generateRecommendations = generateRecommendations;
  window.recordRecommendationUse = recordRecommendationUse;

})();
