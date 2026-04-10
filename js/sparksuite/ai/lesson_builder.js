(function() {
  /**
   * SparkLessonBuilder -- builds structured lesson plans from skills and charts.
   * Produces a sequence of exercise types that form a learning path.
   */
  function LessonBuilder() {}

  /**
   * Build a lesson plan from extracted skills and chart data.
   * @param {Object} params - { skills, chart }
   * @returns {Array} lesson steps
   */
  LessonBuilder.prototype.build = function(params) {
    params = params || {};
    var skills = params.skills || [];
    var chart = params.chart;
    var steps = [];

    // Warmup: focus on the primary skill
    if (skills.length) {
      steps.push({
        type: "warmup",
        skill: skills[0],
        durationSec: 30,
        description: "Warm up with " + skills[0] + " exercises"
      });
    }

    // Drill: practice the primary skill in isolation
    if (skills.length) {
      steps.push({
        type: "drill",
        skill: skills[0],
        durationSec: 60,
        description: "Focused drill on " + skills[0]
      });
    }

    // Section practice: play a section of the song at reduced speed
    if (chart && chart.sections && chart.sections.length) {
      steps.push({
        type: "song_section",
        section: chart.sections[0],
        speed: 0.75,
        durationSec: 90,
        description: "Practice first section at 75% speed"
      });
    }

    // Full play-through
    steps.push({
      type: "full_play",
      speed: 1.0,
      description: "Full song play-through at normal speed"
    });

    return steps;
  };

  window.SparkLessonBuilder = LessonBuilder;
})();
