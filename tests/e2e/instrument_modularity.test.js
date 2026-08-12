var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..", "..");

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(repoRoot, file), "utf8"), { filename: path.join(repoRoot, file) });
}

function resetState() {
  global.window = global;
  global.S = {
    chordProgress: {},
    ukuleleSkillProgress: {}
  };
  global.buildPracticeCandidates = function() {
    return [
      {
        id: "rhythm_fix",
        type: "rhythm",
        label: "Island timing",
        reason: "Tighten the island groove",
        meta: {
          skill: "strumming_patterns",
          exerciseFocus: "strumming_patterns",
          durationSec: 120
        }
      },
      {
        id: "transition_fix",
        type: "transition",
        label: "C to Am",
        reason: "Smooth the common switch",
        meta: {
          key: "C|Am",
          from: "C",
          to: "Am",
          durationSec: 180
        }
      }
    ];
  };
}

resetState();
loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");
loadJS("js/sparksuite/domain/tempo_map.js");
loadJS("js/sparksuite/domain/note_event.js");
loadJS("js/sparksuite/domain/phrase.js");
loadJS("js/sparksuite/domain/chart.js");
loadJS("js/sparksuite/core/chart_io.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_lessons.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_chords.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_scales.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_exercises.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_progression.js");
loadJS("js/sparksuite/instruments/ukulele/ukulele_module.js");
loadJS("js/sparksuite/core/practice_engine_v2.js");
loadJS("js/sparksuite/core/session_engine_v2.js");

var curriculumEngine = {
  getDailyPracticeContext: function() {
    return {
      nextLessonId: "uke_04",
      nextLesson: {
        id: "uke_04",
        title: "Island Pattern",
        level: 1,
        skill: "strumming_patterns"
      }
    };
  }
};

var psychologyEngine = {
  getFocusLabel: function() { return "Song accuracy"; },
  getSessionDifficulty: function() { return "easy"; }
};

var practiceEngine = new SparkSuitePracticeEngineV2(psychologyEngine);
var sessionEngine = new SparkSuiteSessionEngineV2(practiceEngine, curriculumEngine, psychologyEngine);

var plan = sessionEngine.buildSession(SparkSessionTypes.FLOW_DAILY_PRACTICE, {
  instrumentContext: {
    appId: "ukespark",
    instrumentType: "ukulele",
    rhythmAdapter: SparkUkuleleModule.getRhythmAdapter()
  }
});

assert.ok(plan instanceof SessionPlan);
assert.strictEqual(plan.lesson.id, "uke_04");
assert.strictEqual(plan.exercises[0].data.gameplay.adapterType, "ukulele");
assert.strictEqual(plan.exercises[1].type, "chord_transition");
assert.deepStrictEqual(plan.exercises[1].data.core.chords, ["C", "Am"]);

console.log("PASS: e2e ukulele modularity path builds valid instrument-native exercises without core edits");
