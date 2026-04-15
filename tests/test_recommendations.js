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
  global.toasts = [];
  global.S = {
    completedLessons: ["bass_level_1", "bass_level_2", "bass_level_3"],
    mastery: { lessons: {} },
    performanceStats: {},
    practiceHistory: [],
    dailyChallenges: [],
    recommendationHistory: [],
    recommendationSettings: { maxSuggestions: 5 },
    playAlongRecent: [{
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      transportMode: "generated",
      params: { trackId: "demo_song_1", title: "Sunrise Drive" }
    }],
    playAlongBookmarks: [{
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      sectionIndex: 1,
      sectionLabel: "Chorus",
      startMs: 6000,
      params: { trackId: "demo_song_1", title: "Sunrise Drive" }
    }],
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
  global.showToast = function(msg) { toasts.push(msg); };
  global.window.sparkCore = {
    getCompletedLessonIds: function() {
      return ["bass_level_1", "bass_level_2", "bass_level_3"];
    },
    getPlayAlongDashboardView: function() {
      return {
        recent: S.playAlongRecent.slice(),
        bookmarks: S.playAlongBookmarks.slice(),
        outcome: {
          performance: {
            weakAreas: ["lane_2", "late"]
          },
          sectionSummary: {
            sectionIndex: 1,
            sectionLabel: "Chorus"
          }
        },
        transportMode: "generated",
        weakAreas: ["lane_2", "late"],
        hasDrill: false,
        weakSection: {
          sectionIndex: 1,
          sectionLabel: "Chorus"
        }
      };
    }
  };
  global.__sparkState = global.S;
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
eval(loadJS("js/recommend/ui.js"));

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

test("collectRecommendationCandidates includes play-along weak-section and bookmark candidates", function() {
  var candidates = collectRecommendationCandidates("guitar");
  var weakSection = null;
  var bookmark = null;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "play_along") weakSection = candidates[i];
    if (candidates[i].source === "play_along_bookmark") bookmark = candidates[i];
  }

  assert.ok(weakSection);
  assert.strictEqual(weakSection.meta.sectionLabel, "Chorus");
  assert.strictEqual(weakSection.meta.trackTitle, "Sunrise Drive");
  assert.deepStrictEqual(weakSection.meta.weakAreas, ["lane_2", "late"]);
  assert.ok(bookmark);
  assert.strictEqual(bookmark.meta.sectionLabel, "Chorus");
});

test("curriculum recommendation can read completed lessons from sparkCore", function() {
  S.completedLessons = [];
  global.getCurriculumItem = function(kind, lessonId) {
    if (kind === "lessons" && lessonId === "bass_level_4") {
      return { id: "bass_level_4", title: "Walking Lines", level: 4 };
    }
    return null;
  };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    if (rootLessonId !== "curriculum_chordspark_main") return null;
    return completedLessonIds.indexOf("bass_level_4") === -1 ? "bass_level_4" : null;
  };

  var candidates = collectRecommendationCandidates("guitar");
  var curriculum = null;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "curriculum") {
      curriculum = candidates[i];
      break;
    }
  }

  assert.ok(curriculum);
  assert.strictEqual(curriculum.id, "bass_level_4");
});

test("generateRecommendations prioritizes play-along recovery and module-progress ahead of generic challenges", function() {
  S.dailyChallenges = [{ id: "daily_walk", type: "practice", completed: false }];

  var recommendations = generateRecommendations("guitar");

  assert.ok(recommendations.length >= 2);
  assert.strictEqual(recommendations[0].source, "play_along");
  assert.strictEqual(recommendations[0].meta.sectionLabel, "Chorus");
  assert.strictEqual(recommendations[1].source, "module_progress");
  assert.strictEqual(recommendations[1].meta.exerciseId, "bass_turnaround_01");
  assert.strictEqual(S.recommendations[0].source, "play_along");
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

test("recommendationsPage renders play-along section recommendation details", function() {
  global.escHTML = function(value) { return String(value); };
  S.recommendations = [{
    id: "playalong_weak_section_demo_song_1_1",
    type: "play_along_section",
    title: "Play Along: Fix Chorus",
    source: "play_along",
    reasons: ["Recent play-along weak section needs another pass"],
    meta: {
      trackTitle: "Sunrise Drive",
      sectionLabel: "Chorus",
      weakAreas: ["lane_2", "late"]
    }
  }];

  var html = recommendationsPage();

  assert.ok(html.indexOf("Song: Sunrise Drive") >= 0);
  assert.ok(html.indexOf("Section: Chorus") >= 0);
  assert.ok(html.indexOf("Weak: lane_2 | late") >= 0);
});

test("launchRecommendationById routes play-along recommendation through section jump helper", function() {
  var called = null;
  global.sparkPlayAlongJumpToSectionRecommendation = function(trackId, sectionIndex) {
    called = { trackId: trackId, sectionIndex: sectionIndex };
    return true;
  };
  S.recommendations = [{
    id: "playalong_weak_section_demo_song_1_1",
    type: "play_along_section",
    source: "play_along",
    meta: {
      trackId: "demo_song_1",
      sectionIndex: 1
    }
  }];

  launchRecommendationById("playalong_weak_section_demo_song_1_1");

  assert.deepStrictEqual(called, { trackId: "demo_song_1", sectionIndex: 1 });
});

test("launchRecommendationById falls back to a drill launch for generic drill recommendations", function() {
  var actions = [];
  global.act = function(action, value) {
    actions.push({ action: action, value: value });
  };
  global.launchPracticeItem = function() {
    return false;
  };
  S.recommendations = [{
    id: "unlock_transitions_push",
    type: "drill",
    source: "unlock",
    meta: {}
  }];

  launchRecommendationById("unlock_transitions_push");

  assert.deepStrictEqual(actions, [{ action: "startDrill", value: undefined }]);
});

test("launchRecommendationById routes generic drill recommendations into piano drill flow", function() {
  var actions = [];
  global.act = function(action, value) {
    actions.push({ action: action, value: value });
  };
  global.launchPracticeItem = function() {
    return false;
  };
  S.activeInstrument = "pianospark";
  S.recommendations = [{
    id: "unlock_transitions_push",
    type: "drill",
    source: "unlock",
    meta: {}
  }];

  launchRecommendationById("unlock_transitions_push");

  assert.deepStrictEqual(actions, [
    { action: "goHome", value: undefined },
    { action: "tab", value: "games" },
    { action: "start_drill", value: "level" }
  ]);
});

test("launchRecommendationById can open the challenge hub for challenge recommendations", function() {
  var actions = [];
  global.act = function(action, value) {
    actions.push({ action: action, value: value });
  };
  global.launchPracticeItem = function() {
    return false;
  };
  S.recommendations = [{
    id: "challenge_daily_walk",
    type: "challenge",
    source: "challenge",
    meta: { challengeId: "daily_walk" }
  }];

  launchRecommendationById("challenge_daily_walk");

  assert.deepStrictEqual(actions, [{ action: "openChallengeHub", value: undefined }]);
});

test("launchRecommendationById surfaces feedback when a recommendation cannot be launched", function() {
  global.launchPracticeItem = function() {
    return false;
  };
  S.recommendations = [{
    id: "mystery_unlaunchable",
    type: "mystery",
    source: "unlock",
    meta: {}
  }];

  launchRecommendationById("mystery_unlaunchable");

  assert.deepStrictEqual(toasts, ["That recommendation couldn't be opened right now."]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
