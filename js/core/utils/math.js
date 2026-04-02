(function(){
  function lerp(a, b, t){
    return a + (b - a) * t;
  }

  function average(arr){
    if(!arr || !arr.length) return 0;
    var total = 0;
    for(var i = 0; i < arr.length; i++){
      total += arr[i];
    }
    return total / arr.length;
  }

  function percentile(arr, p){
    if(!arr || !arr.length) return 0;
    var sorted = arr.slice().sort(function(a, b){ return a - b; });
    var idx = Math.ceil((p / 100) * sorted.length) - 1;
    if(idx < 0) idx = 0;
    return sorted[idx];
  }

  window.lerp = lerp;
  window.average = average;
  window.percentile = percentile;
})();
