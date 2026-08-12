var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));
_testEval(loadJS("js/sparksuite/ui/session_shell.js"));


function resetEnvironment() {
  global.window = global;
  global.document = { body: { classList: { contains: function(cls) { return cls === "sv2"; } } } };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null
  };
  global.escHTML = function(value) { return String(value); };
  global.SparkTheme = {
    get: function() { return { ok: true }; },
    getColor: function(instrument) { return instrument === "piano" ? "#3366ff" : "#888"; }
  };
  global.BADGES = [];
  global.ringHTML = function() { return "<div>ring</div>"; };
  global.act = function() {};
  global.practiceTab = function() { return "<div>Practice</div>"; };
  global.drillTab = function() { return "<div>Drill</div>"; };
  global.dailyTab = function() { return ""; };
  global.quizTab = function() { return ""; };
  global.earTrainTab = function() { return ""; };
  global.strumTab = function() { return ""; };
  global.songsTab = function() { return ""; };
  global.rhythmTab = function() { return ""; };
  global.runnerTab = function() { return ""; };
  global.buildTab = function() { return ""; };
  global.tunerTab = function() { return ""; };
  global.dualTab = function() { return ""; };
  global.statsTab = function() { return ""; };
  global.guideTab = function() { return ""; };
  global.gamesTab = function() { return ""; };
  global.toolsTab = function() { return ""; };
  global.strumTrackCard = function() { return ""; };
  global.fingerExerciseCard = function() { return ""; };

  var pianoModule = {
    id: "pianospark",
    appId: "pianospark",
    instrument: "piano",
    name: "Piano",
    icon: "\uD83C\uDFB9",
    tabs: [{ id: "practice", label: "Practice", icon: "\uD83C\uDFB9" }],
    tabRenderers: {
      practice: function() { return "<div>Piano Practice</div>"; }
    },
    getData: function() {
      return {
        LC: { 1: "#3366ff" },
        LN: { 1: "First Keys" },
        CURRICULUM: [{ num: 1, title: "First Keys", desc: "Foundations", icon: "\uD83C\uDFB9", tip: "" }],
        CHORDS: { 1: [] },
        SESSIONS: [],
        BADGES: [],
        ALL_CHORDS: [{ name: "C" }]
      };
    }
  };

  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [pianoModule];
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    loadVM("js/pages/practice.js");
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Practice Page Instrument Resolution ---");

test("sv2HomeDashboard rehydrates an app-id-only active instrument shell", function() {
  var html = sv2HomeDashboard();
  assert.ok(html.indexOf("Piano") >= 0);
  assert.ok(html.indexOf("First Keys") >= 0);
  assert.ok(html.indexOf("1/1 chords") >= 0);
});

test("sv2HomeDashboard and practiceTab ignore malformed goal metrics", function() {
  global.S.todayPracticeSeconds = "NaN";
  global.S.dailyGoalMinutes = { broken: true };
  global.S.goalStreak = [];
  global.S.goalReachedToday = "false";

  var dashboardHtml = sv2HomeDashboard();
  var practiceHtml = practiceTab();

  assert.ok(dashboardHtml.indexOf("Daily Goal: 10 min") >= 0);
  assert.ok(dashboardHtml.indexOf("0 / 10 min today") >= 0);
  assert.ok(dashboardHtml.indexOf("Goal reached!") === -1);
  assert.ok(dashboardHtml.indexOf("NaN") === -1);
  // The practice-tab goal card is now the goal SELECTOR; the ring + progress
  // text live in the persistent home glance (asserted above) to avoid showing
  // the same "Daily Goal" twice on the Practice tab.
  assert.ok(practiceHtml.indexOf("Adjust daily goal") >= 0);
  assert.ok(practiceHtml.indexOf("Goal reached!") === -1);
  assert.ok(practiceHtml.indexOf("NaN") === -1);
});

test("sv2HomeDashboard ignores malformed hero counters", function() {
  global.S.xp = "NaN";
  global.S.streak = { broken: true };
  global.S.level = "NaN";

  var html = sv2HomeDashboard();

  assert.ok(html.indexOf("0 XP") >= 0);
  assert.ok(html.indexOf("🔥 0") >= 0 || html.indexOf("\uD83D\uDD25 0") >= 0);
  assert.ok(html.indexOf("Level 1") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("drillTab ignores malformed transition timing", function() {
  global.S.transitionStats = {
    "C->G": { attempts: 3, avgTime: "NaN" },
    "Am->F": { attempts: 3, avgTime: 1.25 }
  };
  global.S.drillCount = 0;

  var html = drillTab();

  assert.ok(html.indexOf("Am") >= 0);
  assert.ok(html.indexOf("F") >= 0);
  assert.ok(html.indexOf("avg 1.3s") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("practice surfaces ignore malformed legacy progress counters", function() {
  global.S.sessions = "NaN";
  global.S.level = "NaN";
  global.S.chordProgress = { C: "NaN", G: 100 };
  global.S.drillCount = "NaN";
  global.S.quizCorrect = "NaN";
  global.S.earTrainScore = "NaN";
  global.S.earTrainTotal = "NaN";
  global.S.earTrainStreak = "NaN";

  var practiceHtml = practiceTab();
  var drillHtml = drillTab();
  var quizHtml = quizTab();
  var earHtml = earTrainTab();

  assert.ok(practiceHtml.indexOf(">0</div><div class=\"metric-label\" style=\"font-size:10px\">Sessions</div>") >= 0);
  assert.ok(practiceHtml.indexOf(">1</div><div class=\"metric-label\" style=\"font-size:10px\">Mastered</div>") >= 0);
  assert.ok(practiceHtml.indexOf("Lvl 1") >= 0);
  assert.ok(drillHtml.indexOf("Completed: <strong>0</strong>") >= 0);
  assert.ok(quizHtml.indexOf("Correct: <strong>0</strong>") >= 0);
  assert.ok(earHtml.indexOf("Score: <strong>0</strong> correct all time") >= 0);
  assert.ok(practiceHtml.indexOf("NaN") === -1);
  assert.ok(drillHtml.indexOf("NaN") === -1);
  assert.ok(quizHtml.indexOf("NaN") === -1);
  assert.ok(earHtml.indexOf("NaN") === -1);
});

test("practice mini-game cards prefer canonical runtime counters over stale legacy state", function() {
  global.S.quizCorrect = 1;
  global.S.earTrainQ = "Legacy Question";
  global.S.earTrainOpts = ["Legacy Question"];
  global.S.earTrainAns = null;
  global.S.earTrainScore = 1;
  global.S.earTrainTotal = 2;
  global.S.earTrainStreak = 1;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          legacyQuizScore: 7,
          legacyEarTrainQuestion: "Core Question",
          legacyEarTrainOptions: ["Core Question", "Runtime Option"],
          legacyEarTrainAnswer: null,
          legacyEarTrainScore: 5,
          legacyEarTrainTotal: 8,
          legacyEarTrainStreak: 3
        }
      };
    }
  };
  global.window.sparkCore = global.sparkCore;

  var quizHtml = quizTab();
  var earHtml = earTrainTab();

  assert.ok(quizHtml.indexOf("Correct: <strong>7</strong>") >= 0);
  assert.strictEqual(quizHtml.indexOf("Correct: <strong>1</strong>"), -1);
  assert.ok(earHtml.indexOf("Core Question") >= 0);
  assert.ok(earHtml.indexOf("Runtime Option") >= 0);
  assert.strictEqual(earHtml.indexOf("Legacy Question"), -1);
  assert.ok(earHtml.indexOf("5/8") >= 0);
});

test("homePage uses rehydrated tab renderers from the active instrument module", function() {
  var html = homePage();
  assert.ok(html.indexOf("Piano Practice") >= 0);
});

test("homePage games and tools tabs render real loaded sections instead of stub cards", function() {
  var module = SparkInstruments.getAll()[0];
  module.tabs = [
    { id: "games", label: "Games", icon: "G" },
    { id: "tools", label: "Tools", icon: "T" }
  ];
  module.tabRenderers = {};
  global.rhythmTab = function() { return "<div>Real Rhythm Runtime</div>"; };
  global.runnerTab = function() { return "<div>Real Runner Runtime</div>"; };
  global.buildTab = function() { return "<div>Real Builder Runtime</div>"; };
  global.tunerTab = function() { return "<div>Real Tuner Runtime</div>"; };
  global.statsTab = function() { return "<div>Real Stats Runtime</div>"; };
  global.guideTab = function() { return "<div>Real Guide Runtime</div>"; };

  S.tab = "games";
  var gamesHtml = homePage();
  S.tab = "tools";
  var toolsHtml = homePage();

  assert.ok(gamesHtml.indexOf("Real Rhythm Runtime") >= 0);
  assert.ok(gamesHtml.indexOf("Real Runner Runtime") >= 0);
  assert.ok(gamesHtml.indexOf("Real Builder Runtime") >= 0);
  assert.strictEqual(gamesHtml.indexOf("Mini-games and challenges."), -1);
  assert.ok(toolsHtml.indexOf("Real Tuner Runtime") >= 0);
  assert.ok(toolsHtml.indexOf("Real Stats Runtime") >= 0);
  assert.ok(toolsHtml.indexOf("Real Guide Runtime") >= 0);
  assert.strictEqual(toolsHtml.indexOf("Tuner, metronome, and utilities."), -1);
});

test("shared practice tab renderers survive piano page globals for guitar tabs", function() {
  global.sparkCore = null;
  global.window.sparkCore = null;
  global.S.quizQ = null;
  global.S.earTrainQ = null;
  global.S.dailyChallenge = { id: "switch", icon: "D", title: "Daily Switch", desc: "Move cleanly", xp: 10 };
  loadVM("js/instruments/piano/pages/games.js");

  var renderers = getSharedHomeTabRenderers();

  // Piano page functions are namespaced (pianoDrillTab etc.), so loading
  // them no longer shadows the shared renderers — bare globals stay shared
  // and the piano variants live under their own names.
  assert.ok(typeof SparkSharedPracticeRenderers.drillTab === "function");
  assert.ok(pianoDrillTab().indexOf("Chord Drill") >= 0);
  assert.strictEqual(drillTab().indexOf("Chord Drill"), -1);
  assert.ok(renderers.drill().indexOf("Chord Switching") >= 0);
  assert.strictEqual(renderers.drill().indexOf("Chord Drill"), -1);
  assert.ok(pianoDailyTab().indexOf("Daily Challenges") >= 0);
  assert.ok(renderers.daily().indexOf("Daily Challenge") >= 0);
  assert.strictEqual(renderers.daily().indexOf("Daily Challenges"), -1);
  assert.ok(pianoQuizTab().indexOf("start_quiz") >= 0);
  assert.strictEqual(quizTab().indexOf("start_quiz"), -1);
  assert.ok(renderers.quiz().indexOf("startQuiz") >= 0);
  assert.strictEqual(renderers.quiz().indexOf("start_quiz"), -1);
  assert.ok(pianoEarTrainTab().indexOf("start_ear") >= 0);
  assert.ok(renderers.ear().indexOf("startEarTrain") >= 0);
  assert.strictEqual(renderers.ear().indexOf("start_ear"), -1);
});

test("shared tool tab renderers survive piano page globals for guitar tabs", function() {
  loadVM("js/pages/tools.js");
  loadVM("js/instruments/piano/pages/tools.js");

  var renderers = getSharedHomeTabRenderers();

  assert.ok(typeof SparkSharedToolRenderers.statsTab === "function");
  assert.strictEqual(renderers.stats, SparkSharedToolRenderers.statsTab);
  assert.strictEqual(renderers.guide, SparkSharedToolRenderers.guideTab);
});

test("shared tool renderers use shared card and metric typography classes", function() {
  loadVM("js/pages/tools.js");
  global.getChordTier = function(name) {
    return name === "C" ? { tier: "gold" } : { tier: "none" };
  };
  global.tierBadgeHTML = function() { return ""; };
  global.SparkTransitionStats = {
    all: function() {
      return { "C->G": { attempts: 3, avgTime: 1.8, best: 1.2 } };
    }
  };
  global.localStorage = {
    getItem: function() {
      return JSON.stringify({ xp: 8, level: 2, sessions: 1, streak: 2 });
    }
  };
  global.S.history = [
    { date: new Date().toISOString().split("T")[0], type: "session", detail: "C", xp: 5 },
    { date: new Date().toISOString().split("T")[0], type: "quiz", detail: "C", xp: 3 }
  ];
  global.S.quizCorrect = 1;
  global.S.quizTotal = 1;
  global.S.midiEnabled = true;
  global.S.midiDevices = [{ id: "midi_1", name: "Virtual Synth" }];
  global.S.midiOutput = true;
  global.S.midiOutputId = "midi_1";

  var tunerHtml = SparkSharedToolRenderers.tunerTab();
  var statsHtml = SparkSharedToolRenderers.statsTab();
  var guideHtml = SparkSharedToolRenderers.guideTab();

  assert.ok(tunerHtml.indexOf("card-section-heading") >= 0);
  assert.ok(tunerHtml.indexOf("action-row") >= 0);
  assert.ok(statsHtml.indexOf("card-section-heading") >= 0);
  assert.ok(statsHtml.indexOf("metric-value") >= 0);
  assert.ok(statsHtml.indexOf("metric-label") >= 0);
  assert.ok(statsHtml.indexOf("action-row") >= 0);
  assert.ok(guideHtml.indexOf("card-section-heading") >= 0);
  assert.ok(guideHtml.indexOf("card-micro-heading") >= 0);
  assert.ok(guideHtml.indexOf("split-row") >= 0);
});

test("shared tool renderers avoid representative raw heavy heading strings", function() {
  loadVM("js/pages/tools.js");
  global.S.midiEnabled = false;

  var tunerHtml = SparkSharedToolRenderers.tunerTab();
  var statsHtml = SparkSharedToolRenderers.statsTab();
  var guideHtml = SparkSharedToolRenderers.guideTab();

  assert.strictEqual(tunerHtml.indexOf('font-size:20px;font-weight:800;color:var(--text-primary);margin:0 0 8px'), -1);
  assert.strictEqual(statsHtml.indexOf('font-size:22px;font-weight:900;color:var(--text-primary)">&#128202; Practice Stats'), -1);
  assert.strictEqual(statsHtml.indexOf('font-size:15px;font-weight:800;color:var(--text-primary)">&#128197; Last 30 Days'), -1);
  assert.strictEqual(guideHtml.indexOf('font-size:16px;font-weight:800;color:var(--text-primary)">&#127912; Chart Legend'), -1);
  assert.strictEqual(guideHtml.indexOf('font-size:22px;font-weight:900;color:var(--text-primary)">&#128214; How to Read Chord Charts'), -1);
});

test("practice instrument switcher rows expose keyboard handlers", function() {
  var source = loadJS("js/pages/practice.js");
  var uiSource = loadJS("js/ui.js");
  assert.ok(source.indexOf('sv2-inst-row__item" role="button" tabindex="0"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'reset\\\')"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'previewChord\\\',\\\'') >= 0);
  assert.strictEqual(source.indexOf("event.stopPropagation();act('previewChord'"), -1);
  assert.ok(uiSource.indexOf('if(event.target&&event.target.closest&&event.target.closest(&quot;button,input,select,textarea,a&quot;)){return;}') >= 0);
  assert.strictEqual(uiSource.indexOf('onclick="'+
    'if(event.target&&event.target.closest&&event.target.closest("button,input,select,textarea,a")){return;}'), -1);
  assert.ok(loadJS("js/pages/plan.js").indexOf('onclick="act(\\\'practiceStartItem\\\', this.getAttribute(\\\'data-item-id\\\'))"') >= 0);
});

test("renderPracticeToolboxCard routes tools through data-tool-id attributes", function() {
  var html = renderPracticeToolboxCard({
    toolbox: [
      { id: "drill", label: "Drill", icon: "&#9889;" },
      { id: "tuner", label: "Tuner", icon: "&#127908;" }
    ]
  });
  assert.ok(html.indexOf('data-tool-id="drill"') >= 0);
  assert.ok(html.indexOf('data-tool-id="tuner"') >= 0);
  assert.ok(html.indexOf("act('tab', this.getAttribute('data-tool-id'))") >= 0);
  // escHTML leaves single quotes intact, so ids must never be concatenated
  // into the inline handler string itself.
  assert.strictEqual(html.indexOf("act('tab','drill')"), -1);
});

test("instrument toolbox ids all resolve through the shared tab renderer map", function() {
  var rendererIds = Object.keys(getSharedHomeTabRenderers());
  var registers = [
    "js/instruments/guitar/register.js",
    "js/instruments/ukulele/register.js"
  ];
  for (var r = 0; r < registers.length; r++) {
    var source = loadJS(registers[r]);
    var toolboxMatch = source.match(/toolbox:\s*\[([\s\S]*?)\]/);
    assert.ok(toolboxMatch, registers[r] + " declares a toolbox");
    var idPattern = /id:\s*"([^"]+)"/g;
    var idMatch;
    var idCount = 0;
    while ((idMatch = idPattern.exec(toolboxMatch[1]))) {
      idCount++;
      assert.ok(
        rendererIds.indexOf(idMatch[1]) >= 0,
        registers[r] + " toolbox id '" + idMatch[1] + "' lacks a shared tab renderer"
      );
    }
    assert.ok(idCount > 0, registers[r] + " toolbox lists at least one tool");
  }
});

test("practicePage renders human plan labels from a core-backed daily practice plan", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.generateDailyPracticePlan = function() {};
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            items: [
              { id: "song_1", type: "song", label: "Replay Island Strum", completed: false },
              { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
            ]
          }
        }
      };
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf(">song<"), -1);
  assert.strictEqual(html.indexOf(">practice<"), -1);
});

test("practicePage does not generate a plan during render and shows an empty state when none exists", function() {
  var generateCalls = 0;
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.generateDailyPracticePlan = function() {
    generateCalls++;
    return {
      items: [{ id: "generated_1", label: "Generated Plan Row" }]
    };
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.S.practicePlan = null;

  var html = practicePage();
  assert.strictEqual(generateCalls, 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Generated Plan Row"), -1);
});

test("practicePage prefers the active core plan when the practice bridge is unavailable", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [{ id: "cached_1", type: "practice", label: "Cached Warmup", completed: false }]
    }
  };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            items: [{ id: "core_1", type: "practice", label: "Core Warmup", completed: false }]
          }
        }
      };
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("Core Warmup") >= 0);
  assert.strictEqual(html.indexOf("Cached Warmup"), -1);
});

test("practicePage does not render completed items as clickable start buttons", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", completed: true },
        { id: "todo_1", type: "practice", label: "Next Warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("Completed Warmup") >= 0);
  assert.ok(html.indexOf("Next Warmup") >= 0);
  assert.ok(html.indexOf('data-item-id="done_1"') === -1);
  assert.ok(html.indexOf('data-item-id="todo_1"') >= 0);
  assert.ok(html.indexOf(">Done<") >= 0);
});

test("practicePage and planPage ignore string false completion flags in cached items", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: "false", meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();
  assert.ok(practiceHtml.indexOf('data-item-id="song_1"') >= 0);
  assert.ok(planHtml.indexOf('data-item-id="song_1"') >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Done<"), -1);
  assert.strictEqual(planHtml.indexOf(">Done<"), -1);
  assert.strictEqual(planHtml.indexOf("Plan completed!"), -1);
});

test("planPage and launchPracticePlanItem can resolve sparkCore from the global binding", function() {
  var launchedItem = null;
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.window = {
    SparkPracticeBridge: global.SparkPracticeBridge
  };
  global.launchPracticeItem = function(item) {
    launchedItem = item;
  };
  global.S = {
    practicePlanComplete: false,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Core focus",
            items: [
              { id: "practice_1", type: "practice", label: "Core Warmup", completed: false, meta: { exerciseId: "warmup_1", instrument: "piano" } }
            ]
          }
        }
      };
    }
  };
  loadVM("js/pages/plan.js");

  var planHtml = planPage();
  launchPracticePlanItem("practice_1");

  assert.ok(planHtml.indexOf("Core Warmup") >= 0);
  assert.deepStrictEqual(launchedItem, {
    id: "practice_1",
    type: "practice",
    label: "Core Warmup",
    completed: false,
    meta: { exerciseId: "warmup_1", instrument: "piano" }
  });
});

test("practicePage and planPage surface the live daily-practice shell from sparkCore", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          focus: "Timing focus",
          segments: [
            { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120, completed: false, exerciseIds: ["ex_1"] },
            { id: "song_1", type: "song", label: "Song push", durationSec: 240, completed: false, exerciseIds: ["ex_2"] }
          ],
          _legacyPlan: {
            focus: "Timing focus",
            items: [
              { id: "practice_1", type: "practice", label: "Quick warmup", completed: false, meta: { exerciseId: "warmup_1", instrument: "piano" } },
              { id: "song_1", type: "song", label: "Song push", completed: false, meta: { songId: "moonlight", instrument: "piano" } }
            ]
          }
        },
        activeSegment: {
          id: "practice_1",
          type: "practice",
          label: "Quick warmup",
          durationSec: 120,
          exerciseIds: ["ex_1"]
        },
        runtimeState: {
          activeSegmentId: "practice_1",
          transport: {
            status: "paused",
            positionMs: 45
          }
        }
      };
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var summaryHtml = practiceTab();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(practiceHtml.indexOf("Paused - Quick warmup") >= 0);
  assert.ok(practiceHtml.indexOf("Resume Block") >= 0);
  assert.ok(practiceHtml.indexOf("Skip Block") >= 0);
  assert.ok(summaryHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(planHtml.indexOf("Practice Session Live") >= 0);
  assert.ok(planHtml.indexOf("Block 1 of 2") >= 0);
  assert.ok(planHtml.indexOf("Resume Block") >= 0);
});

test("planPage keeps daily shell metadata honest when duration is missing from the active shell", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          focus: "Timing focus",
          segments: [
            { id: "practice_1", type: "practice", label: "Quick warmup", completed: false, exerciseIds: ["ex_1"] },
            { id: "song_1", type: "song", label: "Song push", completed: false, exerciseIds: ["ex_2"] }
          ],
          _legacyPlan: null
        },
        activeSegment: {
          id: "practice_1",
          type: "practice",
          label: "Quick warmup",
          exerciseIds: ["ex_1"]
        },
        runtimeState: {
          activeSegmentId: "practice_1",
          transport: {
            status: "paused",
            positionMs: 45
          }
        }
      };
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Practice Session Live") >= 0);
  assert.ok(html.indexOf("2 blocks") >= 0);
  assert.ok(html.indexOf('data-action="sessionResumeBlock"') >= 0);
  assert.strictEqual(html.indexOf("onclick=\"act('sessionResumeBlock')\""), -1);
  assert.strictEqual(html.indexOf("10 min shell"), -1);
  assert.strictEqual(html.indexOf("0 min shell"), -1);
});

test("practicePage and practiceTab safely render cached item ids containing apostrophes", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_'_1", type: "song", label: "Replay Island Strum", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var practiceHtml = practicePage();
  var summaryHtml = practiceTab();
  loadVM("js/pages/plan.js");
  var planHtml = planPage();
  assert.ok(practiceHtml.indexOf('data-item-id="song_\'_1"') >= 0);
  assert.ok(summaryHtml.indexOf('data-item-id="song_\'_1"') >= 0);
  assert.ok(planHtml.indexOf('data-item-id="song_\'_1"') >= 0);
  assert.strictEqual(practiceHtml.indexOf("act('practiceStartItem', 'song_'_1')"), -1);
  assert.strictEqual(summaryHtml.indexOf("act('completePlanItem','song_'_1')"), -1);
  assert.strictEqual(planHtml.indexOf("launchPracticePlanItem('song_'_1')"), -1);
});

test("customSetsSection ignores stale sentinel set names in the editor input", function() {
  global.S = {
    level: 1,
    editingSet: true,
    editingSetIdx: -1,
    customSetName: "undefined",
    customSetChords: []
  };

  var html = customSetsSection();
  assert.ok(html.indexOf('value="undefined"') === -1);
  assert.ok(html.indexOf('id="set-name-input"') >= 0);
});

test("practicePage and customSetsSection ignore malformed shared collections", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: { broken: true },
    customSetChords: "broken",
    earnedBadges: { broken: true },
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: { broken: true },
    editingSet: false
  };
  global.getPracticePageInstrument = function() {
    return {
      getData: function() {
        return {
          LC: { 1: "#3366ff" },
          LN: { 1: "First Keys" },
          CURRICULUM: [{ num: 1, title: "First Keys", desc: "Foundations", icon: "\uD83C\uDFB9", tip: "" }],
          CHORDS: { 1: [] },
          SESSIONS: [{ num: 1, title: "Warmup", level: 1 }],
          BADGES: [{ id: "starter", label: "Starter", icon: "\uD83C\uDFC5" }],
          ALL_CHORDS: [{ name: "C" }]
        };
      },
      ui: { chord: function() { return "<div>Chord</div>"; } }
    };
  };

  var sectionHtml = customSetsSection();
  var pageHtml = practicePage();
  assert.ok(sectionHtml.indexOf("Create custom chord groups to practice together.") >= 0);
  assert.ok(pageHtml.indexOf("Today's Practice Plan") >= 0);
  assert.ok(pageHtml.indexOf("No practice plan yet.") >= 0);
});

test("practicePage derives readable fallback labels and subtitles for sparse plan items", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        { id: "song_1", type: "song", completed: false, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practicePage();
  assert.ok(html.indexOf("island strum") >= 0);
  assert.ok(html.indexOf("left hand") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("practicePage and planPage ignore sentinel string labels and descriptions", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        {
          id: "song_1",
          label: "undefined",
          desc: "null",
          completed: false,
          meta: {
            songId: "island_strum",
            instrument: "ukulele",
            skill: "strum_pattern"
          }
        }
      ]
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();
  assert.ok(practiceHtml.indexOf("island strum") >= 0);
  assert.ok(planHtml.indexOf("island strum") >= 0);
  assert.strictEqual(practiceHtml.indexOf("undefined"), -1);
  assert.strictEqual(practiceHtml.indexOf("null"), -1);
  assert.strictEqual(planHtml.indexOf("undefined"), -1);
  assert.strictEqual(planHtml.indexOf("null"), -1);
});

test("practicePage and planPage ignore whitespace-only labels and descriptions", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", label: "   ", desc: "   ", completed: false, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.ok(summaryHtml.indexOf("island strum") >= 0);
  assert.ok(practiceHtml.indexOf("island strum") >= 0);
  assert.ok(planHtml.indexOf("island strum") >= 0);
  assert.ok(summaryHtml.indexOf("ukulele - strum pattern - performance song") >= 0);
  assert.ok(planHtml.indexOf("ukulele - strum pattern - performance song") >= 0);
});

test("practicePage and planPage skip whitespace-only fallback meta labels", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", completed: false, meta: { songTitle: "   ", songId: "island_strum", instrument: "ukulele" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.ok(summaryHtml.indexOf("island strum") >= 0);
  assert.ok(practiceHtml.indexOf("island strum") >= 0);
  assert.ok(planHtml.indexOf("island strum") >= 0);
});

test("practicePage and planPage ignore object-shaped fallback meta labels", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", completed: false, meta: { songTitle: { bad: true }, songId: "island_strum", instrument: { bad: true }, skill: "strum_pattern" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var practiceHtml = practicePage();
  var planHtml = planPage();
  assert.ok(summaryHtml.indexOf("island strum") >= 0);
  assert.ok(practiceHtml.indexOf("island strum") >= 0);
  assert.ok(planHtml.indexOf("island strum") >= 0);
  assert.strictEqual(summaryHtml.indexOf("[object Object]"), -1);
  assert.strictEqual(planHtml.indexOf("[object Object]"), -1);
});

test("practicePage and planPage ignore whitespace-only exercise types", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseType: "   ", exerciseId: "warmup_1", instrument: "piano" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();
  assert.ok(practiceHtml.indexOf("warmup 1") >= 0);
  assert.ok(planHtml.indexOf("warmup 1") >= 0);
  assert.strictEqual(practiceHtml.indexOf(" -  - "), -1);
  assert.strictEqual(planHtml.indexOf(" -  - "), -1);
});

test("practiceTab and planPage ignore whitespace-only subtitle meta tokens", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: false, meta: { songId: "island_strum", instrument: "   ", skill: "   " } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var planHtml = planPage();

  assert.ok(summaryHtml.indexOf("performance song") >= 0);
  assert.ok(planHtml.indexOf("performance song") >= 0);
  assert.strictEqual(summaryHtml.indexOf(" -  - "), -1);
  assert.strictEqual(planHtml.indexOf(" -  - "), -1);
});

test("practiceTab and planPage ignore whitespace-only item types in subtitle fallback", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "   ", label: "Replay Island Strum", completed: false, meta: {} }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var planHtml = planPage();
  assert.ok(summaryHtml.indexOf(">practice<") >= 0);
  assert.ok(planHtml.indexOf(">practice<") >= 0);
  assert.strictEqual(summaryHtml.indexOf(" -  - "), -1);
  assert.strictEqual(planHtml.indexOf(" -  - "), -1);
});

test("practicePage does not render start buttons for sparse plan items without ids", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        { type: "song", completed: false, meta: { songId: "island_strum" } },
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practicePage();
  assert.strictEqual(html.indexOf('data-item-id="undefined"'), -1);
  assert.ok(html.indexOf('data-item-id="practice_1"') >= 0);
  assert.ok(html.indexOf(">Unavailable<") >= 0);
});

test("practicePage and planPage do not render action buttons for whitespace-only item ids", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "   ", type: "song", label: "Replay Island Strum", completed: false, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.strictEqual(practiceHtml.indexOf("practiceStartItem', '"), -1);
  assert.strictEqual(planHtml.indexOf("launchPracticePlanItem('"), -1);
  assert.ok(practiceHtml.indexOf(">Unavailable<") >= 0);
  assert.ok(planHtml.indexOf(">Unavailable<") >= 0);
});

test("practicePage and planPage do not render action buttons for sentinel string item ids", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "undefined", type: "practice", label: "Ghost Item", completed: false, meta: { exerciseId: "ghost_1" } },
        { id: "practice_1", type: "practice", label: "Real Warmup", completed: false }
      ]
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.strictEqual(practiceHtml.indexOf('data-item-id="undefined"'), -1);
  assert.strictEqual(planHtml.indexOf('data-item-id="undefined"'), -1);
  assert.ok(practiceHtml.indexOf('data-item-id="practice_1"') >= 0);
  assert.ok(planHtml.indexOf('data-item-id="practice_1"') >= 0);
  assert.ok(practiceHtml.indexOf(">Unavailable<") >= 0);
  assert.ok(planHtml.indexOf(">Unavailable<") >= 0);
});

test("practicePage and planPage do not render action buttons for numeric item ids", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: 123, type: "song", label: "Replay Island Strum", completed: false, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.strictEqual(practiceHtml.indexOf('data-item-id="123"'), -1);
  assert.strictEqual(planHtml.indexOf('data-item-id="123"'), -1);
  assert.ok(practiceHtml.indexOf(">Unavailable<") >= 0);
  assert.ok(planHtml.indexOf(">Unavailable<") >= 0);
});

test("planPage treats whitespace-only item ids without other data as missing plans", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    practicePlanComplete: false,
    practicePlan: {
      focus: "   ",
      items: [
        { id: "   " }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("No practice focus yet."), -1);
});

test("plan page infers richer display types from generic core-backed items", function() {
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Song mastery",
            items: [
              { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: 240, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
              { id: "practice_1", type: "practice", label: "Quick warmup", durationSec: 120, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
            ]
          }
        },
        lastSessionOutcome: null
      };
    }
  };
  global.ensurePracticePlan = function() {
    throw new Error("should not be called");
  };
  global.S = { practicePlanComplete: false };
  global.act = function() {};
  global.launchPracticeItem = function() {};
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("ukulele - strum pattern - performance song") >= 0);
  assert.ok(html.indexOf("piano - left hand - finger") >= 0);
  assert.strictEqual(html.indexOf("â€¢"), -1);
  assert.strictEqual(html.indexOf(">song<"), -1);
  assert.strictEqual(html.indexOf(">practice<"), -1);
});

test("planPage stays read-only when no plan exists and shows an empty state", function() {
  var ensureCalls = 0;
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.ensurePracticePlan = function() {
    ensureCalls++;
    return {
      focus: "Generated plan",
      items: [{ id: "generated_1", label: "Generated Plan Row" }]
    };
  };
  global.S = { practicePlanComplete: false, practicePlan: null };
  global.act = function() {};
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Generated Plan Row"), -1);
});

test("planPage pivots into guided resume mode when a guided session is active and no daily plan exists", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedPlan: {
              num: 2,
              title: "How guitars get tuned",
              target_duration_min: 10,
              blocks: [
                { type: "warm_engine", duration_sec: 90 },
                { type: "drill", duration_sec: 180 },
                { type: "song", duration_sec: 240 },
                { type: "cooldown", duration_sec: 90 }
              ]
            }
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "songSlice"
        }
      };
    }
  };

  var html = planPage();
  assert.ok(html.indexOf("Guided Session Flow") >= 0);
  assert.ok(html.indexOf("Guided Session Live") >= 0);
  assert.ok(html.indexOf("How guitars get tuned") >= 0);
  assert.ok(html.indexOf("In progress - Song block") >= 0);
  assert.ok(html.indexOf("Your live guided shell is the plan right now.") >= 0);
  assert.ok(html.indexOf("Resume Guided Session") >= 0);
  assert.ok(html.indexOf("act('resume_guided_session')") >= 0);
  assert.strictEqual(html.indexOf("No practice plan yet."), -1);
});

test("planPage prefers the active core plan when the practice bridge is unavailable", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [{ id: "cached_1", type: "practice", label: "Cached Warmup", durationSec: 120 }]
    }
  };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Core focus",
            items: [{ id: "core_1", type: "practice", label: "Core Warmup", durationSec: 120 }]
          }
        },
        lastSessionOutcome: null
      };
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Core Warmup") >= 0);
  assert.strictEqual(html.indexOf("Cached Warmup"), -1);
});

test("planPage does not render completed items as clickable go buttons", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", durationSec: 120, completed: true },
        { id: "todo_1", type: "practice", label: "Next Warmup", durationSec: 120, completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Completed Warmup") >= 0);
  assert.ok(html.indexOf("Next Warmup") >= 0);
  assert.ok(html.indexOf('data-item-id="done_1"') === -1);
  assert.ok(html.indexOf('data-item-id="todo_1"') >= 0);
  assert.ok(html.indexOf(">Done<") >= 0);
});

test("planPage derives plan completion from completed items when the stale completion flag is false", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", durationSec: 120, completed: true },
        { id: "done_2", type: "practice", label: "Completed Rhythm", durationSec: 120, completed: true }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Plan completed!") >= 0);
  assert.strictEqual(html.indexOf("Mark Plan Complete"), -1);
});

test("planPage derives plan completion from real completed items even when stale arrays include null slots", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "done_1", type: "practice", label: "Completed Warmup", durationSec: 120, completed: true },
        null,
        null
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Plan completed!") >= 0);
  assert.strictEqual(html.indexOf("Mark Plan Complete"), -1);
});

test("planPage derives readable fallback labels for sparse plan items", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "song_1", type: "song", durationSec: 240, meta: { songId: "island_strum", instrument: "ukulele", skill: "strum_pattern" } },
        { id: "practice_1", type: "practice", durationSec: 120, meta: { exerciseId: "warmup_1", instrument: "piano", exerciseFocus: "left_hand" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("island strum") >= 0);
  assert.ok(html.indexOf("left hand") >= 0);
  assert.strictEqual(html.indexOf("undefined"), -1);
});

test("planPage ignores malformed duration values in cached plan items", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: "oops", meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.strictEqual(html.indexOf("NaNm"), -1);
});

test("planPage ignores boolean duration values in cached plan items", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: true, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.strictEqual(html.indexOf("0m"), -1);
});

test("planPage ignores fractional duration values in cached plan items", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: "120.5", meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.strictEqual(html.indexOf("2m"), -1);
});

test("planPage ignores non-plain numeric string durations in cached plan items", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", durationSec: "1e2", meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.strictEqual(html.indexOf("2m"), -1);
});

test("planPage derives a readable focus label when a cached plan omits focus", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      items: [
        { id: "song_1", type: "song", durationSec: 240, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("No practice focus yet.") >= 0);
  assert.strictEqual(html.indexOf("<div class=\"muted\">No practice plan yet.</div>"), -1);
});

test("planPage and practiceTab treat whitespace-only focus as missing focus", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "   ",
      items: [
        { id: "song_1", type: "song", completed: false, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var planHtml = planPage();
  var practiceHtml = practiceTab();

  assert.ok(planHtml.indexOf("No practice focus yet.") >= 0);
  assert.ok(practiceHtml.indexOf("Focus: No practice focus yet.") >= 0);
});

test("planPage and practiceTab ignore non-string stale focus values", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: { label: "Song mastery" },
      items: [
        { id: "song_1", type: "song", durationSec: 240, meta: { songId: "island_strum" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var planHtml = planPage();
  var practiceHtml = practiceTab();
  assert.ok(planHtml.indexOf("No practice focus yet.") >= 0);
  assert.ok(practiceHtml.indexOf("Focus: No practice focus yet.") >= 0);
  assert.strictEqual(planHtml.indexOf("[object Object]"), -1);
  assert.strictEqual(practiceHtml.indexOf("[object Object]"), -1);
});

test("planPage and practiceTab treat sentinel string focus as missing focus", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "undefined",
      items: [
        {
          id: "song_1",
          label: "Replay Island Strum",
          completed: false
        }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var planHtml = planPage();
  var practiceHtml = practiceTab();
  assert.ok(planHtml.indexOf("No practice focus yet.") >= 0);
  assert.ok(practiceHtml.indexOf("Focus: No practice focus yet.") >= 0);
  assert.strictEqual(planHtml.indexOf(">undefined<"), -1);
  assert.strictEqual(practiceHtml.indexOf("Focus: undefined"), -1);
});

test("planPage does not render a completed banner when the plan is missing but the stale completion flag remains", function() {
  global.S = {
    practicePlanComplete: true,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Plan completed!"), -1);
});

test("planPage treats empty cached plan shells as missing plans in the header copy", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      items: []
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.ok(html.indexOf("<div class=\"muted\">No practice plan yet.</div>") >= 0);
  assert.strictEqual(html.indexOf("No practice focus yet."), -1);
});

test("planPage does not render go buttons for sparse plan items without ids", function() {
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        { type: "song", durationSec: 240, meta: { songId: "island_strum" } },
        { id: "practice_1", type: "practice", durationSec: 120, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var html = planPage();
  assert.strictEqual(html.indexOf('data-item-id="undefined"'), -1);
  assert.ok(html.indexOf('data-item-id="practice_1"') >= 0);
  assert.ok(html.indexOf(">Unavailable<") >= 0);
});

test("planPage and practicePage tolerate sparse cached plan items that contain null entries", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [
        null,
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.strictEqual(practiceHtml.indexOf("undefined"), -1);
  assert.strictEqual(planHtml.indexOf("undefined"), -1);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
  assert.ok(practiceHtml.indexOf("warmup 1") >= 0);
  assert.ok(planHtml.indexOf("warmup 1") >= 0);
});

test("planPage and practice summaries skip null slots when real plan items exist", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      completedItems: 1,
      items: [
        { id: "practice_1", type: "practice", completed: true, meta: { exerciseId: "warmup_1" } },
        null
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("1/1") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
  assert.ok(practiceHtml.indexOf("warmup 1") >= 0);
  assert.ok(planHtml.indexOf("warmup 1") >= 0);
});

test("startPracticeItem skips null cached plan rows when launching by id", function() {
  var launched = [];
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      items: [
        null,
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };

  startPracticeItem("practice_1");

  assert.deepStrictEqual(launched, ["practice_1"]);
});

test("startPracticeItem opens shared shell blocks before legacy item launch", function() {
  var launched = [];
  var renderCalls = 0;
  var runtimeCalls = [];
  global.SCR = { SESSION: "session" };
  global.S = {
    screen: "plan",
    practicePlan: {
      flow: "daily_practice",
      items: [
        { id: "uke_favorites_set_a_warmup", type: "warmup", completed: false }
      ],
      segments: [
        { id: "uke_favorites_set_a_warmup", type: "warmup", meta: { ukuleleMiniSessionId: "uke_favorites_set_a" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return { plan: global.S.practicePlan };
    },
    syncSessionRuntime: function(options) {
      runtimeCalls.push(options);
      return true;
    }
  };
  global.SparkSessionRuntime = {
    runSegmentById: function(id) {
      runtimeCalls.push({ id: id });
      return true;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };
  global.render = function() {
    renderCalls++;
  };

  startPracticeItem("uke_favorites_set_a_warmup");

  assert.deepStrictEqual(launched, []);
  assert.strictEqual(global.S.screen, "session");
  assert.strictEqual(renderCalls, 1);
  assert.strictEqual(runtimeCalls[0].segmentId, "uke_favorites_set_a_warmup");
  assert.strictEqual(runtimeCalls[0].status, "running");
  assert.strictEqual(runtimeCalls.length, 1);
});

test("startPracticeItem fails safely when a cached plan shell omits items", function() {
  var launched = [];
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    practicePlan: {
      focus: "Song mastery"
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };

  startPracticeItem("practice_1");

  assert.deepStrictEqual(launched, []);
});

test("launchPracticePlanItem skips null cached plan rows when launching by id", function() {
  var launched = [];
  global.S = {
    practicePlanComplete: false,
    practicePlan: {
      focus: "Cached focus",
      items: [
        null,
        { id: "practice_1", type: "practice", completed: false, meta: { exerciseId: "warmup_1" } }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.launchPracticeItem = function(item) {
    launched.push(item && item.id);
  };
  loadVM("js/pages/plan.js");

  launchPracticePlanItem("practice_1");

  assert.deepStrictEqual(launched, ["practice_1"]);
});

test("practiceTab reads the active core-backed plan without calling ensurePracticePlan during render", function() {
  var ensureCalls = 0;
  global.ensurePracticePlan = function() {
    ensureCalls++;
    return {
      focus: "Stale plan",
      completedItems: 0,
      totalItems: 1,
      items: [{ id: "stale_1", label: "Old Stale Song", desc: "stale", completed: false }]
    };
  };
  global.SparkPracticeBridge = {
    toLegacyPlan: function(plan) { return plan._legacyPlan; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Song mastery",
            completedItems: 1,
            totalItems: 2,
            items: [
              { id: "song_1", type: "song", label: "Replay Island Strum", desc: "Tune recall", completed: false },
              { id: "practice_1", type: "practice", label: "Quick warmup", desc: "Loosen up", completed: true }
            ]
          }
        }
      };
    }
  };

  var html = practiceTab();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("Replay Island Strum") >= 0);
  assert.ok(html.indexOf("Quick warmup") >= 0);
  assert.strictEqual(html.indexOf("Old Stale Song"), -1);
});

test("practiceTab derives progress counts when cached plans omit completedItems and totalItems", function() {
  var ensureCalls = 0;
  global.ensurePracticePlan = function() {
    ensureCalls++;
    return null;
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true },
        { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.strictEqual(ensureCalls, 0);
  assert.ok(html.indexOf("1/2") >= 0);
  assert.strictEqual(html.indexOf("undefined/undefined"), -1);
});

test("practiceTab ignores stale zero totalItems when cached plans still have items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      completedItems: 1,
      totalItems: 0,
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true },
        { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("1/2") >= 0);
  assert.strictEqual(html.indexOf("1/0"), -1);
});

test("practiceTab ignores non-finite cached progress counters", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      completedItems: NaN,
      totalItems: NaN,
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("1/1") >= 0);
  assert.strictEqual(html.indexOf("NaN"), -1);
});

test("practiceTab ignores non-integer cached progress counters", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      completedItems: 1.5,
      totalItems: 2.5,
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true },
        { id: "practice_1", type: "practice", label: "Quick warmup", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("1/2") >= 0);
  assert.strictEqual(html.indexOf("1.5/2.5"), -1);
});

test("practiceTab derives counts from real items when stale sparse arrays leave raw totals behind", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      completedItems: 1,
      totalItems: 2,
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: true },
        null
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("1/1") >= 0);
  assert.strictEqual(html.indexOf("1/2"), -1);
});

test("practiceTab derives a readable focus label when cached plans omit focus", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      items: [
        { id: "song_1", type: "song", label: "Replay Island Strum", completed: false }
      ]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Focus: No practice focus yet.") >= 0);
  assert.strictEqual(html.indexOf("Focus: undefined"), -1);
});

test("practiceTab shows an empty-state practice plan card when no plan exists", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Today&#39;s Practice Plan") >= 0 || html.indexOf("Today's Practice Plan") >= 0);
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
});

test("practiceTab pivots the plan area into guided resume mode when a guided session is active", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: "Em",
    guidedSession: 2,
    completedGuidedSessions: ["gtr-d01"],
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedPlan: {
              num: 2,
              title: "How guitars get tuned",
              target_duration_min: 10,
              blocks: [
                { type: "warm_engine", duration_sec: 90 },
                { type: "drill", duration_sec: 180 },
                { type: "song", duration_sec: 240 },
                { type: "cooldown", duration_sec: 90 }
              ]
            },
            totalGuidedSessions: 30,
            completedGuidedSessions: 1,
            guidedShellDurationSec: 600
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "songSlice"
        }
      };
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Resume Guided Session") >= 0);
  assert.ok(html.indexOf("Guided Session Flow") >= 0);
  assert.ok(html.indexOf("Your live guided shell is the plan right now.") >= 0);
  assert.ok(html.indexOf("How guitars get tuned") >= 0);
  assert.ok(html.indexOf("In progress - Song block") >= 0);
  assert.strictEqual(html.indexOf("No practice plan yet."), -1);
});

test("practiceTab prefers the active core plan when the practice bridge is unavailable", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    practicePlan: {
      focus: "Cached focus",
      completedItems: 0,
      totalItems: 1,
      items: [{ id: "cached_1", label: "Cached Warmup", desc: "cached", completed: false }]
    }
  };
  global.SparkPracticeBridge = undefined;
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "daily_practice",
          _legacyPlan: {
            focus: "Core focus",
            completedItems: 0,
            totalItems: 1,
            items: [{ id: "core_1", label: "Core Warmup", desc: "core", completed: false }]
          }
        }
      };
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("Core Warmup") >= 0);
  assert.strictEqual(html.indexOf("Cached Warmup"), -1);
});

test("practiceTab embedded plan rows keep action buttons from crowding item copy", function() {
  global.S.practicePlan = {
    focus: "Long labels",
    completedItems: 0,
    totalItems: 1,
    items: [{
      id: "long_1",
      label: "Replay the performance phrase with an unusually long title",
      desc: "Low recent performance accuracy",
      completed: false
    }]
  };

  var html = practiceTab();
  var styles = loadJS("styles.css");

  assert.ok(html.indexOf("practice-summary-item") >= 0);
  assert.ok(html.indexOf("practice-summary-copy") >= 0);
  assert.ok(styles.indexOf(".practice-summary-item") >= 0);
  assert.ok(styles.indexOf(".practice-summary-copy") >= 0);
  assert.ok(styles.indexOf(".practice-summary-item .btn") >= 0);
  assert.ok(styles.indexOf("flex-wrap:wrap") >= 0);
});

test("practiceTab card micro-headings use lighter dashboard typography", function() {
  global.S.lastChordName = "Em";
  global.S.practicePlan = {
    focus: "Song mastery",
    completedItems: 0,
    totalItems: 1,
    items: [{ id: "plan_1", label: "Warmup", desc: "Start light", completed: false }]
  };

  var html = practiceTab();
  var styles = loadJS("styles.css");

  assert.ok(html.indexOf("practice-card-heading") >= 0);
  assert.ok(html.indexOf("practice-quick-title") >= 0);
  assert.ok(styles.indexOf(".practice-card-heading") >= 0);
  assert.ok(styles.indexOf(".practice-quick-title") >= 0);
  assert.ok(styles.indexOf("font-weight:700") >= 0);
  assert.strictEqual(html.indexOf("font-size:16px;font-weight:900;color:#fff\">Pick Up Where You Left Off"), -1);
  assert.strictEqual(html.indexOf("font-size:15px;font-weight:800;color:var(--text-primary)\">&#128221; Today"), -1);
});

test("legacy practice helper cards use shared visual contract classes", function() {
  var statsHtml = renderPracticeStatsCard({
    streak: 3,
    todayMinutes: 12,
    totalMinutes: 90
  });
  var rowsHtml = renderPracticePlanRows({
    items: [
      { id: "plan_1", label: "Warmup", desc: "Start light", completed: false }
    ]
  });

  assert.ok(statsHtml.indexOf("card-section-heading") >= 0);
  assert.ok(statsHtml.indexOf("metric-label") >= 0);
  assert.ok(statsHtml.indexOf("metric-value") >= 0);
  assert.ok(rowsHtml.indexOf("card-section-heading") >= 0);
  assert.ok(rowsHtml.indexOf("split-row") >= 0);
  assert.strictEqual(statsHtml.indexOf("<b>Practice Stats</b>"), -1);
  assert.strictEqual(rowsHtml.indexOf("<b>Today's Practice Plan</b>"), -1);
});

test("practiceTab treats malformed cached plan shells without array items as empty state", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlan: {
      focus: "Song mastery",
      items: { length: 1, 0: { id: "bad_1", label: "Broken Row" } }
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };

  var html = practiceTab();
  assert.ok(html.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(html.indexOf("Broken Row"), -1);
});

test("practiceTab and planPage treat null-only cached plan arrays as empty state", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [null, null]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
});

test("practiceTab and practicePage treat empty-object cached plan rows as missing items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [{}, {}]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var fullHtml = practicePage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(fullHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(fullHtml.indexOf(">Unavailable<"), -1);
});

test("practiceTab and practicePage treat object-only meta shells as missing items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [{ meta: { songTitle: { bad: true } } }]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var fullHtml = practicePage();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(fullHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(fullHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
});

test("practiceTab and practicePage treat boolean-only meta shells as missing items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [{ meta: { songTitle: false, skill: true } }]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var fullHtml = practicePage();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(fullHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(fullHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
  // Guard against the boolean meta leaking into rendered text CONTENT. Strip all
  // tags first so legitimate attribute VALUES (e.g. the goal selector's
  // aria-pressed="false"/"true") are ignored, while still catching a boolean that
  // leaks anywhere in the visible text (incl. concatenated, e.g. "Focus: false").
  assert.strictEqual(practiceHtml.replace(/<[^>]*>/g, " ").indexOf("false"), -1);
  assert.strictEqual(planHtml.replace(/<[^>]*>/g, " ").indexOf("true"), -1);
});

test("practiceTab and practicePage treat array-shaped meta shells as missing items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [{ meta: ["stale"] }]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var fullHtml = practicePage();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(fullHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(fullHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
});

test("practiceTab and practicePage treat numeric-only meta shells as missing items", function() {
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [{ meta: { songTitle: 0, exerciseFocus: 3 } }]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var practiceHtml = practiceTab();
  var fullHtml = practicePage();
  var planHtml = planPage();

  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(fullHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(fullHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(planHtml.indexOf(">Unavailable<"), -1);
  assert.strictEqual(practiceHtml.indexOf(">0<"), -1);
  assert.strictEqual(planHtml.indexOf(">3<"), -1);
});

test("practiceTab, practicePage, and planPage treat whitespace-only label shells as missing items", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 1,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: {
      focus: "Song mastery",
      items: [{ label: "   " }, { type: "   " }]
    }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var practiceHtml = practicePage();
  var planHtml = planPage();

  assert.ok(summaryHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(practiceHtml.indexOf("No practice plan yet.") >= 0);
  assert.ok(planHtml.indexOf("No practice plan yet.") >= 0);
});

test("shared guided plan surfaces stay honest when the active shell has no duration or block metadata", function() {
  global.getPracticeStats = function() {
    return { streak: 3, todayMinutes: 5, totalMinutes: 42 };
  };
  global.S = {
    level: 1,
    selectedLevel: 1,
    xp: 12,
    streak: 3,
    sessions: 2,
    chordProgress: { C: 100 },
    todayPracticeSeconds: 300,
    dailyGoalMinutes: 10,
    goalReachedToday: false,
    goalStreak: 1,
    tab: "practice",
    customSets: [],
    earnedBadges: [],
    importMsg: null,
    lastChordName: null,
    guidedSession: 2,
    completedGuidedSessions: [],
    practicePlanComplete: false,
    practicePlan: null
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedSession: 2,
            guidedPlan: {
              num: 2,
              title: "How guitars get tuned"
            }
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "songSlice",
          guidedNewMovePhase: null
        }
      };
    }
  };
  loadVM("js/pages/plan.js");

  var summaryHtml = practiceTab();
  var planHtml = planPage();

  assert.ok(summaryHtml.indexOf("Guided Session Flow") >= 0);
  assert.ok(summaryHtml.indexOf("How guitars get tuned") >= 0);
  assert.ok(summaryHtml.indexOf("In progress - Song block") >= 0);
  assert.ok(summaryHtml.indexOf("Guided shell") >= 0);
  assert.strictEqual(summaryHtml.indexOf("4 blocks"), -1);
  assert.strictEqual(summaryHtml.indexOf("10 min shell"), -1);
  assert.ok(planHtml.indexOf("Guided Session Flow") >= 0);
  assert.ok(planHtml.indexOf("Resume Guided Session") >= 0);
  assert.ok(planHtml.indexOf("Guided shell") >= 0 || planHtml.indexOf("Shell details loading") >= 0);
  assert.strictEqual(planHtml.indexOf("4 blocks"), -1);
  assert.strictEqual(planHtml.indexOf("10 min shell"), -1);
});

test("sv2HomeDashboard uses instrumentType when the rehydrated module does not expose instrument", function() {
  var themeRequests = [];
  SparkTheme.get = function(instrument) {
    themeRequests.push(instrument);
    return { ok: true };
  };
  SparkInstruments.getAll = function() {
    return [{
      id: "pianospark",
      appId: "pianospark",
      instrumentType: "piano",
      name: "Piano",
      icon: "\uD83C\uDFB9",
      tabs: [{ id: "practice", label: "Practice", icon: "\uD83C\uDFB9" }],
      tabRenderers: {
        practice: function() { return "<div>Piano Practice</div>"; }
      },
      getData: function() {
        return {
          LN: { 1: "First Keys" },
          ALL_CHORDS: [{ name: "C" }]
        };
      }
    }];
  };

  sv2HomeDashboard();

  assert.strictEqual(themeRequests[0], "piano");
});

if (process.exitCode) process.exit(process.exitCode);
