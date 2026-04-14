// js/instruments/guitar/register.js
(function() {
  function guitarRegisterRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function guitarRegisterRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = guitarRegisterRoot();
    if (!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function guitarRegisterWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = guitarRegisterRoot();
    if (root) root[path] = value;
    return value;
  }

  function guitarRegisterEnsureArray(path) {
    var current = guitarRegisterRead(path, null);
    if (Array.isArray(current)) return current;
    current = [];
    guitarRegisterWrite(path, current);
    return current;
  }

  function guitarRegisterEnsureObject(path) {
    var current = guitarRegisterRead(path, null);
    if (current && typeof current === "object" && !Array.isArray(current)) return current;
    current = {};
    guitarRegisterWrite(path, current);
    return current;
  }

  SparkInstruments.register({
    id: "chordspark",
    instrument: "guitar",
    name: "Guitar",
    icon: "\uD83C\uDFB8",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null,
    available: true,
    capabilities: {
      stringCount: 6,
      noteLaneType: "string",
      chordShapeSupport: true,
      midiInput: false,
      capoSupport: true,
      performanceModes: ["rhythm", "freestyle", "song"]
    },

    getData: function() {
      return {
        CHORDS: typeof CHORDS !== "undefined" ? CHORDS : {},
        ALL_CHORDS: typeof ALL_CHORDS !== "undefined" ? ALL_CHORDS : [],
        SESSIONS: typeof GUITAR_SESSIONS !== "undefined" ? GUITAR_SESSIONS : [],
        SONGS: typeof SONGS !== "undefined" ? SONGS : [],
        LC: typeof LC !== "undefined" ? LC : {},
        LN: typeof LN !== "undefined" ? LN : {},
        CHORD_NOTES: typeof CHORD_NOTES !== "undefined" ? CHORD_NOTES : {},
        STRINGS: typeof GUITAR_STRINGS !== "undefined" ? GUITAR_STRINGS : [],
        STRUM_PATTERNS: typeof STRUM_PATTERNS !== "undefined" ? STRUM_PATTERNS : [],
        FINGER_EXERCISES: typeof FINGER_EXERCISES !== "undefined" ? FINGER_EXERCISES : [],
        CURRICULUM: typeof CURRICULUM !== "undefined" ? CURRICULUM : [],
        CAPO_CHART: typeof CapoHelpers !== "undefined" ? CapoHelpers.CAPO_CHART : {},
        CAPO_SKILLS: typeof CapoHelpers !== "undefined" ? CapoHelpers.CAPO_SKILLS : [],
        CAPO_LESSONS: typeof CapoHelpers !== "undefined" ? CapoHelpers.CAPO_LESSONS : []
      };
    },

    act: function(a, v) {
      return guitarAct(a, v);
    },

    ui: {
      chord: function(chordObj, size, label, animate) {
        if (typeof stringedChordSVG === "function" && chordObj) {
          var chart = {
            name: chordObj.name || label || "chord",
            instrument: "guitar",
            stringCount: 6,
            stringLabels: typeof STRING_NAMES !== "undefined" ? STRING_NAMES : ["E","A","D","G","B","e"],
            fretCountVisible: 4,
            startFret: 0,
            open: chordObj.open || [],
            muted: chordObj.muted || [],
            fingers: chordObj.fingers || [],
            barre: chordObj.barFret ? { fret: chordObj.barFret, fromString: Math.min.apply(null, chordObj.barStrings || [0]), toString: Math.max.apply(null, chordObj.barStrings || [5]) } : null
          };
          return stringedChordSVG(chart, { width: size, label: label, animate: animate });
        }
        return typeof chordSVG === "function" ? chordSVG(chordObj, size, label, animate) : "";
      },
      header: function() {
        return typeof headerHTML === "function" ? headerHTML() : "";
      },
      tabNav: function() {
        return typeof tabNavHTML === "function" ? tabNavHTML() : "";
      },
      ring: function(pct, size, color) {
        return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
      },
      strum: function(pattern) {
        return typeof strumHTML === "function" ? strumHTML(pattern) : "";
      },
      scale: function(scale, opts) {
        return typeof scaleSVG === "function" ? scaleSVG(scale, opts) : "";
      }
    },

    pages: typeof GUITAR_PAGES !== "undefined" ? GUITAR_PAGES : {},

    tabs: [
      { id: "practice", label: "Practice", icon: "\uD83C\uDFB6" },
      { id: "drill",    label: "Drill",    icon: "\u26A1" },
      { id: "daily",    label: "Daily",    icon: "\uD83C\uDFC5" },
      { id: "quiz",     label: "Quiz",     icon: "\uD83E\uDDE0" },
      { id: "ear",      label: "Ear",      icon: "\uD83D\uDC42" },
      { id: "strum",    label: "Strum",    icon: "\uD83C\uDFBC" },
      { id: "songs",    label: "Songs",    icon: "\uD83C\uDFB5" },
      { id: "rhythm",   label: "Rhythm",   icon: "\uD83E\uDD41" },
      { id: "runner",   label: "Runner",   icon: "\uD83C\uDFAE" },
      { id: "build",    label: "Build",    icon: "\uD83D\uDD27" },
      { id: "tuner",    label: "Tuner",    icon: "\uD83C\uDFA4" },
      { id: "dual",     label: "Dual",     icon: "\uD83C\uDFB9" },
      { id: "stats",    label: "Stats",    icon: "\uD83D\uDCCA" },
      { id: "guide",    label: "Guide",    icon: "\uD83D\uDCD6" }
    ],

    stemMutePreset: {
      guitar: false, vocals: true, drums: true,
      bass: true, piano: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "chordspark", "guitar");
        SparkStorage.save(profile);
      }
      guitarRegisterEnsureArray("completedGuidedSessions");
      guitarRegisterEnsureObject("chordProgress");
      guitarRegisterEnsureArray("customSets");
      guitarRegisterEnsureObject("transitionStats");
      guitarRegisterEnsureObject("fingerStats");
      if (guitarRegisterRead("drillAdaptiveBpm", null) === null) guitarRegisterWrite("drillAdaptiveBpm", 60);
      if (guitarRegisterRead("drillConsecutiveFast", null) === null) guitarRegisterWrite("drillConsecutiveFast", 0);
      if (guitarRegisterRead("drillConsecutiveSlow", null) === null) guitarRegisterWrite("drillConsecutiveSlow", 0);
      if (guitarRegisterRead("drillLastSwitchTime", null) === null) guitarRegisterWrite("drillLastSwitchTime", 0);
      if (guitarRegisterRead("guidedSession", null) === null) guitarRegisterWrite("guidedSession", 1);
      if (guitarRegisterRead("guidedPlan", undefined) === undefined) guitarRegisterWrite("guidedPlan", null);
      if (guitarRegisterRead("guidedStep", undefined) === undefined) guitarRegisterWrite("guidedStep", null);
      if (guitarRegisterRead("newMovePhase", undefined) === undefined) guitarRegisterWrite("newMovePhase", null);
      if (guitarRegisterRead("guidedPaused", undefined) === undefined) guitarRegisterWrite("guidedPaused", false);
    },

    // ── InstrumentModule interface ──

    getSkillTree: function() {
      var tree = typeof buildSkillTree === "function" ? buildSkillTree() : { branches: [] };
      if (typeof CapoHelpers !== "undefined") {
        var capoNodes = [];
        var skills = CapoHelpers.CAPO_SKILLS;
        for (var i = 0; i < skills.length; i++) {
          var sk = skills[i];
          var masteryState = guitarRegisterRead("mastery", {}) || {};
          var mastery = masteryState.capo ? (masteryState.capo[sk.id] || 0) : 0;
          capoNodes.push({
            id: sk.id, branch: "capo", label: sk.name,
            status: mastery > 0 ? (mastery >= 90 ? "mastered" : "developing") : "available",
            progress: mastery,
            meta: { category: "capo", desc: sk.desc }
          });
        }
        tree.branches.push({ id: "capo", label: "Capo & Transposition", nodes: capoNodes });
      }
      return tree;
    },

    getCurriculumMap: function() {
      return typeof CURRICULUM !== "undefined" ? CURRICULUM : [];
    },

    getExercises: function() {
      return typeof FINGER_EXERCISES !== "undefined" ? FINGER_EXERCISES : [];
    },

    getSongs: function() {
      return typeof SONGS !== "undefined" ? SONGS : [];
    },

    getDifficultyRules: function(context) {
      if (typeof buildAdaptiveDecision === "function") return buildAdaptiveDecision(context);
      return { targetType: "generic", difficultyAction: "keep", currentValue: 0, nextValue: 0, reason: "No adaptive engine" };
    },

    analyzePerformance: function(sessionData) {
      if (typeof finalizePerformanceResults === "function" && sessionData.chart && sessionData.phraseStats) {
        return finalizePerformanceResults(sessionData.chart, sessionData.phraseStats);
      }
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill, level) {
      var D = this.getData();
      var chords = D.CHORDS[level] || D.CHORDS[1] || [];
      if (skill === "chord" && chords.length > 0) {
        return [chords[Math.floor(Math.random() * chords.length)]];
      }
      if (skill === "transition" && chords.length >= 2) {
        var c1 = chords[Math.floor(Math.random() * chords.length)];
        var c2 = chords[Math.floor(Math.random() * chords.length)];
        return [c1, c2];
      }
      return chords.slice(0, 2);
    },

    getExercisesForLesson: function(lessonId) {
      var D = this.getData();
      if (lessonId && D.CURRICULUM) {
        for (var i = 0; i < D.CURRICULUM.length; i++) {
          if (D.CURRICULUM[i].id === lessonId && D.CURRICULUM[i].exercises) {
            return D.CURRICULUM[i].exercises;
          }
        }
      }
      return D.FINGER_EXERCISES || [];
    },

    getPerformanceConfig: function() {
      return {
        laneCount: 6,
        laneLabels: typeof STRING_NAMES !== "undefined" ? STRING_NAMES : ["E","A","D","G","B","e"],
        defaultBpm: 80,
        supportedModes: ["rhythm", "freestyle", "song"],
        inputType: "strum"
      };
    }
  });
})();
