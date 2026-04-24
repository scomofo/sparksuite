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
  global.escHTML = function(value) { return String(value); };
  global.S = {
    completedLessons: ["bass_level_1", "bass_level_2", "bass_level_3"],
    curriculumV2CompletedSessions: {},
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
  global.recordRecommendationUse = function(recommendation) {
    S.recommendationHistory.push(recommendation && recommendation.id ? recommendation.id : recommendation);
  };
  global.launchPracticeItem = function() {
    return true;
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
        id: "bassspark",
        appId: "bassspark",
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
    },
    getAll: function() {
      return [
        {
          id: "bassspark",
          appId: "bassspark",
          instrument: "bass"
        },
        {
          id: "ukespark",
          appId: "ukespark",
          instrument: "ukulele"
        }
      ];
    }
  };
  global.SparkCurriculumV2LegacyAdapter = {
    toLegacyLessons: function(instrumentType) {
      if (instrumentType === "ukulele") {
        return [
          { id: "uke-d01", title: "First strum", skill: "open_strum" },
          { id: "uke-d02", title: "Tuning the uke", skill: "tuning" }
        ];
      }
      return [];
    }
  };

  global.eval(loadJS("js/practice/selectors.js"));
  global.eval(loadJS("js/recommend/candidates.js"));
  global.eval(loadJS("js/recommend/rules.js"));
  global.eval(loadJS("js/recommend/scoring.js"));
  global.eval(loadJS("js/recommend/engine.js"));
  global.eval(loadJS("js/recommend/ui.js"));
}

resetState();

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

test("renderRecommendationModuleProgress ignores sentinel string focus tokens", function() {
  var html = renderRecommendationModuleProgress({
    source: "module_progress",
    meta: {
      recommendationFocus: "undefined",
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.48
      }
    }
  });

  assert.strictEqual(html.indexOf("Focus: undefined"), -1);
  assert.ok(html.indexOf("Weakest: timing 48%") >= 0);
});

test("generateRecommendations infers thin active instruments through the registry", function() {
  SparkInstruments.getActive = function() {
    return { appId: "ukespark" };
  };
  var requestedType = null;
  global.collectRecommendationCandidates = function(appType) {
    requestedType = appType;
    return [];
  };
  global.filterRecommendationCandidates = function(candidates) {
    return candidates;
  };
  global.balanceRecommendationSet = function(candidates) {
    return candidates;
  };

  generateRecommendations();
  assert.strictEqual(requestedType, "ukulele");
});

test("generateRecommendations falls back to APP_NAME for non-guitar app shells", function() {
  global.APP_NAME = "BassSpark";
  SparkInstruments.getActive = function() {
    return null;
  };
  var requestedType = null;
  global.collectRecommendationCandidates = function(appType) {
    requestedType = appType;
    return [];
  };
  global.filterRecommendationCandidates = function(candidates) {
    return candidates;
  };
  global.balanceRecommendationSet = function(candidates) {
    return candidates;
  };

  generateRecommendations();
  assert.strictEqual(requestedType, "bass");
});

test("collectRecommendationCandidates uses instrument curriculum maps when registry lessons are unavailable", function() {
  global.getNextLessonFromCurriculum = function() { return null; };
  global.getCurriculumItem = function() { return null; };
  S.completedLessons = [];
  S.curriculumV2CompletedSessions.bass = ["bass_level_1", "bass_level_2"];

  var candidates = collectRecommendationCandidates("bass");
  var curriculumCandidate = null;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "curriculum") {
      curriculumCandidate = candidates[i];
      break;
    }
  }

  assert.ok(curriculumCandidate);
  assert.strictEqual(curriculumCandidate.id, "bass_level_3");
  assert.strictEqual(curriculumCandidate.meta.lessonId, "bass_level_3");
});

test("collectRecommendationCandidates falls back to curriculum v2 by instrument type when the registry is thin", function() {
  SparkInstruments.getActive = function() {
    return { appId: "ukespark" };
  };
  SparkInstruments.getAll = function() {
    return [{ id: "ukespark", appId: "ukespark", instrument: "ukulele" }];
  };
  global.getCurriculumItem = function() { return null; };
  global.getNextLessonFromCurriculum = function() { return null; };
  S.completedLessons = [];
  S.curriculumV2CompletedSessions.ukulele = ["uke-d01"];

  var candidates = collectRecommendationCandidates("ukulele");
  var curriculumCandidate = null;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "curriculum") {
      curriculumCandidate = candidates[i];
      break;
    }
  }

  assert.ok(curriculumCandidate);
  assert.strictEqual(curriculumCandidate.id, "uke-d02");
  assert.strictEqual(curriculumCandidate.meta.lessonId, "uke-d02");
});

test("module-progress scoring increases when the weakest metric is lower", function() {
  var stronger = {
    id: "module_stronger",
    type: "bassline",
    source: "module_progress",
    meta: {
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.66
      }
    }
  };
  var weaker = {
    id: "module_weaker",
    type: "bassline",
    source: "module_progress",
    meta: {
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.32
      }
    }
  };

  scoreRecommendationCandidate(stronger);
  scoreRecommendationCandidate(weaker);

  assert.ok(weaker.score > stronger.score);
});

test("recommendationsPage renders module-progress focus and weakest metric details", function() {
  global.escHTML = function(value) { return String(value); };
  S.recommendations = [{
    id: "module_bass_level_4",
    type: "bassline",
    title: "Bass: Walking Lines - Walking (Turnaround Steps)",
    source: "module_progress",
    reasons: ["Bass timing is at 48%, so the turnaround needs steadier placement."],
    meta: {
      recommendationFocus: "walking",
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.48
      }
    }
  }];

  var html = recommendationsPage();

  assert.ok(html.indexOf("Focus: walking") >= 0);
  assert.ok(html.indexOf("Weakest: timing 48%") >= 0);
});

test("recommendation UI can resolve sparkCore from the global binding", function() {
  var launched = null;
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          dashboardRecommendations: [{
            id: "rec_core",
            type: "bassline",
            title: "Core Recommendation",
            source: "module_progress",
            reasons: ["Keep the groove steady."],
            meta: {
              recommendationFocus: "walking",
              progressSummary: {
                weakestMetric: "timing",
                timing: 0.48
              }
            }
          }]
        }
      };
    },
    launchDashboardRecommendation: function(id) {
      return {
        recommendation: {
          id: id,
          type: "bassline",
          title: "Core Recommendation",
          source: "module_progress",
          meta: {}
        }
      };
    }
  };
  global.launchPracticeItem = function(item) {
    launched = item;
    return true;
  };

  var html = recommendationsPage();
  launchRecommendationById("rec_core");

  assert.ok(html.indexOf("Core Recommendation") >= 0);
  assert.ok(html.indexOf("Focus: walking") >= 0);
  assert.ok(launched);
  assert.strictEqual(launched.id, "rec_core");
  assert.strictEqual(S.recommendationHistory.length, 1);
  assert.strictEqual(S.recommendationHistory[0].id, "rec_core");
  assert.strictEqual(S.recommendationHistory[0].type, "bassline");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
