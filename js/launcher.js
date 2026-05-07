// js/launcher.js — SparkInstruments registry and Showroom launcher screen
(function() {

  var _instruments = [];
  var _active = null;

  // Instrument -> accent dot colour (Warm Ember palette)
  var INSTRUMENT_ACCENT = {
    guitar: "#FF2D55",
    bass:   "#7C3AED",
    ukulele:"#14B8A6",
    piano:  "#0EA5E9",
    drums:  "#FFE66D",
    vocals: "#F472B6"
  };

  // Instrument -> fallback emoji glyph
  var INSTRUMENT_GLYPH = {
    guitar: "\uD83C\uDFB8",
    bass:   "\uD83C\uDFB8",
    ukulele:"\uD83C\uDFBB",
    piano:  "\uD83C\uDFB9",
    drums:  "\uD83E\uDD41",
    vocals: "\uD83C\uDFA4"
  };

  // Instrument -> default subtitle shown under the card name
  var INSTRUMENT_SUBTITLE = {
    guitar: "6-String Electric",
    bass:   "4-String Heavy",
    ukulele:"4-String Soprano",
    piano:  "88-Key Ivory",
    drums:  "Acoustic Kit",
    vocals: "Pitch & Breath"
  };

  function instrumentType(inst) {
    return (inst && (inst.instrument || inst.instrumentType)) || "guitar";
  }

  function accentFor(inst) {
    return (inst && inst.accentColor) || INSTRUMENT_ACCENT[instrumentType(inst)] || "#FF7B3A";
  }

  function glyphFor(inst) {
    return (inst && inst.icon) || INSTRUMENT_GLYPH[instrumentType(inst)] || "\uD83C\uDFB5";
  }

  function subtitleFor(inst) {
    return (inst && inst.tagline) || INSTRUMENT_SUBTITLE[instrumentType(inst)] || "";
  }

  function canLaunchPerformance(inst) {
    var data;
    if (!inst || typeof inst.getData !== "function") return false;
    try { data = inst.getData() || {}; }
    catch (e) { return false; }
    return Array.isArray(data.SONGS) && data.SONGS.length > 0;
  }

  function scrollLauncherTopSoon() {
    if (typeof window === "undefined" || typeof window.scrollTo !== "function") return;
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function(){ window.scrollTo(0, 0); });
      return;
    }
    setTimeout(function(){ window.scrollTo(0, 0); }, 0);
  }

  function deferredAssetsPending() {
    return typeof SparkBootLoader !== "undefined"
      && SparkBootLoader
      && typeof SparkBootLoader.hasDeferredScripts === "function"
      && SparkBootLoader.hasDeferredScripts();
  }

  function deferredAssetsFailed() {
    return typeof SparkBootLoader !== "undefined"
      && SparkBootLoader
      && typeof SparkBootLoader.hasFailures === "function"
      && SparkBootLoader.hasFailures();
  }

  function ensureDeferredAssets(callback) {
    if (!deferredAssetsPending()) {
      return false;
    }
    SparkBootLoader.loadDeferredScripts(callback);
    return true;
  }

  function renderLauncherLoading(view) {
    return '' +
      '<div class="showroom-root">' +
        '<div class="showroom-woodgrain" aria-hidden="true"></div>' +
        '<div class="showroom-content" style="padding-top:32px">' +
          '<section class="showroom-section">' +
            '<div class="showroom-stat-wide showroom-glass">' +
              '<div>' +
                '<div class="showroom-stat-label">Loading</div>' +
                '<div class="showroom-stat-row">' +
                  '<span class="showroom-stat-num" style="font-size:28px">Preparing ' + safeEsc(view || "view") + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>' +
        renderBottomNav("home") +
      '</div>';
  }

  function renderLauncherLoadFailure(view) {
    var failures = (typeof SparkBootLoader !== "undefined" && SparkBootLoader && typeof SparkBootLoader.getFailures === "function")
      ? SparkBootLoader.getFailures()
      : [];
    var details = failures.length
      ? 'Missing: ' + safeEsc(failures.join(", "))
      : 'A deferred startup module could not be loaded.';
    return '' +
      '<div class="showroom-root">' +
        '<div class="showroom-woodgrain" aria-hidden="true"></div>' +
        '<div class="showroom-content" style="padding-top:32px">' +
          '<section class="showroom-section">' +
            '<div class="showroom-stat-wide showroom-glass">' +
              '<div>' +
                '<div class="showroom-stat-label">Startup Problem</div>' +
                '<div class="showroom-stat-row">' +
                  '<span class="showroom-stat-num" style="font-size:28px">Could not load ' + safeEsc(view || "launcher") + '</span>' +
                '</div>' +
                '<p class="showroom-card-sub" style="margin:12px 0 0">' + details + '</p>' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>' +
        renderBottomNav("home") +
      '</div>';
  }

  function safeEsc(s) {
    if (typeof escHTML === "function") return escHTML(s == null ? "" : String(s));
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c];
    });
  }

  function sumSuiteStats(profile) {
    var out = { totalXp: 0, maxStreak: 0, mastered: 0, weeklyHours: 0, weeklyDelta: null };
    if (!profile) return out;
    if (profile.suiteRewards) {
      if (typeof profile.suiteRewards.weeklyHours === "number") out.weeklyHours = profile.suiteRewards.weeklyHours;
      if (typeof profile.suiteRewards.weeklyDeltaPct === "number") out.weeklyDelta = profile.suiteRewards.weeklyDeltaPct;
    }
    if (profile.apps) {
      for (var appId in profile.apps) {
        var app = profile.apps[appId] || {};
        var st = app.stats || {};
        out.totalXp += (st.xp || 0);
        var s = st.streakDays || 0;
        if (s > out.maxStreak) out.maxStreak = s;
        if (st.skills && typeof st.skills.mastered === "number") {
          out.mastered += st.skills.mastered;
        } else if (typeof st.mastered === "number") {
          out.mastered += st.mastered;
        }
        if (typeof st.weeklyMinutes === "number") {
          out.weeklyHours += st.weeklyMinutes / 60;
        }
      }
    }
    return out;
  }

  function isMastered(appStats) {
    if (!appStats) return false;
    if (typeof appStats.mastered === "boolean") return appStats.mastered;
    if (typeof appStats.level === "number" && appStats.level >= 10) return true;
    return false;
  }

  function featuredInstrument() {
    if (_active && _active.available !== false) return _active;
    for (var i = 0; i < _instruments.length; i++) {
      if (_instruments[i].available !== false) return _instruments[i];
    }
    return null;
  }

  function avatarInitial(profile) {
    var name = (profile && (profile.displayName || profile.name)) || "";
    if (!name) return "S";
    return String(name).trim().charAt(0).toUpperCase() || "S";
  }

  function renderAvatar(profile) {
    var src = profile && (profile.avatarImage || profile.avatarUrl);
    var h = '<div class="showroom-avatar" role="button" tabindex="0" aria-label="Profile" onclick="act(\'openLauncherView\',\'profile\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'openLauncherView\',\'profile\')}">';
    if (src) {
      h += '<img src="' + safeEsc(src) + '" alt="Profile avatar">';
    } else {
      h += '<div class="showroom-avatar-inner">' + safeEsc(avatarInitial(profile)) + '</div>';
    }
    h += '</div>';
    return h;
  }

  function renderCardThumb(inst) {
    var type = instrumentType(inst);
    var img = inst && inst.iconImage;
    var h = '<div class="showroom-card-thumb">';
    if (img) {
      // onerror swaps the src to an SVG silhouette data-URI when the file
      // 404s — keeps the layout intact and avoids a broken-image icon
      // until the user drops a real PNG into resources/instruments/<id>/.
      h += '<img src="' + safeEsc(img) + '" alt="' + safeEsc(inst.name || "Instrument") + '"'
         + ' onerror="if(window.SparkShowroomSVG)SparkShowroomSVG.onCardImgError(this,\'' + safeEsc(type) + '\')">';
    } else if (typeof SparkShowroomSVG !== "undefined") {
      // Inline SVG silhouette in the per-instrument accent color — looks
      // intentional vs. the previous emoji+gradient fallback. Override by
      // setting `iconImage` on the SparkInstruments.register() call.
      h += '<div class="showroom-card-thumb-svg" aria-hidden="true">' + SparkShowroomSVG.card(type) + '</div>';
    } else {
      h += '<div class="showroom-card-thumb-fallback" aria-hidden="true">' + glyphFor(inst) + '</div>';
    }
    var dot = accentFor(inst);
    h += '<span class="showroom-card-dot" style="background:' + dot + ';box-shadow:0 0 8px ' + dot + '" aria-hidden="true"></span>';
    h += '</div>';
    return h;
  }

  function selectInstrument(appId) {
    if (ensureDeferredAssets(function() { selectInstrument(appId); })) return;
    SparkInstruments.activate(appId);
    if (typeof S !== "undefined") {
      S.activeInstrument = appId;
      S.launcherView = null;
      S._showroomOverride = null;
      if (typeof SCR !== "undefined") S.screen = SCR.HOME;
      if (typeof TAB !== "undefined") S.tab = TAB.PRACTICE;
    }
    if (typeof saveState === "function") saveState();
    if (typeof render === "function") render();
    scrollLauncherTopSoon();
  }

  function launchInstrumentPerformance(appId) {
    if (ensureDeferredAssets(function() { launchInstrumentPerformance(appId); })) return;
    SparkInstruments.activate(appId);
    if (typeof S !== "undefined") {
      S.activeInstrument = appId;
      S.launcherView = null;
      S._showroomOverride = null;
      if (typeof openPerformanceSongSelectionRequest === "function") openPerformanceSongSelectionRequest({});
      if (typeof SCR !== "undefined") S.screen = SCR.HOME;
      if (typeof TAB !== "undefined") S.tab = TAB.SONGS || TAB.PRACTICE;
    }
    if (typeof saveState === "function") saveState();
    if (typeof render === "function") render();
    scrollLauncherTopSoon();
  }

  function renderHero(featured, stats) {
    if (!featured) {
      return '' +
        '<section class="showroom-hero-wrap">' +
          '<div class="showroom-hero showroom-glass">' +
            '<div class="showroom-hero-bg"><div class="showroom-hero-bg-fallback" aria-hidden="true">\uD83C\uDFB5</div></div>' +
            '<div class="showroom-hero-content">' +
              '<span class="showroom-hero-badge">Studio Ready</span>' +
              '<h2 class="showroom-hero-title">Pick an Instrument</h2>' +
              '<p class="showroom-hero-meta">Choose from your collection below</p>' +
            '</div>' +
          '</div>' +
        '</section>';
    }

    var name = featured.name || "Instrument";
    var subtitle = subtitleFor(featured);
    var appStats = stats && stats.apps && stats.apps[featured.id] ? stats.apps[featured.id].stats : null;
    var badge = isMastered(appStats) ? "Mastered" : "Featured";
    var img = featured.heroImage || featured.iconImage;

    var instType = instrumentType(featured);
    var bg;
    if (img) {
      // onerror falls through to an SVG silhouette data-URI on 404 —
      // see renderCardThumb for the rationale.
      bg = '<img class="showroom-hero-bg-img" src="' + safeEsc(img) + '" alt=""'
         + ' onerror="if(window.SparkShowroomSVG)SparkShowroomSVG.onHeroImgError(this,\'' + safeEsc(instType) + '\')">';
    } else if (typeof SparkShowroomSVG !== "undefined") {
      bg = '<div class="showroom-hero-bg-svg" aria-hidden="true">' + SparkShowroomSVG.hero(instType) + '</div>';
    } else {
      bg = '<div class="showroom-hero-bg-fallback" aria-hidden="true">' + glyphFor(featured) + '</div>';
    }

    var performanceReady = canLaunchPerformance(featured);
    var onClick = performanceReady
      ? 'act(\'launcherLaunchPerformance\',\'' + safeEsc(featured.id) + '\')'
      : 'act(\'launcherSelectInstrument\',\'' + safeEsc(featured.id) + '\')';
    var ctaLabel = performanceReady ? 'Launch Performance' : 'Open Instrument';

    return '' +
      '<section class="showroom-hero-wrap">' +
        '<div class="showroom-hero showroom-glass">' +
          '<div class="showroom-hero-bg">' + bg + '</div>' +
          '<div class="showroom-hero-content">' +
            '<span class="showroom-hero-badge">' + safeEsc(badge) + '</span>' +
            '<h2 class="showroom-hero-title">' + safeEsc(name) + '</h2>' +
            (subtitle ? '<p class="showroom-hero-meta">' + safeEsc(subtitle) + '</p>' : '') +
            '<button class="showroom-cta" onclick="' + onClick + '">' +
              '<span class="material-symbols-outlined fill" aria-hidden="true">play_arrow</span>' +
              '<span>' + ctaLabel + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function renderCard(inst) {
    var type = instrumentType(inst);
    var onClick = 'act(\'launcherSelectInstrument\',\'' + safeEsc(inst.id) + '\')';
    var onKeyDown = 'if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + onClick + '}';
    return '' +
      '<div class="showroom-card showroom-glass" data-instrument="' + safeEsc(type) + '"'
        + ' onclick="' + onClick + '"'
        + ' onkeydown="' + onKeyDown + '"'
        + ' role="button" tabindex="0"'
        + ' aria-label="Launch ' + safeEsc(inst.name || type) + '">' +
        '<span class="showroom-card-accent" style="background:' + safeEsc(accentFor(inst)) + '" aria-hidden="true"></span>' +
        renderCardThumb(inst) +
        '<div class="showroom-card-text">' +
          '<h4 class="showroom-card-name">' + safeEsc(inst.name || type) + '</h4>' +
          '<p class="showroom-card-sub">' + safeEsc(subtitleFor(inst)) + '</p>' +
        '</div>' +
      '</div>';
  }

  function renderLockedCard() {
    return '' +
      '<div class="showroom-card locked" aria-disabled="true">' +
        '<div class="showroom-lock-circle"><span class="material-symbols-outlined">lock</span></div>' +
        '<div class="showroom-card-text">' +
          '<h4 class="showroom-card-name">Locked</h4>' +
          '<p class="showroom-card-sub">Level 15 Required</p>' +
        '</div>' +
      '</div>';
  }

  function renderStats(summary) {
    var hours = (summary.weeklyHours || 0).toFixed(1);
    var deltaHtml = '';
    if (typeof summary.weeklyDelta === "number") {
      var up = summary.weeklyDelta >= 0;
      var sign = up ? "+" : "";
      deltaHtml = '<div class="showroom-stat-delta" style="' + (up ? '' : 'color:#c45040') + '">'
        + '<span class="material-symbols-outlined">' + (up ? 'trending_up' : 'trending_down') + '</span>'
        + '<span>' + sign + summary.weeklyDelta.toFixed(0) + '%</span>'
        + '</div>';
    }

    return '' +
      '<section class="showroom-stats">' +
        '<div class="showroom-stat-wide showroom-glass">' +
          '<div>' +
            '<div class="showroom-stat-label">Weekly Flow State</div>' +
            '<div class="showroom-stat-row">' +
              '<span class="showroom-stat-num">' + hours + '</span>' +
              '<span class="showroom-stat-unit">Hours</span>' +
            '</div>' +
          '</div>' +
          deltaHtml +
        '</div>' +
        '<div class="showroom-stat-tile showroom-glass">' +
          '<span class="material-symbols-outlined fill showroom-stat-tile-icon" aria-hidden="true">local_fire_department</span>' +
          '<span class="showroom-stat-tile-num">' + (summary.maxStreak || 0) + '</span>' +
          '<span class="showroom-stat-tile-label">Day Streak</span>' +
        '</div>' +
        '<div class="showroom-stat-tile showroom-glass">' +
          '<span class="material-symbols-outlined fill showroom-stat-tile-icon" aria-hidden="true">album</span>' +
          '<span class="showroom-stat-tile-num">' + (summary.mastered || 0) + '</span>' +
          '<span class="showroom-stat-tile-label">Mastered</span>' +
        '</div>' +
      '</section>';
  }

  function renderBottomNav(activeView) {
    var items = [
      { id:"home",     label:"Home",     icon:"home_app_logo", onClick:"act('showLauncher')" },
      { id:"library",  label:"Library",  icon:"library_music", onClick:"act('openLauncherView','library')" },
      { id:"learn",    label:"Learn",    icon:"school",        onClick:"act('openLauncherView','learn')" },
      { id:"settings", label:"Settings", icon:"settings",      onClick:"act('openLauncherView','settings')" }
    ];
    var inner = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var isActive = it.id === activeView;
      inner += '<button class="showroom-navitem' + (isActive ? ' active' : '') + '"'
            + ' onclick="' + it.onClick + '" aria-label="' + safeEsc(it.label) + '"'
            + (isActive ? ' aria-current="page"' : '') + '>'
            + '<span class="material-symbols-outlined' + (isActive ? ' fill' : '') + '">' + it.icon + '</span>'
            + '<span>' + it.label + '</span>'
            + '</button>';
    }
    return '' +
      '<nav class="showroom-bottomnav" role="navigation" aria-label="Primary">' +
        '<div class="showroom-bottomnav-inner">' + inner + '</div>' +
      '</nav>';
  }

  function renderTopbar(profile, totalXp) {
    return '' +
      '<header class="showroom-topbar" role="banner">' +
        '<div class="showroom-topbar-inner">' +
          '<div class="showroom-topbar-left">' +
            renderAvatar(profile) +
            '<div class="showroom-brand-stack">' +
              '<span class="showroom-brand-kicker">Practice Console</span>' +
              '<span class="showroom-brand">SparkSuite</span>' +
            '</div>' +
          '</div>' +
          '<div class="showroom-xp-pill" role="status" aria-label="Total experience points">' +
            '<span class="material-symbols-outlined fill">workspace_premium</span>' +
            '<span>' + totalXp.toLocaleString() + ' XP</span>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function renderHome() {
    var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
    var summary = sumSuiteStats(profile);
    var featured = featuredInstrument();

    var cards = '';
    var available = [];
    for (var i = 0; i < _instruments.length; i++) {
      if (_instruments[i].available !== false) available.push(_instruments[i]);
    }
    for (var j = 0; j < available.length; j++) cards += renderCard(available[j]);
    if (available.length === 0 && deferredAssetsPending()) {
      cards += '<div class="showroom-card locked" aria-disabled="true"><div class="showroom-card-text"><h4 class="showroom-card-name">Loading instruments</h4><p class="showroom-card-sub">Finishing startup in the background</p></div></div>';
    } else if (available.length < 4) {
      cards += renderLockedCard();
    }

    var fabOnClick = featured
      ? 'act(\'launcherSelectInstrument\',\'' + safeEsc(featured.id) + '\')'
      : '';

    return '' +
      '<div class="showroom-root showroom-instruments-root">' +
        '<div class="showroom-woodgrain" aria-hidden="true"></div>' +
        renderTopbar(profile, summary.totalXp) +
        '<div class="showroom-content">' +
          renderHero(featured, profile) +
          '<section class="showroom-section">' +
            '<div class="showroom-section-head">' +
              '<h3 class="showroom-section-title">Your Collection</h3>' +
              '<button class="showroom-section-link" onclick="act(\'openLauncherView\',\'instruments\')">See All</button>' +
            '</div>' +
            '<div class="showroom-grid">' + cards + '</div>' +
          '</section>' +
          renderStats(summary) +
        '</div>' +
        '<button class="showroom-fab" aria-label="Quick launch" onclick="' + fabOnClick + '">' +
          '<span class="material-symbols-outlined fill">play_arrow</span>' +
        '</button>' +
        renderBottomNav("home") +
      '</div>';
  }

  function renderInstrumentsView() {
    var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
    var cards = '';
    var available = [];
    for (var i = 0; i < _instruments.length; i++) {
      if (_instruments[i].available !== false) available.push(_instruments[i]);
    }
    for (var j = 0; j < available.length; j++) cards += renderCard(available[j]);
    if (available.length === 0 && deferredAssetsPending()) {
      cards += '<div class="showroom-card locked" aria-disabled="true"><div class="showroom-card-text"><h4 class="showroom-card-name">Loading instruments</h4><p class="showroom-card-sub">Finishing startup in the background</p></div></div>';
    } else if (available.length < 4) {
      cards += renderLockedCard();
    }

    return '' +
      '<div class="showroom-root">' +
        '<div class="showroom-woodgrain" aria-hidden="true"></div>' +
        renderTopbar(profile, sumSuiteStats(profile).totalXp) +
        '<div class="showroom-content">' +
          '<section class="showroom-section">' +
            '<div class="showroom-section-head">' +
              '<h3 class="showroom-section-title">All Instruments</h3>' +
            '</div>' +
            '<p class="showroom-card-sub" style="margin:0 0 16px">Jump into any instrument in your collection.</p>' +
            '<div class="showroom-grid">' + cards + '</div>' +
          '</section>' +
        '</div>' +
        renderBottomNav("home") +
      '</div>';
  }

  function renderLauncherView(view) {
    var route = {
      home: typeof renderHome === "function" ? renderHome : null,
      back: typeof renderHome === "function" ? renderHome : null,
      instruments: typeof renderInstrumentsView === "function" ? renderInstrumentsView : null,
      profile: typeof SparkProfileScreen !== "undefined" && SparkProfileScreen && typeof SparkProfileScreen.render === "function"
        ? SparkProfileScreen.render
        : null,
      leaderboard: typeof SparkLeaderboard !== "undefined" && SparkLeaderboard && typeof SparkLeaderboard.render === "function"
        ? SparkLeaderboard.render
        : null,
      library: typeof SparkSongLibrary !== "undefined" && SparkSongLibrary && typeof SparkSongLibrary.render === "function"
        ? SparkSongLibrary.render
        : null,
      "song-details": typeof SparkSongDetails !== "undefined" && SparkSongDetails && typeof SparkSongDetails.render === "function"
        ? SparkSongDetails.render
        : null,
      tuner: typeof SparkTuner !== "undefined" && SparkTuner && typeof SparkTuner.render === "function"
        ? SparkTuner.render
        : null,
      tools: typeof SparkTuner !== "undefined" && SparkTuner && typeof SparkTuner.render === "function"
        ? SparkTuner.render
        : null,
      practice: typeof SparkPracticeMetro !== "undefined" && SparkPracticeMetro && typeof SparkPracticeMetro.render === "function"
        ? SparkPracticeMetro.render
        : null,
      learn: typeof SparkPath !== "undefined" && SparkPath && typeof SparkPath.render === "function"
        ? SparkPath.render
        : null,
      path: typeof SparkPath !== "undefined" && SparkPath && typeof SparkPath.render === "function"
        ? SparkPath.render
        : null,
      lesson: typeof SparkLesson !== "undefined" && SparkLesson && typeof SparkLesson.render === "function"
        ? SparkLesson.render
        : null,
      insights: typeof insightsDashboardPage === "function"
        ? insightsDashboardPage
        : null,
      "practice-metro": typeof SparkPracticeMetro !== "undefined" && SparkPracticeMetro && typeof SparkPracticeMetro.render === "function"
        ? SparkPracticeMetro.render
        : null,
      "session-summary": typeof SparkSessionSummary !== "undefined" && SparkSessionSummary && typeof SparkSessionSummary.render === "function"
        ? SparkSessionSummary.render
        : null,
      performance: typeof SparkPerformance !== "undefined" && SparkPerformance && typeof SparkPerformance.render === "function"
        ? SparkPerformance.render
        : null,
      calibration: typeof performCalibrationPage === "function"
        ? performCalibrationPage
        : null,
      curriculum: typeof SparkCurriculumDashboard !== "undefined" && SparkCurriculumDashboard && typeof SparkCurriculumDashboard.render === "function"
        ? SparkCurriculumDashboard.render
        : null,
      syllabus: typeof SparkCourseSyllabus !== "undefined" && SparkCourseSyllabus && typeof SparkCourseSyllabus.render === "function"
        ? SparkCourseSyllabus.render
        : null,
      onboarding: typeof SparkOnboardingWelcome !== "undefined" && SparkOnboardingWelcome && typeof SparkOnboardingWelcome.render === "function"
        ? SparkOnboardingWelcome.render
        : null,
      settings: typeof SparkSettings !== "undefined" && SparkSettings && typeof SparkSettings.render === "function"
        ? SparkSettings.render
        : null
    };
    var renderer = route[view] || route.home;
    if (deferredAssetsFailed()) return renderLauncherLoadFailure(view);
    if ((view === "home" || view === "instruments") && deferredAssetsPending()) {
      ensureDeferredAssets(function() {
        if (typeof render === "function") render();
      });
      if (view === "instruments") return renderLauncherLoading(view);
    }
    if (!route[view] && deferredAssetsPending()) {
      ensureDeferredAssets(function() {
        if (typeof render === "function") render();
      });
      return view === "home" ? renderHome() : renderLauncherLoading(view);
    }
    return renderer ? renderer() : "";
  }

  var SparkInstruments = {
    register: function(config) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === config.id) return;
      }
      _instruments.push(config);
      if (typeof S !== "undefined" && !S.activeInstrument && typeof render === "function") {
        render();
      }
    },

    selectInstrument: selectInstrument,
    launchInstrumentPerformance: launchInstrumentPerformance,

    activate: function(appId) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === appId) {
          _active = _instruments[i];
          if (typeof S !== "undefined") {
            S._showroomOverride = null;
            S.launcherView = null;
          }
          if (_active.init) _active.init();
          // Per CLAUDE.md engine-first rules: per-instrument XP/streak/level/
          // session counts are owned by the SparkProfile.apps[appId].stats
          // engine-layer struct. Sync those into the legacy S.* mirrors so
          // the (dumb-renderer) header and other UI reflect this instrument's
          // numbers, not whatever was last accumulated globally. Backfill
          // first so existing (pre-migration) users don't see zeros.
          if (typeof SparkInstrumentProgress !== "undefined") {
            SparkInstrumentProgress.backfillFromLegacyIfEmpty();
            SparkInstrumentProgress.syncFromActive();
          }
          // Rebuild the daily practice plan for the newly-active instrument.
          // The sparkCore session cache + legacy S.practicePlan are both
          // keyed by (date, instrumentType); activate() is the moment we
          // know the instrument has changed, so drive the rebuild here
          // rather than relying on the Practice page to notice.
          if (typeof ensurePracticePlan === "function") {
            try { ensurePracticePlan({ forceRebuild: true }); }
            catch (err) { console.error("activate: ensurePracticePlan failed", err); }
          }
          return;
        }
      }
    },

    deactivate: function() {
      // Clean up any running timers before switching instruments
      if (typeof T !== "undefined") {
        clearTimeout(T.session);clearTimeout(T.drill);clearTimeout(T.daily);
        clearInterval(T.fingerEx);clearInterval(T.strum);clearInterval(T.song);
        clearInterval(T.metro);clearInterval(T.prog);clearInterval(T.undo);
        if(T.sessionStep){clearInterval(T.sessionStep);T.sessionStep=null;}
        if(T.chordChange){clearInterval(T.chordChange);T.chordChange=null;}
      }
      if(typeof stopMetronome==="function")try{stopMetronome();}catch(e){}
      // Clear Showroom dispatch state too so a stale override (e.g. user was
      // on Profile when they deactivated via the legacy header back button)
      // doesn't follow into the next instrument's session.
      if (typeof S !== "undefined") {
        S._showroomOverride = null;
        S.launcherView = null;
        S.screen = "home";
        S.tab = "practice";
      }
      _active = null;
    },

    getActive: function() { return _active; },
    getAll: function() { return _instruments.slice(); },

    getPage: function(screenId) {
      if (typeof S !== "undefined" && S.activeInstrument && (!_active || _active.id !== S.activeInstrument)) {
        for (var i = 0; i < _instruments.length; i++) {
          if (_instruments[i] && _instruments[i].id === S.activeInstrument) {
            _active = _instruments[i];
            break;
          }
        }
      }
      if (!_active || !_active.pages) return null;
      return _active.pages[screenId] || null;
    },

    // Ask the app shell to show the launcher home view
    showLauncher: function() {
      _active = null;
      if (typeof S !== "undefined") {
        S.activeInstrument = null;
        S._showroomOverride = null;
        S.launcherView = "home";
      }
      if (typeof saveState === "function") saveState();
      if (typeof render === "function") render();
      scrollLauncherTopSoon();
    },

    // Switch the launcher to a named view (settings/library/learn)
    openLauncherView: function(view) {
      if (typeof S === "undefined") return;
      _active = null;
      S.activeInstrument = null;
      S._showroomOverride = null;
      S.launcherView = view || "home";
      if (typeof saveState === "function") saveState();
      if (typeof render === "function") render();
      scrollLauncherTopSoon();
    },

    renderLauncher: function() {
      var view = typeof S !== "undefined" && S && S.launcherView ? S.launcherView : "home";
      return renderLauncherView(view);
    }
  };

  window.SparkInstruments = SparkInstruments;
})();
