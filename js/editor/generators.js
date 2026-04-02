(function(){

  function generateTransitionExercise(chordA, chordB, bars){
    var events = [];
    var t = 0;
    for(var i=0;i<bars;i++){
      events.push({ t:t, chord:chordA });
      t += 2;
      events.push({ t:t, chord:chordB });
      t += 2;
    }
    return { events:events };
  }

  function generateScaleExercise(scaleNotes, bpm){
    var events = [];
    var t = 0;
    for(var i=0;i<scaleNotes.length;i++){
      events.push({ t:t, note:scaleNotes[i] });
      t += 0.5;
    }
    return { events:events, bpm:bpm };
  }

  window.generateTransitionExercise = generateTransitionExercise;
  window.generateScaleExercise = generateScaleExercise;

})();
