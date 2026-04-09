(function() {
  function getCompletedLessonIds(context) {
    context = context || {};
    var completed = Array.isArray(context.completedLessonIds) ? context.completedLessonIds.slice() : [];
    if (completed.length) return unique(completed);

    if (Array.isArray(S.completedLessons)) completed = completed.concat(S.completedLessons);
    if (S.mastery && S.mastery.lessons) {
      for (var lessonId in S.mastery.lessons) {
        if (S.mastery.lessons[lessonId]) completed.push(lessonId);
      }
    }
    return unique(completed);
  }

  function getNextLesson(context) {
    context = context || {};
    var curriculumMap = context.curriculumMap || [];
    if (!curriculumMap.length) return null;

    if (curriculumMap[0] && curriculumMap[0].id && typeof getNextLessonFromCurriculum === "function") {
      var completed = getCompletedLessonIds(context);

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

  function resolveLesson(context, lessonId) {
    context = context || {};
    var curriculumMap = Array.isArray(context.curriculumMap) ? context.curriculumMap : [];
    if (!lessonId || !curriculumMap.length) return null;

    var normalized = String(lessonId);
    var sessionMatch = normalized.match(/^session_(\d+)$/);
    var sessionNum = sessionMatch ? parseInt(sessionMatch[1], 10) : null;

    for (var i = 0; i < curriculumMap.length; i++) {
      var item = curriculumMap[i];
      if (!item) continue;
      if (item.id && item.id === normalized) return clone(item);
      if (sessionNum != null && item.num != null && Number(item.num) === sessionNum) return clone(item);
    }
    return null;
  }

  function isLessonUnlocked(lessonId) {
    if (typeof checkLessonUnlockRules !== "function") return true;
    return checkLessonUnlockRules(lessonId);
  }

  function getReviewTargets(context) {
    context = context || {};
    if (typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.getReviewTargets === "function") {
      return clone(SparkCurriculumService.getReviewTargets(buildServiceContext(context)) || []);
    }
    return [];
  }

  function buildLearningQueue(context) {
    context = context || {};
    var nextLessonId = getNextLesson(context);
    var nextLesson = resolveLesson(context, nextLessonId);
    var serviceContext = buildServiceContext(context);
    serviceContext.nextLessonId = nextLessonId;
    if (nextLesson) serviceContext.nextLesson = nextLesson;

    if (typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.buildLearningQueue === "function") {
      return clone(SparkCurriculumService.buildLearningQueue(serviceContext) || []);
    }

    var queue = [];
    var reviewTargets = getReviewTargets(context);
    var i;
    for (i = 0; i < reviewTargets.length && i < 2; i++) {
      queue.push({
        type: "review",
        id: reviewTargets[i].id,
        label: "Review: " + reviewTargets[i].id,
        priority: reviewTargets[i].priority || "normal",
        mastery: reviewTargets[i].mastery
      });
    }

    if (nextLessonId) {
      queue.push({
        type: "lesson",
        id: nextLessonId,
        label: nextLesson && (nextLesson.title || nextLesson.name) ? (nextLesson.title || nextLesson.name) : nextLessonId,
        priority: "normal"
      });
    }

    return queue;
  }

  function buildServiceContext(context) {
    return {
      completedLessons: getCompletedLessonIds(context),
      curriculumMap: clone(context.curriculumMap || []),
      chordProgress: clone(context.chordProgress || (typeof S !== "undefined" ? S.chordProgress || {} : {})),
      chordMastery: clone(context.chordMastery || (typeof S !== "undefined" && S.mastery ? S.mastery.chords || {} : {})),
      lessonMastery: clone(context.lessonMastery || (typeof S !== "undefined" && S.mastery ? S.mastery.lessons || {} : {}))
    };
  }

  function unique(list) {
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var key = String(list[i]);
      if (seen[key]) continue;
      seen[key] = true;
      out.push(list[i]);
    }
    return out;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  window.SparkCurriculumBridge = {
    getNextLesson: getNextLesson,
    resolveLesson: resolveLesson,
    getCompletedLessonIds: getCompletedLessonIds,
    getReviewTargets: getReviewTargets,
    buildLearningQueue: buildLearningQueue,
    isLessonUnlocked: isLessonUnlocked
  };
})();
