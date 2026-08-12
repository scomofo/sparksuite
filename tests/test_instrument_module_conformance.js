// ===== Instrument Module Conformance Tests =====
// Run: node tests/test_instrument_module_conformance.js
//
// Table-driven contract test over EVERY instrument module under
// js/sparksuite/instruments/. The CLAUDE.md architecture contract says
// adding an instrument must not require core changes — which only holds
// if every module exposes the same surface the engines consume. This
// test pins that surface:
//
//   1. Core contract (all modules): id, getSkillTree(), getLessons(),
//      getExercises() with sane shapes and unique lesson ids.
//   2. Full contract (all string/rhythm modules): appId, name,
//      getCurriculumMap(), getTuning(), getCapabilities(), getSongs(),
//      getRhythmAdapter(), getRhythmChartLibrary().
//   3. Session smoke (rhythm-capable modules): the real PracticeEngineV2 +
//      SessionEngineV2 build a SessionPlan with an instrument-native
//      gameplay payload from the module's own rhythm adapter.
//
// Piano is a known minimal module (no name/appId/tuning/rhythm adapter);
// its current surface is asserted explicitly so any regression from
// today's contract still fails, and growing it to the full contract
// will not.

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var repoRoot = path.resolve(__dirname, "..");
var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
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
  var full = path.join(repoRoot, file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function loadInstrumentDir(dir, firstFiles) {
  firstFiles = firstFiles || [];
  var files = fs.readdirSync(path.join(repoRoot, dir))
    .filter(function(f) { return /\.js$/.test(f) && f !== "index.js"; })
    .sort(function(a, b) {
      // Files with load-time cross-file reads go first (per the spec's
      // firstFiles), then data files, then module files — modules read
      // their data lazily, but load them last anyway so any future
      // load-time reads see their data files already present.
      var aFirst = firstFiles.indexOf(a) >= 0 ? 0 : 1;
      var bFirst = firstFiles.indexOf(b) >= 0 ? 0 : 1;
      var aMod = /_module\.js$/.test(a) ? 1 : 0;
      var bMod = /_module\.js$/.test(b) ? 1 : 0;
      return aFirst - bFirst || aMod - bMod || (a < b ? -1 : 1);
    });
  for (var i = 0; i < files.length; i++) loadJS(dir + "/" + files[i]);
}

global.window = global;
global.S = { chordProgress: {} };

loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");
loadJS("js/sparksuite/domain/tempo_map.js");
loadJS("js/sparksuite/domain/note_event.js");
loadJS("js/sparksuite/domain/phrase.js");
loadJS("js/sparksuite/domain/chart.js");
loadJS("js/sparksuite/core/chart_io.js");
loadJS("js/sparksuite/core/practice_engine_v2.js");
loadJS("js/sparksuite/core/session_engine_v2.js");

// Bass module data lives with the legacy bass app.
loadJS("js/instruments/bass/data.js");

var INSTRUMENTS = [
  { key: "guitar", dir: "js/sparksuite/instruments/guitar", globalName: "SparkGuitarModule", full: true, rhythm: true },
  { key: "ukulele", dir: "js/sparksuite/instruments/ukulele", globalName: "SparkUkuleleModule", full: true, rhythm: true },
  { key: "bass", dir: "js/sparksuite/instruments/bass", globalName: "SparkBassModule", full: true, rhythm: true },
  { key: "drums", dir: "js/sparksuite/instruments/drums", globalName: "SparkDrumsModule", full: true, rhythm: true },
  { key: "vocals", dir: "js/sparksuite/instruments/vocals", globalName: "SparkVocalsModule", full: true, rhythm: true },
  // piano_exercises.js derives its map from SparkPianoLessons at load
  // time, so lessons must load first (index.html ordering does this in
  // the app).
  { key: "piano", dir: "js/sparksuite/instruments/piano", globalName: "SparkPianoModule", full: false, rhythm: false,
    firstFiles: ["piano_lessons.js"] }
];

INSTRUMENTS.forEach(function(spec) {
  loadInstrumentDir(spec.dir, spec.firstFiles);
});

console.log("=== Instrument Module Conformance Tests ===");

INSTRUMENTS.forEach(function(spec) {
  var mod = global[spec.globalName];

  test(spec.key + ": module is registered under window." + spec.globalName, function() {
    assert.ok(mod, "missing global " + spec.globalName);
  });
  if (!mod) return;

  test(spec.key + ": core contract (id, skill tree, lessons, exercises)", function() {
    assert.strictEqual(mod.id, spec.key);
    var skillTree = mod.getSkillTree();
    assert.ok(Array.isArray(skillTree), "getSkillTree() must return an array of skill nodes");
    for (var n = 0; n < skillTree.length; n++) {
      assert.ok(typeof skillTree[n].id === "string" && skillTree[n].id.length,
        "skill tree node " + n + " must carry a string id");
    }
    var lessons = mod.getLessons();
    assert.ok(Array.isArray(lessons) && lessons.length > 0, "getLessons() must return a non-empty array");
    assert.ok(typeof mod.getExercises === "function");
    assert.ok(Array.isArray(mod.getExercises(lessons[0].skill || lessons[0].id)),
      "getExercises(skill) must return an array");
  });

  test(spec.key + ": lesson ids are unique and well-formed", function() {
    var lessons = mod.getLessons();
    var seen = {};
    for (var i = 0; i < lessons.length; i++) {
      var id = lessons[i].id;
      assert.ok(typeof id === "string" && id.length, "lesson " + i + " has no id");
      assert.ok(!seen[id], "duplicate lesson id: " + id);
      seen[id] = true;
    }
  });

  if (spec.key === "bass") {
    // Regression guard for the flattened bass skill tree: the shared dev
    // tooling (curriculum validator, highlighter) cross-references
    // lesson.skill and lesson.prerequisites against skill-tree node ids,
    // which the old category-keyed object shape broke silently.
    test("bass: every lesson skill and prerequisite resolves in the skill tree", function() {
      var ids = {};
      mod.getSkillTree().forEach(function(node) { ids[node.id] = true; });
      mod.getLessons().forEach(function(lesson) {
        assert.ok(ids[lesson.skill], "lesson " + lesson.id + " skill '" + lesson.skill + "' missing from tree");
        (lesson.prerequisites || []).forEach(function(prereq) {
          assert.ok(ids[prereq], "lesson " + lesson.id + " prerequisite '" + prereq + "' missing from tree");
        });
      });
    });
  }

  test(spec.key + ": at least one lesson resolves to concrete exercises", function() {
    var lessons = mod.getLessons();
    var found = 0;
    for (var i = 0; i < lessons.length; i++) {
      found += mod.getExercises(lessons[i].skill || lessons[i].id).length;
      found += mod.getExercises(lessons[i].id).length;
    }
    assert.ok(found > 0, "no lesson in " + spec.key + " maps to any exercise");
  });

  if (spec.full) {
    test(spec.key + ": full module contract (identity, map, tuning, capabilities, songs)", function() {
      assert.ok(typeof mod.appId === "string" && mod.appId.length, "appId required");
      assert.ok(typeof mod.name === "string" && mod.name.length, "name required");
      assert.ok(Array.isArray(mod.getCurriculumMap()), "getCurriculumMap() must return an array");
      var caps = mod.getCapabilities();
      assert.ok(caps && typeof caps === "object", "getCapabilities() must return an object");
      assert.ok(Array.isArray(caps.inputModes) && caps.inputModes.length, "capabilities must declare inputModes");
      if (typeof caps.stringCount === "number" && caps.stringCount > 0) {
        assert.ok(typeof mod.getTuning === "function", "string instruments must expose getTuning");
      }
      assert.ok(Array.isArray(mod.getSongs()), "getSongs() must return an array");
      assert.ok(mod.getRhythmChartLibrary() && typeof mod.getRhythmChartLibrary() === "object",
        "getRhythmChartLibrary() must return an object");
    });
  } else {
    // Piano's current (known-minimal) surface — a ratchet, not an endorsement.
    test(spec.key + ": minimal module surface stays intact", function() {
      assert.ok(typeof mod.getCurriculum === "function");
      assert.ok(typeof mod.getRuntimeAdapter === "function");
    });
  }

  if (spec.rhythm) {
    test(spec.key + ": rhythm adapter contract", function() {
      var adapter = mod.getRhythmAdapter();
      assert.ok(adapter, "getRhythmAdapter() returned nothing");
      assert.ok(adapter.getLaneCount() > 0, "lane count must be positive");
      var labels = adapter.getLaneLabels();
      assert.ok(Array.isArray(labels), "lane labels must be an array");
      assert.strictEqual(labels.length, adapter.getLaneCount(), "one label per lane");
    });

    test(spec.key + ": SessionEngineV2 builds an instrument-native session", function() {
      var lessons = mod.getLessons();
      var firstLesson = lessons[0];

      global.buildPracticeCandidates = function() {
        return [{
          id: "rhythm_smoke",
          type: "rhythm",
          label: "Conformance rhythm block",
          reason: "smoke",
          meta: { skill: firstLesson.skill || firstLesson.id, durationSec: 120 }
        }];
      };

      var curriculumEngine = {
        getDailyPracticeContext: function() {
          return { nextLessonId: firstLesson.id, nextLesson: firstLesson };
        }
      };
      var psychologyEngine = {
        getFocusLabel: function() { return "Conformance"; },
        getSessionDifficulty: function() { return "normal"; }
      };

      var practiceEngine = new SparkSuitePracticeEngineV2(psychologyEngine);
      var sessionEngine = new SparkSuiteSessionEngineV2(practiceEngine, curriculumEngine, psychologyEngine);

      var plan = sessionEngine.buildSession(SparkSessionTypes.FLOW_DAILY_PRACTICE, {
        instrumentContext: {
          appId: mod.appId,
          instrumentType: mod.id,
          rhythmAdapter: mod.getRhythmAdapter()
        }
      });

      assert.ok(plan instanceof SessionPlan, "engine must return a SessionPlan");
      assert.strictEqual(plan.lesson.id, firstLesson.id);
      assert.ok(plan.exercises.length >= 1);
      var gameplay = plan.exercises[0].data.gameplay;
      assert.ok(gameplay, "rhythm exercise must carry a gameplay payload");
      assert.strictEqual(gameplay.adapterType, mod.id,
        "gameplay payload must identify its instrument adapter");
      assert.ok(gameplay.songChart, "gameplay payload must include a song chart");
      assert.ok(gameplay.laneCount > 0);
    });
  }
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
