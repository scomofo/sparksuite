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
  global.S = {
    completedLessons: [],
    mastery: { lessons: {}, rhythm: {} },
    performanceStats: {},
    transitionStats: {},
    rhythmResults: null,
    fingerStats: {},
    guidedSession: 1,
    ukuleleSkillProgress: {}
  };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    var order = ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05", "uke_06", "uke_07", "uke_08"];
    if (rootLessonId !== "uke_01") return null;
    for (var i = 0; i < order.length; i++) {
      if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
    }
    return null;
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Ukulele",
        instrument: "ukulele",
        getCurriculumMap: function() {
          return [
            { id: "uke_01", title: "First Strum", skill: "down_strum" },
            { id: "uke_02", title: "Starter Chords", skill: "basic_chords" },
            { id: "uke_03", title: "Smooth Changes", skill: "chord_switching" },
            { id: "uke_04", title: "Pattern Flow", skill: "strumming_patterns" },
            { id: "uke_05", title: "Play a Song", skill: "songs" },
            { id: "uke_06", title: "Fingerpicked Motion", skill: "fingerpicking" },
            { id: "uke_07", title: "Melody Notes", skill: "melody" },
            { id: "uke_08", title: "Campfire Performance", skill: "performance" }
          ];
        },
        getExercises: function(skill) {
          var map = {
            down_strum: [{ id: "uke_down_strum_01", type: "strum" }],
            basic_chords: [{ id: "uke_basic_chords_c", type: "chord" }],
            chord_switching: [{ id: "uke_switch_c_am", type: "transition" }],
            strumming_patterns: [{ id: "uke_pattern_island", type: "strum_pattern" }],
            songs: [{ id: "uke_song_loop_01", type: "song_loop" }],
            fingerpicking: [{ id: "uke_pick_01", type: "fingerpick" }],
            melody: [{ id: "uke_melody_01", type: "melody_line" }],
            performance: [{ id: "uke_perform_01", type: "performance_run" }]
          };
          return map[skill] || [];
        },
        getPracticeRecommendation: function(lesson, exercise, state) {
          var hints = {
            down_strum: { reason: "Lock in steady down-strums before adding movement.", focusTag: "groove", priorityBoost: 0 },
            fingerpicking: { reason: "Develop independent finger motion with a steady arpeggio pulse.", focusTag: "fingerpicking", priorityBoost: 6 }
          };
          var hint = hints[lesson.skill] || { reason: "Continue ukulele progression.", focusTag: "ukulele", priorityBoost: 0 };
          var completedCount = Array.isArray(state.completedLessonIds) ? state.completedLessonIds.length : 0;
          var progressEntry = state.ukuleleSkillProgress && lesson.skill ? state.ukuleleSkillProgress[lesson.skill] : null;
          return {
            reason: progressEntry ? ("Ukulele timing is at " + Math.round((progressEntry.timing || 0) * 100) + "%, so " + hint.reason.toLowerCase()) : hint.reason,
            focusTag: hint.focusTag,
            priorityBoost: hint.priorityBoost + Math.min(4, Math.floor(completedCount / 2)),
            progressSummary: progressEntry ? { skill: lesson.skill, weakestMetric: "timing", timing: progressEntry.timing } : null
          };
        }
      };
    }
  };
}

resetState();
eval(loadJS("js/practice/selectors.js"));

console.log("\n--- Practice Selectors ---");

test("normalizePerformanceBuckets supports flat performance stats shape", function() {
  S.performanceStats = {
    song_a_imported_chart_normal: {
      songId: "song_a",
      arrangement: "imported_chart",
      difficulty: "normal",
      bestAccuracy: 72,
      runs: 3,
      phrases: { phrase_1: { avgAccuracy: 55 } }
    }
  };

  var buckets = normalizePerformanceBuckets(S.performanceStats);

  assert.strictEqual(buckets.length, 1);
  assert.strictEqual(buckets[0].songId, "song_a");
  assert.strictEqual(buckets[0].arrangementType, "imported_chart");
  assert.strictEqual(buckets[0].difficultyId, "normal");
});

test("selectWeakPerformanceCandidate uses imported technique weakness from flat stats", function() {
  S.performanceStats = {
    song_a_imported_chart_normal: {
      songId: "song_a",
      arrangement: "imported_chart",
      difficulty: "normal",
      bestAccuracy: 82,
      runs: 4,
      importedTechniqueTotals: {
        open: { total: 6, hits: 2, misses: 4 }
      }
    }
  };

  var candidate = selectWeakPerformanceCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.type, "performance_song");
  assert.strictEqual(candidate.meta.songId, "song_a");
  assert.strictEqual(candidate.meta.techniqueKey, "open");
  assert.ok(candidate.reason.indexOf("open-note") >= 0);
});

test("selectInstrumentModuleCandidate returns the next ukulele lesson focus", function() {
  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.lessonId, "uke_01");
  assert.strictEqual(candidate.meta.skill, "down_strum");
  assert.strictEqual(candidate.meta.instrument, "ukulele");
  assert.strictEqual(candidate.meta.recommendationFocus, "groove");
  assert.ok(candidate.reason.indexOf("down-strums") >= 0);
});

test("buildPracticeCandidates includes the module-driven ukulele candidate", function() {
  var candidates = buildPracticeCandidates();

  assert.ok(candidates.length > 0);
  assert.strictEqual(candidates[0].id, "module_uke_01");
});

test("selectInstrumentModuleCandidate advances into deeper ukulele lessons after early completions", function() {
  S.completedLessons = ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05"];

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.lessonId, "uke_06");
  assert.strictEqual(candidate.meta.skill, "fingerpicking");
  assert.strictEqual(candidate.meta.exerciseId, "uke_pick_01");
  assert.strictEqual(candidate.meta.recommendationFocus, "fingerpicking");
  assert.ok(candidate.reason.indexOf("arpeggio") >= 0);
  assert.ok(candidate.priority > 96);
});

test("selectInstrumentModuleCandidate carries ukulele progress summary into recommendation metadata", function() {
  S.ukuleleSkillProgress.fingerpicking = {
    accuracy: 0.7,
    timing: 0.52,
    speed: 0.63,
    consistency: 0.66
  };
  S.completedLessons = ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05"];

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.skill, "fingerpicking");
  assert.ok(candidate.meta.progressSummary);
  assert.strictEqual(candidate.meta.progressSummary.skill, "fingerpicking");
  assert.strictEqual(candidate.meta.progressSummary.weakestMetric, "timing");
  assert.ok(candidate.reason.indexOf("timing is at 52%") >= 0);
});

test("selectInstrumentModuleCandidate supports bass module recommendation hints and progress summaries", function() {
  S.completedLessons = ["bass_level_1", "bass_level_2"];
  S.bassSkillProgress = {
    root_fifth: {
      groove: 0.62,
      timing: 0.7,
      accuracy: 0.68,
      movement: 0.51
    }
  };
  SparkInstruments.getActive = function() {
    return {
      name: "Bass",
      instrument: "bass",
      getCurriculumMap: function() {
        return [
          { id: "bass_level_1", title: "First Groove", skill: "posture" },
          { id: "bass_level_2", title: "Finding Notes", skill: "root_notes" },
          { id: "bass_level_3", title: "Movement", skill: "root_fifth" }
        ];
      },
      getExercises: function(skill) {
        var map = {
          posture: [{ id: "B-CHROM", type: "warmup" }],
          root_notes: [{ id: "B-GROOVE", type: "groove" }],
          root_fifth: [{ id: "B-OCTAVE", type: "groove" }]
        };
        return map[skill] || [];
      },
      getPracticeRecommendation: function(lesson, exercise, state) {
        var progressEntry = state.bassSkillProgress && lesson.skill ? state.bassSkillProgress[lesson.skill] : null;
        return {
          reason: progressEntry ? ("Bass movement is at " + Math.round((progressEntry.movement || 0) * 100) + "%, so root-fifth motion is the first real bassline building block.") : "Continue bass progression.",
          focusTag: lesson.skill === "root_fifth" ? "root_fifth" : "bass",
          priorityBoost: lesson.skill === "root_fifth" ? 5 : 0,
          progressSummary: progressEntry ? { skill: lesson.skill, weakestMetric: "movement", movement: progressEntry.movement } : null,
          labelSuffix: lesson.skill === "root_fifth" ? "Groove" : null
        };
      }
    };
  };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    var order = ["bass_level_1", "bass_level_2", "bass_level_3"];
    if (rootLessonId !== "bass_level_1") return null;
    for (var i = 0; i < order.length; i++) {
      if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
    }
    return null;
  };

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.lessonId, "bass_level_3");
  assert.strictEqual(candidate.meta.skill, "root_fifth");
  assert.strictEqual(candidate.meta.exerciseId, "B-OCTAVE");
  assert.strictEqual(candidate.meta.recommendationFocus, "root_fifth");
  assert.ok(candidate.meta.progressSummary);
  assert.strictEqual(candidate.meta.progressSummary.weakestMetric, "movement");
  assert.ok(candidate.label.indexOf("Groove") >= 0);
  assert.ok(candidate.reason.indexOf("movement is at 51%") >= 0);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
