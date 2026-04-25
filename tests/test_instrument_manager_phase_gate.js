var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function resetState() {
  global.window = global;
  global.S = {
    completedLessons: [],
    mastery: { lessons: {} },
    curriculumV2CompletedSessions: {}
  };
  global.SparkMastery = {
    category: function(name) {
      return (global.S.mastery && global.S.mastery[name]) || {};
    }
  };
  global.SparkCurriculumBridge = {
    getNextLesson: function() { return null; },
    isLessonUnlocked: function() { return true; }
  };
  global.SparkCurriculumService = {
    getReviewTargets: function() { return []; },
    buildLearningQueue: function() { return []; },
    getLessonById: function() { return null; }
  };
  global.SparkPracticeBridge = {
    buildDailyPracticeSegments: function() {
      return [];
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "canaryspark",
        appId: "canaryspark",
        instrument: "canary"
      };
    },
    getAll: function() {
      return [];
    }
  };
}

resetState();

loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");
loadJS("js/sparksuite/core/instrument_manager.js");
loadJS("js/sparksuite/core/curriculum_engine.js");
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/sparksuite/core/psychology_engine.js");
loadJS("js/sparksuite/core/session_engine.js");

var manager = new SparkInstrumentManager();
manager.register("canary", function() {
  return {
    getId: function() { return "canaryspark"; },
    getType: function() { return "canary"; },
    getCurriculumMap: function() {
      return [
        { id: "canary_01", title: "Canary First Sound", skill: "pulse_lock", prerequisites: [], masteryRequired: 1 }
      ];
    },
    getLessons: function() {
      return [
        { id: "canary_01", title: "Canary First Sound", skill: "pulse_lock", prerequisites: [], masteryRequired: 1 }
      ];
    },
    getExercises: function(skillId) {
      assert.strictEqual(skillId, "pulse_lock");
      return [
        { id: "canary_loop_01", type: "rhythm_highway", focus: "pulse_lock", durationSec: 90, name: "Pulse Lock Loop", pattern: "D D U U" },
        { id: "canary_song_01", type: "song_loop", focus: "pulse_lock", durationSec: 120, name: "Pulse Lock Song", progression: ["C", "G"] }
      ];
    },
    getTuning: function() {
      return ["C4", "G4"];
    },
    getCapabilities: function() {
      return {
        preferredRenderer: "string-lane-highway",
        inputModes: ["keyboard", "midi"]
      };
    }
  };
});

assert.deepStrictEqual(manager.listInstruments(), ["canary"]);

var instrumentContext = manager.getActiveContext();
assert.strictEqual(instrumentContext.instrumentType, "canary");
assert.ok(instrumentContext.adapter);
assert.strictEqual(instrumentContext.lessons[0].id, "canary_01");

var curriculumEngine = new SparkSuiteCurriculumEngine();
var psychologyEngine = new SparkSuitePsychologyEngine();
var practiceEngine = new SparkSuitePracticeEngine(psychologyEngine);
var sessionEngine = new SparkSuiteSessionEngine(practiceEngine, curriculumEngine);

var plan = sessionEngine.buildSession(SparkSessionTypes.FLOW_DAILY_PRACTICE, {
  instrumentContext: instrumentContext
});

assert.ok(plan instanceof SessionPlan);
assert.strictEqual(plan.instrumentType, "canary");
assert.strictEqual(plan.lesson.id, "canary_01");
assert.strictEqual(plan.exercises.length, 2);
assert.strictEqual(plan.exercises[0].id, "canary_loop_01");
assert.strictEqual(plan.exercises[1].id, "canary_song_01");
assert.deepStrictEqual(plan.segments[0].exerciseIds, ["canary_loop_01"]);
assert.deepStrictEqual(plan.segments[1].exerciseIds, ["canary_song_01"]);

console.log("PASS: InstrumentManager exposes registered instruments and a canary module works without core changes");
