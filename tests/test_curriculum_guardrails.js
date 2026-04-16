// tests/test_curriculum_guardrails.js
// Validates curriculum contract integrity across all instruments.
// Run: node tests/test_curriculum_guardrails.js
// See: docs/engineering/CURRICULUM_CONTRACT.md

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name); console.error("    " + e.message); }
}
// Minimal browser globals
global.window = global;
global.document = {
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  createElement: function() { return { getContext: function() { return {}; }, style: {} }; }
};
global.localStorage = (function() {
  var store = {};
  return {
    getItem: function(k) { return store[k] || null; },
    setItem: function(k, v) { store[k] = String(v); },
    removeItem: function(k) { delete store[k]; },
    clear: function() { store = {}; }
  };
})();
global.navigator = { userAgent: "node", requestMIDIAccess: null };
global.AudioContext = null;
global.webkitAudioContext = null;
global.Audio = function() { return { preload: "", play: function() { return Promise.resolve(); } }; };
global.performance = { now: function() { return Date.now(); } };
global.S = { completedLessons: [], mastery: { chords: {}, lessons: {}, rhythm: {} }, chordProgress: {}, playerLevel: 1 };
global.SparkHighway = { GUITAR_SKIN: { laneCount: 6, labels: ["E","A","D","G","B","e"] }, PIANO_SKIN: { laneCount: 24 } };
global.escHTML = function(s) { return String(s); };
global.SparkProfile = {
  createEmpty: function() { return { schemaVersion: 1, suite: "spark", userId: "local-user", apps: {}, suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} } }; },
  ensureApp: function(p, id, inst) { p.apps = p.apps || {}; if (!p.apps[id]) p.apps[id] = { instrument: inst, stats: { level: 1, xp: 0, streakDays: 0 } }; }
};
global.SparkStorage = { load: function() { return SparkProfile.createEmpty(); } };
global.buildSkillTree = function() { return { branches: [] }; };

function loadJS(file) {
  var full = path.join(__dirname, "..", file);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

function safeEval(file) {
  var code = loadJS(file);
  if (!code) return false;
  try { eval(code); return true; }
  catch (e) { console.error("  WARN: could not eval " + file + ": " + e.message); return false; }
}

// Load data files
safeEval("js/launcher.js");
safeEval("js/data.js");
safeEval("js/instruments/piano/data.js");
safeEval("js/instruments/bass/data.js");
safeEval("js/sparksuite/instruments/ukulele/ukulele_lessons.js");
safeEval("js/sparksuite/instruments/ukulele/ukulele_skill_tree.js");

// Load instrument registrations
safeEval("js/instruments/guitar/register.js");
safeEval("js/instruments/piano/register.js");
safeEval("js/instruments/bass/register.js");
safeEval("js/instruments/ukulele/register.js");

// Load curriculum engine
safeEval("js/curriculum/curriculum_registry.js");
safeEval("js/curriculum/curriculum_engine.js");
console.log("");
console.log("--- Curriculum Guardrails ---");
console.log("");

var instruments = typeof SparkInstruments !== "undefined" ? SparkInstruments.getAll() : [];

test("at least one instrument registered", function() {
  assert.ok(instruments.length > 0, "No instruments registered");
});

instruments.forEach(function(inst) {
  var id = inst.id;

  test(id + ": getCurriculumMap() returns non-empty array", function() {
    assert.ok(typeof inst.getCurriculumMap === "function", "getCurriculumMap not defined");
    var map = inst.getCurriculumMap();
    assert.ok(Array.isArray(map), "getCurriculumMap() did not return array");
    assert.ok(map.length > 0, "getCurriculumMap() returned empty array");
  });

  test(id + ": curriculum items have required fields", function() {
    var map = inst.getCurriculumMap();
    if (!map || !map.length) return;
    map.forEach(function(item, i) {
      assert.ok(item.title || item.id, "item " + i + " missing title and id");
      assert.ok(item.num != null || item.id, "item " + i + " missing num and id");
    });
  });

  test(id + ": getData() returns object", function() {
    if (typeof inst.getData !== "function") return;
    var d = inst.getData();
    assert.ok(d && typeof d === "object", "getData() did not return object");
  });

  test(id + ": LC/LN cover all curriculum levels", function() {
    var map = inst.getCurriculumMap();
    if (!map || !map.length) return;
    var d = typeof inst.getData === "function" ? inst.getData() : {};
    var lc = d.LC || {};
    var ln = d.LN || {};
    if (Object.keys(lc).length === 0 && Object.keys(ln).length === 0) return;
    var nums = map.map(function(item) { return item.num; }).filter(function(n) { return n != null; });
    nums.forEach(function(n) {
      assert.ok(lc[n], "LC missing entry for level " + n);
      assert.ok(ln[n], "LN missing entry for level " + n);
    });
  });

  if (typeof inst.getSkillTree === "function") {
    test(id + ": getSkillTree() returns valid structure", function() {
      var tree = inst.getSkillTree();
      assert.ok(tree, "getSkillTree() returned falsy");
      var hasBranches = tree.branches && Array.isArray(tree.branches);
      var isArray = Array.isArray(tree);
      assert.ok(hasBranches || isArray, "returned neither { branches } nor array");
    });
  }

  if (typeof inst.getExercises === "function") {
    test(id + ": getExercises() returns array", function() {
      var ex = inst.getExercises();
      assert.ok(Array.isArray(ex), "getExercises() did not return array");
    });
  }
});
// Ukulele-specific: prerequisites reference valid skill IDs
if (typeof SparkUkuleleLessons !== "undefined" && typeof SparkUkuleleSkillTree !== "undefined") {
  test("ukulele: all lesson skills exist in skill tree", function() {
    var skillIds = SparkUkuleleSkillTree.map(function(s) { return s.id; });
    SparkUkuleleLessons.forEach(function(lesson) {
      if (lesson.skill) {
        assert.ok(skillIds.indexOf(lesson.skill) >= 0, "lesson " + lesson.id + " references unknown skill: " + lesson.skill);
      }
    });
  });

  test("ukulele: all prerequisites reference valid skill IDs", function() {
    var skillIds = SparkUkuleleSkillTree.map(function(s) { return s.id; });
    SparkUkuleleLessons.forEach(function(lesson) {
      if (lesson.prerequisites) {
        lesson.prerequisites.forEach(function(prereq) {
          assert.ok(skillIds.indexOf(prereq) >= 0, "lesson " + lesson.id + " unknown prereq: " + prereq);
        });
      }
    });
  });

  test("ukulele: lesson IDs are unique", function() {
    var ids = {};
    SparkUkuleleLessons.forEach(function(lesson) {
      assert.ok(!ids[lesson.id], "duplicate lesson ID: " + lesson.id);
      ids[lesson.id] = true;
    });
  });

  test("ukulele: masteryRequired is 0-1 range", function() {
    SparkUkuleleLessons.forEach(function(lesson) {
      if (lesson.masteryRequired != null) {
        assert.ok(lesson.masteryRequired >= 0 && lesson.masteryRequired <= 1, "out of range: " + lesson.masteryRequired);
      }
    });
  });
}

// Guitar: CURRICULUM chords exist in chord data
if (typeof CURRICULUM !== "undefined" && typeof ALL_CHORDS !== "undefined") {
  test("guitar: curriculum chord names exist in ALL_CHORDS", function() {
    var chordNames = Object.keys(ALL_CHORDS);
    CURRICULUM.forEach(function(level) {
      if (!level.chords) return;
      level.chords.forEach(function(chord) {
        assert.ok(chordNames.indexOf(chord) >= 0, "level " + level.num + " unknown chord: " + chord);
      });
    });
  });
}

// SparkCurriculumService integration
if (typeof SparkCurriculumService !== "undefined") {
  test("SparkCurriculumService.buildLearningQueue() returns array", function() {
    var queue = SparkCurriculumService.buildLearningQueue({});
    assert.ok(Array.isArray(queue), "buildLearningQueue() did not return array");
  });

  test("SparkCurriculumService.getReviewTargets() returns array", function() {
    var targets = SparkCurriculumService.getReviewTargets({});
    assert.ok(Array.isArray(targets), "getReviewTargets() did not return array");
  });

  test("SparkCurriculumService.buildLearningQueue can use sparkCore completed lessons", function() {
    var prevSparkCore = global.sparkCore;
    var prevCompleted = S.completedLessons;
    var prevMasteryLessons = S.mastery.lessons;

    S.completedLessons = [];
    S.mastery.lessons = {};
    global.sparkCore = {
      getCompletedLessonIds: function() {
        return ["uke_01"];
      }
    };
    global.SparkInstruments.getActive = function() {
      return {
        getCurriculumMap: function() {
          return [
            { id: "uke_01", title: "First Strum" },
            { id: "uke_02", title: "Starter Chords" }
          ];
        }
      };
    };

    var queue = SparkCurriculumService.buildLearningQueue({});
    var lessonEntry = null;
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].type === "lesson") {
        lessonEntry = queue[i];
        break;
      }
    }

    assert.ok(lessonEntry, "No lesson entry returned");
    assert.strictEqual(lessonEntry.id, "uke_02");

    global.sparkCore = prevSparkCore;
    S.completedLessons = prevCompleted;
    S.mastery.lessons = prevMasteryLessons;
  });

  test("SparkCurriculumService.getReviewTargets can use sparkCore progress snapshot", function() {
    var prevSparkCore = global.sparkCore;
    var prevChordProgress = S.chordProgress;

    S.chordProgress = {};
    global.sparkCore = {
      getLegacyProgressSnapshot: function() {
        return {
          completedLessonIds: [],
          mastery: { lessons: {}, chords: {}, rhythm: {} },
          chordProgress: { "C Major": 24, "G Major": 81 },
          ukuleleSkillProgress: {},
          bassSkillProgress: {}
        };
      }
    };

    var targets = SparkCurriculumService.getReviewTargets({});

    assert.ok(Array.isArray(targets), "getReviewTargets() did not return array");
    assert.strictEqual(targets.length, 1);
    assert.strictEqual(targets[0].id, "C Major");
    assert.strictEqual(targets[0].priority, "high");

    global.sparkCore = prevSparkCore;
    S.chordProgress = prevChordProgress;
  });

  test("SparkCurriculumService falls back to global S when SparkState root is unavailable", function() {
    var prevSparkState = global.SparkState;
    var prevSparkCore = global.sparkCore;
    var prevCompleted = S.completedLessons;
    var prevMasteryLessons = S.mastery.lessons;

    delete global.SparkState;
    global.sparkCore = null;
    S.completedLessons = ["uke_01"];
    S.mastery.lessons = {};
    global.SparkInstruments.getActive = function() {
      return {
        getCurriculumMap: function() {
          return [
            { id: "uke_01", title: "First Strum" },
            { id: "uke_02", title: "Starter Chords" }
          ];
        }
      };
    };

    var queue = SparkCurriculumService.buildLearningQueue({});
    var lessonEntry = null;
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].type === "lesson") {
        lessonEntry = queue[i];
        break;
      }
    }

    assert.ok(lessonEntry, "No lesson entry returned");
    assert.strictEqual(lessonEntry.id, "uke_02");

    global.SparkState = prevSparkState;
    global.sparkCore = prevSparkCore;
    S.completedLessons = prevCompleted;
    S.mastery.lessons = prevMasteryLessons;
  });
}

// Summary
console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
