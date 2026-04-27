(function() {
  var MODULES = [
    { name: "Ukulele", key: "ukulele", moduleName: "SparkUkuleleModule" },
    { name: "Guitar", key: "guitar", moduleName: "SparkGuitarModule" },
    { name: "Piano", key: "piano", moduleName: "SparkPianoModule" },
    { name: "Bass", key: "bass", moduleName: "SparkBassModule" },
    { name: "Vocals", key: "vocals", moduleName: "SparkVocalsModule" }
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

  function getSkillProgress() {
    if (typeof S === "undefined" || !S) return {};
    return S.skillProgress || S.skills || S.mastery || S.instrumentSkillProgress || {};
  }

  function getModule(moduleName) {
    return moduleName ? window[moduleName] || null : null;
  }

  function lessonsFor(moduleName) {
    var mod = getModule(moduleName);
    return mod && typeof mod.getLessons === "function" ? mod.getLessons() : [];
  }

  function skillTreeFor(moduleName) {
    var mod = getModule(moduleName);
    var tree = mod && typeof mod.getSkillTree === "function" ? mod.getSkillTree() : [];
    if (Array.isArray(tree)) return tree;
    var out = [];
    for (var k in tree) {
      if (!Object.prototype.hasOwnProperty.call(tree, k)) continue;
      var group = tree[k];
      if (Array.isArray(group)) {
        for (var i = 0; i < group.length; i++) {
          out.push(typeof group[i] === "string" ? { id: group[i], label: group[i], category: k } : group[i]);
        }
      }
    }
    return out;
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

  function skillValue(skillId) {
    var map = getSkillProgress();
    var raw = map && map[skillId];
    if (typeof raw === "number") return clamp(raw);
    if (raw && typeof raw.mastery === "number") return clamp(raw.mastery);
    if (raw && typeof raw.value === "number") return clamp(raw.value);
    if (raw && typeof raw.accuracy === "number") return clamp(raw.accuracy > 1 ? raw.accuracy / 100 : raw.accuracy);
    return null;
  }

  function skillRows(moduleName, limit) {
    var lessons = lessonsFor(moduleName);
    var tree = skillTreeFor(moduleName);
    var seen = {};
    var rows = [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].skill && !seen[lessons[i].skill]) {
        rows.push({ id: lessons[i].skill, label: lessons[i].title || lessons[i].skill, value: skillValue(lessons[i].skill) });
        seen[lessons[i].skill] = true;
      }
    }
    for (var j = 0; j < tree.length; j++) {
      var id = tree[j].id || tree[j].skill || tree[j].label;
      if (id && !seen[id]) {
        rows.push({ id: id, label: tree[j].name || tree[j].label || id, value: skillValue(id) });
        seen[id] = true;
      }
    }
    rows.sort(function(a, b) {
      var av = a.value == null ? -1 : a.value;
      var bv = b.value == null ? -1 : b.value;
      return av - bv;
    });
    return rows.slice(0, limit || 6);
  }

  function renderProgressBar(value) {
    var pct = Math.round(clamp(value || 0) * 100);
    return '<div style="height:8px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:6px">'
      + '<div style="height:100%;width:' + pct + '%;background:currentColor;border-radius:999px"></div>'
      + '</div>';
  }

  function renderInstrumentLessonCard(info) {
    var h = helper();
    var summary = h ? h.summarizeInstrument(info.name, info.moduleName) : null;
    var progress = lessonProgress(info.moduleName);
    var title = summary && summary.nextTitle ? summary.nextTitle : "No lesson loaded";
    var skill = summary && summary.nextSkill ? summary.nextSkill : "";
    var chart = summary && summary.chartId ? summary.chartId : "not mapped";
    return '<section class="card spark-lesson-card">'
      + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">'
      + '<div><b>' + esc(info.name) + '</b><div style="font-size:12px;color:var(--text-muted)">' + progress.completed + '/' + progress.total + ' lessons</div></div>'
      + '<div style="font-size:12px;color:var(--text-muted)">' + Math.round(progress.ratio * 100) + '%</div>'
      + '</div>'
      + renderProgressBar(progress.ratio)
      + '<div style="margin-top:10px;font-weight:800">' + esc(title) + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted)">Skill: ' + esc(skill) + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted)">Chart: ' + esc(chart) + '</div>'
      + '</section>';
  }

  function renderSkillProgressPanel(moduleName, title) {
    var rows = skillRows(moduleName, 8);
    var html = '<section class="card spark-skill-progress-card"><h3>' + esc(title || "Skill progress") + '</h3>';
    if (!rows.length) {
      html += '<p>No skills found yet.</p>';
    }
    for (var i = 0; i < rows.length; i++) {
      var value = rows[i].value == null ? 0 : rows[i].value;
      var pct = rows[i].value == null ? "new" : Math.round(value * 100) + "%";
      html += '<div style="margin:10px 0">'
        + '<div style="display:flex;justify-content:space-between;gap:12px;font-size:13px">'
        + '<span>' + esc(rows[i].label || rows[i].id) + '</span><span>' + esc(pct) + '</span></div>'
        + renderProgressBar(value)
        + '</div>';
    }
    html += '</section>';
    return html;
  }

  function renderLessonDashboard() {
    var cards = [];
    for (var i = 0; i < MODULES.length; i++) {
      if (getModule(MODULES[i].moduleName)) cards.push(renderInstrumentLessonCard(MODULES[i]));
    }
    var html = '<div class="lesson-dashboard">'
      + '<section class="card"><h2>Lesson Dashboard</h2><p style="color:var(--text-muted)">Next lessons, chart routing, and early skill gaps across instruments.</p></section>'
      + '<div class="home-grid">' + cards.map(function(c) { return '<div class="home-grid-item">' + c + '</div>'; }).join("") + '</div>';
    for (var j = 0; j < MODULES.length; j++) {
      if (getModule(MODULES[j].moduleName)) html += renderSkillProgressPanel(MODULES[j].moduleName, MODULES[j].name + ' skill focus');
    }
    html += '</div>';
    return html;
  }

  function renderHomeCard() {
    var loaded = MODULES.filter(function(m) { return !!getModule(m.moduleName); });
    var h = '<div class="card">';
    h += '<div><b>Lesson Dashboard</b></div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + loaded.length + ' instruments loaded</div>';
    for (var i = 0; i < Math.min(loaded.length, 3); i++) {
      var product = helper();
      var summary = product ? product.summarizeInstrument(loaded[i].name, loaded[i].moduleName) : null;
      if (!summary) continue;
      h += '<div style="margin-top:8px"><b>' + esc(loaded[i].name) + '</b>: ' + esc(summary.nextTitle || summary.nextLesson || 'Ready') + '</div>';
      if (summary.nextSkill) h += '<div style="font-size:12px;color:var(--text-muted)">Skill: ' + esc(summary.nextSkill) + '</div>';
    }
    h += '<button onclick="SparkLessonDashboardUI.open()">Open Dashboard</button>';
    h += '</div>';
    return h;
  }

  function open() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = renderLessonDashboard();
    app.style.display = 'block';
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }

  function clamp(value) {
    if (typeof value !== "number" || !isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function esc(value) {
    if (typeof escHTML === "function") return escHTML(value == null ? "" : String(value));
    return String(value == null ? "" : value).replace(/[&<>\"]/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];
    });
  }

  window.SparkLessonDashboardUI = {
    renderHomeCard: renderHomeCard,
    renderLessonDashboard: renderLessonDashboard,
    renderSkillProgressPanel: renderSkillProgressPanel,
    open: open
  };
})();
