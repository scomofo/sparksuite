(function() {
  window.SparkDrumsSkillTree = [
    { id: "kit_orientation", name: "Kit Orientation", category: "fundamentals", prerequisites: [] },
    { id: "stick_grip", name: "Stick Grip", category: "fundamentals", prerequisites: [] },
    { id: "counting_quarters", name: "Count Quarter Notes", category: "rhythm", prerequisites: [] },
    { id: "single_strokes", name: "Single Strokes", category: "rudiments", prerequisites: ["stick_grip"] },
    { id: "metronome_lock", name: "Metronome Lock", category: "timing", prerequisites: ["counting_quarters"] },
    { id: "kick_control", name: "Kick Control", category: "limb_control", prerequisites: ["counting_quarters"] },
    { id: "snare_backbeat", name: "Snare Backbeat", category: "groove", prerequisites: ["single_strokes"] },
    { id: "hi_hat_eighths", name: "Hi-Hat Eighths", category: "groove", prerequisites: ["metronome_lock"] },
    { id: "basic_backbeat", name: "Basic Backbeat", category: "groove", prerequisites: ["kick_control", "snare_backbeat", "hi_hat_eighths"] },
    { id: "groove_consistency", name: "Groove Consistency", category: "timing", prerequisites: ["basic_backbeat"] },
    { id: "kick_variations", name: "Kick Variations", category: "coordination", prerequisites: ["basic_backbeat"] },
    { id: "hat_variations", name: "Hi-Hat Variations", category: "coordination", prerequisites: ["hi_hat_eighths"] },
    { id: "snare_variations", name: "Snare Variations", category: "coordination", prerequisites: ["snare_backbeat"] },
    { id: "one_bar_fills", name: "One-Bar Fills", category: "fills", prerequisites: ["basic_backbeat"] },
    { id: "crash_transitions", name: "Crash Transitions", category: "fills", prerequisites: ["one_bar_fills"] },
    { id: "song_form", name: "Song Form", category: "performance", prerequisites: ["crash_transitions"] },
    { id: "dynamics_accents", name: "Dynamics and Accents", category: "musicality", prerequisites: ["groove_consistency"] },
    { id: "ghost_notes", name: "Ghost Notes", category: "musicality", prerequisites: ["dynamics_accents"] },
    { id: "sixteenth_notes", name: "Sixteenth Notes", category: "rhythm", prerequisites: ["hi_hat_eighths"] },
    { id: "shuffle_feel", name: "Shuffle Feel", category: "styles", prerequisites: ["basic_backbeat"] },
    { id: "funk_groove_intro", name: "Funk Groove Intro", category: "styles", prerequisites: ["ghost_notes"] },
    { id: "drum_notation", name: "Drum Notation", category: "reading", prerequisites: ["counting_quarters"] },
    { id: "chart_reading", name: "Chart Reading", category: "reading", prerequisites: ["drum_notation", "song_form"] },
    { id: "performance_set", name: "Performance Set", category: "performance", prerequisites: ["chart_reading"] }
  ];
})();
