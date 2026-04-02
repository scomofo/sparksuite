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
    }
  });
})();
