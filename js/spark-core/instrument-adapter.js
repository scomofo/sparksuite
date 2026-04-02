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
  // Public API
  // -----------------------------------------------------------------------
  return {
    getCurriculum:        getCurriculum,
    getInstrumentType:    getInstrumentType,
    getAppId:             getAppId,
    getSessionStructure:  getSessionStructure
  };

})();
