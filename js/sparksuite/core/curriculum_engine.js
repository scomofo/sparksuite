(function() {
  function CurriculumEngine() {}

  CurriculumEngine.prototype.getDailyPracticeContext = function(instrumentContext) {
    var nextLessonId = SparkCurriculumBridge.getNextLesson(instrumentContext);
    var nextLesson = SparkCurriculumBridge.resolveLesson(instrumentContext, nextLessonId);
    var reviewTargets = SparkCurriculumBridge.getReviewTargets(instrumentContext);
    var learningQueue = SparkCurriculumBridge.buildLearningQueue(instrumentContext);
    return {
      nextLessonId: nextLessonId,
      nextLessonUnlocked: nextLessonId ? SparkCurriculumBridge.isLessonUnlocked(nextLessonId) : false,
      nextLesson: nextLesson,
      reviewTargets: reviewTargets,
      learningQueue: learningQueue
    };
  };

  window.SparkSuiteCurriculumEngine = CurriculumEngine;
})();
