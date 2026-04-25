(function() {
  function SparkSuiteStorage() {}

  SparkSuiteStorage.prototype.getProfileStorageKey = function(userId) {
    return "spark_profile_" + (userId || "default");
  };

  SparkSuiteStorage.prototype.getCurrentPlanId = function() {
    return S.activeSessionPlanId || null;
  };

  SparkSuiteStorage.prototype.setCurrentPlanId = function(planId) {
    S.activeSessionPlanId = planId || null;
  };

  SparkSuiteStorage.prototype.getUserProfile = function(userId) {
    var resolvedUserId = userId || "default";
    var raw = null;
    var parsed;
    var migrated;
    try {
      raw = localStorage.getItem(this.getProfileStorageKey(resolvedUserId));
    } catch (error) {
      raw = null;
    }
    if (!raw) return createDefaultProfile(resolvedUserId);
    parsed = JSON.parse(raw);
    migrated = migrateProfile(parsed);
    if (migrated.schemaVersion !== parsed.schemaVersion || JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      this.saveUserProfile(migrated);
    }
    return migrated;
  };

  SparkSuiteStorage.prototype.saveUserProfile = function(profile) {
    var nextProfile = migrateProfile(profile || createDefaultProfile("default"));
    try {
      localStorage.setItem(this.getProfileStorageKey(nextProfile.userId), JSON.stringify(nextProfile));
    } catch (error) {}
    return nextProfile;
  };

  SparkSuiteStorage.prototype.updateUserProfile = function(userId, patch) {
    var profile = this.getUserProfile(userId);
    var nextProfile = mergeDeep(profile, patch || {});
    return this.saveUserProfile(nextProfile);
  };

  function createDefaultProfile(userId) {
    if (typeof SparkCreateDefaultProfile === "function") return SparkCreateDefaultProfile(userId);
    return {
      schemaVersion: 4,
      userId: userId || "default",
      xp: 0,
      level: 1,
      selectedInstrument: "guitar",
      mastery: {},
      streaks: {},
      achievements: [],
      settings: {
        gameplay: {
          inputLatencyOffsetMs: 0,
          hitWindowMs: 140,
          noteSpeed: 0.32
        },
        accessibility: typeof SparkNormalizeAccessibilitySettings === "function"
          ? SparkNormalizeAccessibilitySettings({})
          : {
              reducedMotion: false,
              highContrast: false,
              noteSize: "normal",
              laneLabels: true,
              colorblindSafeLanes: false,
              metronomeVisualOnly: false,
              disableFailureAnimations: false,
              keyboardRemapping: {},
              leftHandedLayout: false,
              slowerDefaultSpeed: false,
              audioCueVolume: 0.8,
              metronomeVolume: 0.6
            }
      }
    };
  }

  function migrateProfile(profile) {
    if (typeof SparkMigrateProfile === "function") return SparkMigrateProfile(profile);
    return profile || createDefaultProfile("default");
  }

  function mergeDeep(target, patch) {
    var next = clone(target);
    var key;
    for (key in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
      if (isPlainObject(patch[key]) && isPlainObject(next[key])) {
        next[key] = mergeDeep(next[key], patch[key]);
      } else {
        next[key] = clone(patch[key]);
      }
    }
    return next;
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  window.SparkSuiteStorage = SparkSuiteStorage;
})();
