(function() {
  function selectChartId(context) {
    context = context || {};
    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    if (!lessonId) return "drums_lane_tap_01";
    if (lessonId.indexOf("orientation") >= 0) return "drums_lane_tap_01";
    if (lessonId.indexOf("count") >= 0) return "drums_quarter_tap_01";
    if (lessonId.indexOf("single") >= 0) return "drums_single_stroke_01";
    if (lessonId.indexOf("metronome") >= 0) return "drums_click_lock_01";
    if (lessonId.indexOf("kick") >= 0) return "drums_kick_01";
    if (lessonId.indexOf("backbeat") >= 0) return "drums_backbeat_01";
    return "drums_lane_tap_01";
  }

  window.SparkDrumsModule = {
    id: "drums",
    name: "Drums",

    getSkillTree: function() {
      return window.SparkDrumsSkillTree || [];
    },

    getLessons: function() {
      return window.SparkDrumsLessons || [];
    },

    getCurriculum: function() {
      return {
        id: "drums_core",
        title: "DrumSpark Core Curriculum",
        tracks: [{
          id: "track_drums_foundations",
          title: "Foundations",
          lessons: (window.SparkDrumsLessons || []).map(function(lesson) { return lesson.id; })
        }]
      };
    },

    getExercises: function(skill) {
      return [];
    },

    getRuntimeAdapter: function() {
      return new SparkDrumsRhythmAdapter();
    },

    getRhythmAdapter: function() {
      return new SparkDrumsRhythmAdapter();
    },

    selectChartId: selectChartId
  };
})();
