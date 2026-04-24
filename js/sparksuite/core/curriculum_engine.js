(function() {
  function CurriculumEngine() {}

  function resolveNextLesson(curriculumMap, nextLessonId) {
    var i;
    var item;
    if (!Array.isArray(curriculumMap) || !curriculumMap.length || !nextLessonId) return null;
    for (i = 0; i < curriculumMap.length; i++) {
      item = curriculumMap[i];
      if (!item) continue;
      if (item.id === nextLessonId) return item;
      if (item.num != null && ("session_" + item.num) === nextLessonId) return item;
    }
    return null;
  }

  CurriculumEngine.prototype.getDailyPracticeContext = function(instrumentContext) {
    var nextLessonId = SparkCurriculumBridge.getNextLesson(instrumentContext);
    var curriculumMap = instrumentContext && Array.isArray(instrumentContext.curriculumMap)
      ? instrumentContext.curriculumMap
      : [];
    return {
      nextLessonId: nextLessonId,
      nextLesson: resolveNextLesson(curriculumMap, nextLessonId),
      nextLessonUnlocked: nextLessonId ? SparkCurriculumBridge.isLessonUnlocked(nextLessonId) : false
    };
  };

  window.SparkSuiteCurriculumEngine = CurriculumEngine;
})();
