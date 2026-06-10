const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.window = global;

function load(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

[
  "js/sparksuite/instruments/vocals/vocals_skill_tree.js",
  "js/sparksuite/instruments/vocals/vocals_curriculum.js",
  "js/sparksuite/instruments/vocals/vocals_lessons.js",
  "js/sparksuite/instruments/vocals/vocals_exercises.js",
  "js/sparksuite/instruments/vocals/vocals_module.js"
].forEach(load);

const allExercises = SparkVocalsModule.getExercises();
assert(Array.isArray(allExercises), "no-arg getExercises must return an array");
assert.strictEqual(allExercises.length, 29);
assert(allExercises.some((exercise) => exercise.id === "ex_vocal_setup_comfort_01"));
assert.strictEqual(SparkVocalsModule.getExercises("vocal_comfort_setup").length, 1);
assert.strictEqual(SparkVocalsModule.getExercises("lesson_vocal_setup_comfort_01").length, 1);

console.log("test_vocals_curriculum_module passed");
