(function(){
  function recommendationScoringRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function recommendationScoringRead(path, fallback){
    var root = recommendationScoringRoot();
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

  function scoreRecommendationCandidate(candidate){
    var score = 0;
    score += scoreWeakSpotWeight(candidate);
    score += scoreCurriculumWeight(candidate);
    score += scoreModuleProgressWeight(candidate);
    score += scoreModuleProgressSeverityWeight(candidate);
    score += scoreVarietyWeight(candidate);
    score += scoreUnlockWeight(candidate);
    score += scoreGoalWeight(candidate);
    score += scoreRecencyWeight(candidate);
    candidate.score = score;
    return candidate;
  }

  function scoreWeakSpotWeight(candidate){
    if(candidate.source === "weakspot") return 40;
    if(candidate.source === "play_along") return 38;
    if(candidate.source === "play_along_bookmark") return 28;
    return 0;
  }

  function scoreCurriculumWeight(candidate){
    if(candidate.source === "curriculum") return 35;
    return 0;
  }

  function scoreModuleProgressWeight(candidate){
    if(candidate.source === "module_progress") return 30;
    return 0;
  }

  function scoreModuleProgressSeverityWeight(candidate){
    if(candidate.source !== "module_progress" || !candidate.meta || !candidate.meta.progressSummary) return 0;
    var summary = candidate.meta.progressSummary;
    var metric = summary.weakestMetric;
    if(!metric || typeof summary[metric] !== "number") return 0;
    return Math.max(0, Math.round((1 - summary[metric]) * 20));
  }

  function scoreVarietyWeight(candidate){
    var history = recommendationScoringRead("recommendationHistory", []);
    if(!history || !history.length) return 10;
    var recentIds = history.slice(-10).map(function(x){ return x.id; });
    if(recentIds.indexOf(candidate.id) >= 0) return -20;
    return 10;
  }

  function scoreUnlockWeight(candidate){
    if(candidate.source === "unlock") return 25;
    return 0;
  }

  function scoreGoalWeight(candidate){
    if(candidate.source === "challenge") return 20;
    if(candidate.source === "play_along" && candidate.meta && candidate.meta.weakAreas && candidate.meta.weakAreas.length) return 12;
    return 0;
  }

  function scoreRecencyWeight(candidate){
    return 5;
  }

  window.scoreRecommendationCandidate = scoreRecommendationCandidate;

})();
