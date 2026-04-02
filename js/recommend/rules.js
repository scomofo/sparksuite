(function(){

  function filterRecommendationCandidates(candidates){
    var out = [];
    for(var i=0;i<candidates.length;i++){
      if(shouldKeepRecommendationCandidate(candidates[i])){
        out.push(candidates[i]);
      }
    }
    return out;
  }

  function shouldKeepRecommendationCandidate(candidate){
    if(!candidate || !candidate.id) return false;
    // Optional: filter out locked content
    if(candidate.type === "lesson" && candidate.meta && candidate.meta.lessonId){
      if(typeof isUnlocked === "function" && !isUnlocked("lessons", candidate.meta.lessonId)){
        // keep if it's the next curriculum lesson; adjust later if needed
      }
    }
    return true;
  }

  function balanceRecommendationSet(candidates, maxSuggestions){
    var out = [];
    var seenTypes = {};
    for(var i=0;i<candidates.length;i++){
      if(out.length >= maxSuggestions) break;
      if(!seenTypes[candidates[i].type] || candidates[i].type === "lesson"){
        out.push(candidates[i]);
        seenTypes[candidates[i].type] = true;
      }
    }
    // If not enough, fill remaining
    for(var j=0;j<candidates.length && out.length < maxSuggestions;j++){
      if(out.indexOf(candidates[j]) < 0){
        out.push(candidates[j]);
      }
    }
    return out;
  }

  window.filterRecommendationCandidates = filterRecommendationCandidates;
  window.balanceRecommendationSet = balanceRecommendationSet;

})();
