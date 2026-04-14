(function(){

  function midiRouterRead(path, fallback){
    if(typeof SparkState!=="undefined"&&typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    return fallback;
  }

  function routeMidiNote(note, isOn, velocity, channel, time){
    var mapped = applyMidiProfileToNote(note, channel, velocity);
    if(!mapped || !mapped.accepted) return;

    var screen = midiRouterRead(["screen"], "");
    if(screen === SCR.PERFORM && typeof handlePerformanceMidi === "function"){
      handlePerformanceMidi(mapped.mappedNote, isOn, mapped.velocity, time);
    }

    if(screen === SCR.PERFORM_CALIBRATE && typeof recordCalibrationHit === "function" && isOn){
      recordCalibrationHit(time || performance.now());
    }

    if(typeof handlePracticeMidi === "function"){
      handlePracticeMidi(mapped, isOn, time);
    }
  }

  window.routeMidiNote = routeMidiNote;

})();
