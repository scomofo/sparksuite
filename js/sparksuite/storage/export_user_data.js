(function() {
  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function exportUserData(options) {
    options = options || {};
    var storage = options.storage;
    var userId = options.userId || "default";
    var schemaVersion = typeof options.schemaVersion === "number"
      ? options.schemaVersion
      : (storage && typeof storage.getCurrentSchemaVersion === "function" ? storage.getCurrentSchemaVersion() : null);

    if (!storage) {
      throw new Error("exportUserData requires storage");
    }

    return {
      schemaVersion: schemaVersion,
      exportedAt: new Date().toISOString(),
      profile: storage && typeof storage.getUserProfile === "function"
        ? clone(storage.getUserProfile(userId))
        : null,
      settings: storage && typeof storage.getSettings === "function"
        ? clone(storage.getSettings(userId))
        : null,
      practiceJournal: storage && typeof storage.getPracticeJournal === "function"
        ? clone(storage.getPracticeJournal(userId))
        : []
    };
  }

  if (typeof window !== "undefined") {
    window.exportSparkUserData = exportUserData;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      exportUserData: exportUserData
    };
  }
})();
