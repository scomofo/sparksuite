(function() {
  function BassAdapter() {}

  BassAdapter.prototype.getId = function() {
    return "bassspark";
  };

  BassAdapter.prototype.getType = function() {
    return "bass";
  };

  BassAdapter.prototype.getCurriculumMap = function() {
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  BassAdapter.prototype.getSongs = function() {
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  window.SparkBassAdapter = BassAdapter;
})();
