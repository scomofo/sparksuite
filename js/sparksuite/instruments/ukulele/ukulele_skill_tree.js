(function() {
  // Skills are grouped by category in display order: fundamentals → rhythm
  // → chords → picking → lead → repertoire → performance. Keep new skills
  // next to their siblings rather than appending at the bottom so the
  // skill-tree UI stays organized.
  window.SparkUkuleleSkillTree = [
    { id: "hold_instrument", category: "fundamentals", label: "Hold Instrument" },
    { id: "tuning", category: "fundamentals", label: "Tuning" },
    { id: "down_strum", category: "rhythm", label: "Down Strum" },
    { id: "up_strum", category: "rhythm", label: "Up Strum" },
    { id: "strumming_patterns", category: "rhythm", label: "Strumming Patterns" },
    // Off-beat accents and reggae-style chops; referenced by uke_10.
    { id: "syncopation", category: "rhythm", label: "Syncopation" },
    { id: "basic_chords", category: "chords", label: "Basic Chords" },
    { id: "chord_switching", category: "chords", label: "Chord Switching" },
    // Advanced chord shapes used by uke_09 (skill) and uke_10 (prereq).
    { id: "barre_chords", category: "chords", label: "Barre Chords" },
    { id: "fingerpicking", category: "picking", label: "Fingerpicking" },
    // Travis-style and rolling arpeggio patterns built on top of fingerpicking;
    // referenced by uke_11.
    { id: "advanced_fingerpick", category: "picking", label: "Advanced Fingerpicking" },
    { id: "scales", category: "lead", label: "Scales" },
    { id: "melody", category: "lead", label: "Melody" },
    { id: "songs", category: "repertoire", label: "Songs" },
    { id: "performance", category: "performance", label: "Performance" },
    // End-of-curriculum capstone — full solo showcase. Used by uke_12.
    { id: "full_performance", category: "performance", label: "Full Performance" }
  ];
})();
