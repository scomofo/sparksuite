var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
global.window = global;

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

require("../js/sparksuite/domain/session.js");
var migrationModule = require("../js/sparksuite/storage/migrations.js");
var validationModule = require("../js/sparksuite/content/validate_content.js");

var qaMatrixPath = path.join(repoRoot, "docs", "qa", "qa_matrix.md");
var regressionChecklistPath = path.join(repoRoot, "docs", "qa", "regression_checklist.md");
assert.ok(fs.existsSync(qaMatrixPath), "qa matrix should exist");
assert.ok(fs.existsSync(regressionChecklistPath), "regression checklist should exist");

var pianoSession = loadJson("fixtures/sessions/piano_beginner_c_position.json");
var saveV1 = loadJson("fixtures/saves/schema_v1_profile.json");
var saveV2 = loadJson("fixtures/saves/schema_v2_profile.json");
var invalidMissingPrereq = loadJson("fixtures/content/invalid_missing_prerequisite.json");
var invalidDuplicateLesson = loadJson("fixtures/content/invalid_duplicate_lesson_id.json");
var lateTimingRun = loadJson("fixtures/results/late_timing_run.json");

assert.doesNotThrow(function() {
  assertSessionPlan(pianoSession);
});
assert.strictEqual(pianoSession.instrumentType, "piano");
assert.strictEqual(pianoSession.segments.length, 2);

var migratedV1 = migrationModule.migrateProfile(saveV1);
var migratedV2 = migrationModule.migrateProfile(saveV2);
assert.strictEqual(migratedV1.schemaVersion, 4);
assert.strictEqual(migratedV2.schemaVersion, 4);
assert.strictEqual(migratedV2.selectedInstrument, "piano");

var missingPrereqResult = validationModule.validateInstrumentContent(invalidMissingPrereq);
var duplicateLessonResult = validationModule.validateInstrumentContent(invalidDuplicateLesson);
assert.strictEqual(missingPrereqResult.ok, false);
assert.ok(missingPrereqResult.errors.some(function(error) {
  return error.indexOf("missing prerequisite") >= 0;
}));
assert.strictEqual(duplicateLessonResult.ok, false);
assert.ok(duplicateLessonResult.errors.some(function(error) {
  return error.indexOf("duplicate id") >= 0 && error.indexOf("lesson") >= 0;
}));

assert.strictEqual(lateTimingRun.total, lateTimingRun.hits + lateTimingRun.misses);
assert.ok(lateTimingRun.timing.late > 0);

console.log("PASS: release regression fixtures cover QA docs, save migrations, invalid content, and deterministic session/results data");
