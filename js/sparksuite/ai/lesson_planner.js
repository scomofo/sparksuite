(function() {
  /**
   * SparkLessonPlanner -- orchestrates skill extraction and lesson building.
   * Takes a PlayAlongChart and produces a structured lesson plan.
   */
  function LessonPlanner(options) {
    options = options || {};
    this.extractor = options.extractor || new SparkSkillExtractor();
    this.builder = options.builder || new SparkLessonBuilder();
  }

  /**
   * Generate a complete lesson plan for a chart.
   * @param {SparkPlayAlongChart} playAlongChart
   * @returns {Object} { skills, steps, chart }
   */
  LessonPlanner.prototype.generate = function(playAlongChart) {
    var skills = this.extractor.extract(playAlongChart);
    var steps = this.builder.build({
      skills: skills,
      chart: playAlongChart
    });

    return {
      skills: skills,
      steps: steps,
      chart: playAlongChart
    };
  };

  window.SparkLessonPlanner = LessonPlanner;
})();
