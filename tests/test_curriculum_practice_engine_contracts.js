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
  global.SparkSessionSegmentTypes = {
    RHYTHM_HIGHWAY: "rhythm_highway",
    TRANSITION: "transition",
    CHALLENGE: "challenge",
    PERFORMANCE_SONG: "song",
    normalize: function(type) { return type || "practice"; }
  };
  global.SparkSessionSegment = {
    create: function(input) {
      return {
        id: input.id,
        type: input.type,
        label: input.label,
        desc: input.desc,
        durationSec: input.durationSec,
        completed: !!input.completed,
        meta: input.meta || {}
      };
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
      return [
        {
          id: "seg_island",
          type: "practice",
          label: "Island timing",
          desc: "Tighten the island groove",
          durationSec: 120,
          meta: { skill: "strumming_patterns" }
        },
        {
          id: "seg_song",
          type: "practice",
          label: "Song loop",
          desc: "Keep the progression moving",
          durationSec: 180,
          meta: { skill: "strumming_patterns" }
        }
      ];
    }
  };
}

resetState();
loadJS("js/sparksuite/core/curriculum_engine.js");
loadJS("js/sparksuite/core/practice_engine.js");

var curriculumEngine = new SparkSuiteCurriculumEngine();
var practiceEngine = new SparkSuitePracticeEngine({
  getFocusLabel: function(segments) {
    return segments && segments.length ? "Focused practice" : "No focus";
  }
});

// Curriculum contract: due review wins over incomplete future lessons.
S.mastery.lessons = {
  uke_01: { mastery: 1, nextReviewAt: "2000-01-01T00:00:00.000Z" }
};
SparkCurriculumService.getReviewTargets = function() {
  return [{ type: "chord", id: "C", mastery: 50, priority: "medium" }];
};
SparkCurriculumService.buildLearningQueue = function() {
  return [{ type: "review", id: "uke_01" }];
};
SparkCurriculumService.getLessonById = function(id) {
  if (id === "uke_01") return { id: "uke_01", skill: "down_strum", prerequisites: [], masteryRequired: 1 };
  if (id === "uke_02") return { id: "uke_02", skill: "basic_chords", prerequisites: ["uke_01"], masteryRequired: 1 };
  return null;
};

var curriculumContext = curriculumEngine.getDailyPracticeContext({
  instrumentType: "ukulele",
  adapter: {
    getLessons: function() {
      return [
        { id: "uke_01", skill: "down_strum", prerequisites: [], masteryRequired: 1 },
        { id: "uke_02", skill: "basic_chords", prerequisites: ["uke_01"], masteryRequired: 1 }
      ];
    }
  },
  curriculumMap: [
    { id: "uke_01", title: "Down Strum" },
    { id: "uke_02", title: "Basic Chords" }
  ]
});

assert.strictEqual(curriculumContext.nextLessonId, "uke_01");
assert.strictEqual(curriculumContext.nextLesson.id, "uke_01");
assert.strictEqual(curriculumContext.reviewTargets.length, 1);
assert.strictEqual(curriculumContext.learningQueue.length, 1);

// Practice contract: bridge segments normalize into exercise-backed session items.
var practicePlan = practiceEngine.buildDailyPracticePlan({
  difficulty: "easy",
  curriculum: {
    nextLessonId: "uke_04",
    nextLesson: { id: "uke_04", title: "Island Pattern", skill: "strumming_patterns" }
  },
  instrumentContext: {
    instrumentType: "ukulele",
    adapter: {
      getExercises: function(skill) {
        assert.strictEqual(skill, "strumming_patterns");
        return [
          { id: "uke_pattern_island", type: "strum_pattern", pattern: "D DU UDU", tempo: 76, durationSec: 120, name: "Island Pattern" },
          { id: "uke_song_loop_01", type: "song_loop", progression: ["C", "Am", "F", "G"], tempo: 78, durationSec: 180, name: "Island Song Loop" }
        ];
      }
    }
  }
});

assert.strictEqual(practicePlan.segments.length, 2);
assert.strictEqual(practicePlan.exercises.length, 2);
assert.deepStrictEqual(practicePlan.segments[0].exerciseIds, ["uke_pattern_island"]);
assert.deepStrictEqual(practicePlan.segments[1].exerciseIds, ["uke_song_loop_01"]);
assert.strictEqual(practicePlan.exercises[0].type, "strum_pattern");
assert.strictEqual(practicePlan.exercises[1].type, "song_loop");
assert.strictEqual(practicePlan.exercises[0].data.core.skill, "strumming_patterns");
assert.strictEqual(practicePlan.exercises[0].data.core.lessonId, "uke_04");
assert.strictEqual(practicePlan.exercises[0].data.presentation.label, "Island timing");
assert.strictEqual(practicePlan.rewards[0].amount, 40);

console.log("PASS: curriculum and practice engines expose richer mainline contracts");
