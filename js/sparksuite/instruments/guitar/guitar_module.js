(function() {
  var GUITAR_SKILL_CHART_MAP = {
    gtr_down_strum: "power_chords_01",
    gtr_open_strum: "power_chords_01",
    gtr_chord_switching: "power_chords_01",
    gtr_two_chord_song: "power_chords_01",
    gtr_four_chord_loop: "power_chords_01",
    gtr_eighth_strum: "power_chords_01",
    gtr_down_up_strum: "power_chords_01",
    gtr_accent_strum: "power_chords_01",
    gtr_muting: "power_chords_01",
    gtr_fingerpicking: "power_chords_01",
    gtr_melody: "power_chords_01",
    gtr_power_chords: "power_chords_01",
    gtr_song: "power_chords_01",
    gtr_phrase_retry: "power_chords_01",
    gtr_performance_set: "power_chords_01"
  };

  function getLessonSkill(id) {
    var lessons = window.SparkGuitarLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === id) return lessons[i].skill;
    }
    return "gtr_down_strum";
  }

  function selectChart(context) {
    context = context || {};
    var lessonId = context.curriculum && context.curriculum.nextLessonId;
    var skill = getLessonSkill(lessonId);
    return GUITAR_SKILL_CHART_MAP[skill] || "power_chords_01";
  }

  window.SparkGuitarModule = {
    id: "guitar",

    getSkillTree: function() {
      return window.SparkGuitarSkillTree || [];
    },

    getLessons: function() {
      return window.SparkGuitarLessons || [];
    },

    getCurriculum: function() {
      return window.SparkGuitarCurriculum || null;
    },

    getExercises: function(skill) {
      return (window.SparkGuitarExercises || {})[skill] || [];
    },

    getPacks: function() {
      return window.SparkGuitarPacks || [];
    },

    getSongs: function() {
      return window.SparkGuitarSongs || [];
    },

    getRuntimeAdapter: function() {
      return new SparkGuitarRuntimeAdapter();
    },

    getRhythmAdapter: function() {
      return new SparkGuitarRhythmAdapter();
    },

    selectChartId: selectChart
  };
})();
