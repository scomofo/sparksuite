(function(){

  function getAdaptiveSettings(context){
    var acc = context.accuracy || 0;
    var bpm = context.bpm || 80;

    if(acc > 0.9){
      return { bpm: bpm + 8, action:"increase" };
    }

    if(acc < 0.7){
      return { bpm: Math.max(40, bpm - 8), action:"decrease" };
    }

    return { bpm: bpm, action:"keep" };
  }

  function applyAdaptiveToExercise(exercise){
    if(!exercise) return exercise;

    var last = S.adaptiveState[exercise.id] || {};
    var settings = getAdaptiveSettings({
      accuracy:last.accuracy || 0.8,
      bpm:exercise.bpm || 80
    });

    exercise.bpm = settings.bpm;
    exercise.adaptiveAction = settings.action;
    return exercise;
  }

  function updateAdaptiveFromResult(result){
    if(!result || !result.exerciseId) return;

    S.adaptiveState[result.exerciseId] = {
      accuracy: result.accuracy,
      ts: Date.now()
    };

    saveState();
  }

  window.getAdaptiveSettings = getAdaptiveSettings;
  window.applyAdaptiveToExercise = applyAdaptiveToExercise;
  window.updateAdaptiveFromResult = updateAdaptiveFromResult;

})();
