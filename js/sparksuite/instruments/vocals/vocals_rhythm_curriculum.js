(function() {
  var VOCALS_SKILL_CHART_MAP = {
    vocal_comfort_setup:   "voc_setup_comfort_01",
    vocal_posture:         "voc_posture_01",
    vocal_breath:          "voc_breath_quiet_01",
    pitch_matching:        "voc_pitch_match_base",
    call_response:         "voc_call_response_base",
    three_note_patterns:   "voc_three_note_01",
    stepwise_melody:       "voc_stepwise_melody_base",
    intervals_3rds:        "voc_intervals_3rds_01",
    major_scale_vocal:     "voc_major_scale_01",
    range_map:             "voc_range_map_01",
    entrances:             "voc_count_entrances_01",
    phrase_timing:         "voc_phrase_timing_01",
    syncopation_vocal:     "voc_syncopation_01",
    vowels:                "voc_vowels_01",
    resonance:             "voc_resonance_01",
    dynamics:              "voc_dynamics_01",
    consonants:            "voc_consonants_01",
    song_phrase:           "voc_song_short_phrase_01",
    verse_chorus:          "voc_song_verse_chorus_01",
    vocal_phrase_retry:    "voc_phrase_retry_01",
    record_listen:         "voc_record_listen_01",
    harmony_drone:         "voc_harmony_drone_base",
    harmony_third:         "voc_harmony_drone_base",
    call_response_improv:  "voc_call_response_improv_01",
    background_vocals:     "voc_background_vocals_01",
    mic_technique:         "voc_mic_technique_01",
    confidence_take:       "voc_confidence_take_01",
    full_vocal_song:       "voc_full_easy_song_01",
    vocal_performance_set: "voc_stage_flow_base"
  };

  function getLessonSkill(lessonId) {
    var lessons = window.SparkVocalsLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) return lessons[i].skill;
    }
    return "pitch_matching";
  }

  window.SparkVocalsRhythmCurriculum = {
    selectChartId: function(context) {
      context = context || {};
      var lessonId = context.curriculum && context.curriculum.nextLessonId;
      var skill = getLessonSkill(lessonId);
      var chartId = VOCALS_SKILL_CHART_MAP[skill];
      if (context.segment && context.segment.meta && context.segment.meta.skill) {
        chartId = VOCALS_SKILL_CHART_MAP[context.segment.meta.skill] || chartId;
      }
      return chartId || "voc_pitch_match_base";
    },
    getSkillChartMap: function() {
      return VOCALS_SKILL_CHART_MAP;
    }
  };
})();
