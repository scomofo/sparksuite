(function() {
  function BassAdapter() {}

  function hasCanonicalInstrumentSurface(entry) {
    return !!(entry
      && typeof entry.getCurriculumMap === "function"
      && typeof entry.getSkillTree === "function"
      && typeof entry.getLessons === "function"
      && typeof entry.getExercises === "function"
      && typeof entry.getTuning === "function");
  }

  function getBassModule() {
    var active;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
      active = SparkInstruments.getActive();
      candidate = active ? (active.id || active.appId || active.instrumentId || null) : null;
      if (active && active.instrument === "bass" && hasCanonicalInstrumentSurface(active)) {
        return active;
      }
      if (typeof SparkInstruments.getAll === "function") {
        all = SparkInstruments.getAll() || [];
        for (i = 0; i < all.length; i++) {
          entry = all[i] || {};
          if (entry.instrument !== "bass") continue;
          if (candidate && (entry.id === candidate || entry.appId === candidate) && hasCanonicalInstrumentSurface(entry)) return entry;
          if (!candidate && (entry.id === "bassspark" || entry.appId === "bassspark") && hasCanonicalInstrumentSurface(entry)) return entry;
        }
      }
      if (active && active.instrument === "bass" && hasCanonicalInstrumentSurface(active)) return active;
    }
    return typeof SparkBassModule !== "undefined" ? SparkBassModule : null;
  }

  BassAdapter.prototype.getId = function() {
    return "bassspark";
  };

  BassAdapter.prototype.getType = function() {
    return "bass";
  };

  BassAdapter.prototype.getCurriculumMap = function() {
    var module = getBassModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  BassAdapter.prototype.getSkillTree = function() {
    var module = getBassModule();
    if (module && typeof module.getSkillTree === "function") {
      return module.getSkillTree();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSkillTree === "function"
      ? SparkInstrumentAdapter.getSkillTree()
      : [];
  };

  BassAdapter.prototype.getLessons = function() {
    var module = getBassModule();
    if (module && typeof module.getLessons === "function") {
      return module.getLessons();
    }
    var curriculumMap = this.getCurriculumMap();
    return Array.isArray(curriculumMap) ? curriculumMap.slice() : [];
  };

  BassAdapter.prototype.getExercises = function(skill) {
    var module = getBassModule();
    if (module && typeof module.getExercises === "function") {
      return module.getExercises(skill);
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getExercises === "function"
      ? (SparkInstrumentAdapter.getExercises(skill) || [])
      : [];
  };

  BassAdapter.prototype.getTuning = function() {
    var module = getBassModule();
    if (module && typeof module.getTuning === "function") {
      return module.getTuning();
    }
    return ["E1", "A1", "D2", "G2"];
  };

  BassAdapter.prototype.getCapabilities = function() {
    return {
      stringCount: 4,
      keyCount: null,
      supportsChords: false,
      supportsScales: true,
      supportsStrumming: false,
      supportsFingerpicking: true,
      supportsMelody: true,
      preferredRenderer: "string-lane-highway",
      inputModes: ["keyboard", "midi", "mouse"]
    };
  };

  BassAdapter.prototype.getSongs = function() {
    var module = getBassModule();
    if (module && typeof module.getSongs === "function") {
      return module.getSongs();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  BassAdapter.prototype.getRhythmAdapter = function() {
    var module = getBassModule();
    return module && typeof module.getRhythmAdapter === "function" ? module.getRhythmAdapter() : null;
  };

  window.SparkBassAdapter = BassAdapter;
})();
