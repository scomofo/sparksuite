// js/showroom/spark-showroom.js
// All Showroom-style screen modules (Settings, Profile, SongDetails,
// PracticeMetro, SongLibrary, SessionSummary, Performance, Lesson, Path).
// Each module exposes a `render(opts)` returning HTML and is dispatched
// via SparkInstruments.openLauncherView('view').
(function() {

  // ─── Shared helpers ────────────────────────────────────────────────────
  function escHtml(s) {
    if (s == null) return "";
    if (typeof escHTML === "function") return escHTML(String(s));
    return String(s).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c];
    });
  }
  // Format a value as a single-quoted JS string literal safe to drop
  // inside a double-quoted HTML attribute (onclick="..."). Using
  // JSON.stringify here (which produces double quotes) would break the
  // surrounding attribute — unescaped " inside " ends the value early,
  // producing invalid HTML and a non-functional handler in some browsers.
  function jsArg(s) {
    return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  }

  function nav(view) {
    return "SparkShowroomNavigate(" + jsArg(view) + ")";
  }
  // Back arrow on sub-pages (Settings, Profile, etc.). Inside an instrument
  // this returns to the instrument's Practice page so users don't get dropped
  // out of instrument context. Outside, it goes to the launcher showcase.
  // The bottom-nav "Home" tab still uses nav("home") which intentionally
  // returns to the launcher.
  function backToHome() { return nav("back"); }

  // Context-aware navigation. When an instrument is active, route via the
  // legacy SCR/TAB system so each Showroom page becomes the actual page for
  // its app area. When no instrument is active, fall back to the launcher's
  // openLauncherView dispatcher.
  window.SparkShowroomNavigate = function(view) {
    var hasInst = typeof S !== "undefined" && S.activeInstrument;
    var SCR_ = typeof SCR !== "undefined" ? SCR : null;
    var TAB_ = typeof TAB !== "undefined" ? TAB : null;
    if (hasInst && SCR_ && TAB_) {
      var routes = {
        // "home" universally means the instrument-showcase launcher.
        "home":            function(){ SparkInstruments.deactivate(); S.activeInstrument = null; S._showroomOverride = null; S.launcherView = "home"; },
        // "back" — return to instrument Practice from a sub-page without
        // dropping the user out of the instrument context.
        "back":            function(){ S.screen = SCR_.HOME;       S.tab = TAB_.PRACTICE; },
        "practice":        function(){ S.screen = SCR_.HOME;       S.tab = TAB_.PRACTICE; },
        "library":         function(){ S.screen = SCR_.HOME;       S.tab = TAB_.SONGS; },
        "tuner":           function(){ S.screen = SCR_.HOME;       S.tab = TAB_.TUNER || "tuner"; },
        "settings":        function(){ S.screen = SCR_.SETTINGS; },
        "path":            function(){ S.screen = SCR_.SKILL_TREE; },
        "learn":           function(){ S.screen = SCR_.SKILL_TREE; },
        "song-details":    function(){ S.screen = SCR_.SONG; },
        "session-summary": function(){ S.screen = SCR_.COMPLETE; },
        // Performance gameplay stays in the legacy engine. Call sites that
        // have real chart context (Song Details, Replay Session) use
        // act("showroomStartPerf") directly; this nav("performance") is the
        // safe fallback for CTAs that don't yet have a canonical binding
        // (Library Daily, Lesson) — they land on the practice home so the
        // user can pick their own chart instead of launching a wrong one.
        "performance":     function(){ S.screen = SCR_.HOME;       S.tab = TAB_.PRACTICE; },
        // No legacy slots — render via launcherView while keeping instrument.
        "profile":         function(){ S._showroomOverride = "profile"; },
        "lesson":          function(){ S._showroomOverride = "lesson"; },
        // Explicit "switch instrument" action.
        "instruments":     function(){ SparkInstruments.deactivate(); S.activeInstrument = null; S._showroomOverride = null; }
      };
      // Clear any prior override so the legacy slot routing wins again.
      if (view !== "profile" && view !== "lesson") S._showroomOverride = null;
      var fn = routes[view];
      if (fn) fn();
      if (typeof saveState === "function") saveState();
      if (typeof render === "function") render();
      return;
    }
    if (typeof SparkInstruments !== "undefined" && SparkInstruments.openLauncherView) {
      // Outside an instrument, "back" means return to the launcher showcase.
      SparkInstruments.openLauncherView(view === "back" ? "home" : view);
    }
  };

  // Reusable bottom nav generator
  function bottomNav(items, active) {
    var inner = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var isActive = it.id === active;
      var onClick = it.onClick || nav(it.id);
      inner += '<button class="showroom-navitem' + (isActive ? ' active' : '') + '"'
            + ' onclick="' + onClick + '" aria-label="' + escHtml(it.label) + '"'
            + (isActive ? ' aria-current="page"' : '') + '>'
            + '<span class="material-symbols-outlined' + (isActive ? ' fill' : '') + '">' + it.icon + '</span>'
            + '<span>' + escHtml(it.label) + '</span>'
            + '</button>';
    }
    return '<nav class="showroom-bottomnav" role="navigation" aria-label="Primary">'
         + '<div class="showroom-bottomnav-inner">' + inner + '</div></nav>';
  }

  // Load setting flags from localStorage with safe fallback
  function loadFlags() {
    try {
      var raw = localStorage.getItem("spark.showroomFlags");
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  }
  function saveFlags(flags) {
    try { localStorage.setItem("spark.showroomFlags", JSON.stringify(flags)); } catch (e) {}
  }
  // Showroom-only flag toggle. Used by settings rows that don't have a
  // canonical S.* / act() handler yet (Reduce Transparency, Push
  // Notifications, Email Updates). Toggles that DO have canonical state
  // — like Dark Mode — should call act("toggleDark") instead so the
  // legacy header, body.light class, and saveState() all stay in sync
  // (CLAUDE.md: "UI as dumb renderer of session state").
  function toggleFlag(key) {
    var f = loadFlags();
    f[key] = !f[key];
    saveFlags(f);
    if (typeof render === "function") render();
  }
  window.SparkShowroomToggle = toggleFlag;

  // Build the inline onclick string for a settings toggle. Routes to the
  // canonical act() handler when one exists for the given key; otherwise
  // falls back to the showroom-only flag store via SparkShowroomToggle.
  // Keeps the row-render code uniform across both kinds of toggles.
  function toggleOnClick(key) {
    if (key === "dark") return "act('toggleDark')";
    return "SparkShowroomToggle(" + jsArg(key) + ")";
  }

  // ───────────────────────────────────────────────────────────────────────
  // Settings
  // ───────────────────────────────────────────────────────────────────────
  function settingsRender() {
    var flags = loadFlags();
    // Dark Mode reads from the canonical S.darkMode (set by act("toggleDark"))
    // — NOT from the showroom flag store — so the toggle reflects the actual
    // theme even after a legacy header change.
    var darkOn = (typeof S !== "undefined" && typeof S.darkMode === "boolean")
      ? S.darkMode
      : (flags.dark !== false); // fallback for tests / launcher-only contexts
    var reduceTransp = !!flags.reduceTransparency;
    var pushOn = flags.pushNotifications !== false;
    var emailOn = !!flags.emailUpdates;
    var micPct = typeof flags.micSensitivity === "number" ? flags.micSensitivity : 85;
    var latency = typeof flags.latencyMs === "number" ? flags.latencyMs : 12;

    var sections = [
      { title: "Account", rows: [
        { icon: "person", label: "Profile Details", chevron: true, onClick: nav("profile") },
        { icon: "workspace_premium", label: "Subscription Plan", chevron: true, badge: "Pro" }
      ]},
      { title: "Audio & Input", rows: [
        { type: "slider", icon: "mic", label: "Microphone Sensitivity", value: micPct + "%", pct: micPct },
        { icon: "tune", label: "Latency Calibration", chevron: true, meta: latency + "ms", metaWarn: true }
      ]},
      { title: "Appearance", rows: [
        // Dark Mode is wired to the canonical act("toggleDark") handler so
        // flipping it here also updates the legacy header, body.light
        // class, and persisted S.darkMode state.
        { type: "toggle", icon: "dark_mode", label: "Dark Mode", on: darkOn, key: "dark" },
        { type: "toggle", icon: "blur_on", label: "Reduce Transparency", on: reduceTransp, key: "reduceTransparency" }
      ]},
      { title: "Notifications", rows: [
        { type: "toggle", icon: "notifications_active", label: "Push Notifications", on: pushOn, key: "pushNotifications" },
        { type: "toggle", icon: "mail", label: "Email Updates", on: emailOn, key: "emailUpdates" }
      ]}
    ];

    var html = "";
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      html += '<div><h2 class="showroom-cat-label">' + escHtml(sec.title) + '</h2>';
      html += '<div class="showroom-list">';
      for (var r = 0; r < sec.rows.length; r++) {
        var row = sec.rows[r];
        if (row.type === "slider") {
          html += '<div class="showroom-slider-row">';
          html += '<div class="showroom-slider-head"><div class="showroom-row-left">';
          html += '<span class="material-symbols-outlined showroom-row-icon">' + row.icon + '</span>';
          html += '<span class="showroom-row-label">' + escHtml(row.label) + '</span>';
          html += '</div><span class="showroom-row-meta">' + escHtml(row.value) + '</span></div>';
          html += '<div class="showroom-slider-track"><div class="showroom-slider-fill" style="width:' + row.pct + '%"></div></div>';
          html += '</div>';
        } else if (row.type === "toggle") {
          html += '<div class="showroom-row no-action">';
          html += '<div class="showroom-row-left">';
          // Decorative icon — the row label below is the announced text.
          html += '<span class="material-symbols-outlined showroom-row-icon' + (row.on ? ' active' : '') + '" aria-hidden="true">' + row.icon + '</span>';
          html += '<span class="showroom-row-label">' + escHtml(row.label) + '</span>';
          html += '</div>';
          // role="switch" + aria-checked is the canonical ARIA pattern for an
          // on/off control; aria-pressed is for buttons that toggle a state
          // distinct from their primary action. Screen readers announce
          // role=switch as "switch, on/off" which matches the visual.
          // toggleOnClick(key) routes Dark Mode through the canonical
          // act("toggleDark") handler and other toggles through the
          // showroom-only flag store.
          html += '<button class="showroom-toggle' + (row.on ? ' on' : '') + '" type="button" role="switch" aria-checked="' + row.on + '" onclick="' + toggleOnClick(row.key) + '" aria-label="' + escHtml(row.label) + '">';
          html += '<span class="showroom-toggle-knob" aria-hidden="true"></span></button>';
          html += '</div>';
        } else {
          var click = row.onClick ? ' onclick="' + row.onClick + '"' : '';
          html += '<div class="showroom-row"' + click + '>';
          html += '<div class="showroom-row-left">';
          html += '<span class="material-symbols-outlined showroom-row-icon">' + row.icon + '</span>';
          html += '<span class="showroom-row-label">' + escHtml(row.label) + '</span>';
          html += '</div><div class="showroom-row-right">';
          if (row.badge) html += '<span class="showroom-pill-pro">' + escHtml(row.badge) + '</span>';
          if (row.meta) html += '<span class="showroom-row-meta' + (row.metaWarn ? ' warn' : '') + '">' + escHtml(row.meta) + '</span>';
          if (row.chevron) html += '<span class="material-symbols-outlined showroom-chev">chevron_right</span>';
          html += '</div></div>';
        }
      }
      html += '</div></div>';
    }
    html += '<div class="showroom-version"><span class="showroom-version-label">System Core</span><span class="showroom-version-num">v2.4.1</span></div>';

    var navItems = [
      { id:"flow",     label:"Flow",     icon:"waves",       onClick: nav("home") },
      { id:"library",  label:"Library",  icon:"music_note",  onClick: nav("library") },
      { id:"insights", label:"Insights", icon:"insights",    onClick: nav("home") },
      { id:"settings", label:"Settings", icon:"settings" }
    ];

    return '<div class="showroom-root with-bg">'
         + '<header class="showroom-appbar"><div class="showroom-appbar-left">'
         + '<button class="showroom-iconbtn" onclick="' + backToHome() + '" aria-label="Back"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span></button>'
         + '<h1 class="showroom-appbar-title">Settings</h1></div><div class="showroom-appbar-right"><div style="width:32px"></div></div></header>'
         + '<div class="showroom-canvas">' + html + '</div>'
         + bottomNav(navItems, "settings")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Profile
  // ───────────────────────────────────────────────────────────────────────
  function profileRender() {
    var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
    var name = (profile && (profile.displayName || profile.name)) || "Alex Chen";
    var tag = (profile && profile.title) || "Virtuoso";
    var totalXp = 0, maxStreak = 0, mastered = 0, level = 1;
    if (profile && profile.apps) {
      for (var id in profile.apps) {
        var st = (profile.apps[id] || {}).stats || {};
        totalXp += st.xp || 0;
        if ((st.streakDays || 0) > maxStreak) maxStreak = st.streakDays;
        if ((st.level || 0) > level) level = st.level;
        if (st.skills && typeof st.skills.mastered === "number") mastered += st.skills.mastered;
      }
    }
    if (!totalXp) totalXp = 12450;
    if (!maxStreak) maxStreak = 42;
    if (!mastered) mastered = 18;
    if (level < 12) level = 12;
    var avatarSrc = profile && (profile.avatarImage || profile.avatarUrl);
    // No external-URL fallback — the app-wide CSP (`img-src 'self' data:`)
    // blocks remote hosts. When avatarSrc is absent the renderer below
    // falls through to the initial-letter bubble, which stays same-origin.

    // Per-instrument progress (read from registry + profile or stub)
    var insts = (typeof SparkInstruments !== "undefined" && SparkInstruments.getAll) ? SparkInstruments.getAll() : [];
    var progressRows = [];
    var fallback = [
      { name:"Guitar", icon:"graphic_eq", color:"#FF2D55", pct:80 },
      { name:"Piano",  icon:"piano",      color:"#0EA5E9", pct:30 },
      { name:"Bass",   icon:"speaker",    color:"#7C3AED", pct:15 }
    ];
    if (!insts.length) progressRows = fallback;
    else {
      for (var i = 0; i < insts.length; i++) {
        var inst = insts[i];
        var type = inst.instrument || inst.id || "guitar";
        var stats = profile && profile.apps && profile.apps[inst.id] ? profile.apps[inst.id].stats : {};
        var pct = stats && typeof stats.progressPct === "number"
          ? stats.progressPct
          : (fallback.find ? (fallback.find(function(f){ return f.name.toLowerCase() === type; }) || {pct:0}).pct : 0);
        var color = type === "piano" ? "#0EA5E9"
                  : type === "bass" ? "#7C3AED"
                  : type === "ukulele" ? "#14B8A6" : "#FF2D55";
        var icon = type === "piano" ? "piano"
                 : type === "bass" ? "speaker"
                 : type === "ukulele" ? "music_note" : "graphic_eq";
        progressRows.push({ name: inst.name || type, icon: icon, color: color, pct: pct });
      }
    }

    var avatarHtml = avatarSrc
      ? '<img src="' + escHtml(avatarSrc) + '" alt="">'
      : '<div class="showroom-profile-avatar-fallback">' + escHtml(name.charAt(0).toUpperCase()) + '</div>';

    var progHtml = "";
    for (var p = 0; p < progressRows.length; p++) {
      var pr = progressRows[p];
      progHtml += '<div class="showroom-progress-row">'
              + '<div class="showroom-progress-head">'
              + '<div class="showroom-progress-name">'
              + '<span class="material-symbols-outlined fill" style="color:' + pr.color + ';font-size:18px">' + pr.icon + '</span>'
              + '<span>' + escHtml(pr.name) + '</span></div>'
              + '<span class="showroom-progress-pct">' + pr.pct + '%</span></div>'
              + '<div class="showroom-progress-track"><div class="showroom-progress-fill" style="width:' + pr.pct + '%;background:' + pr.color + ';box-shadow:0 0 10px ' + pr.color + '"></div></div>'
              + '</div>';
    }

    var badges = [
      { icon:"music_cast", color:"#FFE66D", label:"First Chord", state:"" },
      { icon:"dark_mode",  color:"#7C3AED", label:"Night Owl",   state:"" },
      { icon:"bolt",       color:"#ff7b3a", label:"7-Day Spark", state:"featured" },
      { icon:"lock",       color:"#7A7060", label:"Rhythm King", state:"locked" }
    ];
    var badgesHtml = "";
    for (var b = 0; b < badges.length; b++) {
      var bd = badges[b];
      badgesHtml += '<div class="showroom-badge ' + bd.state + '">'
                  + '<div class="showroom-badge-circle" style="border-color:' + bd.color + '40;background:' + bd.color + '14">'
                  + '<span class="material-symbols-outlined fill" style="color:' + bd.color + ';font-size:24px">' + bd.icon + '</span></div>'
                  + '<span class="showroom-badge-label">' + escHtml(bd.label) + '</span></div>';
    }

    var navItems = [
      { id:"home",     label:"Practice",    icon:"music_note", onClick: nav("home") },
      { id:"journey",  label:"Journey",     icon:"explore",    onClick: nav("path") },
      { id:"leaderboard", label:"Leaderboard", icon:"military_tech", onClick: nav("library") },
      { id:"profile",  label:"Profile",     icon:"person" }
    ];

    // Stitch 2026-04 "Profile" redesign — glass cards, inset-carved
    // progress tracks, ember-glow featured badge, centered "Profile"
    // accent-colored title, warm radial wash behind the canvas.
    return '<div class="showroom-root with-bg showroom-profile-ember">'
         + '<div class="showroom-profile-ember-wash" aria-hidden="true"></div>'
         + '<header class="showroom-appbar showroom-profile-ember-appbar">'
         + '<div class="showroom-appbar-left"><button class="showroom-iconbtn accent" onclick="' + nav("home") + '" aria-label="Menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button></div>'
         + '<h1 class="showroom-appbar-title centered showroom-profile-ember-title">Profile</h1>'
         + '<div class="showroom-appbar-right"><button class="showroom-iconbtn showroom-profile-ember-settings" onclick="' + nav("settings") + '" aria-label="Settings"><span class="material-symbols-outlined" aria-hidden="true">settings</span></button></div>'
         + '</header>'
         + '<div class="showroom-canvas showroom-profile-ember-canvas">'
           + '<section class="showroom-profile-head showroom-profile-ember-head">'
             + '<div class="showroom-profile-avatar showroom-profile-ember-avatar">' + avatarHtml
               + '<span class="showroom-profile-lvl-badge showroom-profile-ember-lvl">LVL ' + level + '</span></div>'
             + '<div class="showroom-profile-ember-identity">'
               + '<h2 class="showroom-profile-name showroom-profile-ember-name">' + escHtml(name) + '</h2>'
               + '<p class="showroom-profile-tag showroom-profile-ember-tag">' + escHtml(tag) + '</p></div>'
           + '</section>'
           + '<section class="showroom-profile-stats showroom-profile-ember-stats">'
             + '<div class="showroom-stat-big showroom-profile-ember-stat-big glass-card">'
               + '<span class="material-symbols-outlined fill showroom-stat-big-icon showroom-profile-ember-streak-icon">local_fire_department</span>'
               + '<div class="showroom-stat-big-num showroom-profile-ember-stat-num">' + maxStreak + '</div>'
               + '<div class="showroom-stat-big-label showroom-profile-ember-stat-label">Day Streak</div></div>'
             + '<div class="showroom-stat-stack">'
               + '<div class="showroom-stat-mini showroom-profile-ember-stat-mini glass-card"><div class="showroom-stat-mini-icon yellow showroom-profile-ember-mini-icon"><span class="material-symbols-outlined fill">star</span></div>'
                 + '<div><div class="showroom-stat-mini-num showroom-profile-ember-mini-num">' + totalXp.toLocaleString() + '</div><div class="showroom-stat-mini-label showroom-profile-ember-mini-label">Total XP</div></div></div>'
               + '<div class="showroom-stat-mini showroom-profile-ember-stat-mini glass-card"><div class="showroom-stat-mini-icon cyan showroom-profile-ember-mini-icon"><span class="material-symbols-outlined fill">music_note</span></div>'
                 + '<div><div class="showroom-stat-mini-num showroom-profile-ember-mini-num">' + mastered + '</div><div class="showroom-stat-mini-label showroom-profile-ember-mini-label">Songs Mastered</div></div></div>'
             + '</div>'
           + '</section>'
           + '<section class="showroom-profile-ember-section">'
             + '<h3 class="showroom-profile-ember-heading">Instrument Progress</h3>'
             + '<div class="showroom-progress-card showroom-profile-ember-progress-card glass-card">' + progHtml + '</div></section>'
           + '<section class="showroom-profile-ember-section">'
             + '<div class="showroom-profile-ember-section-head">'
               + '<h3 class="showroom-profile-ember-heading">Badges</h3>'
               + '<button type="button" class="showroom-profile-ember-viewall" onclick="' + nav("path") + '">View All</button></div>'
             + '<div class="showroom-badges showroom-profile-ember-badges">' + badgesHtml + '</div></section>'
         + '</div>'
         + bottomNav(navItems, "profile")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Song Details
  // ───────────────────────────────────────────────────────────────────────
  function songDetailsRender(opts) {
    opts = opts || {};
    var title = opts.title || "Ember's Resonance";
    var artist = opts.artist || "The Spark Collective";
    var key = opts.key || "G Maj";
    var bpm = opts.bpm || 120;
    var len = opts.length || "3:45";
    var diff = typeof opts.difficulty === "number" ? opts.difficulty : 7;
    var diffMax = opts.difficultyMax || 10;
    var diffPct = Math.round((diff / diffMax) * 100);
    var desc = opts.description || "Intermediate level. Focuses on rapid chord transitions and fingerpicking accuracy.";
    var coverSrc = opts.cover;
    var tags = opts.tags || ["Acoustic"];

    var cover = coverSrc
      ? '<img src="' + escHtml(coverSrc) + '" alt="' + escHtml(title) + '" style="width:100%;height:100%;object-fit:cover">'
      : '<div class="showroom-song-cover-fallback" aria-hidden="true">\uD83C\uDFB5</div>';

    var tagsHtml = "";
    for (var i = 0; i < tags.length; i++) {
      tagsHtml += '<span class="showroom-song-tag"><span class="material-symbols-outlined">music_note</span>' + escHtml(tags[i]) + '</span>';
    }

    return '<div class="showroom-root with-bg">'
         + '<header class="showroom-appbar">'
         + '<div class="showroom-appbar-left"><button class="showroom-iconbtn framed" onclick="' + nav("library") + '" aria-label="Back"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span></button></div>'
         + '<h1 class="showroom-appbar-title centered">Song Details</h1>'
         + '<div class="showroom-appbar-right"><div style="width:40px"></div></div>'
         + '</header>'
         + '<div class="showroom-canvas" style="padding-bottom:140px">'
           + '<div class="showroom-song-hero">'
             + '<div class="showroom-song-flare" aria-hidden="true"></div>'
             + '<div class="showroom-song-cover">' + cover + '</div>'
             + '<div class="showroom-song-titles">'
               + '<h2 class="showroom-song-title">' + escHtml(title) + '</h2>'
               + '<p class="showroom-song-artist">' + escHtml(artist) + '</p>'
               + '<div class="showroom-song-tags">' + tagsHtml + '</div>'
             + '</div>'
           + '</div>'
           + '<div class="showroom-meta-grid">'
             + '<div class="showroom-meta-tile"><div class="showroom-meta-tile-overlay"></div><span class="material-symbols-outlined showroom-meta-icon">piano</span><span class="showroom-meta-label">Key</span><span class="showroom-meta-val">' + escHtml(key) + '</span></div>'
             + '<div class="showroom-meta-tile"><div class="showroom-meta-tile-overlay"></div><span class="material-symbols-outlined showroom-meta-icon">speed</span><span class="showroom-meta-label">BPM</span><span class="showroom-meta-val bpm">' + bpm + '</span></div>'
             + '<div class="showroom-meta-tile"><div class="showroom-meta-tile-overlay"></div><span class="material-symbols-outlined showroom-meta-icon">schedule</span><span class="showroom-meta-label">Length</span><span class="showroom-meta-val">' + escHtml(len) + '</span></div>'
           + '</div>'
           + '<div class="showroom-difficulty-card">'
             + '<div class="showroom-difficulty-head">'
               + '<h3 class="showroom-difficulty-title"><span class="material-symbols-outlined">local_fire_department</span>Difficulty</h3>'
               + '<div class="showroom-difficulty-score">' + diff + '<small>/' + diffMax + '</small></div>'
             + '</div>'
             + '<div class="showroom-difficulty-bar"><div class="showroom-difficulty-fill" style="width:' + diffPct + '%"></div></div>'
             + '<p class="showroom-difficulty-desc">' + escHtml(desc) + '</p>'
           + '</div>'
         + '</div>'
         + '<div class="showroom-actionbar">'
           + '<button class="showroom-action-cta" onclick="act(\'showroomStartPerf\')">'
             + '<div class="showroom-shimmer-overlay"></div>'
             + '<span class="material-symbols-outlined fill">play_circle</span>START PERFORMANCE</button>'
         + '</div>'
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Practice Session (metronome + drills)
  // ───────────────────────────────────────────────────────────────────────
  function practiceMetroRender(opts) {
    opts = opts || {};
    var bpm = (typeof S !== "undefined" && S.metronomeBpm) || opts.bpm || 120;
    var metroOn = (typeof S !== "undefined" && S.metronomeOn);
    var todayMin = (typeof S !== "undefined") ? Math.floor(S.todayPracticeSeconds / 60) : (opts.todayMinutes || 45);
    var focusScore = opts.focusScore || 92;

    // Resolve practice plan
    var plan = null;
    if (typeof window !== "undefined" && window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function") {
      var view = window.sparkCore.getActiveSessionView();
      if (view && view.plan && view.plan.flow === "daily_practice" && window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function") {
        plan = SparkPracticeBridge.toLegacyPlan(view.plan);
      }
    }
    if (!plan && typeof S !== "undefined") plan = S.practicePlan;

    var focusTitle = "No practice focus yet.";
    var focusPct = 0;
    var focusXp = 0;
    var drillItems = [];

    if (plan && typeof getPracticeSummaryFocus === "function") {
      focusTitle = getPracticeSummaryFocus(plan);
      var progress = (typeof getPracticeSummaryProgress === "function") ? getPracticeSummaryProgress(plan) : { completedItems: 0, totalItems: 1 };
      focusPct = progress.totalItems > 0 ? Math.round((progress.completedItems / progress.totalItems) * 100) : 0;
      focusXp = 150; // Standard XP for daily focus

      if (Array.isArray(plan.items)) {
        for (var pi = 0; pi < plan.items.length; pi++) {
          var item = plan.items[pi];
          if (typeof isRenderablePracticeSummaryItem === "function" && !isRenderablePracticeSummaryItem(item)) continue;
          drillItems.push({
            id: (typeof normalizePracticeSummaryItemId === "function") ? normalizePracticeSummaryItemId(item.id) : item.id,
            name: (typeof getPracticeSummaryItemLabel === "function") ? getPracticeSummaryItemLabel(item) : (item.label || "Drill"),
            sub: (typeof getPracticeSummaryItemDesc === "function") ? getPracticeSummaryItemDesc(item) : (item.desc || "Technique"),
            icon: item.meta && item.meta.bpm != null ? "speed" : (item.type === "song" ? "music_note" : "waves"),
            completed: (typeof isCompletedPracticeSummaryItem === "function") ? isCompletedPracticeSummaryItem(item) : !!item.completed
          });
        }
      }
    } else {
      // Fallback/Placeholder
      focusTitle = opts.focus ? opts.focus.title : "Spider Walk Drills";
      focusPct = opts.focus ? opts.focus.pct : 60;
      focusXp = opts.focus ? opts.focus.xp : 150;
      drillItems = opts.drills || [
        { name:"C Major Scale",      sub:"Warmup • 5 mins",     icon:"music_note" },
        { name:"Alternating Picking", sub:"Technique • 10 mins", icon:"speed" },
        { name:"Basic Strumming",     sub:"Rhythm • 8 mins",     icon:"waves" }
      ];
    }

    var drillHtml = "";
    for (var i = 0; i < drillItems.length; i++) {
      var d = drillItems[i];
      var isDone = d.completed;
      drillHtml += '<div class="showroom-drill group">'
                + '<div class="showroom-drill-left">'
                  + '<div class="showroom-drill-icon showroom-inset-carved"><span class="material-symbols-outlined">' + d.icon + '</span></div>'
                  + '<div><h4 class="showroom-drill-name">' + escHtml(d.name) + '</h4>'
                  + '<span class="showroom-drill-meta">' + escHtml(d.sub) + '</span></div>'
                + '</div>'
                + (isDone
                    ? '<span class="showroom-drill-meta" style="color:var(--success)">Done</span>'
                    : '<button class="showroom-drill-cta" onclick="' + nav("lesson") + '">Start</button>')
              + '</div>';
    }

    var navItems = [
      { id:"home",     label:"Home",     icon:"home",         onClick: nav("home") },
      { id:"practice", label:"Practice", icon:"music_note" },
      { id:"insights", label:"Insights", icon:"query_stats",  onClick: nav("home") },
      { id:"profile",  label:"Profile",  icon:"person",       onClick: nav("profile") }
    ];

    return '<div class="showroom-root with-bg">'
         + '<header class="showroom-appbar">'
         + '<div class="showroom-appbar-left"><button class="showroom-iconbtn" onclick="' + backToHome() + '" aria-label="Back"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span></button></div>'
         + '<h1 class="showroom-appbar-title" style="font-family:\'Plus Jakarta Sans\';font-weight:700">Practice Session</h1>'
         + '<div class="showroom-appbar-right"><button class="showroom-iconbtn" onclick="' + nav("settings") + '" aria-label="Settings"><span class="material-symbols-outlined" aria-hidden="true">settings</span></button></div>'
         + '</header>'
         + '<main class="showroom-canvas" style="padding-top:80px">'
           + '<section><h2 class="showroom-practice-h" style="font-family:\'Syne\';font-weight:900;font-size:28px">Daily Practice</h2><p class="showroom-practice-sub">Stay in the flow state.</p></section>'
           + '<section class="showroom-glass-card showroom-focus-card" style="padding:18px;border-radius:12px;position:relative;overflow:hidden">'
             + '<div class="showroom-focus-glow" style="position:absolute;-right:40px;-top:40px;width:128px;height:128px;background:rgba(255,123,58,0.2);border-radius:50%;filter:blur(32px)"></div>'
             + '<div class="showroom-focus-head" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">'
               + '<div><span class="showroom-focus-eyebrow">Current Focus</span><h3 class="showroom-focus-title">' + escHtml(focusTitle) + '</h3></div>'
               + '<div class="showroom-focus-pill" style="background:var(--raised-bg);padding:4px 12px;border-radius:9999px;display:flex;align-items:center;gap:4px;border:1px solid var(--border-light)">'
                 + '<span class="material-symbols-outlined" style="font-size:14px;color:var(--accent-light);font-variation-settings:\'FILL\' 1">local_fire_department</span>'
                 + '<span style="font-family:\'JetBrains Mono\';font-size:12px;font-weight:900">+' + focusXp + ' XP</span></div></div>'
             + '<div class="showroom-focus-progress-row" style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:8px">'
               + '<span>Progress</span><span class="pct" style="font-family:\'JetBrains Mono\';font-weight:900">' + focusPct + '%</span></div>'
             + '<div class="showroom-focus-track"><div class="showroom-focus-fill" style="width:' + focusPct + '%"></div></div>'
           + '</section>'
           + '<section class="showroom-metronome" style="background:var(--card-bg);border-radius:12px;padding:18px;border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;box-shadow:0 4px 20px rgba(0,0,0,0.2)">'
             + '<div class="showroom-metronome-label" style="position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:8px;color:var(--text-muted);font-size:11px;font-weight:700;text-transform:uppercase">'
               + '<span class="material-symbols-outlined" style="font-size:18px">graphic_eq</span><span>Metronome</span></div>'
             + '<div class="showroom-metronome-bpm" style="margin-top:24px;margin-bottom:16px;display:flex;align-items:baseline;gap:8px">'
               + '<span class="showroom-metronome-num">' + bpm + '</span><span class="showroom-metronome-unit">BPM</span></div>'
             + '<div class="showroom-metronome-controls" style="display:flex;align-items:center;gap:24px;justify-content:center;width:100%">'
               + '<button class="showroom-metro-btn" onclick="act(\'metroBpm\',\'' + (bpm - 5) + '\')" aria-label="Slower"><span class="material-symbols-outlined" aria-hidden="true">remove</span></button>'
               + '<button class="showroom-metro-play showroom-ember-glow" onclick="act(\'toggleMetro\')" aria-label="' + (metroOn ? 'Stop' : 'Play') + '">'
                 + '<span class="material-symbols-outlined" style="font-size:32px;font-variation-settings:\'FILL\' 1" aria-hidden="true">' + (metroOn ? 'pause' : 'play_arrow') + '</span></button>'
               + '<button class="showroom-metro-btn" onclick="act(\'metroBpm\',\'' + (bpm + 5) + '\')" aria-label="Faster"><span class="material-symbols-outlined" aria-hidden="true">add</span></button></div>'
             + '<div class="showroom-metronome-pulse" style="margin-top:20px;display:flex;gap:8px">'
               + '<div class="showroom-pulse-dot' + (metroOn ? ' active' : '') + '"></div><div class="showroom-pulse-dot"></div><div class="showroom-pulse-dot"></div><div class="showroom-pulse-dot"></div></div>'
           + '</section>'
           + '<div class="showroom-mini-bento" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
             + '<div class="showroom-mini-tile"><span class="material-symbols-outlined showroom-mini-tile-bg">timer</span><span class="showroom-mini-label">Today\u2019s Time</span>'
               + '<div class="showroom-mini-row"><span class="showroom-mini-num" style="color:var(--primary-fixed)">' + todayMin + '</span><span class="showroom-mini-unit">min</span></div></div>'
             + '<div class="showroom-mini-tile"><span class="material-symbols-outlined showroom-mini-tile-bg">track_changes</span><span class="showroom-mini-label">Focus Score</span>'
               + '<div class="showroom-mini-row"><span class="showroom-mini-num" style="color:var(--perform-cyan)">' + focusScore + '</span><span class="showroom-mini-unit">/100</span></div></div>'
           + '</div>'
           + '<section><div class="showroom-section-h2" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px">'
             + '<h3 style="font-family:\'Syne\';font-weight:800;font-size:15px">Quick Drills</h3><span class="link" style="font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer">View All</span></div>'
             + '<div style="display:flex;flex-direction:column;gap:8px">' + drillHtml + '</div></section>'
         + '</main>'
         + bottomNav(navItems, "practice")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Song Library
  // ───────────────────────────────────────────────────────────────────────
  function songLibraryRender(opts) {
    opts = opts || {};
    var flags = loadFlags();
    var category = flags.libraryCategory || "All";
    var level = flags.libraryLevel || "Intermediate";
    var categories = ["All","Guitar","Bass","Piano","Ukulele"];
    var levels = ["Beginner","Intermediate","Advanced"];

    var songs = opts.songs || [
      { name:"Ember's Resonance", artist:"The Electric Collective", lvl:7, len:"4:20", status:"hot",  pct:"85%",       statusClass:"success", instrument:"guitar" },
      { name:"Midnight Strum",    artist:"The Acoustic Soul",       lvl:3, len:"3:15", status:"new",  label:"New",      statusClass:"muted",   instrument:"ukulele" },
      { name:"Ivory Cascades",    artist:"Serene Melodies",         lvl:5, len:"5:45", status:"hot",  label:"Mastered", statusClass:"success", instrument:"piano"  },
      { name:"Deep Groove",       artist:"Bassline Dynasty",        lvl:9, len:"4:10", status:"dim",  label:"Try Again", statusClass:"warn",    instrument:"bass"   }
    ];

    function lvlClass(n) {
      if (n <= 3) return "lvl-low";
      if (n <= 5) return "lvl-mid";
      if (n <= 7) return "lvl-high";
      return "lvl-expert";
    }

    var chipsHtml = "";
    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];
      chipsHtml += '<button class="showroom-chip' + (cat === category ? ' on' : '') + '" onclick="SparkShowroom.setLibraryCategory(' + jsArg(cat) + ')">' + escHtml(cat) + '</button>';
    }
    var levelsHtml = "";
    for (var l = 0; l < levels.length; l++) {
      var lv = levels[l];
      levelsHtml += '<button class="showroom-level-chip' + (lv === level ? ' on' : '') + '" onclick="SparkShowroom.setLibraryLevel(' + jsArg(lv) + ')">' + escHtml(lv) + '</button>';
    }

    var songsHtml = "";
    for (var s = 0; s < songs.length; s++) {
      var sg = songs[s];
      var thumb = sg.cover
        ? '<img src="' + escHtml(sg.cover) + '" alt="">'
        : '<div class="showroom-song-thumb-fallback" aria-hidden="true">\uD83C\uDFB5</div>';
      var statusLabel = sg.label || (sg.pct || "");
      var statusClass = sg.statusClass || "muted";
      songsHtml += '<div class="showroom-song-row ' + escHtml(sg.instrument || '') + '" onclick="' + nav("song-details") + '">'
                + '<div class="showroom-song-thumb">' + thumb + '</div>'
                + '<div class="showroom-song-body">'
                  + '<h4 class="showroom-song-name">' + escHtml(sg.name) + '</h4>'
                  + '<p class="showroom-song-sub">' + escHtml(sg.artist) + '</p>'
                  + '<div class="showroom-song-meta"><span class="showroom-lvl-pill ' + lvlClass(sg.lvl) + '">LVL ' + sg.lvl + '</span>'
                  + '<span class="showroom-song-len">• ' + escHtml(sg.len) + '</span></div>'
                + '</div>'
                + '<div class="showroom-song-action">'
                  + '<button class="showroom-song-play ' + (sg.status || "") + '" aria-label="Play"><span class="material-symbols-outlined fill" aria-hidden="true">play_arrow</span></button>'
                  + '<span class="showroom-song-status ' + statusClass + '">' + escHtml(statusLabel) + '</span>'
                + '</div>'
              + '</div>';
    }

    var navItems = [
      { id:"home",    label:"Home",     icon:"home",          onClick: nav("home") },
      { id:"library", label:"Library",  icon:"library_music" },
      { id:"practice",label:"Practice", icon:"music_note",    onClick: nav("practice") },
      { id:"profile", label:"Profile",  icon:"person",        onClick: nav("profile") }
    ];

    return '<div class="showroom-root woodgrain-bg showroom-library-2026">'
         + '<header class="showroom-library-bar">'
           + '<h1 class="showroom-library-title">Song Library</h1>'
           + '<div class="showroom-library-actions">'
             + '<button class="showroom-iconbtn accent" aria-label="Search"><span class="material-symbols-outlined" aria-hidden="true">search</span></button>'
             + '<button class="showroom-iconbtn showroom-library-avatar-btn" aria-label="Profile" onclick="' + nav("profile") + '">'
               + '<span class="showroom-library-avatar-fallback">A</span>'
             + '</button>'
           + '</div>'
         + '</header>'
         + '<div class="showroom-canvas" style="padding-top:0">'
           + '<div class="showroom-search"><span class="material-symbols-outlined">search</span><input type="search" placeholder="Search songs, artists..."></div>'
           + '<div class="showroom-chiprow">' + chipsHtml + '</div>'
           + '<div class="showroom-level-row">' + levelsHtml + '</div>'
           + '<div class="showroom-trending-head"><h3>Trending Scores</h3><span class="link">View All</span></div>'
           + songsHtml
           + '<div class="showroom-daily">'
             + '<div class="showroom-daily-head"><span class="showroom-daily-eyebrow">Daily Challenge</span><span class="showroom-daily-xp">XP +500</span></div>'
             + '<h3 class="showroom-daily-title">Neon Horizon</h3>'
             + '<p class="showroom-daily-sub">Cyberpunk Synth Ensemble</p>'
             + '<div class="showroom-daily-foot">'
               + '<div class="showroom-daily-players"><div class="showroom-daily-avstack"><span></span><span></span><span></span></div><span>1.2k playing now</span></div>'
               + '<button class="showroom-daily-cta" onclick="' + nav("performance") + '">Join Session</button>'
             + '</div>'
           + '</div>'
         + '</div>'
         + bottomNav(navItems, "library")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Session Summary
  // ───────────────────────────────────────────────────────────────────────
  function sessionSummaryRender(opts) {
    opts = opts || {};
    var xp = opts.xp || 450;
    var accuracy = opts.accuracy || 98;
    var streak = opts.streak || 125;
    var lessonTitle = opts.lessonTitle || "Midnight Ember Jam";
    var lessonMeta = opts.lessonMeta || "Level 12 • 4:20 Duration";
    var subtitle = opts.subtitle || "You're finding your rhythm. Another great set finished.";
    var coverSrc = opts.cover;

    // Build accuracy ring
    var radius = 40;
    var circumference = 2 * Math.PI * radius;
    var dashOffset = circumference * (1 - accuracy / 100);

    var thumb = coverSrc
      ? '<img src="' + escHtml(coverSrc) + '" alt="">'
      : '<div class="showroom-summary-lesson-thumb-fb" aria-hidden="true">\uD83C\uDFB5</div>';

    var navItems = [
      { id:"practice", label:"Practice", icon:"music_note", onClick: nav("practice") },
      { id:"journey",  label:"Journey",  icon:"explore",    onClick: nav("path") },
      { id:"library",  label:"Library",  icon:"library_music", onClick: nav("library") },
      { id:"profile",  label:"Profile",  icon:"person",     onClick: nav("profile") }
    ];

    // CSP note: Stitch source uses an external album-art URL for the
    // lesson thumbnail; we swap it for a gradient placeholder carrying a
    // Material music_note glyph (img-src 'self' data:). If the caller
    // supplies a local/data-URI `cover`, that image is used instead.
    var lessonThumb = coverSrc
      ? '<img class="showroom-summary-lesson-thumb-img" src="' + escHtml(coverSrc) + '" alt="">'
      : '<div class="showroom-summary-lesson-thumb-fb" aria-hidden="true"><span class="material-symbols-outlined fill">music_note</span></div>';

    return '<div class="showroom-root with-bg showroom-summary-root">'
         + '<div class="showroom-summary-glow-tr" aria-hidden="true"></div>'
         + '<div class="showroom-summary-glow-bl" aria-hidden="true"></div>'
         + '<header class="showroom-summary-bar">'
           + '<button class="showroom-summary-close" onclick="' + backToHome() + '" aria-label="Close">'
             + '<span class="material-symbols-outlined" aria-hidden="true">close</span>'
           + '</button>'
           + '<span class="showroom-summary-title">Session Summary</span>'
           + '<span class="showroom-summary-spacer" aria-hidden="true"></span>'
         + '</header>'
         + '<main class="showroom-canvas showroom-summary-main">'
           + '<section class="showroom-summary-hero">'
             + '<div class="showroom-summary-medal-wrap">'
               + '<div class="showroom-summary-medal-glow" aria-hidden="true"></div>'
               + '<div class="showroom-summary-medal">'
                 + '<span class="material-symbols-outlined fill">workspace_premium</span>'
               + '</div>'
             + '</div>'
             + '<h1 class="showroom-summary-h">Session Complete!</h1>'
             + '<p class="showroom-summary-sub">' + escHtml(subtitle) + '</p>'
           + '</section>'
           + '<section class="showroom-summary-grid">'
             + '<div class="showroom-summary-xp">'
               + '<div class="showroom-summary-xp-flare" aria-hidden="true"></div>'
               + '<div class="showroom-summary-xp-copy">'
                 + '<span class="showroom-summary-xp-label">XP Earned</span>'
                 + '<div class="showroom-summary-xp-row">'
                   + '<span class="showroom-summary-xp-num">+' + xp + '</span>'
                   + '<span class="showroom-summary-xp-unit">XP</span>'
                 + '</div>'
               + '</div>'
               + '<div class="showroom-summary-xp-bolt">'
                 + '<span class="material-symbols-outlined fill">bolt</span>'
               + '</div>'
             + '</div>'
             + '<div class="showroom-summary-square showroom-summary-accuracy">'
               + '<svg class="showroom-summary-accuracy-svg" viewBox="0 0 100 100" aria-hidden="true">'
                 + '<circle class="showroom-summary-accuracy-track" cx="50" cy="50" r="40" fill="transparent" stroke-width="8"/>'
                 + '<circle class="showroom-summary-accuracy-bar" cx="50" cy="50" r="40" fill="transparent" stroke-width="8" stroke-linecap="round"'
                 + ' stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + dashOffset.toFixed(1) + '" transform="rotate(-90 50 50)"/>'
               + '</svg>'
               + '<div class="showroom-summary-accuracy-overlay">'
                 + '<span class="showroom-summary-accuracy-num">' + accuracy + '%</span>'
                 + '<span class="showroom-summary-accuracy-label">Accuracy</span>'
               + '</div>'
             + '</div>'
             + '<div class="showroom-summary-square showroom-summary-streak">'
               + '<div class="showroom-summary-fire-wrap">'
                 + '<div class="showroom-summary-fire-glow" aria-hidden="true"></div>'
                 + '<span class="material-symbols-outlined fill showroom-summary-fire">local_fire_department</span>'
               + '</div>'
               + '<span class="showroom-summary-streak-num">' + streak + '</span>'
               + '<span class="showroom-summary-streak-label">Day Streak</span>'
             + '</div>'
             + '<div class="showroom-summary-lesson">'
               + '<div class="showroom-summary-lesson-thumb">' + lessonThumb + '</div>'
               + '<div class="showroom-summary-lesson-copy">'
                 + '<span class="showroom-summary-lesson-eyebrow">Current Lesson</span>'
                 + '<h3 class="showroom-summary-lesson-title">' + escHtml(lessonTitle) + '</h3>'
                 + '<p class="showroom-summary-lesson-meta">' + escHtml(lessonMeta) + '</p>'
               + '</div>'
             + '</div>'
           + '</section>'
           + '<section class="showroom-summary-actions">'
             + '<button class="showroom-summary-cta" onclick="' + backToHome() + '">Continue</button>'
             + '<button class="showroom-summary-cta ghost" onclick="act(\'showroomStartPerf\')">Replay Session</button>'
           + '</section>'
         + '</main>'
         + bottomNav(navItems, "practice")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Performance (rhythm highway gameplay — CSS perspective)
  // ───────────────────────────────────────────────────────────────────────
  function performanceRender(opts) {
    opts = opts || {};
    var score = opts.score || 42850;
    var streak = opts.streak || 124;
    var mult = opts.mult || 4;
    var rank = opts.nextRank || "S+";
    var feedback = opts.feedback || "PERFECT";
    var combo = opts.combo || "COMBO BREAKER";
    var pct = opts.progressPct || 65;
    var title = opts.songTitle || "Midnight Ember Jam";
    var meta = opts.songMeta || "Level 12 • Hard Mode";

    // Sample notes: { lane: 0..3, top: "15%", color: "cyan|yellow|peach" }
    var notes = opts.notes || [
      { lane:0, top:"10%", color:"cyan" },
      { lane:0, top:"60%", color:"cyan" },
      { lane:1, top:"35%", color:"yellow" },
      { lane:2, top:"15%", color:"peach" },
      { lane:2, top:"80%", color:"peach" },
      { lane:3, top:"45%", color:"cyan" }
    ];
    var lanePos = ["2%","27%","52%","77%"];
    var notesHtml = "";
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      notesHtml += '<div class="showroom-perf2-note ' + n.color + '" style="top:' + n.top + ';left:' + lanePos[n.lane] + '"></div>';
    }

    var formattedScore = String(score).padStart(6, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Warm Ember rebuild of the Stitch 2026-04 performance_mode screen.
    // Structure: fixed top bar (score / streak / multiplier) → main canvas
    // with perspective rhythm highway (4 lanes) → floating HUD (energy +
    // next rank) → progress bar → song info → dashed tap-pad grid replacing
    // the bottom nav. Keeps the existing .showroom-perf-* classes intact
    // for backwards compatibility, and layers new .showroom-perf2-* rules
    // that cascade-override the look to match the 2026-04 export.
    // No external URLs — all effects are CSS/inline gradients (CSP safe).
    return '<div class="showroom-perf-root showroom-perf2">'
         + '<header class="showroom-perf2-bar">'
           + '<div class="showroom-perf2-bar-left">'
             + '<button class="showroom-perf2-pause" onclick="' + nav("session-summary") + '" aria-label="Pause"><span class="material-symbols-outlined" aria-hidden="true">pause_circle</span></button>'
             + '<span class="showroom-perf2-score">' + formattedScore + '</span>'
           + '</div>'
           + '<div class="showroom-perf2-bar-right">'
             + '<div class="showroom-perf2-streak">Streak ' + streak + '</div>'
             + '<div class="showroom-perf2-mult">' + mult + 'x</div>'
           + '</div>'
         + '</header>'
         + '<main class="showroom-perf2-canvas">'
           + '<div class="showroom-perf2-vignette" aria-hidden="true"></div>'
           + '<div class="showroom-perf2-floating">'
             + '<div class="showroom-perf2-energy">'
               + '<span class="material-symbols-outlined" aria-hidden="true" style="font-variation-settings:\'FILL\' 1">electric_bolt</span>'
               + '<div class="showroom-perf2-energy-track"><div class="showroom-perf2-energy-fill" style="width:80%"></div></div>'
             + '</div>'
             + '<div class="showroom-perf2-rank">'
               + '<span class="showroom-perf2-rank-label">NEXT RANK</span>'
               + '<span class="showroom-perf2-rank-val">' + escHtml(rank) + '</span>'
             + '</div>'
           + '</div>'
           + '<div class="showroom-perf2-feedback">'
             + '<h2>' + escHtml(feedback) + '</h2>'
             + '<p>' + escHtml(combo) + '</p>'
           + '</div>'
           + '<div class="showroom-perf2-highway-wrap">'
             + '<div class="showroom-perf2-highway">'
               + '<div class="showroom-perf2-lane-line l1"></div>'
               + '<div class="showroom-perf2-lane-line l2"></div>'
               + '<div class="showroom-perf2-lane-line l3"></div>'
               + notesHtml
               + '<div class="showroom-perf2-hitbar"></div>'
               + '<div class="showroom-perf2-pad-surface"></div>'
             + '</div>'
           + '</div>'
           + '<div class="showroom-perf2-progress"><div class="showroom-perf2-progress-fill" style="width:' + pct + '%"></div></div>'
           + '<div class="showroom-perf2-songinfo">'
             + '<span class="showroom-perf2-songtitle">' + escHtml(title) + '</span>'
             + '<span class="showroom-perf2-songmeta">' + escHtml(meta) + '</span>'
           + '</div>'
         + '</main>'
         // Tap-pad grid replaces the standard bottomNav() on this screen.
         // Four dashed lane-colored tap targets (cyan/yellow/peach/cyan)
         // visualize the interaction regions for the falling notes above.
         + '<div class="showroom-perf2-tappads" role="group" aria-label="Lane tap pads">'
           + '<button class="showroom-perf2-tappad cyan" onclick="act(\'showroomPerfTap\',\'0\')" aria-label="Lane 1 tap"><span class="material-symbols-outlined" aria-hidden="true">touch_app</span></button>'
           + '<button class="showroom-perf2-tappad yellow" onclick="act(\'showroomPerfTap\',\'1\')" aria-label="Lane 2 tap"><span class="material-symbols-outlined" aria-hidden="true">touch_app</span></button>'
           + '<button class="showroom-perf2-tappad peach" onclick="act(\'showroomPerfTap\',\'2\')" aria-label="Lane 3 tap"><span class="material-symbols-outlined" aria-hidden="true">touch_app</span></button>'
           + '<button class="showroom-perf2-tappad cyan" onclick="act(\'showroomPerfTap\',\'3\')" aria-label="Lane 4 tap"><span class="material-symbols-outlined" aria-hidden="true">touch_app</span></button>'
         + '</div>'
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Lesson (chord-diagram practice setup)
  // ───────────────────────────────────────────────────────────────────────
  function lessonRender(opts) {
    opts = opts || {};
    var module = opts.module || "Module 01 • Guitar Basics";
    var unit = opts.unit || "G Major Foundation";
    var chordName = opts.chord || "G Major Chord";
    var position = opts.position || "Open Position";
    var strum = opts.strum || "All 6";
    var type = opts.type || "Major";
    var xp = opts.xp || 12;
    var time = opts.time || "05:00";
    // Default G Major fingering: positions on (string left%, fret top%)
    // Aligned to 6-string justify-between grid: 0, 20, 40, 60, 80, 100
    var fingers = opts.fingers || [
      { left: 0,   top: 55, num: 2 },
      { left: 20,  top: 35, num: 1 },
      { left: 80,  top: 55, num: 3 },
      { left: 100, top: 55, num: 4 }
    ];

    var fingersHtml = "";
    for (var i = 0; i < fingers.length; i++) {
      var f = fingers[i];
      fingersHtml += '<div class="showroom-chord-finger" style="left:' + f.left + '%;top:' + f.top + '%">' + f.num + '</div>';
    }

    // Build a screen-reader-friendly description of the chord diagram. The
    // diagram is a complex visual composed of nested divs (no <img>), so we
    // expose it as role="img" and synthesize an aria-label from the chord
    // name, position, and finger placements.
    //
    // String index math: a 6-string layout has 5 intervals between the
    // outer strings, so adjacent strings sit at 0, 20, 40, 60, 80, 100.
    // Divide by 20 (NOT 100/6 ≈ 16.66) to map a left% into the 0..5
    // string index, then clamp to [0, 5] so a left=100 with rounding
    // error can't announce "string 7" on a 6-string instrument.
    var chordAriaLabel = chordName + ", " + position + ", finger positions: " +
      fingers.map(function(f){
        var stringIdx = Math.round(f.left / 20);
        if (stringIdx < 0) stringIdx = 0;
        if (stringIdx > 5) stringIdx = 5;
        return "finger " + f.num + " on string " + (stringIdx + 1);
      }).join(", ");

    var navItems = [
      { id:"learn",    label:"Learn",    icon:"school",     onClick: nav("path") },
      { id:"practice", label:"Practice", icon:"music_note" },
      { id:"library",  label:"Songs",    icon:"library_music", onClick: nav("library") },
      { id:"profile",  label:"Profile",  icon:"person",     onClick: nav("profile") }
    ];

    return '<div class="showroom-root with-bg showroom-lesson-2026">'
         + '<div class="showroom-woodgrain-overlay"></div>'
         + '<header class="showroom-lesson-bar">'
           + '<button class="showroom-iconbtn accent" onclick="' + nav("practice") + '" aria-label="Close"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>'
           + '<h1 class="showroom-lesson-bar-title">Practice Session</h1>'
           + '<button class="showroom-iconbtn accent" aria-label="Settings" onclick="' + nav("settings") + '"><span class="material-symbols-outlined" aria-hidden="true">settings</span></button>'
         + '</header>'
         + '<div class="showroom-canvas" style="padding-bottom:200px">'
           + '<section class="showroom-title-section"><span class="showroom-lesson-eyebrow">' + escHtml(module) + '</span>'
             + '<h2 class="showroom-lesson-h">' + escHtml(unit) + '</h2>'
           + '</section>'
           + '<section class="showroom-chord-section" style="position:relative">'
             + '<div class="showroom-blur-blob"></div>'
             + '<div class="showroom-lesson-card showroom-ember-glow-card">'
               + '<div class="showroom-lesson-card-head"><div>'
                 + '<h3 class="showroom-lesson-card-title">' + escHtml(chordName) + '</h3>'
                 + '<p class="showroom-lesson-card-sub">' + escHtml(position) + '</p></div>'
                 + '<div class="showroom-lesson-card-badge"><span class="showroom-lesson-card-tag">G</span></div></div>'
               + '<div class="showroom-chord" role="img" aria-label="' + escHtml(chordAriaLabel) + '">'
                 + '<div class="showroom-chord-fret-labels" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>'
                 + '<div class="showroom-chord-opens" aria-hidden="true"><span>O</span><span>O</span><span>O</span><span>O</span><span>O</span><span>O</span></div>'
                 + '<div class="showroom-chord-frets" aria-hidden="true"><div class="nut"></div><div class="fret"></div><div class="fret"></div><div class="fret"></div><div class="fret"></div><div class="fret"></div></div>'
                 + '<div class="showroom-chord-strings" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>'
                 + '<div class="showroom-chord-fingers" aria-hidden="true">' + fingersHtml + '</div>'
               + '</div>'
               + '<div class="showroom-chord-meta">'
                 + '<div class="showroom-chord-meta-cell"><p class="showroom-chord-meta-label">STRUM</p><p class="showroom-chord-meta-val success">' + escHtml(strum) + '</p></div>'
                 + '<div class="showroom-chord-meta-divider"></div>'
                 + '<div class="showroom-chord-meta-cell"><p class="showroom-chord-meta-label">TYPE</p><p class="showroom-chord-meta-val primary">' + escHtml(type) + '</p></div>'
               + '</div>'
             + '</div>'
           + '</section>'
           + '<section class="showroom-tips-section">'
             + '<div class="showroom-tips-head"><span class="material-symbols-outlined">lightbulb</span><h3>Key Tips</h3></div>'
             + '<div class="showroom-tips-grid">'
               + '<div class="showroom-tip"><div class="showroom-tip-icon primary"><span class="material-symbols-outlined">thumb_up</span></div><p class="showroom-tip-title">Keep your thumb low</p><p class="showroom-tip-desc">Allows more reach across the neck.</p></div>'
               + '<div class="showroom-tip"><div class="showroom-tip-icon secondary"><span class="material-symbols-outlined">ads_click</span></div><p class="showroom-tip-title">Press near the fret</p><p class="showroom-tip-desc">Reduces buzzing with less force.</p></div>'
               // Wide-tip artwork used to be a remote lh3.googleusercontent.com
               // image, which is blocked by the app-wide CSP (img-src 'self' data:
               // in index.html + src-tauri/tauri.conf.json). Revert to the local
               // emoji glyph so the tile renders on every surface, online or off.
               // When real artwork ships, point `.showroom-tip-img` at a
               // resources/ path served from 'self', not a remote host.
               + '<div class="showroom-tip wide"><div class="showroom-tip-img" aria-hidden="true">🖐️</div><div><p class="showroom-tip-title">Arch your fingers</p><p class="showroom-tip-desc">Ensure open strings ring out clearly without muting.</p></div></div>'
             + '</div>'
           + '</section>'
           + '<section class="showroom-stats-bar">'
             + '<div class="seg xp"><span class="material-symbols-outlined fill">bolt</span><span class="num">' + xp + '</span><span class="lbl">XP</span></div>'
             + '<div class="seg timer"><span class="material-symbols-outlined fill">timer</span><span class="num">' + escHtml(time) + '</span></div>'
           + '</section>'
         + '</div>'
         + '<div class="showroom-lesson-cta-wrap"><button class="showroom-lesson-cta showroom-ember-glow-button" onclick="' + nav("performance") + '"><span class="material-symbols-outlined fill">play_arrow</span>START PRACTICE</button></div>'
         + bottomNav(navItems, "practice")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Learning Path
  // ───────────────────────────────────────────────────────────────────────
  function pathRender(opts) {
    opts = opts || {};
    var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
    var streak = 42, dailyMin = 18, dailyGoal = 20, level = 12, accuracy = 85;
    if (profile && profile.apps) {
      var maxLvl = 0, maxStreak = 0;
      for (var id in profile.apps) {
        var st = (profile.apps[id] || {}).stats || {};
        if ((st.level || 0) > maxLvl) maxLvl = st.level;
        if ((st.streakDays || 0) > maxStreak) maxStreak = st.streakDays;
      }
      if (maxLvl) level = maxLvl;
      if (maxStreak) streak = maxStreak;
    }

    var lessons = opts.lessons || [
      { tier:"Beginner",     title:"Chord Basics",      desc:"Master the fundamental G and C major shapes.", time:"8 MIN",  icon:"music_note", instrument:"guitar",  unlocked:true,  cta:"Continue" },
      { tier:"Intermediate", title:"Strumming Patterns",desc:"Unlock the \"Island Strum\" for versatile rhythms.", time:"12 MIN", icon:"waves",     instrument:"ukulele", unlocked:false, cta:"Locked" },
      { tier:"Milestone",    title:"First Song",        desc:"Put it all together with \"Simple Melodies\".",    time:"15 MIN", icon:"piano",     instrument:"piano",   unlocked:false, cta:"Locked", thumb:true }
    ];

    var goalPct = Math.min(100, Math.round((dailyMin / dailyGoal) * 100));
    var ringR = 34;
    var ringC = 2 * Math.PI * ringR;
    var ringOffset = ringC * (1 - goalPct / 100);

    var lessonsHtml = "";
    for (var i = 0; i < lessons.length; i++) {
      var ls = lessons[i];
      var isStaggered = (i % 2 === 1);
      lessonsHtml += '<div class="showroom-path-card ' + escHtml(ls.instrument) + (isStaggered ? ' stagger-right' : '') + '">'
                  + '<div style="display:flex;justify-content:space-between;align-items:flex-start;grid-column:1/-1">'
                    + '<div class="showroom-path-icon"><span class="material-symbols-outlined">' + ls.icon + '</span></div>'
                    + '<span class="showroom-path-tier">' + escHtml(ls.tier) + '</span>'
                  + '</div>'
                  + '<div class="showroom-path-body">'
                    + '<h4 class="showroom-path-title-text">' + escHtml(ls.title) + '</h4>'
                    + '<p class="showroom-path-desc">' + escHtml(ls.desc) + '</p>'
                  + '</div>';
      if (ls.thumb) {
        // When thumbSrc is set, render the <img> with an onerror fallback
        // that swaps in the emoji glyph — this way the tile still renders
        // offline or when the remote host is blocked by CSP / network.
        // Otherwise fall straight through to the emoji so the tile never
        // leaves the user staring at a broken-image icon.
        var thumbInner = ls.thumbSrc ? '<img src="' + escHtml(ls.thumbSrc) + '" alt="" onerror="this.onerror=null;this.outerHTML=\'\\uD83C\\uDFBC\'">' : '\uD83C\uDFBC';
        lessonsHtml += '<div class="showroom-path-thumb">' + thumbInner + '</div>';
      }
      lessonsHtml += '<div class="showroom-path-foot">'
                  + '<span class="showroom-path-time"><span class="material-symbols-outlined">timer</span>' + escHtml(ls.time) + '</span>'
                  + (ls.unlocked
                      ? '<button class="showroom-path-cta" onclick="' + nav("lesson") + '">' + escHtml(ls.cta) + ' <span class="material-symbols-outlined fill">play_arrow</span></button>'
                      : '<button class="showroom-path-cta locked" aria-disabled="true">' + escHtml(ls.cta) + ' <span class="material-symbols-outlined">lock</span></button>')
                  + '</div>'
                + '</div>';
    }

    var navItems = [
      { id:"path",        label:"Path",        icon:"map" },
      { id:"practice",    label:"Practice",    icon:"timer",       onClick: nav("practice") },
      { id:"instruments", label:"Instruments", icon:"piano",       onClick: nav("home") },
      { id:"profile",     label:"Profile",     icon:"person",      onClick: nav("profile") }
    ];

    var avatarSrc = profile && (profile.avatarImage || profile.avatarUrl);
    var avatarHtml = avatarSrc
      ? '<img src="' + escHtml(avatarSrc) + '" alt="Profile" style="width:100%;height:100%;object-fit:cover">'
      : '<span class="showroom-path-avatar-fallback">' + (profile && profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'A') + '</span>';

    return '<div class="showroom-root with-bg showroom-path-2026">'
         + '<header class="showroom-path-bar">'
           // Semantic button — the previous <div onclick> was not focusable
           // by keyboard and exposed no button role to assistive tech.
           // Transparent background + `padding:0` keeps the visual treatment
           // (circular avatar with accent border) identical to the previous
           // div while restoring keyboard/Tab + Enter/Space activation and
           // screen-reader semantics.
           + '<button type="button" class="showroom-path-avatar-btn" aria-label="Profile" onclick="' + nav("profile") + '">'
             + avatarHtml
           + '</button>'
           + '<h1 class="showroom-path-title">Your Path</h1>'
           + '<div class="showroom-path-streak">'
             + '<span class="showroom-path-streak-num">' + streak + '\uD83D\uDD25</span>'
           + '</div>'
         + '</header>'
         + '<div class="showroom-canvas" style="padding-top:0">'
           + '<div class="showroom-daily-goal">'
             + '<div style="position:absolute;top:-40px;right:-40px;width:128px;height:128px;background:rgba(255,123,58,0.1);border-radius:50%;filter:blur(32px)"></div>'
             + '<div class="showroom-daily-goal-left">'
               + '<span class="showroom-daily-goal-label">DAILY GOAL</span>'
               + '<div class="showroom-daily-goal-row"><span class="showroom-daily-goal-num">' + dailyMin + '</span><span class="showroom-daily-goal-of">/ ' + dailyGoal + 'm</span></div>'
               + '<div class="showroom-daily-goal-pills">'
                 + '<div class="showroom-goal-pill lvl"><span class="material-symbols-outlined fill" style="font-size:16px">star</span>LEVEL ' + level + '</div>'
                 + '<div class="showroom-goal-pill acc"><span class="material-symbols-outlined" style="font-size:16px">trending_up</span>' + accuracy + '% ACCURACY</div>'
               + '</div>'
             + '</div>'
             + '<div class="showroom-goal-ring">'
               + '<svg viewBox="0 0 80 80" style="width:100%;height:100%;transform:rotate(-90deg)">'
                 + '<circle cx="40" cy="40" r="' + ringR + '" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>'
                 + '<circle cx="40" cy="40" r="' + ringR + '" fill="none" stroke="#ff7b3a" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + ringC.toFixed(1) + '" stroke-dashoffset="' + ringOffset.toFixed(1) + '" style="filter:drop-shadow(0 0 6px rgba(255,123,58,0.6))"/>'
               + '</svg>'
               + '<div class="bolt"><span class="material-symbols-outlined fill">bolt</span></div>'
             + '</div>'
           + '</div>'
           + '<div class="showroom-path-section-head"><h3>Continue Learning</h3><span class="link">VIEW ALL</span></div>'
           + '<div style="display:flex;flex-direction:column;gap:8px">' + lessonsHtml + '</div>'
         + '</div>'
         + '<button class="showroom-path-fab" aria-label="Start practice" onclick="' + nav("practice") + '"><span class="material-symbols-outlined" aria-hidden="true" style="font-size:28px">timer</span></button>'
         + bottomNav(navItems, "path")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Tuner & Tools (SparkSuite Studio)
  // ───────────────────────────────────────────────────────────────────────
  function tunerRender(opts) {
    opts = opts || {};
    var note = opts.note || "E";
    var freq = opts.frequency || 440.0;
    var tuning = opts.tuning || "EADGBE";
    var bpm = opts.bpm || 120;
    var status = opts.status || "in-tune"; // in-tune | flat | sharp
    var statusLabel = status === "flat" ? "FLAT"
                    : status === "sharp" ? "SHARP"
                    : "IN TUNE";
    var statusIcon = status === "in-tune" ? "check_circle"
                    : status === "flat" ? "south"
                    : "north";

    // Build clock-tick marks around the dial: 12 ticks, center one highlighted
    var ticksHtml = "";
    for (var i = 0; i < 12; i++) {
      var rot = (i * 30);
      var cls = "showroom-tuner-tick";
      if (i === 0) cls += " center";
      else if (i === 3 || i === 6 || i === 9) cls += " major";
      ticksHtml += '<div class="' + cls + '" style="transform:translateX(-50%) rotate(' + rot + 'deg)"></div>';
    }

    var standardLetters = tuning.split("").join(" ");

    var navItems = [
      { id:"tuner",   label:"Tuner",   icon:"tune" },
      { id:"path",    label:"Courses", icon:"school",     onClick: nav("path") },
      { id:"tools",   label:"Tools",   icon:"build",      onClick: nav("tuner") },
      { id:"profile", label:"Profile", icon:"person",     onClick: nav("profile") }
    ];

    return '<div class="showroom-root with-bg showroom-tuner-2026">'
         + '<header class="showroom-tuner-bar">'
           + '<button class="showroom-iconbtn accent" aria-label="Menu" onclick="' + backToHome() + '"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button>'
           + '<h1 class="showroom-tuner-brand">SparkSuite</h1>'
           + '<button class="showroom-iconbtn showroom-tuner-avatar-btn" aria-label="Profile" onclick="' + nav("profile") + '">'
             + '<span class="showroom-tuner-avatar-fallback">A</span>'
           + '</button>'
         + '</header>'
         + '<div class="showroom-canvas" style="padding-top:0;align-items:center">'
           + '<div class="showroom-tuner-wrap">'
             + '<div class="showroom-tuner-dial">' + ticksHtml
               + '<div class="showroom-tuner-inner">'
                 + '<div class="showroom-tuner-note">' + escHtml(note) + '</div>'
                 + '<div class="showroom-tuner-status ' + status + '">'
                   + '<span class="material-symbols-outlined fill">' + statusIcon + '</span>'
                   + '<span>' + statusLabel + '</span>'
                 + '</div>'
               + '</div>'
             + '</div>'
             + '<div class="showroom-tuner-row">'
               + '<div class="showroom-tuner-cell"><span class="showroom-tuner-cell-label">Frequency</span>'
                 + '<div class="showroom-tuner-freq"><span class="showroom-tuner-freq-num">' + freq.toFixed(1) + '</span><span class="showroom-tuner-freq-unit">Hz</span></div></div>'
               + '<button class="showroom-tuner-mic" aria-label="Toggle microphone"><span class="material-symbols-outlined fill" aria-hidden="true">mic</span></button>'
               + '<div class="showroom-tuner-cell right"><span class="showroom-tuner-cell-label">Standard</span>'
                 + '<span class="showroom-tuner-tuning">' + escHtml(standardLetters) + '</span></div>'
             + '</div>'
           + '</div>'
           + '<section class="showroom-tuner-metro" style="width:100%">'
             + '<div class="showroom-tuner-metro-head"><h3 class="showroom-tuner-metro-h">Metronome</h3>'
               + '<div class="showroom-tuner-metro-pulse"><span class="dot active"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>'
             + '<div class="showroom-tuner-metro-bpm-row">'
               + '<button class="showroom-tuner-bpm-btn" aria-label="Slower"><span class="material-symbols-outlined" aria-hidden="true">remove</span></button>'
               + '<span class="showroom-tuner-bpm-num">' + bpm + '</span>'
               + '<button class="showroom-tuner-bpm-btn" aria-label="Faster"><span class="material-symbols-outlined" aria-hidden="true">add</span></button>'
             + '</div>'
             + '<div class="showroom-tuner-bpm-unit">BPM</div>'
             + '<div class="showroom-tuner-metro-actions">'
               + '<button class="showroom-tuner-start"><span class="material-symbols-outlined fill">play_arrow</span>Start</button>'
               + '<button class="showroom-tuner-tap"><span class="material-symbols-outlined">touch_app</span>Tap</button>'
             + '</div>'
           + '</section>'
           + '<div style="width:100%">'
             + '<div class="showroom-quicktools-head"><h3>Quick Tools</h3><span class="link">View All</span></div>'
             + '<div class="showroom-quicktools">'
               + '<button class="showroom-quicktool recorder"><div class="showroom-quicktool-icon"><span class="material-symbols-outlined fill">mic</span></div><span class="showroom-quicktool-label">Recorder</span></button>'
               + '<button class="showroom-quicktool tonegen"><div class="showroom-quicktool-icon"><span class="material-symbols-outlined fill">graphic_eq</span></div><span class="showroom-quicktool-label">Tone Gen</span></button>'
               + '<button class="showroom-quicktool chords" onclick="' + nav("library") + '"><div class="showroom-quicktool-icon"><span class="material-symbols-outlined fill">library_music</span></div><span class="showroom-quicktool-label">Chords</span></button>'
             + '</div>'
           + '</div>'
         + '</div>'
         + bottomNav(navItems, "tuner")
         + '</div>';
  }

  // ─── Public API + setters ──────────────────────────────────────────────
  var SparkShowroom = {
    setLibraryCategory: function(cat) {
      var f = loadFlags(); f.libraryCategory = cat; saveFlags(f);
      if (typeof render === "function") render();
    },
    setLibraryLevel: function(lv) {
      var f = loadFlags(); f.libraryLevel = lv; saveFlags(f);
      if (typeof render === "function") render();
    }
  };

  window.SparkSettings       = { render: settingsRender };
  // NOTE: this is the Showroom profile *screen* module. The canonical
  // SparkProfile data model (createEmpty/migrate/ensureApp, registered by
  // js/spark-core/profile-schema.js) is a separate global. Naming this one
  // SparkProfile clobbered the data model — scripts load in source order
  // and spark-showroom.js comes after profile-schema.js, so storage.js
  // and the per-instrument register.js calls would fail at activate time.
  window.SparkProfileScreen  = { render: profileRender };
  window.SparkSongDetails    = { render: songDetailsRender };
  window.SparkPracticeMetro  = { render: practiceMetroRender };
  window.SparkSongLibrary    = { render: songLibraryRender };
  window.SparkSessionSummary = { render: sessionSummaryRender };
  window.SparkPerformance    = { render: performanceRender };
  window.SparkLesson         = { render: lessonRender };
  window.SparkPath           = { render: pathRender };
  window.SparkTuner          = { render: tunerRender };

  // ───────────────────────────────────────────────────────────────────────
  // Onboarding — "Welcome to the Spark Collective"
  // Ported from docs/design/stitch-2026-04/onboarding_welcome/.
  // ───────────────────────────────────────────────────────────────────────
  function onboardingWelcomeRender(opts) {
    opts = opts || {};
    var title = opts.title || "SparkSuite";
    var subtitle = opts.subtitle || "Welcome to the Spark Collective";
    var body = opts.body || "Step into a world where your musical flow state is nurtured. Discover your rhythm, track your journey, and let the music guide you.";
    var ctaLabel = opts.ctaLabel || "Begin Your Journey";
    var ctaAction = opts.ctaAction || "act('completeOnboarding')";
    var signInLabel = opts.signInLabel || "Already have an account?";
    var signInAction = opts.signInAction || "act('completeOnboarding')";

    return '<div class="showroom-root with-woodgrain showroom-onboarding-welcome">'
         + '<div class="showroom-onboarding-glow showroom-onboarding-glow-tl" aria-hidden="true"></div>'
         + '<div class="showroom-onboarding-glow showroom-onboarding-glow-br" aria-hidden="true"></div>'
         + '<main class="showroom-onboarding-main">'
           + '<div class="showroom-onboarding-logo-wrap">'
             + '<div class="showroom-onboarding-logo-halo" aria-hidden="true"></div>'
             + '<div class="showroom-onboarding-logo-badge">'
               + '<span class="material-symbols-outlined fill showroom-onboarding-logo-icon">auto_awesome</span>'
             + '</div>'
           + '</div>'
           + '<div class="showroom-onboarding-copy">'
             + '<h1 class="showroom-onboarding-title">' + escHtml(title) + '</h1>'
             + '<h2 class="showroom-onboarding-subtitle">' + escHtml(subtitle) + '</h2>'
             + '<p class="showroom-onboarding-body">' + escHtml(body) + '</p>'
           + '</div>'
           + '<div class="showroom-onboarding-cta-wrap">'
             + '<button type="button" class="showroom-onboarding-cta" onclick="' + ctaAction + '">'
               + escHtml(ctaLabel.toUpperCase())
               + '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>'
             + '</button>'
             + '<p class="showroom-onboarding-signin">'
               + escHtml(signInLabel) + ' '
               + '<button type="button" class="showroom-onboarding-signin-link" onclick="' + signInAction + '">Sign In</button>'
             + '</p>'
           + '</div>'
         + '</main>'
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Curriculum Dashboard (Ember Studio)
  // ───────────────────────────────────────────────────────────────────────
  function curriculumDashboardRender(opts) {
    opts = opts || {};
    var courseTitle = opts.courseTitle || "Guitar Fundamentals";
    var level = opts.level || 12;
    var progress = opts.progress || 65;
    var nextXp = opts.nextXp || 250;
    var nextBadge = opts.nextBadge || "Silver Badge";

    // Progress ring math
    var radius = 40;
    var circumference = 2 * Math.PI * radius;
    var dashOffset = circumference * (1 - progress / 100);

    var modules = opts.modules || [
      {
        id: "mod1",
        title: "Module 1: Getting Started",
        status: "COMPLETED",
        statusClass: "completed",
        lessons: [
          { name: "Anatomy of the Guitar", completed: true },
          { name: "Holding & Tuning", completed: true }
        ]
      },
      {
        id: "mod2",
        title: "Module 2: First Chords",
        status: "RESUME",
        statusClass: "active",
        lessons: [
          { name: "The E Minor & A Minor", active: true },
          { name: "Basic Strumming Patterns", locked: true }
        ],
        cta: "Start Next Lesson"
      },
      {
        id: "mod3",
        title: "Module 3: Major Scales",
        status: "LOCKED",
        statusClass: "locked",
        lessons: [
          { name: "The C Major Scale", locked: true },
          { name: "Intervals 101", locked: true }
        ]
      }
    ];

    var timelineHtml = "";
    for (var i = 0; i < modules.length; i++) {
      var mod = modules[i];
      var markerIcon = mod.statusClass === "completed" ? "check" :
                       mod.statusClass === "active" ? "auto_awesome" : "lock";
      var markerFill = mod.statusClass === "active" ? " fill" : "";

      var lessonsHtml = "";
      for (var j = 0; j < mod.lessons.length; j++) {
        var les = mod.lessons[j];
        var lesStatusHtml = les.completed ? '<span class="material-symbols-outlined showroom-lesson-check">check_circle</span>' :
                            les.active ? '<span class="showroom-lesson-badge">NOW</span>' :
                            '<span class="material-symbols-outlined showroom-lesson-lock">lock_open</span>';

        lessonsHtml += '<div class="showroom-lesson-item' + (les.active ? ' active' : '') + '">'
                    + '<div class="showroom-lesson-info">'
                    + '<span class="material-symbols-outlined showroom-lesson-icon">' + (les.locked ? 'music_note' : 'play_circle') + '</span>'
                    + '<span class="showroom-lesson-name">' + escHtml(les.name) + '</span>'
                    + '</div>'
                    + lesStatusHtml
                    + '</div>';
      }

      var ctaHtml = mod.cta ? '<button class="showroom-module-cta" onclick="' + nav("lesson") + '">' + escHtml(mod.cta) + '</button>' : '';

      timelineHtml += '<div class="showroom-timeline-item">'
                   + '<div class="showroom-timeline-marker ' + mod.statusClass + '">'
                   + '<span class="material-symbols-outlined' + markerFill + '" style="font-size:16px">' + markerIcon + '</span>'
                   + '</div>'
                   + '<div class="showroom-module-card ' + mod.statusClass + '">'
                   + '<div class="showroom-module-head">'
                   + '<h3 class="showroom-module-title">' + escHtml(mod.title) + '</h3>'
                   + '<span class="showroom-module-status ' + mod.statusClass + '">' + escHtml(mod.status) + '</span>'
                   + '</div>'
                   + '<div class="showroom-lesson-list">' + lessonsHtml + '</div>'
                   + ctaHtml
                   + '</div>'
                   + '</div>';
    }

    var navItems = [
      { id:"tuner",    label:"Tuner",   icon:"tune",       onClick: nav("tuner") },
      { id:"curriculum",label:"Courses", icon:"school" },
      { id:"tools",    label:"Tools",   icon:"construction",onClick: nav("tuner") },
      { id:"profile",  label:"Profile", icon:"person",     onClick: nav("profile") }
    ];

    return '<div class="showroom-root with-bg">'
         + '<div class="showroom-woodgrain-overlay"></div>'
         + '<header class="showroom-appbar">'
         + '<div class="showroom-appbar-left">'
         + '<button class="showroom-iconbtn accent" onclick="' + backToHome() + '" aria-label="Menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button>'
         + '<h1 class="showroom-appbar-title">Ember Studio</h1></div>'
         + '<div class="showroom-appbar-right"><div class="showroom-avatar" onclick="' + nav("profile") + '"><div class="showroom-avatar-inner">A</div></div></div>'
         + '</header>'
         + '<main class="showroom-canvas">'
         + '<section class="showroom-course-hero">'
         + '<div class="showroom-course-hero-flare" aria-hidden="true"></div>'
         + '<div class="showroom-course-hero-head"><div>'
         + '<span class="showroom-course-hero-eyebrow">CURRENT COURSE</span>'
         + '<h2 class="showroom-course-hero-title">' + escHtml(courseTitle) + '</h2></div>'
         + '<div class="showroom-course-hero-badge"><span class="material-symbols-outlined fill" style="font-size:14px">workspace_premium</span>Lvl ' + level + '</div></div>'
         + '<div class="showroom-course-hero-stats">'
         + '<div class="showroom-course-hero-ring">'
         + '<svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)">'
         + '<circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,.05)" stroke-width="8"/>'
         + '<circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff7b3a" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circumference.toFixed(1) + '" stroke-dashoffset="' + dashOffset.toFixed(1) + '" style="filter:drop-shadow(0 0 8px rgba(255,123,58,.5))"/>'
         + '</svg>'
         + '<div class="showroom-course-hero-ring-label"><span class="showroom-course-hero-ring-num">' + progress + '%</span><span class="showroom-course-hero-ring-unit">DONE</span></div></div>'
         + '<div class="showroom-course-hero-progress">'
         + '<div class="showroom-course-hero-xp-row"><span class="material-symbols-outlined fill showroom-course-hero-xp-icon" style="font-size:14px">bolt</span>Next: ' + nextXp + ' XP to ' + escHtml(nextBadge) + '</div>'
         + '<div class="showroom-course-hero-bar"><div class="showroom-course-hero-fill" style="width:75%"></div></div></div></div>'
         + '</section>'
         + '<section class="showroom-timeline">'
         + '<div class="showroom-timeline-line"></div>'
         + timelineHtml
         + '</section>'
         + '</main>'
         + bottomNav(navItems, "curriculum")
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Course Syllabus — Stitch 2026-04 design reference
  // Ported from docs/design/stitch-2026-04/course_syllabus/. This is a
  // NEW showroom renderer (no existing dispatch). Scope: Showroom design
  // reference only — NO routing changes, NO render.js dispatch, NO new
  // screen constants. The renderer is exported as SparkCourseSyllabus and
  // stands ready for future wiring.
  // ───────────────────────────────────────────────────────────────────────
  function courseSyllabusRender(opts) {
    opts = opts || {};
    var courseName  = opts.courseName  || "Guitar Fundamentals";
    var level       = (opts.level != null) ? opts.level : 12;
    var progressPct = (opts.progressPct != null) ? opts.progressPct : 65;
    var nextXpGoal  = opts.nextXpGoal  || "250 XP to Silver Badge";
    var ctaLabel    = opts.ctaLabel    || "Start Next Lesson";
    var ctaAction   = opts.ctaAction   || "act('startLesson')";
    var userInitial = (opts.userInitial || "A").charAt(0).toUpperCase();

    var modules = opts.modules || [
      {
        title: "Module 1: Getting Started",
        status: "COMPLETED",
        state: "completed",
        lessons: [
          { name: "Anatomy of the Guitar", state: "done" },
          { name: "Holding & Tuning",      state: "done" }
        ]
      },
      {
        title: "Module 2: First Chords",
        status: "RESUME",
        state: "active",
        lessons: [
          { name: "The E Minor & A Minor",     state: "now" },
          { name: "Basic Strumming Patterns",  state: "unlocked" }
        ],
        showCta: true
      },
      {
        title: "Module 3: Major Scales",
        status: "LOCKED",
        state: "locked",
        lessons: [
          { name: "The C Major Scale", state: "locked" },
          { name: "Intervals 101",     state: "locked" }
        ]
      }
    ];

    // Progress ring math — r=40, stroke-dasharray = 2πr
    var ringR = 40;
    var ringC = 2 * Math.PI * ringR;
    var ringOffset = ringC * (1 - Math.max(0, Math.min(100, progressPct)) / 100);

    function markerIconFor(state) {
      if (state === "completed") return "check";
      if (state === "active")    return "auto_awesome";
      return "lock";
    }
    function lessonIconFor(state) {
      if (state === "locked") return "music_note";
      return "play_circle";
    }
    function lessonTailFor(state) {
      if (state === "done") {
        return '<span class="material-symbols-outlined showroom-syllabus-lesson-done" aria-hidden="true">check_circle</span>';
      }
      if (state === "now") {
        return '<span class="showroom-syllabus-lesson-now">NOW</span>';
      }
      if (state === "unlocked") {
        return '<span class="material-symbols-outlined showroom-syllabus-lesson-unlocked" aria-hidden="true">lock_open</span>';
      }
      return "";
    }

    var timelineHtml = "";
    for (var i = 0; i < modules.length; i++) {
      var mod = modules[i];
      var state = mod.state || "locked";
      var markerFill = (state === "active") ? " fill" : "";

      var lessonsHtml = "";
      for (var j = 0; j < mod.lessons.length; j++) {
        var les = mod.lessons[j];
        lessonsHtml += '<div class="showroom-syllabus-lesson ' + les.state + '">'
                    +   '<div class="showroom-syllabus-lesson-main">'
                    +     '<span class="material-symbols-outlined showroom-syllabus-lesson-icon" aria-hidden="true">' + lessonIconFor(les.state) + '</span>'
                    +     '<span class="showroom-syllabus-lesson-name">' + escHtml(les.name) + '</span>'
                    +   '</div>'
                    +   lessonTailFor(les.state)
                    + '</div>';
      }

      var ctaHtml = mod.showCta
        ? '<button type="button" class="showroom-syllabus-cta" onclick="' + (opts.ctaAction || "act('showroomStartLesson')") + '">'
          + escHtml(ctaLabel)
          + '</button>'
        : '';

      timelineHtml += '<div class="showroom-syllabus-module ' + state + '">'
                   +   '<div class="showroom-syllabus-dot ' + state + '" aria-hidden="true">'
                   +     '<span class="material-symbols-outlined' + markerFill + '">' + markerIconFor(state) + '</span>'
                   +   '</div>'
                   +   '<div class="showroom-syllabus-card ' + state + '">'
                   +     '<div class="showroom-syllabus-card-head">'
                   +       '<h3 class="showroom-syllabus-card-title">' + escHtml(mod.title) + '</h3>'
                   +       '<span class="showroom-syllabus-card-status ' + state + '">' + escHtml(mod.status) + '</span>'
                   +     '</div>'
                   +     '<div class="showroom-syllabus-lessons">' + lessonsHtml + '</div>'
                   +     ctaHtml
                   +   '</div>'
                   + '</div>';
    }

    var navItems = [
      { id: "tuner",      label: "Tuner",   icon: "tune",         onClick: nav("tuner") },
      { id: "curriculum", label: "Courses", icon: "school" },
      { id: "tools",      label: "Tools",   icon: "construction", onClick: nav("tuner") },
      { id: "profile",    label: "Profile", icon: "person",       onClick: nav("profile") }
    ];

    return '<div class="showroom-root with-woodgrain showroom-syllabus">'
         +   '<header class="showroom-syllabus-appbar">'
         +     '<div class="showroom-syllabus-appbar-left">'
         +       '<button type="button" class="showroom-syllabus-iconbtn" onclick="' + backToHome() + '" aria-label="Menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button>'
         +       '<h1 class="showroom-syllabus-appbar-title">Ember Studio</h1>'
         +     '</div>'
         // CSP note: Stitch source used an external avatar image URL. Replaced
         // with an initial-letter bubble so the Showroom stays same-origin.
         +     '<div class="showroom-syllabus-avatar" onclick="' + nav("profile") + '" aria-label="Profile">'
         +       '<span>' + escHtml(userInitial) + '</span>'
         +     '</div>'
         +   '</header>'
         +   '<main class="showroom-syllabus-main">'
         +     '<section class="showroom-syllabus-hero">'
         +       '<div class="showroom-syllabus-hero-flare" aria-hidden="true"></div>'
         +       '<div class="showroom-syllabus-hero-head">'
         +         '<div>'
         +           '<span class="showroom-syllabus-eyebrow">CURRENT COURSE</span>'
         +           '<h2 class="showroom-syllabus-course-title">' + escHtml(courseName) + '</h2>'
         +         '</div>'
         +         '<div class="showroom-syllabus-level-pill">'
         +           '<span class="material-symbols-outlined fill" aria-hidden="true" style="font-size:14px">workspace_premium</span>'
         +           '<span>Lvl ' + escHtml(String(level)) + '</span>'
         +         '</div>'
         +       '</div>'
         +       '<div class="showroom-syllabus-hero-stats">'
         +         '<div class="showroom-syllabus-ring">'
         +           '<svg viewBox="0 0 100 100" aria-hidden="true">'
         +             '<circle class="showroom-syllabus-ring-track" cx="50" cy="50" r="' + ringR + '" fill="transparent" stroke-width="8"></circle>'
         +             '<circle class="showroom-syllabus-ring-fill"  cx="50" cy="50" r="' + ringR + '" fill="transparent" stroke-width="8"'
         +               ' stroke-linecap="round"'
         +               ' stroke-dasharray="' + ringC.toFixed(2) + '"'
         +               ' stroke-dashoffset="' + ringOffset.toFixed(2) + '"></circle>'
         +           '</svg>'
         +           '<div class="showroom-syllabus-ring-label">'
         +             '<span class="showroom-syllabus-ring-num">' + escHtml(String(progressPct)) + '%</span>'
         +             '<span class="showroom-syllabus-ring-unit">DONE</span>'
         +           '</div>'
         +         '</div>'
         +         '<div class="showroom-syllabus-xp">'
         +           '<div class="showroom-syllabus-xp-row">'
         +             '<span class="material-symbols-outlined fill" aria-hidden="true" style="font-size:14px">bolt</span>'
         +             '<span>Next: ' + escHtml(nextXpGoal) + '</span>'
         +           '</div>'
         +           '<div class="showroom-syllabus-xp-bar"><div class="showroom-syllabus-xp-fill" style="width:' + Math.max(0, Math.min(100, progressPct)) + '%"></div></div>'
         +         '</div>'
         +       '</div>'
         +     '</section>'
         +     '<section class="showroom-syllabus-timeline">'
         +       '<div class="showroom-syllabus-timeline-line" aria-hidden="true"></div>'
         +       timelineHtml
         +     '</section>'
         +   '</main>'
         +   bottomNav(navItems, "curriculum")
         + '</div>';
  }

  window.SparkCurriculumDashboard = { render: curriculumDashboardRender };
  window.SparkOnboardingWelcome   = { render: onboardingWelcomeRender };
  window.SparkCourseSyllabus      = { render: courseSyllabusRender };
  window.SparkShowroom       = SparkShowroom;
})();
