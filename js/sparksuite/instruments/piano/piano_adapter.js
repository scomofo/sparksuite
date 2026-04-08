(function() {
  function PianoAdapter() {}

  PianoAdapter.prototype.getId = function() {
    return "pianospark";
  };

  PianoAdapter.prototype.getType = function() {
    return "piano";
  };

  PianoAdapter.prototype.getCurriculumMap = function() {
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  PianoAdapter.prototype.getSongs = function() {
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  window.SparkPianoAdapter = PianoAdapter;
})();
