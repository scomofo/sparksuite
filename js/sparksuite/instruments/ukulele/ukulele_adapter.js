(function() {
  function UkuleleAdapter() {}

  UkuleleAdapter.prototype.getId = function() {
    return "ukespark";
  };

  UkuleleAdapter.prototype.getType = function() {
    return "ukulele";
  };

  UkuleleAdapter.prototype.getCurriculumMap = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getCurriculumMap() : [];
  };

  UkuleleAdapter.prototype.getRhythmAdapter = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getRhythmAdapter() : null;
  };

  UkuleleAdapter.prototype.getSongs = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getSongs() : [];
  };

  window.SparkUkuleleAdapter = UkuleleAdapter;
})();
