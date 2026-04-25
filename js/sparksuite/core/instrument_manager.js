(function() {
  function hasDirectInstrumentCapabilities(entry) {
    return !!(entry && (
      typeof entry.getCurriculumMap === "function" ||
      typeof entry.getCurriculumMapV2 === "function" ||
      typeof entry.getLessons === "function" ||
      typeof entry.getExercises === "function" ||
      typeof entry.getTuning === "function" ||
      typeof entry.getRhythmAdapter === "function" ||
      typeof entry.getSongs === "function"
    ));
  }

  function validateAdapter(type, adapter) {
    var required = ["getId", "getType", "getCurriculumMap"];
    var i;
    if (!adapter || typeof adapter !== "object") {
      throw new Error('Instrument "' + type + '" adapter factory must return an object');
    }
    for (i = 0; i < required.length; i++) {
      if (typeof adapter[required[i]] !== "function") {
        throw new Error('Instrument "' + type + '" adapter missing required method: ' + required[i]);
      }
    }
  }

  function mergeInstrumentEntry(primary, fallback) {
    var merged = {};
    var key;
    primary = primary || {};
    fallback = fallback || {};
    for (key in fallback) {
      if (Object.prototype.hasOwnProperty.call(fallback, key)) merged[key] = fallback[key];
    }
    for (key in primary) {
      if (Object.prototype.hasOwnProperty.call(primary, key)) merged[key] = primary[key];
    }
    return merged;
  }

  function looksLikeCurriculumV2Sessions(curriculumMap) {
    var first;
    if (!Array.isArray(curriculumMap) || !curriculumMap.length) return false;
    first = curriculumMap[0] || {};
    return first.source === "curriculum-v2" || Array.isArray(first.blocks);
  }

  function createModuleAdapter(activeInstrument, fallbackAdapter) {
    if (!activeInstrument && !fallbackAdapter) return null;
    return {
      getId: function() {
        return activeInstrument
          ? (activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null)
          : (fallbackAdapter && typeof fallbackAdapter.getId === "function" ? fallbackAdapter.getId() : null);
      },
      getType: function() {
        return activeInstrument && activeInstrument.instrument
          ? activeInstrument.instrument
          : (fallbackAdapter && typeof fallbackAdapter.getType === "function" ? fallbackAdapter.getType() : null);
      },
      getCurriculumMap: function() {
        var map = activeInstrument && typeof activeInstrument.getCurriculumMap === "function" ? activeInstrument.getCurriculumMap() : [];
        if (Array.isArray(map) && map.length) return map;
        map = activeInstrument && typeof activeInstrument.getCurriculumMapV2 === "function" ? activeInstrument.getCurriculumMapV2() : [];
        if (Array.isArray(map) && map.length) return map;
        return fallbackAdapter && typeof fallbackAdapter.getCurriculumMap === "function" ? (fallbackAdapter.getCurriculumMap() || []) : [];
      },
      getCurriculumMapV2: function() {
        var map = activeInstrument && typeof activeInstrument.getCurriculumMapV2 === "function" ? activeInstrument.getCurriculumMapV2() : [];
        if (Array.isArray(map) && map.length) return map;
        return fallbackAdapter && typeof fallbackAdapter.getCurriculumMapV2 === "function" ? (fallbackAdapter.getCurriculumMapV2() || []) : [];
      },
      getSongs: function() {
        var songs = activeInstrument && typeof activeInstrument.getSongs === "function" ? activeInstrument.getSongs() : [];
        if (Array.isArray(songs) && songs.length) return songs;
        return fallbackAdapter && typeof fallbackAdapter.getSongs === "function" ? (fallbackAdapter.getSongs() || []) : [];
      },
      getLessons: function() {
        var lessons = activeInstrument && typeof activeInstrument.getLessons === "function" ? activeInstrument.getLessons() : [];
        if (Array.isArray(lessons) && lessons.length) return lessons;
        return fallbackAdapter && typeof fallbackAdapter.getLessons === "function" ? (fallbackAdapter.getLessons() || []) : [];
      },
      getExercises: function(skill) {
        var exercises = activeInstrument && typeof activeInstrument.getExercises === "function" ? activeInstrument.getExercises(skill) : [];
        if (Array.isArray(exercises) && exercises.length) return exercises;
        return fallbackAdapter && typeof fallbackAdapter.getExercises === "function" ? (fallbackAdapter.getExercises(skill) || []) : [];
      },
      getTuning: function() {
        var tuning = activeInstrument && typeof activeInstrument.getTuning === "function" ? activeInstrument.getTuning() : null;
        if (tuning) return tuning;
        return fallbackAdapter && typeof fallbackAdapter.getTuning === "function" ? fallbackAdapter.getTuning() : null;
      },
      pickPracticeExercise: function(lesson, exercises, state) {
        if (activeInstrument && typeof activeInstrument.pickPracticeExercise === "function") {
          return activeInstrument.pickPracticeExercise(lesson, exercises, state);
        }
        return fallbackAdapter && typeof fallbackAdapter.pickPracticeExercise === "function"
          ? fallbackAdapter.pickPracticeExercise(lesson, exercises, state)
          : null;
      },
      getPracticeRecommendation: function(lesson, exercise, state) {
        if (activeInstrument && typeof activeInstrument.getPracticeRecommendation === "function") {
          return activeInstrument.getPracticeRecommendation(lesson, exercise, state);
        }
        return fallbackAdapter && typeof fallbackAdapter.getPracticeRecommendation === "function"
          ? fallbackAdapter.getPracticeRecommendation(lesson, exercise, state)
          : null;
      },
      getRhythmAdapter: function() {
        var adapter = activeInstrument && typeof activeInstrument.getRhythmAdapter === "function" ? activeInstrument.getRhythmAdapter() : null;
        if (adapter) return adapter;
        return fallbackAdapter && typeof fallbackAdapter.getRhythmAdapter === "function" ? fallbackAdapter.getRhythmAdapter() : null;
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
      if (entry.id === candidate || entry.appId === candidate) return mergeInstrumentEntry(activeInstrument, entry);
    }
    return activeInstrument;
  }

  function InstrumentManager() {
    this.adapters = {};
  }

  InstrumentManager.prototype.register = function(type, factory) {
    var adapter;
    if (typeof factory !== "function") {
      throw new Error('Instrument "' + type + '" registration requires an adapter factory');
    }
    adapter = factory();
    validateAdapter(type, adapter);
    this.adapters[type] = factory;
  };

  InstrumentManager.prototype.requireFactory = function(type) {
    var factory = type && this.adapters[type] ? this.adapters[type] : null;
    if (!factory) {
      throw new Error(
        'Instrument "' + type + '" is not registered. Registered: ' +
        (Object.keys(this.adapters).length ? Object.keys(this.adapters).join(", ") : "none")
      );
    }
    return factory;
  };

  InstrumentManager.prototype.listInstruments = function() {
    return Object.keys(this.adapters).sort();
  };

  InstrumentManager.prototype.getActiveContext = function() {
    var activeInstrument = resolveActiveInstrument();
    var appId = activeInstrument ? (activeInstrument.id || activeInstrument.appId || activeInstrument.instrumentId || null) : null;
    var type = activeInstrument ? (activeInstrument.instrument || null) : null;
    var adapterFactory;
    var fallbackAdapter;
    var adapter;
    var data;
    var sessions;
    var songs;
    var curriculumMap;
    if (!appId && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getAppId === "function") {
      appId = SparkInstrumentAdapter.getAppId();
    }
    if (!type && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getInstrumentType === "function") {
      type = SparkInstrumentAdapter.getInstrumentType();
    }
    adapterFactory = type && this.adapters[type] ? this.adapters[type] : null;
    if (type && !adapterFactory && !hasDirectInstrumentCapabilities(activeInstrument)) {
      this.requireFactory(type);
    }
    fallbackAdapter = adapterFactory ? adapterFactory() : null;
    adapter = activeInstrument && (
      hasDirectInstrumentCapabilities(activeInstrument)
    ) ? createModuleAdapter(activeInstrument, fallbackAdapter) : fallbackAdapter;
    data = activeInstrument && typeof activeInstrument.getData === "function"
      ? (activeInstrument.getData() || {})
      : null;
    sessions = data ? data.SESSIONS || [] : [];
    songs = activeInstrument && typeof activeInstrument.getSongs === "function"
      ? activeInstrument.getSongs() || []
      : [];
    var lessons = adapter && typeof adapter.getLessons === "function" ? (adapter.getLessons() || []) : [];
    curriculumMap = adapter && typeof adapter.getCurriculumMap === "function" ? (adapter.getCurriculumMap() || []) : [];
    if (!sessions.length && looksLikeCurriculumV2Sessions(curriculumMap)) sessions = curriculumMap.slice();
    if (!sessions.length && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getCurriculum === "function") {
      sessions = (SparkInstrumentAdapter.getCurriculum() || {}).SESSIONS || [];
    }
    if (!songs.length && adapter && typeof adapter.getSongs === "function") songs = adapter.getSongs() || [];
    if (!songs.length && typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function") songs = SparkInstrumentAdapter.getSongs() || [];
    return {
      appId: appId,
      instrumentType: type,
      adapter: adapter,
      rhythmAdapter: adapter && typeof adapter.getRhythmAdapter === "function" ? adapter.getRhythmAdapter() : null,
      curriculumMap: curriculumMap,
      lessons: lessons,
      sessions: sessions,
      songs: songs
    };
  };

  window.SparkInstrumentManager = InstrumentManager;
})();
