(function() {
  function VocalsRhythmAdapter() {
    this.chartIO = typeof SparkChartIO === "function" ? new SparkChartIO() : null;
  }

  VocalsRhythmAdapter.prototype.getLaneCount = function() {
    return 5;
  };

  VocalsRhythmAdapter.prototype.getLaneLabels = function() {
    return ["do", "re", "mi", "sol", "la"];
  };

  VocalsRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  VocalsRhythmAdapter.prototype.createPayload = function(context) {
    var chartId = (window.SparkVocalsRhythmCurriculum
      && typeof SparkVocalsRhythmCurriculum.selectChartId === "function")
      ? SparkVocalsRhythmCurriculum.selectChartId(context)
      : "voc_pitch_match_base";
    var definition = SparkVocalsChartLibrary.getChartDefinition(chartId);
    var rangeProfile = (window.SparkVocalsRuntimeAdapter
      && typeof SparkVocalsRuntimeAdapter.getRangeProfile === "function")
      ? SparkVocalsRuntimeAdapter.getRangeProfile(context && context.rangeProfile)
      : { rootMidi: 60, label: "C4 root" };
    return {
      chartId: chartId,
      adapterType: "vocals",
      enginePreset: definition.enginePreset || this.getDefaultPreset(),
      laneCount: this.getLaneCount(),
      laneLabels: this.getLaneLabels(),
      noteSpeed: 1,
      assistMode: {
        showTimingText: true,
        showPitchText: true,
        showLyricText: true,
        failDisabled: true
      },
      rangeProfile: rangeProfile,
      pitchLanes: window.SparkVocalsRuntimeAdapter
        && typeof SparkVocalsRuntimeAdapter.getPitchLanes === "function"
        ? SparkVocalsRuntimeAdapter.getPitchLanes()
        : [],
      songChart: this.chartIO
        ? this.chartIO.fromExerciseDefinition(definition, this)
        : { metadata: { laneCount: this.getLaneCount() }, tracks: { vocals: { notes: definition.notes.slice() } } }
    };
  };

  window.SparkVocalsRhythmAdapter = VocalsRhythmAdapter;
})();
