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
    if (typeof S !== "undefined") {
      S.__sparkForcedLessonRequest = {
        lessonId: lessonId,
        instrumentType: "drumspark",
        createdAt: Date.now()
      };
      S.__activeLessonId = lessonId;
      S.activeInstrument = "drumspark";
      S.tab = "practice";
    }
    try {
      if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
        window.sparkCore.startSession({ flow: "daily_practice", forceRebuild: true });
      } else if (typeof act === "function") {
        act("openPracticePlan");
      }
    } catch (e) {
      console.error("DrumSpark: failed to start lesson", e);
    }
  }

  function installActionBridge() {
    if (window.__sparkDrumActionBridgeInstalled) return;
    window.__sparkDrumActionBridgeInstalled = true;
    var tryInstall = function() {
      if (typeof window.act !== "function") return false;
      if (window.act.__sparkDrumWrapped) return true;
      var originalAct = window.act;
      var wrapped = function(action, value) {
        if (action === "startDrumLesson") {
          startDrumLesson(value);
          return;
        }
        return originalAct.apply(this, arguments);
      };
      wrapped.__sparkDrumWrapped = true;
      window.act = wrapped;
      return true;
    };
    if (tryInstall()) return;
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      if (tryInstall() || tries > 40) clearInterval(timer);
    }, 100);
  }

  function lessonButton(label, lessonId, className, style) {
    return '<button class="' + (className || 'btn') + '" style="' + (style || '') + '" onclick="act(\'startDrumLesson\',\'' + esc(lessonId) + '\')">' + esc(label) + '</button>';
  }

  function drumPracticeTab() {
    ensureDrumRuntime();
    installActionBridge();
    var lessons = window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function" ? SparkDrumsModule.getLessons() : [];
    var next = getNextDrumLesson();
    var html = '<div class="card mb12" style="text-align:center">';
    html += '<div style="font-size:32px;margin-bottom:6px">&#129345;</div>';
    html += '<h2 style="margin:0 0 6px">DrumSpark</h2>';
    html += '<div class="muted">Kick, snare, hat, and timing-first practice.</div>';
    if (next) {
      html += '<div style="margin-top:12px;font-weight:800">Next: ' + esc(next.title || next.id) + '</div>';
      html += '<div style="font-size:12px;color:var(--text-muted)">Skill: ' + esc(next.skill || "timing") + '</div>';
      html += lessonButton('Start Drum Lesson', next.id, 'btn', 'margin-top:12px;background:var(--accent);color:#fff');
    }
    html += '</div>';
    html += '<div class="card"><h3 style="margin-top:0">Foundations</h3>';
    for (var i = 0; i < lessons.length; i++) {
      html += '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--border);padding:8px 0">';
      html += '<div><b>' + esc(lessons[i].title || lessons[i].id) + '</b><div style="font-size:12px;color:var(--text-muted)">' + esc(lessons[i].skill || "") + '</div></div>';
      html += lessonButton('Start', lessons[i].id, 'btn btn-sm', '');
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  ensureDrumRuntime();
  installActionBridge();

  window.SparkDrumRegister = {
    ensureRuntime: ensureDrumRuntime,
    startLesson: startDrumLesson,
    practiceTab: drumPracticeTab
  };

  SparkInstruments.register({
    id: "drumspark",
    instrument: "drums",
    name: "Drums",
    icon: "\uD83E\uDD41",
    iconImage: "resources/instruments/drums/card.png",
    heroImage: "resources/instruments/drums/hero.jpg",
    skin: null,
    available: true,
    getData: function() { return {}; },
    getLessons: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getLessons === "function" ? SparkDrumsModule.getLessons() : [];
    },
    getSkillTree: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getSkillTree === "function" ? SparkDrumsModule.getSkillTree() : [];
    },
    getRhythmAdapter: function() {
      ensureDrumRuntime();
      return window.SparkDrumsModule && typeof SparkDrumsModule.getRhythmAdapter === "function" ? SparkDrumsModule.getRhythmAdapter() : null;
    },
    act: function(action, value) {
      if (action === "startDrumLesson") {
        startDrumLesson(value);
        return true;
      }
      return false;
    },
    pages: {},
    tabs: [{ id: "practice", label: "Practice", icon: "&#129345;" }],
    tabRenderers: {
      practice: function() { return drumPracticeTab(); }
    },
    stemMutePreset: {},
    init: function() {
      ensureDrumRuntime();
      installActionBridge();
      if (typeof S !== "undefined") S.tab = "practice";
    }
  });
})();
