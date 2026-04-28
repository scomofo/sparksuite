// js/instruments/drums/register.js
(function() {
  SparkInstruments.register({
    id: "drumspark",
    instrument: "drums",
    name: "Drums",
    icon: "\uD83E\uDD41",
    // Showroom asset slots — see resources/instruments/README.md for the schema.
    // When the file doesn't exist, the launcher's <img onerror> falls through to
    // the inline SVG silhouette so the reference never renders as a broken icon.
    iconImage: "resources/instruments/drums/card.png",
    heroImage: "resources/instruments/drums/hero.jpg",
    skin: null,
    available: true,
    getData: function() { return {}; },
    getLessons: function() {
      return window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function"
        ? SparkDrumsModule.getLessons()
        : [];
    },
    getSkillTree: function() {
      return window.SparkDrumsModule && typeof SparkDrumsModule.getSkillTree === "function"
        ? SparkDrumsModule.getSkillTree()
        : [];
    },
    getRhythmAdapter: function() {
      return window.SparkDrumsModule && typeof SparkDrumsModule.getRhythmAdapter === "function"
        ? SparkDrumsModule.getRhythmAdapter()
        : null;
    },
    pages: {},
    tabs: [],
    stemMutePreset: {},
    init: function() {}
  });
})();
