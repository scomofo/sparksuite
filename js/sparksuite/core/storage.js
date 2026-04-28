(function() {
  function SparkSuiteStorage() {}

  SparkSuiteStorage.prototype.getCurrentSchemaVersion = function() {
    if (typeof SparkCurrentProfileSchemaVersion === "number") {
      return SparkCurrentProfileSchemaVersion;
    }
    return 4;
  };

  SparkSuiteStorage.prototype.setPerformanceMonitor = function(performanceMonitor) {
    this.performanceMonitor = performanceMonitor || null;
    return this.performanceMonitor;
  };

  SparkSuiteStorage.prototype.getProfileStorageKey = function(userId) {
    return "spark_profile_" + (userId || "default");
  };

  SparkSuiteStorage.prototype.getPracticeJournalStorageKey = function(userId) {
    return "spark_practice_journal_" + (userId || "default");
  };

  SparkSuiteStorage.prototype.getCurrentPlanId = function() {
    return S.activeSessionPlanId || null;
  };

  SparkSuiteStorage.prototype.setCurrentPlanId = function(planId) {
    S.activeSessionPlanId = planId || null;
  };

  SparkSuiteStorage.prototype.getUserProfile = function(userId) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("storage.read_profile", "storageReadMs", function() {
        return self._getUserProfileInternal(userId);
      });
    }
    return this._getUserProfileInternal(userId);
  };

  SparkSuiteStorage.prototype._getUserProfileInternal = function(userId) {
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
    migrated = this.measureMigration(parsed);
    if (migrated.schemaVersion !== parsed.schemaVersion || JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      this.saveUserProfile(migrated);
    }
    return migrated;
  };

  SparkSuiteStorage.prototype.saveUserProfile = function(profile) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("storage.write_profile", "storageWriteMs", function() {
        return self._saveUserProfileInternal(profile);
      });
    }
    return this._saveUserProfileInternal(profile);
  };

  SparkSuiteStorage.prototype._saveUserProfileInternal = function(profile) {
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

  SparkSuiteStorage.prototype.replaceUserProfile = function(profile) {
    return this.saveUserProfile(profile);
  };

  SparkSuiteStorage.prototype.getSettings = function(userId) {
    var profile = this.getUserProfile(userId);
    return clone(profile && profile.settings ? profile.settings : {});
  };

  SparkSuiteStorage.prototype.replaceSettings = function(settings, userId) {
    var profile = this.getUserProfile(userId);
    profile.settings = mergeDeep(profile.settings || {}, settings || {});
    return this.saveUserProfile(profile);
  };

  SparkSuiteStorage.prototype.getPracticeJournal = function(userId) {
    var raw = null;
    try {
      raw = localStorage.getItem(this.getPracticeJournalStorageKey(userId));
    } catch (error) {
      raw = null;
    }
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (error) {
      return [];
    }
  };

  SparkSuiteStorage.prototype.replacePracticeJournal = function(entries, userId) {
    var journal = Array.isArray(entries) ? clone(entries) : [];
    try {
      localStorage.setItem(this.getPracticeJournalStorageKey(userId), JSON.stringify(journal));
    } catch (error) {}
    return journal;
  };

  SparkSuiteStorage.prototype.measureMigration = function(profile) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("storage.migrate_profile", "storageReadMs", function() {
        return migrateProfile(profile);
      });
    }
    return migrateProfile(profile);
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
  if (typeof module !== "undefined") {
    module.exports = {
      SparkSuiteStorage: SparkSuiteStorage
    };
  }
})();
