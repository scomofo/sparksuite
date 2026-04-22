(function() {
  function GuitarAdapter() {}

  function getGuitarModule() {
    var active;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    active = SparkInstruments.getActive();
    candidate = active ? (active.id || active.appId || active.instrumentId || null) : null;
    if (active && active.instrument === "guitar" && typeof active.getCurriculumMap === "function") {
      return active;
    }
    if (typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.instrument !== "guitar") continue;
      if (candidate && (entry.id === candidate || entry.appId === candidate)) return entry;
      if (!candidate && (entry.id === "chordspark" || entry.appId === "chordspark")) return entry;
    }
    return active && active.instrument === "guitar" ? active : null;
  }

  GuitarAdapter.prototype.getId = function() {
    return "chordspark";
  };

  GuitarAdapter.prototype.getType = function() {
    return "guitar";
  };

  GuitarAdapter.prototype.getCurriculumMap = function() {
    var module = getGuitarModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  GuitarAdapter.prototype.getRhythmAdapter = function() {
    var module = getGuitarModule();
    if (module && typeof module.getRhythmAdapter === "function") {
      return module.getRhythmAdapter();
    }
    return new SparkGuitarRhythmAdapter();
  };

  window.SparkGuitarAdapter = GuitarAdapter;
})();
