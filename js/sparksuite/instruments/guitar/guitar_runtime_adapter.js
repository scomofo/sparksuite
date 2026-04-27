(function() {
  window.SparkGuitarRuntimeAdapter = {
    instrument: "guitar",
    createPlayableEvents: function(exercise) {
      return (exercise && exercise.events) || [];
    },
    getDefaultInputMode: function() {
      return "midi_guitar_or_mic";
    }
  };
})();
