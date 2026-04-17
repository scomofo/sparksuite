(function() {
  function InstrumentManager() {
    this.adapters = {};
  }

  InstrumentManager.prototype.register = function(type, factory) {
    this.adapters[type] = factory;
  };

  InstrumentManager.prototype.getActiveContext = function() {
    var activeInstrument = typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function"
      ? SparkInstruments.getActive()
      : null;
    var appId = typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getAppId() : null;
    var type = typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getInstrumentType() : null;
    if (!appId && activeInstrument) appId = activeInstrument.id || activeInstrument.appId || null;
    if (!type && activeInstrument) type = activeInstrument.instrument || null;
    var adapterFactory = type && this.adapters[type] ? this.adapters[type] : null;
    var adapter = adapterFactory ? adapterFactory() : null;
    var sessions = typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getCurriculum === "function"
      ? (SparkInstrumentAdapter.getCurriculum() || {}).SESSIONS || []
      : [];
    var songs = typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs() || []
      : [];
    if (!sessions.length && activeInstrument && typeof activeInstrument.getData === "function") {
      var data = activeInstrument.getData() || {};
      sessions = data.SESSIONS || [];
    }
    if (!songs.length && activeInstrument && typeof activeInstrument.getSongs === "function") {
      songs = activeInstrument.getSongs() || [];
    }
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
