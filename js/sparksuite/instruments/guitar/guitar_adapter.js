(function() {
  function GuitarAdapter() {}

  GuitarAdapter.prototype.getId = function() {
    return "chordspark";
  };

  GuitarAdapter.prototype.getType = function() {
    return "guitar";
  };

  GuitarAdapter.prototype.getCurriculumMap = function() {
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  GuitarAdapter.prototype.getRhythmAdapter = function() {
    return new SparkGuitarRhythmAdapter();
  };

  window.SparkGuitarAdapter = GuitarAdapter;
})();
