// js/ui/theme.js
// Instrument-aware CSS theme engine.
// Updates CSS custom properties when the active instrument changes.
(function() {
  'use strict';

  var INSTRUMENT_THEMES = {
    guitar:  { primary: "#ff2d55", glow: "rgba(255,45,85,0.3)",  tint: "#1a0015", rgb: "255,45,85",  icon: "\uD83C\uDFB8" },
    ukulele: { primary: "#ff0080", glow: "rgba(255,0,128,0.3)",  tint: "#1a0020", rgb: "255,0,128",  icon: "\uD83C\uDFB6" },
    piano:   { primary: "#0088ff", glow: "rgba(0,136,255,0.3)",  tint: "#001a30", rgb: "0,136,255",   icon: "\uD83C\uDFB9" },
    bass:    { primary: "#00ff64", glow: "rgba(0,255,100,0.3)",  tint: "#001a0a", rgb: "0,255,100",   icon: "\uD83C\uDFB8" },
    drums:   { primary: "#aa44ff", glow: "rgba(170,68,255,0.3)", tint: "#150030", rgb: "170,68,255",  icon: "\uD83E\uDD41" }
  };

  function applyInstrumentTheme(instrumentType) {
    var t = INSTRUMENT_THEMES[instrumentType] || INSTRUMENT_THEMES.guitar;
    var root = document.documentElement;
    root.style.setProperty("--inst-primary", t.primary);
    root.style.setProperty("--inst-glow", t.glow);
    root.style.setProperty("--inst-tint", t.tint);
    root.style.setProperty("--inst-primary-rgb", t.rgb);
    root.style.setProperty("--inst-gradient", "linear-gradient(135deg," + t.primary + "," + t.primary + "88)");

    // Activate v2 theme class
    document.body.classList.add("sv2");
  }

  function getInstrumentTheme(instrumentType) {
    return INSTRUMENT_THEMES[instrumentType] || INSTRUMENT_THEMES.guitar;
  }

  function getInstrumentColor(instrumentType) {
    var t = INSTRUMENT_THEMES[instrumentType] || INSTRUMENT_THEMES.guitar;
    return t.primary;
  }

  window.SparkTheme = {
    apply: applyInstrumentTheme,
    get: getInstrumentTheme,
    getColor: getInstrumentColor,
    themes: INSTRUMENT_THEMES
  };
})();
