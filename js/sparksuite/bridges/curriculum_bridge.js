(function() {
  function getNextLesson(context) {
    context = context || {};
    var curriculumMap = context.curriculumMap || [];
    if (!curriculumMap.length) return null;

    if (curriculumMap[0] && curriculumMap[0].id && typeof getNextLessonFromCurriculum === "function") {
      var completed = [];
      if (Array.isArray(S.completedLessons)) completed = completed.concat(S.completedLessons);
      if (S.mastery && S.mastery.lessons) {
        for (var lessonId in S.mastery.lessons) {
          if (S.mastery.lessons[lessonId]) completed.push(lessonId);
        }
      }

      var nextLessonId = getNextLessonFromCurriculum(curriculumMap[0].id, completed);
      if (nextLessonId) return nextLessonId;
      for (var i = 0; i < curriculumMap.length; i++) {
        if (curriculumMap[i] && curriculumMap[i].id && completed.indexOf(curriculumMap[i].id) === -1) {
          return curriculumMap[i].id;
        }
      }
      return null;
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
