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

  UkuleleAdapter.prototype.getSkillTree = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getSkillTree() : [];
  };

  UkuleleAdapter.prototype.getLessons = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getLessons() : [];
  };

  UkuleleAdapter.prototype.getExercises = function(skill) {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getExercises(skill) : [];
  };

  UkuleleAdapter.prototype.getTuning = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getTuning() : ["G4", "C4", "E4", "A4"];
  };

  UkuleleAdapter.prototype.getCapabilities = function() {
    return {
      stringCount: 4,
      keyCount: null,
      supportsChords: true,
      supportsScales: true,
      supportsStrumming: true,
      supportsFingerpicking: true,
      supportsMelody: true,
      preferredRenderer: "string-lane-highway",
      inputModes: ["keyboard", "midi", "mouse"]
    };
  };

  UkuleleAdapter.prototype.getRhythmAdapter = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getRhythmAdapter() : null;
  };

  UkuleleAdapter.prototype.getSongs = function() {
    return window.SparkUkuleleModule ? window.SparkUkuleleModule.getSongs() : [];
  };

  window.SparkUkuleleAdapter = UkuleleAdapter;
})();
