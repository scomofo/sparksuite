(function(){

  function recordCalibrationHit(hitTime){
    if(!S.lastClickTime) return;
    var error = hitTime - S.lastClickTime;
    S.calibrationOffsets.push(error);
    if(S.calibrationOffsets.length > 20){
      S.calibrationOffsets.shift();
    }
    updateLatencyAverage();
  }

  function updateLatencyAverage(){
    var arr = S.calibrationOffsets;
    if(!arr.length) return;
    var total = 0;
    for(var i=0;i<arr.length;i++){
      total += arr[i];
    }
    S.inputLatencyMs = total / arr.length;
    saveState();
  }

  function registerMetronomeClick(){
    S.lastClickTime = performance.now();
  }

  window.recordCalibrationHit = recordCalibrationHit;
  window.registerMetronomeClick = registerMetronomeClick;

})();
