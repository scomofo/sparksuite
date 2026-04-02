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
      return {
        songs: typeof PIANO_SONGS !== "undefined" ? PIANO_SONGS : [],
        voicings: typeof PIANO_VOICINGS !== "undefined" ? PIANO_VOICINGS : {},
        chords: typeof PIANO_CHORDS_FULL !== "undefined" ? PIANO_CHORDS_FULL : {},
        sessions: typeof PIANO_SESSIONS !== "undefined" ? PIANO_SESSIONS : [],
        curriculum: typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : [],
        lhPatterns: typeof PIANO_LH_PATTERNS !== "undefined" ? PIANO_LH_PATTERNS : [],
        data: typeof PIANO_DATA !== "undefined" ? PIANO_DATA : null
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
      }
    }
  });
})();
