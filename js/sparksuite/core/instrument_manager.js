(function() {
  function createModuleAdapter(activeInstrument) {
    if (!activeInstrument) return null;
    return {
      getId: function() {
        return activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null;
      },
      getType: function() {
        return activeInstrument.instrument || null;
      },
      getCurriculumMap: function() {
        return typeof activeInstrument.getCurriculumMap === "function" ? activeInstrument.getCurriculumMap() : [];
      },
      getSongs: function() {
        return typeof activeInstrument.getSongs === "function" ? activeInstrument.getSongs() : [];
      },
      getRhythmAdapter: function() {
        return typeof activeInstrument.getRhythmAdapter === "function" ? activeInstrument.getRhythmAdapter() : null;
      }
    };
  }

  function resolveActiveInstrument() {
    var activeInstrument = typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function"
      ? SparkInstruments.getActive()
      : null;
    var candidate = activeInstrument ? (activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null) : null;
    var all;
    var i;
    var entry;
    if (!candidate || typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
      return activeInstrument;
    }
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return activeInstrument;
  }

  function InstrumentManager() {
    this.adapters = {};
  }

  InstrumentManager.prototype.register = function(type, factory) {
    this.adapters[type] = factory;
  };

  InstrumentManager.prototype.getActiveContext = function() {
    var activeInstrument = resolveActiveInstrument();
    var appId = activeInstrument ? (activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null) : null;
    var type = activeInstrument ? (activeInstrument.instrument || null) : null;
    if (!appId && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getAppId === "function") {
      appId = SparkInstrumentAdapter.getAppId();
    }
    if (!type && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getInstrumentType === "function") {
      type = SparkInstrumentAdapter.getInstrumentType();
    }
    var adapterFactory = type && this.adapters[type] ? this.adapters[type] : null;
    var adapter = activeInstrument && (
      typeof activeInstrument.getCurriculumMap === "function" ||
      typeof activeInstrument.getRhythmAdapter === "function" ||
      typeof activeInstrument.getSongs === "function"
    ) ? createModuleAdapter(activeInstrument) : (adapterFactory ? adapterFactory() : null);
    var data = activeInstrument && typeof activeInstrument.getData === "function"
      ? (activeInstrument.getData() || {})
      : null;
    var sessions = data ? data.SESSIONS || [] : [];
    var songs = activeInstrument && typeof activeInstrument.getSongs === "function"
      ? activeInstrument.getSongs() || []
      : [];
    if (!sessions.length && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getCurriculum === "function") {
      sessions = (SparkInstrumentAdapter.getCurriculum() || {}).SESSIONS || [];
    }
    if (!songs.length && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function") {
      songs = SparkInstrumentAdapter.getSongs() || [];
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
