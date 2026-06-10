(function() {
  function GuitarAdapter() {}

  function getGuitarModule() {
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
    if (active && active.instrument === "guitar" && typeof active.getCurriculumMap === "function") {
      return active;
    }
    if (typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.instrument !== "guitar") continue;
      if (candidate && (entry.id === candidate || entry.appId === candidate)) return entry;
      if (!candidate && (entry.id === "chordspark" || entry.appId === "chordspark")) return entry;
    }
    return active && active.instrument === "guitar" ? active : null;
  }

  GuitarAdapter.prototype.getId = function() {
    return "chordspark";
  };

  GuitarAdapter.prototype.getType = function() {
    return "guitar";
  };

  GuitarAdapter.prototype.getModule = function() {
    return window.SparkGuitarModule || null;
  };

  GuitarAdapter.prototype.getCurriculumMap = function() {
    if (window.SparkGuitarModule && typeof window.SparkGuitarModule.getLessons === "function") {
      return window.SparkGuitarModule.getLessons();
    }
    var module = getGuitarModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    if (typeof CURRICULUM !== "undefined" && Array.isArray(CURRICULUM)) {
      return CURRICULUM;
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  GuitarAdapter.prototype.getSkillTree = function() {
    var module = getGuitarModule();
    if (module && typeof module.getSkillTree === "function") {
      return module.getSkillTree();
    }
    if (typeof buildSkillTree === "function") {
      return buildSkillTree();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSkillTree === "function"
      ? SparkInstrumentAdapter.getSkillTree()
      : [];
  };

  GuitarAdapter.prototype.getLessons = function() {
    var module = getGuitarModule();
    var curriculumMap;
    if (module && typeof module.getLessons === "function") {
      return module.getLessons();
    }
    curriculumMap = this.getCurriculumMap();
    return Array.isArray(curriculumMap) ? curriculumMap.map(function(entry) {
      var lessonNum = entry && entry.num != null ? String(entry.num) : null;
      var fallbackSkill = entry && entry.skill
        ? entry.skill
        : (lessonNum ? "chord_level_" + lessonNum : (Array.isArray(entry.skills) && entry.skills.length ? entry.skills[0] : null));
      return {
        id: entry.id || (lessonNum ? "session_" + lessonNum : String(entry.title || "guitar_lesson")),
        title: entry.title || "Guitar Lesson",
        skill: fallbackSkill,
        skills: Array.isArray(entry.skills) && entry.skills.length ? entry.skills.slice() : (fallbackSkill ? [fallbackSkill] : []),
        prerequisites: Array.isArray(entry.prerequisites) ? entry.prerequisites.slice() : [],
        masteryRequired: entry.masteryRequired != null ? entry.masteryRequired : 0.7
      };
    }) : [];
  };

  GuitarAdapter.prototype.getExercises = function(skill) {
    var module = getGuitarModule();
    if (module && typeof module.getExercises === "function") {
      return module.getExercises(skill);
    }
    if (typeof FINGER_EXERCISES !== "undefined" && Array.isArray(FINGER_EXERCISES)) {
      return FINGER_EXERCISES;
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getExercises === "function"
      ? (SparkInstrumentAdapter.getExercises(skill) || [])
      : [];
  };

  GuitarAdapter.prototype.getTuning = function() {
    var module = getGuitarModule();
    if (module && typeof module.getTuning === "function") {
      return module.getTuning();
    }
    return ["E2", "A2", "D3", "G3", "B3", "E4"];
  };

  GuitarAdapter.prototype.getCapabilities = function() {
    return {
      stringCount: 6,
      keyCount: null,
      supportsChords: true,
      supportsScales: true,
      supportsStrumming: true,
      supportsFingerpicking: true,
      supportsMelody: true,
      preferredRenderer: "string-lane-highway",
      inputModes: ["keyboard", "midi", "mouse"]
    };
  };

  GuitarAdapter.prototype.getRhythmAdapter = function() {
    var module = getGuitarModule();
    if (module && typeof module.getRhythmAdapter === "function") {
      return module.getRhythmAdapter();
    }
    return new SparkGuitarRhythmAdapter();
  };

  window.SparkGuitarAdapter = GuitarAdapter;
})();
