(function() {
  window.SparkUkuleleLessons = [
    {
      id: "uke_01",
      num: 1,
      title: "First Strum",
      skill: "down_strum",
      prerequisites: [],
      masteryRequired: 0.7,
      desc: "Lock in steady down-strums on open strings."
    },
    {
      id: "uke_02",
      num: 2,
      title: "Starter Chords",
      skill: "basic_chords",
      prerequisites: ["down_strum"],
      masteryRequired: 0.75,
      desc: "Add C, Am, and F so the first real changes feel easy."
    },
    {
      id: "uke_03",
      num: 3,
      title: "Smooth Changes",
      skill: "chord_switching",
      prerequisites: ["basic_chords"],
      masteryRequired: 0.8,
      desc: "Train the common C-Am-F-G movement loop."
    },
    {
      id: "uke_04",
      num: 4,
      title: "Pattern Flow",
      skill: "strumming_patterns",
      prerequisites: ["chord_switching"],
      masteryRequired: 0.8,
      desc: "Move from simple downstrokes into island-style patterns."
    },
    {
      id: "uke_05",
      num: 5,
      title: "Play a Song",
      skill: "songs",
      prerequisites: ["strumming_patterns"],
      masteryRequired: 0.85,
      desc: "Put rhythm, chords, and confidence together in repertoire."
    }
  ];
})();
