(function() {
  function getModule(moduleName) {
    return moduleName ? window[moduleName] || null : null;
  }

  function getCompletedLessonIds() {
    if (typeof S !== "undefined" && Array.isArray(S.completedLessons)) return S.completedLessons;
    if (typeof S !== "undefined" && Array.isArray(S.completedCurriculumLessons)) return S.completedCurriculumLessons;
    return [];
  }

  function getNextLesson(moduleName, completedIds) {
    var mod = getModule(moduleName);
    var lessons = mod && typeof mod.getLessons === "function" ? mod.getLessons() : [];
    completedIds = completedIds || getCompletedLessonIds();
    for (var i = 0; i < lessons.length; i++) {
      if (completedIds.indexOf(lessons[i].id) < 0) return lessons[i];
    }
    return lessons.length ? lessons[lessons.length - 1] : null;
  }

  function summarizeInstrument(name, moduleName) {
    var mod = getModule(moduleName);
    if (!mod) return { instrument: name, ok: false, error: moduleName + " missing" };
    var lessons = typeof mod.getLessons === "function" ? mod.getLessons() : [];
    var completed = getCompletedLessonIds();
    var next = getNextLesson(moduleName, completed);
    var chartId = next && typeof mod.selectChartId === "function"
      ? mod.selectChartId({ curriculum: { nextLessonId: next.id } })
      : null;
    return {
      instrument: name,
      ok: !!lessons.length,
      lessons: lessons.length,
      completed: completed.filter(function(id) { return lessons.some(function(l) { return l.id === id; }); }).length,
      nextLesson: next ? next.id : null,
      nextTitle: next ? next.title : null,
      nextSkill: next ? next.skill : null,
      chartId: chartId
    };
  }

  function getSkillGapSummary(moduleName) {
    var next = getNextLesson(moduleName);
    if (!next) return null;
    return {
      skill: next.skill || "unknown",
      label: next.title || next.id,
      reason: "Next unfinished lesson in the instrument path"
    };
  }

  function renderNextLessonCard(name, moduleName) {
    var summary = summarizeInstrument(name, moduleName);
    if (!summary.ok) return "";
    var gap = getSkillGapSummary(moduleName);
    return '<section class="card spark-next-lesson-card">'
      + '<h3>Next ' + esc(summary.instrument) + ' lesson</h3>'
      + '<div style="font-size:18px;font-weight:800">' + esc(summary.nextTitle || summary.nextLesson || "Lesson") + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted)">Skill: ' + esc(summary.nextSkill || "") + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted)">Chart: ' + esc(summary.chartId || "not mapped") + '</div>'
      + (gap ? '<p style="font-size:12px;color:var(--text-dim)">' + esc(gap.reason) + '</p>' : '')
      + '</section>';
  }

  function esc(value) {
    if (typeof escHTML === "function") return escHTML(value == null ? "" : String(value));
    return String(value == null ? "" : value).replace(/[&<>\"]/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];
    });
  }

  window.SparkLessonProductLayer = {
    getNextLesson: getNextLesson,
    summarizeInstrument: summarizeInstrument,
    getSkillGapSummary: getSkillGapSummary,
    renderNextLessonCard: renderNextLessonCard
  };
})();
