(function() {
  function CurriculumEngine() {}

  function normalizeMasteryMap(source) {
    return source && typeof source === "object" ? source : {};
  }

  function getLessonMasteryMap() {
    if (typeof SparkMastery !== "undefined" && SparkMastery && typeof SparkMastery.category === "function") {
      return normalizeMasteryMap(SparkMastery.category("lessons"));
    }
    if (typeof S !== "undefined" && S && S.mastery && S.mastery.lessons) {
      return normalizeMasteryMap(S.mastery.lessons);
    }
    return {};
  }

  function getCompletedSessionIds(instrumentType) {
    if (!instrumentType || typeof S === "undefined" || !S || !S.curriculumV2CompletedSessions) return [];
    return Array.isArray(S.curriculumV2CompletedSessions[instrumentType])
      ? S.curriculumV2CompletedSessions[instrumentType].slice()
      : [];
  }

  function getCompletedLessonIds(instrumentType) {
    var completed = [];
    var mastery = getLessonMasteryMap();
    var key;
    var v2Completed = getCompletedSessionIds(instrumentType);
    if (typeof S !== "undefined" && S && Array.isArray(S.completedLessons)) {
      completed = S.completedLessons.slice();
    }
    for (key in mastery) {
      if (mastery[key] && completed.indexOf(key) === -1) completed.push(key);
    }
    for (key = 0; key < v2Completed.length; key++) {
      if (completed.indexOf(v2Completed[key]) === -1) completed.push(v2Completed[key]);
    }
    return completed;
  }

  function getLessonProgressValue(lessonId) {
    var mastery = getLessonMasteryMap();
    var value = mastery && mastery[lessonId];
    if (value == null) return 0;
    if (typeof value === "number") return value;
    if (typeof value.mastery === "number") return value.mastery;
    if (value.completed) return 1;
    return 0;
  }

  function normalizeLessons(instrumentContext) {
    var adapter = instrumentContext && instrumentContext.adapter ? instrumentContext.adapter : null;
    var lessons = instrumentContext && Array.isArray(instrumentContext.lessons) ? instrumentContext.lessons.slice() : [];
    if (!lessons.length && adapter && typeof adapter.getLessons === "function") {
      lessons = adapter.getLessons() || [];
    }
    if (!lessons.length && instrumentContext && Array.isArray(instrumentContext.curriculumMap)) {
      lessons = instrumentContext.curriculumMap.slice();
    }
    return Array.isArray(lessons) ? lessons : [];
  }

  function lessonIsUnlocked(lesson, completedIds) {
    var prerequisites = Array.isArray(lesson && lesson.prerequisites) ? lesson.prerequisites : [];
    var i;
    for (i = 0; i < prerequisites.length; i++) {
      if (completedIds.indexOf(prerequisites[i]) === -1) return false;
    }
    return true;
  }

  function lessonNeedsReview(lesson) {
    var lessonId = lesson && lesson.id ? lesson.id : null;
    var mastery = getLessonMasteryMap();
    var record = lessonId ? mastery[lessonId] : null;
    var nextReviewAt = record && typeof record === "object" ? record.nextReviewAt : null;
    if (!nextReviewAt) return false;
    return new Date(nextReviewAt).getTime() <= Date.now();
  }

  function lessonIsIncomplete(lesson) {
    var lessonId = lesson && lesson.id ? lesson.id : null;
    var required = lesson && typeof lesson.masteryRequired === "number" ? lesson.masteryRequired : 1;
    if (!lessonId) return false;
    return getLessonProgressValue(lessonId) < required;
  }

  function resolveNextLessonFromLessons(lessons, instrumentType) {
    var completedIds = getCompletedLessonIds(instrumentType);
    var unlocked = [];
    var i;
    for (i = 0; i < lessons.length; i++) {
      if (lessons[i] && lessonIsUnlocked(lessons[i], completedIds)) unlocked.push(lessons[i]);
    }
    for (i = 0; i < unlocked.length; i++) {
      if (lessonNeedsReview(unlocked[i])) return unlocked[i];
    }
    for (i = 0; i < unlocked.length; i++) {
      if (lessonIsIncomplete(unlocked[i])) return unlocked[i];
    }
    return unlocked.length ? unlocked[0] : null;
  }

  function resolveNextLessonId(instrumentContext, nextLesson) {
    var fallbackId;
    if (nextLesson && nextLesson.id) return nextLesson.id;
    fallbackId = SparkCurriculumBridge.getNextLesson(instrumentContext);
    return fallbackId || null;
  }

  function resolveNextLesson(nextLessonId, nextLesson, instrumentContext) {
    var curriculumMap;
    var i;
    if (nextLesson) return nextLesson;
    if (nextLessonId && typeof SparkCurriculumService !== "undefined" && SparkCurriculumService && typeof SparkCurriculumService.getLessonById === "function") {
      nextLesson = SparkCurriculumService.getLessonById(nextLessonId);
      if (nextLesson) return nextLesson;
    }
    curriculumMap = instrumentContext && Array.isArray(instrumentContext.curriculumMap) ? instrumentContext.curriculumMap : [];
    for (i = 0; i < curriculumMap.length; i++) {
      if (!curriculumMap[i]) continue;
      if (curriculumMap[i].id === nextLessonId) return curriculumMap[i];
      if (curriculumMap[i].num != null && ("session_" + curriculumMap[i].num) === nextLessonId) return curriculumMap[i];
    }
    return null;
  }

  CurriculumEngine.prototype.getDailyPracticeContext = function(instrumentContext) {
    instrumentContext = instrumentContext || {};
    var lessons = normalizeLessons(instrumentContext);
    var nextLesson = resolveNextLessonFromLessons(lessons, instrumentContext.instrumentType || null);
    var nextLessonId = resolveNextLessonId(instrumentContext, nextLesson);
    var reviewTargets = typeof SparkCurriculumService !== "undefined" && SparkCurriculumService && typeof SparkCurriculumService.getReviewTargets === "function"
      ? SparkCurriculumService.getReviewTargets({
          instrumentType: instrumentContext.instrumentType || null,
          lessons: lessons
        })
      : [];
    var learningQueue = typeof SparkCurriculumService !== "undefined" && SparkCurriculumService && typeof SparkCurriculumService.buildLearningQueue === "function"
      ? SparkCurriculumService.buildLearningQueue({
          instrumentType: instrumentContext.instrumentType || null,
          lessons: lessons
        })
      : [];
    nextLesson = resolveNextLesson(nextLessonId, nextLesson, instrumentContext);

    return {
      nextLessonId: nextLessonId,
      nextLesson: nextLesson,
      nextLessonUnlocked: nextLessonId ? SparkCurriculumBridge.isLessonUnlocked(nextLessonId, instrumentContext) : false,
      reviewTargets: reviewTargets,
      learningQueue: learningQueue,
      lessons: lessons
    };
  };

  window.SparkSuiteCurriculumEngine = CurriculumEngine;
})();
