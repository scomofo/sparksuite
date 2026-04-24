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
    curriculumV2CompletedSessions: {},
    mastery: { chords: {}, lessons: {}, rhythm: {} },
    chordProgress: {}
  };

  eval(loadJS("js/launcher.js"));
  eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
  eval(loadJS("js/curriculum/curriculum_v2.js"));
  eval(loadJS("js/curriculum/curriculum_v2_legacy_adapter.js"));
  eval(loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js"));
  eval(loadJS("js/instruments/ukulele/register.js"));
  eval(loadJS("js/instruments/guitar/register.js"));
  eval(loadJS("js/curriculum/curriculum_engine.js"));
  eval(loadJS("js/sparksuite/bridges/curriculum_bridge.js"));
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

test("buildLearningQueue falls back to curriculum v2 when legacy maps are absent", function() {
  var originalGetActive = SparkInstruments.getActive;
  SparkInstruments.getActive = function() {
    return {
      appId: "chordspark",
      instrument: "guitar",
      getCurriculumMap: function() { return []; },
      getCurriculumMapV2: function() {
        return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
      }
    };
  };

  var queue = SparkCurriculumService.buildLearningQueue({});

  SparkInstruments.getActive = originalGetActive;
  assert.ok(queue.some(function(item) {
    return item && item.type === "lesson" && item.id === "gtr-d01";
  }), "Expected guitar day 1 from curriculum v2 fallback");
});

test("buildLearningQueue keeps an active instrument that only exposes curriculum v2", function() {
  var originalGetActive = SparkInstruments.getActive;
  var originalGetAll = SparkInstruments.getAll;
  SparkInstruments.getActive = function() {
    return {
      appId: "chordspark",
      instrument: "guitar",
      getCurriculumMapV2: function() {
        return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
      }
    };
  };
  SparkInstruments.getAll = function() {
    return [{ id: "chordspark", appId: "chordspark", instrument: "guitar" }];
  };

  var queue = SparkCurriculumService.buildLearningQueue({});

  SparkInstruments.getActive = originalGetActive;
  SparkInstruments.getAll = originalGetAll;
  assert.ok(queue.some(function(item) {
    return item && item.type === "lesson" && item.id === "gtr-d01";
  }), "Expected the active instrument's curriculum v2 map to survive registry rehydration");
});

test("buildLearningQueue respects curriculum v2 completion state", function() {
  var originalGetActive = SparkInstruments.getActive;
  S.curriculumV2CompletedSessions.guitar = ["gtr-d01"];
  SparkInstruments.getActive = function() {
    return {
      appId: "chordspark",
      instrument: "guitar",
      getCurriculumMap: function() { return []; },
      getCurriculumMapV2: function() {
        return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
      }
    };
  };

  var queue = SparkCurriculumService.buildLearningQueue({});

  SparkInstruments.getActive = originalGetActive;
  assert.ok(queue.some(function(item) {
    return item && item.type === "lesson" && item.id === "gtr-d02";
  }), "Expected guitar day 2 after curriculum v2 day 1 is marked complete");
});

test("getLessonById resolves curriculum v2 lessons when legacy registry is empty", function() {
  var originalGetActive = SparkInstruments.getActive;
  SparkInstruments.getActive = function() {
    return {
      appId: "chordspark",
      instrument: "guitar",
      getCurriculumMap: function() { return []; },
      getCurriculumMapV2: function() {
        return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
      }
    };
  };

  var lesson = SparkCurriculumService.getLessonById("gtr-d01");

  SparkInstruments.getActive = originalGetActive;
  assert.ok(lesson, "Expected curriculum v2 lesson lookup to resolve");
  assert.strictEqual(lesson.id, "gtr-d01");
  assert.strictEqual(lesson.num, 1);
});

test("SparkCurriculumBridge.getNextLesson respects curriculum v2 completion state", function() {
  S.curriculumV2CompletedSessions.guitar = ["gtr-d01"];

  var nextLessonId = SparkCurriculumBridge.getNextLesson({
    instrument: "guitar",
    curriculumMap: SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar")
  });

  assert.strictEqual(nextLessonId, "gtr-d02");
});

test("SparkCurriculumService.isLessonUnlocked respects curriculum v2 prerequisites", function() {
  var originalGetActive = SparkInstruments.getActive;
  SparkInstruments.getActive = function() {
    return {
      appId: "chordspark",
      instrument: "guitar",
      getCurriculumMap: function() { return []; },
      getCurriculumMapV2: function() {
        return SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
      }
    };
  };

  assert.strictEqual(SparkCurriculumService.isLessonUnlocked("gtr-d02"), false);
  S.curriculumV2CompletedSessions.guitar = ["gtr-d01"];
  assert.strictEqual(SparkCurriculumService.isLessonUnlocked("gtr-d02"), true);

  SparkInstruments.getActive = originalGetActive;
});

if (process.exitCode) process.exit(process.exitCode);
