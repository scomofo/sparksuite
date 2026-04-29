(function() {
  // Each tuple: [exerciseId, lessonId, skill, type, title, level, difficulty, tags]
  var EXERCISES = [
    ["ex_uke_orientation_01",          "lesson_uke_orientation_01",          "uke_orientation",       "skill",       "Meet the Ukulele Practice",         1, "beginner",          ["orientation"]],
    ["ex_uke_tuning_01",                "lesson_uke_tuning_01",                "uke_tuning",            "skill",       "Tune G-C-E-A Practice",             1, "beginner",          ["tuning"]],
    ["ex_uke_c6_sound_01",              "lesson_uke_c6_sound_01",              "uke_c6_sound",          "skill",       "Open Ukulele Sound Practice",       1, "beginner",          ["sound"]],
    ["ex_uke_down_strum_01",            "lesson_uke_down_strum_01",            "uke_down_strum",        "rhythm",      "First Down Strum Practice",         1, "beginner",          ["rhythm","strumming"]],
    ["ex_uke_count_quarters_01",        "lesson_uke_count_quarters_01",        "uke_quarter_counting",  "rhythm",      "Count and Strum Practice",          1, "beginner",          ["rhythm"]],
    ["ex_uke_c_chord_01",               "lesson_uke_c_chord_01",               "uke_c_chord",           "chord",       "One-Finger C Chord Practice",       1, "beginner",          ["chord"]],
    ["ex_uke_am_chord_01",              "lesson_uke_am_chord_01",              "uke_am_chord",          "chord",       "A Minor Chord Practice",            1, "beginner",          ["chord"]],
    ["ex_uke_f_chord_01",               "lesson_uke_f_chord_01",               "uke_f_chord",           "chord",       "F Chord Practice",                  2, "early_beginner",    ["chord"]],
    ["ex_uke_g7_chord_01",              "lesson_uke_g7_chord_01",              "uke_g7_chord",          "chord",       "G7 Chord Practice",                 2, "early_beginner",    ["chord"]],
    ["ex_uke_g_chord_01",                "lesson_uke_g_chord_01",                "uke_g_chord",           "chord",       "G Chord Practice",                  2, "early_beginner",    ["chord"]],
    ["ex_uke_first_two_chord_song_01",  "lesson_uke_first_two_chord_song_01",  "uke_two_chord_song",    "song",        "First Two-Chord Song Practice",     2, "early_beginner",    ["song"]],
    ["ex_uke_c_am_switch_01",            "lesson_uke_c_am_switch_01",            "uke_chord_switching",   "transition",  "C-Am Switch Practice",              2, "early_beginner",    ["transition"]],
    ["ex_uke_am_f_switch_01",            "lesson_uke_am_f_switch_01",            "uke_chord_switching",   "transition",  "Am-F Switch Practice",              2, "early_beginner",    ["transition"]],
    ["ex_uke_f_g7_switch_01",            "lesson_uke_f_g7_switch_01",            "uke_chord_switching",   "transition",  "F-G7 Switch Practice",              3, "beginner_plus",     ["transition"]],
    ["ex_uke_four_chord_loop_01",        "lesson_uke_four_chord_loop_01",        "uke_four_chord_loop",   "progression", "Four-Chord Uke Loop Practice",      3, "beginner_plus",     ["progression"]],
    ["ex_uke_eighth_strum_01",           "lesson_uke_eighth_strum_01",           "uke_eighth_strum",      "rhythm",      "Eighth Strum Practice",             2, "early_beginner",    ["rhythm"]],
    ["ex_uke_down_up_strum_01",          "lesson_uke_down_up_strum_01",          "uke_down_up_strum",     "rhythm",      "Down-Up Strum Practice",            3, "beginner_plus",     ["rhythm"]],
    ["ex_uke_island_strum_01",           "lesson_uke_island_strum_01",           "uke_island_strum",      "rhythm",      "Island Strum Practice",             3, "beginner_plus",     ["rhythm","style"]],
    ["ex_uke_chuck_intro_01",            "lesson_uke_chuck_intro_01",            "uke_chuck",             "rhythm",      "Chuck Intro Practice",              4, "early_intermediate",["rhythm","percussion"]],
    ["ex_uke_song_3_chord_01",            "lesson_uke_song_3_chord_01",            "uke_song",              "song",        "Three-Chord Song Practice",         3, "beginner_plus",     ["song"]],
    ["ex_uke_song_4_chord_01",            "lesson_uke_song_4_chord_01",            "uke_song",              "song",        "Four-Chord Song Practice",          4, "early_intermediate",["song"]],
    ["ex_uke_phrase_retry_01",            "lesson_uke_phrase_retry_01",            "uke_phrase_retry",      "phrase_retry","Phrase Retry Practice",             4, "early_intermediate",["performance","phrase_retry"]],
    ["ex_uke_fingerpicking_thumb_01",    "lesson_uke_fingerpicking_thumb_01",    "uke_fingerpicking",     "picking",     "Thumb Picking Practice",            4, "early_intermediate",["picking"]],
    ["ex_uke_fingerpicking_roll_01",      "lesson_uke_fingerpicking_roll_01",      "uke_fingerpicking",     "picking",     "Fingerpicking Roll Practice",       5, "intermediate",      ["picking"]],
    ["ex_uke_c_major_scale_01",          "lesson_uke_c_major_scale_01",          "uke_c_scale",           "scale",       "C Major Scale Practice",            4, "early_intermediate",["scale"]],
    ["ex_uke_simple_melody_01",          "lesson_uke_simple_melody_01",          "uke_melody",            "melody",      "Simple Melody Practice",            4, "early_intermediate",["melody"]],
    ["ex_uke_swing_strum_01",            "lesson_uke_swing_strum_01",            "uke_styles",            "style",       "Swing Strum Practice",              5, "intermediate",      ["style","swing"]],
    ["ex_uke_reggae_skank_01",            "lesson_uke_reggae_skank_01",            "uke_styles",            "style",       "Reggae Skank Practice",             5, "intermediate",      ["style","reggae"]],
    ["ex_uke_performance_set_01",        "lesson_uke_performance_set_01",        "uke_performance_set",   "performance", "Ukulele Performance Set Practice",  6, "intermediate_plus", ["performance"]]
  ];

  var library = {};
  function push(key, ex) {
    if (!library[key]) library[key] = [];
    library[key].push(ex);
  }
  for (var i = 0; i < EXERCISES.length; i++) {
    var t = EXERCISES[i];
    var ex = {
      id: t[0], lessonId: t[1], skill: t[2], type: t[3],
      title: t[4], level: t[5], difficulty: t[6], tags: t[7]
    };
    push(ex.lessonId, ex);
    push(ex.skill, ex);
  }
  window.SparkUkuleleExercises = library;
})();
