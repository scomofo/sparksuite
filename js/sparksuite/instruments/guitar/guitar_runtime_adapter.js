(function() {
  function GuitarRuntimeAdapter() {}

  GuitarRuntimeAdapter.prototype.getLaneCount = function() {
    return 5;
  };

  GuitarRuntimeAdapter.prototype.getLaneLabels = function() {
    return ["G", "R", "Y", "B", "O"];
  };

  GuitarRuntimeAdapter.prototype.getDefaultInputMode = function() {
    return "midi_or_keyboard";
  };

  window.SparkGuitarRuntimeAdapter = GuitarRuntimeAdapter;
})();
