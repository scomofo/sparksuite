// js/instruments/bass/register.js
(function() {
  SparkInstruments.register({
    id: "bassspark",
    instrument: "bass",
    name: "Bass",
    icon: "\uD83C\uDFB8",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null,
    available: true,

    getData: function() {
      return {
        CHORDS: typeof BASS_CHORDS !== "undefined" ? BASS_CHORDS : {},
        ALL_CHORDS: typeof BASS_ALL_CHORDS !== "undefined" ? BASS_ALL_CHORDS : [],
        SESSIONS: typeof BASS_SESSIONS !== "undefined" ? BASS_SESSIONS : [],
        SONGS: typeof BASS_SONGS !== "undefined" ? BASS_SONGS : [],
        LC: typeof BASS_LC !== "undefined" ? BASS_LC : {},
        LN: typeof BASS_LN !== "undefined" ? BASS_LN : {},
        CHORD_NOTES: {},
        STRINGS: typeof BASS_STRINGS !== "undefined" ? BASS_STRINGS : [],
        STRUM_PATTERNS: [],
        FINGER_EXERCISES: typeof BASS_EXERCISES !== "undefined" ? BASS_EXERCISES : [],
        CURRICULUM: typeof BASS_CURRICULUM !== "undefined" ? BASS_CURRICULUM : [],
        SKILL_TREE: typeof BASS_SKILL_TREE !== "undefined" ? BASS_SKILL_TREE : {}
      };
    },

    ui: {
      chord: function(chordObj, size, label, animate) {
        return typeof bassSVG === "function" ? bassSVG(chordObj, size, label, animate) : "";
      },
      header: function() {
        return typeof headerHTML === "function" ? headerHTML() : "";
      },
      tabNav: function() {
        return typeof tabNavHTML === "function" ? tabNavHTML() : "";
      },
      ring: function(pct, size, color) {
        return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
      }
    },

    act: function(a, v) {
      return bassAct(a, v);
    },

    pages: {},

    tabs: [
      { id: "practice", label: "Practice", icon: "\uD83C\uDFB5" },
      { id: "drill",    label: "Drill",    icon: "\u26A1" },
      { id: "songs",    label: "Songs",    icon: "\uD83C\uDFB6" },
      { id: "stats",    label: "Stats",    icon: "\uD83D\uDCCA" },
      { id: "guide",    label: "Guide",    icon: "\uD83D\uDCD6" }
    ],

    stemMutePreset: {
      bass: false, vocals: true, drums: true,
      guitar: true, piano: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "bassspark", "bass");
        SparkStorage.save(profile);
      }
    },

    // ── InstrumentModule interface ──

    getSkillTree: function() {
      var D = this.getData();
      var curriculum = D.CURRICULUM || [];
      var branches = [];
      for (var i = 0; i < curriculum.length; i++) {
        var lvl = curriculum[i];
        branches.push({
          id: "level_" + lvl.num,
          label: lvl.title,
          level: lvl.num,
          status: (S.level || 1) >= lvl.num ? "available" : "locked",
          progress: (S.level || 1) > lvl.num ? 100 : ((S.level || 1) === lvl.num ? 50 : 0)
        });
      }
      return { branches: branches };
    },

    getCurriculumMap: function() {
      return this.getData().CURRICULUM || [];
    },

    getExercises: function() {
      return this.getData().FINGER_EXERCISES || [];
    },

    getSongs: function() {
      return this.getData().SONGS || [];
    },

    getDifficultyRules: function(context) {
      if (typeof buildAdaptiveDecision === "function") return buildAdaptiveDecision(context);
      return { targetType: "generic", difficultyAction: "keep", currentValue: 0, nextValue: 0, reason: "No adaptive engine" };
    },

    analyzePerformance: function(sessionData) {
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill, level) {
      var D = this.getData();
      var chords = D.CHORDS[level] || D.CHORDS[1] || [];
      return chords.slice(0, 2);
    }
  });
})();
