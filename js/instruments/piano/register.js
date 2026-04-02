// js/instruments/piano/register.js
(function() {
  SparkInstruments.register({
    id: "pianospark",
    instrument: "piano",
    name: "Piano",
    icon: "\uD83C\uDFB9",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.PIANO_SKIN : null,
    available: true,

    getData: function() {
      var d = typeof PIANO_DATA !== "undefined" ? PIANO_DATA : {};
      return {
        CHORDS: d.CHORDS || {},
        ALL_CHORDS: d.ALL_CHORDS || [],
        SESSIONS: typeof PIANO_SESSIONS !== "undefined" ? PIANO_SESSIONS : (d.SESSION_PLANS || []),
        SONGS: d.SONGS || (typeof PIANO_SONGS !== "undefined" ? PIANO_SONGS : []),
        LC: d.LC || {},
        LN: d.LN || {},
        CHORD_NOTES: d.CHORD_NOTES || {},
        CHORD_COLORS: d.CHORD_COLORS || {},
        STRINGS: [],
        STRUM_PATTERNS: [],
        FINGER_EXERCISES: d.FINGER_EXERCISES || [],
        // Piano extras
        CURRICULUM: d.CURRICULUM || (typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : []),
        LH_PATTERNS: d.LH_PATTERNS || [],
        BADGES: d.BADGES || [],
        SCALES: d.SCALES || [],
        FINGER_BADGES: d.FINGER_BADGES || [],
        DAILY_TYPES: d.DAILY_TYPES || [],
        PLAY_STYLES: d.PLAY_STYLES || [],
        TRANSITION_TIPS: d.TRANSITION_TIPS || [],
        REWARD_PHASES: d.REWARD_PHASES || [],
        VOICINGS: typeof PIANO_VOICINGS !== "undefined" ? PIANO_VOICINGS : {},
        CHORDS_FULL: typeof PIANO_CHORDS_FULL !== "undefined" ? PIANO_CHORDS_FULL : {},
        data: d
      };
    },

    ui: {
      chord: function(chordObj, size, label, animate) {
        return typeof pianoSVG === "function" ? pianoSVG(chordObj, { width: size, animate: animate }) : "";
      },
      header: function() {
        return typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : (typeof headerHTML === "function" ? headerHTML() : "");
      },
      tabNav: function() {
        return typeof pianoTabNavHTML === "function" ? pianoTabNavHTML() : (typeof tabNavHTML === "function" ? tabNavHTML() : "");
      },
      ring: function(pct, size, color) {
        return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
      }
    },

    act: function(a, v) {
      return typeof pianoAct === "function" ? pianoAct(a, v) : false;
    },

    pages: {},

    tabs: ["practice", "songs", "games", "tools"],

    stemMutePreset: {
      piano: false, vocals: true, drums: true,
      bass: true, guitar: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "pianospark", "piano");
        SparkStorage.save(profile);
      }
      // Ensure piano-specific state fields exist on shared S
      if (typeof S !== "undefined") {
        if (S.currentSession === undefined) S.currentSession = 1;
        if (S.onboardingComplete === undefined) S.onboardingComplete = false;
        if (S.practiceLen === undefined) S.practiceLen = 60;
        if (S.sessionPlan === undefined) S.sessionPlan = null;
        if (S.lhLevel === undefined) S.lhLevel = 1;
        if (S.keyboardSize === undefined) S.keyboardSize = 61;
        if (S.stylePrefs === undefined) S.stylePrefs = [];
        if (S.focusMode === undefined) S.focusMode = false;
        if (S.dailyGoal === undefined) S.dailyGoal = 15;
        if (S.dailyPracticed === undefined) S.dailyPracticed = 0;
        if (S.a4Tuning === undefined) S.a4Tuning = 440;
        if (S.chord === undefined) S.chord = null;
        if (S.active === undefined) S.active = false;
        if (S.paused === undefined) S.paused = false;
        if (S.lastPractice === undefined) S.lastPractice = null;
        if (S.personalBests === undefined) S.personalBests = { streak: 0 };
        if (S.earned === undefined) S.earned = [];
        if (S.transitionStats === undefined) S.transitionStats = {};
        if (S.drillChord === undefined) S.drillChord = null;
        if (S.drillTimer === undefined) S.drillTimer = 0;
        if (S.drillCount === undefined) S.drillCount = 0;
        if (S._inPlacement === undefined) S._inPlacement = false;
        if (S.onboardingStep === undefined) S.onboardingStep = 0;
        if (S.chordProg === undefined) S.chordProg = {};
        if (S.fingerBadges === undefined) S.fingerBadges = [];
        if (S.fingerStats === undefined) S.fingerStats = {};
        if (S.songIdx === undefined) S.songIdx = null;
        if (S.styleIdx === undefined) S.styleIdx = 0;
        if (S.bpm === undefined) S.bpm = 72;
        if (S.volume === undefined) S.volume = 80;
        if (S.reverbAmount === undefined) S.reverbAmount = 0.3;
        if (S.tone === undefined) S.tone = "grand";
        if (S.metronomeSound === undefined) S.metronomeSound = "click";
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
      var D = this.getData();
      return D.CURRICULUM || [];
    },

    getExercises: function() {
      var D = this.getData();
      return D.FINGER_EXERCISES || [];
    },

    getSongs: function() {
      var D = this.getData();
      return D.SONGS || [];
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
      if (typeof chordsForLevel === "function") {
        var chords = chordsForLevel(level);
        if (chords.length > 0) return chords.slice(0, 2);
      }
      return [];
    }
  });
})();
