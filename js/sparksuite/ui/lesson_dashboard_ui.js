(function() {
  var MODULES = [
    { name: "Ukulele", key: "ukulele", moduleName: "SparkUkuleleModule", appId: "ukespark" },
    { name: "Guitar", key: "guitar", moduleName: "SparkGuitarModule", appId: "chordspark" },
    { name: "Piano", key: "piano", moduleName: "SparkPianoModule", appId: "pianospark" },
    { name: "Bass", key: "bass", moduleName: "SparkBassModule", appId: "bassspark" },
    { name: "Vocals", key: "vocals", moduleName: "SparkVocalsModule", appId: "vocalspark" }
  ];

  function helper() {
    return window.SparkLessonProductLayer || null;
  }

  function getCompletedIds() {
    if (typeof S !== "undefined" && Array.isArray(S.completedLessons)) return S.completedLessons;
    if (typeof S !== "undefined" && Array.isArray(S.completedCurriculumLessons)) return S.completedCurriculumLessons;
    if (typeof S !== "undefined" && S.progress && Array.isArray(S.progress.completedLessons)) return S.progress.completedLessons;
    return [];
  }

  function getModule(moduleName) {
    return moduleName ? window[moduleName] || null : null;
  }

  function lessonsFor(moduleName) {
    var mod = getModule(moduleName);
    return mod && typeof mod.getLessons === "function" ? mod.getLessons() : [];
  }

  function lessonProgress(moduleName) {
    var lessons = lessonsFor(moduleName);
    var completed = getCompletedIds();
    var count = 0;
    for (var i = 0; i < lessons.length; i++) {
      if (completed.indexOf(lessons[i].id) >= 0) count++;
    }
    return { total: lessons.length, completed: count, ratio: lessons.length ? count / lessons.length : 0 };
  }

  function startNextLesson(moduleName, appId) {
    var product = helper();
    var summary = product ? product.summarizeInstrument("", moduleName) : null;
    if (!summary || !summary.nextLesson) return;

    try {
      if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.activate === "function") {
        SparkInstruments.activate(appId);
      }
    } catch (e) {}

    try {
      if (typeof window.sparkCore !== "undefined" && window.sparkCore && typeof window.sparkCore.startSession === "function") {
        window.sparkCore.startSession({ flow: "daily_practice", forceRebuild: true });
      } else if (typeof act === "function") {
        act('openPracticePlan');
      }
    } catch (e) {
      console.error("Lesson start failed", e);
    }
  }

  function renderInstrumentLessonCard(info) {
    var h = helper();
    var summary = h ? h.summarizeInstrument(info.name, info.moduleName) : null;
    var progress = lessonProgress(info.moduleName);
    var title = summary && summary.nextTitle ? summary.nextTitle : "No lesson";
    var skill = summary && summary.nextSkill ? summary.nextSkill : "";
    return '<section class="card">'
      + '<b>' + info.name + '</b>'
      + '<div style="font-size:12px;color:var(--text-muted)">' + progress.completed + '/' + progress.total + '</div>'
      + '<div style="margin-top:8px">' + title + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted)">Skill: ' + skill + '</div>'
      + '<button onclick="SparkLessonDashboardUI.start(\'' + info.moduleName + '\',\'' + info.appId + '\')">Start Next Lesson</button>'
      + '</section>';
  }

  function renderLessonDashboard() {
    var html = '<div>';
    for (var i = 0; i < MODULES.length; i++) {
      if (getModule(MODULES[i].moduleName)) html += renderInstrumentLessonCard(MODULES[i]);
    }
    html += '</div>';
    return html;
  }

  function open() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = renderLessonDashboard();
  }

  window.SparkLessonDashboardUI = {
    open: open,
    start: startNextLesson
  };
})();
