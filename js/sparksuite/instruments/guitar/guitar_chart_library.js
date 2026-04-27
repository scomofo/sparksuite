(function() {
  var CHARTS = {
    power_chords_01: {
      id: "power_chords_01",
      title: "Power Chords 01",
      bpm: 92,
      enginePreset: "spark_learning",
      totalBeats: 16,
      notes: [
        { beat: 0, laneMask: 1, label: "G5", skillId: "gtr_power_chords" },
        { beat: 1, laneMask: 1, label: "G5", skillId: "gtr_power_chords" },
        { beat: 2, laneMask: 3, label: "A5", skillId: "gtr_power_chords" },
        { beat: 3, laneMask: 3, label: "A5", skillId: "gtr_power_chords" },
        { beat: 4, laneMask: 1, label: "G5", skillId: "gtr_power_chords" },
        { beat: 5, laneMask: 5, label: "B5", skillId: "gtr_power_chords" },
        { beat: 6, laneMask: 3, label: "A5", skillId: "gtr_power_chords" },
        { beat: 7, laneMask: 1, label: "G5", skillId: "gtr_power_chords" }
      ],
      phrases: [
        { id: 0, name: "Phrase A", startBeat: 0, endBeat: 8, flags: { special: true } }
      ]
    }
  };

  function cloneChartWithSkill(srcId, newId, newSkillId) {
    var src = CHARTS[srcId];
    if (!src) return;
    CHARTS[newId] = {
      id: newId,
      title: newId,
      bpm: src.bpm,
      enginePreset: src.enginePreset,
      totalBeats: src.totalBeats,
      notes: src.notes.map(function(n) {
        var c = {};
        for (var k in n) c[k] = n[k];
        c.skillId = newSkillId;
        return c;
      }),
      phrases: src.phrases.slice()
    };
  }

  cloneChartWithSkill("power_chords_01", "gtr_down_strum_01", "gtr_down_strum");
  cloneChartWithSkill("power_chords_01", "gtr_switch_01", "gtr_chord_switching");
  cloneChartWithSkill("power_chords_01", "gtr_strum_pattern_01", "gtr_down_up_strum");
  cloneChartWithSkill("power_chords_01", "gtr_fingerpick_01", "gtr_fingerpicking");

  window.SparkGuitarChartLibrary = {
    getChartDefinition: function(chartId) {
      return CHARTS[chartId] || CHARTS.power_chords_01;
    },
    getAll: function() {
      return CHARTS;
    }
  };
})();
