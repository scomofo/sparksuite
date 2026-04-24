(function() {
  function getCompletedLessonIds(instrumentType) {
    var completed = [];
    var lessonMap;
    var v2Completed;
    if (Array.isArray(S.completedLessons)) completed = completed.concat(S.completedLessons);
    lessonMap = typeof SparkMastery !== "undefined"
      ? SparkMastery.category("lessons")
      : (S.mastery && S.mastery.lessons ? S.mastery.lessons : {});
    for (var lessonId in lessonMap) {
      if (lessonMap[lessonId] && completed.indexOf(lessonId) === -1) completed.push(lessonId);
    }
    v2Completed = instrumentType && S.curriculumV2CompletedSessions ? S.curriculumV2CompletedSessions[instrumentType] : null;
    if (Array.isArray(v2Completed)) {
      for (var i = 0; i < v2Completed.length; i++) {
        if (completed.indexOf(v2Completed[i]) === -1) completed.push(v2Completed[i]);
      }
    }
    return completed;
  }

  function getNextLesson(context) {
    context = context || {};
    var curriculumMap = context.curriculumMap || [];
    var curriculumRootId = context.curriculumId || null;
    var firstItemId = curriculumMap[0] && curriculumMap[0].id ? curriculumMap[0].id : null;
    var hasRegistryCurriculum = false;
    var instrumentType = context.instrument || context.instrumentType || null;
    var completed = getCompletedLessonIds(instrumentType);
    if (!curriculumMap.length) return null;
    if (!curriculumRootId && firstItemId && typeof getCurriculumItem === "function") {
      hasRegistryCurriculum = !!getCurriculumItem("curriculums", firstItemId);
      if (hasRegistryCurriculum) curriculumRootId = firstItemId;
    }

    if (curriculumRootId && typeof getNextLessonFromCurriculum === "function") {
      var nextLessonId = getNextLessonFromCurriculum(curriculumRootId, completed);
      if (nextLessonId) return nextLessonId;
      for (var i = 0; i < curriculumMap.length; i++) {
        if (curriculumMap[i] && curriculumMap[i].id && completed.indexOf(curriculumMap[i].id) === -1) {
          return curriculumMap[i].id;
        }
      }
      return null;
    }

    for (var j = 0; j < curriculumMap.length; j++) {
      if (curriculumMap[j] && curriculumMap[j].id && completed.indexOf(curriculumMap[j].id) === -1) {
        return curriculumMap[j].id;
      }
    }

    var nextLegacy = curriculumMap[0];
    if (nextLegacy.num != null) return "session_" + nextLegacy.num;
    return nextLegacy.title || null;
  }

  function isLessonUnlocked(lessonId) {
    if (typeof checkLessonUnlockRules !== "function") return true;
    return checkLessonUnlockRules(lessonId);
  }

  window.SparkCurriculumBridge = {
    getNextLesson: getNextLesson,
    isLessonUnlocked: isLessonUnlocked
  };
})();
