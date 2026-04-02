(function(){

  var metroInterval = null;
  var audioCtx = null;

  function getAudioCtx(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function startMetronome(bpm){
    stopMetronome();
    var interval = (60 / bpm) * 1000;
    metroInterval = setInterval(playClick, interval);
  }

  function stopMetronome(){
    if(metroInterval){
      clearInterval(metroInterval);
      metroInterval = null;
    }
  }

  function playClick(){
    if(typeof registerMetronomeClick === "function") registerMetronomeClick();
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.15);
  }

  window.startCalibrationMetronome = startMetronome;
  window.stopCalibrationMetronome = stopMetronome;

})();
