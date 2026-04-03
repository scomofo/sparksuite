(function() {
  window.SparkUkuleleExercises = {
    down_strum: [
      { id: "uke_down_strum_01", type: "strum", pattern: "D D D D", tempo: 70, durationSec: 90 }
    ],
    basic_chords: [
      { id: "uke_basic_chords_c", type: "chord", chord: "C", durationSec: 90 },
      { id: "uke_basic_chords_am", type: "chord", chord: "Am", durationSec: 90 },
      { id: "uke_basic_chords_f", type: "chord", chord: "F", durationSec: 90 }
    ],
    chord_switching: [
      { id: "uke_switch_c_am", type: "transition", from: "C", to: "Am", durationSec: 120 },
      { id: "uke_switch_am_f", type: "transition", from: "Am", to: "F", durationSec: 120 },
      { id: "uke_switch_f_g", type: "transition", from: "F", to: "G", durationSec: 120 }
    ],
    strumming_patterns: [
      { id: "uke_pattern_island", type: "strum_pattern", pattern: "D DU UDU", tempo: 76, durationSec: 120 }
    ],
    songs: [
      { id: "uke_song_loop_01", type: "song_loop", progression: ["C", "Am", "F", "G"], tempo: 78, durationSec: 180 },
      { id: "uke_song_loop_02", type: "song_loop", progression: ["F", "G", "Em", "Am"], tempo: 74, durationSec: 180 }
    ],
    fingerpicking: [
      { id: "uke_pick_01", type: "fingerpick", pattern: "GCEA", tempo: 72, durationSec: 120 },
      { id: "uke_pick_02", type: "fingerpick", pattern: "AECG", tempo: 68, durationSec: 120 }
    ],
    melody: [
      { id: "uke_melody_01", type: "melody_line", notes: ["C5", "E5", "G5", "A5"], tempo: 72, durationSec: 90 },
      { id: "uke_melody_02", type: "melody_line", notes: ["A4", "C5", "E5", "G5"], tempo: 76, durationSec: 90 }
    ],
    performance: [
      { id: "uke_perform_01", type: "performance_run", progression: ["Am", "F", "C", "G"], tempo: 72, durationSec: 210 },
      { id: "uke_perform_02", type: "performance_run", progression: ["C", "G", "Am", "F"], tempo: 78, durationSec: 210 }
    ]
  };
})();
