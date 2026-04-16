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
  global.__sparkState = global.S;
  global.TAB = { PRACTICE: "practice" };
  global._acts = [];
  global.act = function(name, value) {
    global._acts.push({ name: name, value: value });
  };
  global.SparkInstrumentAdapter = {
    getInstrumentType: function() { return "guitar"; }
  };
  global.SparkState = {
    read: function(path, fallback) {
      var key = Array.isArray(path) ? path[0] : path;
      return Object.prototype.hasOwnProperty.call(global.S, key) ? global.S[key] : fallback;
    }
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

test("launchPracticePlanItem resolves plan item ids before launching", function() {
  global.S.practicePlan = {
    items: [{
      id: "performance_song_the_beat_goes_on",
      type: "performance_song",
      meta: {
        songId: "the_beat_goes_on",
        arrangementType: "chords",
        difficultyId: "normal"
      }
    }]
  };

  var launched = launchPracticePlanItem("performance_song_the_beat_goes_on");

  assert.strictEqual(launched, true);
  assert.strictEqual(global._acts.length, 1);
  assert.strictEqual(global._acts[0].name, "planStartPerformanceSong");
  assert.strictEqual(global._acts[0].value, "the_beat_goes_on|chords|normal");
});

test("launchPracticePlanItem fails safely when a core-owned daily plan is active but the legacy bridge is unavailable", function() {
  global.S.practicePlan = {
    items: [{
      id: "stale_plan_item",
      type: "performance_song",
      meta: {
        songId: "stale_song",
        arrangementType: "chords",
        difficultyId: "normal"
      }
    }]
  };
  global.window.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice"
        }
      };
    }
  };
  global.SparkPracticeBridge = undefined;

  var launched = launchPracticePlanItem("stale_plan_item");

  assert.strictEqual(launched, false);
  assert.strictEqual(global._acts.length, 0);
});

test("piano transition recommendations fall back to the games drill flow", function() {
  global.S.activeInstrument = "pianospark";

  var launched = launchPracticeItem({
    id: "transition_c_g",
    type: "transition",
    meta: { key: "C->G" }
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._acts, [
    { name: "go_home", value: undefined },
    { name: "tab", value: "games" },
    { name: "start_drill", value: "level" }
  ]);
});

test("piano rhythm recommendations fall back to the games rhythm flow", function() {
  global.S.activeInstrument = "pianospark";

  var launched = launchPracticeItem({
    id: "rhythm_focus",
    type: "rhythm",
    meta: { bpm: 95 }
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._acts, [
    { name: "go_home", value: undefined },
    { name: "tab", value: "games" },
    { name: "start_rhythm", value: undefined }
  ]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
