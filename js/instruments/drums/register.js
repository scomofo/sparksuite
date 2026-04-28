// js/instruments/drums/register.js
(function() {
  function loadScriptOnce(src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var script = document.createElement("script");
    script.src = src;
    script.defer = false;
    script.onerror = function() {
      console.error("DrumSpark: failed to load", src);
    };
    document.head.appendChild(script);
  }

  function ensureDrumRuntime() {
    if (window.SparkDrumsModule) return;
    loadScriptOnce("js/sparksuite/instruments/drums/drums_skill_tree.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_lessons.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_chart_library.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_rhythm_adapter.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_module.js");
  }

  ensureDrumRuntime();

  SparkInstruments.register({
    id: "drumspark",
    instrument: "drums",
    name: "Drums",
    icon: "\uD83E\uDD41",
    iconImage: "resources/instruments/drums/card.png",
    heroImage: "resources/instruments/drums/hero.jpg",
    skin: null,
    available: true,
    getData: function() { return {}; },
    getLessons: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function" ? SparkDrumsModule.getLessons() : [];
    },
    getSkillTree: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getSkillTree === "function" ? SparkDrumsModule.getSkillTree() : [];
    },
    getRhythmAdapter: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getRhythmAdapter === "function" ? SparkDrumsModule.getRhythmAdapter() : null;
    },
    pages: {},
    tabs: [],
    stemMutePreset: {},
    init: function() {
      ensureDrumRuntime();
    }
  });
})();
