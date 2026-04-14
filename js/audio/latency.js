(function(){

  function latencyStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function latencyStateRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = latencyStateRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function latencyStateWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = latencyStateRoot();
    if(root) root[path] = value;
    return value;
  }

  function latencyEnsureArray(path){
    var arr = latencyStateRead(path, null);
    if(!Array.isArray(arr)){
      arr = [];
      latencyStateWrite(path, arr);
    }
    return arr;
  }

  function recordCalibrationHit(hitTime){
    var lastClickTime = latencyStateRead("lastClickTime", 0);
    if(!lastClickTime) return;
    var offsets = latencyEnsureArray("calibrationOffsets");
    var error = hitTime - lastClickTime;
    offsets.push(error);
    if(offsets.length > 20){
      offsets.shift();
    }
    updateLatencyAverage();
  }

  function updateLatencyAverage(){
    var arr = latencyEnsureArray("calibrationOffsets");
    if(!arr.length) return;
    var total = 0;
    for(var i=0;i<arr.length;i++){
      total += arr[i];
    }
    latencyStateWrite("inputLatencyMs", total / arr.length);
    saveState();
  }

  function registerMetronomeClick(){
    latencyStateWrite("lastClickTime", performance.now());
  }

  window.recordCalibrationHit = recordCalibrationHit;
  window.registerMetronomeClick = registerMetronomeClick;

})();
