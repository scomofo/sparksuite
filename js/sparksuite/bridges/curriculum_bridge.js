(function() {
  function curriculumBridgeRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function curriculumBridgeRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = curriculumBridgeRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function getNextLesson(context) {
    context = context || {};
    var curriculumMap = context.curriculumMap || [];
    if (!curriculumMap.length) return null;

    if (curriculumMap[0] && curriculumMap[0].id && typeof getNextLessonFromCurriculum === "function") {
      var completed = [];
      if (window.sparkCore && typeof window.sparkCore.getCompletedLessonIds === "function") {
        completed = window.sparkCore.getCompletedLessonIds();
      } else {
        var completedLessons = curriculumBridgeRead("completedLessons", []);
        var lessonMastery = curriculumBridgeRead(["mastery", "lessons"], {}) || {};
        if (Array.isArray(completedLessons)) completed = completed.concat(completedLessons);
        for (var lessonId in lessonMastery) {
          if (lessonMastery[lessonId]) completed.push(lessonId);
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
