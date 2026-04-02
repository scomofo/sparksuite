(function(){
  function calculateMasteryFromAccuracy(prev, accuracy){
    if(prev === undefined) return accuracy;
    return (prev * 0.7) + (accuracy * 0.3);
  }

  function updateSparkMastery(bucket, id, accuracy){
    if(!bucket[id]){
      bucket[id] = accuracy;
    }else{
      bucket[id] = calculateMasteryFromAccuracy(bucket[id], accuracy);
    }
  }

  window.calculateMasteryFromAccuracy = calculateMasteryFromAccuracy;
  window.updateSparkMastery = updateSparkMastery;
})();
