(function(root) {
  "use strict";

  var pack = {
    module_id: "uke_foundations_pack_01",
    title: "Ukulele Foundations - Stability, Changes, Melody",
    instrument: "ukulele",
    difficulty: "beginner",
    estimated_total_time_min: 36,
    sets: ["set_a_strum", "set_b_changes", "set_c_melody"],
    design_principles: [
      "sessions <= 3 min chunks",
      "visible progress per loop",
      "no scrolling during play",
      "one job per block",
      "recordable outputs"
    ],
    curriculum_sets: [
      {
        set_id: "set_a_strum",
        title: "Strum Stability",
        bpm: { start: 65, target: 80 },
        blocks: [
          {
            block_id: "strum_pattern_loop",
            type: "pattern",
            duration_sec: 120,
            pattern: "D D U U D U",
            count: "1 2 & & 4 &",
            chords: ["Am", "G", "C", "F"],
            loop: true,
            goal: "continuous right-hand motion",
            success_metric: { timing_stability: 0.85 },
            progression_hook: { skill: "uke_island_strum", metric: "timing_stability" }
          },
          {
            block_id: "riptide_loop",
            type: "song_loop",
            duration_sec: 240,
            chords: ["Am", "G", "C", "F"],
            pattern: "D D U U D U",
            goal: "no pause during chord transitions",
            success_metric: { tempo_drift: "<5%" },
            progression_hook: { skill: "uke_chord_switching", metric: "tempo_drift" }
          },
          {
            block_id: "im_yours_loop",
            type: "song_loop",
            duration_sec: 240,
            chords: ["C", "G", "Am", "F"],
            pattern: "D D U U D U",
            goal: "identical strum feel across chords",
            progression_hook: { skill: "uke_four_chord_loop", metric: "timing_stability" }
          },
          {
            block_id: "tap_upgrade",
            type: "technique",
            duration_sec: 60,
            pattern: "D (tap) U U D U",
            goal: "add percussive timing anchor",
            progression_hook: { skill: "uke_chuck", metric: "dynamic_consistency" }
          },
          {
            block_id: "record",
            type: "record",
            duration_sec: 60,
            instructions: "30s Riptide + 30s I'm Yours",
            output: "audio_clip"
          }
        ]
      },
      {
        set_id: "set_b_changes",
        title: "Smooth Changes",
        bpm: { start: 60, target: 72 },
        blocks: [
          {
            block_id: "change_drill",
            type: "transition_loop",
            duration_sec: 120,
            pairs: [["C", "G"], ["G", "Am"], ["Am", "F"]],
            beats_per_chord: 4,
            goal: "minimize finger lift distance",
            success_metric: { transition_cleanliness: 0.9 },
            progression_hook: { skill: "uke_chord_switching", metric: "transition_cleanliness" }
          },
          {
            block_id: "falling_loop",
            type: "song_loop",
            duration_sec: 240,
            chords: ["C", "Em", "Am", "F", "C", "G", "C"],
            goal: "land chord exactly on beat 1",
            progression_hook: { skill: "uke_song", metric: "transition_cleanliness" }
          },
          {
            block_id: "stand_by_me_loop",
            type: "song_loop",
            duration_sec: 240,
            chords: ["C", "Am", "F", "G"],
            goal: "consistent timing across loop",
            progression_hook: { skill: "uke_four_chord_loop", metric: "tempo_drift" }
          },
          {
            block_id: "walk_in",
            type: "technique",
            duration_sec: 60,
            instruction: "add note before G chord (F# -> G)",
            goal: "smooth entry into chord",
            progression_hook: { skill: "uke_melody", metric: "note_clarity" }
          },
          {
            block_id: "record",
            type: "record",
            duration_sec: 60,
            instructions: "30s per song",
            output: "audio_clip"
          }
        ]
      },
      {
        set_id: "set_c_melody",
        title: "Melody & Touch",
        bpm: { start: 55, target: 65 },
        blocks: [
          {
            block_id: "picking_pattern",
            type: "pattern",
            duration_sec: 120,
            pattern: ["T", "I", "M", "R"],
            strings: ["G", "C", "E", "A"],
            goal: "consistent finger volume",
            progression_hook: { skill: "uke_fingerpicking", metric: "dynamic_consistency" }
          },
          {
            block_id: "rainbow_motif",
            type: "melody_loop",
            duration_sec: 240,
            notes: [{ string: "A", fret: 3 }, { string: "A", fret: 5 }, { string: "A", fret: 7 }],
            goal: "clean sustained notes",
            progression_hook: { skill: "uke_melody", metric: "note_clarity" }
          },
          {
            block_id: "lava_motif",
            type: "melody_loop",
            duration_sec: 240,
            notes: [{ string: "A", fret: 3 }, { string: "A", fret: 3 }, { string: "A", fret: 5 }, { string: "A", fret: 3 }],
            goal: "natural melody phrasing",
            progression_hook: { skill: "uke_melody", metric: "dynamic_consistency" }
          },
          {
            block_id: "roll_technique",
            type: "technique",
            duration_sec: 60,
            pattern: ["I", "M", "R"],
            goal: "light pre-note flourish",
            progression_hook: { skill: "uke_fingerpicking", metric: "note_clarity" }
          },
          {
            block_id: "record",
            type: "record",
            duration_sec: 60,
            instructions: "play both motifs",
            output: "audio_clip"
          }
        ]
      }
    ],
    metrics: {
      timing_stability: "std_dev(beat_alignment)",
      tempo_drift: "bpm_variance_over_time",
      transition_cleanliness: "gap_duration_between_chords",
      note_clarity: "signal_noise_ratio",
      dynamic_consistency: "velocity_variance"
    },
    session_rules: {
      max_block_time_sec: 240,
      auto_advance_if: { success_score: ">0.85" },
      repeat_if: { success_score: "<0.65" },
      nudge_prompts: ["slow down", "keep hand moving", "lighter touch", "earlier chord prep"]
    },
    next_layer_recommendations: [
      "real-time timing overlay",
      "chord transition heatmap",
      "confidence over perfection scoring",
      "adaptive BPM"
    ]
  };

  root.SparkUkuleleFoundationsPack = pack;
  root.SparkUkuleleCurriculumPackSpecs = (root.SparkUkuleleCurriculumPackSpecs || []).concat([pack]);

  if (typeof module !== "undefined" && module.exports) module.exports = pack;
})(typeof window !== "undefined" ? window : globalThis);
