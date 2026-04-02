(function(){

  function updateWeakSpotsFromPerformance(result){
    if(!result) return;

    if(!S.weakSpots) S.weakSpots = {
      transitions:{},
      chords:{},
      rhythm:{},
      phrases:{}
    };

    // Transitions
    if(result.transitions){
      for(var k in result.transitions){
        updateWeakMetric(S.weakSpots.transitions, k, result.transitions[k]);
      }
    }

    // Chords
    if(result.chords){
      for(var c in result.chords){
        updateWeakMetric(S.weakSpots.chords, c, result.chords[c]);
      }
    }

    // Rhythm
    if(result.rhythm){
      for(var r in result.rhythm){
        updateWeakMetric(S.weakSpots.rhythm, r, result.rhythm[r]);
      }
    }

    // Phrases
    if(Array.isArray(result.phrases)){
      for(var i=0;i<result.phrases.length;i++){
        updateWeakMetric(S.weakSpots.phrases, result.phrases[i].id, result.phrases[i].accuracy);
      }
    }

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
    return {
      transitions: getLowestAccuracyItems(S.weakSpots.transitions || {}, 3),
      chords: getLowestAccuracyItems(S.weakSpots.chords || {}, 3),
      rhythm: getLowestAccuracyItems(S.weakSpots.rhythm || {}, 3),
      phrases: getLowestAccuracyItems(S.weakSpots.phrases || {}, 3)
    };
  }

  window.updateWeakSpotsFromPerformance = updateWeakSpotsFromPerformance;
  window.getTopWeakSpots = getTopWeakSpots;

})();
