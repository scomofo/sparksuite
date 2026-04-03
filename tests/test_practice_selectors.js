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
    guidedSession: 1
  };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    var order = ["uke_01", "uke_02", "uke_03"];
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
            { id: "uke_03", title: "Smooth Changes", skill: "chord_switching" }
          ];
        },
        getExercises: function(skill) {
          var map = {
            down_strum: [{ id: "uke_down_strum_01", type: "strum" }],
            basic_chords: [{ id: "uke_basic_chords_c", type: "chord" }],
            chord_switching: [{ id: "uke_switch_c_am", type: "transition" }]
          };
          return map[skill] || [];
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
});

test("buildPracticeCandidates includes the module-driven ukulele candidate", function() {
  var candidates = buildPracticeCandidates();

  assert.ok(candidates.length > 0);
  assert.strictEqual(candidates[0].id, "module_uke_01");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
