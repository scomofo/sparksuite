(function() {
  function ensureState() {
    if (typeof S === "undefined" || !S) return null;
    if (!Array.isArray(S.completedLessons)) S.completedLessons = [];
    if (!S.lessonProgress || typeof S.lessonProgress !== "object") S.lessonProgress = {};
    if (!S.lastLessonByInstrument || typeof S.lastLessonByInstrument !== "object") S.lastLessonByInstrument = {};
    return S;
  }

  function persist() {
    try {
      if (typeof saveState === "function") saveState();
    } catch (e) {}
  }

  function markStarted(instrumentKey, lessonId) {
    var state = ensureState();
    if (!state || !lessonId) return false;
    state.lastLessonByInstrument[instrumentKey || "unknown"] = lessonId;
    state.lessonProgress[lessonId] = state.lessonProgress[lessonId] || {};
    state.lessonProgress[lessonId].status = state.lessonProgress[lessonId].status === "complete" ? "complete" : "started";
    state.lessonProgress[lessonId].startedAt = state.lessonProgress[lessonId].startedAt || new Date().toISOString();
    state.lessonProgress[lessonId].lastTouchedAt = new Date().toISOString();
    persist();
    return true;
  }

  function markComplete(instrumentKey, lessonId, meta) {
    var state = ensureState();
    if (!state || !lessonId) return false;
    if (state.completedLessons.indexOf(lessonId) < 0) state.completedLessons.push(lessonId);
    state.lastLessonByInstrument[instrumentKey || "unknown"] = lessonId;
    state.lessonProgress[lessonId] = state.lessonProgress[lessonId] || {};
    state.lessonProgress[lessonId].status = "complete";
    state.lessonProgress[lessonId].completedAt = new Date().toISOString();
    state.lessonProgress[lessonId].lastTouchedAt = new Date().toISOString();
    state.lessonProgress[lessonId].meta = meta || state.lessonProgress[lessonId].meta || {};
    persist();
    return true;
  }

  function getStatus(lessonId) {
    var state = ensureState();
    if (!state || !lessonId) return "new";
    if (state.completedLessons.indexOf(lessonId) >= 0) return "complete";
    if (state.lessonProgress[lessonId] && state.lessonProgress[lessonId].status) return state.lessonProgress[lessonId].status;
    return "new";
  }

  function getLastLesson(instrumentKey) {
    var state = ensureState();
    if (!state) return null;
    return state.lastLessonByInstrument[instrumentKey || "unknown"] || null;
  }

  function resetLesson(lessonId) {
    var state = ensureState();
    var index;
    if (!state || !lessonId) return false;
    index = state.completedLessons.indexOf(lessonId);
    if (index >= 0) state.completedLessons.splice(index, 1);
    if (state.lessonProgress[lessonId]) state.lessonProgress[lessonId].status = "started";
    persist();
    return true;
  }

  window.SparkLessonProgressService = {
    markStarted: markStarted,
    markComplete: markComplete,
    getStatus: getStatus,
    getLastLesson: getLastLesson,
    resetLesson: resetLesson
  };
})();
