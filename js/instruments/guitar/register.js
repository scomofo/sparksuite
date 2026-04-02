// js/instruments/guitar/register.js
(function() {
  SparkInstruments.register({
    id: "chordspark",
    instrument: "guitar",
    name: "Guitar",
    icon: "\uD83C\uDFB8",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null,
    available: true,

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
        FINGER_EXERCISES: typeof FINGER_EXERCISES !== "undefined" ? FINGER_EXERCISES : []
      };
    },

    act: function(a, v) {
      return guitarAct(a, v);
    },

    ui: {
      chord: function(chordObj, size, label, animate) {
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

    tabs: ["practice", "drill", "songs", "guide"],

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
    },

    // ── InstrumentModule interface ──

    getSkillTree: function() {
      if (typeof buildSkillTree === "function") return buildSkillTree();
      return { branches: [] };
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
    }
  });
})();
