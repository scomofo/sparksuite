(function() {
  function GuitarRhythmAdapter() {
    this.chartIO = new SparkChartIO();
  }

  GuitarRhythmAdapter.prototype.getLaneCount = function() {
    return 5;
  };

  GuitarRhythmAdapter.prototype.getAdapterType = function() {
    return "guitar";
  };

  GuitarRhythmAdapter.prototype.getLaneLabels = function() {
    return ["G", "R", "Y", "B", "O"];
  };

  GuitarRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  GuitarRhythmAdapter.prototype.createPayload = function(context) {
    var chartId = SparkGuitarRhythmCurriculum.selectChartId(context);
    var definition = SparkGuitarChartLibrary.getChartDefinition(chartId);
    var songChart = this.chartIO.fromExerciseDefinition(definition, this);
    return {
      chartId: chartId,
      adapterType: "guitar",
      enginePreset: definition.enginePreset || this.getDefaultPreset(),
      laneCount: this.getLaneCount(),
      laneLabels: this.getLaneLabels(),
      noteSpeed: 1,
      assistMode: {
        showTimingText: true,
        showChordNames: true,
        failDisabled: true
      },
      songChart: songChart,
      chart: this.chartIO.toLaneChart(songChart, this, {
        chartId: chartId,
        laneCount: this.getLaneCount(),
        laneLabels: this.getLaneLabels()
      })
    };
  };

  window.SparkGuitarRhythmAdapter = GuitarRhythmAdapter;
})();
