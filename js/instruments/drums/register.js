// js/instruments/drums/register.js
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

  function getDrumLessons() {
    return window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function"
      ? SparkDrumsModule.getLessons()
      : [];
  }

  function getNextDrumLesson() {
    var lessons = getDrumLessons();
    var completed = typeof S !== "undefined" && Array.isArray(S.completedLessons) ? S.completedLessons : [];
    for (var i = 0; i < lessons.length; i++) {
      if (completed.indexOf(lessons[i].id) < 0) return lessons[i];
    }
    return lessons[0] || null;
  }

  function startDrumLesson(lessonId) {
    if (!lessonId) return false;

    try {
      if (window.SparkInstruments && SparkInstruments.activate) {
        SparkInstruments.activate("drumspark");
      }
    } catch (e) {}

    if (typeof S !== "undefined") {
      S.activeInstrument = "drumspark";
      S.tab = "practice";
    }

    if (typeof act === "function") {
      act("openPracticePlan", lessonId);
    }

    return false;
  }

  window.startDrumLesson = startDrumLesson;

  function lessonButton(label, lessonId, className, style) {
    return '<button class="' + (className || 'btn') + '" style="' + (style || '') + '" onclick="return startDrumLesson(\'' + attr(lessonId) + '\')">' + esc(label) + '</button>';
  }

  function drumPracticeTab() {
    var lessons = getDrumLessons();
    var next = getNextDrumLesson();
    var html = '<div class="card mb12" style="text-align:center">';
    html += '<h2>DrumSpark</h2>';
    if (next) {
      html += '<div>Next: ' + esc(next.title || next.id) + '</div>';
      html += lessonButton('Start Drum Lesson', next.id, 'btn', 'margin-top:10px');
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
    id: "drumspark",
    instrument: "drums",
    name: "Drums",

    icon: "🥁",
    iconImage: "resources/instruments/drums/card.png",
    heroImage: "resources/instruments/drums/hero.jpg",

    available: true,
    getLessons: getDrumLessons,
    getRhythmAdapter: function() {
      return window.SparkDrumsModule ? window.SparkDrumsModule.getRhythmAdapter() : null;
    },
    tabs: [{ id: "practice", label: "Practice" }],
    tabRenderers: { practice: drumPracticeTab },
    init: function() {
      if (typeof S !== "undefined") S.tab = "practice";
    }
  });
})();
