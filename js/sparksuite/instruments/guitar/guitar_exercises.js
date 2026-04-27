(function() {
  var rows = [
    ["lesson_gtr_01", "gtr_orientation", "orientation", "Guitar orientation reset", 45],
    ["lesson_gtr_02", "gtr_tuning", "tuning", "Tune one string, then reset", 60],
    ["lesson_gtr_03", "gtr_pick_hold", "technique", "Pick hold micro-check", 45],
    ["lesson_gtr_04", "gtr_open_strum", "rhythm", "Open-string pulse", 60],
    ["lesson_gtr_05", "gtr_down_strum", "rhythm", "Down-strum 8 bars", 60],
    ["lesson_gtr_06", "gtr_quarter_counting", "rhythm", "Count 1-2-3-4 aloud", 60],
    ["lesson_gtr_07", "gtr_em_chord", "chord", "E minor pulse", 60],
    ["lesson_gtr_08", "gtr_g_chord", "chord", "G chord pulse", 60],
    ["lesson_gtr_09", "gtr_c_chord", "chord", "C chord pulse", 60],
    ["lesson_gtr_10", "gtr_d_chord", "chord", "D chord pulse", 60],
    ["lesson_gtr_11", "gtr_chord_switching", "switch", "Two-chord switch loop", 90],
    ["lesson_gtr_12", "gtr_two_chord_song", "song_loop", "Two-chord song loop", 90],
    ["lesson_gtr_13", "gtr_four_chord_loop", "song_loop", "Four-chord loop", 120],
    ["lesson_gtr_14", "gtr_eighth_strum", "rhythm", "Eighth-note grid", 60],
    ["lesson_gtr_15", "gtr_down_up_strum", "rhythm", "Down-up strum loop", 60],
    ["lesson_gtr_16", "gtr_accent_strum", "rhythm", "Accent beat 2 and 4", 60],
    ["lesson_gtr_17", "gtr_muting", "technique", "Mute-and-release loop", 60],
    ["lesson_gtr_18", "gtr_fingerpicking", "picking", "Simple arpeggio", 90],
    ["lesson_gtr_19", "gtr_g_major_scale", "scale", "G major scale path", 90],
    ["lesson_gtr_20", "gtr_melody", "melody", "Four-note melody", 90],
    ["lesson_gtr_21", "gtr_power_chords", "chord", "Power chord move", 90],
    ["lesson_gtr_22", "gtr_barre_intro", "technique", "Partial barre pressure", 60],
    ["lesson_gtr_23", "gtr_song", "performance_run", "Song-form run", 120],
    ["lesson_gtr_24", "gtr_phrase_retry", "phrase_retry", "Loop weakest phrase", 90],
    ["lesson_gtr_25", "gtr_performance_set", "performance_run", "Performance set", 180]
  ];

  var byLesson = {};
  var bySkill = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var item = {
      id: r[0] + "_ex_01",
      lessonId: r[0],
      skill: r[1],
      type: r[2],
      title: r[3],
      durationSec: r[4],
      cues: ["count_in", "visual_pulse", "slow_reset"],
      passCriteria: { accuracy: 0.85, timingWindowMs: 90 }
    };
    if (!byLesson[r[0]]) byLesson[r[0]] = [];
    if (!bySkill[r[1]]) bySkill[r[1]] = [];
    byLesson[r[0]].push(item);
    bySkill[r[1]].push(item);
  }

  window.SparkGuitarExercises = bySkill;
  window.SparkGuitarExercisesByLesson = byLesson;
})();
