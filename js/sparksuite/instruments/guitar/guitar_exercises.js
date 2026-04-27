(function() {
  // [exerciseId, lessonId, skill, type, title, level, difficulty, tags]
  var EXERCISES = [
    ["ex_guitar_orientation_01",        "lesson_guitar_orientation_01",       "guitar_orientation",   "skill",       "Meet the Guitar Practice",            1, "beginner",          ["orientation"]],
    ["ex_guitar_tuning_01",             "lesson_guitar_tuning_01",            "guitar_tuning",        "skill",       "Tune Without Panic Practice",         1, "beginner",          ["tuning"]],
    ["ex_guitar_open_strings_01",       "lesson_guitar_open_strings_01",      "open_strings",         "skill",       "Open String Sound Check Practice",    1, "beginner",          ["strings","sound"]],
    ["ex_guitar_pick_downstrokes_01",   "lesson_guitar_pick_downstrokes_01",  "pick_downstrokes",     "rhythm",      "Downstrokes on the Beat Practice",    1, "beginner",          ["strumming","timing"]],
    ["ex_guitar_count_quarters_01",     "lesson_guitar_count_quarters_01",    "quarter_counting",     "rhythm",      "Count 1-2-3-4 Practice",              1, "beginner",          ["rhythm"]],
    ["ex_guitar_first_riff_01",         "lesson_guitar_first_riff_01",        "first_riff",           "performance", "First Open-String Riff Practice",     1, "beginner",          ["riff","performance"]],
    ["ex_guitar_em_chord_01",           "lesson_guitar_em_chord_01",          "em_chord",             "chord",       "Em Chord Practice",                   1, "beginner",          ["chord"]],
    ["ex_guitar_g_chord_01",            "lesson_guitar_g_chord_01",           "g_chord",              "chord",       "G Chord Practice",                    2, "early_beginner",    ["chord"]],
    ["ex_guitar_c_chord_01",            "lesson_guitar_c_chord_01",           "c_chord",              "chord",       "C Chord Practice",                    2, "early_beginner",    ["chord"]],
    ["ex_guitar_d_chord_01",            "lesson_guitar_d_chord_01",           "d_chord",              "chord",       "D Chord Practice",                    2, "early_beginner",    ["chord"]],
    ["ex_guitar_am_chord_01",           "lesson_guitar_am_chord_01",          "am_chord",             "chord",       "Am Chord Practice",                   2, "early_beginner",    ["chord"]],
    ["ex_guitar_e_a_chords_01",         "lesson_guitar_e_a_chords_01",        "e_a_chords",           "chord",       "E and A Chord Practice",              2, "early_beginner",    ["chord","optional"]],
    ["ex_guitar_em_g_switch_01",        "lesson_guitar_em_g_switch_01",       "open_chord_switching", "transition",  "Em-G Switch Practice",                2, "early_beginner",    ["transition"]],
    ["ex_guitar_c_g_switch_01",         "lesson_guitar_c_g_switch_01",        "open_chord_switching", "transition",  "C-G Switch Practice",                 2, "early_beginner",    ["transition"]],
    ["ex_guitar_g_d_switch_01",         "lesson_guitar_g_d_switch_01",        "open_chord_switching", "transition",  "G-D Switch Practice",                 2, "early_beginner",    ["transition"]],
    ["ex_guitar_am_c_switch_01",        "lesson_guitar_am_c_switch_01",       "open_chord_switching", "transition",  "Am-C Switch Practice",                2, "early_beginner",    ["transition"]],
    ["ex_guitar_four_chord_loop_01",    "lesson_guitar_four_chord_loop_01",   "four_chord_loop",      "progression", "Four-Chord Loop Practice",            3, "beginner_plus",     ["progression","song"]],
    ["ex_guitar_strum_eighths_01",      "lesson_guitar_strum_eighths_01",     "eighth_strumming",     "rhythm",      "Eighth-Note Engine Practice",         3, "beginner_plus",     ["rhythm","strumming"]],
    ["ex_guitar_strum_down_up_01",      "lesson_guitar_strum_down_up_01",     "down_up_strumming",    "rhythm",      "Down-Up Strum Practice",              3, "beginner_plus",     ["rhythm","strumming"]],
    ["ex_guitar_strum_pattern_pop_01",  "lesson_guitar_strum_pattern_pop_01", "down_up_strumming",    "rhythm",      "Pop Pattern Practice",                3, "beginner_plus",     ["rhythm","pattern"]],
    ["ex_guitar_mute_strum_01",         "lesson_guitar_mute_strum_01",        "muted_strumming",      "rhythm",      "Muted Groove Practice",               4, "early_intermediate",["rhythm","muting"]],
    ["ex_guitar_syncopation_intro_01",  "lesson_guitar_syncopation_intro_01", "syncopation_intro",    "rhythm",      "First Syncopation Practice",          4, "early_intermediate",["rhythm","syncopation"]],
    ["ex_guitar_song_first_two_chord_01","lesson_guitar_song_first_two_chord_01","two_chord_song",    "song",        "First Two-Chord Song Practice",       2, "early_beginner",    ["song"]],
    ["ex_guitar_song_four_chord_01",    "lesson_guitar_song_four_chord_01",   "four_chord_song",      "song",        "First Four-Chord Song Practice",      3, "beginner_plus",     ["song"]],
    ["ex_guitar_song_phrase_retry_01",  "lesson_guitar_song_phrase_retry_01", "song_phrase_retry",    "phrase_retry","Phrase Retry Practice",               3, "beginner_plus",     ["performance","phrase_retry"]],
    ["ex_guitar_song_full_easy_01",     "lesson_guitar_song_full_easy_01",    "song_performance",     "performance", "Full Easy Song Run Practice",         4, "early_intermediate",["performance"]],
    ["ex_guitar_power_chord_shape_01",  "lesson_guitar_power_chord_shape_01", "power_chords",         "chord",       "Power Chord Shape Practice",          4, "early_intermediate",["rock","chord"]],
    ["ex_guitar_power_chord_move_01",   "lesson_guitar_power_chord_move_01",  "power_chords",         "fretboard",   "Move Power Chords Practice",          4, "early_intermediate",["rock","fretboard"]],
    ["ex_guitar_barre_intro_01",        "lesson_guitar_barre_intro_01",       "barre_intro",          "chord",       "Barre Chord Prep Practice",           5, "intermediate",      ["barre"]],
    ["ex_guitar_minor_pentatonic_01",   "lesson_guitar_minor_pentatonic_01",  "minor_pentatonic",     "scale",       "Minor Pentatonic Box Practice",       4, "early_intermediate",["lead","scale"]],
    ["ex_guitar_single_note_timing_01", "lesson_guitar_single_note_timing_01","single_note_timing",   "lead",        "Single-Note Timing Practice",         4, "early_intermediate",["lead","timing"]],
    ["ex_guitar_bend_slide_intro_01",   "lesson_guitar_bend_slide_intro_01",  "bend_slide_intro",     "lead",        "Slides and Bends Practice",           5, "intermediate",      ["lead","expression"]],
    ["ex_guitar_fingerstyle_pima_01",   "lesson_guitar_fingerstyle_pima_01",  "fingerstyle_pima",     "fingerstyle", "Fingerstyle PIMA Practice",           5, "intermediate",      ["fingerstyle"]],
    ["ex_guitar_caged_intro_01",        "lesson_guitar_caged_intro_01",       "caged_intro",          "fretboard",   "CAGED Map Intro Practice",            6, "intermediate_plus", ["fretboard"]],
    ["ex_guitar_triads_intro_01",       "lesson_guitar_triads_intro_01",      "triads_intro",         "fretboard",   "Triads Practice",                     6, "intermediate_plus", ["fretboard","triads"]],
    ["ex_guitar_performance_set_01",    "lesson_guitar_performance_set_01",   "performance_set",      "performance", "Guitar Performance Set Practice",     6, "intermediate_plus", ["performance"]]
  ];

  var library = {};
  function push(key, ex) {
    if (!library[key]) library[key] = [];
    library[key].push(ex);
  }
  for (var i = 0; i < EXERCISES.length; i++) {
    var t = EXERCISES[i];
    var ex = { id: t[0], lessonId: t[1], skill: t[2], type: t[3], title: t[4], level: t[5], difficulty: t[6], tags: t[7] };
    push(ex.lessonId, ex);
    push(ex.skill, ex);
  }
  window.SparkGuitarExercises = library;
})();
