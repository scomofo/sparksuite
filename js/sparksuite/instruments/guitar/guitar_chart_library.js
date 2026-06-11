(function() {
  // Power-chord chart kept on its original gtr_* skill IDs because it's
  // referenced by the legacy ChordSpark gameplay flow. New curriculum
  // skills are mapped to dedicated authored charts or clones below so
  // mastery accrues to the per-skill chart id rather than the source
  // chart's skill.
  var CHARTS = {
    power_chords_01: {
      id: "power_chords_01",
      title: "Power Chords 01",
      bpm: 92,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1,  label: "G5", skillId: "gtr_green_root" },
        { beat: 1,  laneMask: 1,  label: "G5", skillId: "gtr_green_root" },
        { beat: 2,  laneMask: 3,  label: "A5", skillId: "gtr_two_note_power_chords", flags: { specialPhrase: true } },
        { beat: 3,  laneMask: 3,  label: "A5", skillId: "gtr_two_note_power_chords", flags: { specialPhrase: true } },
        { beat: 4,  laneMask: 1,  label: "G5", skillId: "gtr_green_root" },
        { beat: 5,  laneMask: 5,  label: "B5", skillId: "gtr_three_fret_reach" },
        { beat: 6,  laneMask: 3,  label: "A5", skillId: "gtr_two_note_power_chords" },
        { beat: 7,  laneMask: 1,  label: "G5", skillId: "gtr_green_root" },
        { beat: 8,  laneMask: 9,  label: "C5", skillId: "gtr_alt_strum_basic", flags: { specialPhrase: true } },
        { beat: 9,  laneMask: 9,  label: "C5", skillId: "gtr_alt_strum_basic", flags: { specialPhrase: true } },
        { beat: 10, laneMask: 3,  label: "A5", skillId: "gtr_two_note_power_chords" },
        { beat: 11, laneMask: 1,  label: "G5", skillId: "gtr_green_root" },
        { beat: 12, laneMask: 17, label: "D5", skillId: "gtr_orange_reach" },
        { beat: 13, laneMask: 17, label: "D5", skillId: "gtr_orange_reach" },
        { beat: 14, laneMask: 9,  label: "C5", skillId: "gtr_alt_strum_basic" },
        { beat: 15, laneMask: 1,  label: "G5", skillId: "gtr_green_root" }
      ],
      phrases: [
        { id: 0, name: "Phrase 1", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Phrase 2", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_open_strums_01: {
      id: "gtr_open_strums_01",
      title: "Open Strums 01",
      bpm: 72,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 1, label: "Em", skillId: "pick_downstrokes", flags: { open: true } },
        { beat: 1, laneMask: 1, label: "Em", skillId: "pick_downstrokes" },
        { beat: 2, laneMask: 1, label: "Em", skillId: "pick_downstrokes" },
        { beat: 3, laneMask: 1, label: "Em", skillId: "pick_downstrokes" },
        { beat: 4, laneMask: 2, label: "G",  skillId: "pick_downstrokes" },
        { beat: 5, laneMask: 2, label: "G",  skillId: "pick_downstrokes" },
        { beat: 6, laneMask: 2, label: "G",  skillId: "pick_downstrokes" },
        { beat: 7, laneMask: 2, label: "G",  skillId: "pick_downstrokes", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Open Loop", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    },
    gtr_chord_switch_01: {
      id: "gtr_chord_switch_01",
      title: "Chord Switch 01",
      bpm: 76,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 4, label: "C",  skillId: "open_chord_switching" },
        { beat: 2,  laneMask: 2, label: "G",  skillId: "open_chord_switching" },
        { beat: 4,  laneMask: 8, label: "D",  skillId: "open_chord_switching" },
        { beat: 6,  laneMask: 1, label: "Am", skillId: "open_chord_switching", flags: { forced: true } },
        { beat: 8,  laneMask: 4, label: "C",  skillId: "open_chord_switching" },
        { beat: 10, laneMask: 2, label: "G",  skillId: "open_chord_switching" },
        { beat: 12, laneMask: 8, label: "D",  skillId: "open_chord_switching" },
        { beat: 14, laneMask: 1, label: "Am", skillId: "open_chord_switching", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Switch A", startBeat: 0, endBeat: 8,  flags: {} },
        { id: 1, name: "Switch B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_eighth_strum_01: {
      id: "gtr_eighth_strum_01",
      title: "Eighth Strum 01",
      bpm: 84,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 4, label: "C",  skillId: "eighth_strumming" },
        { beat: 1, laneMask: 4, label: "C",  skillId: "eighth_strumming", flags: { tap: true } },
        { beat: 2, laneMask: 2, label: "G",  skillId: "eighth_strumming" },
        { beat: 3, laneMask: 2, label: "G",  skillId: "eighth_strumming", flags: { tap: true } },
        { beat: 4, laneMask: 8, label: "D",  skillId: "eighth_strumming" },
        { beat: 5, laneMask: 8, label: "D",  skillId: "eighth_strumming", flags: { tap: true } },
        { beat: 6, laneMask: 1, label: "Am", skillId: "eighth_strumming", flags: { specialPhrase: true } },
        { beat: 7, laneMask: 1, label: "Am", skillId: "eighth_strumming", flags: { tap: true, specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Pattern A", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    },
    gtr_arpeggio_pima_01: {
      id: "gtr_arpeggio_pima_01",
      title: "PIMA Arpeggio 01",
      bpm: 70,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 1, label: "P", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 1, laneMask: 2, label: "I", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 2, laneMask: 4, label: "M", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 3, laneMask: 8, label: "A", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 4, laneMask: 4, label: "M", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 5, laneMask: 2, label: "I", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 6, laneMask: 1, label: "P", skillId: "fingerstyle_pima", flags: { tap: true } },
        { beat: 7, laneMask: 2, label: "I", skillId: "fingerstyle_pima", flags: { specialPhrase: true, tap: true } }
      ],
      phrases: [
        { id: 0, name: "Arpeggio", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    },
    gtr_pentatonic_run_01: {
      id: "gtr_pentatonic_run_01",
      title: "Minor Pentatonic Run 01",
      bpm: 80,
      enginePreset: "spark_balanced",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1,  label: "A", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 1,  laneMask: 2,  label: "C", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 2,  laneMask: 4,  label: "D", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 3,  laneMask: 8,  label: "E", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 4,  laneMask: 16, label: "G", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 5,  laneMask: 8,  label: "E", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 6,  laneMask: 4,  label: "D", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 7,  laneMask: 2,  label: "C", skillId: "minor_pentatonic", flags: { specialPhrase: true, tap: true } },
        { beat: 8,  laneMask: 1,  label: "A", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 9,  laneMask: 2,  label: "C", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 10, laneMask: 4,  label: "D", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 11, laneMask: 8,  label: "E", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 12, laneMask: 16, label: "G", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 13, laneMask: 16, label: "G", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 14, laneMask: 8,  label: "E", skillId: "minor_pentatonic", flags: { tap: true } },
        { beat: 15, laneMask: 1,  label: "A", skillId: "minor_pentatonic", flags: { specialPhrase: true, tap: true } }
      ],
      phrases: [
        { id: 0, name: "Run A", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Run B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_power_chord_move_01: {
      id: "gtr_power_chord_move_01",
      title: "Power Chord Move 01",
      bpm: 96,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 5,  label: "G5", skillId: "power_chords" },
        { beat: 1,  laneMask: 5,  label: "G5", skillId: "power_chords" },
        { beat: 2,  laneMask: 6,  label: "A5", skillId: "power_chords" },
        { beat: 3,  laneMask: 6,  label: "A5", skillId: "power_chords" },
        { beat: 4,  laneMask: 12, label: "B5", skillId: "power_chords" },
        { beat: 5,  laneMask: 12, label: "B5", skillId: "power_chords" },
        { beat: 6,  laneMask: 20, label: "C5", skillId: "power_chords", flags: { specialPhrase: true } },
        { beat: 7,  laneMask: 24, label: "D5", skillId: "power_chords", flags: { specialPhrase: true } },
        { beat: 8,  laneMask: 5,  label: "G5", skillId: "power_chords" },
        { beat: 9,  laneMask: 20, label: "C5", skillId: "power_chords" },
        { beat: 10, laneMask: 6,  label: "A5", skillId: "power_chords" },
        { beat: 11, laneMask: 24, label: "D5", skillId: "power_chords" },
        { beat: 12, laneMask: 12, label: "B5", skillId: "power_chords", flags: { specialPhrase: true } },
        { beat: 13, laneMask: 3,  label: "E5", skillId: "power_chords", flags: { specialPhrase: true } },
        { beat: 14, laneMask: 6,  label: "A5", skillId: "power_chords" },
        { beat: 15, laneMask: 5,  label: "G5", skillId: "power_chords" }
      ],
      phrases: [
        { id: 0, name: "Ladder Up", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Jump Back", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_barre_intro_01: {
      id: "gtr_barre_intro_01",
      title: "Barre Intro 01",
      bpm: 88,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 7,  lengthBeats: 2, label: "F",   skillId: "barre_intro", flags: { sustain: true } },
        { beat: 2,  laneMask: 1,  lengthBeats: 0, label: "Em",  skillId: "barre_intro", flags: { open: true } },
        { beat: 4,  laneMask: 14, lengthBeats: 2, label: "Bm",  skillId: "barre_intro", flags: { sustain: true } },
        { beat: 6,  laneMask: 2,  lengthBeats: 0, label: "Am",  skillId: "barre_intro", flags: { open: true } },
        { beat: 8,  laneMask: 15, lengthBeats: 2, label: "F#m", skillId: "barre_intro", flags: { sustain: true, specialPhrase: true } },
        { beat: 10, laneMask: 28, lengthBeats: 2, label: "B",   skillId: "barre_intro", flags: { sustain: true, specialPhrase: true } },
        { beat: 12, laneMask: 1,  lengthBeats: 0, label: "Em",  skillId: "barre_intro", flags: { open: true } },
        { beat: 14, laneMask: 7,  lengthBeats: 2, label: "F",   skillId: "barre_intro", flags: { sustain: true } }
      ],
      phrases: [
        { id: 0, name: "Plant and Rest", startBeat: 0, endBeat: 8,  flags: {} },
        { id: 1, name: "Barre Stamina",  startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_caged_intro_01: {
      id: "gtr_caged_intro_01",
      title: "CAGED Intro 01",
      bpm: 90,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 1,  label: "C (C)", skillId: "caged_intro" },
        { beat: 1,  laneMask: 1,  label: "C (C)", skillId: "caged_intro" },
        { beat: 2,  laneMask: 2,  label: "C (A)", skillId: "caged_intro" },
        { beat: 3,  laneMask: 2,  label: "C (A)", skillId: "caged_intro" },
        { beat: 4,  laneMask: 4,  label: "C (G)", skillId: "caged_intro" },
        { beat: 5,  laneMask: 4,  label: "C (G)", skillId: "caged_intro" },
        { beat: 6,  laneMask: 8,  label: "C (E)", skillId: "caged_intro" },
        { beat: 7,  laneMask: 8,  label: "C (E)", skillId: "caged_intro" },
        { beat: 8,  laneMask: 16, label: "C (D)", skillId: "caged_intro", flags: { specialPhrase: true } },
        { beat: 9,  laneMask: 16, label: "C (D)", skillId: "caged_intro", flags: { specialPhrase: true } },
        { beat: 10, laneMask: 8,  label: "C (E)", skillId: "caged_intro" },
        { beat: 11, laneMask: 8,  label: "C (E)", skillId: "caged_intro" },
        { beat: 12, laneMask: 4,  label: "C (G)", skillId: "caged_intro" },
        { beat: 13, laneMask: 4,  label: "C (G)", skillId: "caged_intro" },
        { beat: 14, laneMask: 2,  label: "C (A)", skillId: "caged_intro" },
        { beat: 15, laneMask: 1,  label: "C (C)", skillId: "caged_intro", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Ascent", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Return", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_triads_intro_01: {
      id: "gtr_triads_intro_01",
      title: "Triads Intro 01",
      bpm: 92,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 7,  label: "C",    skillId: "triads_intro" },
        { beat: 1,  laneMask: 7,  label: "C",    skillId: "triads_intro" },
        { beat: 2,  laneMask: 7,  label: "F",    skillId: "triads_intro" },
        { beat: 3,  laneMask: 7,  label: "F",    skillId: "triads_intro" },
        { beat: 4,  laneMask: 14, label: "G",    skillId: "triads_intro" },
        { beat: 5,  laneMask: 14, label: "G",    skillId: "triads_intro" },
        { beat: 6,  laneMask: 7,  label: "Am",   skillId: "triads_intro" },
        { beat: 7,  laneMask: 7,  label: "Am",   skillId: "triads_intro", flags: { specialPhrase: true } },
        { beat: 8,  laneMask: 14, label: "C/E",  skillId: "triads_intro" },
        { beat: 9,  laneMask: 14, label: "C/E",  skillId: "triads_intro" },
        { beat: 10, laneMask: 14, label: "F/A",  skillId: "triads_intro" },
        { beat: 11, laneMask: 14, label: "F/A",  skillId: "triads_intro" },
        { beat: 12, laneMask: 28, label: "G/B",  skillId: "triads_intro" },
        { beat: 13, laneMask: 28, label: "G/B",  skillId: "triads_intro" },
        { beat: 14, laneMask: 14, label: "Am/C", skillId: "triads_intro" },
        { beat: 15, laneMask: 14, label: "Am/C", skillId: "triads_intro", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Root Shapes", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Inversions",  startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    },
    gtr_stage_flow_01: {
      id: "gtr_stage_flow_01",
      title: "Stage Flow 01",
      bpm: 92,
      enginePreset: "spark_challenge",
      totalBeats: 16,
      notes: [
        { beat: 0,  laneMask: 4, label: "C",  skillId: "performance_set" },
        { beat: 1,  laneMask: 4, label: "C",  skillId: "performance_set", flags: { tap: true } },
        { beat: 2,  laneMask: 2, label: "G",  skillId: "performance_set" },
        { beat: 3,  laneMask: 8, label: "D",  skillId: "performance_set", flags: { forced: true } },
        { beat: 4,  laneMask: 1, label: "Am", skillId: "performance_set" },
        { beat: 5,  laneMask: 2, label: "G",  skillId: "performance_set", flags: { tap: true } },
        { beat: 6,  laneMask: 4, label: "C",  skillId: "performance_set" },
        { beat: 7,  laneMask: 8, label: "D",  skillId: "performance_set", flags: { specialPhrase: true } },
        { beat: 8,  laneMask: 1, label: "Am", skillId: "performance_set" },
        { beat: 9,  laneMask: 2, label: "G",  skillId: "performance_set", flags: { tap: true } },
        { beat: 10, laneMask: 4, label: "C",  skillId: "performance_set" },
        { beat: 11, laneMask: 8, label: "D",  skillId: "performance_set", flags: { forced: true } },
        { beat: 12, laneMask: 1, label: "Am", skillId: "performance_set" },
        { beat: 13, laneMask: 2, label: "G",  skillId: "performance_set", flags: { tap: true } },
        { beat: 14, laneMask: 4, label: "C",  skillId: "performance_set" },
        { beat: 15, laneMask: 8, label: "D",  skillId: "performance_set", flags: { specialPhrase: true } }
      ],
      phrases: [
        { id: 0, name: "Stage A", startBeat: 0, endBeat: 8,  flags: { special: true } },
        { id: 1, name: "Stage B", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    }
  };

  function cloneChartWithSkill(srcId, newId, newTitle, newSkillId, bpmOverride) {
    var src = CHARTS[srcId];
    if (!src) return;
    CHARTS[newId] = {
      id: newId,
      title: newTitle,
      bpm: typeof bpmOverride === "number" ? bpmOverride : src.bpm,
      enginePreset: src.enginePreset,
      totalBeats: src.totalBeats,
      notes: src.notes.map(function(n) {
        var copy = {};
        for (var k in n) if (Object.prototype.hasOwnProperty.call(n, k)) copy[k] = n[k];
        copy.skillId = newSkillId;
        return copy;
      }),
      phrases: src.phrases.slice()
    };
  }

  // Foundations
  cloneChartWithSkill("gtr_open_strums_01", "gtr_orientation_01",      "Orientation Pulse 01", "guitar_orientation", 60);
  cloneChartWithSkill("gtr_open_strums_01", "gtr_tuning_check_01",     "Tuning Check 01",       "guitar_tuning",      60);
  cloneChartWithSkill("gtr_open_strums_01", "gtr_open_strings_01",     "Open Strings 01",       "open_strings",       66);
  cloneChartWithSkill("gtr_open_strums_01", "gtr_quarter_count_01",    "Quarter Count 01",      "quarter_counting",   68);
  cloneChartWithSkill("gtr_open_strums_01", "gtr_first_riff_01",       "First Riff 01",         "first_riff",         72);

  // Open chords
  cloneChartWithSkill("gtr_open_strums_01", "gtr_em_chord_pulse_01",   "Em Chord Pulse 01",     "em_chord");
  cloneChartWithSkill("gtr_open_strums_01", "gtr_g_chord_pulse_01",    "G Chord Pulse 01",      "g_chord");
  cloneChartWithSkill("gtr_open_strums_01", "gtr_c_chord_pulse_01",    "C Chord Pulse 01",      "c_chord");
  cloneChartWithSkill("gtr_open_strums_01", "gtr_d_chord_pulse_01",    "D Chord Pulse 01",      "d_chord");
  cloneChartWithSkill("gtr_open_strums_01", "gtr_am_chord_pulse_01",   "Am Chord Pulse 01",     "am_chord");
  cloneChartWithSkill("gtr_open_strums_01", "gtr_e_a_chords_01",       "E and A Chords 01",     "e_a_chords",         74);

  // Switching / progression
  cloneChartWithSkill("gtr_chord_switch_01", "gtr_four_chord_loop_01", "Four-Chord Loop 01",    "four_chord_loop",    80);

  // Strumming
  cloneChartWithSkill("gtr_eighth_strum_01", "gtr_down_up_strum_01",   "Down-Up Strum 01",      "down_up_strumming",  82);
  cloneChartWithSkill("gtr_eighth_strum_01", "gtr_mute_strum_01",      "Muted Strum 01",        "muted_strumming",    78);
  cloneChartWithSkill("gtr_eighth_strum_01", "gtr_syncopation_intro_01", "Syncopation Intro 01","syncopation_intro",  86);

  // Performance / songs
  cloneChartWithSkill("gtr_chord_switch_01", "gtr_two_chord_song_01",  "Two-Chord Song 01",     "two_chord_song",     74);
  cloneChartWithSkill("gtr_stage_flow_01",   "gtr_four_chord_song_01", "Four-Chord Song 01",    "four_chord_song",    86);
  cloneChartWithSkill("gtr_stage_flow_01",   "gtr_phrase_retry_01",    "Phrase Retry 01",       "song_phrase_retry",  84);
  cloneChartWithSkill("gtr_stage_flow_01",   "gtr_song_full_easy_01",  "Song Full Easy 01",     "song_performance",   90);

  // Lead / fretboard (power-chord, barre, CAGED and triad skills use the
  // authored gtr_* charts defined in CHARTS above)
  cloneChartWithSkill("gtr_pentatonic_run_01", "gtr_single_note_timing_01", "Single-Note Timing 01", "single_note_timing", 78);
  cloneChartWithSkill("gtr_pentatonic_run_01", "gtr_bend_slide_intro_01",   "Bend & Slide Intro 01", "bend_slide_intro",   76);

  window.SparkGuitarChartLibrary = {
    getChartDefinition: function(chartId) {
      return CHARTS[chartId] || CHARTS.gtr_open_strums_01;
    },
    getAll: function() {
      return CHARTS;
    }
  };
})();
