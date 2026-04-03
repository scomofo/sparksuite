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
      { id: "uke_song_loop_01", type: "song_loop", progression: ["C", "Am", "F", "G"], tempo: 78, durationSec: 180 }
    ],
    fingerpicking: [
      { id: "uke_pick_01", type: "fingerpick", pattern: "GCEA", tempo: 72, durationSec: 120 }
    ]
  };
})();
