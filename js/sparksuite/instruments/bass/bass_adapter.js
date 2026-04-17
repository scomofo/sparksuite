(function() {
  function BassAdapter() {}

  function getBassModule() {
    var active;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
      active = SparkInstruments.getActive();
      candidate = active ? (active.id || active.appId || active.instrumentId || null) : null;
      if (active && active.instrument === "bass" && typeof active.getCurriculumMap === "function") {
        return active;
      }
      if (typeof SparkInstruments.getAll === "function") {
        all = SparkInstruments.getAll() || [];
        for (i = 0; i < all.length; i++) {
          entry = all[i] || {};
          if (entry.instrument !== "bass") continue;
          if (candidate && (entry.id === candidate || entry.appId === candidate)) return entry;
          if (!candidate && (entry.id === "bassspark" || entry.appId === "bassspark")) return entry;
        }
      }
      if (active && active.instrument === "bass") return active;
    }
    return typeof SparkBassModule !== "undefined" ? SparkBassModule : null;
  }

  BassAdapter.prototype.getId = function() {
    return "bassspark";
  };

  BassAdapter.prototype.getType = function() {
    return "bass";
  };

  BassAdapter.prototype.getCurriculumMap = function() {
    var module = getBassModule();
    if (module && typeof module.getCurriculumMap === "function") {
      return module.getCurriculumMap();
    }
    return typeof SparkInstrumentAdapter !== "undefined" ? SparkInstrumentAdapter.getCurriculumMap() : [];
  };

  BassAdapter.prototype.getSongs = function() {
    var module = getBassModule();
    if (module && typeof module.getSongs === "function") {
      return module.getSongs();
    }
    return typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getSongs === "function"
      ? SparkInstrumentAdapter.getSongs()
      : [];
  };

  BassAdapter.prototype.getRhythmAdapter = function() {
    var module = getBassModule();
    return module && typeof module.getRhythmAdapter === "function" ? module.getRhythmAdapter() : null;
  };

  window.SparkBassAdapter = BassAdapter;
})();
