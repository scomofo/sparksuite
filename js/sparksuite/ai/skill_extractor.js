(function() {
  /**
   * SparkSkillExtractor -- identifies skills required by a chart.
   * Analyzes timeline events to determine what the user needs to practice.
   */
  function SkillExtractor() {}

  SkillExtractor.prototype.extract = function(playAlongChart) {
    if (!playAlongChart) return [];

    var skills = {};
    var timeline = playAlongChart.getTimeline ? playAlongChart.getTimeline() : [];
    var chords = playAlongChart.chords || [];

    for (var i = 0; i < timeline.length; i++) {
      var e = timeline[i];
      if (e.type === "chord") skills.chord_switching = true;
      if (e.type === "note") skills.timing = true;
      if (e.type === "strum_pattern") skills.rhythm = true;
      if (e.duration > 0) skills.sustain = true;
    }

    if (chords.length > 1) {
      skills.chord_switching = true;
      // Check for unique chords to assess chord vocabulary
      var unique = {};
      for (var j = 0; j < chords.length; j++) unique[chords[j].chord] = true;
      if (Object.keys(unique).length > 3) skills.chord_vocabulary = true;
    }

    // Assess tempo difficulty
    var bpm = playAlongChart.getBpm ? playAlongChart.getBpm() : 100;
    if (bpm > 140) skills.speed = true;
    if (bpm < 80) skills.slow_control = true;

    return Object.keys(skills);
  };

  window.SparkSkillExtractor = SkillExtractor;
})();
