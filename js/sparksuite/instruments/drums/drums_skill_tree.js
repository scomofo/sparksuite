(function() {
  window.SparkDrumsSkillTree = [
    { id: "kit_orientation", name: "Kit Orientation", category: "foundations", prerequisites: [] },
    { id: "counting_quarters", name: "Count Quarter Notes", category: "foundations", prerequisites: ["kit_orientation"] },
    { id: "lane_identification", name: "Lane Identification", category: "foundations", prerequisites: ["kit_orientation"] },
    { id: "stick_grip", name: "Stick Grip", category: "technique", prerequisites: ["kit_orientation"] },
    { id: "single_strokes", name: "Single Strokes", category: "rudiments", prerequisites: ["stick_grip", "counting_quarters"] },
    { id: "metronome_lock", name: "Metronome Lock", category: "timing", prerequisites: ["counting_quarters"] },
    { id: "kick_control", name: "Kick Control", category: "coordination", prerequisites: ["counting_quarters"] },
    { id: "snare_backbeat", name: "Snare Backbeat", category: "groove", prerequisites: ["single_strokes", "metronome_lock"] },
    { id: "basic_backbeat", name: "Basic Backbeat", category: "groove", prerequisites: ["kick_control", "snare_backbeat"] },
    { id: "hi_hat_eighths", name: "Hi-Hat Eighths", category: "groove", prerequisites: ["basic_backbeat"] },
    { id: "groove_consistency", name: "Groove Consistency", category: "timing", prerequisites: ["basic_backbeat"] },
    { id: "one_bar_fills", name: "One-Bar Fills", category: "fills", prerequisites: ["basic_backbeat"] },
    { id: "crash_transitions", name: "Crash Transitions", category: "fills", prerequisites: ["one_bar_fills"] },
    { id: "kick_variations", name: "Kick Variations", category: "coordination", prerequisites: ["basic_backbeat"] },
    { id: "hat_variations", name: "Hat Variations", category: "coordination", prerequisites: ["hi_hat_eighths"] },
    { id: "dynamics_accents", name: "Dynamics and Accents", category: "expression", prerequisites: ["single_strokes"] },
    { id: "drum_notation", name: "Drum Notation", category: "reading", prerequisites: ["counting_quarters"] },
    { id: "song_form", name: "Song Form", category: "performance", prerequisites: ["basic_backbeat"] },
    { id: "performance_set", name: "Performance Set", category: "performance", prerequisites: ["song_form", "crash_transitions"] },
    { id: "shuffle_feel", name: "Shuffle Feel", category: "styles", prerequisites: ["hi_hat_eighths"] },
    { id: "funk_groove_intro", name: "Funk Groove Intro", category: "styles", prerequisites: ["kick_variations", "hat_variations"] }
  ];
})();
