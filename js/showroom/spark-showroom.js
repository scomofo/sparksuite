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
  function getShowroomCoreView() {
    var core = (typeof window !== "undefined" && window.sparkCore)
      || (typeof sparkCore !== "undefined" ? sparkCore : null);
    return core && typeof core.getActiveSessionView === "function" ? core.getActiveSessionView() : null;
  }
  function getShowroomActiveGuidedSessionNum() {
    var view = getShowroomCoreView();
    var context = view && view.plan && view.plan.context ? view.plan.context : null;
    if (!view || !view.plan || view.plan.flow !== "guided_session") return null;
    if (!view.runtimeState || view.runtimeState.activeScreen !== "guided_session") return null;
    if (context && context.guidedSession != null) {
      var contextNum = parseInt(context.guidedSession, 10);
      return isFinite(contextNum) ? contextNum : null;
    }
    if (view.plan.lesson && view.plan.lesson.num != null) {
      var lessonNum = parseInt(view.plan.lesson.num, 10);
      return isFinite(lessonNum) ? lessonNum : null;
    }
    return null;
  }
  function getShowroomLessonCtaAction(lesson) {
    if (!lesson || lesson.num == null) return nav("path");
    var lessonNum = parseInt(lesson.num, 10);
    if (getShowroomActiveGuidedSessionNum() === lessonNum) return "act('resume_guided_session')";
    return "act('start_guided_session'," + jsArg(String(lesson.num)) + ")";
  }
  function getShowroomLessonCtaLabel(lesson) {
    if (!lesson || lesson.num == null) return "Open Path";
    return getShowroomActiveGuidedSessionNum() === parseInt(lesson.num, 10)
      ? "Resume Practice"
      : "Start Practice";
  }
  function normalizeShowroomText(value) {
    var text;
    var lower;
    if (value == null) return "";
    if (typeof value !== "string" && typeof value !== "number") return "";
    text = String(value).replace(/_/g, " ").trim();
    if (!text) return "";
    lower = text.toLowerCase();
    if (lower === "undefined" || lower === "null" || lower === "nan") return "";
    return text;
  }
  function humanizeShowroomToken(value) {
    var text = normalizeShowroomText(value);
    var parts;
    var out = [];
    var i;
    if (!text) return "";
    parts = text.split(/\s+/);
    for (i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      out.push(parts[i].charAt(0).toUpperCase() + parts[i].slice(1));
    }
    return out.join(" ");
  }
  function pickShowroomNumber() {
    var i;
    var value;
    for (i = 0; i < arguments.length; i++) {
      value = arguments[i];
      if (typeof value === "number" && isFinite(value)) return value;
    }
    return null;
  }
  function clampShowroomPct(value) {
    var num = pickShowroomNumber(value);
    if (num == null) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  }
  function getShowroomStoredProfile() {
    if (typeof SparkStorage === "undefined" || !SparkStorage || typeof SparkStorage.load !== "function") return null;
    try { return SparkStorage.load(); }
    catch (e) { return null; }
  }
  function getShowroomStateProfileValue(key) {
    if (typeof S === "undefined" || !S) return "";
    if (S.profile && S.profile[key] != null) return S.profile[key];
    if (S.sparkProfile && S.sparkProfile[key] != null) return S.sparkProfile[key];
    if (S.cloudProfile && S.cloudProfile[key] != null) return S.cloudProfile[key];
    return "";
  }
  function getShowroomProfileDisplayName(profile) {
    return normalizeShowroomText(profile && (profile.displayName || profile.name))
      || normalizeShowroomText(getShowroomStateProfileValue("displayName"))
      || "Spark Player";
  }
  function getShowroomProfileAvatarSrc(profile) {
    return normalizeShowroomText(profile && (profile.avatarImage || profile.avatarUrl))
      || normalizeShowroomText(getShowroomStateProfileValue("avatarImage"))
      || normalizeShowroomText(getShowroomStateProfileValue("avatarUrl"))
      || "";
  }
  function getShowroomPrimaryInstrument(profile) {
    var active;
    var candidate = normalizeShowroomText(profile && (profile.selectedInstrument || profile.instrumentPrimary))
      || normalizeShowroomText(getShowroomStateProfileValue("instrumentPrimary"));
    if (candidate) return candidate.toLowerCase();
    active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive ? SparkInstruments.getActive() : null;
    if (active) {
      candidate = normalizeShowroomText(active.instrument || active.instrumentType || active.id || active.appId);
      if (candidate) return candidate.toLowerCase();
    }
    if (profile && profile.apps) {
      for (candidate in profile.apps) {
        if (!Object.prototype.hasOwnProperty.call(profile.apps, candidate)) continue;
        return normalizeShowroomText((profile.apps[candidate] || {}).instrument || candidate).toLowerCase() || "guitar";
      }
    }
    return "guitar";
  }
  function showroomInstrumentDisplayName(type) {
    var value = normalizeShowroomText(type).toLowerCase();
    if (!value) return "Instrument";
    if (value === "chordspark" || value === "guitar") return "Guitar";
    if (value === "pianospark" || value === "piano") return "Piano";
    if (value === "bassspark" || value === "bass") return "Bass";
    if (value === "ukespark" || value === "ukulele") return "Ukulele";
    return humanizeShowroomToken(value);
  }
  function getShowroomAvatarInitial(profile) {
    var name = getShowroomProfileDisplayName(profile);
    return name ? name.charAt(0).toUpperCase() : "S";
  }
  function resolveShowroomProfileApp(profile, inst) {
    var apps;
    var keys = [];
    var i;
    var key;
    var targetType;
    if (!profile || !profile.apps || !inst) return null;
    apps = profile.apps;
    if (inst.id) keys.push(inst.id);
    if (inst.appId && keys.indexOf(inst.appId) < 0) keys.push(inst.appId);
    for (i = 0; i < keys.length; i++) {
      if (apps[keys[i]]) return apps[keys[i]];
    }
    targetType = normalizeShowroomText(inst.instrument || inst.instrumentType || inst.id || inst.appId).toLowerCase();
    for (key in apps) {
      if (!Object.prototype.hasOwnProperty.call(apps, key)) continue;
      if (normalizeShowroomText((apps[key] || {}).instrument).toLowerCase() === targetType) return apps[key];
    }
    return null;
  }
  function hasShowroomProgress(stats) {
    return !!(
      pickShowroomNumber(stats && stats.xp, 0) > 0 ||
      pickShowroomNumber(stats && stats.level, 1) > 1 ||
      pickShowroomNumber(stats && stats.lessonsCompleted, 0) > 0 ||
      pickShowroomNumber(stats && stats.sessionsCompleted, 0) > 0 ||
      pickShowroomNumber(stats && stats.streakDays, 0) > 0
    );
  }
  function deriveShowroomProgressPct(stats) {
    var pct = pickShowroomNumber(stats && stats.progressPct);
    var lessons = pickShowroomNumber(stats && stats.lessonsCompleted, 0);
    var sessions = pickShowroomNumber(stats && stats.sessionsCompleted, 0);
    var level = pickShowroomNumber(stats && stats.level, 1);
    if (pct != null) return clampShowroomPct(pct);
    if (lessons > 0) return Math.min(100, lessons * 20);
    if (sessions > 0) return Math.min(100, sessions * 10);
    if (level > 1) return Math.min(100, (level - 1) * 10);
    return 0;
  }
  function buildShowroomProfileProgressRows(profile) {
    var insts = (typeof SparkInstruments !== "undefined" && SparkInstruments.getAll) ? SparkInstruments.getAll() : [];
    var rows = [];
    var seen = {};
    var key;
    function pushRow(type, name, stats) {
      var typeKey = normalizeShowroomText(type).toLowerCase() || "instrument";
      var rowKey = normalizeShowroomText(name).toLowerCase() || typeKey;
      var color;
      var icon;
      if (seen[rowKey]) return;
      seen[rowKey] = true;
      color = typeKey === "piano" ? "#0EA5E9"
            : typeKey === "bass" ? "#7C3AED"
            : typeKey === "ukulele" ? "#14B8A6"
            : "#FF2D55";
      icon = typeKey === "piano" ? "piano"
           : typeKey === "bass" ? "speaker"
           : typeKey === "ukulele" ? "music_note"
           : "graphic_eq";
      rows.push({
        type: typeKey,
        name: name || showroomInstrumentDisplayName(typeKey),
        icon: icon,
        color: color,
        pct: deriveShowroomProgressPct(stats || {}),
        started: hasShowroomProgress(stats || {})
      });
    }
    if (insts && insts.length) {
      for (key = 0; key < insts.length; key++) {
        var inst = insts[key] || {};
        var app = resolveShowroomProfileApp(profile, inst);
        pushRow(inst.instrument || inst.instrumentType || inst.id || inst.appId, inst.name || showroomInstrumentDisplayName(inst.instrument || inst.id), app && app.stats ? app.stats : {});
      }
    }
    if (profile && profile.apps) {
      for (key in profile.apps) {
        if (!Object.prototype.hasOwnProperty.call(profile.apps, key)) continue;
        var appProfile = profile.apps[key] || {};
        pushRow(appProfile.instrument || key, showroomInstrumentDisplayName(appProfile.instrument || key), appProfile.stats || {});
      }
    }
    if (!rows.length) {
      pushRow(getShowroomPrimaryInstrument(profile), showroomInstrumentDisplayName(getShowroomPrimaryInstrument(profile)), {});
    }
    return rows;
  }
  function collectShowroomBadgeIds(profile) {
    var ids = [];
    var i;
    function pushUnique(value) {
      var id = normalizeShowroomText(value);
      if (!id || ids.indexOf(id) >= 0) return;
      ids.push(id);
    }
    if (profile && profile.suiteRewards && Array.isArray(profile.suiteRewards.badges)) {
      for (i = 0; i < profile.suiteRewards.badges.length; i++) pushUnique(profile.suiteRewards.badges[i]);
    }
    if (typeof S !== "undefined" && S.playerAchievements) {
      for (i in S.playerAchievements) {
        if (Object.prototype.hasOwnProperty.call(S.playerAchievements, i) && S.playerAchievements[i]) pushUnique(i);
      }
    }
    if (typeof S !== "undefined" && S.profile && Array.isArray(S.profile.achievements)) {
      for (i = 0; i < S.profile.achievements.length; i++) pushUnique(S.profile.achievements[i]);
    }
    return ids;
  }
  function getShowroomBadgeMeta(id) {
    var key = normalizeShowroomText(id).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    var map = {
      first_lesson: { icon: "school", color: "#FFE66D", label: "First Lesson" },
      first_session: { icon: "play_circle", color: "#FF7B3A", label: "First Session" },
      streak_3: { icon: "local_fire_department", color: "#FF7B3A", label: "3-Day Streak" },
      streak_7: { icon: "bolt", color: "#FF7B3A", label: "7-Day Spark" },
      xp_100: { icon: "star", color: "#FFE66D", label: "100 XP" },
      xp_1000: { icon: "workspace_premium", color: "#D4AF37", label: "1,000 XP" },
      dual_instrument_starter: { icon: "library_music", color: "#14B8A6", label: "Dual Instrument" },
      first_song: { icon: "music_note", color: "#FFE66D", label: "First Song" },
      practice_100: { icon: "timer", color: "#0EA5E9", label: "100 Minutes" },
      level_5: { icon: "military_tech", color: "#7C3AED", label: "Level 5" }
    };
    return map[key] || {
      icon: "workspace_premium",
      color: "#8FD5C4",
      label: humanizeShowroomToken(key)
    };
  }
  function getShowroomActiveInstrumentMeta() {
    var active;
    var all;
    var i;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") return null;
    active = SparkInstruments.getActive();
    if (!active) return null;
    if (typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      if (!all[i]) continue;
      if (all[i].id === active.id || all[i].id === active.appId || all[i].appId === active.id || all[i].appId === active.appId) return all[i];
    }
    return active;
  }
  function buildShowroomCurriculumModulesFromLessons(lessons) {
    var modules = [];
    var chunkSize = 3;
    var i;
    if (!Array.isArray(lessons) || !lessons.length) return modules;
    for (i = 0; i < lessons.length; i += chunkSize) {
      var chunk = lessons.slice(i, i + chunkSize);
      var lessonItems = [];
      var hasActive = false;
      var allDone = true;
      var hasStarted = false;
      var j;
      for (j = 0; j < chunk.length; j++) {
        var lesson = chunk[j] || {};
        var state = "locked";
        if (lesson.completed) {
          state = "done";
          hasStarted = true;
        } else if (lesson.active) {
          state = "now";
          hasActive = true;
          hasStarted = true;
          allDone = false;
        } else {
          allDone = false;
          state = hasStarted || i === 0 ? "unlocked" : "locked";
        }
        lessonItems.push({
          name: lesson.title || ("Session " + (lesson.num || (i + j + 1))),
          state: state
        });
      }
      modules.push({
        id: "module_" + (modules.length + 1),
        title: "Sessions " + (chunk[0].num || (i + 1)) + (chunk.length > 1 ? ("–" + (chunk[chunk.length - 1].num || (i + chunk.length))) : ""),
        status: allDone ? "COMPLETED" : (hasActive ? "RESUME" : (hasStarted || i === 0 ? "UP NEXT" : "LOCKED")),
        statusClass: allDone ? "completed" : (hasActive || hasStarted || i === 0 ? "active" : "locked"),
        state: allDone ? "completed" : (hasActive || hasStarted || i === 0 ? "active" : "locked"),
        lessons: lessonItems,
        cta: hasActive ? "Open Lesson" : null,
        showCta: hasActive
      });
    }
    return modules;
  }
  function getShowroomCurriculumSummary(opts) {
    var lessons = getActiveInstrumentLessons();
    var activeInstrument = getShowroomActiveInstrumentMeta();
    var completed = 0;
    var activeLesson = null;
    var i;
    opts = opts || {};
    for (i = 0; i < lessons.length; i++) {
      if (lessons[i].completed) completed++;
      if (!activeLesson && lessons[i].active) activeLesson = lessons[i];
    }
    return {
      courseTitle: normalizeShowroomText(opts.courseTitle) || ((activeInstrument && activeInstrument.name) ? (activeInstrument.name + " Path") : "Course Path"),
      level: opts.level != null ? opts.level : (activeLesson ? activeLesson.num : Math.max(1, completed)),
      progress: opts.progress != null ? opts.progress : (lessons.length ? Math.round((completed / lessons.length) * 100) : 0),
      progressPct: opts.progressPct != null ? opts.progressPct : (lessons.length ? Math.round((completed / lessons.length) * 100) : 0),
      nextGoalText: normalizeShowroomText(opts.nextGoalText)
        || (activeLesson
          ? ("Next up: Session " + activeLesson.num + " • " + activeLesson.title)
          : (lessons.length ? (completed + " sessions completed") : "No curriculum loaded yet")),
      modules: Array.isArray(opts.modules) ? opts.modules : buildShowroomCurriculumModulesFromLessons(lessons),
      userInitial: normalizeShowroomText(opts.userInitial) || getShowroomAvatarInitial(getShowroomStoredProfile())
    };
  }
  // Format a value as a single-quoted JS string literal safe to drop
  // inside a double-quoted HTML attribute (onclick="..."). Using
  // JSON.stringify here (which produces double quotes) would break the
  // surrounding attribute — unescaped " inside " ends the value early,
  // producing invalid HTML and a non-functional handler in some browsers.
  function jsArg(s) {
    return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  }

  // Second-arg form is used to pass a route parameter (e.g. a lesson number)
  // to the dispatcher so deep links like nav("lesson", 3) can land on a
  // specific record rather than the default lesson view.
  function nav(view, param) {
    return param !== undefined && param !== null
      ? "SparkShowroomNavigate(" + jsArg(view) + "," + jsArg(param) + ")"
      : "SparkShowroomNavigate(" + jsArg(view) + ")";
  }
  // Back arrow on sub-pages (Settings, Profile, etc.). Inside an instrument
  // this returns to the instrument's Practice page so users don't get dropped
  // out of instrument context. Outside, it goes to the launcher showcase.
  // The bottom-nav "Home" tab still uses nav("home") which intentionally
  // returns to the launcher.
  function backToHome() { return nav("back"); }

  // ───────────────────────────────────────────────────────────────────────
  // Lesson data helpers — normalize across instruments so pathRender and
  // lessonRender can work off a single shape. Ukulele exposes its richer
  // lesson list via SparkUkuleleLessons; guitar/piano/bass expose SESSIONS
  // on getData(). Both share num/title/level/bpm; ukulele adds a string id
  // and skill metadata, so we surface both id and num in the normalized
  // record.
  function getActiveInstrumentLessons() {
    if (typeof SparkInstruments === "undefined" || !SparkInstruments.getActive) return [];
    var inst = SparkInstruments.getActive();
    if (!inst) return [];
    var raw = [];
    var instrumentType = inst.instrument || inst.instrumentType || inst.id || inst.appId || null;
    if (instrumentType === "ukulele" && typeof window.SparkUkuleleLessons !== "undefined") {
      raw = window.SparkUkuleleLessons;
    } else if (typeof inst.getData === "function") {
      var data = inst.getData() || {};
      raw = data.SESSIONS || [];
    }
    if (!Array.isArray(raw)) return [];
    var completed = (typeof S !== "undefined" && Array.isArray(S.completedGuidedSessions))
      ? S.completedGuidedSessions : [];
    var currentNum = (typeof S !== "undefined" && typeof S.guidedSession === "number")
      ? S.guidedSession : 1;
    return raw.map(function(L, i) {
      var num = typeof L.num === "number" ? L.num : (i + 1);
      var id = L.id || String(num);
      return {
        id: id,
        num: num,
        title: L.title || ("Lesson " + num),
        level: L.level || 1,
        bpm: L.bpm || 80,
        desc: L.desc || (L.spark && L.spark.text) || "",
        chord: (L.newMove && L.newMove.chord) || null,
        skill: L.skill || null,
        completed: completed.indexOf(num) >= 0,
        active: num === currentNum,
        raw: L
      };
    });
  }

  // Find a specific lesson by id (ukulele's string id) or num (everything).
  function findActiveLesson(lessonId) {
    var lessons = getActiveInstrumentLessons();
    if (!lessons.length) return null;
    if (lessonId !== undefined && lessonId !== null && lessonId !== "") {
      var target = String(lessonId);
      for (var i = 0; i < lessons.length; i++) {
        if (lessons[i].id === target || String(lessons[i].num) === target) return lessons[i];
      }
    }
    // Default: the active (next-up) lesson, or the first one.
    for (var j = 0; j < lessons.length; j++) {
      if (lessons[j].active) return lessons[j];
    }
    return lessons[0];
  }

  // Context-aware navigation. When an instrument is active, route via the
  // legacy SCR/TAB system so each Showroom page becomes the actual page for
  // its app area. When no instrument is active, fall back to the launcher's
  // openLauncherView dispatcher.
  window.SparkShowroomNavigate = function(view, param) {
    var hasInst = typeof S !== "undefined" && S.activeInstrument;
    // nav("lesson", <num>) selects a specific lesson — stash the id so
    // lessonRender can look it up on the active instrument. An explicit
    // null (or missing param) clears the pin so the "continue" path lands
    // on the user's next unfinished lesson instead of whatever they last
    // opened.
    if (view === "lesson") {
      if (param !== undefined && param !== null && param !== "") {
        if (typeof S !== "undefined") S._showroomLessonId = String(param);
      }
    } else if (typeof S !== "undefined" && S._showroomLessonId && view !== "settings" && view !== "profile") {
      // Leaving the lesson context — drop the pin so it doesn't stick
      // across unrelated navigations.
      S._showroomLessonId = null;
    }
    // Song-detail deep-link: nav("song-details", <id-or-title>) pins the
    // song so songDetailsRender can look it up on the active instrument.
    // Clearing the pin on unrelated routes mirrors the lesson-pin pattern
    // above.
    if (view === "song-details") {
      if (param !== undefined && param !== null && param !== "") {
        if (typeof S !== "undefined") S._showroomSongId = String(param);
      }
    } else if (typeof S !== "undefined" && S._showroomSongId && view !== "library" && view !== "settings" && view !== "profile") {
      S._showroomSongId = null;
    }
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
        // Opt-in preview of the Warm Ember practice-session screen
        // (SparkPracticeMetro). Kept separate from "practice" so the
        // legacy practice tab (with full drill launchers + plan controls)
        // stays the default. Entry is explicit: callers invoke
        // nav("practice-metro") to try the Warm Ember version.
        "practice-metro":  function(){ S._showroomOverride = "practice-metro"; S.screen = SCR_.HOME; S.tab = TAB_.PRACTICE; },
        // "library" / "tuner" → Warm Ember Song Library / Tuner when the
        // Showroom renderers are present (they're on the render.js allow
        // list). If the module isn't loaded, render.js falls through to
        // the legacy pipeline that would have fired from the legacy slots
        // below — so we set BOTH the override and the legacy slot so
        // users never land on a blank screen.
        "library":         function(){ S._showroomOverride = "library"; S.screen = SCR_.HOME; S.tab = TAB_.SONGS; },
        "leaderboard":     function(){ S._showroomOverride = "leaderboard"; S.screen = SCR_.HOME; S.tab = TAB_.SONGS; },
        "tuner":           function(){ S._showroomOverride = "tools";   S.screen = SCR_.HOME; S.tab = TAB_.TUNER || "tuner"; },
        "tools":           function(){ S._showroomOverride = "tools";   S.screen = SCR_.HOME; S.tab = TAB_.TUNER || "tuner"; },
        "insights":        function(){ S.screen = SCR_.INSIGHTS; },
        // Settings now has Warm Ember parity for the legacy essentials
        // (theme picker, UI volume, reminders, setup reset, release info).
        // Keep the legacy slot as a fallback if the override renderer is not
        // loaded, but prefer the canonical Showroom surface.
        "settings":        function(){ S._showroomOverride = "settings"; S.screen = SCR_.SETTINGS; },
        // "path" / "learn" route to the Warm Ember Learning Path screen
        // (SparkPath.render) which reads the active instrument's real
        // lesson list + progression. The render.js allow-list guards this;
        // if SparkPath is absent or fails we fall through to the legacy
        // SCR_.SKILL_TREE which the allow-list auto-unwinds.
        "path":            function(){ S._showroomOverride = "path"; },
        "learn":           function(){ S._showroomOverride = "path"; },
        "curriculum":      function(){ S._showroomOverride = "curriculum"; },
        "syllabus":        function(){ S._showroomOverride = "syllabus"; },
        // song-details → Warm Ember details view (reads S._showroomSongId
        // pinned by the nav() 2-arg form above). Also sets the legacy slot
        // as a safety net if the Showroom module isn't loaded.
        "song-details":    function(){ S._showroomOverride = "song-details"; S.screen = SCR_.SONG; },
        // session-summary → Warm Ember summary when available, else legacy
        // completePage via SCR_.COMPLETE. Setting both means the override
        // wins when SparkSessionSummary is loaded and the legacy slot
        // handles everything else.
        "session-summary": function(){ S._showroomOverride = "session-summary"; S.screen = SCR_.COMPLETE; },
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
        "instruments":     function(){ SparkInstruments.deactivate(); S.activeInstrument = null; S._showroomOverride = null; S.launcherView = "instruments"; }
      };
      // Clear any prior override so the legacy slot routing wins again —
      // but keep it for routes whose handlers set an override themselves.
      var _overrideRoutes = { "profile":1, "settings":1, "lesson":1, "path":1, "learn":1, "curriculum":1, "syllabus":1, "library":1, "leaderboard":1, "tuner":1, "tools":1, "session-summary":1, "song-details":1, "practice-metro":1 };
      if (!_overrideRoutes[view]) S._showroomOverride = null;
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
    var settings = (typeof S !== "undefined" && S.settings) || {};
    var theme = settings.theme || (darkOn ? "dark" : "light");
    var uiVolume = typeof settings.uiVolume === "number" ? settings.uiVolume : 0.5;
    var uiVolumePct = Math.round(Math.max(0, Math.min(1, uiVolume)) * 100);
    var reminderOn = settings.practiceReminder !== false;
    var release = (typeof S !== "undefined" && S.releaseInfo) || {};
    var releaseVersion = release.version || "dev";
    var releaseBuild = release.build ? (" build " + release.build) : "";

    var sections = [
      { title: "Account", rows: [
        { icon: "person", label: "Profile Details", chevron: true, onClick: nav("profile") },
        // "Switch Instrument" clears S.activeInstrument via the shared
        // "instruments" dispatcher case, returning the user to the launcher
        // (instrument picker). Without this row there was no in-app path back
        // to the picker once an instrument was chosen — the activeInstrument
        // field is persisted to localStorage.
        { icon: "swap_horiz", label: "Switch Instrument", chevron: true, onClick: nav("instruments") },
        { icon: "workspace_premium", label: "Subscription Plan", chevron: true, badge: "Pro", onClick: "act('showroomManageSubscription')" }
      ]},
      { title: "Audio & Input", rows: [
        { type: "slider", icon: "mic", label: "Microphone Sensitivity", value: micPct + "%", pct: micPct },
        { type: "range", icon: "volume_up", label: "UI Volume", value: uiVolumePct + "%", pct: uiVolumePct, action: "setUIVolume" },
        { icon: "tune", label: "Latency Calibration", chevron: true, meta: latency + "ms", metaWarn: true, onClick: "if(S&&S.activeInstrument){act('openPerformCalibration')}else{SparkInstruments.openLauncherView('calibration')}" }
      ]},
      { title: "Appearance", rows: [
        { type: "theme", icon: "palette", label: "Theme", value: theme, options: ["dark", "light", "blue", "highcontrast", "retro"] },
        // Dark Mode is wired to the canonical act("toggleDark") handler so
        // flipping it here also updates the legacy header, body.light
        // class, and persisted S.darkMode state.
        { type: "toggle", icon: "dark_mode", label: "Dark Mode", on: darkOn, key: "dark" },
        { type: "toggle", icon: "blur_on", label: "Reduce Transparency", on: reduceTransp, key: "reduceTransparency" }
      ]},
      { title: "Practice", rows: [
        { type: "toggle", icon: "event_available", label: "Practice Reminder", on: reminderOn, key: "practiceReminder", action: "togglePracticeReminder" },
        { icon: "restart_alt", label: "Reset Setup", chevron: true, onClick: "act('openOnboarding')" }
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
        } else if (row.type === "range") {
          html += '<div class="showroom-slider-row">';
          html += '<div class="showroom-slider-head"><div class="showroom-row-left">';
          html += '<span class="material-symbols-outlined showroom-row-icon">' + row.icon + '</span>';
          html += '<span class="showroom-row-label">' + escHtml(row.label) + '</span>';
          html += '</div><span class="showroom-row-meta">' + escHtml(row.value) + '</span></div>';
          html += '<input class="showroom-settings-range" type="range" min="0" max="100" value="' + row.pct + '" oninput="act(\'' + row.action + '\',this.value)" aria-label="' + escHtml(row.label) + '">';
          html += '</div>';
        } else if (row.type === "theme") {
          html += '<div class="showroom-row no-action theme-row">';
          html += '<div class="showroom-row-left">';
          html += '<span class="material-symbols-outlined showroom-row-icon">' + row.icon + '</span>';
          html += '<span class="showroom-row-label">' + escHtml(row.label) + '</span>';
          html += '</div></div><div class="showroom-theme-picker" role="radiogroup" aria-label="Theme">';
          for (var ti = 0; ti < row.options.length; ti++) {
            var opt = row.options[ti];
            var active = opt === row.value;
            html += '<button class="showroom-theme-chip' + (active ? ' active' : '') + '" type="button" role="radio" aria-checked="' + active + '" onclick="act(\'setTheme\',' + jsArg(opt) + ')">' + escHtml(opt) + '</button>';
          }
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
          html += '<button class="showroom-toggle' + (row.on ? ' on' : '') + '" type="button" role="switch" aria-checked="' + row.on + '" onclick="' + (row.action ? "act('" + row.action + "')" : toggleOnClick(row.key)) + '" aria-label="' + escHtml(row.label) + '">';
          html += '<span class="showroom-toggle-knob" aria-hidden="true"></span></button>';
          html += '</div>';
        } else {
          var click = row.onClick ? ' onclick="' + row.onClick + '"' : '';
          var keyboard = row.onClick ? ' role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + row.onClick + '}"' : '';
          html += '<div class="showroom-row"' + click + keyboard + '>';
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
    html += '<div class="showroom-version"><span class="showroom-version-label">System Core</span><span class="showroom-version-num">v' + escHtml(releaseVersion + releaseBuild) + '</span></div>';

    var navItems = [
      { id:"flow",     label:"Flow",     icon:"waves",       onClick: nav("home") },
      { id:"library",  label:"Library",  icon:"music_note",  onClick: nav("library") },
      { id:"insights", label:"Insights", icon:"insights",    onClick: nav("insights") },
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
    var profile = getShowroomStoredProfile();
    var name = getShowroomProfileDisplayName(profile);
    var totalXp = 0, maxStreak = 0, lessonsDone = 0, level = 1;
    var progressRows;
    var badgeIds;
    var tag;
    var avatarSrc;
    var avatarHtml;
    var progHtml = "";
    var badgesHtml = "";
    var i;
    if (profile && profile.apps) {
      for (var id in profile.apps) {
        var st = (profile.apps[id] || {}).stats || {};
        totalXp += st.xp || 0;
        if ((st.streakDays || 0) > maxStreak) maxStreak = st.streakDays;
        if ((st.level || 0) > level) level = st.level;
        lessonsDone += pickShowroomNumber(st.lessonsCompleted, 0) || 0;
      }
    }
    totalXp = pickShowroomNumber(totalXp, typeof S !== "undefined" ? S.playerXP : null, 0) || 0;
    maxStreak = pickShowroomNumber(maxStreak, typeof S !== "undefined" ? S.practiceStreak : null, typeof S !== "undefined" && S.playerStats ? S.playerStats.streakBest : null, 0) || 0;
    lessonsDone = pickShowroomNumber(lessonsDone, typeof S !== "undefined" && S.playerStats ? S.playerStats.lessonsCompleted : null, 0) || 0;
    level = pickShowroomNumber(level, typeof S !== "undefined" ? S.playerLevel : null, 1) || 1;
    progressRows = buildShowroomProfileProgressRows(profile);
    badgeIds = collectShowroomBadgeIds(profile);
    tag = normalizeShowroomText(profile && profile.title);
    if (!tag) {
      var startedCount = 0;
      for (i = 0; i < progressRows.length; i++) {
        if (progressRows[i].started) startedCount++;
      }
      tag = startedCount > 1
        ? "Multi-instrument learner"
        : (showroomInstrumentDisplayName(getShowroomPrimaryInstrument(profile)) + " learner");
    }
    avatarSrc = getShowroomProfileAvatarSrc(profile);
    // No external-URL fallback — the app-wide CSP (`img-src 'self' data:`)
    // blocks remote hosts. When avatarSrc is absent the renderer below
    // falls through to the initial-letter bubble, which stays same-origin.

    avatarHtml = avatarSrc
      ? '<img src="' + escHtml(avatarSrc) + '" alt="">'
      : '<div class="showroom-profile-avatar-fallback">' + escHtml(getShowroomAvatarInitial(profile)) + '</div>';

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

    if (!badgeIds.length) {
      badgesHtml = '<div class="showroom-empty-state"><p>No badges unlocked yet. Finish sessions to start building your collection.</p></div>';
    } else {
      for (var b = 0; b < badgeIds.length; b++) {
        var bd = getShowroomBadgeMeta(badgeIds[b]);
        badgesHtml += '<div class="showroom-badge">'
                    + '<div class="showroom-badge-circle" style="border-color:' + bd.color + '40;background:' + bd.color + '14">'
                    + '<span class="material-symbols-outlined fill" style="color:' + bd.color + ';font-size:24px">' + bd.icon + '</span></div>'
                    + '<span class="showroom-badge-label">' + escHtml(bd.label) + '</span></div>';
      }
    }

    var navItems = [
      { id:"home",     label:"Practice",    icon:"music_note", onClick: nav("practice") },
      { id:"journey",  label:"Journey",     icon:"explore",    onClick: nav("path") },
      { id:"leaderboard", label:"Leaderboard", icon:"military_tech", onClick: nav("leaderboard") },
      { id:"profile",  label:"Profile",     icon:"person" }
    ];

    // Stitch 2026-04 "Profile" redesign — glass cards, inset-carved
    // progress tracks, ember-glow featured badge, centered "Profile"
    // accent-colored title, warm radial wash behind the canvas.
    return '<div class="showroom-root with-bg showroom-profile-ember">'
         + '<div class="showroom-profile-ember-wash" aria-hidden="true"></div>'
         + '<header class="showroom-appbar showroom-profile-ember-appbar">'
         + '<div class="showroom-appbar-left"><button class="showroom-iconbtn accent" onclick="' + backToHome() + '" aria-label="Menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button></div>'
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
                  + '<div><div class="showroom-stat-mini-num showroom-profile-ember-mini-num">' + lessonsDone + '</div><div class="showroom-stat-mini-label showroom-profile-ember-mini-label">Lessons Done</div></div></div>'
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
    // Look up the pinned song (nav("song-details", <id>)) on the active
    // instrument. If no song is pinned, render honest empty-state copy
    // instead of silently selecting the first library item.
    var pinned = null;
    if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive) {
      var _sdInst = SparkInstruments.getActive();
      var _sdData = _sdInst && typeof _sdInst.getData === "function" ? _sdInst.getData() : null;
      var _sdSongs = (_sdData && Array.isArray(_sdData.SONGS)) ? _sdData.SONGS : [];
      var _pinId = typeof S !== "undefined" && S._showroomSongId ? String(S._showroomSongId) : null;
      if (_pinId && _sdSongs.length) {
        for (var _i = 0; _i < _sdSongs.length; _i++) {
          var _c = _sdSongs[_i];
          if (_c && (_c.id === _pinId || _c.title === _pinId)) { pinned = _c; break; }
        }
      }
    }
    var hasSong = !!(normalizeShowroomText(opts.title) || (pinned && normalizeShowroomText(pinned.title)));
    var title = normalizeShowroomText(opts.title || (pinned && pinned.title)) || "No song selected";
    var artist = normalizeShowroomText(opts.artist || (pinned && pinned.artist)) || (hasSong ? "Unknown Artist" : "Open a song from your library");
    // "Key" isn't on the standard SONGS record — derive from first chord.
    var keyFromSong = (pinned && Array.isArray(pinned.chords) && pinned.chords.length) ? pinned.chords[0] : null;
    var key = normalizeShowroomText(opts.key || keyFromSong) || "--";
    var bpm = pickShowroomNumber(opts.bpm, pinned && pinned.bpm);
    // Length estimate uses the same 240/bpm heuristic as the library list.
    var lenFromBpm = pinned && pinned.bpm ? Math.max(1, Math.round(240 / pinned.bpm)) + ":00" : null;
    var len = normalizeShowroomText(opts.length || lenFromBpm) || "--";
    var pinnedDiff = pinned && (typeof pinned.difficulty === "number" ? pinned.difficulty : (typeof pinned.level === "number" ? pinned.level : null));
    var diff = pickShowroomNumber(opts.difficulty, pinnedDiff, 0) || 0;
    var diffMax = opts.difficultyMax || 10;
    var diffPct = diffMax > 0 ? Math.round((diff / diffMax) * 100) : 0;
    var inferredInstrument = opts.instrument || (pinned && pinned.instrument) || null;
    if (!inferredInstrument && pinned && pinned.instrument) inferredInstrument = pinned.instrument;
    // Description: use the song's chord progression if no explicit one
    // is supplied by the caller.
    var progDesc = (pinned && Array.isArray(pinned.chords) && pinned.chords.length)
      ? "Chords: " + pinned.chords.slice(0, 8).join(" • ")
      : null;
    var desc = normalizeShowroomText(opts.description || progDesc)
      || (hasSong
        ? "Open this song to review the arrangement and launch performance mode."
        : "Choose a song from the library to view performance details.");
    var coverSrc = opts.cover;
    var tags = Array.isArray(opts.tags) ? opts.tags.slice() : [];
    if (!tags.length && pinned && Array.isArray(pinned.chords) && pinned.chords.length) {
      tags.push(pinned.chords[0]);
    }
    if (!tags.length && hasSong && inferredInstrument) {
      tags.push(showroomInstrumentDisplayName(inferredInstrument));
    }

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
             + '<div class="showroom-meta-tile"><div class="showroom-meta-tile-overlay"></div><span class="material-symbols-outlined showroom-meta-icon">speed</span><span class="showroom-meta-label">BPM</span><span class="showroom-meta-val bpm">' + escHtml(bpm) + '</span></div>'
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
            + '<button class="showroom-action-cta" onclick="' + (hasSong ? ("act('showroomStartPerf'" + (inferredInstrument ? ',' + jsArg(inferredInstrument) : '') + ")") : nav("library")) + '">'
              + '<div class="showroom-shimmer-overlay"></div>'
              + '<span class="material-symbols-outlined fill">play_circle</span>' + (hasSong ? 'Start Performance' : 'Open Library') + '</button>'
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
    var todaySeconds = (typeof S !== "undefined" && typeof S.todayPracticeSeconds === "number" && isFinite(S.todayPracticeSeconds))
      ? S.todayPracticeSeconds
      : null;
    var todayMin = todaySeconds != null ? Math.floor(todaySeconds / 60) : (pickShowroomNumber(opts.todayMinutes, 0) || 0);
    var focusScore = pickShowroomNumber(opts.focusScore, 0) || 0;

    // Resolve practice plan
    var plan = null;
    var view = getShowroomCoreView();
    if (view) {
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

      if (Array.isArray(plan.items)) {
        for (var pi = 0; pi < plan.items.length; pi++) {
          var item = plan.items[pi];
          if (typeof isRenderablePracticeSummaryItem === "function" && !isRenderablePracticeSummaryItem(item)) continue;
          focusXp += pickShowroomNumber(
            item && item.xp,
            item && item.rewardXp,
            item && item.rewards && item.rewards.xp,
            item && item.meta && item.meta.xp,
            0
          ) || 0;
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
      focusTitle = opts.focus ? opts.focus.title : "No practice focus yet.";
      focusPct = opts.focus ? opts.focus.pct : 0;
      focusXp = opts.focus ? opts.focus.xp : 0;
      drillItems = opts.drills || [];
    }

    var drillHtml = "";
    for (var i = 0; i < drillItems.length; i++) {
      var d = drillItems[i];
      var isDone = d.completed;
      // Start button routes through launchPracticePlanItem(id) — the
      // canonical entry point that dispatches to the right planStart*
      // action based on item type (warmup / transition / song / rhythm /
      // technique / moduleExercise). Same contract the legacy practice
      // page uses via data-item-id.
      var canLaunch = !!d.id && typeof window !== "undefined" && typeof window.launchPracticePlanItem === "function";
      drillHtml += '<div class="showroom-drill group">'
                + '<div class="showroom-drill-left">'
                  + '<div class="showroom-drill-icon showroom-inset-carved"><span class="material-symbols-outlined">' + d.icon + '</span></div>'
                  + '<div><h4 class="showroom-drill-name">' + escHtml(d.name) + '</h4>'
                  + '<span class="showroom-drill-meta">' + escHtml(d.sub) + '</span></div>'
                + '</div>'
                + (isDone
                    ? '<span class="showroom-drill-meta" style="color:var(--success)">Done</span>'
                    : (canLaunch
                        ? '<button class="showroom-drill-cta" data-item-id="' + escHtml(String(d.id)) + '" onclick="act(\'practiceStartItem\', this.getAttribute(\'data-item-id\'))">Start</button>'
                        : '<button class="showroom-drill-cta" onclick="' + nav("lesson") + '">Start</button>'))
              + '</div>';
    }

    var navItems = [
      { id:"home",     label:"Home",     icon:"home",         onClick: nav("home") },
      { id:"practice", label:"Practice", icon:"music_note" },
      { id:"insights", label:"Insights", icon:"query_stats",  onClick: nav("insights") },
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
             + '<h3 style="font-family:\'Syne\';font-weight:800;font-size:15px">Quick Drills</h3><span class="link" style="font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer" role="button" tabindex="0" onclick="' + nav("lesson") + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + nav("lesson") + '}">View All</span></div>'
             + '<div style="display:flex;flex-direction:column;gap:8px">' + (drillHtml || '<div class="showroom-empty-state"><p>No drills loaded yet. Start or refresh a practice plan to populate this list.</p></div>') + '</div></section>'
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
    var query = (typeof S !== "undefined" && typeof S.communitySearch === "string") ? S.communitySearch.trim().toLowerCase() : "";
    var categories = ["All","Guitar","Bass","Piano","Ukulele"];
    var levels = ["Beginner","Intermediate","Advanced"];

    // Build the song list from the active instrument's real SONGS data.
    // The caller can still override for preview/harness use via opts.songs.
    var realSongs = null;
    if (!opts.songs && typeof SparkInstruments !== "undefined" && SparkInstruments.getActive) {
      var _libInst = SparkInstruments.getActive();
      var _instType = _libInst && (_libInst.instrument || _libInst.instrumentType || _libInst.id) || "guitar";
      var _instData = _libInst && typeof _libInst.getData === "function" ? _libInst.getData() : null;
      var _rawSongs = (_instData && Array.isArray(_instData.SONGS)) ? _instData.SONGS : [];
      if (_rawSongs.length) {
        // Length estimate: 48 beats / bpm gives a reasonable approximation
        // of a short practice song in minutes when the record doesn't carry
        // an explicit duration field.
        var _formatLen = function(bpm) {
          var minutes = bpm ? Math.max(1, Math.round(240 / bpm)) : 3;
          return minutes + ":00";
        };
        realSongs = _rawSongs.map(function(s, idx) {
          var lvl = typeof s.level === "number" ? s.level : (typeof s.difficulty === "number" ? s.difficulty : 1);
          return {
            id: s.id || s.title,
            name: s.title || "Untitled",
            artist: s.artist || "",
            lvl: lvl,
            len: _formatLen(s.bpm),
            status: "",
            label: (Array.isArray(s.chords) ? s.chords.slice(0, 4).join(" • ") : ""),
            statusClass: "muted",
            instrument: _instType,
            songIndex: idx
          };
        });
      }
    }
    var songs = opts.songs || realSongs || [];
    var dailyChallenge = (opts.dailyChallenge || (typeof S !== "undefined" ? S.performanceDailyChallenge : null)) || null;
    var dailyTitle = normalizeShowroomText(dailyChallenge && (dailyChallenge.songTitle || dailyChallenge.label || dailyChallenge.id))
      || "No daily challenge loaded";
    var dailySubtitle = normalizeShowroomText(dailyChallenge && dailyChallenge.reason)
      || (dailyChallenge ? "Today’s featured performance is ready when you are." : "Load songs or refresh your recommendations to see the next featured run.");
    var dailyXp = pickShowroomNumber(dailyChallenge && dailyChallenge.xp, 0) || 0;
    var dailyPlayersLabel = dailyChallenge
      ? (dailyChallenge.instrument ? (showroomInstrumentDisplayName(dailyChallenge.instrument) + " focus") : "Ready when you are")
      : "No live challenge yet";
    var dailyAction = dailyChallenge ? "act('openPerformanceDaily')" : nav("practice");
    var dailyActionLabel = dailyChallenge ? "Join Session" : "Open Practice";
    if (query) {
      songs = songs.filter(function(song) {
        var haystack = [
          song.name || "",
          song.artist || "",
          song.instrument || "",
          song.label || ""
        ].join(" ").toLowerCase();
        return haystack.indexOf(query) >= 0;
      });
    }

    function lvlClass(n) {
      if (n <= 3) return "lvl-low";
      if (n <= 5) return "lvl-mid";
      if (n <= 7) return "lvl-high";
      return "lvl-expert";
    }

    var chipsHtml = "";
    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];
      chipsHtml += '<button class="showroom-chip' + (cat === category ? ' on' : '') + '" onclick="act(\'showroomLibraryCategory\',' + jsArg(cat) + ')">' + escHtml(cat) + '</button>';
    }
    var levelsHtml = "";
    for (var l = 0; l < levels.length; l++) {
      var lv = levels[l];
      levelsHtml += '<button class="showroom-level-chip' + (lv === level ? ' on' : '') + '" onclick="act(\'showroomLibraryLevel\',' + jsArg(lv) + ')">' + escHtml(lv) + '</button>';
    }

    var songsHtml = "";
    for (var s = 0; s < songs.length; s++) {
      var sg = songs[s];
      var playPayload = (sg.id || sg.name) + "|" + (sg.instrument || "");
      var playAction = typeof sg.songIndex === "number"
        ? "act('openPerformSong'," + sg.songIndex + ")"
        : "act('showroomPlayLibrarySong'," + jsArg(playPayload) + ")";
      var thumb = sg.cover
        ? '<img src="' + escHtml(sg.cover) + '" alt="">'
        : '<div class="showroom-song-thumb-fallback" aria-hidden="true">\uD83C\uDFB5</div>';
      var statusLabel = sg.label || (sg.pct || "");
      var statusClass = sg.statusClass || "muted";
      songsHtml += '<div class="showroom-song-row ' + escHtml(sg.instrument || '') + '" role="button" tabindex="0" onclick="if(event.target&&event.target.closest&&event.target.closest(\'button,input,select,textarea,a\')){return;}' + nav("song-details", sg.id || sg.name) + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + nav("song-details", sg.id || sg.name) + '}">'
                + '<div class="showroom-song-thumb">' + thumb + '</div>'
                + '<div class="showroom-song-body">'
                  + '<h4 class="showroom-song-name">' + escHtml(sg.name) + '</h4>'
                  + '<p class="showroom-song-sub">' + escHtml(sg.artist) + '</p>'
                  + '<div class="showroom-song-meta"><span class="showroom-lvl-pill ' + lvlClass(sg.lvl) + '">LVL ' + sg.lvl + '</span>'
                  + '<span class="showroom-song-len">• ' + escHtml(sg.len) + '</span></div>'
                + '</div>'
                + '<div class="showroom-song-action">'
                  + '<button class="showroom-song-play ' + (sg.status || "") + '" onclick="' + playAction + '" aria-label="Play"><span class="material-symbols-outlined fill" aria-hidden="true">play_arrow</span></button>'
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
             + '<button class="showroom-iconbtn accent" aria-label="Search" onclick="act(\'showroomFocusLibrarySearch\')"><span class="material-symbols-outlined" aria-hidden="true">search</span></button>'
              + '<button class="showroom-iconbtn showroom-library-avatar-btn" aria-label="Profile" onclick="' + nav("profile") + '">'
                + '<span class="showroom-library-avatar-fallback">' + escHtml(getShowroomAvatarInitial(getShowroomStoredProfile())) + '</span>'
              + '</button>'
           + '</div>'
         + '</header>'
          + '<div class="showroom-canvas" style="padding-top:0">'
           + '<div class="showroom-search"><span class="material-symbols-outlined">search</span><input id="showroom-library-search" type="search" placeholder="Search songs, artists..." value="' + escHtml((typeof S !== "undefined" && typeof S.communitySearch === "string") ? S.communitySearch : "") + '" oninput="act(\'communitySearch\',this.value)" aria-label="Search songs and artists"></div>'
           + '<div class="showroom-chiprow">' + chipsHtml + '</div>'
           + '<div class="showroom-level-row">' + levelsHtml + '</div>'
           + '<div class="showroom-trending-head"><h3>Trending Scores</h3><span class="link" role="button" tabindex="0" onclick="act(\'showroomOpenTrendingScores\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'showroomOpenTrendingScores\')}">View All</span></div>'
            + (songsHtml || '<div class="showroom-empty-state"><p>' + escHtml(query ? 'No songs matched your search.' : 'No songs loaded for this instrument yet.') + '</p></div>')
            + '<div class="showroom-daily">'
              + '<div class="showroom-daily-head"><span class="showroom-daily-eyebrow">Daily Challenge</span><span class="showroom-daily-xp">XP +' + dailyXp + '</span></div>'
              + '<h3 class="showroom-daily-title">' + escHtml(dailyTitle) + '</h3>'
              + '<p class="showroom-daily-sub">' + escHtml(dailySubtitle) + '</p>'
              + '<div class="showroom-daily-foot">'
                + '<div class="showroom-daily-players"><div class="showroom-daily-avstack"><span></span><span></span><span></span></div><span>' + escHtml(dailyPlayersLabel) + '</span></div>'
                 + '<button class="showroom-daily-cta" onclick="' + dailyAction + '">' + escHtml(dailyActionLabel) + '</button>'
              + '</div>'
            + '</div>'
         + '</div>'
         + bottomNav(navItems, "library")
         + '</div>';
  }

  function leaderboardRender(opts) {
    opts = opts || {};
    var entries = Array.isArray(opts.entries) ? opts.entries.slice() : [];
    var profileName = getShowroomProfileDisplayName(getShowroomStoredProfile());
    var topSongs;
    if (!entries.length && typeof getPerformanceTopSongs === "function") {
      topSongs = getPerformanceTopSongs() || [];
      for (var ts = 0; ts < topSongs.length; ts++) {
        var entry = topSongs[ts] || {};
        entries.push({
          rank: ts + 1,
          name: profileName,
          score: (pickShowroomNumber(entry.bestScore, 0) || 0).toLocaleString(),
          song: normalizeShowroomText(entry.songId || entry.key) || ("Run " + (ts + 1)),
          badge: normalizeShowroomText(entry.mastery) || "Personal Best"
        });
      }
    }
    var rows = "";
    for (var i = 0; i < entries.length; i++) {
      var item = entries[i];
      rows += '<div class="showroom-row" style="align-items:center">'
           + '<div style="display:flex;align-items:center;gap:12px">'
             + '<div class="showroom-lesson-idx" style="min-width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center">#' + item.rank + '</div>'
             + '<div><div style="font-weight:800;color:var(--text-primary)">' + escHtml(item.name) + '</div>'
             + '<div style="font-size:12px;color:var(--text-muted)">' + escHtml(item.song) + ' • ' + escHtml(item.badge) + '</div></div>'
           + '</div>'
           + '<div style="font-family:\'JetBrains Mono\';font-weight:900;color:var(--primary-fixed)">' + escHtml(item.score) + '</div>'
         + '</div>';
    }
    var navItems = [
      { id:"home", label:"Practice", icon:"music_note", onClick: nav("practice") },
      { id:"journey", label:"Journey", icon:"explore", onClick: nav("path") },
      { id:"leaderboard", label:"Leaderboard", icon:"military_tech" },
      { id:"profile", label:"Profile", icon:"person", onClick: nav("profile") }
    ];
    return '<div class="showroom-root with-bg showroom-profile-ember">'
         + '<div class="showroom-profile-ember-wash" aria-hidden="true"></div>'
         + '<header class="showroom-appbar showroom-profile-ember-appbar">'
         + '<div class="showroom-appbar-left"><button class="showroom-iconbtn accent" onclick="' + backToHome() + '" aria-label="Menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button></div>'
         + '<h1 class="showroom-appbar-title centered showroom-profile-ember-title">Leaderboard</h1>'
         + '<div class="showroom-appbar-right"><button class="showroom-iconbtn showroom-profile-ember-settings" onclick="' + nav("profile") + '" aria-label="Profile"><span class="material-symbols-outlined" aria-hidden="true">person</span></button></div>'
         + '</header>'
         + '<div class="showroom-canvas showroom-profile-ember-canvas">'
         + '<section class="showroom-glass-card" style="padding:20px;border-radius:20px">'
         + '<div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:14px"><div><div class="showroom-focus-eyebrow">Top Local Runs</div><h3 style="margin:0;font-family:\'Syne\';font-size:24px">Best Scores</h3></div><div style="font-size:12px;color:var(--text-muted)">Updated from this device</div></div>'
         + '<div style="display:flex;flex-direction:column;gap:10px">' + (rows || '<div class="showroom-empty-state"><p>No scored runs yet. Finish a performance session to seed your local board.</p></div>') + '</div>'
         + '</section>'
         + bottomNav(navItems, "leaderboard")
         + '</div>'
         + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Session Summary
  // ───────────────────────────────────────────────────────────────────────
  function sessionSummaryRender(opts) {
    opts = opts || {};
    // Pull real totals from the legacy state layer when the caller didn't
    // hand us overrides. xp / streak come straight off S. Accuracy defaults
    // to the last recorded session accuracy if we have one; otherwise a
    // neutral 100% while the run is still warm. The "last completed"
    // lesson is inferred from S.guidedSession / completedGuidedSessions
    // so the thumbnail copy matches what the user just finished.
    var liveXp = (typeof S !== "undefined" && typeof S.xp === "number") ? S.xp : null;
    var liveStreak = (typeof S !== "undefined" && typeof S.streak === "number") ? S.streak : null;
    var liveAccuracy = null;
    if (typeof S !== "undefined") {
      if (typeof S.lastSessionAccuracy === "number") liveAccuracy = Math.round(S.lastSessionAccuracy);
      else if (typeof S.sessionAccuracy === "number") liveAccuracy = Math.round(S.sessionAccuracy);
    }
    var xp = opts.xp != null ? opts.xp : (liveXp != null ? liveXp : 0);
    var accuracy = opts.accuracy != null ? opts.accuracy : (liveAccuracy != null ? liveAccuracy : 0);
    var streak = opts.streak != null ? opts.streak : (liveStreak != null ? liveStreak : 0);

    // Look up the most-recently-completed lesson so the thumbnail copy
    // describes what the user actually just finished.
    var lastDone = null;
    if (typeof S !== "undefined" && Array.isArray(S.completedGuidedSessions) && S.completedGuidedSessions.length) {
      var lastNum = S.completedGuidedSessions[S.completedGuidedSessions.length - 1];
      lastDone = findActiveLesson(String(lastNum));
    } else if (typeof S !== "undefined" && typeof S.guidedSession === "number") {
      // Mid-session: show the current lesson while it's still in-flight.
      lastDone = findActiveLesson(String(S.guidedSession));
    }
    var lessonTitle = normalizeShowroomText(opts.lessonTitle || (lastDone ? lastDone.title : "")) || "No completed session yet";
    var lessonMeta = opts.lessonMeta || (lastDone
      ? ("Level " + (lastDone.level || 1) + " • " + (lastDone.bpm || 80) + " BPM")
      : "Finish a guided, daily, or performance session to see your recap here.");
    var subtitle = normalizeShowroomText(opts.subtitle) || (lastDone
      ? "You wrapped that session cleanly. Here’s the latest recap."
      : "Your next completed session will show up here.");
    var summaryTitle = lastDone ? "Session Complete!" : "No completed session yet";
    var primaryActionLabel = lastDone ? "Continue" : "Open Practice";
    var secondaryActionLabel = lastDone ? "Replay Session" : "Start Session";
    var secondaryAction = lastDone ? "act('showroomStartPerf')" : nav("practice");
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
             + '<h1 class="showroom-summary-h">' + escHtml(summaryTitle) + '</h1>'
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
            + '<button class="showroom-summary-cta" onclick="' + backToHome() + '">' + primaryActionLabel + '</button>'
            + '<button class="showroom-summary-cta ghost" onclick="' + secondaryAction + '">' + secondaryActionLabel + '</button>'
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
    var liveSongTitle = typeof S !== "undefined" && S.selectedSong ? normalizeShowroomText(S.selectedSong.title) : "";
    var liveSongMeta = typeof S !== "undefined" && S.selectedSong
      ? ("Level " + (pickShowroomNumber(S.selectedSong.level, 1) || 1) + " • " + (pickShowroomNumber(S.selectedSong.bpm, 0) || "--") + " BPM")
      : "";
    var score = pickShowroomNumber(opts.score, 0) || 0;
    var streak = pickShowroomNumber(opts.streak, typeof S !== "undefined" ? S.streak : null, 0) || 0;
    var mult = pickShowroomNumber(opts.mult, 1) || 1;
    var rank = normalizeShowroomText(opts.nextRank) || "--";
    var feedback = normalizeShowroomText(opts.feedback) || (liveSongTitle ? "READY" : "NO CHART");
    var combo = normalizeShowroomText(opts.combo) || (liveSongTitle ? "Keep the groove going." : "Open a song from the library to start a run.");
    var pct = clampShowroomPct(opts.progressPct);
    var title = normalizeShowroomText(opts.songTitle || liveSongTitle) || "No performance loaded";
    var meta = normalizeShowroomText(opts.songMeta || liveSongMeta) || "Choose a song from the library to start performance mode.";

    // Sample notes: { lane: 0..3, top: "15%", color: "cyan|yellow|peach" }
    var notes = Array.isArray(opts.notes) ? opts.notes : [];
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
                + '<div class="showroom-perf2-energy-track"><div class="showroom-perf2-energy-fill" style="width:' + Math.max(10, pct) + '%"></div></div>'
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
    // Look up the lesson pinned by nav("lesson", <id>). When nothing is
    // pinned we fall back to the active (next-up) lesson so the screen still
    // renders something useful. When a real lesson is found, its fields
    // override the sample opts passed by any caller.
    var pinnedId = (typeof S !== "undefined" && S._showroomLessonId) ? S._showroomLessonId : opts.lessonId;
    var activeLesson = findActiveLesson(pinnedId);
    var allLessons = getActiveInstrumentLessons();
    // Locate prev/next neighbours — only expose a neighbour if it's either
    // completed or active (never point at a still-locked future lesson).
    var currentIdx = -1;
    if (activeLesson) {
      for (var ni = 0; ni < allLessons.length; ni++) {
        if (allLessons[ni].id === activeLesson.id) { currentIdx = ni; break; }
      }
    }
    var prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
    var nextLesson = null;
    for (var nj = currentIdx + 1; nj < allLessons.length; nj++) {
      var cand = allLessons[nj];
      if (cand.completed || cand.active) { nextLesson = cand; break; }
    }

    var lessonNum = activeLesson ? activeLesson.num : null;
    var lessonLevel = activeLesson ? activeLesson.level : 1;
    var module = opts.module || (activeLesson
      ? "Lesson " + lessonNum + " • Level " + lessonLevel
      : "No lesson loaded yet");
    var unit = opts.unit || (activeLesson ? activeLesson.title : "Choose a lesson from your path");
    var chordName = opts.chord || (activeLesson && activeLesson.chord) || "";
    var position = opts.position || (activeLesson ? "Open Position" : "No chord selected");
    var strum = opts.strum || (activeLesson ? "All 6" : "--");
    var type = opts.type || (activeLesson ? "Practice" : "--");
    var xp = opts.xp != null ? opts.xp : (activeLesson ? 12 : 0);
    var time = opts.time || (activeLesson ? "05:00" : "--");
    var lessonDesc = (activeLesson && activeLesson.desc) || "";
    var rawLesson = activeLesson ? activeLesson.raw : null;
    var sparkText = (rawLesson && rawLesson.spark && rawLesson.spark.text) || "";
    var newMoveText = (rawLesson && rawLesson.newMove && rawLesson.newMove.text) || "";
    var songSliceText = (rawLesson && rawLesson.songSlice && rawLesson.songSlice.text) || "";

    var activeInst = (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive && SparkInstruments.getActive()) || null;
    var instrumentType = (activeInst && (activeInst.instrument || activeInst.instrumentType || activeInst.id)) || "guitar";
    // Ask the active instrument to render its own chord visual via the
    // canonical ui.chord(chordObj, size, label, animate) entry point. Each
    // instrument already knows how to draw itself (piano keyboard, uke/bass
    // fretboard diagrams). We look up the chord object from the instrument's
    // CHORDS / ALL_CHORDS map by either full name ("G Major") or short name
    // ("G" / "Gm") so piano and guitar conventions both work.
    var chordVisualHtml = "";
    if (chordName && activeInst && activeInst.ui && typeof activeInst.ui.chord === "function") {
      var chordObj = null;
      var instData = typeof activeInst.getData === "function" ? activeInst.getData() : null;
      var allChords = (instData && (instData.ALL_CHORDS || (instData.CHORDS && Object.keys(instData.CHORDS).map(function(k){ var c = instData.CHORDS[k]; return (c && typeof c === "object") ? c : { name: k, short: k }; })))) || [];
      for (var ci = 0; ci < allChords.length; ci++) {
        var c = allChords[ci];
        if (c && (c.name === chordName || c.short === chordName)) { chordObj = c; break; }
      }
      if (chordObj) {
        try { chordVisualHtml = activeInst.ui.chord(chordObj, 220); } catch(e) { chordVisualHtml = ""; }
      }
    }
    // Fall back to the hand-drawn 6-string guitar diagram only when we're
    // on guitar and the lookup didn't find a match — it's better than
    // nothing for guitar lessons with chord names that aren't in ALL_CHORDS.
    var showChordDiagram = !!chordName && !chordVisualHtml && instrumentType === "guitar";
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
           // Spark prompt — the lesson's hook/intro copy shown before the
           // chord/exercise card. Only renders when the active lesson has
           // a spark.text value (legacy SESSIONS records without one are
           // silently skipped). Sample-opts renders never have a sparkText
           // and so never show this section.
           + (sparkText
              ? ('<section class="showroom-lesson-spark" style="margin:0 4px 16px;padding:14px;border-radius:14px;background:rgba(255,123,58,0.08);border:1px solid rgba(255,123,58,0.25)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="material-symbols-outlined fill" style="color:#ff7b3a;font-size:20px">auto_awesome</span><strong style="font-size:13px;color:#ff7b3a;letter-spacing:0.4px;text-transform:uppercase">Spark</strong></div>'
                 + '<p style="margin:0;font-size:14px;line-height:1.55;color:var(--text-secondary,#ccc)">' + escHtml(sparkText) + '</p></section>')
              : '')
           + '<section class="showroom-chord-section" style="position:relative">'
             + '<div class="showroom-blur-blob"></div>'
             + '<div class="showroom-lesson-card showroom-ember-glow-card">'
               + '<div class="showroom-lesson-card-head"><div>'
                 + '<h3 class="showroom-lesson-card-title">' + escHtml(chordName) + '</h3>'
                 // Prefer the real lesson description when we have one —
                 // otherwise fall back to the position hint used by the
                 // sample-opts G-major render.
                 + '<p class="showroom-lesson-card-sub">' + escHtml(lessonDesc || position) + '</p></div>'
                 + '<div class="showroom-lesson-card-badge"><span class="showroom-lesson-card-tag">' + escHtml(String(lessonNum || "G")) + '</span></div></div>'
               + (chordVisualHtml
                  ? '<div class="showroom-lesson-chord-visual" style="display:flex;justify-content:center;padding:12px 0">' + chordVisualHtml + '</div>'
                  : showChordDiagram
                    ? ('<div class="showroom-chord" role="img" aria-label="' + escHtml(chordAriaLabel) + '">'
                       + '<div class="showroom-chord-fret-labels" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>'
                       + '<div class="showroom-chord-opens" aria-hidden="true"><span>O</span><span>O</span><span>O</span><span>O</span><span>O</span><span>O</span></div>'
                       + '<div class="showroom-chord-frets" aria-hidden="true"><div class="nut"></div><div class="fret"></div><div class="fret"></div><div class="fret"></div><div class="fret"></div><div class="fret"></div></div>'
                       + '<div class="showroom-chord-strings" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>'
                       + '<div class="showroom-chord-fingers" aria-hidden="true">' + fingersHtml + '</div>'
                     + '</div>')
                    // No chord visual and not a guitar lesson with the
                    // hand-drawn fallback — render an empty spacer so the
                    // card still has some height. Spark text now renders
                    // in its own dedicated section above the card.
                    : '<div style="min-height:80px" aria-hidden="true"></div>')
               + '<div class="showroom-chord-meta">'
                 + '<div class="showroom-chord-meta-cell"><p class="showroom-chord-meta-label">STRUM</p><p class="showroom-chord-meta-val success">' + escHtml(strum) + '</p></div>'
                 + '<div class="showroom-chord-meta-divider"></div>'
                 + '<div class="showroom-chord-meta-cell"><p class="showroom-chord-meta-label">TYPE</p><p class="showroom-chord-meta-val primary">' + escHtml(type) + '</p></div>'
               + '</div>'
             + '</div>'
           + '</section>'
           // Prev / Next lesson nav — only surfaces when a real lesson is
           // loaded. Locked future lessons aren't offered via "Next" (see
           // nextLesson derivation above); past / completed ones are always
           // reachable via Prev so the user can revisit any earlier step.
           + (activeLesson
              ? ('<section class="showroom-lesson-nav" style="display:flex;gap:8px;justify-content:space-between;margin:12px 0;padding:0 4px">'
                 + (prevLesson
                    ? '<button class="showroom-path-cta" style="flex:1;max-width:48%" onclick="' + nav("lesson", prevLesson.id) + '"><span class="material-symbols-outlined">chevron_left</span> ' + escHtml(prevLesson.title) + '</button>'
                    : '<span style="flex:1;max-width:48%"></span>')
                 + (nextLesson
                    ? '<button class="showroom-path-cta" style="flex:1;max-width:48%;justify-content:flex-end" onclick="' + nav("lesson", nextLesson.id) + '">' + escHtml(nextLesson.title) + ' <span class="material-symbols-outlined">chevron_right</span></button>'
                    : '<span style="flex:1;max-width:48%"></span>')
                 + '</section>')
              : '')
           // Additional lesson context — surface the instructor prompts that
           // exist on every real lesson record so the user can prep before
           // they hit "Start Practice".
           + (newMoveText
              ? ('<section class="showroom-tips-section" style="margin-top:8px"><div class="showroom-tips-head"><span class="material-symbols-outlined">flag</span><h3>New move</h3></div>'
                 + '<p style="font-size:13px;line-height:1.5;color:var(--text-secondary,#ccc);margin:0 4px">' + escHtml(newMoveText) + '</p></section>')
              : '')
           + (songSliceText
              ? ('<section class="showroom-tips-section" style="margin-top:8px"><div class="showroom-tips-head"><span class="material-symbols-outlined">music_note</span><h3>Song slice</h3></div>'
                 + '<p style="font-size:13px;line-height:1.5;color:var(--text-secondary,#ccc);margin:0 4px">' + escHtml(songSliceText) + '</p></section>')
              : '')
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
        // When a real lesson is loaded, the CTA respects live guided runtime:
        // reopen the current shell if this exact lesson is already active,
        // otherwise explicitly start the selected guided session. If there is
        // no real lesson context, fall back to the showroom performance
        // launcher so the CTA still enters a playable flow.
       + '<div class="showroom-lesson-cta-wrap"><button class="showroom-lesson-cta showroom-ember-glow-button" onclick="' + getShowroomLessonCtaAction(activeLesson) + '"><span class="material-symbols-outlined fill">play_arrow</span>' + escHtml(getShowroomLessonCtaLabel(activeLesson)) + '</button></div>'
        + bottomNav(navItems, "practice")
        + '</div>';
  }

  // ───────────────────────────────────────────────────────────────────────
  // Learning Path
  // ───────────────────────────────────────────────────────────────────────
  function pathRender(opts) {
    opts = opts || {};
    var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
    var streak = 0, dailyMin = 0, dailyGoal = 20, level = 1, accuracy = 0;
    if (profile && profile.apps) {
      var maxLvl = 0, maxStreak = 0, maxDailyMin = 0, maxAccuracy = 0;
      for (var id in profile.apps) {
        var st = (profile.apps[id] || {}).stats || {};
        if ((st.level || 0) > maxLvl) maxLvl = st.level;
        if ((st.streakDays || 0) > maxStreak) maxStreak = st.streakDays;
        if ((st.todayMinutes || 0) > maxDailyMin) maxDailyMin = st.todayMinutes;
        if ((st.accuracy || 0) > maxAccuracy) maxAccuracy = st.accuracy;
      }
      if (maxLvl) level = maxLvl;
      if (maxStreak) streak = maxStreak;
      if (maxDailyMin) dailyMin = maxDailyMin;
      if (maxAccuracy) accuracy = Math.round(maxAccuracy);
    }
    if (typeof S !== "undefined") {
      if (typeof S.todayPracticeSeconds === "number" && isFinite(S.todayPracticeSeconds)) dailyMin = Math.floor(S.todayPracticeSeconds / 60);
      if (typeof S.lastSessionAccuracy === "number" && isFinite(S.lastSessionAccuracy)) accuracy = Math.round(S.lastSessionAccuracy);
      if (typeof S.practiceStreak === "number" && isFinite(S.practiceStreak)) streak = Math.max(streak, S.practiceStreak);
    }

    // Build lesson list from the active instrument's real data. Completed
    // sessions (S.completedGuidedSessions) stay unlocked and clickable so
    // users can revisit any past lesson; the next-up lesson (S.guidedSession)
    // is the "active" one; everything beyond the current pointer is locked
    // until progression advances.
    var realLessons = getActiveInstrumentLessons();
    var instrumentType = (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive && SparkInstruments.getActive()) || null;
    instrumentType = (instrumentType && (instrumentType.instrument || instrumentType.instrumentType || instrumentType.id)) || "guitar";
    var lessons;
    if (realLessons.length) {
      // Map level → tier label. Most instrument packs number lessons 1..N
      // across levels 1..4; tier copy comes from level number so the UI
      // still reads like a progression without hand-written metadata.
      var tierFor = function(lvl) {
        return lvl <= 1 ? "Beginner" : lvl === 2 ? "Starter" : lvl === 3 ? "Intermediate" : lvl === 4 ? "Advanced" : "Milestone";
      };
      var iconFor = function(ls) {
        if (ls.chord) return "music_note";
        if (/strum|rhythm/i.test(ls.skill || "")) return "waves";
        if (/finger|pick/i.test(ls.skill || "")) return "touch_app";
        return "school";
      };
      lessons = realLessons.map(function(L) {
        var timeLabel = (L.bpm ? (Math.max(5, Math.round(240 / L.bpm))) : 8) + " MIN";
        var unlocked = L.completed || L.active;
        var cta = L.completed ? "Review" : L.active ? "Continue" : "Locked";
        return {
          lessonId: L.id,
          tier: tierFor(L.level),
          title: L.title,
          desc: L.desc,
          time: timeLabel,
          icon: iconFor(L),
          instrument: instrumentType,
          unlocked: unlocked,
          completed: L.completed,
          cta: cta
        };
      });
    } else {
      lessons = opts.lessons || [];
    }

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
                      ? '<button class="showroom-path-cta" onclick="' + nav("lesson", ls.lessonId) + '">' + escHtml(ls.cta) + ' <span class="material-symbols-outlined fill">' + (ls.completed ? "replay" : "play_arrow") + '</span></button>'
                      : '<button class="showroom-path-cta locked" aria-disabled="true">' + escHtml(ls.cta) + ' <span class="material-symbols-outlined">lock</span></button>')
                  + '</div>'
                + '</div>';
    }
    if (!lessonsHtml) {
      lessonsHtml = '<div class="showroom-empty-state"><p>No lessons loaded yet. Select an instrument path or load curriculum to continue.</p></div>';
    }

    var navItems = [
      { id:"path",        label:"Path",        icon:"map" },
      { id:"practice",    label:"Practice",    icon:"timer",       onClick: nav("practice") },
      { id:"instruments", label:"Instruments", icon:"piano",       onClick: nav("instruments") },
      { id:"profile",     label:"Profile",     icon:"person",      onClick: nav("profile") }
    ];

    var avatarSrc = profile && (profile.avatarImage || profile.avatarUrl);
    var avatarHtml = avatarSrc
      ? '<img src="' + escHtml(avatarSrc) + '" alt="Profile" style="width:100%;height:100%;object-fit:cover">'
      : '<span class="showroom-path-avatar-fallback">' + (profile && profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'S') + '</span>';

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
           + '<div class="showroom-path-section-head"><h3>Continue Learning</h3><span class="link" role="button" tabindex="0" onclick="' + nav("curriculum") + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + nav("curriculum") + '}">VIEW ALL</span></div>'
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
    // Pull the live tuner runtime when the caller didn't supply overrides,
    // so the dial reflects the actual detected note / cents / in-tune state
    // from the legacy tuner (js/pages/tools.js::getLegacyTunerRuntime).
    var liveRuntime = (typeof getLegacyTunerRuntime === "function") ? getLegacyTunerRuntime() : null;
    // Default tuning from the active instrument's STRINGS (e.g. EADGBE for
    // guitar, EADG for bass, GCEA for ukulele) instead of hardcoded EADGBE.
    var defaultTuning = "EADGBE";
    if (typeof SparkInstruments !== "undefined" && SparkInstruments.getActive) {
      var _ti = SparkInstruments.getActive();
      var _td = _ti && typeof _ti.getData === "function" ? _ti.getData() : null;
      if (_td && Array.isArray(_td.STRINGS) && _td.STRINGS.length) {
        defaultTuning = _td.STRINGS.map(function(s){ return s.note; }).join("");
      }
    }
    var tunerActive = !!(liveRuntime && liveRuntime.active);
    var note = opts.note || (liveRuntime && liveRuntime.note) || "E";
    var freq = opts.frequency != null
      ? opts.frequency
      : (liveRuntime && typeof liveRuntime.freq === "number" && liveRuntime.freq > 0 ? liveRuntime.freq : 440.0);
    var tuning = opts.tuning || defaultTuning;
    var bpm = opts.bpm != null ? opts.bpm : ((typeof S !== "undefined" && S.metronomeBpm) ? S.metronomeBpm : 120);
    // Status derived from cents: within ±5 is in-tune, flat/sharp past that.
    var cents = liveRuntime && typeof liveRuntime.cents === "number" ? liveRuntime.cents : 0;
    var derivedStatus = "in-tune";
    if (liveRuntime && liveRuntime.active && Math.abs(cents) >= 5) derivedStatus = cents < 0 ? "flat" : "sharp";
    var status = opts.status || derivedStatus;
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
      { id:"tools",   label:"Tools",   icon:"build",      onClick: nav("tools") },
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
                + '<button class="showroom-tuner-mic" onclick="act(\'' + (tunerActive ? 'stopTuner' : 'startTuner') + '\')" aria-label="' + (tunerActive ? 'Stop microphone' : 'Start microphone') + '"><span class="material-symbols-outlined fill" aria-hidden="true">mic</span></button>'
               + '<div class="showroom-tuner-cell right"><span class="showroom-tuner-cell-label">Standard</span>'
                 + '<span class="showroom-tuner-tuning">' + escHtml(standardLetters) + '</span></div>'
             + '</div>'
           + '</div>'
           + '<section class="showroom-tuner-metro" style="width:100%">'
             + '<div class="showroom-tuner-metro-head"><h3 class="showroom-tuner-metro-h">Metronome</h3>'
               + '<div class="showroom-tuner-metro-pulse"><span class="dot active"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>'
             + '<div class="showroom-tuner-metro-bpm-row">'
                + '<button class="showroom-tuner-bpm-btn" onclick="act(\'metroBpm\',\'' + Math.max(40, bpm - 5) + '\')" aria-label="Slower"><span class="material-symbols-outlined" aria-hidden="true">remove</span></button>'
                + '<span class="showroom-tuner-bpm-num">' + bpm + '</span>'
                + '<button class="showroom-tuner-bpm-btn" onclick="act(\'metroBpm\',\'' + Math.min(200, bpm + 5) + '\')" aria-label="Faster"><span class="material-symbols-outlined" aria-hidden="true">add</span></button>'
             + '</div>'
             + '<div class="showroom-tuner-bpm-unit">BPM</div>'
             + '<div class="showroom-tuner-metro-actions">'
                + '<button class="showroom-tuner-start" onclick="act(\'toggleMetro\')"><span class="material-symbols-outlined fill">' + ((typeof S !== "undefined" && S.metronomeOn) ? 'stop' : 'play_arrow') + '</span>' + ((typeof S !== "undefined" && S.metronomeOn) ? 'Stop' : 'Start') + '</button>'
                + '<button class="showroom-tuner-tap" onclick="act(\'showroomTapTempo\')"><span class="material-symbols-outlined">touch_app</span>Tap</button>'
             + '</div>'
           + '</section>'
           + '<div style="width:100%">'
             + '<div class="showroom-quicktools-head"><h3>Quick Tools</h3><span class="link" role="button" tabindex="0" onclick="act(\'showroomOpenQuickTools\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'showroomOpenQuickTools\')}">View All</span></div>'
             + '<div class="showroom-quicktools">'
               + '<button class="showroom-quicktool recorder" onclick="act(\'showroomToggleRecorder\')"><div class="showroom-quicktool-icon"><span class="material-symbols-outlined fill">mic</span></div><span class="showroom-quicktool-label">Recorder</span></button>'
               + '<button class="showroom-quicktool tonegen" onclick="act(\'showroomToneGenerator\')"><div class="showroom-quicktool-icon"><span class="material-symbols-outlined fill">graphic_eq</span></div><span class="showroom-quicktool-label">Tone Gen</span></button>'
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
    var signInAction = opts.signInAction || "act('showroomOpenSignIn')";
    var afterBodyHtml = opts.afterBodyHtml || "";
    // Escape " in action strings so a caller passing e.g. act("x") doesn't
    // prematurely close the onclick attribute. Single quotes inside the JS
    // call stay intact; this is the minimum-safe encoding for an attribute
    // value whose content is still expected to execute as JavaScript.
    function _attrSafeJs(s) { return String(s).replace(/"/g, "&quot;"); }

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
           + afterBodyHtml
           + '<div class="showroom-onboarding-cta-wrap">'
             + '<button type="button" class="showroom-onboarding-cta" onclick="' + _attrSafeJs(ctaAction) + '">'
               + escHtml(String(ctaLabel).toUpperCase())
               + '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>'
             + '</button>'
             + '<p class="showroom-onboarding-signin">'
               + escHtml(signInLabel) + ' '
               + '<button type="button" class="showroom-onboarding-signin-link" onclick="' + _attrSafeJs(signInAction) + '">Sign In</button>'
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
    var summary = getShowroomCurriculumSummary(opts);
    var courseTitle = summary.courseTitle;
    var level = summary.level != null ? summary.level : 1;
    var progress = summary.progressPct != null ? summary.progressPct : 0;
    var nextGoalText = normalizeShowroomText(opts.nextGoalText) || summary.nextGoalText || "No milestone loaded yet";
    var modules = Array.isArray(summary.modules) ? summary.modules.slice() : [];

    // Progress ring math
    var radius = 40;
    var circumference = 2 * Math.PI * radius;
    var dashOffset = circumference * (1 - progress / 100);
    if (!modules.length) {
      modules = [{
        id: "empty",
        title: "No curriculum loaded yet",
        status: "EMPTY",
        statusClass: "locked",
        lessons: [
          { name: "Select an instrument path or load lessons to populate this view.", state: "locked" }
        ]
      }];
    }

    var timelineHtml = "";
    for (var i = 0; i < modules.length; i++) {
      var mod = modules[i];
      var modState = normalizeShowroomText(mod.state || mod.statusClass).toLowerCase() || "locked";
      var markerIcon = modState === "completed" ? "check" :
                       modState === "active" ? "auto_awesome" : "lock";
      var markerFill = modState === "active" ? " fill" : "";

      var lessonsHtml = "";
      for (var j = 0; j < mod.lessons.length; j++) {
        var les = mod.lessons[j];
        var lessonState = normalizeShowroomText(les.state).toLowerCase();
        if (!lessonState) lessonState = les.completed ? "done" : (les.active ? "now" : (les.locked ? "locked" : "unlocked"));
        var lesStatusHtml = lessonState === "done" ? '<span class="material-symbols-outlined showroom-lesson-check">check_circle</span>' :
                            lessonState === "now" ? '<span class="showroom-lesson-badge">NOW</span>' :
                            // Locked lessons render a closed-lock glyph so the state reads
                            // correctly alongside the module-marker logic that uses "lock".
                            '<span class="material-symbols-outlined showroom-lesson-lock">lock</span>';

        lessonsHtml += '<div class="showroom-lesson-item' + (lessonState === "now" ? ' active' : '') + '">'
                    + '<div class="showroom-lesson-info">'
                    + '<span class="material-symbols-outlined showroom-lesson-icon">' + (lessonState === "locked" ? 'music_note' : 'play_circle') + '</span>'
                    + '<span class="showroom-lesson-name">' + escHtml(les.name) + '</span>'
                    + '</div>'
                    + lesStatusHtml
                    + '</div>';
      }

      var ctaHtml = mod.cta && mod.showCta ? '<button class="showroom-module-cta" onclick="' + nav("lesson") + '">' + escHtml(mod.cta) + '</button>' : '';

      timelineHtml += '<div class="showroom-timeline-item">'
                   + '<div class="showroom-timeline-marker ' + modState + '">'
                   + '<span class="material-symbols-outlined' + markerFill + '" style="font-size:16px">' + markerIcon + '</span>'
                   + '</div>'
                   + '<div class="showroom-module-card ' + modState + '">'
                   + '<div class="showroom-module-head">'
                   + '<h3 class="showroom-module-title">' + escHtml(mod.title) + '</h3>'
                   + '<span class="showroom-module-status ' + modState + '">' + escHtml(mod.status) + '</span>'
                   + '</div>'
                   + '<div class="showroom-lesson-list">' + lessonsHtml + '</div>'
                   + ctaHtml
                   + '</div>'
                   + '</div>';
    }

    var navItems = [
      { id:"tuner",    label:"Tuner",   icon:"tune",       onClick: nav("tuner") },
      { id:"curriculum",label:"Courses", icon:"school" },
      { id:"tools",    label:"Tools",   icon:"construction",onClick: nav("tools") },
      { id:"profile",  label:"Profile", icon:"person",     onClick: nav("profile") }
    ];

    return '<div class="showroom-root with-bg">'
         + '<div class="showroom-woodgrain-overlay"></div>'
         + '<header class="showroom-appbar">'
        + '<div class="showroom-appbar-left">'
        + '<button class="showroom-iconbtn accent" onclick="' + backToHome() + '" aria-label="Menu"><span class="material-symbols-outlined" aria-hidden="true">menu</span></button>'
        + '<h1 class="showroom-appbar-title">Ember Studio</h1></div>'
        + '<div class="showroom-appbar-right"><button type="button" class="showroom-avatar" onclick="' + nav("profile") + '" aria-label="Profile"><div class="showroom-avatar-inner">' + escHtml(summary.userInitial) + '</div></button></div>'
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
         + '<div class="showroom-course-hero-xp-row"><span class="material-symbols-outlined fill showroom-course-hero-xp-icon" style="font-size:14px">bolt</span>' + escHtml(nextGoalText) + '</div>'
         + '<div class="showroom-course-hero-bar"><div class="showroom-course-hero-fill" style="width:' + progress + '%"></div></div></div></div>'
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
    var summary = getShowroomCurriculumSummary({
      courseTitle: opts.courseName || opts.courseTitle,
      level: opts.level,
      progressPct: opts.progressPct,
      nextGoalText: opts.nextXpGoal || opts.nextGoalText,
      modules: opts.modules,
      userInitial: opts.userInitial
    });
    var courseName  = summary.courseTitle;
    var level       = (summary.level != null) ? summary.level : 1;
    var progressPct = (summary.progressPct != null) ? summary.progressPct : 0;
    var nextXpGoal  = summary.nextGoalText || "No milestone loaded yet";
    var ctaLabel    = opts.ctaLabel || "Open Lesson";
    var userInitial = (summary.userInitial || "S").charAt(0).toUpperCase();
    var modules = Array.isArray(summary.modules) ? summary.modules.slice() : [];
    if (!modules.length) {
      modules = [{
        title: "No curriculum loaded yet",
        status: "EMPTY",
        state: "locked",
        lessons: [
          { name: "Select an instrument path or load lessons to populate this view.", state: "locked" }
        ]
      }];
    }

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
        ? '<button type="button" class="showroom-syllabus-cta" onclick="' + (opts.ctaAction || nav("lesson")) + '">'
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
      { id: "tools",      label: "Tools",   icon: "construction", onClick: nav("tools") },
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
        +     '<button type="button" class="showroom-syllabus-avatar" onclick="' + nav("profile") + '" aria-label="Profile">'
        +       '<span>' + escHtml(userInitial) + '</span>'
        +     '</button>'
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
  window.SparkLeaderboard         = { render: leaderboardRender };
  window.SparkShowroom       = SparkShowroom;
})();
