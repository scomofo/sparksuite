(function() {
  // Skill → chart routing for the guitar rhythm engine. Skill IDs come
  // from window.SparkGuitarSkillTree / SparkGuitarLessons; chart IDs
  // come from window.SparkGuitarChartLibrary (see guitar_chart_library.js).
  var GUITAR_SKILL_CHART_MAP = {
    guitar_orientation:    "gtr_orientation_01",
    guitar_tuning:         "gtr_tuning_check_01",
    open_strings:          "gtr_open_strings_01",
    pick_downstrokes:      "gtr_open_strums_01",
    quarter_counting:      "gtr_quarter_count_01",
    first_riff:            "gtr_first_riff_01",
    em_chord:              "gtr_em_chord_pulse_01",
    g_chord:               "gtr_g_chord_pulse_01",
    c_chord:               "gtr_c_chord_pulse_01",
    d_chord:               "gtr_d_chord_pulse_01",
    am_chord:              "gtr_am_chord_pulse_01",
    e_a_chords:            "gtr_e_a_chords_01",
    open_chord_switching:  "gtr_chord_switch_01",
    four_chord_loop:       "gtr_four_chord_loop_01",
    eighth_strumming:      "gtr_eighth_strum_01",
    down_up_strumming:     "gtr_down_up_strum_01",
    muted_strumming:       "gtr_mute_strum_01",
    syncopation_intro:     "gtr_syncopation_intro_01",
    two_chord_song:        "gtr_two_chord_song_01",
    four_chord_song:       "gtr_four_chord_song_01",
    song_phrase_retry:     "gtr_phrase_retry_01",
    song_performance:      "gtr_song_full_easy_01",
    power_chords:          "gtr_power_chord_move_01",
    barre_intro:           "gtr_barre_intro_01",
    minor_pentatonic:      "gtr_pentatonic_run_01",
    single_note_timing:    "gtr_single_note_timing_01",
    bend_slide_intro:      "gtr_bend_slide_intro_01",
    fingerstyle_pima:      "gtr_arpeggio_pima_01",
    caged_intro:           "gtr_caged_intro_01",
    triads_intro:          "gtr_triads_intro_01",
    performance_set:       "gtr_stage_flow_01"
  };

  function getLessonSkill(lessonId) {
    var lessons = window.SparkGuitarLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) return lessons[i].skill;
    }
    return "pick_downstrokes";
  }

  window.SparkGuitarRhythmCurriculum = {
    selectChartId: function(context) {
      if (window.SparkGuitarModule && typeof window.SparkGuitarModule.selectChartId === "function") {
        return window.SparkGuitarModule.selectChartId(context);
      }
      context = context || {};
      var lessonId = context.curriculum && context.curriculum.nextLessonId;
      var skill = getLessonSkill(lessonId);
      var chartId = GUITAR_SKILL_CHART_MAP[skill];
      if (context.segment && context.segment.meta && context.segment.meta.skill) {
        chartId = GUITAR_SKILL_CHART_MAP[context.segment.meta.skill] || chartId;
      }
      return chartId || "gtr_open_strums_01";
    },
    getSkillChartMap: function() {
      return GUITAR_SKILL_CHART_MAP;
    }
  };
})();
