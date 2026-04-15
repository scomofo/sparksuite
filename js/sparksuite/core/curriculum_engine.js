(function() {
  function CurriculumEngine() {}

  CurriculumEngine.prototype.getDailyPracticeContext = function(instrumentContext, userContext) {
    var adaptiveContext = typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.buildAdaptiveSessionContext === "function"
      ? SparkCurriculumService.buildAdaptiveSessionContext(userContext || {}, instrumentContext || {})
      : null;
    var nextLessonId = adaptiveContext && adaptiveContext.nextLessonId
      ? adaptiveContext.nextLessonId
      : SparkCurriculumBridge.getNextLesson(instrumentContext);
    return {
      nextLessonId: nextLessonId,
      nextLessonUnlocked: nextLessonId ? SparkCurriculumBridge.isLessonUnlocked(nextLessonId) : false,
      reviewSkillId: adaptiveContext ? adaptiveContext.reviewSkillId : null,
      reviewScore: adaptiveContext ? adaptiveContext.reviewScore : null,
      reviewDaysSincePractice: adaptiveContext ? adaptiveContext.reviewDaysSincePractice : null,
      reviewMastery: adaptiveContext ? adaptiveContext.reviewMastery : null
    };
  };

  window.SparkSuiteCurriculumEngine = CurriculumEngine;
})();
