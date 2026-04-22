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
    available: false,
    getData: function() { return {}; },
    pages: {},
    tabs: [],
    stemMutePreset: {},
    init: function() {}
  });
})();
