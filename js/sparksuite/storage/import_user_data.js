(function() {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function defaultMigrate(payload) {
    var base = payload && payload.profile ? clone(payload.profile) : clone(payload || {});
    if (payload && payload.settings && !base.settings) {
      base.settings = clone(payload.settings);
    }
    if (typeof SparkMigrateProfile === "function") {
      return SparkMigrateProfile(base);
    }
    return base;
  }

  function defaultValidate(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Imported payload must be an object");
    }
    if (!payload.profile || typeof payload.profile !== "object") {
      throw new Error("Imported payload requires profile");
    }
    if (!payload.profile.userId) {
      throw new Error("Imported payload requires profile.userId");
    }
    if (payload.practiceJournal != null && !Array.isArray(payload.practiceJournal)) {
      throw new Error("Imported payload practiceJournal must be an array");
    }
    return payload;
  }

  function importUserData(options) {
    options = options || {};
    var payload = options.payload;
    var storage = options.storage;
    var migrate = options.migrate || defaultMigrate;
    var validate = options.validate || defaultValidate;
    var nextPayload;
    var migratedProfile;

    if (!storage) {
      throw new Error("importUserData requires storage");
    }

    validate(payload);
    migratedProfile = migrate(payload);
    nextPayload = {
      schemaVersion: migratedProfile.schemaVersion,
      profile: migratedProfile,
      settings: payload.settings ? clone(payload.settings) : (migratedProfile.settings || {}),
      practiceJournal: Array.isArray(payload.practiceJournal) ? clone(payload.practiceJournal) : []
    };

    validate(nextPayload);
    storage.replaceUserProfile(nextPayload.profile);
    if (typeof storage.replaceSettings === "function") {
      storage.replaceSettings(nextPayload.settings, nextPayload.profile.userId);
    }
    if (typeof storage.replacePracticeJournal === "function") {
      storage.replacePracticeJournal(nextPayload.practiceJournal, nextPayload.profile.userId);
    }

    return nextPayload;
  }

  function mergeDeep(target, patch) {
    var next = clone(target || {});
    var key;
    for (key in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
      if (isPlainObject(next[key]) && isPlainObject(patch[key])) {
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

  if (typeof window !== "undefined") {
    window.importSparkUserData = importUserData;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      importUserData: importUserData
    };
  }
})();
