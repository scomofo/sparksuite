// js/utils/instrument_progress.js
// Engine-first facade for per-instrument XP/streak/level/session progress.
//
// Per CLAUDE.md, all progression logic lives in the core engine
// (`SparkProgress` in js/spark-core/progress-engine.js) and the per-app
// profile (`SparkProfile.apps[appId].stats` in profile-schema.js). This
// facade is the ONLY write path legacy call sites should use for XP,
// streak, session-count, and level changes:
//
//   SparkInstrumentProgress.addXp(10)               // awards XP
//   SparkInstrumentProgress.completeSession("drill") // increments sessions
//   SparkInstrumentProgress.updateStreak()          // recomputes streak
//   SparkInstrumentProgress.setLevel(4)             // sets level
//
// For each write, the facade:
//   1. Loads the `spark_suite_profile` via SparkStorage
//   2. Resolves the active instrument's appId (via SparkInstruments)
//   3. Delegates to the SparkProgress engine method
//   4. Saves the profile
//   5. Mirrors the updated per-app stat into the legacy `S.*` field so
//      the header and other dumb-renderer UI keeps showing the correct
//      active-instrument number without each render path having to
//      re-hit SparkStorage
//
// On instrument switch, call `syncFromActive()` to reload S.xp / S.streak /
// S.level / S.sessions from the newly-active app's profile stats — this is
// what makes the header show per-instrument XP instead of a single global
// pool shared across instruments.
//
// Legacy fallback: if SparkStorage / SparkProgress / SparkInstruments are
// unavailable (e.g. tests that don't load spark-core), the facade silently
// falls back to the legacy "just mutate S.xp" behavior so nothing breaks.
(function() {
  function activeAppId() {
    if (typeof SparkInstruments === "undefined" || !SparkInstruments.getActive) return null;
    var active = SparkInstruments.getActive();
    if (!active) return null;
    return active.id || active.appId || active.instrumentId || null;
  }

  function activeInstrumentType() {
    if (typeof SparkInstruments === "undefined" || !SparkInstruments.getActive) return null;
    var active = SparkInstruments.getActive();
    if (!active) return null;
    return active.instrument || active.instrumentType || null;
  }

  function canRouteThroughEngine() {
    return typeof SparkStorage !== "undefined"
      && typeof SparkProgress !== "undefined"
      && typeof SparkProfile !== "undefined"
      && activeAppId() !== null;
  }

  function withProfile(fn) {
    if (!canRouteThroughEngine()) return null;
    var profile = SparkStorage.load();
    var appId = activeAppId();
    var type = activeInstrumentType();
    SparkProfile.ensureApp(profile, appId, type);
    var result = fn(profile, appId);
    SparkStorage.save(profile);
    return result;
  }

  function mirrorStatsToLegacy(stats) {
    if (!stats || typeof S === "undefined") return;
    if (typeof stats.xp === "number") S.xp = stats.xp;
    if (typeof stats.streakDays === "number") S.streak = stats.streakDays;
    if (typeof stats.level === "number") S.level = stats.level;
    if (typeof stats.sessionsCompleted === "number") S.sessions = stats.sessionsCompleted;
  }

  function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
  }

  var SparkInstrumentProgress = {
    // Engine-routed XP award. Updates SparkProfile.apps[activeAppId].stats.xp
    // and mirrors into S.xp. When the engine path is unavailable, falls
    // back to the pre-existing "S.xp += amount" behavior.
    addXp: function(amount) {
      if (!amount) return;
      var routed = withProfile(function(profile, appId) {
        SparkProgress.awardXp(profile, appId, amount);
        return profile.apps[appId].stats;
      });
      if (routed) {
        mirrorStatsToLegacy(routed);
      } else if (typeof S !== "undefined") {
        S.xp = (S.xp || 0) + amount;
      }
    },

    // Engine-routed session completion. Increments
    // SparkProfile.apps[activeAppId].stats.sessionsCompleted (and XP if meta.xp
    // set) and mirrors sessions/xp into S.
    completeSession: function(sessionType, meta) {
      var routed = withProfile(function(profile, appId) {
        SparkProgress.completeSession(profile, appId, sessionType, meta || {});
        return profile.apps[appId].stats;
      });
      if (routed) {
        mirrorStatsToLegacy(routed);
      } else if (typeof S !== "undefined") {
        S.sessions = (S.sessions || 0) + 1;
        if (meta && typeof meta.xp === "number") S.xp = (S.xp || 0) + meta.xp;
      }
    },

    // Engine-routed streak update. Uses today's ISO date by default; pass
    // an explicit date to backfill.
    updateStreak: function(isoDate) {
      var date = isoDate || todayIsoDate();
      var routed = withProfile(function(profile, appId) {
        SparkProgress.updateStreak(profile, appId, date);
        return profile.apps[appId].stats;
      });
      if (routed) {
        mirrorStatsToLegacy(routed);
      } else if (typeof S !== "undefined") {
        S.streak = (S.streak || 0) + 1;
      }
    },

    // Streak-freeze credit: checkStreak() consumed a freeze for one missed
    // day. Move _lastStreakDate forward to the missed day WITHOUT touching
    // streakDays, so the next completed session reads a 1-day gap and
    // increments instead of resetting to 1 (SparkProgress.updateStreak
    // resets on any gap other than exactly one day). All apps with a last
    // session on the day before the missed day are credited — checkStreak
    // runs at boot when no instrument is active, and the legacy streak the
    // freeze protects mirrors whichever instrument activates next.
    applyStreakFreeze: function(missedIsoDate) {
      if (typeof SparkStorage === "undefined" || !SparkStorage.load || !missedIsoDate) return false;
      var profile = SparkStorage.load();
      if (!profile || !profile.apps) return false;
      var touched = false;
      for (var appId in profile.apps) {
        var app = profile.apps[appId];
        if (!app || !app._lastStreakDate) continue;
        // Parse the date part at explicit UTC midnight and round — immune
        // to DST-length days, and the slice keeps a stray full-ISO value
        // (with a time component) from producing an Invalid Date.
        var gap = Math.round((new Date(missedIsoDate.slice(0, 10) + "T00:00:00Z") - new Date(app._lastStreakDate.slice(0, 10) + "T00:00:00Z")) / 86400000);
        if (gap === 1) {
          app._lastStreakDate = missedIsoDate;
          touched = true;
        }
      }
      if (touched) SparkStorage.save(profile);
      return touched;
    },

    setLevel: function(level) {
      var routed = withProfile(function(profile, appId) {
        profile.apps[appId].stats.level = level;
        return profile.apps[appId].stats;
      });
      if (routed) {
        mirrorStatsToLegacy(routed);
      } else if (typeof S !== "undefined") {
        S.level = level;
      }
    },

    // Refresh S.xp / S.streak / S.level / S.sessions from the active
    // instrument's app profile. Call on SparkInstruments.activate().
    syncFromActive: function() {
      if (!canRouteThroughEngine()) return;
      var profile = SparkStorage.load();
      var appId = activeAppId();
      var type = activeInstrumentType();
      SparkProfile.ensureApp(profile, appId, type);
      mirrorStatsToLegacy(profile.apps[appId].stats);
    },

    // One-time backfill: when a user upgrades from a pre-namespacing build,
    // their accumulated XP/streak/level/sessions sit in legacy `S.*` but
    // every app's per-app profile is empty. On the FIRST activate() after
    // upgrade, copy the legacy values into the currently-active app so
    // that instrument has a non-zero starting point — then set a
    // suite-level flag so subsequent activates (of other instruments)
    // don't re-copy the same legacy pool into each one. Without the
    // flag, guitar's XP would bleed into bass on the bass activation
    // because syncFromActive() has since mirrored guitar's XP back into
    // S.xp.
    backfillFromLegacyIfEmpty: function() {
      if (!canRouteThroughEngine() || typeof S === "undefined") return;
      var profile = SparkStorage.load();
      if (profile._legacyProgressMigrated) return;
      var appId = activeAppId();
      var type = activeInstrumentType();
      SparkProfile.ensureApp(profile, appId, type);
      var stats = profile.apps[appId].stats;
      var hadLegacyData = (S.xp || 0) > 0 || (S.streak || 0) > 0 || (S.sessions || 0) > 0;
      if (hadLegacyData) {
        stats.xp = S.xp || 0;
        stats.streakDays = S.streak || 0;
        stats.level = S.level || 1;
        stats.sessionsCompleted = S.sessions || 0;
      }
      // Mark migrated even if there was nothing to copy — this flag's
      // only job is "legacy pool has already been drained."
      profile._legacyProgressMigrated = true;
      SparkStorage.save(profile);
    }
  };

  var _globalScope = (typeof globalThis !== "undefined") ? globalThis
    : (typeof window !== "undefined") ? window
    : (typeof global !== "undefined") ? global
    : {};
  _globalScope.SparkInstrumentProgress = SparkInstrumentProgress;
})();
