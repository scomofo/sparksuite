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
    drums:  "#FFE66D"
  };

  // Instrument -> fallback emoji glyph
  var INSTRUMENT_GLYPH = {
    guitar: "\uD83C\uDFB8",
    bass:   "\uD83C\uDFB8",
    ukulele:"\uD83C\uDFBB",
    piano:  "\uD83C\uDFB9",
    drums:  "\uD83E\uDD41"
  };

  // Instrument -> default subtitle shown under the card name
  var INSTRUMENT_SUBTITLE = {
    guitar: "6-String Electric",
    bass:   "4-String Heavy",
    ukulele:"4-String Soprano",
    piano:  "88-Key Ivory",
    drums:  "Acoustic Kit"
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
    var h = '<div class="showroom-avatar" role="button" tabindex="0" aria-label="Profile">';
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
    SparkInstruments.activate(appId);
    if (typeof S !== "undefined") {
      S.activeInstrument = appId;
      if (typeof SCR !== "undefined") S.screen = SCR.HOME;
      if (typeof TAB !== "undefined") S.tab = TAB.PRACTICE;
    }
    if (typeof saveState === "function") saveState();
    if (typeof render === "function") render();
  }

  function renderHero(featured, stats) {
    if (!featured) {
      return '' +
        '<section class="showroom-hero-wrap">' +
          '<div class="showroom-hero showroom-glass">' +
            '<div class="showroom-hero-bg"><div class="showroom-hero-bg-fallback" aria-hidden="true">\uD83C\uDFB5</div></div>' +
            '<div class="showroom-hero-content">' +
              '<span class="showroom-hero-badge">Get Started</span>' +
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

    var onClick = 'SparkInstruments.selectInstrument(\'' + safeEsc(featured.id) + '\')';

    return '' +
      '<section class="showroom-hero-wrap">' +
        '<div class="showroom-hero showroom-glass">' +
          '<div class="showroom-hero-bg">' + bg + '</div>' +
          '<div class="showroom-hero-content">' +
            '<span class="showroom-hero-badge">' + safeEsc(badge) + '</span>' +
            '<h2 class="showroom-hero-title">' + safeEsc(name) + '</h2>' +
            (subtitle ? '<p class="showroom-hero-meta">' + safeEsc(subtitle) + '</p>' : '') +
            '<button class="showroom-cta" onclick="' + onClick + '">Launch Performance</button>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function renderCard(inst) {
    var type = instrumentType(inst);
    var onClick = 'SparkInstruments.selectInstrument(\'' + safeEsc(inst.id) + '\')';
    return '' +
      '<div class="showroom-card showroom-glass" data-instrument="' + safeEsc(type) + '"'
        + ' onclick="' + onClick + '"'
        + ' role="button" tabindex="0"'
        + ' aria-label="Launch ' + safeEsc(inst.name || type) + '">' +
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
          '<span class="material-symbols-outlined fill showroom-stat-tile-icon">local_fire_department</span>' +
          '<span class="showroom-stat-tile-num">' + (summary.maxStreak || 0) + '</span>' +
          '<span class="showroom-stat-tile-label">Day Streak</span>' +
        '</div>' +
        '<div class="showroom-stat-tile showroom-glass">' +
          '<span class="material-symbols-outlined fill showroom-stat-tile-icon">album</span>' +
          '<span class="showroom-stat-tile-num">' + (summary.mastered || 0) + '</span>' +
          '<span class="showroom-stat-tile-label">Mastered</span>' +
        '</div>' +
      '</section>';
  }

  function renderBottomNav(activeView) {
    var items = [
      { id:"home",     label:"Home",     icon:"home_app_logo", onClick:"SparkInstruments.showLauncher()" },
      { id:"library",  label:"Library",  icon:"library_music", onClick:"SparkInstruments.openLauncherView('library')" },
      { id:"learn",    label:"Learn",    icon:"school",        onClick:"SparkInstruments.openLauncherView('learn')" },
      { id:"settings", label:"Settings", icon:"settings",      onClick:"SparkInstruments.openLauncherView('settings')" }
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
            '<span class="showroom-brand">SparkSuite</span>' +
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
    if (available.length < 4) cards += renderLockedCard();

    var fabOnClick = featured
      ? 'SparkInstruments.selectInstrument(\'' + safeEsc(featured.id) + '\')'
      : '';

    return '' +
      '<div class="showroom-root">' +
        '<div class="showroom-woodgrain" aria-hidden="true"></div>' +
        renderTopbar(profile, summary.totalXp) +
        '<div class="showroom-content">' +
          renderHero(featured, profile) +
          '<section class="showroom-section">' +
            '<div class="showroom-section-head">' +
              '<h3 class="showroom-section-title">Your Collection</h3>' +
              '<button class="showroom-section-link">See All</button>' +
            '</div>' +
            '<div class="showroom-grid">' + cards + '</div>' +
          '</section>' +
          renderStats(summary) +
        '</div>' +
        '<button class="showroom-fab" aria-label="Quick launch" onclick="' + fabOnClick + '">' +
          '<span class="material-symbols-outlined">add</span>' +
        '</button>' +
        renderBottomNav("home") +
      '</div>';
  }

  var SparkInstruments = {
    register: function(config) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === config.id) return;
      }
      _instruments.push(config);
    },

    selectInstrument: selectInstrument,

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
      }
      _active = null;
    },

    getActive: function() { return _active; },
    getAll: function() { return _instruments.slice(); },

    getPage: function(screenId) {
      if (!_active || !_active.pages) return null;
      return _active.pages[screenId] || null;
    },

    // Ask the app shell to show the launcher home view
    showLauncher: function() {
      if (typeof S !== "undefined") S.activeInstrument = null;
      if (typeof S !== "undefined") S.launcherView = "home";
      if (typeof saveState === "function") saveState();
      if (typeof render === "function") render();
    },

    // Switch the launcher to a named view (settings/library/learn)
    openLauncherView: function(view) {
      if (typeof S === "undefined") return;
      S.activeInstrument = null;
      S.launcherView = view || "home";
      if (typeof saveState === "function") saveState();
      if (typeof render === "function") render();
    },

    renderLauncher: function() {
      // The launcher only renders its own home (instrument picker). The
      // bottom-nav Library / Learn / Settings views previously dispatched
      // to Showroom modules, which are design-reference mocks (see
      // js/showroom/spark-showroom.js) — so those views fall through to
      // home until they're either wired to real data or replaced with
      // legacy-backed screens.
      return renderHome();
    }
  };

  window.SparkInstruments = SparkInstruments;
})();
