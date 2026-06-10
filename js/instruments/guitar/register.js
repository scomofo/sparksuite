// js/instruments/guitar/register.js
(function() {
  SparkInstruments.register({
    id: "chordspark",
    instrument: "guitar",
    name: "Guitar",
    icon: "\uD83C\uDFB8",
    // Showroom asset slots — see resources/instruments/README.md for the schema.
    // When the file doesn't exist, the launcher's <img onerror> falls through to
    // the inline SVG silhouette so the reference never renders as a broken icon.
    iconImage: "resources/instruments/guitar/card.png",
    heroImage: "resources/instruments/guitar/hero.jpg",
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

    getScaleRenderer: function() {
      return typeof stringedScaleSVG === "function"
        ? stringedScaleSVG
        : (typeof scaleSVG === "function" ? scaleSVG : null);
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
      strum: function(pattern) {
        return typeof strumHTML === "function" ? strumHTML(pattern) : "";
      },
      scale: function(scale, opts) {
        return typeof scaleSVG === "function" ? scaleSVG(scale, opts) : "";
      },
      watchAnimation: function(container, chordObj, options) {
        if (typeof WatchCommon === "undefined" || !chordObj) return null;
        var chart = {
          name: chordObj.name || "chord", instrument: "guitar",
          stringCount: 6,
          stringLabels: typeof STRING_NAMES !== "undefined" ? STRING_NAMES : ["E","A","D","G","B","e"],
          fretCountVisible: 4, startFret: 0,
          open: chordObj.open || [], muted: chordObj.muted || [],
          fingers: chordObj.fingers || [],
          barre: chordObj.barFret ? { fret: chordObj.barFret, fromString: Math.min.apply(null, chordObj.barStrings || [0]), toString: Math.max.apply(null, chordObj.barStrings || [5]) } : null
        };
        var minF = 99, maxF = 0;
        for (var i = 0; i < chart.fingers.length; i++) {
          if (chart.fingers[i][1] > 0) { if (chart.fingers[i][1] < minF) minF = chart.fingers[i][1]; if (chart.fingers[i][1] > maxF) maxF = chart.fingers[i][1]; }
        }
        if (chart.barre) { if (chart.barre.fret < minF) minF = chart.barre.fret; if (chart.barre.fret > maxF) maxF = chart.barre.fret; }
        if (maxF > 4) chart.startFret = minF - 1;
        options = options || {};
        options.strumFn = options.strumFn || function() { if (typeof strumChord === "function") strumChord(chordObj.name || ""); };
        return WatchCommon.stringedWatch(container, chart, options);
      },
      shadowQuiz: function(container, chordObj, options) {
        if (typeof WatchCommon === "undefined" || !chordObj) return null;
        var chart = {
          name: chordObj.name || "chord", instrument: "guitar",
          stringCount: 6,
          stringLabels: typeof STRING_NAMES !== "undefined" ? STRING_NAMES : ["E","A","D","G","B","e"],
          fretCountVisible: 4, startFret: 0,
          open: chordObj.open || [], muted: chordObj.muted || [],
          fingers: chordObj.fingers || [],
          barre: chordObj.barFret ? { fret: chordObj.barFret, fromString: Math.min.apply(null, chordObj.barStrings || [0]), toString: Math.max.apply(null, chordObj.barStrings || [5]) } : null
        };
        var minF = 99, maxF = 0;
        for (var i = 0; i < chart.fingers.length; i++) {
          if (chart.fingers[i][1] > 0) { if (chart.fingers[i][1] < minF) minF = chart.fingers[i][1]; if (chart.fingers[i][1] > maxF) maxF = chart.fingers[i][1]; }
        }
        if (chart.barre) { if (chart.barre.fret < minF) minF = chart.barre.fret; if (chart.barre.fret > maxF) maxF = chart.barre.fret; }
        if (maxF > 4) chart.startFret = minF - 1;
        options = options || {};
        options.strumFn = options.strumFn || function() { if (typeof strumChord === "function") strumChord(chordObj.name || ""); };
        return WatchCommon.stringedShadow(container, chart, options);
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
      if (typeof S !== "undefined") {
        if (S.completedGuidedSessions === undefined) S.completedGuidedSessions = [];
        if (typeof SparkChordProgress !== "undefined") SparkChordProgress.ensureShape();
        else if (S.chordProgress === undefined) S.chordProgress = {};
        if (S.customSets === undefined) S.customSets = [];
        if (typeof SparkTransitionStats !== "undefined") SparkTransitionStats.ensureShape();
        else if (S.transitionStats === undefined) S.transitionStats = {};
        if (typeof SparkFingerStats !== "undefined") SparkFingerStats.ensureShape();
        else if (S.fingerStats === undefined) S.fingerStats = {};
        if (S.drillAdaptiveBpm === undefined) S.drillAdaptiveBpm = 60;
        if (S.drillConsecutiveFast === undefined) S.drillConsecutiveFast = 0;
        if (S.drillConsecutiveSlow === undefined) S.drillConsecutiveSlow = 0;
        if (S.drillLastSwitchTime === undefined) S.drillLastSwitchTime = 0;
        if (S.guidedSession === undefined) S.guidedSession = 1;
        if (S.guidedPlan === undefined) S.guidedPlan = null;
        if (S.guidedStep === undefined) S.guidedStep = null;
        if (S.newMovePhase === undefined) S.newMovePhase = null;
        if (S.guidedPaused === undefined) S.guidedPaused = false;
      }
    },

    // ── InstrumentModule interface ──

    getSkillTree: function() {
      var tree = typeof buildSkillTree === "function" ? buildSkillTree() : { branches: [] };
      if (typeof CapoHelpers !== "undefined") {
        var capoNodes = [];
        var skills = CapoHelpers.CAPO_SKILLS;
        for (var i = 0; i < skills.length; i++) {
          var sk = skills[i];
          var mastery = typeof SparkMastery !== "undefined"
            ? (SparkMastery.get("capo", sk.id) || 0)
            : (S.mastery && S.mastery.capo ? (S.mastery.capo[sk.id] || 0) : 0);
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

    getCurriculumMapV2: function() {
      return typeof SparkCurriculumV2LegacyAdapter !== "undefined"
        ? SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar")
        : [];
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
