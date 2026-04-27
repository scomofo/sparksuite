(function() {
  function PianoAdapter() {}

  function getPianoModule() {
    if (window.SparkPianoModule) return window.SparkPianoModule;
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

  function PianoRhythmAdapter() {
    this.chartIO = typeof SparkChartIO !== "undefined" ? new SparkChartIO() : null;
  }

  PianoRhythmAdapter.prototype.getLaneCount = function() {
    return 8;
  };

  PianoRhythmAdapter.prototype.getLaneLabels = function() {
    return ["C", "D", "E", "F", "G", "A", "B", "C"];
  };

  PianoRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  PianoRhythmAdapter.prototype.createPayload = function(context) {
    context = context || {};
    var module = getPianoModule();
    var chartId = module && typeof module.selectChartId === "function"
      ? module.selectChartId(context)
      : "pno_pulse_01";
    var definition = window.SparkPianoChartLibrary && typeof window.SparkPianoChartLibrary.getChartDefinition === "function"
      ? window.SparkPianoChartLibrary.getChartDefinition(chartId)
      : { id: chartId, enginePreset: this.getDefaultPreset(), notes: [], phrases: [] };
    return {
      chartId: chartId,
      adapterType: "piano",
      enginePreset: definition.enginePreset || this.getDefaultPreset(),
      laneCount: this.getLaneCount(),
      laneLabels: this.getLaneLabels(),
      noteSpeed: 1,
      assistMode: {
        showTimingText: true,
        showChordNames: true,
        failDisabled: true
      },
      songChart: this.chartIO && typeof this.chartIO.fromExerciseDefinition === "function"
        ? this.chartIO.fromExerciseDefinition(definition, this)
        : definition
    };
  };

  PianoAdapter.prototype.getId = function() {
    return "pianospark";
  };

  PianoAdapter.prototype.getType = function() {
    return "piano";
  };

  PianoAdapter.prototype.getModule = function() {
    return window.SparkPianoModule || null;
  };

  PianoAdapter.prototype.getCurriculumMap = function() {
    if (window.SparkPianoModule && typeof window.SparkPianoModule.getLessons === "function") {
      return window.SparkPianoModule.getLessons();
    }
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

  PianoAdapter.prototype.getRhythmAdapter = function() {
    return new PianoRhythmAdapter();
  };

  window.SparkPianoRhythmAdapter = PianoRhythmAdapter;
  window.SparkPianoAdapter = PianoAdapter;
})();
