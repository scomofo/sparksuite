var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetEnvironment();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.localStorage = {
    getItem: function() { return null; },
    setItem: function() {},
    removeItem: function() {}
  };
  global.S = {
    activeInstrument: "pianospark",
    screen: "legacy-screen",
    tab: "legacy-tab",
    _showroomOverride: "old-override",
    _showroomLessonId: null,
    _showroomSongId: null
  };
  global.SCR = {
    HOME: "home",
    SETTINGS: "settings",
    SONG: "song",
    COMPLETE: "complete"
  };
  global.TAB = {
    PRACTICE: "practice",
    SONGS: "songs",
    TUNER: "tuner"
  };
  global._saveStateCalls = 0;
  global._renderCalls = 0;
  global.saveState = function() {
    global._saveStateCalls++;
  };
  global.render = function() {
    global._renderCalls++;
  };
  global.SparkInstruments = {
    deactivate: function() {
      global._deactivated = true;
    },
    openLauncherView: function(view) {
      global._openedLauncherView = view;
    }
  };
  global.eval(loadJS("js/showroom/spark-showroom.js"));
}

console.log("\n--- Showroom Navigation Guards ---");

test("practice navigation restores canonical screen and tab state", function() {
  SparkShowroomNavigate("practice");
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "practice");
  assert.strictEqual(S._showroomOverride, null);
  assert.strictEqual(global._saveStateCalls, 1);
  assert.strictEqual(global._renderCalls, 1);
});

test("practice metro preview keeps canonical practice tab while setting override", function() {
  SparkShowroomNavigate("practice-metro");
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "practice");
  assert.strictEqual(S._showroomOverride, "practice-metro");
});

test("lesson navigation pins the requested lesson id", function() {
  SparkShowroomNavigate("lesson", 3);
  assert.strictEqual(S._showroomOverride, "lesson");
  assert.strictEqual(S._showroomLessonId, "3");
});

test("leaving lesson clears the pinned lesson id on unrelated routes", function() {
  SparkShowroomNavigate("lesson", 3);
  SparkShowroomNavigate("practice");
  assert.strictEqual(S._showroomLessonId, null);
});

test("practice action family wires practiceStartItem to the runtime launcher", function() {
  var handled;
  global.startPracticeItemCalls = [];
  global.startPracticeItem = function(value) {
    global.startPracticeItemCalls.push(value);
  };
  global.runSparkActionFamilies = undefined;
  global.registerSparkActionFamily = function(name, handler) {
    global.runSparkActionFamilies = handler;
  };
  global.SparkInstruments = {
    getActive: function() { return null; }
  };
  global.eval(loadJS("js/actions/practice_family.js"));
  handled = global.runSparkActionFamilies("practiceStartItem", "focus_01");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(global.startPracticeItemCalls, ["focus_01"]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
