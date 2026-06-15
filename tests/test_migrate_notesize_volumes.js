var assert = require("assert");
var fs = require("fs");
var path = require("path");

// Load migrations WITHOUT accessibility_settings so inline fallback is used
global.window = global;
global.globalThis = global;
// SparkNormalizeAccessibilitySettings intentionally not defined
global.eval(fs.readFileSync(path.join(__dirname, "..", "js/sparksuite/storage/migrations.js"), "utf8"));

var migrateProfile = global.SparkMigrateProfile || (typeof module !== "undefined" && require(path.join(__dirname, "..", "js/sparksuite/storage/migrations.js")).migrateProfile);

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- Migration noteSize allowlist + volume clamping ---");

// V2 → V3: noteSize allowlist
test("V2→V3 valid noteSize 'large' is preserved", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 2, userId: "u", xp: 0, settings: { accessibility: { noteSize: "large" } } });
  assert.strictEqual(result.settings.accessibility.noteSize, "large");
});

test("V2→V3 valid noteSize 'compact' is preserved", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 2, userId: "u", xp: 0, settings: { accessibility: { noteSize: "compact" } } });
  assert.strictEqual(result.settings.accessibility.noteSize, "compact");
});

test("V2→V3 invalid noteSize 'huge' is normalized to 'normal'", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 2, userId: "u", xp: 0, settings: { accessibility: { noteSize: "huge" } } });
  assert.strictEqual(result.settings.accessibility.noteSize, "normal");
});

test("V2→V3 missing noteSize defaults to 'normal'", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 2, userId: "u", xp: 0, settings: { accessibility: {} } });
  assert.strictEqual(result.settings.accessibility.noteSize, "normal");
});

// V3 → V4 inline fallback: volume clamping
test("V3→V4 in-range audioCueVolume passes through unchanged", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 3, userId: "u", settings: { gameplay: {}, accessibility: { audioCueVolume: 0.5 } } });
  assert.strictEqual(result.settings.accessibility.audioCueVolume, 0.5);
});

test("V3→V4 out-of-range audioCueVolume 5.0 is clamped to 1.0", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 3, userId: "u", settings: { gameplay: {}, accessibility: { audioCueVolume: 5.0 } } });
  assert.strictEqual(result.settings.accessibility.audioCueVolume, 1.0);
});

test("V3→V4 negative audioCueVolume is clamped to 0", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 3, userId: "u", settings: { gameplay: {}, accessibility: { audioCueVolume: -2 } } });
  assert.strictEqual(result.settings.accessibility.audioCueVolume, 0);
});

test("V3→V4 out-of-range metronomeVolume 3.5 is clamped to 1.0", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 3, userId: "u", settings: { gameplay: {}, accessibility: { metronomeVolume: 3.5 } } });
  assert.strictEqual(result.settings.accessibility.metronomeVolume, 1.0);
});

test("V3→V4 default audioCueVolume is 0.8 when missing", function() {
  var result = global.SparkMigrateProfile({ schemaVersion: 3, userId: "u", settings: { gameplay: {}, accessibility: {} } });
  assert.strictEqual(result.settings.accessibility.audioCueVolume, 0.8);
});
