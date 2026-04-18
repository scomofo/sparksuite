(function() {
  var UKULELE_LEVEL_PALETTE = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6"];

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
    },
    {
      id: "uke_06",
      num: 6,
      title: "Fingerpicked Motion",
      skill: "fingerpicking",
      prerequisites: ["songs"],
      masteryRequired: 0.85,
      desc: "Move from broad strums into steady four-string arpeggios."
    },
    {
      id: "uke_07",
      num: 7,
      title: "Melody Notes",
      skill: "melody",
      prerequisites: ["fingerpicking"],
      masteryRequired: 0.86,
      desc: "Pull simple lead notes out of chord shapes and connect them musically."
    },
    {
      id: "uke_08",
      num: 8,
      title: "Campfire Performance",
      skill: "performance",
      prerequisites: ["melody"],
      masteryRequired: 0.88,
      desc: "Blend groove, clean changes, and confidence into a full playthrough."
    },
    {
      id: "uke_09",
      num: 9,
      title: "Barre Basics",
      skill: "barre_chords",
      prerequisites: ["performance"],
      masteryRequired: 0.85,
      desc: "Learn to hold barre shapes cleanly across all four strings."
    },
    {
      id: "uke_10",
      num: 10,
      title: "Syncopated Strum",
      skill: "syncopation",
      prerequisites: ["barre_chords"],
      masteryRequired: 0.86,
      desc: "Add off-beat accents and reggae-style chops to your strumming."
    },
    {
      id: "uke_11",
      num: 11,
      title: "Fingerpick Patterns",
      skill: "advanced_fingerpick",
      prerequisites: ["fingerpicking"],
      masteryRequired: 0.88,
      desc: "Build complex Travis-style and rolling arpeggio patterns."
    },
    {
      id: "uke_12",
      num: 12,
      title: "Performance Ready",
      skill: "full_performance",
      prerequisites: ["syncopation", "advanced_fingerpick"],
      masteryRequired: 0.90,
      desc: "Combine all techniques into a polished, stage-ready performance."
    }
  ];

  window.SparkUkuleleLevelColors = buildUkuleleLevelColors(window.SparkUkuleleLessons);
  window.SparkUkuleleLevelNames = buildUkuleleLevelNames(window.SparkUkuleleLessons);

  function buildUkuleleLevelColors(lessons) {
    var colors = {};
    lessons = Array.isArray(lessons) ? lessons : [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i] && lessons[i].num != null) {
        colors[lessons[i].num] = UKULELE_LEVEL_PALETTE[i % UKULELE_LEVEL_PALETTE.length];
      }
    }
    return colors;
  }

  function buildUkuleleLevelNames(lessons) {
    var names = {};
    lessons = Array.isArray(lessons) ? lessons : [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i] && lessons[i].num != null) {
        names[lessons[i].num] = lessons[i].title || ("Level " + lessons[i].num);
      }
    }
    return names;
  }
})();
