(function() {
  function lesson(id, num, title, skill, prereq, exercises, songId) {
    return {
      id: id,
      num: num,
      title: title,
      skill: skill,
      prerequisites: prereq || [],
      exerciseIds: exercises || [],
      songId: songId || null,
      masteryRequired: num <= 2 ? 0.6 : num <= 5 ? 0.7 : 0.78,
      desc: title + " for DrumSpark."
    };
  }

  window.SparkDrumsLessons = [
    lesson("lesson_drums_kit_orientation_01", 1, "Meet the Kit", "kit_orientation", [], ["ex_drums_lane_tap_01"], "song_drums_pulse_loop_01"),
    lesson("lesson_drums_count_quarters_01", 2, "Count Quarter Notes", "counting_quarters", ["kit_orientation"], ["ex_drums_quarter_tap_01", "ex_drums_hat_eighths_01"], "song_drums_click_groove_seed_01"),
    lesson("lesson_drums_single_strokes_01", 3, "Single Strokes", "single_strokes", ["counting_quarters"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_metronome_lock_01", 4, "Lock to the Click", "metronome_lock", ["counting_quarters"], ["ex_drums_click_lock_01"], "song_drums_steady_verse_01"),
    lesson("lesson_drums_kick_control_01", 5, "Kick Control", "kick_control", ["metronome_lock"], ["ex_drums_kick_beat_1_01", "ex_drums_kick_1_3_01"], "song_drums_kick_pulse_01"),
    lesson("lesson_drums_snare_backbeat_01", 6, "Snare on Two and Four", "snare_backbeat", ["single_strokes"], ["ex_drums_snare_2_4_01"], "song_drums_backbeat_loop_01"),
    lesson("lesson_drums_basic_backbeat_01", 7, "First Backbeat", "basic_backbeat", ["kick_control", "snare_backbeat"], ["ex_drums_basic_backbeat_01", "ex_drums_backbeat_8bar_01"], "song_drums_first_rock_beat_01"),
    lesson("lesson_drums_hat_eighths_01", 8, "Hi-Hat Eighths", "hi_hat_eighths", ["basic_backbeat"], ["ex_drums_hat_eighths_01"], "song_drums_hat_engine_01"),
    lesson("lesson_drums_groove_consistency_01", 9, "Groove Consistency", "groove_consistency", ["basic_backbeat"], ["ex_drums_backbeat_8bar_01"], "song_drums_steady_verse_01"),
    lesson("lesson_drums_one_bar_fill_01", 10, "One-Bar Fill", "one_bar_fills", ["basic_backbeat"], ["ex_drums_fill_quarters_01"], "song_drums_fill_return_01"),
    lesson("lesson_drums_crash_transition_01", 11, "Crash Transition", "crash_transitions", ["one_bar_fills"], ["ex_drums_crash_entry_01"], "song_drums_section_entry_01"),
    lesson("lesson_drums_phrase_retry_01", 12, "Phrase Retry", "groove_consistency", ["basic_backbeat"], ["ex_drums_backbeat_8bar_01"], "song_drums_steady_verse_01"),
    lesson("lesson_drums_kick_variation_01", 13, "Kick Variation A", "kick_variations", ["basic_backbeat"], ["ex_drums_kick_variation_a_01"], "song_drums_kick_variation_a_01"),
    lesson("lesson_drums_kick_variation_02", 14, "Offbeat Kick Loop", "kick_variations", ["kick_variations"], ["ex_drums_offbeat_kick_01"], "song_drums_pop_kick_01"),
    lesson("lesson_drums_hat_open_close_01", 15, "Open and Closed Hat", "hat_variations", ["hi_hat_eighths"], ["ex_drums_open_hat_4and_01"], "song_drums_hat_color_01"),
    lesson("lesson_drums_notation_quarters_01", 16, "Quarter-Note Notation", "drum_notation", ["counting_quarters"], ["ex_drums_quarter_tap_01"], "song_drums_pulse_loop_01"),
    lesson("lesson_drums_notation_eighths_01", 17, "Eighth-Note Notation", "drum_notation", ["hi_hat_eighths"], ["ex_drums_hat_eighths_01"], "song_drums_hat_engine_01"),
    lesson("lesson_drums_notation_sixteenths_01", 18, "Sixteenth-Note Notation", "drum_notation", ["single_strokes"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_chart_symbols_01", 19, "Chart Symbols", "drum_notation", ["drum_notation"], ["ex_drums_crash_entry_01"], "song_drums_section_entry_01"),
    lesson("lesson_drums_accents_01", 20, "Accent Control", "dynamics_accents", ["single_strokes"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_dynamics_accents_01", 21, "Dynamics and Accents", "dynamics_accents", ["dynamics_accents"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_double_strokes_01", 22, "Double Strokes", "single_strokes", ["single_strokes"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_flams_01", 23, "Flams", "dynamics_accents", ["single_strokes"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_paradiddle_01", 24, "Paradiddle Intro", "single_strokes", ["single_strokes"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_click_subdivision_01", 25, "Click Subdivision", "metronome_lock", ["metronome_lock"], ["ex_drums_click_lock_01"], "song_drums_click_groove_seed_01"),
    lesson("lesson_drums_create_fill_01", 26, "Create a Fill", "one_bar_fills", ["one_bar_fills"], ["ex_drums_fill_quarters_01"], "song_drums_fill_return_01"),
    lesson("lesson_drums_pop_groove_01", 27, "Pop Groove", "basic_backbeat", ["basic_backbeat"], ["ex_drums_verse_chorus_01"], "song_drums_pop_kick_01"),
    lesson("lesson_drums_rock_variations_01", 28, "Rock Variations", "kick_variations", ["kick_variations"], ["ex_drums_kick_variation_a_01"], "song_drums_kick_variation_a_01"),
    lesson("lesson_drums_blues_backbeat_01", 29, "Blues Backbeat", "shuffle_feel", ["hi_hat_eighths"], ["ex_drums_basic_backbeat_01"], "song_drums_first_rock_beat_01"),
    lesson("lesson_drums_shuffle_intro_01", 30, "Shuffle Intro", "shuffle_feel", ["hi_hat_eighths"], ["ex_drums_hat_eighths_01"], "song_drums_hat_engine_01"),
    lesson("lesson_drums_funk_intro_01", 31, "Funk Intro", "funk_groove_intro", ["kick_variations", "hat_variations"], ["ex_drums_offbeat_kick_01"], "song_drums_pop_kick_01"),
    lesson("lesson_drums_rudiment_to_fill_01", 32, "Rudiment to Fill", "one_bar_fills", ["single_strokes", "one_bar_fills"], ["ex_drums_fill_quarters_01"], "song_drums_fill_return_01"),
    lesson("lesson_drums_song_form_01", 33, "Song Form", "song_form", ["basic_backbeat"], ["ex_drums_verse_chorus_01"], "song_drums_mini_song_01"),
    lesson("lesson_drums_full_song_easy_01", 34, "Full Easy Song", "song_form", ["song_form"], ["ex_drums_verse_chorus_01"], "song_drums_mini_song_01"),
    lesson("lesson_drums_endurance_01", 35, "Endurance Builder", "groove_consistency", ["groove_consistency"], ["ex_drums_backbeat_8bar_01"], "song_drums_steady_verse_01"),
    lesson("lesson_drums_performance_set_01", 36, "Performance Set", "performance_set", ["song_form", "crash_transitions"], ["ex_drums_verse_chorus_01", "ex_drums_fill_quarters_01"], "song_drums_mini_song_01"),

    lesson("lesson_drums_count_01", 2, "Count 1-2-3-4", "counting_quarters", ["kit_orientation"], ["ex_drums_quarter_tap_01"], "song_drums_click_groove_seed_01"),
    lesson("lesson_drums_single_01", 3, "Single Strokes", "single_strokes", ["counting_quarters"], ["ex_drums_single_stroke_01"], "song_drums_stick_control_loop_01"),
    lesson("lesson_drums_click_01", 4, "Lock to Click", "metronome_lock", ["counting_quarters"], ["ex_drums_click_lock_01"], "song_drums_steady_verse_01"),
    lesson("lesson_drums_kick_01", 5, "Kick Control", "kick_control", ["metronome_lock"], ["ex_drums_kick_beat_1_01"], "song_drums_kick_pulse_01"),
    lesson("lesson_drums_backbeat_01", 7, "First Backbeat", "basic_backbeat", ["kick_control", "snare_backbeat"], ["ex_drums_basic_backbeat_01"], "song_drums_first_rock_beat_01")
  ];
})();
