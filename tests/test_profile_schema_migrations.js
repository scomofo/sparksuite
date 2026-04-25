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

require("../js/sparksuite/storage/profile_schema.js");
require("../js/sparksuite/storage/migrations.js");
require("../js/sparksuite/core/storage.js");

var createDefaultProfile = window.SparkCreateDefaultProfile;
var migrateProfile = window.SparkMigrateProfile;
var migrationMap = window.SparkProfileMigrations;
var CURRENT_PROFILE_SCHEMA_VERSION = window.SparkCurrentProfileSchemaVersion;
var storage = new window.SparkSuiteStorage();

var fresh = createDefaultProfile("user_1");
assert.strictEqual(fresh.schemaVersion, CURRENT_PROFILE_SCHEMA_VERSION);
assert.strictEqual(fresh.userId, "user_1");
assert.strictEqual(fresh.settings.gameplay.hitWindowMs, 140);
assert.strictEqual(fresh.settings.accessibility.reducedMotion, false);
assert.strictEqual(fresh.settings.accessibility.metronomeVisualOnly, false);
assert.deepStrictEqual(fresh.settings.accessibility.keyboardRemapping, {});

var migratedFromV1 = migrateProfile({
  userId: "user_old",
  xp: 42,
  selectedInstrument: "bass",
  mastery: {
    groove_1: {
      mastery: 0.6
    }
  }
});
assert.strictEqual(migratedFromV1.schemaVersion, CURRENT_PROFILE_SCHEMA_VERSION);
assert.strictEqual(migratedFromV1.xp, 42);
assert.strictEqual(migratedFromV1.selectedInstrument, "bass");
assert.strictEqual(migratedFromV1.mastery.groove_1.mastery, 0.6);
assert.strictEqual(migratedFromV1.settings.gameplay.noteSpeed, 0.32);
assert.strictEqual(migratedFromV1.settings.accessibility.noteSize, "normal");

var migratedFromV2 = migrateProfile({
  schemaVersion: 2,
  userId: "user_mid",
  xp: 12,
  settings: {
    gameplay: {
      inputLatencyOffsetMs: -24
    }
  }
});
assert.strictEqual(migratedFromV2.schemaVersion, CURRENT_PROFILE_SCHEMA_VERSION);
assert.strictEqual(migratedFromV2.settings.gameplay.inputLatencyOffsetMs, -24);
assert.strictEqual(migratedFromV2.settings.accessibility.highContrast, false);
assert.strictEqual(migratedFromV2.settings.accessibility.audioCueVolume, 0.8);

var migratedFromV3 = migrateProfile({
  schemaVersion: 3,
  userId: "user_access",
  settings: {
    gameplay: {
      noteSpeed: 0.4
    },
    accessibility: {
      reducedMotion: true,
      laneLabels: false
    }
  }
});
assert.strictEqual(migratedFromV3.schemaVersion, CURRENT_PROFILE_SCHEMA_VERSION);
assert.strictEqual(migratedFromV3.settings.accessibility.reducedMotion, true);
assert.strictEqual(migratedFromV3.settings.accessibility.laneLabels, false);
assert.strictEqual(migratedFromV3.settings.accessibility.leftHandedLayout, false);

var removed = migrationMap[2];
delete migrationMap[2];
assert.throws(function() {
  migrateProfile({ schemaVersion: 2, userId: "broken" });
}, /Missing profile migration/);
migrationMap[2] = removed;

storageData = {};
localStorage.setItem("spark_profile_user_store", JSON.stringify({
  userId: "user_store",
  xp: 9
}));
var loaded = storage.getUserProfile("user_store");
assert.strictEqual(loaded.schemaVersion, CURRENT_PROFILE_SCHEMA_VERSION);
assert.strictEqual(loaded.xp, 9);
assert.ok(localStorage.getItem("spark_profile_user_store").indexOf("\"schemaVersion\":" + CURRENT_PROFILE_SCHEMA_VERSION) >= 0);

var updated = storage.updateUserProfile("user_store", {
  mastery: {
    lesson_1: {
      mastery: 0.5
    }
  },
  settings: {
    gameplay: {
      inputLatencyOffsetMs: -18
    }
  }
});
assert.strictEqual(updated.mastery.lesson_1.mastery, 0.5);
assert.strictEqual(updated.settings.gameplay.inputLatencyOffsetMs, -18);
assert.strictEqual(updated.settings.accessibility.metronomeVisualOnly, false);
assert.strictEqual(storage.getCurrentPlanId(), null);
storage.setCurrentPlanId("plan_123");
assert.strictEqual(storage.getCurrentPlanId(), "plan_123");

console.log("PASS: profile schema migrations and SparkSuiteStorage preserve migrated profile state");
