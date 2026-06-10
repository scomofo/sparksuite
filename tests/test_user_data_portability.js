var assert = require("assert");

var storageData = {};
global.window = global;
global.localStorage = {
  getItem: function(key) {
    return Object.prototype.hasOwnProperty.call(storageData, key) ? storageData[key] : null;
  },
  setItem: function(key, value) {
    storageData[key] = String(value);
  },
  removeItem: function(key) {
    delete storageData[key];
  }
};
global.S = {
  activeSessionPlanId: null
};

require("../js/sparksuite/settings/accessibility_settings.js");
require("../js/sparksuite/storage/profile_schema.js");
require("../js/sparksuite/storage/migrations.js");
require("../js/sparksuite/core/storage.js");

var exportModule = require("../js/sparksuite/storage/export_user_data.js");
var importModule = require("../js/sparksuite/storage/import_user_data.js");
var storage = new window.SparkSuiteStorage();

var profile = storage.saveUserProfile({
  schemaVersion: 4,
  userId: "portable_user",
  xp: 22,
  level: 2,
  selectedInstrument: "ukulele",
  mastery: {
    uke_01: {
      mastery: 0.7
    }
  },
  streaks: {},
  achievements: ["first_lesson"],
  settings: {
    gameplay: {
      inputLatencyOffsetMs: -12,
      hitWindowMs: 140,
      noteSpeed: 0.36
    },
    accessibility: {
      reducedMotion: true,
      laneLabels: false
    }
  }
});

storage.replacePracticeJournal([
  { id: "entry_1", lessonId: "uke_01", note: "Felt steady" }
], "portable_user");

var exported = exportModule.exportUserData({
  storage: storage,
  schemaVersion: window.SparkCurrentProfileSchemaVersion,
  userId: "portable_user"
});

assert.strictEqual(exported.schemaVersion, window.SparkCurrentProfileSchemaVersion);
assert.strictEqual(exported.profile.userId, "portable_user");
assert.strictEqual(exported.settings.gameplay.inputLatencyOffsetMs, -12);
assert.strictEqual(exported.practiceJournal.length, 1);

storageData = {};

var imported = importModule.importUserData({
  payload: {
    schemaVersion: 1,
    profile: {
      userId: "legacy_user",
      xp: 9,
      selectedInstrument: "bass",
      mastery: {
        groove_1: {
          mastery: 0.55
        }
      }
    },
    settings: {
      gameplay: {
        inputLatencyOffsetMs: -20
      }
    },
    practiceJournal: [
      { id: "entry_old", lessonId: "bass_01", note: "Needs work" }
    ]
  },
  storage: storage
});

assert.strictEqual(imported.profile.schemaVersion, window.SparkCurrentProfileSchemaVersion);
assert.strictEqual(imported.profile.userId, "legacy_user");
assert.strictEqual(imported.profile.selectedInstrument, "bass");
assert.strictEqual(imported.settings.gameplay.inputLatencyOffsetMs, -20);
assert.strictEqual(imported.practiceJournal.length, 1);

var loadedImportedProfile = storage.getUserProfile("legacy_user");
assert.strictEqual(loadedImportedProfile.userId, "legacy_user");
assert.strictEqual(loadedImportedProfile.schemaVersion, window.SparkCurrentProfileSchemaVersion);
assert.strictEqual(storage.getPracticeJournal("legacy_user")[0].lessonId, "bass_01");

assert.throws(function() {
  importModule.importUserData({
    payload: {
      profile: {
        xp: 12
      }
    },
    storage: storage
  });
}, /profile.userId/);

console.log("PASS: user data export and import validate, migrate, and persist local SparkSuite data");
