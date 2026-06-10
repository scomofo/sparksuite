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

  function startNextLesson(moduleName, appId) {
    var product = helper();
    var summary = product ? product.summarizeInstrument("", moduleName) : null;
    if (!summary || !summary.nextLesson) return;

    var lessonId = summary.nextLesson;

    try {
      if (typeof S !== "undefined") {
        S.__sparkForcedLessonRequest = {
          lessonId: lessonId,
          instrumentType: appId,
          createdAt: Date.now()
        };
      }
    } catch (e) {}

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

    setTimeout(function() {
      if (typeof S !== "undefined" && S.__sparkForcedLessonRequest) {
        delete S.__sparkForcedLessonRequest;
      }
    }, 1000);
  }

  function renderInstrumentLessonCard(info) {
    var h = helper();
    var summary = h ? h.summarizeInstrument(info.name, info.moduleName) : null;
    var title = summary && summary.nextTitle ? summary.nextTitle : "No lesson";
    var skill = summary && summary.nextSkill ? summary.nextSkill : "";
    return '<section class="card">'
      + '<div class="card-section-heading">' + info.name + '</div>'
      + '<div style="margin-top:8px">' + title + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted)">Skill: ' + skill + '</div>'
      + '<button onclick="SparkLessonDashboardUI.start(\'' + info.moduleName + '\',\'' + info.appId + '\')">Start Exact Lesson</button>'
      + '</section>';
  }

  function renderLessonDashboard() {
    var html = '<div>';
    for (var i = 0; i < MODULES.length; i++) {
      if (window[MODULES[i].moduleName]) html += renderInstrumentLessonCard(MODULES[i]);
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
