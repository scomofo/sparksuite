(function(){

  function weakSpotRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function weakSpotRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = weakSpotRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function weakSpotWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = weakSpotRoot();
    if(!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if(parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function ensureWeakSpots(){
    var weakSpots = weakSpotRead("weakSpots", null);
    if(!weakSpots || typeof weakSpots !== "object" || Array.isArray(weakSpots)){
      weakSpots = {};
    }
    if(!weakSpots.transitions) weakSpots.transitions = {};
    if(!weakSpots.chords) weakSpots.chords = {};
    if(!weakSpots.rhythm) weakSpots.rhythm = {};
    if(!weakSpots.phrases) weakSpots.phrases = {};
    weakSpotWrite("weakSpots", weakSpots);
    return weakSpots;
  }

  function updateWeakSpotsFromPerformance(result){
    if(!result) return;
    if(window.sparkCore && typeof window.sparkCore.updateLegacyWeakSpotsFromPerformance === "function"){
      window.sparkCore.updateLegacyWeakSpotsFromPerformance(result);
      return;
    }

    var weakSpots = ensureWeakSpots();

    // Transitions
    if(result.transitions){
      for(var k in result.transitions){
        updateWeakMetric(weakSpots.transitions, k, result.transitions[k]);
      }
    }

    // Chords
    if(result.chords){
      for(var c in result.chords){
        updateWeakMetric(weakSpots.chords, c, result.chords[c]);
      }
    }

    // Rhythm
    if(result.rhythm){
      for(var r in result.rhythm){
        updateWeakMetric(weakSpots.rhythm, r, result.rhythm[r]);
      }
    }

    // Phrases
    if(Array.isArray(result.phrases)){
      for(var i=0;i<result.phrases.length;i++){
        updateWeakMetric(weakSpots.phrases, result.phrases[i].id, result.phrases[i].accuracy);
      }
    }

    weakSpotWrite("weakSpots", weakSpots);
    saveState();
  }

  function updateWeakMetric(bucket, key, accuracy){
    if(!bucket[key]){
      bucket[key] = { accuracy: accuracy, attempts:1 };
    }else{
      var prev = bucket[key];
      prev.accuracy = (prev.accuracy * prev.attempts + accuracy) / (prev.attempts + 1);
      prev.attempts++;
    }
  }

  function getLowestAccuracyItems(bucket, limit){
    var arr = [];
    for(var k in bucket){
      arr.push({ key:k, accuracy:bucket[k].accuracy });
    }
    arr.sort(function(a,b){ return a.accuracy - b.accuracy; });
    return arr.slice(0, limit || 3);
  }

  function getTopWeakSpots(){
    var weakSpots = ensureWeakSpots();
    return {
      transitions: getLowestAccuracyItems(weakSpots.transitions || {}, 3),
      chords: getLowestAccuracyItems(weakSpots.chords || {}, 3),
      rhythm: getLowestAccuracyItems(weakSpots.rhythm || {}, 3),
      phrases: getLowestAccuracyItems(weakSpots.phrases || {}, 3)
    };
  }

  window.updateWeakSpotsFromPerformance = updateWeakSpotsFromPerformance;
  window.getTopWeakSpots = getTopWeakSpots;

})();
