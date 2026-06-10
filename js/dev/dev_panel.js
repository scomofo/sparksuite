// js/dev/dev_panel.js
// Unified dockable dev surface for status, curriculum issues, and reload tools.
(function() {
  var enabled = false;
  if (typeof window !== "undefined") {
    if (window.location && window.location.search.indexOf("dev=1") >= 0) enabled = true;
    if (typeof localStorage !== "undefined" && localStorage.getItem("spark_dev_overlay") === "true") enabled = true;
  }
  if (!enabled || typeof document === "undefined") return;

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }

  var state = {
    open: read("spark_dev_panel_open", "true") !== "false",
    dock: read("spark_dev_dock_position", "right") === "left" ? "left" : "right",
    tab: read("spark_dev_active_tab", "issues"),
    type: read("spark_dev_filter_type", "all"),
    severity: read("spark_dev_filter_severity", "all")
  };

  var css = document.createElement("style");
  css.textContent = [
    "#spark-dev-panel{position:fixed;bottom:0;z-index:100000;width:380px;max-width:calc(100vw - 16px);max-height:60vh;background:rgba(10,15,25,.94);color:#dbeafe;font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;border:1px solid rgba(147,197,253,.35);box-shadow:0 18px 50px rgba(0,0,0,.45);overflow:hidden}",
    "#spark-dev-panel.left{left:0;border-top-right-radius:12px}#spark-dev-panel.right{right:0;border-top-left-radius:12px}",
    ".spark-dev-header{display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(59,130,246,.14);font-weight:800}",
    ".spark-dev-header button,.spark-dev-tabs button,.spark-dev-filters button,.spark-dev-action{background:rgba(148,163,184,.16);color:#dbeafe;border:1px solid rgba(148,163,184,.3);border-radius:999px;padding:3px 8px;font:inherit;cursor:pointer}",
    ".spark-dev-header button:hover,.spark-dev-tabs button:hover,.spark-dev-filters button:hover,.spark-dev-action:hover{background:rgba(96,165,250,.25)}",
    ".spark-dev-spacer{flex:1}.spark-dev-tabs,.spark-dev-filters{display:flex;gap:6px;padding:8px 10px;border-bottom:1px solid rgba(148,163,184,.18);flex-wrap:wrap}",
    ".spark-dev-tabs button.active,.spark-dev-filters button.active{background:rgba(96,165,250,.38);border-color:rgba(147,197,253,.7)}",
    ".spark-dev-content{padding:10px;max-height:42vh;overflow:auto}",
    ".spark-dev-row{padding:7px 8px;margin:5px 0;border-radius:8px;background:rgba(15,23,42,.7);border:1px solid rgba(148,163,184,.14);cursor:pointer}",
    ".spark-dev-row:hover{border-color:rgba(147,197,253,.5)}.spark-dev-meta{color:#93c5fd;font-size:11px}.spark-dev-error{color:#fca5a5}.spark-dev-warning{color:#fdba74}.spark-dev-info{color:#cbd5e1}",
    "#spark-dev-badge{position:fixed;bottom:10px;z-index:100001;border-radius:999px;padding:7px 11px;color:#04111f;font:12px/1 ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:900;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.35)}",
    "#spark-dev-badge.left{left:10px}#spark-dev-badge.right{right:10px}"
  ].join("\n");
  document.head.appendChild(css);

  var panel = document.createElement("div");
  panel.id = "spark-dev-panel";
  document.body.appendChild(panel);

  var badge = document.createElement("div");
  badge.id = "spark-dev-badge";
  badge.onclick = function() {
    state.open = true;
    write("spark_dev_panel_open", "true");
    renderPanel();
  };
  document.body.appendChild(badge);

  function activeInstrument() {
    if (typeof SparkInstruments === "undefined" || !SparkInstruments) return null;
    return typeof SparkInstruments.getActive === "function" ? SparkInstruments.getActive() : null;
  }

  function allIssues() {
    var inst = activeInstrument();
    if (!inst || typeof SparkCurriculumValidator === "undefined" || !SparkCurriculumValidator) return [];
    return SparkCurriculumValidator.validateCurriculum(inst);
  }

  function filteredIssues() {
    return allIssues().filter(function(item) {
      var typeOk = state.type === "all" || item.category === state.type || (state.type === "skills" && item.category === "skill") || (state.type === "lessons" && item.category === "lesson") || (state.type === "levels" && item.category === "level");
      var severityOk = state.severity === "all" || item.severity === state.severity || (state.severity === "missing" && item.severity === "error") || (state.severity === "warning" && item.severity === "warning");
      return typeOk && severityOk;
    });
  }

  function setTab(tab) {
    state.tab = tab;
    write("spark_dev_active_tab", tab);
    renderPanel();
  }

  function setFilter(key, value) {
    state[key] = value;
    write(key === "type" ? "spark_dev_filter_type" : "spark_dev_filter_severity", value);
    renderPanel();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function navTo(issue) {
    if (!issue || !issue.nav || typeof S === "undefined" || typeof render !== "function") return;
    if (issue.nav.screen) S.screen = issue.nav.screen;
    if (issue.nav.tab) S.tab = issue.nav.tab;
    if (issue.nav.level != null) S.selectedLevel = issue.nav.level;
    if (issue.nav.focus) S.skillTreeFocus = issue.nav.focus;
    render();
  }

  function headerHtml(issueCount) {
    return "<div class=\"spark-dev-header\"><span>SPARK DEV</span><span class=\"spark-dev-meta\">" + issueCount + " issue(s)</span><span class=\"spark-dev-spacer\"></span><button data-action=\"dock\">Dock " + (state.dock === "right" ? "Left" : "Right") + "</button><button data-action=\"collapse\">Collapse</button></div>";
  }

  function tabsHtml() {
    return "<div class=\"spark-dev-tabs\">" + ["status", "issues", "reload"].map(function(tab) {
      return "<button data-tab=\"" + tab + "\" class=\"" + (state.tab === tab ? "active" : "") + "\">" + tab.charAt(0).toUpperCase() + tab.slice(1) + "</button>";
    }).join("") + "</div>";
  }

  function filtersHtml() {
    if (state.tab !== "issues") return "";
    var typeButtons = ["all", "skills", "lessons", "levels"].map(function(type) {
      return "<button data-type=\"" + type + "\" class=\"" + (state.type === type ? "active" : "") + "\">" + type + "</button>";
    }).join("");
    var severityButtons = ["all", "missing", "warning", "info"].map(function(severity) {
      return "<button data-severity=\"" + severity + "\" class=\"" + (state.severity === severity ? "active" : "") + "\">" + severity + "</button>";
    }).join("");
    return "<div class=\"spark-dev-filters\">" + typeButtons + severityButtons + "</div>";
  }

  function renderStatus() {
    var inst = activeInstrument();
    var manifest = window.SPARK_INSTRUMENT_MANIFEST || [];
    var scripts = document.querySelectorAll("script[src]");
    var instScripts = 0;
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("/instruments/") >= 0 || src.indexOf("/sparksuite/") >= 0) instScripts++;
    }
    return [
      "<div class=\"spark-dev-row\"><strong>Instrument</strong><br><span class=\"spark-dev-meta\">" + escapeHtml(inst ? ((inst.name || inst.id) + " / " + inst.id) : "(none)") + "</span></div>",
      "<div class=\"spark-dev-row\"><strong>Screen</strong><br><span class=\"spark-dev-meta\">" + escapeHtml(typeof S !== "undefined" ? ((S.screen || "?") + " / " + (S.tab || "?")) : "(no state)") + "</span></div>",
      "<div class=\"spark-dev-row\"><strong>Manifest</strong><br><span class=\"spark-dev-meta\">" + manifest.length + " instruments, " + instScripts + " loaded instrument scripts</span></div>"
    ].join("");
  }

  function renderIssues() {
    var issues = filteredIssues();
    if (!issues.length) return "<div class=\"spark-dev-row\"><strong>No matching issues</strong><br><span class=\"spark-dev-meta\">Clean little gremlin cage.</span></div>";
    return issues.map(function(item, index) {
      return "<div class=\"spark-dev-row spark-dev-" + escapeHtml(item.severity) + "\" data-issue=\"" + index + "\"><strong>" + escapeHtml(item.code) + "</strong> <span class=\"spark-dev-meta\">" + escapeHtml(item.severity + " / " + item.category) + "</span><br>" + escapeHtml(item.message) + (item.fix ? "<br><span class=\"spark-dev-meta\">Fix: " + escapeHtml(item.fix) + "</span>" : "") + "</div>";
    }).join("");
  }

  function renderReload() {
    var marker = read("spark_dev_reload_ts", "");
    var label = marker ? new Date(parseInt(marker, 10)).toLocaleTimeString() : "No reload signal seen";
    return "<div class=\"spark-dev-row\"><strong>Last reload</strong><br><span class=\"spark-dev-meta\">" + escapeHtml(label) + "</span></div><button class=\"spark-dev-action\" data-action=\"reload\">Reload now</button>";
  }

  function renderContent() {
    if (state.tab === "status") return renderStatus();
    if (state.tab === "reload") return renderReload();
    return renderIssues();
  }

  function renderPanel() {
    var issueCount = allIssues().length;
    panel.className = state.dock;
    badge.className = state.dock;
    badge.style.background = issueCount > 0 ? "#fca5a5" : "#86efac";
    badge.textContent = issueCount > 0 ? "DEV " + issueCount : "DEV OK";
    panel.style.display = state.open ? "block" : "none";
    badge.style.display = state.open ? "none" : "block";
    if (!state.open) return;
    panel.innerHTML = headerHtml(issueCount) + tabsHtml() + filtersHtml() + "<div class=\"spark-dev-content\">" + renderContent() + "</div>";
  }

  panel.onclick = function(event) {
    var target = event.target;
    if (!target) return;
    if (target.dataset.action === "collapse") {
      state.open = false;
      write("spark_dev_panel_open", "false");
      renderPanel();
    } else if (target.dataset.action === "dock") {
      state.dock = state.dock === "right" ? "left" : "right";
      write("spark_dev_dock_position", state.dock);
      renderPanel();
    } else if (target.dataset.action === "reload") {
      window.location.reload();
    } else if (target.dataset.tab) {
      setTab(target.dataset.tab);
    } else if (target.dataset.type) {
      setFilter("type", target.dataset.type);
    } else if (target.dataset.severity) {
      setFilter("severity", target.dataset.severity);
    }

    var row = target.closest ? target.closest("[data-issue]") : null;
    if (row) navTo(filteredIssues()[parseInt(row.dataset.issue, 10)]);
  };

  function hideLegacyPanels() {
    var oldOverlay = document.getElementById("spark-dev-overlay");
    var oldNav = document.getElementById("spark-dev-error-nav");
    if (oldOverlay) oldOverlay.style.display = "none";
    if (oldNav) oldNav.style.display = "none";
  }

  renderPanel();
  hideLegacyPanels();
  setInterval(function() {
    hideLegacyPanels();
    renderPanel();
  }, 2000);
})();
