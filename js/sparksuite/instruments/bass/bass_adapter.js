(function() {
  function BassAdapter() {}

  function getBassModule() {
    return typeof SparkBassModule !== "undefined" ? SparkBassModule : null;
  }

  BassAdapter.prototype.getId = function() {
    return "bassspark";
  };

  BassAdapter.prototype.getType = function() {
    return "bass";
  };

  BassAdapter.prototype.getCurriculumMap = function() {
    var module = getBassModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  BassAdapter.prototype.getSongs = function() {
    var module = getBassModule();
    if (module && typeof module.getSongs === "function") {
      return module.getSongs();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  BassAdapter.prototype.getRhythmAdapter = function() {
    var module = getBassModule();
    return module && typeof module.getRhythmAdapter === "function" ? module.getRhythmAdapter() : null;
  };

  window.SparkBassAdapter = BassAdapter;
})();
