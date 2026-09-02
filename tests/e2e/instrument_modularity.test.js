var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..", "..");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(repoRoot, file), "utf8"));
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
loadJS("js/utils/day.js");
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
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/sparksuite/core/session_engine.js");

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

var practiceEngine = new SparkSuitePracticeEngine(psychologyEngine);
var sessionEngine = new SparkSuiteSessionEngine(practiceEngine, curriculumEngine);

var plan = sessionEngine.buildSession(SparkSessionTypes.FLOW_DAILY_PRACTICE, {
  instrumentContext: {
    appId: "ukespark",
    instrumentType: "ukulele",
    rhythmAdapter: SparkUkuleleModule.getRhythmAdapter()
  }
});

assert.ok(plan instanceof SessionPlan);
assert.strictEqual(plan.lesson.id, "uke_04", "the curriculum engine chose the lesson");

// The point of the test: the ukulele's own rhythm adapter shaped the payload,
// with no ukulele-specific code in the session or practice engine. The chart
// id, lane count and preset all come from the instrument module.
var gameplay = plan.exercises[0].data.gameplay;
assert.ok(gameplay && gameplay.payload, "the rhythm exercise carries an instrument-built payload");
assert.strictEqual(gameplay.payload.adapterType, "ukulele");
assert.strictEqual(gameplay.payload.chartId, "uke_open_strums_01", "chart id came from the ukulele module");
assert.strictEqual(gameplay.payload.laneCount, 4, "a ukulele has four lanes, not the guitar default of five");

assert.strictEqual(plan.exercises[1].type, "chord_transition");
assert.deepStrictEqual(plan.exercises[1].data.core.chords, ["C", "Am"]);

// Guard the thing that made this test misleading before: it must exercise the
// engines index.html actually loads, not the dormant v2 pair.
var indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
assert.ok(
  indexHtml.indexOf("js/sparksuite/core/session_engine.js") !== -1
    && indexHtml.indexOf("js/sparksuite/core/practice_engine.js") !== -1,
  "this test must drive the engines the app loads — it previously used the " +
    "SparkSuite*EngineV2 pair, which index.html does not load, so the " +
    "modularity claim was proven against code that never runs"
);
assert.strictEqual(typeof SparkSuiteSessionEngineV2, "undefined", "the v2 engines must not be loaded here");

console.log("PASS: e2e ukulele modularity path builds valid instrument-native exercises without core edits");
