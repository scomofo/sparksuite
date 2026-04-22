var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.S = {
    completedLessons: [],
    mastery: { chords: {}, lessons: {}, rhythm: {} },
    chordProgress: {}
  };

  eval(loadJS("js/launcher.js"));
  eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));
  eval(loadJS("js/instruments/ukulele/register.js"));
  eval(loadJS("js/curriculum/curriculum_engine.js"));
}

function test(name, fn) {
  try {
    resetEnvironment();
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Curriculum Service Instrument Resolution ---");

test("buildLearningQueue rehydrates an app-id-only active instrument through the registry", function() {
  var originalGetActive = SparkInstruments.getActive;
  SparkInstruments.getActive = function() {
    return { appId: "ukespark" };
  };

  var queue = SparkCurriculumService.buildLearningQueue({});

  SparkInstruments.getActive = originalGetActive;
  assert.ok(Array.isArray(queue));
  assert.ok(queue.some(function(item) {
    return item && item.type === "lesson" && String(item.id || "").indexOf("uke_") === 0;
  }), "Expected a ukulele lesson suggestion from the rehydrated active instrument");
});

if (process.exitCode) process.exit(process.exitCode);
