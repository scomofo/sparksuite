const assert = require("assert");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("PASS:", name);
  } catch (error) {
    failed += 1;
    console.error("FAIL:", name, "--", error.message);
  }
}

const loader = require("../js/sparksuite/content/load_instrument_content.js");
const validator = require("../js/sparksuite/content/validate_content.js");
const factory = require("../js/sparksuite/content/create_instrument_module.js");
const moduleValidator = require("../js/sparksuite/content/validate_instrument_module.js");

const contentBaseDir = path.join(process.cwd(), "content", "instruments");

test("JSON-backed instrument content can build a valid ukulele module", function() {
  const content = loader.loadInstrumentContentSync("ukulele", {
    fs,
    baseDir: contentBaseDir
  });
  const validation = validator.validateInstrumentContent(content);
  assert.strictEqual(validation.ok, true);

  const moduleApi = factory.createInstrumentModule(content);
  moduleValidator.validateInstrumentModule(moduleApi, "ukulele");
  assert.strictEqual(moduleApi.getType(), "ukulele");
  assert.ok(moduleApi.getLessons().length > 0);
  assert.ok(moduleApi.getExercises("down_strum").length > 0);
});

test("content validator rejects missing prerequisites and duplicate lesson ids", function() {
  const result = validator.validateInstrumentContent({
    instrument: {
      id: "badulele",
      name: "Badulele",
      tuning: { strings: ["G4"], stringCount: 1, type: "odd" },
      capabilities: { preferredRenderer: "string-lane-highway", inputModes: ["keyboard"] }
    },
    skills: [{ id: "skill_a", name: "Skill A", category: "rhythm", prerequisites: [] }],
    lessons: [
      { id: "lesson_1", skill: "skill_a", prerequisites: ["missing_skill"] },
      { id: "lesson_1", skill: "skill_a", prerequisites: [] }
    ],
    chords: [],
    exercises: [{ id: "exercise_1", skillId: "skill_a", type: "strum", chordIds: ["ghost"] }],
    songs: []
  });

  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('duplicate id "lesson_1"')));
  assert.ok(result.errors.some((error) => error.includes('missing prerequisite "missing_skill"')));
  assert.ok(result.errors.some((error) => error.includes('missing chord "ghost"')));
});

test("preview_content prints a summary for a real instrument", function() {
  const result = childProcess.spawnSync(process.execPath, ["scripts/preview_content.js", "guitar"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.strictEqual(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("Guitar content preview"));
  assert.ok(result.stdout.includes("- lessons: 2"));
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
