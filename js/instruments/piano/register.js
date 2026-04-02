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

    pages: typeof PIANO_PAGES !== "undefined" ? PIANO_PAGES : {},

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
      }
    }
  });
})();
