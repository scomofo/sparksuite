// js/instruments/vocals/register.js
(function() {
  function esc(value) {
    if (typeof escHTML === "function") return escHTML(value == null ? "" : String(value));
    return String(value == null ? "" : value).replace(/[&<>\"]/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];
    });
  }

  function attr(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }

  function getVocalLessons() {
    return window.SparkVocalsModule && typeof SparkVocalsModule.getLessons === "function"
      ? SparkVocalsModule.getLessons()
      : [];
  }

  function getNextVocalLesson() {
    var lessons = getVocalLessons();
    var completed = typeof S !== "undefined" && Array.isArray(S.completedLessons) ? S.completedLessons : [];
    for (var i = 0; i < lessons.length; i++) {
      if (completed.indexOf(lessons[i].id) < 0) return lessons[i];
    }
    return lessons[0] || null;
  }

  function startVocalsLesson(lessonId) {
    if (!lessonId) return false;

    try {
      if (window.SparkInstruments && SparkInstruments.activate) {
        SparkInstruments.activate("vocalspark");
      }
    } catch (e) {}

    if (typeof S !== "undefined") {
      S.activeInstrument = "vocalspark";
      S.tab = "practice";
    }

    if (typeof act === "function") {
      act("openPracticePlan", lessonId);
    }

    return false;
  }

  window.startVocalsLesson = startVocalsLesson;

  function lessonButton(label, lessonId, className, style) {
    return '<button class="' + (className || 'btn') + '" style="' + (style || '') + '" onclick="return startVocalsLesson(\'' + attr(lessonId) + '\')">' + esc(label) + '</button>';
  }

  function vocalsPracticeTab() {
    var lessons = getVocalLessons();
    var next = getNextVocalLesson();
    var html = '<div class="card mb12" style="text-align:center">';
    html += '<h2>VocalSpark</h2>';
    if (next) {
      html += '<div>Next: ' + esc(next.title || next.id) + '</div>';
      html += lessonButton('Start Vocal Lesson', next.id, 'btn', 'margin-top:10px');
    }
    html += '</div>';
    html += '<div class="card">';
    for (var i = 0; i < lessons.length; i++) {
      html += '<div style="margin:6px 0">';
      html += esc(lessons[i].title || lessons[i].id);
      html += lessonButton('Start', lessons[i].id, 'btn btn-sm', 'margin-left:10px');
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  SparkInstruments.register({
    id: "vocalspark",
    instrument: "vocals",
    name: "Vocals",

    icon: "🎤",
    iconImage: "resources/instruments/vocals/card.png",
    heroImage: "resources/instruments/vocals/hero.jpg",

    available: true,
    getLessons: getVocalLessons,
    getSkillTree: function() {
      return window.SparkVocalsModule && typeof SparkVocalsModule.getSkillTree === "function"
        ? SparkVocalsModule.getSkillTree()
        : [];
    },
    getRhythmAdapter: function() {
      return window.SparkVocalsModule && typeof SparkVocalsModule.getRhythmAdapter === "function"
        ? SparkVocalsModule.getRhythmAdapter()
        : null;
    },
    getCurriculumMap: function() {
      return window.SparkVocalsModule && typeof SparkVocalsModule.getCurriculumMap === "function"
        ? SparkVocalsModule.getCurriculumMap()
        : [];
    },
    tabs: [{ id: "practice", label: "Practice" }],
    tabRenderers: { practice: vocalsPracticeTab },
    init: function() {
      if (typeof S !== "undefined") S.tab = "practice";
    }
  });
})();
