(function() {
  var CHARTS = {
    power_chords_01: {
      id: "power_chords_01",
      title: "Power Chords 01",
      bpm: 92,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 1, label: "G5", skillId: "gtr_green_root" },
        { beat: 1, laneMask: 1, label: "G5", skillId: "gtr_green_root" },
        { beat: 2, laneMask: 3, label: "A5", skillId: "gtr_two_note_power_chords", flags: { specialPhrase: true } },
        { beat: 3, laneMask: 3, label: "A5", skillId: "gtr_two_note_power_chords", flags: { specialPhrase: true } },
        { beat: 4, laneMask: 1, label: "G5", skillId: "gtr_green_root" },
        { beat: 5, laneMask: 5, label: "B5", skillId: "gtr_three_fret_reach" },
        { beat: 6, laneMask: 3, label: "A5", skillId: "gtr_two_note_power_chords" },
        { beat: 7, laneMask: 1, label: "G5", skillId: "gtr_green_root" },
        { beat: 8, laneMask: 9, label: "C5", skillId: "gtr_alt_strum_basic", flags: { specialPhrase: true } },
        { beat: 9, laneMask: 9, label: "C5", skillId: "gtr_alt_strum_basic", flags: { specialPhrase: true } },
        { beat: 10, laneMask: 3, label: "A5", skillId: "gtr_two_note_power_chords" },
        { beat: 11, laneMask: 1, label: "G5", skillId: "gtr_green_root" },
        { beat: 12, laneMask: 17, label: "D5", skillId: "gtr_orange_reach" },
        { beat: 13, laneMask: 17, label: "D5", skillId: "gtr_orange_reach" },
        { beat: 14, laneMask: 9, label: "C5", skillId: "gtr_alt_strum_basic" },
        { beat: 15, laneMask: 1, label: "G5", skillId: "gtr_green_root" }
      ],
      phrases: [
        { id: 0, name: "Phrase 1", startBeat: 0, endBeat: 8, flags: { special: true } },
        { id: 1, name: "Phrase 2", startBeat: 8, endBeat: 16, flags: { special: true } }
      ]
    }
  };

  window.SparkGuitarChartLibrary = {
    getChartDefinition: function(chartId) {
      return CHARTS[chartId] || CHARTS.power_chords_01;
    }
  };
})();
