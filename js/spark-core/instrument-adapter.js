// ===== SPARK INSTRUMENT ADAPTER =====
// Bridges the SparkInstruments registry to the core engine.
// Provides a unified interface for retrieving the active instrument's
// curriculum data, type, and session structure.

window.SparkInstrumentAdapter = (function () {

  // -----------------------------------------------------------------------
  // 1. getCurriculum()
  // Gets active instrument's curriculum data.
  // Returns { chords, allChords, sessions, songs, levels, levelColors,
  //           levelNames, curriculum } or null if no active instrument.
  // -----------------------------------------------------------------------
  function getCurriculum() {
    var inst = SparkInstruments.getActive();
    if (!inst) return null;
    return inst.getData();
  }

  // -----------------------------------------------------------------------
  // 2. getInstrumentType()
  // Returns the instrument type string ("guitar", "piano", "bass") or null.
  // -----------------------------------------------------------------------
  function getInstrumentType() {
    var inst = SparkInstruments.getActive();
    if (!inst) return null;
    return inst.instrument || null;
  }

  // -----------------------------------------------------------------------
  // 3. getAppId()
  // Returns the app id string ("chordspark", "pianospark") or null.
  // -----------------------------------------------------------------------
  function getAppId() {
    var inst = SparkInstruments.getActive();
    if (!inst) return null;
    return inst.id || null;
  }

  // -----------------------------------------------------------------------
  // 4. getSessionStructure()
  // Gets instrument type and delegates to SparkPsychology.getSessionStructure.
  // -----------------------------------------------------------------------
  function getSessionStructure() {
    var type = getInstrumentType();
    return SparkPsychology.getSessionStructure(type);
  }

  // -----------------------------------------------------------------------
  // InstrumentModule interface proxies
  // -----------------------------------------------------------------------
  function _proxy(method) {
    var inst = SparkInstruments.getActive();
    return inst && inst[method] ? inst[method].apply(inst, Array.prototype.slice.call(arguments, 1)) : null;
  }

  function getSkillTree()                 { return _proxy("getSkillTree") || { branches: [] }; }
  function getCurriculumMap()             { return _proxy("getCurriculumMap") || []; }
  function getExercises()                 { return _proxy("getExercises") || []; }
  function getSongs()                     { return _proxy("getSongs") || []; }
  function getDifficultyRules(context)    { return _proxy("getDifficultyRules", context) || { difficultyAction: "keep" }; }
  function analyzePerformance(sessionData){ return _proxy("analyzePerformance", sessionData) || { accuracy: 0 }; }
  function generateDrills(skill, level)   { return _proxy("generateDrills", skill, level) || []; }
  function getExercisesForLesson(lessonId) { return _proxy("getExercisesForLesson", lessonId) || []; }
  function getPerformanceConfig()           { return _proxy("getPerformanceConfig") || {}; }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  return {
    getCurriculum:         getCurriculum,
    getInstrumentType:     getInstrumentType,
    getAppId:              getAppId,
    getSessionStructure:   getSessionStructure,
    getSkillTree:          getSkillTree,
    getCurriculumMap:      getCurriculumMap,
    getExercises:          getExercises,
    getSongs:              getSongs,
    getDifficultyRules:    getDifficultyRules,
    analyzePerformance:    analyzePerformance,
    generateDrills:        generateDrills,
    getExercisesForLesson: getExercisesForLesson,
    getPerformanceConfig:  getPerformanceConfig
  };

})();
