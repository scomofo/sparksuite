(function() {
  function InstrumentManager() {
    this.adapters = {};
  }

  InstrumentManager.prototype.register = function(type, factory) {
    this.adapters[type] = factory;
  };

  InstrumentManager.prototype.getActiveContext = function() {
    var appId = typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getAppId() : null;
    var type = typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getInstrumentType() : null;
    var adapterFactory = type && this.adapters[type] ? this.adapters[type] : null;
    var adapter = adapterFactory ? adapterFactory() : null;
    var sessions = typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getCurriculum === "function"
      ? (SparkInstrumentAdapter.getCurriculum() || {}).SESSIONS || []
      : [];
    var songs = typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs() || []
      : [];
    return {
      appId: appId,
      instrumentType: type,
      adapter: adapter,
      rhythmAdapter: adapter && typeof adapter.getRhythmAdapter === "function" ? adapter.getRhythmAdapter() : null,
      curriculumMap: adapter && typeof adapter.getCurriculumMap === "function" ? adapter.getCurriculumMap() : [],
      sessions: sessions,
      songs: songs
    };
  };

  window.SparkInstrumentManager = InstrumentManager;
})();
