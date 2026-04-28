(function() {
  function VocalsAdapter() {}

  VocalsAdapter.prototype.getId = function() {
    return "vocalspark";
  };

  VocalsAdapter.prototype.getType = function() {
    return "vocals";
  };

  VocalsAdapter.prototype.getCurriculumMap = function() {
    return window.SparkVocalsModule
      ? window.SparkVocalsModule.getLessons()
      : (window.SparkVocalsLessons || []);
  };

  VocalsAdapter.prototype.getSkillTree = function() {
    if (window.SparkVocalsModule && typeof window.SparkVocalsModule.getSkillTree === "function") {
      return window.SparkVocalsModule.getSkillTree();
    }
    return window.SparkVocalsSkillTree || [];
  };

  VocalsAdapter.prototype.getLessons = function() {
    return this.getCurriculumMap();
  };

  VocalsAdapter.prototype.getExercises = function(skill) {
    if (window.SparkVocalsModule && typeof window.SparkVocalsModule.getExercises === "function") {
      return window.SparkVocalsModule.getExercises(skill);
    }
    var lib = window.SparkVocalsExercises || {};
    return lib[skill] || [];
  };

  VocalsAdapter.prototype.getCapabilities = function() {
    if (window.SparkVocalsModule && typeof window.SparkVocalsModule.getCapabilities === "function") {
      return window.SparkVocalsModule.getCapabilities();
    }
    return {
      stringCount: null,
      keyCount: null,
      supportsPitch: true,
      preferredRenderer: "pitch-lane-highway",
      inputModes: ["microphone", "keyboard"]
    };
  };

  VocalsAdapter.prototype.getRhythmAdapter = function() {
    if (window.SparkVocalsModule && typeof window.SparkVocalsModule.getRhythmAdapter === "function") {
      return window.SparkVocalsModule.getRhythmAdapter();
    }
    return typeof SparkVocalsRhythmAdapter === "function" ? new SparkVocalsRhythmAdapter() : null;
  };

  window.SparkVocalsAdapter = VocalsAdapter;
})();
