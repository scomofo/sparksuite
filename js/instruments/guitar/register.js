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
        chords: typeof GUITAR_CHORDS !== "undefined" ? GUITAR_CHORDS : {},
        sessions: typeof GUITAR_SESSIONS !== "undefined" ? GUITAR_SESSIONS : [],
        songs: typeof SONGS !== "undefined" ? SONGS : []
      };
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
    }
  });
})();
