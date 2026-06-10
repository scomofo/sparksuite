var assert = require("assert");

global.window = global;

require("../js/sparksuite/settings/accessibility_settings.js");
require("../js/sparksuite/storage/profile_schema.js");
require("../js/sparksuite/storage/migrations.js");
require("../js/sparksuite/core/ai_engine.js");

var AIEngine = window.SparkAIEngine;
var normalizeAccessibilitySettings = window.SparkNormalizeAccessibilitySettings;
var createDefaultProfile = window.SparkCreateDefaultProfile;
var migrateProfile = window.SparkMigrateProfile;

var ai = new AIEngine();
var session = { id: "session_ai_1" };
var performance = {
  accuracy: 0.62,
  timing: {
    late: 3,
    early: 1
  }
};
var mastery = { lesson_1: { mastery: 0.55 } };
var performanceClone = JSON.parse(JSON.stringify(performance));
var masteryClone = JSON.parse(JSON.stringify(mastery));

var coaching = ai.generateCoachingNote({
  session: session,
  performance: performance,
  mastery: mastery,
  nextRecommendedSkill: "steady_downstrokes"
});

assert.strictEqual(coaching.authority, "advisory_only");
assert.strictEqual(coaching.sessionId, "session_ai_1");
assert.strictEqual(coaching.suggestedFocus, "timing_late");
assert.ok(/slightly late/i.test(coaching.message));
assert.deepStrictEqual(performance, performanceClone);
assert.deepStrictEqual(mastery, masteryClone);

var defaults = normalizeAccessibilitySettings({});
assert.strictEqual(defaults.reducedMotion, false);
assert.strictEqual(defaults.laneLabels, true);
assert.strictEqual(defaults.metronomeVisualOnly, false);
assert.strictEqual(defaults.leftHandedLayout, false);
assert.deepStrictEqual(defaults.keyboardRemapping, {});

var profile = createDefaultProfile("access_user");
assert.strictEqual(profile.schemaVersion, window.SparkCurrentProfileSchemaVersion);
assert.strictEqual(profile.settings.accessibility.disableFailureAnimations, false);
assert.strictEqual(profile.settings.accessibility.audioCueVolume, 0.8);

var migrated = migrateProfile({
  schemaVersion: 3,
  userId: "legacy_access",
  xp: 4,
  settings: {
    accessibility: {
      reducedMotion: true,
      noteSize: "large"
    }
  }
});
assert.strictEqual(migrated.schemaVersion, window.SparkCurrentProfileSchemaVersion);
assert.strictEqual(migrated.settings.accessibility.reducedMotion, true);
assert.strictEqual(migrated.settings.accessibility.noteSize, "large");
assert.strictEqual(migrated.settings.accessibility.disableFailureAnimations, false);
assert.strictEqual(migrated.settings.accessibility.metronomeVolume, 0.6);

console.log("PASS: AI coaching stays advisory and accessibility settings normalize and migrate safely");
