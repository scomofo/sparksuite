// js/instruments/drums/register.js
(function() {
  function loadScriptOnce(src) {
    if (typeof document === "undefined" || !document.head) return;
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
    loadScriptOnce("js/sparksuite/instruments/drums/drums_curriculum.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_lessons.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_exercises.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_patterns.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_songs.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_kits.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_mapping.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_notation.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_progression.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_packs.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_chart_library.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_runtime_adapter.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_rhythm_adapter.js");
    loadScriptOnce("js/sparksuite/instruments/drums/drums_module.js");
  }

  function esc(value) {
    if (typeof escHTML === "function") return escHTML(value == null ? "" : String(value));
    return String(value == null ? "" : value).replace(/[&<>"]/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
    });
  }

  function attr(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function getDrumLessons() {
    ensureDrumRuntime();
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

  function openDrumPracticePlan(lessonId) {
    var request;
    if (!lessonId) return false;
    ensureDrumRuntime();

    try {
      if (window.SparkInstruments && SparkInstruments.activate) {
        SparkInstruments.activate("drumspark");
      }
    } catch (e) {}

    request = {
      instrument: "drums",
      instrumentId: "drumspark",
      instrumentType: "drums",
      appId: "drumspark",
      lessonId: lessonId,
      forceRebuild: true,
      source: "drums-quick-start"
    };

    if (typeof S !== "undefined") {
      S.activeInstrument = "drumspark";
      S.instrument = "drums";
      S.instrumentId = "drumspark";
      S.currentInstrument = "drums";
      S.selectedInstrument = "drumspark";
      S.__sparkForcedLessonRequest = request;
      S.tab = "practice";
      S.screen = typeof SCR !== "undefined" && SCR && SCR.PLAN ? SCR.PLAN : "plan";
    }

    if (typeof openPracticePlanScreenRequest === "function") {
      openPracticePlanScreenRequest(request);
    } else if (typeof act === "function") {
      act("openPracticePlan", lessonId);
    }

    if (typeof render === "function") render();
    return true;
  }

  function startDrumLesson(lessonId) {
    return openDrumPracticePlan(lessonId);
  }

  window.startDrumLesson = startDrumLesson;

  function lessonButton(label, lessonId, className, style) {
    return '<button class="' + (className || "btn") + '" style="' + (style || "") + '" onclick="return startDrumLesson(\'' + attr(lessonId) + '\')">' + esc(label) + "</button>";
  }

  function drumPracticeTab() {
    var lessons = getDrumLessons();
    var next = getNextDrumLesson();
    var html = '<div class="card mb12" style="text-align:center">';
    html += "<h2>DrumSpark</h2>";
    if (next) {
      html += "<div>Next: " + esc(next.title || next.id) + "</div>";
      html += lessonButton("Start Drum Lesson", next.id, "btn", "margin-top:10px");
    }
    html += "</div>";
    html += '<div class="card">';
    for (var i = 0; i < lessons.length; i++) {
      html += '<div style="margin:6px 0">';
      html += esc(lessons[i].title || lessons[i].id);
      html += lessonButton("Start", lessons[i].id, "btn btn-sm", "margin-left:10px");
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function drumStatsTab() {
    var lessons = getDrumLessons();
    return '<div class="card"><div class="card-section-heading">DrumSpark Stats</div><p class="metric-label">Lessons available: ' + lessons.length + '</p></div>';
  }

  ensureDrumRuntime();

  SparkInstruments.register({
    id: "drumspark",
    instrument: "drums",
    name: "Drums",
    icon: "\uD83E\uDD41",
    iconImage: "resources/instruments/drums/card.png",
    heroImage: "resources/instruments/drums/hero.jpg",
    skin: null,
    available: true,
    getData: function() {
      ensureDrumRuntime();
      var curriculum = window.SparkDrumsCurriculum || {};
      return {
        CHORDS: {},
        ALL_CHORDS: {},
        CURRICULUM: window.SparkDrumsLessons || [],
        SKILL_TREE: window.SparkDrumsSkillTree || [],
        LC: curriculum.LC || {},
        LN: curriculum.LN || {},
        SESSIONS: [],
        SONGS: window.SparkDrumsSongs || []
      };
    },
    getLessons: getDrumLessons,
    getCurriculumMap: getDrumLessons,
    getExercises: function(skillOrLessonId) {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getExercises === "function" ? SparkDrumsModule.getExercises(skillOrLessonId) : [];
    },
    getSongs: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getSongs === "function" ? SparkDrumsModule.getSongs() : [];
    },
    getSkillTree: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getSkillTree === "function" ? SparkDrumsModule.getSkillTree() : [];
    },
    getRhythmAdapter: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getRhythmAdapter === "function" ? SparkDrumsModule.getRhythmAdapter() : null;
    },
    getRuntimeAdapter: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getRuntimeAdapter === "function" ? SparkDrumsModule.getRuntimeAdapter() : null;
    },
    pages: {},
    tabs: [
      { id: "practice", label: "Practice" },
      { id: "stats", label: "Stats" }
    ],
    tabRenderers: { practice: drumPracticeTab, stats: drumStatsTab },
    act: function(action) {
      var next;
      if (action !== "quickStart") return false;
      next = getNextDrumLesson();
      return openDrumPracticePlan(next && next.id);
    },
    stemMutePreset: {},
    init: function() {
      ensureDrumRuntime();
      if (typeof S !== "undefined") S.tab = "practice";
    }
  });
})();
