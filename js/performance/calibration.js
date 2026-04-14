(function(){

  function performanceCalibrationRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function performanceCalibrationRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = performanceCalibrationRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function performanceCalibrationWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = performanceCalibrationRoot();
    if(root) root[path] = value;
    return value;
  }

  function getActivePerformanceOffsetMs(mode){
    var globalOffset = performanceCalibrationRead("performTimingOffsetMs", 0) || 0;
    if(mode==="midi") return globalOffset + (performanceCalibrationRead("performMidiOffsetMs", 0) || 0);
    if(mode==="mic") return globalOffset + (performanceCalibrationRead("performMicOffsetMs", 0) || 0);
    return globalOffset;
  }

  function beginPerformanceCalibration(source){
    performanceCalibrationWrite("performCalibrationMode", true);
    performanceCalibrationWrite("performCalibrationSource", source || "midi");
    performanceCalibrationWrite("performCalibrationHits", []);
  }

  function stopPerformanceCalibration(){
    performanceCalibrationWrite("performCalibrationMode", false);
    stopPerformanceCalibrationRun();
  }

  function recordCalibrationHit(targetMs, actualMs){
    var hits = Array.isArray(performanceCalibrationRead("performCalibrationHits", [])) ? performanceCalibrationRead("performCalibrationHits", []) : [];
    hits.push({
      targetMs: targetMs,
      actualMs: actualMs,
      deltaMs: actualMs - targetMs
    });
    if(hits.length > 32){
      hits.shift();
    }
    performanceCalibrationWrite("performCalibrationHits", hits);
  }

  function computeCalibrationOffsetMs(){
    var hits = performanceCalibrationRead("performCalibrationHits", []) || [];
    if(!hits.length) return 0;

    var deltas = hits.map(function(h){ return h.deltaMs; }).sort(function(a,b){ return a-b; });
    var median = deltas[Math.floor(deltas.length/2)];
    return Math.round(median);
  }

  function applyCalibrationOffset(){
    var offset = computeCalibrationOffsetMs();
    if(performanceCalibrationRead("performCalibrationSource", "midi")==="midi"){
      performanceCalibrationWrite("performMidiOffsetMs", offset);
    }else if(performanceCalibrationRead("performCalibrationSource", "midi")==="mic"){
      performanceCalibrationWrite("performMicOffsetMs", offset);
    }
    saveState();
    return offset;
  }

  // Calibration runtime
  var _perfCalTimer = null;
  var _perfCalStartMs = 0;
  var _perfCalBeatIntervalMs = 1000;
  var _perfCalBeatIndex = 0;

  function startPerformanceCalibrationRun(){
    stopPerformanceCalibrationRun();
    beginPerformanceCalibration(performanceCalibrationRead("performCalibrationSource", "midi"));
    _perfCalStartMs = performance.now();
    _perfCalBeatIndex = 0;

    _perfCalTimer = setInterval(function(){
      _perfCalBeatIndex++;
      // Play a metronome click as the cue
      try {
        var ctx = ensureAudio();
        var now = ctx.currentTime;
        _metronomeClick(ctx, now, _perfCalBeatIndex % 4 === 0);
      } catch(e) {}
      render();
    }, _perfCalBeatIntervalMs);
  }

  function stopPerformanceCalibrationRun(){
    if(_perfCalTimer){
      clearInterval(_perfCalTimer);
      _perfCalTimer = null;
    }
  }

  function getCalibrationBeatIndex(){ return _perfCalBeatIndex; }
  function getCalibrationStartMs(){ return _perfCalStartMs; }
  function getCalibrationBeatIntervalMs(){ return _perfCalBeatIntervalMs; }

  window.getActivePerformanceOffsetMs = getActivePerformanceOffsetMs;
  window.beginPerformanceCalibration = beginPerformanceCalibration;
  window.stopPerformanceCalibration = stopPerformanceCalibration;
  window.recordCalibrationHit = recordCalibrationHit;
  window.computeCalibrationOffsetMs = computeCalibrationOffsetMs;
  window.applyCalibrationOffset = applyCalibrationOffset;
  window.startPerformanceCalibrationRun = startPerformanceCalibrationRun;
  window.stopPerformanceCalibrationRun = stopPerformanceCalibrationRun;
  window.getCalibrationBeatIndex = getCalibrationBeatIndex;
  window.getCalibrationStartMs = getCalibrationStartMs;
  window.getCalibrationBeatIntervalMs = getCalibrationBeatIntervalMs;

})();
