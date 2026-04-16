(function(){
  function recommendationStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function recommendationStateRead(path, fallback){
    var root = recommendationStateRoot();
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

  function recommendationStateWrite(path, value){
    var root = recommendationStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function generateRecommendations(appType){
    var candidates = collectRecommendationCandidates(appType || inferRecommendationAppType());
    candidates = filterRecommendationCandidates(candidates);
    for(var i=0;i<candidates.length;i++){
      scoreRecommendationCandidate(candidates[i]);
    }
    candidates.sort(function(a,b){
      return (b.score || 0) - (a.score || 0);
    });
    var maxSuggestions = recommendationStateRead(["recommendationSettings", "maxSuggestions"], 5) || 5;
    var picked = balanceRecommendationSet(candidates, maxSuggestions);
    recommendationStateWrite("recommendations", picked);
    recommendationStateWrite("lastRecommendationRun", Date.now());
    recommendationStateWrite("recommendationInstrumentId", recommendationStateRead("activeInstrument", null));
    return picked;
  }

  function recordRecommendationUse(candidate){
    if(!candidate) return;
    var history = recommendationStateRead("recommendationHistory", []);
    if(!Array.isArray(history)) history = [];
    history.push({
      id: candidate.id,
      type: candidate.type,
      source: candidate.source,
      ts: Date.now()
    });
    if(history.length > 200){
      history.shift();
    }
    recommendationStateWrite("recommendationHistory", history);
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
      return recommendationStateRead("recommendations", []);
    }
  };

  window.generateRecommendations = generateRecommendations;
  window.recordRecommendationUse = recordRecommendationUse;

})();
