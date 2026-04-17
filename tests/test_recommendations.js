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

test("collectRecommendationCandidates ignores play-along recents from other instruments", function() {
  S.playAlongRecent = [{
    trackId: "ukulele_island_package",
    title: "Ukulele Island Package",
    instrument: "ukulele",
    transportMode: "generated",
    params: { trackId: "ukulele_island_package", title: "Ukulele Island Package", instrument: "ukulele" }
  }];
  S.playAlongBookmarks = [{
    trackId: "ukulele_island_package",
    title: "Ukulele Island Package",
    instrument: "ukulele",
    sectionIndex: 1,
    sectionLabel: "Chorus",
    params: { trackId: "ukulele_island_package", title: "Ukulele Island Package", instrument: "ukulele" }
  }];
  global.window.sparkCore.getPlayAlongDashboardView = function() {
    return {
      recent: S.playAlongRecent.slice(),
      bookmarks: S.playAlongBookmarks.slice(),
      outcome: {
        performance: { weakAreas: ["lane_2"] },
        sectionSummary: { sectionIndex: 1, sectionLabel: "Chorus" }
      },
      transportMode: "generated",
      weakAreas: ["lane_2"],
      hasDrill: false,
      weakSection: { sectionIndex: 1, sectionLabel: "Chorus" }
    };
  };
  global.SparkInstruments.getActive = function() {
    return {
      id: "chordspark",
      appId: "chordspark",
      name: "Guitar",
      instrument: "guitar"
    };
  };

  var candidates = collectRecommendationCandidates("guitar");
  var i;
  for (i = 0; i < candidates.length; i++) {
    assert.notStrictEqual(candidates[i].source, "play_along");
    assert.notStrictEqual(candidates[i].source, "play_along_bookmark");
  }
});

test("recommendations page falls back to global S when SparkState.getRoot returns null", function() {
  var originalSparkState = global.SparkState;
  global.SparkState = { getRoot: function() { return null; } };
  global.escHTML = function(value) { return String(value); };
  S.recommendations = [{
    id: "fallback_rec",
    title: "Fallback Recommendation",
    type: "lesson",
    source: "curriculum",
    reasons: ["Plain global S still works"]
  }];

  var html = recommendationsPage();

  global.SparkState = originalSparkState;
  assert.ok(html.indexOf("Recommended Next") >= 0);
  assert.ok(html.indexOf("Fallback Recommendation") >= 0);
});

test("generateRecommendations infers piano from the active instrument before app name defaults", function() {
  var originalCollect = collectRecommendationCandidates;
  var originalFilter = filterRecommendationCandidates;
  var originalBalance = balanceRecommendationSet;
  var capturedAppType = null;
  global.APP_NAME = "SparkSuite";
  S.activeInstrument = "pianospark";
  global.SparkInstruments.getActive = function() {
    return {
      id: "pianospark",
      appId: "pianospark",
      instrument: "piano"
    };
  };
  collectRecommendationCandidates = function(appType) {
    capturedAppType = appType;
    return [];
  };
  filterRecommendationCandidates = function(candidates) {
    return candidates;
  };
  balanceRecommendationSet = function(candidates) {
    return candidates;
  };

  generateRecommendations();

  collectRecommendationCandidates = originalCollect;
  filterRecommendationCandidates = originalFilter;
  balanceRecommendationSet = originalBalance;
  assert.strictEqual(capturedAppType, "piano");
});

test("generateRecommendations infers bass from thin active instrument ids before app name defaults", function() {
  var originalCollect = collectRecommendationCandidates;
  var originalFilter = filterRecommendationCandidates;
  var originalBalance = balanceRecommendationSet;
  var capturedAppType = null;
  global.APP_NAME = "SparkSuite";
  S.activeInstrument = "bassspark";
  global.SparkInstruments.getActive = function() {
    return {
      id: "bassspark",
      appId: "bassspark"
    };
  };
  collectRecommendationCandidates = function(appType) {
    capturedAppType = appType;
    return [];
  };
  filterRecommendationCandidates = function(candidates) {
    return candidates;
  };
  balanceRecommendationSet = function(candidates) {
    return candidates;
  };

  generateRecommendations();

  collectRecommendationCandidates = originalCollect;
  filterRecommendationCandidates = originalFilter;
  balanceRecommendationSet = originalBalance;
  assert.strictEqual(capturedAppType, "bass");
});

test("generateRecommendations stores recommendation ownership from appId-only active instruments", function() {
  var originalCollect = collectRecommendationCandidates;
  var originalFilter = filterRecommendationCandidates;
  var originalBalance = balanceRecommendationSet;
  global.APP_NAME = "SparkSuite";
  S.activeInstrument = null;
  global.SparkInstruments.getActive = function() {
    return {
      appId: "ukespark"
    };
  };
  collectRecommendationCandidates = function() {
    return [];
  };
  filterRecommendationCandidates = function(candidates) {
    return candidates;
  };
  balanceRecommendationSet = function(candidates) {
    return candidates;
  };

  generateRecommendations();

  collectRecommendationCandidates = originalCollect;
  filterRecommendationCandidates = originalFilter;
  balanceRecommendationSet = originalBalance;
  assert.strictEqual(S.recommendationInstrumentId, "ukespark");
});

test("generateRecommendations infers ukulele from appId-only active instruments before app name defaults", function() {
  var originalCollect = collectRecommendationCandidates;
  var originalFilter = filterRecommendationCandidates;
  var originalBalance = balanceRecommendationSet;
  var capturedAppType = null;
  global.APP_NAME = "SparkSuite";
  S.activeInstrument = null;
  global.SparkInstruments.getActive = function() {
    return {
      appId: "ukespark"
    };
  };
  collectRecommendationCandidates = function(appType) {
    capturedAppType = appType;
    return [];
  };
  filterRecommendationCandidates = function(candidates) {
    return candidates;
  };
  balanceRecommendationSet = function(candidates) {
    return candidates;
  };

  generateRecommendations();

  collectRecommendationCandidates = originalCollect;
  filterRecommendationCandidates = originalFilter;
  balanceRecommendationSet = originalBalance;
  assert.strictEqual(capturedAppType, "ukulele");
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
    if (rootLessonId !== "bass_level_1") return null;
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

test("curriculum recommendation falls back to legacy curriculum roots when no active map exists", function() {
  global.SparkInstruments.getActive = function() {
    return {
      id: "pianospark",
      appId: "pianospark",
      instrument: "piano"
    };
  };
  global.getCurriculumItem = function(kind, lessonId) {
    if (kind === "lessons" && lessonId === "piano_intro_2") {
      return { id: "piano_intro_2", title: "Left Hand Steps", level: 2 };
    }
    return null;
  };
  global.getNextLessonFromCurriculum = function(rootLessonId) {
    if (rootLessonId !== "curriculum_pianospark_main") return null;
    return "piano_intro_2";
  };

  var candidates = collectRecommendationCandidates("piano");
  var curriculum = null;
  var i;
  for (i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "curriculum") {
      curriculum = candidates[i];
      break;
    }
  }

  assert.ok(curriculum);
  assert.strictEqual(curriculum.id, "piano_intro_2");
});

test("curriculum recommendation rehydrates thin active instruments before reading active maps", function() {
  global.SparkInstruments.getAll = function() {
    return [{
      id: "ukespark",
      appId: "ukespark",
      instrument: "ukulele",
      getCurriculumMap: function() {
        return [
          { id: "uke_01", title: "Island Basics" },
          { id: "uke_02", title: "Palm Muting" }
        ];
      }
    }];
  };
  global.SparkInstruments.getActive = function() {
    return {
      appId: "ukespark",
      instrument: "ukulele"
    };
  };
  global.getCurriculumItem = function(kind, lessonId) {
    if (kind === "lessons" && lessonId === "uke_02") {
      return { id: "uke_02", title: "Palm Muting", level: 2 };
    }
    return null;
  };
  global.getNextLessonFromCurriculum = function(rootLessonId) {
    if (rootLessonId !== "uke_01") return null;
    return "uke_02";
  };

  var candidates = collectRecommendationCandidates("ukulele");
  var curriculum = null;
  var i;
  for (i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "curriculum") {
      curriculum = candidates[i];
      break;
    }
  }

  assert.ok(curriculum);
  assert.strictEqual(curriculum.id, "uke_02");
});

test("curriculum recommendation falls back to ukulele lesson roots when the active map is unavailable", function() {
  global.SparkInstruments.getActive = function() {
    return {
      id: "ukespark",
      appId: "ukespark",
      instrument: "ukulele"
    };
  };
  global.getCurriculumItem = function(kind, lessonId) {
    if (kind === "lessons" && lessonId === "uke_02") {
      return { id: "uke_02", title: "Starter Chords", level: 2 };
    }
    return null;
  };
  global.getNextLessonFromCurriculum = function(rootLessonId) {
    if (rootLessonId !== "uke_01") return null;
    return "uke_02";
  };

  var candidates = collectRecommendationCandidates("ukulele");
  var curriculum = null;
  var i;
  for (i = 0; i < candidates.length; i++) {
    if (candidates[i].source === "curriculum") {
      curriculum = candidates[i];
      break;
    }
  }

  assert.ok(curriculum);
  assert.strictEqual(curriculum.id, "uke_02");
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

test("recommendation engine helpers fall back to global S when SparkState.getRoot returns null", function() {
  global.SparkState = { getRoot: function() { return null; } };

  var recommendations = generateRecommendations("guitar");
  var scored = scoreRecommendationCandidate({
    id: "module_progress_test",
    source: "module_progress",
    type: "bassline",
    meta: {
      progressSummary: {
        weakestMetric: "timing",
        timing: 0.48
      }
    },
    reasons: ["Recover weak timing"]
  });

  assert.ok(recommendations.length > 0);
  assert.ok(scored.score > 0);
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

test("recommendationsPage renders an empty state without generating during render", function() {
  global.escHTML = function(value) { return String(value); };
  var generateCalls = 0;
  global.generateRecommendations = function() {
    generateCalls++;
    return [];
  };
  S.recommendations = [];

  var html = recommendationsPage();

  assert.strictEqual(generateCalls, 0);
  assert.ok(html.indexOf("No recommendations are ready right now.") >= 0);
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

test("launchRecommendationById executes core-owned recommendation launch requests before UI fallbacks", function() {
  var actions = [];
  global.act = function(action, value) {
    actions.push({ action: action, value: value });
  };
  global.window.sparkCore.launchDashboardRecommendation = function(id) {
    return {
      recommendationId: id,
      recommendation: {
        id: id,
        type: "lesson",
        source: "curriculum",
        meta: { lessonId: "guided_session_4" }
      },
      launch: {
        action: "guidedStart",
        value: 4
      }
    };
  };

  launchRecommendationById("guided_session_4");

  assert.deepStrictEqual(actions, [{ action: "guidedStart", value: 4 }]);
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

test("launchRecommendationById routes lesson recommendations to the intended guided session", function() {
  var actions = [];
  global.act = function(action, value) {
    actions.push({ action: action, value: value });
  };
  global.window.sparkCore.launchDashboardRecommendation = function(id) {
    return {
      recommendationId: id,
      recommendation: {
        id: id,
        type: "lesson",
        source: "curriculum",
        meta: { lessonId: "guided_session_4" }
      },
      launch: {
        action: "guidedStart",
        value: 4
      }
    };
  };

  launchRecommendationById("guided_session_4");

  assert.deepStrictEqual(actions, [{ action: "guidedStart", value: 4 }]);
});

test("launchRecommendationById routes module curriculum lessons into explicit module exercise launches", function() {
  var actions = [];
  global.act = function(action, value) {
    actions.push({ action: action, value: value });
  };
  global.window.sparkCore.launchDashboardRecommendation = function(id) {
    return {
      recommendationId: id,
      recommendation: {
        id: id,
        type: "lesson",
        source: "curriculum",
        title: "Walking Lines",
        meta: { lessonId: "bass_level_4" }
      },
      launch: {
        action: "planStartModuleExercise",
        value: JSON.stringify({
          instrument: "bass",
          lessonId: "bass_level_4",
          skill: "walking_bass",
          exerciseId: "bass_walk_lines_01",
          exerciseName: "Walk Lines 01",
          exerciseFocus: "walking_bass",
          exerciseType: "bassline"
        })
      }
    };
  };

  launchRecommendationById("bass_level_4");

  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].action, "planStartModuleExercise");
  assert.deepStrictEqual(JSON.parse(actions[0].value), {
    instrument: "bass",
    lessonId: "bass_level_4",
    skill: "walking_bass",
    exerciseId: "bass_walk_lines_01",
    exerciseName: "Walk Lines 01",
    exerciseFocus: "walking_bass",
    exerciseType: "bassline"
  });
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
