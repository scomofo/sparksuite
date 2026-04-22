// js/dev/dev_curriculum_highlighter.js
// Inline highlights broken skills/lessons in the UI.
// Activated by: ?dev=1 or localStorage spark_dev_overlay=true
(function() {
  var enabled = false;
  if (typeof window !== "undefined") {
    if (window.location && window.location.search.indexOf("dev=1") >= 0) enabled = true;
    if (typeof localStorage !== "undefined" && localStorage.getItem("spark_dev_overlay") === "true") enabled = true;
  }
  if (!enabled) return;

  function getIssues() {
    var issues = { skills: {}, lessons: {}, levels: {} };
    var inst = typeof SparkInstruments !== "undefined" ? SparkInstruments.getActive() : null;
    if (!inst) return issues;
    var map = typeof inst.getCurriculumMap === "function" ? inst.getCurriculumMap() : [];
    var data = typeof inst.getData === "function" ? inst.getData() : {};
    var exercises = typeof inst.getExercises === "function" ? inst.getExercises() : [];
    var tree = typeof inst.getSkillTree === "function" ? inst.getSkillTree() : null;
    var lc = data.LC || {}, ln = data.LN || {};
    var skillIds = [];
    function cs(n) { if (n.id) skillIds.push(n.id); if (Array.isArray(n.nodes)) n.nodes.forEach(cs); if (Array.isArray(n.children)) n.children.forEach(cs); }
    if (tree) { if (Array.isArray(tree.branches)) tree.branches.forEach(cs); else if (Array.isArray(tree)) tree.forEach(cs); }
    var exSkills = {};
    exercises.forEach(function(e) { if (e.skill) exSkills[e.skill] = true; });
    map.forEach(function(lesson) {
      var lid = lesson.id || ("level_" + lesson.num);
      var li = [];
      if (lesson.skill && skillIds.indexOf(lesson.skill) < 0) {
        li.push("skill " + lesson.skill + " not in tree");
        issues.skills[lesson.skill] = issues.skills[lesson.skill] || [];
        issues.skills[lesson.skill].push("ref by " + lid + ", missing from tree");
      }
      if (lesson.skill && !exSkills[lesson.skill]) li.push("no exercises for " + lesson.skill);
      if (Array.isArray(lesson.prerequisites)) lesson.prerequisites.forEach(function(p) {
        if (skillIds.indexOf(p) < 0) {
          li.push("prereq " + p + " missing");
          issues.skills[p] = issues.skills[p] || [];
          issues.skills[p].push("prereq of " + lid + ", missing");
        }
      });
      if (Array.isArray(lesson.chords) && data.ALL_CHORDS) {
        var cn = Object.keys(data.ALL_CHORDS);
        lesson.chords.forEach(function(ch) { if (cn.indexOf(ch) < 0) li.push("chord " + ch + " not in data"); });
      }
      if (li.length) issues.lessons[lid] = li;
      if (lesson.num != null) {
        var vi = [];
        if (!lc[lesson.num]) vi.push("missing LC color");
        if (!ln[lesson.num]) vi.push("missing LN name");
        if (vi.length) issues.levels[lesson.num] = vi;
      }
    });
    skillIds.forEach(function(sid) {
      if (!exSkills[sid]) { issues.skills[sid] = issues.skills[sid] || []; issues.skills[sid].push("no exercises"); }
    });
    return issues;
  }

  var WARN = "outline:2px dashed #ef4444;outline-offset:-2px;";
  var TIP = "font-size:10px;color:#ef4444;margin-top:2px;font-weight:600;";

  // Patch renderSkillTreeNode
  if (typeof renderSkillTreeNode === "function") {
    var origNode = renderSkillTreeNode;
    window.renderSkillTreeNode = function(node, depth) {
      var html = origNode(node, depth);
      var issues = getIssues();
      if (node.id && issues.skills[node.id]) {
        var msgs = issues.skills[node.id];
        html = html.replace("border-left:5px solid", WARN + "border-left:5px solid");
        var tip = "<div style=\"" + TIP + "\">⚠ " + msgs.join("; ") + "</div>";
        var lc = html.lastIndexOf("</div>");
        if (lc > 0) html = html.slice(0, lc) + tip + html.slice(lc);
      }
      return html;
    };
  }

  // CSS for broken level tabs
  var st = document.createElement("style");
  st.textContent = ".lvl-tab-broken{outline:2px dashed #ef4444!important;outline-offset:-2px}";
  document.head.appendChild(st);

  // MutationObserver to highlight level tabs and chord cards
  var obs = new MutationObserver(function() {
    var issues = getIssues();
    // Level tabs
    var tabs = document.querySelectorAll(".lvl-tab");
    for (var i = 0; i < tabs.length; i++) {
      var lbl = tabs[i].getAttribute("aria-label") || "";
      var m = lbl.match(/Level (d+)/);
      if (m) {
        var lv = parseInt(m[1]);
        if (issues.levels[lv]) {
          tabs[i].classList.add("lvl-tab-broken");
          tabs[i].title = issues.levels[lv].join(", ");
        } else {
          tabs[i].classList.remove("lvl-tab-broken");
          tabs[i].title = "";
        }
      }
    }
    // Chord cards
    var cards = document.querySelectorAll(".chord-card");
    for (var j = 0; j < cards.length; j++) {
      var h3 = cards[j].querySelector("h3");
      if (!h3) continue;
      var cn = h3.textContent.trim();
      var broken = false;
      for (var lid in issues.lessons) {
        for (var k = 0; k < issues.lessons[lid].length; k++) {
          if (issues.lessons[lid][k].indexOf(cn) >= 0) { broken = true; break; }
        }
        if (broken) break;
      }
      if (broken && !cards[j].dataset.devMarked) {
        cards[j].style.outline = "2px dashed #ef4444";
        cards[j].style.outlineOffset = "-2px";
        cards[j].dataset.devMarked = "1";
      }
    }
  });

  function startObs() {
    var t = document.getElementById("main") || document.body;
    obs.observe(t, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startObs);
  else startObs();

  // Console summary
  setTimeout(function() {
    var issues = getIssues();
    var total = Object.keys(issues.skills).length + Object.keys(issues.lessons).length + Object.keys(issues.levels).length;
    if (total > 0) {
      console.log("[dev-highlighter] " + total + " curriculum issues:");
      for (var s in issues.skills) console.log("  Skill " + s + ": " + issues.skills[s].join("; "));
      for (var l in issues.lessons) console.log("  Lesson " + l + ": " + issues.lessons[l].join("; "));
      for (var v in issues.levels) console.log("  Level " + v + ": " + issues.levels[v].join("; "));
    } else {
      console.log("[dev-highlighter] No curriculum issues.");
    }
  }, 1000);


  // ── Clickable Error Navigation Panel ──

  var navPanel = document.createElement("div");
  navPanel.id = "spark-dev-error-nav";
  navPanel.style.cssText = "position:fixed;bottom:0;left:0;z-index:99998;background:rgba(20,0,0,0.92);color:#f87171;font:11px/1.5 monospace;padding:0;max-width:380px;max-height:50vh;overflow-y:auto;border-top-right-radius:8px;transition:height 0.2s;";

  var navToggle = document.createElement("div");
  navToggle.style.cssText = "padding:6px 12px;cursor:pointer;font-weight:900;font-size:12px;color:#fca5a5;background:rgba(239,68,68,0.15);user-select:none;";
  navToggle.textContent = "⚠ Curriculum Issues";
  navPanel.appendChild(navToggle);

  var navList = document.createElement("div");
  navList.style.cssText = "padding:4px 10px 10px;display:none;";
  navPanel.appendChild(navList);

  var navOpen = false;
  navToggle.onclick = function() {
    navOpen = !navOpen;
    navList.style.display = navOpen ? "block" : "none";
    if (navOpen) refreshNavList();
  };

  function navTo(screen, extra) {
    if (typeof S === "undefined" || typeof render !== "function") return;
    if (screen === "skillTree") {
      S.screen = "skillTree";
      if (extra && extra.focus) S.skillTreeFocus = extra.focus;
    } else if (screen === "practice") {
      S.screen = "home";
      S.tab = "practice";
      if (extra && extra.level) S.selectedLevel = extra.level;
    }
    render();
  }

  function makeRow(icon, label, detail, onclick) {
    var row = document.createElement("div");
    row.style.cssText = "padding:4px 6px;margin:2px 0;border-radius:4px;cursor:pointer;background:rgba(239,68,68,0.08);pointer-events:auto;";
    row.onmouseenter = function() { row.style.background = "rgba(239,68,68,0.2)"; };
    row.onmouseleave = function() { row.style.background = "rgba(239,68,68,0.08)"; };
    row.onclick = onclick;
    row.innerHTML = "<span style='font-size:13px'>" + icon + "</span> <strong>" + label + "</strong><br><span style='color:#fca5a5;font-size:10px'>" + detail + "</span>";
    return row;
  }

  function refreshNavList() {
    var issues = getIssues();
    navList.innerHTML = "";
    var count = 0;

    // Skills
    for (var sid in issues.skills) {
      var msgs = issues.skills[sid];
      navList.appendChild(makeRow(
        "🎯", sid, msgs.join("; "),
        (function(s) { return function() { navTo("skillTree", { focus: "overview" }); }; })(sid)
      ));
      count++;
    }

    // Lessons
    for (var lid in issues.lessons) {
      var lmsgs = issues.lessons[lid];
      // Try to extract level num from lesson id
      var lvlNum = null;
      var numMatch = lid.match(/(d+)/);
      if (numMatch) lvlNum = parseInt(numMatch[1]);
      navList.appendChild(makeRow(
        "📖", lid, lmsgs.join("; "),
        (function(lv) { return function() { if (lv) navTo("practice", { level: lv }); else navTo("skillTree"); }; })(lvlNum)
      ));
      count++;
    }

    // Levels
    for (var lv in issues.levels) {
      navList.appendChild(makeRow(
        "🔢", "Level " + lv, issues.levels[lv].join("; "),
        (function(l) { return function() { navTo("practice", { level: parseInt(l) }); }; })(lv)
      ));
      count++;
    }

    if (count === 0) {
      navList.innerHTML = "<div style='color:#4ade80;padding:4px'>✅ No issues</div>";
    }
    navToggle.textContent = "⚠ Curriculum Issues (" + count + ")";
  }

  document.body.appendChild(navPanel);
  // Refresh on render
  var origRender = typeof render === "function" ? render : null;
  if (origRender) {
    window.render = function() {
      var result = origRender.apply(this, arguments);
      if (navOpen) setTimeout(refreshNavList, 100);
      return result;
    };
  }
  setTimeout(function() { refreshNavList(); navToggle.click(); }, 1500);
})();
