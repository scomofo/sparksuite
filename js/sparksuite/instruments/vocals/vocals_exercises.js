(function() {
  // [exerciseId, lessonId, skill, type, title, level, difficulty, tags]
  var EXERCISES = [
    ["ex_vocal_setup_comfort_01",        "lesson_vocal_setup_comfort_01",        "vocal_comfort_setup",   "skill",       "Voice Setup Practice",          1, "beginner",          ["setup","safety"]],
    ["ex_vocal_posture_01",              "lesson_vocal_posture_01",              "vocal_posture",         "skill",       "Singer Posture Practice",       1, "beginner",          ["posture"]],
    ["ex_vocal_breath_quiet_01",         "lesson_vocal_breath_quiet_01",         "vocal_breath",          "breath",      "Quiet Breath Practice",         1, "beginner",          ["breath"]],
    ["ex_vocal_pitch_matching_01",       "lesson_vocal_pitch_matching_01",       "pitch_matching",        "pitch",       "Match One Pitch Practice",      1, "beginner",          ["pitch"]],
    ["ex_vocal_first_call_response_01",  "lesson_vocal_first_call_response_01",  "call_response",         "pitch",       "Call and Response Practice",    1, "beginner",          ["pitch","response"]],
    ["ex_vocal_3_note_patterns_01",      "lesson_vocal_3_note_patterns_01",      "three_note_patterns",   "pitch",       "Three-Note Patterns Practice",  2, "early_beginner",    ["pitch"]],
    ["ex_vocal_stepwise_melody_01",      "lesson_vocal_stepwise_melody_01",      "stepwise_melody",       "melody",      "Stepwise Melody Practice",      2, "early_beginner",    ["melody"]],
    ["ex_vocal_intervals_3rds_01",       "lesson_vocal_intervals_3rds_01",       "intervals_3rds",        "ear_training","Thirds by Ear Practice",        3, "beginner_plus",     ["ear_training"]],
    ["ex_vocal_scale_major_01",          "lesson_vocal_scale_major_01",          "major_scale_vocal",     "scale",       "Major Scale Practice",          3, "beginner_plus",     ["scale"]],
    ["ex_vocal_range_map_01",            "lesson_vocal_range_map_01",            "range_map",             "skill",       "Map Range Practice",            2, "early_beginner",    ["range","safety"]],
    ["ex_vocal_count_entrances_01",      "lesson_vocal_count_entrances_01",      "entrances",             "rhythm",      "Count Entrance Practice",       2, "early_beginner",    ["rhythm"]],
    ["ex_vocal_phrase_timing_01",        "lesson_vocal_phrase_timing_01",        "phrase_timing",         "rhythm",      "Phrase Timing Practice",        3, "beginner_plus",     ["rhythm"]],
    ["ex_vocal_syncopation_intro_01",    "lesson_vocal_syncopation_intro_01",    "syncopation_vocal",     "rhythm",      "Off-Beat Entry Practice",       4, "early_intermediate",["rhythm","syncopation"]],
    ["ex_vocal_vowels_01",               "lesson_vocal_vowels_01",               "vowels",                "tone",        "Vowels Practice",               2, "early_beginner",    ["tone","vowels"]],
    ["ex_vocal_resonance_forward_01",    "lesson_vocal_resonance_forward_01",    "resonance",             "tone",        "Forward Resonance Practice",    3, "beginner_plus",     ["tone"]],
    ["ex_vocal_dynamics_01",             "lesson_vocal_dynamics_01",             "dynamics",              "musicality",  "Dynamics Practice",             4, "early_intermediate",["musicality"]],
    ["ex_vocal_consonants_01",           "lesson_vocal_consonants_01",           "consonants",            "diction",     "Consonants Practice",           3, "beginner_plus",     ["diction"]],
    ["ex_vocal_song_short_phrase_01",    "lesson_vocal_song_short_phrase_01",    "song_phrase",           "song",        "Short Song Phrase Practice",    3, "beginner_plus",     ["song"]],
    ["ex_vocal_song_verse_chorus_01",    "lesson_vocal_song_verse_chorus_01",    "verse_chorus",          "song",        "Verse and Chorus Practice",     4, "early_intermediate",["song"]],
    ["ex_vocal_phrase_retry_01",         "lesson_vocal_phrase_retry_01",         "vocal_phrase_retry",    "phrase_retry","Phrase Retry Practice",         4, "early_intermediate",["performance","phrase_retry"]],
    ["ex_vocal_record_listen_01",        "lesson_vocal_record_listen_01",        "record_listen",         "feedback",    "Record and Listen Practice",    4, "early_intermediate",["feedback","confidence"]],
    ["ex_vocal_drone_pitch_01",          "lesson_vocal_drone_pitch_01",          "harmony_drone",         "harmony",     "Drone Pitch Practice",          3, "beginner_plus",     ["harmony"]],
    ["ex_vocal_harmony_third_01",        "lesson_vocal_harmony_third_01",        "harmony_third",         "harmony",     "Harmony Third Practice",        5, "intermediate",      ["harmony"]],
    ["ex_vocal_call_response_improv_01", "lesson_vocal_call_response_improv_01", "call_response_improv",  "creative",    "Call-Response Improv Practice", 5, "intermediate",      ["creative"]],
    ["ex_vocal_background_vocals_01",    "lesson_vocal_background_vocals_01",    "background_vocals",     "harmony",     "Background Vocals Practice",    5, "intermediate",      ["harmony","performance"]],
    ["ex_vocal_mic_technique_01",        "lesson_vocal_mic_technique_01",        "mic_technique",         "performance", "Mic Technique Practice",        4, "early_intermediate",["performance","mic"]],
    ["ex_vocal_confidence_take_01",      "lesson_vocal_confidence_take_01",      "confidence_take",       "performance", "Confidence Take Practice",      5, "intermediate",      ["performance","confidence"]],
    ["ex_vocal_full_easy_song_01",       "lesson_vocal_full_easy_song_01",       "full_vocal_song",       "performance", "Full Easy Vocal Song Practice", 5, "intermediate",      ["performance"]],
    ["ex_vocal_performance_set_01",      "lesson_vocal_performance_set_01",      "vocal_performance_set", "performance", "Performance Set Practice",      6, "intermediate_plus", ["performance"]]
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
  window.SparkVocalsExercises = library;
})();
