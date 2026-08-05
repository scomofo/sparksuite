// js/sparksuite/bridges/instrument_adapter.js
// Bridges the SparkInstruments registry to the core engine.
// Provides a unified interface for retrieving the active instrument's
// curriculum data, type, and session structure.

window.SparkInstrumentAdapter = (function () {
  function getActiveInstrument() {
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    return SparkInstruments.getActive();
  }

  function resolveRegisteredInstrument(inst) {
    var candidate = inst ? (inst.id || inst.appId || inst.instrumentId || null) : null;
    var all;
    var i;
    var entry;
    if (!candidate || typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
      return inst || null;
    }
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return inst || null;
  }

  // -----------------------------------------------------------------------
  // 1. getCurriculum()
  // Gets active instrument's curriculum data.
  // Returns { chords, allChords, sessions, songs, levels, levelColors,
  //           levelNames, curriculum } or null if no active instrument.
  // -----------------------------------------------------------------------
  function getCurriculum() {
    var inst = resolveRegisteredInstrument(getActiveInstrument());
    if (!inst) return null;
    return inst.getData ? inst.getData() : null;
  }

  // -----------------------------------------------------------------------
  // 2. getInstrumentType()
  // Returns the instrument type string ("guitar", "piano", "bass") or null.
  // -----------------------------------------------------------------------
  function getInstrumentType() {
    var inst = resolveRegisteredInstrument(getActiveInstrument());
    if (!inst) return null;
    return inst.instrument || null;
  }

  // -----------------------------------------------------------------------
  // 3. getAppId()
  // Returns the app id string ("chordspark", "pianospark") or null.
  // -----------------------------------------------------------------------
  function getAppId() {
    var inst = resolveRegisteredInstrument(getActiveInstrument());
    if (!inst) return null;
    return inst.id || inst.appId || inst.instrumentId || null;
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
    var inst = resolveRegisteredInstrument(getActiveInstrument());
    return inst && inst[method] ? inst[method].apply(inst, Array.prototype.slice.call(arguments, 1)) : null;
  }

  function getSkillTree()                 { return _proxy("getSkillTree") || { branches: [] }; }
  function getCurriculumMap() {
    var legacy = _proxy("getCurriculumMap");
    if (legacy && legacy.length) return legacy;
    return _proxy("getCurriculumMapV2") || [];
  }
  function getCurriculumMapV2()           { return _proxy("getCurriculumMapV2") || []; }
  function getExercises(skillOrLessonId)  { return _proxy("getExercises", skillOrLessonId) || []; }
  function getSongs()                     { return _proxy("getSongs") || []; }
  function getDifficultyRules(context)    { return _proxy("getDifficultyRules", context) || { difficultyAction: "keep" }; }
  function analyzePerformance(sessionData){ return _proxy("analyzePerformance", sessionData) || { accuracy: 0 }; }
  function generateDrills(skill, level)   { return _proxy("generateDrills", skill, level) || []; }
  function getExercisesForLesson(lessonId) {
    var exercises = _proxy("getExercisesForLesson", lessonId);
    if (exercises && exercises.length) return exercises;
    return _proxy("getExercises", lessonId) || [];
  }
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
    getCurriculumMapV2:    getCurriculumMapV2,
    getExercises:          getExercises,
    getSongs:              getSongs,
    getDifficultyRules:    getDifficultyRules,
    analyzePerformance:    analyzePerformance,
    generateDrills:        generateDrills,
    getExercisesForLesson: getExercisesForLesson,
    getPerformanceConfig:  getPerformanceConfig
  };

})();
