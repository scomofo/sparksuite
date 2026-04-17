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
  global.sparkCore = null;
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
        id: "ukespark",
        appId: "ukespark",
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
    },
    getAll: function() {
      return [this.getActive()];
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
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "ukulele") {
      return [{ id: "song_a", title: "Song A", instrument: "ukulele" }];
    }
    return [];
  };
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

test("selectWeakPerformanceCandidate ignores known buckets from another instrument", function() {
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "piano") {
      return [{ id: "piano_daydreams", title: "Piano Daydreams", instrument: "piano" }];
    }
    if (options.instrument === "ukulele") {
      return [{ id: "ukulele_island_package", title: "Ukulele Island Package", instrument: "ukulele" }];
    }
    return [];
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Piano",
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        getCurriculumMap: function() {
          return [];
        },
        getExercises: function() {
          return [];
        },
        getSongs: function() {
          return [
            { title: "Piano Daydreams" },
            { title: "Mystery Piece" }
          ];
        }
      };
    },
    getAll: function() {
      return [
        this.getActive(),
        {
          name: "Ukulele",
          id: "ukespark",
          appId: "ukespark",
          instrument: "ukulele",
          getSongs: function() {
            return [{ title: "Ukulele Island Package" }];
          }
        }
      ];
    }
  };
  S.performanceStats = {
    ukulele_island_package_imported_chart_normal: {
      songId: "ukulele_island_package",
      arrangement: "imported_chart",
      difficulty: "normal",
      bestAccuracy: 22,
      runs: 4
    },
    piano_daydreams_block_chords_normal: {
      songId: "piano_daydreams",
      arrangement: "block_chords",
      difficulty: "normal",
      bestAccuracy: 68,
      runs: 3
    }
  };

  var candidate = selectWeakPerformanceCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.songId, "piano_daydreams");
  assert.strictEqual(candidate.label.indexOf("ukulele island package"), -1);
});

test("selectWeakPerformanceCandidate ignores arrangement types from another instrument when the song id is ambiguous", function() {
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Piano",
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        getCurriculumMap: function() {
          return [];
        },
        getExercises: function() {
          return [];
        },
        getSongs: function() {
          return [
            { title: "Piano Daydreams" },
            { title: "Mystery Piece" }
          ];
        }
      };
    },
    getAll: function() {
      return [this.getActive()];
    }
  };
  S.performanceStats = {
    imported_pkg_normal: {
      songId: "imported_pkg",
      arrangement: "ukulele_strum",
      difficulty: "normal",
      bestAccuracy: 0,
      runs: 1
    },
    piano_daydreams_block_chords_normal: {
      songId: "piano_daydreams",
      arrangement: "block_chords",
      difficulty: "normal",
      bestAccuracy: 64,
      runs: 2
    }
  };

  var candidate = selectWeakPerformanceCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.songId, "piano_daydreams");
  assert.strictEqual(candidate.meta.arrangementType, "block_chords");
});

test("selectWeakPerformanceCandidate matches app-scoped buckets when the active instrument only exposes id", function() {
  global.getPerformanceChartLibrary = function() {
    return [];
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Piano",
        id: "pianospark",
        instrument: "piano",
        getCurriculumMap: function() {
          return [];
        },
        getExercises: function() {
          return [];
        },
        getSongs: function() {
          return [
            { title: "Piano Daydreams" },
            { title: "Mystery Piece" }
          ];
        }
      };
    },
    getAll: function() {
      return [this.getActive()];
    }
  };
  S.performanceStats = {
    mystery_piece_imported_chart_normal: {
      songId: "mystery_piece",
      arrangement: "imported_chart",
      difficulty: "normal",
      bestAccuracy: 41,
      runs: 2,
      appId: "pianospark"
    }
  };

  var candidate = selectWeakPerformanceCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.songId, "mystery_piece");
});

test("selectWeakPerformanceCandidate ignores unknown generic legacy guitar song buckets while piano is active", function() {
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Piano",
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        getCurriculumMap: function() {
          return [];
        },
        getExercises: function() {
          return [];
        },
        getSongs: function() {
          return [
            { title: "Happy Birthday" },
            { title: "Piano Daydreams" }
          ];
        }
      };
    },
    getAll: function() {
      return [this.getActive()];
    }
  };
  S.performanceStats = {
    the_beat_goes_on_perf_chords_normal: {
      songId: "the_beat_goes_on_perf",
      arrangement: "chords",
      difficulty: "normal",
      bestAccuracy: 0,
      runs: 0
    },
    happy_birthday_block_chords_normal: {
      songId: "happy_birthday",
      arrangement: "block_chords",
      difficulty: "normal",
      bestAccuracy: 72,
      runs: 3
    }
  };

  var candidate = selectWeakPerformanceCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.songId, "happy_birthday");
  assert.strictEqual(candidate.meta.arrangementType, "block_chords");
});

test("selectWeakPerformanceCandidate resolves legacy perf song ids through the active instrument song list", function() {
  global.SparkInstruments = {
    getActive: function() {
      return {
        name: "Guitar",
        id: "chordspark",
        appId: "chordspark",
        instrument: "guitar",
        getCurriculumMap: function() {
          return [];
        },
        getExercises: function() {
          return [];
        },
        getSongs: function() {
          return [{ title: "The Beat Goes On" }];
        }
      };
    },
    getAll: function() {
      return [this.getActive()];
    }
  };
  S.performanceStats = {
    the_beat_goes_on_perf_chords_normal: {
      songId: "the_beat_goes_on_perf",
      arrangement: "chords",
      difficulty: "normal",
      bestAccuracy: 54,
      runs: 2
    }
  };

  var candidate = selectWeakPerformanceCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.songId, "the_beat_goes_on");
  assert.strictEqual(candidate.label, "Replay The Beat Goes On");
});

test("selectImportedTechniqueCandidate creates a focused imported-technique practice candidate", function() {
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "ukulele") {
      return [{ id: "song_b", title: "Song B", instrument: "ukulele" }];
    }
    return [];
  };
  S.performanceStats = {
    song_b_imported_chart_hard: {
      songId: "song_b",
      arrangement: "imported_chart",
      difficulty: "hard",
      bestAccuracy: 79,
      runs: 2,
      importedTechniqueTotals: {
        tap: { total: 8, hits: 3, misses: 5 },
        open: { total: 4, hits: 3, misses: 1 }
      }
    }
  };

  var candidate = selectImportedTechniqueCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.type, "performance_technique");
  assert.strictEqual(candidate.meta.songId, "song_b");
  assert.strictEqual(candidate.meta.techniqueKey, "tap");
  assert.strictEqual(candidate.meta.techniqueAccuracy, 38);
  assert.ok(candidate.label.indexOf("tap-note") >= 0);
});

test("selectImportedTechniqueCandidate continues the current focused technique block when still weak", function() {
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "ukulele") {
      return [{ id: "song_focus", title: "Song Focus", instrument: "ukulele" }];
    }
    return [];
  };
  S.performanceStats = {
    song_focus_imported_chart_hard: {
      songId: "song_focus",
      arrangement: "imported_chart",
      difficulty: "hard",
      bestAccuracy: 84,
      runs: 4,
      lastFocusedTechnique: "open",
      importedTechniqueTotals: {
        tap: { total: 10, hits: 2, misses: 8 },
        open: { total: 6, hits: 4, misses: 2 }
      }
    }
  };

  var candidate = selectImportedTechniqueCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.techniqueKey, "open");
  assert.strictEqual(candidate.meta.continuedFocus, true);
  assert.ok(candidate.label.indexOf("Stay on") >= 0);
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

test("selectInstrumentModuleCandidate rehydrates thin active instruments before reading module methods", function() {
  var registeredModule = SparkInstruments.getActive();
  global.SparkInstruments = {
    getActive: function() {
      return {
        appId: "ukespark",
        instrument: "ukulele"
      };
    },
    getAll: function() {
      return [registeredModule];
    }
  };

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.lessonId, "uke_01");
  assert.strictEqual(candidate.meta.exerciseId, "uke_down_strum_01");
});

test("buildPracticeCandidates includes the module-driven ukulele candidate", function() {
  var candidates = buildPracticeCandidates();

  assert.ok(candidates.length > 0);
  assert.strictEqual(candidates[0].id, "module_uke_01");
});

test("buildPracticeCandidates includes imported-technique focus when imported chart weakness is present", function() {
  global.getPerformanceChartLibrary = function(options) {
    options = options || {};
    if (options.instrument === "ukulele") {
      return [{ id: "imported_song", title: "Imported Song", instrument: "ukulele" }];
    }
    return [];
  };
  S.performanceStats = {
    imported_song_imported_chart_normal: {
      songId: "imported_song",
      arrangement: "imported_chart",
      difficulty: "normal",
      bestAccuracy: 81,
      runs: 4,
      importedTechniqueTotals: {
        forced: { total: 10, hits: 5, misses: 5 }
      }
    }
  };

  var candidates = buildPracticeCandidates();
  var found = null;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].type === "performance_technique") {
      found = candidates[i];
      break;
    }
  }

  assert.ok(found);
  assert.strictEqual(found.meta.techniqueKey, "forced");
  assert.ok(found.reason.indexOf("50%") >= 0);
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

test("selectInstrumentModuleCandidate can read ukulele progress from sparkCore view", function() {
  S.completedLessons = [];
  S.ukuleleSkillProgress = {};
  global.sparkCore = {
    getCompletedLessonIds: function() {
      return ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05"];
    },
    getInstrumentProgressView: function(instrumentId) {
      assert.strictEqual(instrumentId, "ukulele");
      return {
        instrument: "ukulele",
        completedLessonIds: ["uke_01", "uke_02", "uke_03", "uke_04", "uke_05"],
        masteryLessonIds: [],
        rhythmMastery: {},
        rhythmSkillIds: [],
        namedSkillProgress: {
          fingerpicking: {
            accuracy: 0.7,
            timing: 0.52,
            speed: 0.63,
            consistency: 0.66
          }
        },
        namedSkillIds: ["fingerpicking"]
      };
    }
  };

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.lessonId, "uke_06");
  assert.strictEqual(candidate.meta.skill, "fingerpicking");
  assert.ok(candidate.meta.progressSummary);
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

test("selectInstrumentModuleCandidate carries authored bass exercise details into recommendation metadata", function() {
  S.completedLessons = ["bass_level_1", "bass_level_2", "bass_level_3"];
  S.bassSkillProgress = {
    walking_bass: {
      groove: 0.74,
      timing: 0.66,
      accuracy: 0.7,
      movement: 0.58
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
          { id: "bass_level_3", title: "Movement", skill: "root_fifth" },
          { id: "bass_level_4", title: "Walking Lines", skill: "walking_bass" }
        ];
      },
      getExercises: function(skill) {
        if (skill === "walking_bass") {
          return [{ id: "bass_walk_lines_01", name: "Walk Lines 01", focus: "walking_bass", type: "bassline" }];
        }
        return [{ id: "B-GROOVE", type: "groove" }];
      },
      getPracticeRecommendation: function(lesson, exercise, state) {
        return {
          reason: "Bass movement is at 58%, so walking lines need steadier note flow and fretboard intent.",
          focusTag: lesson.skill === "walking_bass" ? "walking" : "bass",
          priorityBoost: lesson.skill === "walking_bass" ? 6 : 0,
          progressSummary: state.bassSkillProgress && state.bassSkillProgress.walking_bass
            ? { skill: "walking_bass", weakestMetric: "movement", movement: state.bassSkillProgress.walking_bass.movement }
            : null,
          labelSuffix: lesson.skill === "walking_bass" ? "Walking" : null
        };
      }
    };
  };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    var order = ["bass_level_1", "bass_level_2", "bass_level_3", "bass_level_4"];
    if (rootLessonId !== "bass_level_1") return null;
    for (var i = 0; i < order.length; i++) {
      if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
    }
    return null;
  };

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.lessonId, "bass_level_4");
  assert.strictEqual(candidate.meta.exerciseId, "bass_walk_lines_01");
  assert.strictEqual(candidate.meta.exerciseName, "Walk Lines 01");
  assert.strictEqual(candidate.meta.exerciseFocus, "walking_bass");
  assert.ok(candidate.label.indexOf("Walk Lines 01") >= 0);
});

test("selectInstrumentModuleCandidate lets bass choose a targeted authored exercise from skill progress", function() {
  S.completedLessons = ["bass_level_1", "bass_level_2", "bass_level_3"];
  S.bassSkillProgress = {
    walking_bass: {
      groove: 0.82,
      timing: 0.44,
      accuracy: 0.69,
      movement: 0.71
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
          reason: "Bass timing is at 44%, so the turnaround needs steadier placement.",
          focusTag: lesson.skill === "walking_bass" ? "walking" : "bass",
          priorityBoost: 6,
          progressSummary: state.bassSkillProgress && state.bassSkillProgress.walking_bass
            ? { skill: "walking_bass", weakestMetric: "timing", timing: state.bassSkillProgress.walking_bass.timing }
            : null,
          labelSuffix: "Walking"
        };
      }
    };
  };
  global.getNextLessonFromCurriculum = function(rootLessonId, completedLessonIds) {
    completedLessonIds = completedLessonIds || [];
    var order = ["bass_level_1", "bass_level_2", "bass_level_3", "bass_level_4"];
    if (rootLessonId !== "bass_level_1") return null;
    for (var i = 0; i < order.length; i++) {
      if (completedLessonIds.indexOf(order[i]) === -1) return order[i];
    }
    return null;
  };

  var candidate = selectInstrumentModuleCandidate();

  assert.ok(candidate);
  assert.strictEqual(candidate.meta.exerciseId, "bass_turnaround_01");
  assert.strictEqual(candidate.meta.exerciseName, "Turnaround Steps");
  assert.strictEqual(candidate.meta.exerciseFocus, "passing_notes");
  assert.ok(candidate.label.indexOf("Turnaround Steps") >= 0);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
