(function() {
  // Lightweight runtime adapter the curriculum/practice engines can probe
  // for the input mode and an exercise → playable-events translation.
  // The full rhythm-engine adapter (lane mappings, chart payloads) lives
  // in ukulele_module.js as SparkUkuleleRhythmAdapter.
  window.SparkUkuleleRuntimeAdapter = {
    instrument: "ukulele",
    createPlayableEvents: function(exercise) {
      return (exercise && exercise.events) || [];
    },
    getDefaultInputMode: function() {
      return "keyboard_or_mic";
    }
  };
})();
