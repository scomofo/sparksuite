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

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
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
    SESSION: "session",
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
  loadVM("js/showroom/routing_state.js");
  loadVM("js/showroom/spark-showroom.js");
}

console.log("\n--- Showroom Navigation Guards ---");

test("practice navigation promotes Practice Metro with legacy slot fallback", function() {
  SparkShowroomNavigate("practice");
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "practice");
  assert.strictEqual(S._showroomOverride, "practice-metro");
  assert.strictEqual(global._saveStateCalls, 1);
  assert.strictEqual(global._renderCalls, 1);
});

test("practice metro preview keeps canonical practice tab while setting override", function() {
  SparkShowroomNavigate("practice-metro");
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "practice");
  assert.strictEqual(S._showroomOverride, "practice-metro");
});

test("performance navigation opens showroom ready screen with legacy practice fallback", function() {
  SparkShowroomNavigate("performance");
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.tab, "practice");
  assert.strictEqual(S._showroomOverride, "performance");
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

test("showroom routing clear is UI-runtime only and does not mutate session plan state", function() {
  var state = {
    sessionPlan: { id: "keep-session" },
    showroomReturnView: "guitar",
    showroomLessonId: "lesson-1",
    screen: "showroom"
  };

  SparkShowroomRoutingState.clear(state);

  assert.deepStrictEqual(state.sessionPlan, { id: "keep-session" });
  assert.strictEqual(state.showroomReturnView, null);
  assert.strictEqual(state.showroomLessonId, null);
  assert.strictEqual(state.screen, "showroom");
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
  loadVM("js/actions/practice_family.js");
  handled = global.runSparkActionFamilies("practiceStartItem", "focus_01");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(global.startPracticeItemCalls, ["focus_01"]);
});

test("global act routes practiceStartItem through shared families before active instrument handlers", function() {
  var familyCalls = [];
  var instrumentCalls = [];
  global.runSparkActionFamilies = function(action, value) {
    familyCalls.push([action, value]);
    return true;
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        act: function(action, value) {
          instrumentCalls.push([action, value]);
          return true;
        }
      };
    }
  };

  loadVM("js/actions.js");
  global.act("practiceStartItem", "focus_01");

  assert.deepStrictEqual(familyCalls, [["practiceStartItem", "focus_01"]]);
  assert.deepStrictEqual(instrumentCalls, []);
});

test("legacy piano dispatcher delegates practiceStartItem back to shared families", function() {
  var pianoSource = loadJS("js/instruments/piano/app.js");
  assert.ok(pianoSource.indexOf('case "practiceStartItem":') >= 0);
  assert.ok(pianoSource.indexOf("window.runSparkActionFamilies(action, param)") >= 0);
});

test("instrument guided handlers clear stale showroom routing", function() {
  var guitarSource = loadJS("js/instruments/guitar/app.js");
  var bassSource = loadJS("js/instruments/bass/app.js");
  assert.ok(guitarSource.indexOf("function clearGuitarShowroomRoute()") >= 0);
  assert.ok(guitarSource.indexOf("clearGuitarShowroomRoute();") >= 0);
  assert.ok(bassSource.indexOf("function clearBassShowroomRoute()") >= 0);
  assert.ok(bassSource.indexOf("clearBassShowroomRoute();") >= 0);
});

test("session registry prefers instrument session page when the engine-owned flag requests it", function() {
  var rendered = [];
  global.S.screen = "session";
  global.S.sessionPlan = { title: "Guided", useInstrumentPage: true };
  global.S.sessionStep = "spark";
  global.sessionPage = function() {
    rendered.push("shared");
    return "shared";
  };
  global.SparkInstruments.getPage = function(screen) {
    assert.strictEqual(screen, "session");
    return function() {
      rendered.push("instrument");
      return "instrument";
    };
  };

  loadVM("js/render_registry.js");

  assert.strictEqual(global._renderActiveScreenContent(), "instrument");
  assert.deepStrictEqual(rendered, ["instrument"]);
});

test("session registry keeps legacy active chord routing in the shared session shell", function() {
  var rendered = [];
  global.S.screen = "session";
  global.S.sessionPlan = null;
  global.S.sessionStep = null;
  global.S.active = true;
  global.S.chord = "C";
  global.sessionPage = function() {
    rendered.push("shared");
    return "shared";
  };
  global.SparkInstruments.getPage = function(screen) {
    assert.strictEqual(screen, "session");
    return function() {
      rendered.push("instrument");
      return "instrument";
    };
  };

  loadVM("js/render_registry.js");

  assert.strictEqual(global._renderActiveScreenContent(), "shared");
  assert.deepStrictEqual(rendered, ["shared"]);
});

test("showroom practice drills route start buttons through practiceStartItem", function() {
  var showroomSource = loadJS("js/showroom/spark-showroom.js");
  assert.ok(showroomSource.indexOf('onclick="act(\\\'practiceStartItem\\\', this.getAttribute(\\\'data-item-id\\\'))"') >= 0);
  assert.ok(showroomSource.indexOf('>View All</span></div>') >= 0);
  assert.ok(showroomSource.indexOf('onclick="\' + nav("path") + \'"') >= 0);
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
  loadVM("js/actions/system_family.js");

  handled = global.runSparkActionFamilies("showroomLibraryCategory", "Rock");
  assert.strictEqual(handled, true);
  handled = global.runSparkActionFamilies("showroomLibraryLevel", "Intermediate");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(categoryCalls, ["Rock"]);
  assert.deepStrictEqual(levelCalls, ["Intermediate"]);
});

test("community actions stay removed from the tools family", function() {
  // The community feature was removed (single-user app): the tools family
  // must not resurrect handlers for its retired actions.
  var handled;
  global.runSparkActionFamilies = undefined;
  global.registerSparkActionFamily = function(name, handler) {
    global.runSparkActionFamilies = handler;
  };
  global.S = {};
  global.applySongBrowserRequest = function() {};
  global.render = function() {};
  loadVM("js/actions/tools_family.js");

  handled = global.runSparkActionFamilies("communitySearch", "Midnight");
  assert.notStrictEqual(handled, true, "communitySearch should be unhandled");
  handled = global.runSparkActionFamilies("submitSong", null);
  assert.notStrictEqual(handled, true, "submitSong should be unhandled");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
