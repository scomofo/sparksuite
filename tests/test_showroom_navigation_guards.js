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

test("showroom practice drills route start buttons through practiceStartItem", function() {
  var showroomSource = loadJS("js/showroom/spark-showroom.js");
  assert.ok(showroomSource.indexOf('onclick="act(\\\'practiceStartItem\\\', this.getAttribute(\\\'data-item-id\\\'))"') >= 0);
  assert.strictEqual(showroomSource.indexOf("launchPracticePlanItem(this.getAttribute("), -1);
});

test("showroom library chips route through action handlers", function() {
  var showroomSource = loadJS("js/showroom/spark-showroom.js");
  assert.ok(showroomSource.indexOf('onclick="act(\\\'showroomLibraryCategory\\\',') >= 0);
  assert.ok(showroomSource.indexOf('onclick="act(\\\'showroomLibraryLevel\\\',') >= 0);
  assert.strictEqual(showroomSource.indexOf("SparkShowroom.setLibraryCategory("), -1);
  assert.strictEqual(showroomSource.indexOf("SparkShowroom.setLibraryLevel("), -1);
});

test("system action family forwards showroom library filters to the showroom api", function() {
  var handled;
  var categoryCalls = [];
  var levelCalls = [];
  global.runSparkActionFamilies = undefined;
  global.registerSparkActionFamily = function(name, handler) {
    global.runSparkActionFamilies = handler;
  };
  global.SparkShowroom = {
    setLibraryCategory: function(value) { categoryCalls.push(value); },
    setLibraryLevel: function(value) { levelCalls.push(value); }
  };
  global.eval(loadJS("js/actions/system_family.js"));

  handled = global.runSparkActionFamilies("showroomLibraryCategory", "Rock");
  assert.strictEqual(handled, true);
  handled = global.runSparkActionFamilies("showroomLibraryLevel", "Intermediate");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(categoryCalls, ["Rock"]);
  assert.deepStrictEqual(levelCalls, ["Intermediate"]);
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
