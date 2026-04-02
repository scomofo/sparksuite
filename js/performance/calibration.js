(function(){

  function getActivePerformanceOffsetMs(mode){
    var globalOffset = S.performTimingOffsetMs || 0;
    if(mode==="midi") return globalOffset + (S.performMidiOffsetMs || 0);
    if(mode==="mic") return globalOffset + (S.performMicOffsetMs || 0);
    return globalOffset;
  }

  function beginPerformanceCalibration(source){
    S.performCalibrationMode = true;
    S.performCalibrationSource = source || "midi";
    S.performCalibrationHits = [];
  }

  function stopPerformanceCalibration(){
    S.performCalibrationMode = false;
    stopPerformanceCalibrationRun();
  }

  function recordCalibrationHit(targetMs, actualMs){
    if(!Array.isArray(S.performCalibrationHits)) S.performCalibrationHits = [];
    S.performCalibrationHits.push({
      targetMs: targetMs,
      actualMs: actualMs,
      deltaMs: actualMs - targetMs
    });
    if(S.performCalibrationHits.length > 32){
      S.performCalibrationHits.shift();
    }
  }

  function computeCalibrationOffsetMs(){
    var hits = S.performCalibrationHits || [];
    if(!hits.length) return 0;

    var deltas = hits.map(function(h){ return h.deltaMs; }).sort(function(a,b){ return a-b; });
    var median = deltas[Math.floor(deltas.length/2)];
    return Math.round(median);
  }

  function applyCalibrationOffset(){
    var offset = computeCalibrationOffsetMs();
    if(S.performCalibrationSource==="midi"){
      S.performMidiOffsetMs = offset;
    }else if(S.performCalibrationSource==="mic"){
      S.performMicOffsetMs = offset;
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
    beginPerformanceCalibration(S.performCalibrationSource);
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
