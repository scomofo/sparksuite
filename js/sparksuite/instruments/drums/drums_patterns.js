(function() {
  function ev(beat, lane, velocity, skill, kind) {
    return { beat: beat, lane: lane, velocity: velocity == null ? 1 : velocity, skillId: skill, kind: kind || "hit" };
  }

  window.SparkDrumsPatterns = {
    pattern_drums_lane_tap_01: {
      id: "pattern_drums_lane_tap_01",
      title: "Lane Tap",
      totalBeats: 8,
      events: [ev(0, "kick", 1, "kit_orientation"), ev(1, "snare", 1, "kit_orientation"), ev(2, "hi_hat_closed", 0.9, "kit_orientation"), ev(3, "crash", 1, "kit_orientation", "crash")]
    },
    pattern_drums_quarter_tap_01: {
      id: "pattern_drums_quarter_tap_01",
      title: "Quarter Taps",
      totalBeats: 8,
      events: [ev(0, "hi_hat_closed", 0.9, "counting_quarters"), ev(1, "hi_hat_closed", 0.8, "counting_quarters"), ev(2, "hi_hat_closed", 0.9, "counting_quarters"), ev(3, "hi_hat_closed", 0.8, "counting_quarters")]
    },
    pattern_drums_hat_eighths_01: {
      id: "pattern_drums_hat_eighths_01",
      title: "Hi-Hat Eighths",
      totalBeats: 8,
      events: [ev(0, "hi_hat_closed", 0.9, "hi_hat_eighths"), ev(0.5, "hi_hat_closed", 0.65, "hi_hat_eighths"), ev(1, "hi_hat_closed", 0.8, "hi_hat_eighths"), ev(1.5, "hi_hat_closed", 0.65, "hi_hat_eighths"), ev(2, "hi_hat_closed", 0.9, "hi_hat_eighths"), ev(2.5, "hi_hat_closed", 0.65, "hi_hat_eighths"), ev(3, "hi_hat_closed", 0.8, "hi_hat_eighths"), ev(3.5, "hi_hat_closed", 0.65, "hi_hat_eighths")]
    },
    pattern_drums_single_stroke_01: {
      id: "pattern_drums_single_stroke_01",
      title: "RLRL Singles",
      totalBeats: 8,
      events: [ev(0, "snare", 1, "single_strokes", "R"), ev(0.5, "snare", 0.85, "single_strokes", "L"), ev(1, "snare", 1, "single_strokes", "R"), ev(1.5, "snare", 0.85, "single_strokes", "L"), ev(2, "snare", 1, "single_strokes", "R"), ev(2.5, "snare", 0.85, "single_strokes", "L"), ev(3, "snare", 1, "single_strokes", "R"), ev(3.5, "snare", 0.85, "single_strokes", "L")]
    },
    pattern_drums_kick_beat_1_01: {
      id: "pattern_drums_kick_beat_1_01",
      title: "Kick on One",
      totalBeats: 8,
      events: [ev(0, "kick", 1, "kick_control"), ev(0, "hi_hat_closed", 0.75, "kick_control"), ev(1, "hi_hat_closed", 0.6, "kick_control"), ev(2, "hi_hat_closed", 0.75, "kick_control"), ev(3, "hi_hat_closed", 0.6, "kick_control")]
    },
    pattern_drums_kick_1_3_01: {
      id: "pattern_drums_kick_1_3_01",
      title: "Kick One and Three",
      totalBeats: 8,
      events: [ev(0, "kick", 1, "kick_control"), ev(0, "hi_hat_closed", 0.75, "kick_control"), ev(1, "hi_hat_closed", 0.6, "kick_control"), ev(2, "kick", 1, "kick_control"), ev(2, "hi_hat_closed", 0.75, "kick_control"), ev(3, "hi_hat_closed", 0.6, "kick_control")]
    },
    pattern_drums_snare_2_4_01: {
      id: "pattern_drums_snare_2_4_01",
      title: "Snare Two and Four",
      totalBeats: 8,
      events: [ev(0, "hi_hat_closed", 0.75, "snare_backbeat"), ev(1, "snare", 1, "snare_backbeat"), ev(1, "hi_hat_closed", 0.65, "snare_backbeat"), ev(2, "hi_hat_closed", 0.75, "snare_backbeat"), ev(3, "snare", 1, "snare_backbeat"), ev(3, "hi_hat_closed", 0.65, "snare_backbeat")]
    },
    pattern_drums_basic_backbeat_01: {
      id: "pattern_drums_basic_backbeat_01",
      title: "Basic Backbeat",
      totalBeats: 16,
      events: [ev(0, "kick", 1, "basic_backbeat"), ev(0, "hi_hat_closed", 0.75, "basic_backbeat"), ev(0.5, "hi_hat_closed", 0.55, "basic_backbeat"), ev(1, "snare", 1, "basic_backbeat"), ev(1, "hi_hat_closed", 0.75, "basic_backbeat"), ev(1.5, "hi_hat_closed", 0.55, "basic_backbeat"), ev(2, "kick", 1, "basic_backbeat"), ev(2, "hi_hat_closed", 0.75, "basic_backbeat"), ev(2.5, "hi_hat_closed", 0.55, "basic_backbeat"), ev(3, "snare", 1, "basic_backbeat"), ev(3, "hi_hat_closed", 0.75, "basic_backbeat"), ev(3.5, "hi_hat_closed", 0.55, "basic_backbeat")]
    },
    pattern_drums_fill_quarters_01: {
      id: "pattern_drums_fill_quarters_01",
      title: "Quarter Fill to Crash",
      totalBeats: 8,
      events: [ev(0, "snare", 0.8, "one_bar_fills"), ev(1, "tom_high", 0.85, "one_bar_fills"), ev(2, "tom_mid", 0.9, "one_bar_fills"), ev(3, "tom_low", 1, "one_bar_fills"), ev(4, "crash", 1, "crash_transitions", "crash"), ev(4, "kick", 1, "crash_transitions")]
    },
    pattern_drums_crash_entry_01: {
      id: "pattern_drums_crash_entry_01",
      title: "Crash Entry",
      totalBeats: 8,
      events: [ev(0, "crash", 1, "crash_transitions", "crash"), ev(0, "kick", 1, "crash_transitions"), ev(1, "hi_hat_closed", 0.65, "crash_transitions"), ev(2, "snare", 1, "crash_transitions"), ev(2, "hi_hat_closed", 0.75, "crash_transitions"), ev(3, "hi_hat_closed", 0.65, "crash_transitions")]
    },
    pattern_drums_kick_variation_a_01: {
      id: "pattern_drums_kick_variation_a_01",
      title: "Kick Variation A",
      totalBeats: 16,
      events: [ev(0, "kick", 1, "kick_variations"), ev(0, "hi_hat_closed", 0.75, "kick_variations"), ev(0.5, "kick", 0.85, "kick_variations"), ev(1, "snare", 1, "kick_variations"), ev(1, "hi_hat_closed", 0.75, "kick_variations"), ev(2, "kick", 1, "kick_variations"), ev(2, "hi_hat_closed", 0.75, "kick_variations"), ev(3, "snare", 1, "kick_variations"), ev(3, "hi_hat_closed", 0.75, "kick_variations")]
    },
    pattern_drums_offbeat_kick_01: {
      id: "pattern_drums_offbeat_kick_01",
      title: "Offbeat Kick",
      totalBeats: 16,
      events: [ev(0, "hi_hat_closed", 0.75, "kick_variations"), ev(0.5, "kick", 0.95, "kick_variations"), ev(1, "snare", 1, "kick_variations"), ev(1.5, "hi_hat_closed", 0.65, "kick_variations"), ev(2, "kick", 1, "kick_variations"), ev(2.5, "hi_hat_closed", 0.65, "kick_variations"), ev(3, "snare", 1, "kick_variations"), ev(3.5, "kick", 0.9, "kick_variations")]
    },
    pattern_drums_open_hat_4and_01: {
      id: "pattern_drums_open_hat_4and_01",
      title: "Open Hat on Four-And",
      totalBeats: 8,
      events: [ev(0, "kick", 1, "hat_variations"), ev(0, "hi_hat_closed", 0.75, "hat_variations"), ev(1, "snare", 1, "hat_variations"), ev(1, "hi_hat_closed", 0.75, "hat_variations"), ev(2, "kick", 1, "hat_variations"), ev(2, "hi_hat_closed", 0.75, "hat_variations"), ev(3, "snare", 1, "hat_variations"), ev(3.5, "hi_hat_open", 0.95, "hat_variations")]
    },
    pattern_drums_verse_chorus_01: {
      id: "pattern_drums_verse_chorus_01",
      title: "Verse Chorus Form",
      totalBeats: 24,
      events: [ev(0, "kick", 1, "song_form"), ev(0, "hi_hat_closed", 0.7, "song_form"), ev(1, "snare", 1, "song_form"), ev(1.5, "hi_hat_closed", 0.55, "song_form"), ev(2, "kick", 1, "song_form"), ev(3, "snare", 1, "song_form"), ev(4, "crash", 1, "song_form", "crash"), ev(4, "kick", 1, "song_form"), ev(5, "snare", 1, "song_form"), ev(6, "kick", 1, "song_form"), ev(6.5, "kick", 0.8, "song_form"), ev(7, "snare", 1, "song_form")]
    }
  };
})();
