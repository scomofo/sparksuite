(function() {
  function CurriculumEngine() {}

  CurriculumEngine.prototype.getDailyPracticeContext = function(instrumentContext) {
    var nextLessonId = SparkCurriculumBridge.getNextLesson(instrumentContext);
    return {
      nextLessonId: nextLessonId,
      nextLessonUnlocked: nextLessonId ? SparkCurriculumBridge.isLessonUnlocked(nextLessonId) : false
    };
  };

  window.SparkSuiteCurriculumEngine = CurriculumEngine;
})();
