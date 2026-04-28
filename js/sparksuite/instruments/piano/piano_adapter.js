(function() {
  function PianoAdapter() {}

  function getPianoModule() {
    var active;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    active = SparkInstruments.getActive();
    candidate = active ? (active.id || active.appId || active.instrumentId || null) : null;
    if (active && active.instrument === "piano" && typeof active.getCurriculumMap === "function") {
      return active;
    }
    if (typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.instrument !== "piano") continue;
      if (candidate && (entry.id === candidate || entry.appId === candidate)) return entry;
      if (!candidate && (entry.id === "pianospark" || entry.appId === "pianospark")) return entry;
    }
    return active && active.instrument === "piano" ? active : null;
  }

  PianoAdapter.prototype.getId = function() {
    return "pianospark";
  };

  PianoAdapter.prototype.getType = function() {
    return "piano";
  };

  PianoAdapter.prototype.getCurriculumMap = function() {
    var module = getPianoModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    if (typeof PIANO_DATA !== "undefined" && PIANO_DATA && Array.isArray(PIANO_DATA.CURRICULUM)) {
      return PIANO_DATA.CURRICULUM;
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  PianoAdapter.prototype.getSkillTree = function() {
    var module = getPianoModule();
    if (module && typeof module.getSkillTree === "function") {
      return module.getSkillTree();
    }
    if (typeof PIANO_DATA !== "undefined" && PIANO_DATA && Array.isArray(PIANO_DATA.CURRICULUM)) {
      return {
        branches: PIANO_DATA.CURRICULUM.map(function(level) {
          return {
            id: "level_" + String(level.num),
            label: level.title || ("Level " + String(level.num))
          };
        })
      };
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSkillTree === "function"
      ? SparkInstrumentAdapter.getSkillTree()
      : [];
  };

  PianoAdapter.prototype.getLessons = function() {
    var module = getPianoModule();
    var curriculumMap;
    if (module && typeof module.getLessons === "function") {
      return module.getLessons();
    }
    curriculumMap = this.getCurriculumMap();
    return Array.isArray(curriculumMap) ? curriculumMap.map(function(level) {
      var levelNum = String(level.num != null ? level.num : 0);
      var lessonId = "piano_level_" + levelNum;
      var skillId = "level_" + levelNum;
      return {
        id: lessonId,
        title: level.title || lessonId,
        skill: skillId,
        skills: [skillId],
        prerequisites: [],
        masteryRequired: 0.7
      };
    }) : [];
  };

  PianoAdapter.prototype.getExercises = function(skill) {
    var module = getPianoModule();
    if (module && typeof module.getExercises === "function") {
      return module.getExercises(skill);
    }
    if (typeof PIANO_DATA !== "undefined" && PIANO_DATA && Array.isArray(PIANO_DATA.FINGER_EXERCISES)) {
      return PIANO_DATA.FINGER_EXERCISES;
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getExercises === "function"
      ? (SparkInstrumentAdapter.getExercises(skill) || [])
      : [];
  };

  PianoAdapter.prototype.getTuning = function() {
    var module = getPianoModule();
    if (module && typeof module.getTuning === "function") {
      return module.getTuning();
    }
    return ["A0", "C8"];
  };

  PianoAdapter.prototype.getSongs = function() {
    var module = getPianoModule();
    if (module && typeof module.getSongs === "function") {
      return module.getSongs();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  PianoAdapter.prototype.getCapabilities = function() {
    return {
      stringCount: null,
      keyCount: 88,
      supportsChords: true,
      supportsScales: true,
      supportsStrumming: false,
      supportsFingerpicking: false,
      supportsMelody: true,
      preferredRenderer: "keyboard-lane-highway",
      inputModes: ["keyboard", "midi", "mouse"]
    };
  };

  window.SparkPianoAdapter = PianoAdapter;
})();
