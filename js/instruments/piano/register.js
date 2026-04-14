// js/instruments/piano/register.js
(function() {
  function pianoRegisterRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function pianoRegisterRead(path, fallback) {
    var root = pianoRegisterRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function pianoRegisterWrite(path, value) {
    var root = pianoRegisterRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    if (!cursor || !parts.length) return value;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function ensurePianoStateDefaults(defaults) {
    for (var key in defaults) {
      if (pianoRegisterRead(key, undefined) === undefined) pianoRegisterWrite(key, defaults[key]);
    }
  }

  SparkInstruments.register({
    id: "pianospark",
    instrument: "piano",
    name: "Piano",
    icon: "\uD83C\uDFB9",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.PIANO_SKIN : null,
    available: true,
    capabilities: {
      stringCount: null,
      noteLaneType: "key",
      chordShapeSupport: true,
      midiInput: true,
      capoSupport: false,
      performanceModes: ["rhythm", "freestyle", "song"]
    },

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

    tabs: [
      { id: "practice", label: "Practice", icon: "\uD83C\uDFB9" },
      { id: "games",    label: "Games",    icon: "\u26A1" },
      { id: "songs",    label: "Songs",    icon: "\uD83C\uDFB6" },
      { id: "tools",    label: "Tools",    icon: "\uD83D\uDD27" }
    ],

    tabRenderers: {
      practice: function() { return typeof pianoPracticeTab === "function" ? pianoPracticeTab() : ""; },
      games:    function() { return typeof pianoGamesTab === "function" ? pianoGamesTab() : ""; },
      songs:    function() { return typeof pianoSongsTab === "function" ? pianoSongsTab() : ""; },
      tools:    function() { return typeof pianoToolsTab === "function" ? pianoToolsTab() : ""; }
    },

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
      ensurePianoStateDefaults({
        currentSession: 1,
        onboardingComplete: false,
        practiceLen: 60,
        sessionPlan: null,
        lhLevel: 1,
        keyboardSize: 61,
        stylePrefs: [],
        focusMode: false,
        dailyGoal: 15,
        dailyPracticed: 0,
        a4Tuning: 440,
        chord: null,
        active: false,
        paused: false,
        lastPractice: null,
        personalBests: { streak: 0 },
        earned: [],
        transitionStats: {},
        drillChord: null,
        drillTimer: 0,
        drillCount: 0,
        _inPlacement: false,
        onboardingStep: 0,
        chordProg: {},
        fingerBadges: [],
        fingerStats: {},
        songIdx: null,
        styleIdx: 0,
        bpm: 72,
        volume: 80,
        reverbAmount: 0.3,
        tone: "grand",
        metronomeSound: "click",
        completedSessions: [],
        lastReviewChords: [],
        sessions: 0,
        adaptiveBpm: 72,
        songsDone: [],
        totalActions: 0,
        actionsSinceReward: 0,
        nextRewardAt: 2,
        jackpotsHit: 0,
        drillsDone: 0,
        dailiesDone: 0,
        fingerExercisesDone: 0,
        fingerDaysLogged: 0,
        buildChords: [],
        buildPlaying: false
      });
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
          status: (pianoRegisterRead("level", 1) || 1) >= lvl.num ? "available" : "locked",
          progress: (pianoRegisterRead("level", 1) || 1) > lvl.num ? 100 : (((pianoRegisterRead("level", 1) || 1) === lvl.num) ? 50 : 0)
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
    },

    getExercisesForLesson: function(lessonId) {
      var D = this.getData();
      return D.FINGER_EXERCISES || [];
    },

    getPerformanceConfig: function() {
      return {
        laneCount: 88,
        laneLabels: null,
        defaultBpm: 80,
        supportedModes: ["rhythm", "freestyle", "song"],
        inputType: "key"
      };
    }
  });
})();
