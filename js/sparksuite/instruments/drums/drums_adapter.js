(function() {
  function DrumsAdapter() {}

  DrumsAdapter.prototype.getId = function() {
    return "drumspark";
  };

  DrumsAdapter.prototype.getType = function() {
    return "drums";
  };

  DrumsAdapter.prototype.getCurriculumMap = function() {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getCurriculumMap() : [];
  };

  DrumsAdapter.prototype.getSkillTree = function() {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getSkillTree() : [];
  };

  DrumsAdapter.prototype.getLessons = function() {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getLessons() : [];
  };

  DrumsAdapter.prototype.getExercises = function(skill) {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getExercises(skill) : [];
  };

  DrumsAdapter.prototype.getTuning = function() {
    return null;
  };

  DrumsAdapter.prototype.getCapabilities = function() {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getCapabilities() : {
      preferredRenderer: "drum-lane-highway",
      inputModes: ["keyboard", "midi", "mouse"]
    };
  };

  DrumsAdapter.prototype.getRhythmAdapter = function() {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getRhythmAdapter() : null;
  };

  DrumsAdapter.prototype.getSongs = function() {
    return window.SparkDrumsModule ? window.SparkDrumsModule.getSongs() : [];
  };

  window.SparkDrumsAdapter = DrumsAdapter;
})();
