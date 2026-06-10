(function() {
  window.SparkUkuleleSkillTree = [
    { id: "uke_orientation", name: "Ukulele Orientation", category: "fundamentals", prerequisites: [] },
    { id: "uke_tuning", name: "Ukulele Tuning", category: "fundamentals", prerequisites: ["uke_orientation"] },
    { id: "uke_c6_sound", name: "Open C6 Sound", category: "fundamentals", prerequisites: ["uke_tuning"] },
    { id: "uke_down_strum", name: "Down Strum", category: "rhythm", prerequisites: ["uke_c6_sound"] },
    { id: "uke_quarter_counting", name: "Quarter Counting", category: "rhythm", prerequisites: ["uke_down_strum"] },
    { id: "uke_c_chord", name: "C Chord", category: "chords", prerequisites: ["uke_down_strum"] },
    { id: "uke_am_chord", name: "Am Chord", category: "chords", prerequisites: ["uke_c_chord"] },
    { id: "uke_f_chord", name: "F Chord", category: "chords", prerequisites: ["uke_am_chord"] },
    { id: "uke_g7_chord", name: "G7 Chord", category: "chords", prerequisites: ["uke_f_chord"] },
    { id: "uke_g_chord", name: "G Chord", category: "chords", prerequisites: ["uke_g7_chord"] },
    { id: "uke_chord_switching", name: "Chord Switching", category: "transitions", prerequisites: ["uke_am_chord", "uke_f_chord"] },
    { id: "uke_four_chord_loop", name: "Four-Chord Loop", category: "progressions", prerequisites: ["uke_chord_switching", "uke_g7_chord"] },
    { id: "uke_eighth_strum", name: "Eighth Strum", category: "rhythm", prerequisites: ["uke_quarter_counting"] },
    { id: "uke_down_up_strum", name: "Down-Up Strum", category: "rhythm", prerequisites: ["uke_eighth_strum"] },
    { id: "uke_island_strum", name: "Island Strum", category: "rhythm", prerequisites: ["uke_down_up_strum", "uke_four_chord_loop"] },
    { id: "uke_chuck", name: "Chuck / Percussive Mute", category: "rhythm", prerequisites: ["uke_down_up_strum"] },
    { id: "uke_fingerpicking", name: "Fingerpicking", category: "picking", prerequisites: ["uke_four_chord_loop"] },
    { id: "uke_c_scale", name: "C Major Scale", category: "lead", prerequisites: ["uke_c_chord"] },
    { id: "uke_melody", name: "Simple Melody", category: "lead", prerequisites: ["uke_c_scale"] },
    { id: "uke_styles", name: "Style Strums", category: "styles", prerequisites: ["uke_island_strum"] },
    { id: "uke_performance_set", name: "Performance Set", category: "performance", prerequisites: ["uke_styles", "uke_fingerpicking"] },
    { id: "uke_two_chord_song", name: "Two-Chord Song", category: "performance", prerequisites: [] },
    { id: "uke_song", name: "Ukulele Song Performance", category: "performance", prerequisites: [] },
    { id: "uke_phrase_retry", name: "Phrase Retry", category: "performance", prerequisites: [] }
  ];
})();
