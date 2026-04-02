(function(){

  function routeMidiNote(note, isOn, velocity, channel, time){
    var mapped = applyMidiProfileToNote(note, channel, velocity);
    if(!mapped || !mapped.accepted) return;

    if(S.screen === SCR.PERFORM && typeof handlePerformanceMidi === "function"){
      handlePerformanceMidi(mapped.mappedNote, isOn, mapped.velocity, time);
    }

    if(S.screen === SCR.PERFORM_CALIBRATE && typeof recordCalibrationHit === "function" && isOn){
      recordCalibrationHit(time || performance.now());
    }

    if(typeof handlePracticeMidi === "function"){
      handlePracticeMidi(mapped, isOn, time);
    }
  }

  window.routeMidiNote = routeMidiNote;

})();
