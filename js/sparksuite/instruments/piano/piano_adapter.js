(function() {
  function PianoAdapter() {}

  function getPianoModule() {
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
    if (active && active.instrument === "piano" && typeof active.getCurriculumMap === "function") {
      return active;
    }
    if (typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.instrument !== "piano") continue;
      if (candidate && (entry.id === candidate || entry.appId === candidate)) return entry;
      if (!candidate && (entry.id === "pianospark" || entry.appId === "pianospark")) return entry;
    }
    return active && active.instrument === "piano" ? active : null;
  }

  PianoAdapter.prototype.getId = function() {
    return "pianospark";
  };

  PianoAdapter.prototype.getType = function() {
    return "piano";
  };

  PianoAdapter.prototype.getCurriculumMap = function() {
    var module = getPianoModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  PianoAdapter.prototype.getSongs = function() {
    var module = getPianoModule();
    if (module && typeof module.getSongs === "function") {
      return module.getSongs();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  window.SparkPianoAdapter = PianoAdapter;
})();
