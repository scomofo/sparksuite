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
  global.S = { guidedSession: 1 };
  global.TAB = { PRACTICE: "practice" };
  global._acts = [];
  global.act = function(name, value) {
    global._acts.push({ name: name, value: value });
  };
  global.SparkInstrumentAdapter = {
    getInstrumentType: function() { return "guitar"; }
  };
  global.SparkInstruments = {
    getActive: function() { return null; },
    getAll: function() { return []; }
  };
}

resetState();
eval(loadJS("js/practice/launchers.js"));

console.log("\n--- Practice Launchers ---");

test("launchPracticeItem routes imported technique candidates through explicit performance technique action", function() {
  var launched = launchPracticeItem({
    id: "imported_technique_song_b_tap",
    type: "performance_technique",
    meta: {
      songId: "song_b",
      arrangementType: "imported_chart",
      difficultyId: "hard",
      techniqueKey: "tap"
    }
  });

  assert.strictEqual(launched, true);
  assert.strictEqual(global._acts.length, 1);
  assert.strictEqual(global._acts[0].name, "planStartPerformanceTechnique");
  assert.strictEqual(global._acts[0].value, "song_b|imported_chart|hard|tap");
});

test("launchPracticeItem routes authored bass module exercises through explicit module exercise action", function() {
  var launched = launchPracticeItem({
    id: "module_bass_level_4",
    type: "bassline",
    meta: {
      instrument: "bass",
      lessonId: "bass_level_4",
      skill: "walking_bass",
      exerciseId: "bass_walk_lines_01",
      exerciseName: "Walk Lines 01",
      exerciseFocus: "walking_bass",
      exerciseType: "bassline"
    }
  });

  assert.strictEqual(launched, true);
  assert.strictEqual(global._acts.length, 1);
  assert.strictEqual(global._acts[0].name, "planStartModuleExercise");
  assert.deepStrictEqual(JSON.parse(global._acts[0].value), {
    instrument: "bass",
    lessonId: "bass_level_4",
    skill: "walking_bass",
    exerciseId: "bass_walk_lines_01",
    exerciseName: "Walk Lines 01",
    exerciseFocus: "walking_bass",
    exerciseType: "bassline"
  });
});

test("launchGuidedSessionItem rehydrates a thin active piano shell before choosing the launch path", function() {
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{ id: "pianospark", appId: "pianospark", instrument: "piano" }];
    }
  };

  var launched = launchGuidedSessionItem({
    meta: { guidedSession: 3 }
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._acts, [
    { name: "tab", value: "practice" },
    { name: "start_guided_session", value: 3 }
  ]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
