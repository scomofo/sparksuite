(function() {
  function DrumsRhythmAdapter() {}

  DrumsRhythmAdapter.prototype.getLaneCount = function() {
    return 3;
  };

  DrumsRhythmAdapter.prototype.getLaneLabels = function() {
    return ["Kick", "Snare", "Hat"];
  };

  DrumsRhythmAdapter.prototype.getDefaultPreset = function() {
    return "spark_learning";
  };

  DrumsRhythmAdapter.prototype.createPayload = function(context) {
    context = context || {};

    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    var chartId = selectChartId(lessonId);

    var definition = window.SparkDrumsChartLibrary.getChartDefinition(chartId);

    return {
      chartId: chartId,
      adapterType: "drums",
      enginePreset: definition.enginePreset || this.getDefaultPreset(),
      laneCount: this.getLaneCount(),
      laneLabels: this.getLaneLabels(),
      songChart: definition
    };
  };

  function selectChartId(lessonId) {
    if (!lessonId) return "drums_lane_tap_01";

    if (lessonId.indexOf("orientation") >= 0) return "drums_lane_tap_01";
    if (lessonId.indexOf("count") >= 0) return "drums_quarter_tap_01";
    if (lessonId.indexOf("single") >= 0) return "drums_single_stroke_01";
    if (lessonId.indexOf("metronome") >= 0) return "drums_click_lock_01";
    if (lessonId.indexOf("kick") >= 0) return "drums_kick_01";
    if (lessonId.indexOf("backbeat") >= 0) return "drums_backbeat_01";

    return "drums_lane_tap_01";
  }

  window.SparkDrumsRhythmAdapter = DrumsRhythmAdapter;
})();
