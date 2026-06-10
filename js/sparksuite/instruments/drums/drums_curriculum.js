(function() {
  window.SparkDrumsCurriculum = {
    id: "curriculum_drums_main",
    title: "DrumSpark Main Curriculum",
    levels: [
      { num: 1, id: "early_beginner", title: "Setup and Counting", track: "track_drums_foundations" },
      { num: 2, id: "beginner_plus", title: "Hands and Timing", track: "track_drums_rudiments" },
      { num: 3, id: "first_grooves", title: "First Grooves", track: "track_drums_first_grooves" },
      { num: 4, id: "fills_transitions", title: "Fills and Transitions", track: "track_drums_fills" },
      { num: 5, id: "coordination", title: "Coordination", track: "track_drums_coordination" },
      { num: 6, id: "reading", title: "Reading", track: "track_drums_reading" },
      { num: 7, id: "styles", title: "Styles", track: "track_drums_styles" },
      { num: 8, id: "performance", title: "Performance", track: "track_drums_performance" }
    ],
    tracks: [
      { id: "track_drums_foundations", title: "Foundations", unitIds: ["unit_drums_setup_and_counting"] },
      { id: "track_drums_rudiments", title: "Rudiments", unitIds: ["unit_drums_hands_and_timing"] },
      { id: "track_drums_first_grooves", title: "First Grooves", unitIds: ["unit_drums_first_grooves"] },
      { id: "track_drums_fills", title: "Fills", unitIds: ["unit_drums_fills"] },
      { id: "track_drums_coordination", title: "Coordination", unitIds: ["unit_drums_coordination"] },
      { id: "track_drums_reading", title: "Reading", unitIds: ["unit_drums_reading"] },
      { id: "track_drums_styles", title: "Styles", unitIds: ["unit_drums_styles"] },
      { id: "track_drums_performance", title: "Performance", unitIds: ["unit_drums_performance"] }
    ],
    units: [
      { id: "unit_drums_setup_and_counting", lessonIds: ["lesson_drums_kit_orientation_01", "lesson_drums_count_quarters_01"] },
      { id: "unit_drums_hands_and_timing", lessonIds: ["lesson_drums_single_strokes_01", "lesson_drums_metronome_lock_01"] },
      { id: "unit_drums_first_grooves", lessonIds: ["lesson_drums_kick_control_01", "lesson_drums_snare_backbeat_01", "lesson_drums_basic_backbeat_01", "lesson_drums_hat_eighths_01"] },
      { id: "unit_drums_fills", lessonIds: ["lesson_drums_one_bar_fill_01", "lesson_drums_crash_transition_01", "lesson_drums_phrase_retry_01"] },
      { id: "unit_drums_coordination", lessonIds: ["lesson_drums_kick_variation_01", "lesson_drums_kick_variation_02", "lesson_drums_hat_open_close_01"] },
      { id: "unit_drums_reading", lessonIds: ["lesson_drums_notation_quarters_01", "lesson_drums_notation_eighths_01", "lesson_drums_notation_sixteenths_01", "lesson_drums_chart_symbols_01"] },
      { id: "unit_drums_styles", lessonIds: ["lesson_drums_pop_groove_01", "lesson_drums_rock_variations_01", "lesson_drums_blues_backbeat_01", "lesson_drums_shuffle_intro_01", "lesson_drums_funk_intro_01"] },
      { id: "unit_drums_performance", lessonIds: ["lesson_drums_full_song_easy_01", "lesson_drums_song_form_01", "lesson_drums_performance_set_01"] }
    ],
    LC: {
      1: "#22c55e",
      2: "#3b82f6",
      3: "#f97316",
      4: "#8b5cf6",
      5: "#06b6d4",
      6: "#14b8a6",
      7: "#0369a1",
      8: "#7c3aed"
    },
    LN: {
      1: "Setup and Counting",
      2: "Hands and Timing",
      3: "First Grooves",
      4: "Fills and Transitions",
      5: "Coordination",
      6: "Reading",
      7: "Styles",
      8: "Performance"
    }
  };
  for (var i = 9; i <= 40; i++) {
    window.SparkDrumsCurriculum.LC[i] = window.SparkDrumsCurriculum.LC[((i - 1) % 8) + 1];
    window.SparkDrumsCurriculum.LN[i] = window.SparkDrumsCurriculum.LN[((i - 1) % 8) + 1];
  }
})();
