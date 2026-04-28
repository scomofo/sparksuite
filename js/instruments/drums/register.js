// js/instruments/drums/register.js
(function() {
  function loadScriptOnce(src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var script = document.createElement("script");
    script.src = src;
    script.defer = false;
    script.onerror = function() {
      console.error("DrumSpark: failed to load", src);
    };
    document.head.appendChild(script);
  }

  function ensureDrumRuntime() {
    if (window.SparkDrumsModule) return;
    loadScriptOnce("js/sparksuite/instruments/drums/drums_skill_tree.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_lessons.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_chart_library.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_rhythm_adapter.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_module.js");
  }

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

  function getNextDrumLesson() {
    ensureDrumRuntime();
    var lessons = window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function" ? SparkDrumsModule.getLessons() : [];
    var completed = typeof S !== "undefined" && Array.isArray(S.completedLessons) ? S.completedLessons : [];
    for (var i = 0; i < lessons.length; i++) {
      if (completed.indexOf(lessons[i].id) < 0) return lessons[i];
    }
    return lessons[0] || null;
  }

  function startDrumLesson(lessonId) {
    ensureDrumRuntime();
    if (!lessonId) return false;
    console.log("Drum start:", lessonId);

    try {
      if (window.SparkInstruments && SparkInstruments.activate) {
        SparkInstruments.activate("drumspark");
      }
    } catch (e) {}

    if (typeof S !== "undefined") {
      S.__sparkForcedLessonRequest = {
        lessonId: lessonId,
        instrumentType: "drumspark",
        createdAt: Date.now()
      };
      S.__activeLessonId = lessonId;
      S.activeInstrument = "drumspark";
      S.screen = SCR.HOME;
      S.tab = "practice";
    }

    // 🔥 FIX: trigger UI navigation instead of silent session start
    if (typeof act === "function") {
      act("openPracticePlan");
    }

    return false;
  }

  window.startDrumLesson = startDrumLesson;

  function lessonButton(label, lessonId, className, style) {
    return '<button class="' + (className || 'btn') + '" style="' + (style || '') + '" onclick="return startDrumLesson(\'' + attr(lessonId) + '\')">' + esc(label) + '</button>';
  }

  function drumPracticeTab() {
    ensureDrumRuntime();
    var lessons = window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function" ? SparkDrumsModule.getLessons() : [];
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

  ensureDrumRuntime();

  SparkInstruments.register({
    id: "drumspark",
    instrument: "drums",
    name: "Drums",
    available: true,
    getLessons: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule.getLessons();
    },
    getRhythmAdapter: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule.getRhythmAdapter();
    },
    tabs: [{ id: "practice", label: "Practice" }],
    tabRenderers: { practice: drumPracticeTab },
    init: function() {
      ensureDrumRuntime();
      if (typeof S !== "undefined") S.tab = "practice";
    }
  });
})();
