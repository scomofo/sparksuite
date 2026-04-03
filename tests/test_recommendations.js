var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.APP_NAME = "ChordSpark";
  global.S = {
    completedLessons: ["bass_level_1", "bass_level_2", "bass_level_3"],
    mastery: { lessons: {} },
    performanceStats: {},
    practiceHistory: [],
    dailyChallenges: [],
    recommendationHistory: [],
    recommendationSettings: { maxSuggestions: 5 },
    bassSkillProgress: {
      walking_bass: {
        groove: 0.79,
        timing: 0.48,
        accuracy: 0.72,
        movement: 0.53
      }
    }
  };
  global.saveState = function() {};
  global.getAverageMastery = function() { return 1; };
  global.getTopWeakSpots = function() { return null; };
  global.getCurriculumItem = function() { return null; };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    var order = ["bass_level_1", "bass_level_2", "bass_level_3", "bass_level_4"];
    if (rootLessonId !== "bass_level_1") return null;
    for (var i = 0; i < order.length; i++) {
      if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
    }
    return null;
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Bass",
        instrument: "bass",
        getCurriculumMap: function() {
          return [
            { id: "bass_level_1", title: "First Groove", skill: "posture" },
            { id: "bass_level_2", title: "Finding Notes", skill: "root_notes" },
            { id: "bass_level_3", title: "Movement", skill: "root_fifth" },
            { id: "bass_level_4", title: "Walking Lines", skill: "walking_bass" }
          ];
        },
        getExercises: function(skill) {
          if (skill === "walking_bass") {
            return [
              { id: "bass_walk_lines_01", name: "Walk Lines 01", focus: "walking_bass", type: "bassline" },
              { id: "bass_turnaround_01", name: "Turnaround Steps", focus: "passing_notes", type: "bassline" }
            ];
          }
          return [{ id: "B-GROOVE", type: "groove" }];
        },
        pickPracticeExercise: function(lesson, exercises, state) {
          if (lesson.skill === "walking_bass" && state.bassSkillProgress.walking_bass.timing < 0.5) {
            return exercises[1];
          }
          return exercises[0];
        },
        getPracticeRecommendation: function(lesson, exercise, state) {
          return {
            reason: "Bass timing is at " + Math.round((state.bassSkillProgress.walking_bass.timing || 0) * 100) + "%, so the turnaround needs steadier placement.",
            focusTag: "walking",
            priorityBoost: 6,
            progressSummary: {
              skill: "walking_bass",
              weakestMetric: "timing",
              timing: state.bassSkillProgress.walking_bass.timing
            },
            labelSuffix: "Walking"
          };
        }
      };
    }
  };
}

resetState();
eval(loadJS("js/practice/selectors.js"));
eval(loadJS("js/recommend/candidates.js"));
eval(loadJS("js/recommend/rules.js"));
eval(loadJS("js/recommend/scoring.js"));
eval(loadJS("js/recommend/engine.js"));

console.log("\n--- Recommendations ---");

test("collectRecommendationCandidates includes module-progress recommendation candidates", function() {
  var candidates = collectRecommendationCandidates("guitar");
  var candidate = null;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "module_progress") {
      candidate = candidates[i];
      break;
    }
  }

  assert.ok(candidate);
  assert.strictEqual(candidate.type, "bassline");
  assert.strictEqual(candidate.title, "Bass: Walking Lines - Walking (Turnaround Steps)");
  assert.strictEqual(candidate.targetSkill, "walking_bass");
  assert.strictEqual(candidate.meta.exerciseId, "bass_turnaround_01");
  assert.strictEqual(candidate.meta.exerciseName, "Turnaround Steps");
  assert.strictEqual(candidate.meta.instrument, "bass");
  assert.ok(candidate.reasons[0].indexOf("48%") >= 0);
});

test("generateRecommendations prioritizes module-progress candidates ahead of generic challenges", function() {
  S.dailyChallenges = [{ id: "daily_walk", type: "practice", completed: false }];

  var recommendations = generateRecommendations("guitar");

  assert.ok(recommendations.length >= 2);
  assert.strictEqual(recommendations[0].source, "module_progress");
  assert.strictEqual(recommendations[0].meta.exerciseId, "bass_turnaround_01");
  assert.strictEqual(S.recommendations[0].source, "module_progress");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
