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
  global.TAB = { PRACTICE: "practice", SONGS: "songs" };
  global._acts = [];
  global.act = function(name, value) {
    global._acts.push({ name: name, value: value });
  };
  global._openPerformanceSongSelectionCalls = [];
  global.openPerformanceSongSelectionRequest = function(options) {
    global._openPerformanceSongSelectionCalls.push(options || {});
    return { opened: true };
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

test("launchPracticeItem infers performance song launches from generic core song segments", function() {
  var launched = launchPracticeItem({
    id: "performance_song_river_walk",
    type: "song",
    meta: {
      songId: "river_walk",
      arrangementType: "chords",
      difficultyId: "normal"
    }
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._acts, [
    { name: "planStartPerformanceSong", value: "river_walk|chords|normal" }
  ]);
});

test("launchPracticeItem infers guided launches from generic core practice segments", function() {
  var launched = launchPracticeItem({
    id: "guided_session_2",
    type: "practice",
    meta: {
      guidedSession: 2
    }
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._acts, [
    { name: "guidedStart", value: 2 }
  ]);
});

test("launchPracticeItem routes chord practice items into a specific chord session", function() {
  var launched = launchPracticeItem({
    id: "chord_g",
    type: "chord_practice",
    chord: "G"
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._acts, [
    { name: "startSession", value: "G" }
  ]);
});

test("launchPracticeItem routes explore items into the performance song browser", function() {
  var launched = launchPracticeItem({
    id: "explore_1",
    type: "explore"
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._openPerformanceSongSelectionCalls, [{}]);
  assert.deepStrictEqual(global._acts, []);
});

test("launchPracticeItem falls back to the songs tab when the performance browser request is unavailable", function() {
  global.openPerformanceSongSelectionRequest = function(options) {
    global._openPerformanceSongSelectionCalls.push(options || {});
    return null;
  };

  var launched = launchPracticeItem({
    id: "explore_legacy",
    type: "explore"
  });

  assert.strictEqual(launched, true);
  assert.deepStrictEqual(global._openPerformanceSongSelectionCalls, [{}]);
  assert.deepStrictEqual(global._acts, [
    { name: "tab", value: "songs" }
  ]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
