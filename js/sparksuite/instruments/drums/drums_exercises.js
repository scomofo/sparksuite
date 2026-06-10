(function() {
  function exercise(id, title, skill, patternId, chartId, bpm, type) {
    return {
      id: id,
      title: title,
      skill: skill,
      type: type || "rhythm",
      patternId: patternId,
      chartId: chartId || id.replace(/^ex_/, ""),
      bpm: bpm || 72,
      masteryTarget: 0.78,
      desc: title + " drum exercise."
    };
  }

  window.SparkDrumsExercises = [
    exercise("ex_drums_lane_tap_01", "Lane Tap Orientation", "kit_orientation", "pattern_drums_lane_tap_01", "drums_lane_tap_01", 60, "orientation"),
    exercise("ex_drums_quarter_tap_01", "Quarter Tap", "counting_quarters", "pattern_drums_quarter_tap_01", "drums_quarter_tap_01", 64),
    exercise("ex_drums_hat_eighths_01", "Hi-Hat Eighths", "hi_hat_eighths", "pattern_drums_hat_eighths_01", "drums_hat_eighths_01", 70),
    exercise("ex_drums_single_stroke_01", "Single-Stroke RLRL", "single_strokes", "pattern_drums_single_stroke_01", "drums_single_stroke_01", 68, "rudiment"),
    exercise("ex_drums_click_lock_01", "Click Lock", "metronome_lock", "pattern_drums_quarter_tap_01", "drums_click_lock_01", 66),
    exercise("ex_drums_kick_beat_1_01", "Kick on One", "kick_control", "pattern_drums_kick_beat_1_01", "drums_kick_beat_1_01", 68),
    exercise("ex_drums_kick_1_3_01", "Kick on One and Three", "kick_control", "pattern_drums_kick_1_3_01", "drums_kick_1_3_01", 70),
    exercise("ex_drums_snare_2_4_01", "Snare Two and Four", "snare_backbeat", "pattern_drums_snare_2_4_01", "drums_snare_2_4_01", 70),
    exercise("ex_drums_basic_backbeat_01", "Basic Backbeat", "basic_backbeat", "pattern_drums_basic_backbeat_01", "drums_basic_backbeat_01", 72),
    exercise("ex_drums_backbeat_8bar_01", "Eight-Bar Backbeat", "groove_consistency", "pattern_drums_basic_backbeat_01", "drums_backbeat_8bar_01", 74),
    exercise("ex_drums_fill_quarters_01", "Quarter-Note Fill", "one_bar_fills", "pattern_drums_fill_quarters_01", "drums_fill_quarters_01", 76, "fill"),
    exercise("ex_drums_crash_entry_01", "Crash Entry", "crash_transitions", "pattern_drums_crash_entry_01", "drums_crash_entry_01", 76, "transition"),
    exercise("ex_drums_kick_variation_a_01", "Kick Variation A", "kick_variations", "pattern_drums_kick_variation_a_01", "drums_kick_variation_a_01", 78),
    exercise("ex_drums_offbeat_kick_01", "Offbeat Kick", "kick_variations", "pattern_drums_offbeat_kick_01", "drums_offbeat_kick_01", 78),
    exercise("ex_drums_open_hat_4and_01", "Open Hat on Four-And", "hat_variations", "pattern_drums_open_hat_4and_01", "drums_open_hat_4and_01", 76),
    exercise("ex_drums_verse_chorus_01", "Verse and Chorus", "song_form", "pattern_drums_verse_chorus_01", "drums_verse_chorus_01", 80, "song"),

    exercise("drill_drums_count_and_tap_01", "Count and Tap Drill", "counting_quarters", "pattern_drums_quarter_tap_01", "drums_quarter_tap_01", 64, "drill"),
    exercise("drill_drums_hat_counting_01", "Hat Counting Drill", "hi_hat_eighths", "pattern_drums_hat_eighths_01", "drums_hat_eighths_01", 70, "drill"),
    exercise("drill_drums_rlrl_01", "RLRL Drill", "single_strokes", "pattern_drums_single_stroke_01", "drums_single_stroke_01", 68, "drill"),
    exercise("drill_drums_kick_quarters_01", "Kick Quarters Drill", "kick_control", "pattern_drums_kick_1_3_01", "drums_kick_1_3_01", 70, "drill"),
    exercise("drill_drums_backbeat_4bar_01", "Four-Bar Backbeat Drill", "basic_backbeat", "pattern_drums_basic_backbeat_01", "drums_basic_backbeat_01", 72, "drill"),
    exercise("drill_drums_backbeat_callout_01", "Backbeat Callout Drill", "basic_backbeat", "pattern_drums_basic_backbeat_01", "drums_basic_backbeat_01", 72, "drill"),
    exercise("drill_drums_fill_return_01", "Fill Return Drill", "one_bar_fills", "pattern_drums_fill_quarters_01", "drums_fill_quarters_01", 76, "drill"),
    exercise("drill_drums_crash_kick_alignment_01", "Crash and Kick Alignment Drill", "crash_transitions", "pattern_drums_crash_entry_01", "drums_crash_entry_01", 76, "drill"),
    exercise("drill_drums_kick_variation_a_01", "Kick Variation A Drill", "kick_variations", "pattern_drums_kick_variation_a_01", "drums_kick_variation_a_01", 78, "drill"),
    exercise("drill_drums_offbeat_kick_loop_01", "Offbeat Kick Loop Drill", "kick_variations", "pattern_drums_offbeat_kick_01", "drums_offbeat_kick_01", 78, "drill"),
    exercise("drill_drums_open_close_hat_01", "Open-Close Hat Drill", "hat_variations", "pattern_drums_open_hat_4and_01", "drums_open_hat_4and_01", 76, "drill"),
    exercise("drill_drums_early_late_awareness_01", "Early-Late Awareness Drill", "metronome_lock", "pattern_drums_quarter_tap_01", "drums_click_lock_01", 66, "drill"),
    exercise("drill_drums_recovery_after_miss_01", "Recovery After Miss Drill", "groove_consistency", "pattern_drums_basic_backbeat_01", "drums_backbeat_8bar_01", 74, "drill"),
    exercise("drill_drums_call_response_lanes_01", "Call-Response Lanes Drill", "lane_identification", "pattern_drums_lane_tap_01", "drums_lane_tap_01", 60, "drill"),
    exercise("drill_drums_section_switch_01", "Section Switch Drill", "song_form", "pattern_drums_verse_chorus_01", "drums_verse_chorus_01", 80, "drill")
  ];
})();
