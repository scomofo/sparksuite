var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment(activeAppId) {
  var pianoModule = {
    id: "pianospark",
    appId: "pianospark",
    instrument: "piano",
    getData: function() {
      return {
        CURRICULUM: [{ num: 1, title: "First Keys", desc: "Start here", icon: "P" }],
        BADGES: [{ id: "starter", label: "Starter", desc: "Begin", check: function() { return true; } }],
        SONGS: [{
          title: "Moonlight",
          artist: "Suite",
          level: 1,
          bpm: 72,
          chords: ["C"],
          progression: ["C"]
        }],
        LC: { 1: "#3366ff" },
        CHORD_COLORS: { major: "#3366ff" },
        DAILY_TYPES: [{ id: "daily", name: "Daily", desc: "Test" }],
        FINGER_EXERCISES: [],
        FINGER_BADGES: []
      };
    }
  };
  var guitarModule = {
    id: "chordspark",
    appId: "chordspark",
    instrument: "guitar",
    getData: function() {
      return {
        ALL_CHORDS: [
          { name: "C", short: "C" },
          { name: "G", short: "G" }
        ]
      };
    }
  };
  var bassModule = {
    id: "bassspark",
    appId: "bassspark",
    instrument: "bass",
    getData: function() {
      return {
        ALL_CHORDS: [{ name: "C", short: "C" }],
        SESSIONS: [{
          num: 1,
          title: "Bass Basics",
          level: 1,
          bpm: 70,
          spark: { text: "Start" },
          newMove: { chord: "C" }
        }]
      };
    }
  };

  global.window = global;
  global.document = {
    body: { appendChild: function() {} },
    getElementById: function() { return null; },
    createElement: function() {
      return {
        setAttribute: function() {},
        classList: { add: function() {}, remove: function() {} }
      };
    }
  };
  global.navigator = {};
  global.S = {
    xp: 12,
    streak: 3,
    darkMode: false,
    onboardingComplete: false,
    currentSession: 1,
    tab: "practice",
    level: 1,
    dailyGoal: 10,
    dailyPracticed: 120,
    customSets: [],
    focusMode: false,
    earned: [],
    chordProg: { C: 40 },
    songIdx: null,
    songFilter: "",
    songSort: "level",
    songSortAsc: true,
    completedSessions: [],
    personalBests: {},
    fingerExercisesDone: 0,
    history: [],
    _gameTab: "drill",
    _toolTab: "stats",
    guidedSession: 1
  };
  global.T = {};
  global.SCR = {
    GUIDED: "guided",
    DRILL: "drill",
    SESSION: "session"
  };
  global.escHTML = function(value) { return String(value); };
  global.render = function() {};
  global.saveState = function() {};
  global.snd = function() {};
  global.tickD = function() {};
  global.tickS = function() {};
  global.trigC = function() {};
  global.act = function() {};
  global.playSound = function() {};
  global.pianoClickableDiv = function(action, content) {
    return "<div data-action=\"" + action + "\">" + content + "</div>";
  };
  global.pianoIfThenCard = function(text) { return "<div>" + text + "</div>"; };
  global.practicePlanSection = function() { return "<div>Plan</div>"; };
  global.getCurrentSessionPlan = function() {
    return { num: 1, title: "Warmup", level: 1 };
  };
  global.getCurrentLevel = function() {
    return { num: 1, title: "First Keys", desc: "Start here", icon: "P" };
  };
  global.chordsUpToLevel = function() {
    return [{ short: "C", color: "#3366ff" }];
  };
  global.chordsForLevel = function() {
    return [{ short: "C", color: "#3366ff" }];
  };
  global.findChord = function(name) {
    return { short: name, color: "#3366ff", type: "major" };
  };
  global.pianoTierBadgeHTML = function() { return "<span>tier</span>"; };
  global.pianoSVG = function() { return "<div class=\"piano-svg\"></div>"; };
  global.pianoFormatTime = function(value) { return String(value); };
  global.PLAY_STYLES = [];
  global.KEYBOARD_SIZES = [];
  global.getMidiInputNames = function() { return []; };
  global.exportState = function() {};
  global.isRecording = function() { return false; };
  global.SparkSession = {
    processResults: function() {
      return { xpEarned: 10, leveledUp: false, jackpot: false };
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: activeAppId };
    },
    getAll: function() {
      return [pianoModule, guitarModule, bassModule];
    }
  };
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Instrument Specific Surface Resolution ---");

test("piano surfaces rehydrate an app-id-only active instrument shell", function() {
  resetEnvironment("pianospark");
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/games.js"));
  global.eval(loadJS("js/instruments/piano/pages/onboarding.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));
  global.eval(loadJS("js/instruments/piano/pages/songs.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));

  assert.ok(pianoPracticeTab().indexOf("First Keys") >= 0);
  assert.ok(pianoSongsTab().indexOf("Moonlight") >= 0);
  assert.ok(pianoGamesTab().indexOf("Chord Drill") >= 0);
  assert.ok(statsTab().indexOf("Starter") >= 0);
  assert.strictEqual(levelColor(1), "#3366ff");
  assert.deepStrictEqual(pianoCheckBadges(), ["starter"]);
});

test("piano interactive surface tiles expose keyboard handlers", function() {
  var gamesSource = loadJS("js/instruments/piano/pages/games.js");
  var onboardingSource = loadJS("js/instruments/piano/pages/onboarding.js");
  var practiceSource = loadJS("js/instruments/piano/pages/practice.js");
  var songsSource = loadJS("js/instruments/piano/pages/songs.js");
  var toolsSource = loadJS("js/instruments/piano/pages/tools.js");

  assert.ok(gamesSource.indexOf('role="button" tabindex="0"') >= 0);
  assert.ok(gamesSource.indexOf("act(\\'pianoGameTab\\',") >= 0);
  assert.ok(onboardingSource.indexOf('keyboard-size-btn') >= 0 && onboardingSource.indexOf('onkeydown="if(event.key===\\\'Enter\\\'||event.key===\\\' \\') >= 0);
  assert.ok(practiceSource.indexOf('act(\\\'view_level\\\',') >= 0 && practiceSource.indexOf('role="button" tabindex="0"') >= 0);
  assert.ok(songsSource.indexOf("act(\\'pianoSongTab\\',") >= 0);
  assert.ok(songsSource.indexOf('style-header" role="button" tabindex="0"') >= 0);
  assert.ok(toolsSource.indexOf("act(\\'pianoToolTab\\',") >= 0);
  assert.ok(toolsSource.indexOf('role="button" tabindex="0"') >= 0);
  assert.ok(toolsSource.indexOf('onclick="act(\\\'exportProgress\\\')"') >= 0);
  assert.ok(toolsSource.indexOf('onclick="act(\\\'pianoConfirmResetProgress\\\')"') >= 0);
});

test("older shared surfaces use classed headings instead of raw bold labels", function() {
  [
    "js/analytics/dashboard.js",
    "js/home/home_cards.js",
    "js/insights/ui.js",
    "js/settings/settings_ui.js",
    "js/curriculum/curriculum_ui.js",
    "js/import/midi_ui.js",
    "js/progression/progress_ui.js",
    "js/instruments/piano/pages/analytics.js"
  ].forEach(function(file) {
    var source = loadJS(file);
    assert.strictEqual(source.indexOf("<b>"), -1, file);
    assert.strictEqual(source.indexOf("</b>"), -1, file);
  });

  assert.ok(loadJS("js/analytics/dashboard.js").indexOf('class="card-section-heading"') >= 0);
  assert.ok(loadJS("js/home/home_cards.js").indexOf('class="card-section-heading"') >= 0);
  assert.ok(loadJS("js/insights/ui.js").indexOf('class="card-micro-heading"') >= 0);
  assert.ok(loadJS("js/instruments/piano/pages/analytics.js").indexOf('class="card-micro-heading"') >= 0);
});

test("piano practice tab ignores stale curriculum and custom set labels", function() {
  resetEnvironment("pianospark");
  global.getPianoPageInstrument = function() {
    return {
      getData: function() {
        return {
          CURRICULUM: [{ num: 1, title: "undefined", desc: "null", tip: "NaN", icon: "P" }],
          BADGES: [{ id: "starter", label: "Starter", desc: "undefined", icon: "null", check: function() { return true; } }],
          SONGS: [],
          LC: { 1: "#3366ff" },
          CHORD_COLORS: { major: "#3366ff" },
          DAILY_TYPES: [],
          FINGER_EXERCISES: [],
          FINGER_BADGES: []
        };
      }
    };
  };
  global.S.customSets = [{ name: "undefined", chords: ["C"] }];
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = pianoPracticeTab();
  assert.ok(html.indexOf("Guided session") >= 0 || html.indexOf("Warmup") >= 0);
  assert.ok(html.indexOf("Level 1") >= 0);
  assert.ok(html.indexOf("Custom Set (1)") >= 0);
  assert.ok(html.indexOf("🏅") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano practice quick start resumes an active guided shell when the session matches", function() {
  resetEnvironment("pianospark");
  global.getCurrentSessionPlan = function() {
    return {
      num: 1,
      title: "Warmup",
      level: 1
    };
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedSession: 1,
            guidedShellDurationSec: 600,
            guidedPlan: {
              num: 1,
              title: "First sound in 2 minutes",
              level: 1,
              blocks: [
                { type: "warm_engine", duration_sec: 90 },
                { type: "drill", duration_sec: 180 },
                { type: "song", duration_sec: 240 },
                { type: "cooldown", duration_sec: 90 }
              ],
              focus_song: "Horse With No Name",
              new_elements: ["open-string strum"]
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
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = pianoPracticeTab();
  assert.ok(html.indexOf('onclick="act(\'resume_guided_session\')"') >= 0);
  assert.strictEqual(html.indexOf('onclick="act(\'start_guided_session\')"'), -1);
  assert.ok(html.indexOf("In progress - Song block") >= 0);
  assert.ok(html.indexOf("4 blocks") >= 0);
  assert.ok(html.indexOf("10 min shell") >= 0);
  assert.ok(html.indexOf("Song hook: Horse With No Name") >= 0);
  assert.ok(html.indexOf("New move: open-string strum") >= 0);
});

test("piano practice quick start shows V2 shell details for a fresh guided session", function() {
  resetEnvironment("pianospark");
  global.getCurrentSessionPlan = function() {
    return {
      num: 1,
      title: "First sound in 2 minutes",
      level: 1,
      blocks: [
        { type: "warm_engine", duration_sec: 90 },
        { type: "drill", duration_sec: 180 },
        { type: "song", duration_sec: 240 },
        { type: "cooldown", duration_sec: 90 }
      ],
      focus_song: "Horse With No Name",
      new_elements: ["open-string strum"]
    };
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return null;
    }
  };
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = pianoPracticeTab();
  assert.ok(html.indexOf('onclick="act(\'start_guided_session\')"') >= 0);
  assert.ok(html.indexOf("4 blocks") >= 0);
  assert.ok(html.indexOf("10 min shell") >= 0);
  assert.ok(html.indexOf("Song hook: Horse With No Name") >= 0);
  assert.ok(html.indexOf("New move: open-string strum") >= 0);
});

test("piano practice quick start stays honest when guided shell metadata is thin", function() {
  resetEnvironment("pianospark");
  global.getCurrentSessionPlan = function() {
    return {
      num: 1,
      title: "How guitars get tuned",
      level: 1
    };
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedSession: 1,
            guidedPlan: {
              num: 1,
              title: "How guitars get tuned",
              level: 1
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
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = pianoPracticeTab();
  assert.ok(html.indexOf('onclick="act(\'resume_guided_session\')"') >= 0);
  assert.ok(html.indexOf("How guitars get tuned") >= 0);
  assert.ok(html.indexOf("In progress - Song block") >= 0);
  assert.ok(html.indexOf("Guided shell") >= 0);
  assert.strictEqual(html.indexOf("4 blocks"), -1);
  assert.strictEqual(html.indexOf("10 min shell"), -1);
});

test("piano onboarding and tools ignore stale intention strings", function() {
  resetEnvironment("pianospark");
  global.S.practiceIntention = "undefined";
  global.S.dailyGoal = "NaN";
  global.S.volume = { broken: true };
  global.S.reverbAmount = "null";
  global.S.a4Tuning = [];
  global.S.onboardingStep = 3;
  global.S._toolTab = "settings";
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/onboarding.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));

  var onboardingHtml = pianoOnboardingPage();
  assert.ok(onboardingHtml.indexOf('value="undefined"') === -1);

  global.S.practiceIntention = "null";
  global.S.onboardingStep = 4;
  onboardingHtml = pianoOnboardingPage();
  assert.ok(onboardingHtml.indexOf("When I null") === -1);

  var toolsHtml = pianoToolsTab();
  assert.ok(toolsHtml.indexOf('value="null"') === -1);
  assert.ok(toolsHtml.indexOf("Daily Goal: 10 min") >= 0);
  assert.ok(toolsHtml.indexOf("Volume: 100%") >= 0);
  assert.ok(toolsHtml.indexOf("Reverb: 0%") >= 0);
  assert.ok(toolsHtml.indexOf("A4 tuning: 440 Hz") >= 0);
  assert.ok(toolsHtml.indexOf("NaN") === -1);

  global.S.practiceIntention = "undefined";
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));
  var practiceHtml = pianoPracticeTab();
  assert.ok(practiceHtml.indexOf("When I undefined") === -1);
});

test("piano header ignores stale numeric badges", function() {
  resetEnvironment("pianospark");
  global.S.xp = "undefined";
  global.S.currentSession = { broken: true };
  global.S.streak = "NaN";
  global.S.onboardingComplete = true;
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));

  var html = pianoHeaderHTML();
  assert.ok(html.indexOf("0 XP") >= 0);
  assert.ok(html.indexOf("S0/50") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano placement test ignores stale prompt text", function() {
  resetEnvironment("pianospark");
  global.S._placementIdx = 0;
  global.PLACEMENT_TESTS = [{ prompt: "undefined" }];
  global.eval(loadJS("js/instruments/piano/pages/onboarding.js"));

  var html = placementTestPage();
  assert.ok(html.indexOf("Try this chord or pattern.") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
});

test("piano tools stats ignore stale history labels", function() {
  resetEnvironment("pianospark");
  global.S._toolTab = "stats";
  global.S.xp = "NaN";
  global.S.streak = { broken: true };
  global.S.level = "undefined";
  global.S.completedSessions = { broken: true };
  global.S.personalBests = { bpm: "null", streak: [] };
  global.S.history = { broken: true };
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));
  global.getPianoPageInstrument = function() {
    return {
      getData: function() {
        return {
          BADGES: [{ id: "starter", label: "undefined", desc: "null", icon: "NaN" }]
        };
      }
    };
  };

  var html = pianoToolsTab();
  assert.ok(html.indexOf(">0<") >= 0);
  assert.ok(html.indexOf('>0</div><div class="stat-label">Sessions</div>') >= 0);
  assert.ok(html.indexOf("0/8") >= 0);
  assert.ok(html.indexOf("No activity yet") >= 0);
  assert.ok(html.indexOf("Invalid Date") === -1);
  assert.ok(html.indexOf("Badge") >= 0);
  assert.ok(html.indexOf("Keep practicing") >= 0);
  assert.ok(html.indexOf("🏅") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano clips tab ignores stale clip timestamps, durations, and urls", function() {
  resetEnvironment("pianospark");
  global.S._toolTab = "clips";
  global.S.practiceClips = [
    { ts: "not-a-date", duration: "NaN", url: "undefined" }
  ];
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/tools.js"));

  var html = pianoToolsTab();
  assert.ok(html.indexOf("Unknown time") >= 0);
  assert.ok(html.indexOf(">->") >= 0 || html.indexOf(">-<") >= 0);
  assert.ok(html.indexOf("Unavailable") >= 0);
  assert.ok(html.indexOf("undefined") === -1);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano songs library ignores stale sentinel search text", function() {
  resetEnvironment("pianospark");
  global.S.songFilter = "undefined";
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/songs.js"));

  var html = pianoSongsTab();
  assert.ok(html.indexOf('value="undefined"') === -1);
  assert.ok(html.indexOf('matching “undefined”') === -1);
});

test("piano practice tab ignores malformed mastery percentages", function() {
  resetEnvironment("pianospark");
  global.getAverageMastery = function(kind) {
    return kind === "rhythm" ? "NaN" : { broken: true };
  };
  global.eval(loadJS("js/instruments/piano/pages/shared.js"));
  global.eval(loadJS("js/instruments/piano/ui.js"));
  global.eval(loadJS("js/instruments/piano/pages/practice.js"));

  var html = pianoPracticeTab();
  assert.ok(html.indexOf("Chords: 0%") >= 0);
  assert.ok(html.indexOf("Rhythm: 0%") >= 0);
  assert.ok(html.indexOf("Transitions: 0%") >= 0);
  assert.ok(html.indexOf("Scales: 0%") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("guitarAct rehydrates an app-id-only active instrument shell", function() {
  resetEnvironment("chordspark");
  global.eval(loadJS("js/instruments/guitar/app.js"));
  guitarAct("drillTransition", "C|G");
  assert.strictEqual(S.drillChords.length, 2);
  assert.strictEqual(S.drillChords[0].name, "C");
  assert.strictEqual(S.drillChords[1].name, "G");
});

test("bassAct rehydrates an app-id-only active instrument shell", function() {
  resetEnvironment("bassspark");
  global.eval(loadJS("js/instruments/bass/app.js"));
  bassAct("guidedStart", "1");
  assert.strictEqual(S.guidedPlan.title, "Bass Basics");
  assert.strictEqual(S.screen, SCR.GUIDED);
});

test("practice guided session card falls back to curriculum v2 when legacy sessions are absent", function() {
  resetEnvironment("chordspark");
  global.sparkCore = undefined;
  global.eval(loadJS("js/utils/normalize.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2.js"));
  global.eval(loadJS("js/pages/practice.js"));

  var html = renderPracticeGuidedSessionCard({});
  assert.ok(html.indexOf("Guided Session 1") >= 0);
  assert.ok(html.indexOf("First sound in 2 minutes") >= 0);
  assert.ok(html.indexOf("0/30 done") >= 0);
  assert.ok(html.indexOf("4 blocks • 10 min shell") >= 0);
  assert.ok(html.indexOf("Song hook: \"Horse\" intro, open strings only") >= 0);
  assert.ok(html.indexOf("New move: open-string-strum") >= 0);
  assert.ok(html.indexOf("Start 10-Min Session") >= 0);
});

test("practice guided session card can resolve sparkCore from the global binding", function() {
  resetEnvironment("chordspark");
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedPlan: {
              num: 1,
              title: "First sound in 2 minutes",
              level: 1,
              target_duration_min: 10,
              focus_song: "\"Horse\" intro, open strings only",
              new_elements: ["open-string-strum"],
              blocks: [
                { type: "warm_engine", duration_sec: 90 },
                { type: "drill", duration_sec: 180 },
                { type: "song", duration_sec: 240 },
                { type: "cooldown", duration_sec: 90 }
              ]
            },
            totalGuidedSessions: 30
          }
        }
      };
    }
  };
  global.eval(loadJS("js/pages/practice.js"));

  var html = renderPracticeGuidedSessionCard({});
  assert.ok(html.indexOf("Guided Session 1") >= 0);
  assert.ok(html.indexOf("First sound in 2 minutes") >= 0);
  assert.ok(html.indexOf("0/30 done") >= 0);
  assert.ok(html.indexOf("4 blocks • 10 min shell") >= 0);
  assert.ok(html.indexOf("Song hook: \"Horse\" intro, open strings only") >= 0);
  assert.ok(html.indexOf("New move: open-string-strum") >= 0);
  assert.ok(html.indexOf("Start 10-Min Session") >= 0);
});

test("practice guided session card shows resume state for an active guided runtime", function() {
  resetEnvironment("chordspark");
  global.window = {};
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedPlan: {
              num: 2,
              title: "How guitars get tuned",
              level: 1,
              target_duration_min: 10,
              focus_song: "same",
              new_elements: ["use-the-tuner"],
              blocks: [
                { type: "warm_engine", duration_sec: 90 },
                { type: "drill", duration_sec: 180 },
                { type: "song", duration_sec: 240 },
                { type: "cooldown", duration_sec: 90 }
              ]
            },
            totalGuidedSessions: 30,
            completedGuidedSessions: 1
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "newMove",
          guidedNewMovePhase: "shadow"
        }
      };
    }
  };
  global.eval(loadJS("js/pages/practice.js"));

  var html = renderPracticeGuidedSessionCard({});
  assert.ok(html.indexOf("Guided Session 2") >= 0);
  assert.ok(html.indexOf("1/30 done") >= 0);
  assert.ok(html.indexOf("In progress - shadow") >= 0);
  assert.ok(html.indexOf("Resume 10-Min Session") >= 0);
  assert.ok(html.indexOf("act('resume_guided_session')") >= 0);
});

test("practice guided session and track cards do not invent shell details when metadata is missing", function() {
  resetEnvironment("chordspark");
  global.window = {};
  global.eval(loadJS("js/utils/normalize.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2.js"));
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedPlan: {
              num: 2,
              title: "How guitars get tuned",
              level: 1
            },
            totalGuidedSessions: 30,
            completedGuidedSessions: 1
          }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "newMove",
          guidedNewMovePhase: "shadow"
        }
      };
    }
  };
  global.eval(loadJS("js/pages/practice.js"));

  var guidedHtml = renderPracticeGuidedSessionCard({});
  var trackHtml = renderPracticeCurriculumV2Card({
    instrument: "guitar"
  });
  var quickStartHtml = renderPracticeQuickStartCard();

  assert.ok(guidedHtml.indexOf("Guided Session 2") >= 0);
  assert.ok(guidedHtml.indexOf("In progress - shadow") >= 0);
  assert.ok(guidedHtml.indexOf("Resume Session") >= 0);
  assert.strictEqual(guidedHtml.indexOf("4 blocks"), -1);
  assert.strictEqual(guidedHtml.indexOf("10 min shell"), -1);
  assert.ok(trackHtml.indexOf("Track Rhythm") >= 0);
  assert.ok(trackHtml.indexOf("shadow") >= 0);
  assert.strictEqual(trackHtml.indexOf("4 blocks"), -1);
  assert.strictEqual(trackHtml.indexOf("10 min shell"), -1);
  assert.ok(quickStartHtml.indexOf("Guided Session Live") >= 0);
  assert.ok(quickStartHtml.indexOf("In progress - shadow") >= 0);
  assert.strictEqual(quickStartHtml.indexOf("4 blocks"), -1);
});

test("practice curriculum v2 card shows track progress instead of duplicating the launcher hook", function() {
  resetEnvironment("chordspark");
  global.sparkCore = undefined;
  global.eval(loadJS("js/utils/normalize.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2.js"));
  global.eval(loadJS("js/pages/practice.js"));

  var html = renderPracticeCurriculumV2Card({
    instrument: "guitar"
  });
  assert.ok(html.indexOf("Phase 1 Track") >= 0);
  assert.ok(html.indexOf("0 of 30 sessions completed") >= 0);
  assert.ok(html.indexOf("Up Next") >= 0);
  assert.ok(html.indexOf("Day 1: First sound in 2 minutes") >= 0);
  assert.ok(html.indexOf("Track Rhythm") >= 0);
  assert.ok(html.indexOf("4 blocks • 10 min shell") >= 0);
  assert.ok(html.indexOf("Unlock Path") >= 0);
  assert.ok(html.indexOf("Unlock path: ready now") >= 0);
  assert.ok(html.indexOf("Fresh start") >= 0);
  assert.ok(html.indexOf("Day 1 is ready when you are.") >= 0);
  assert.ok(html.indexOf("After that: Day 2 - How guitars get tuned") >= 0);
  assert.ok(html.indexOf("Song focus:") === -1);
  assert.ok(html.indexOf("New element:") === -1);
});

test("practice curriculum v2 card shows live guided runtime context when a session is already active", function() {
  resetEnvironment("chordspark");
  global.window = {};
  global.eval(loadJS("js/utils/normalize.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2.js"));
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: {
            guidedPlan: {
              num: 2,
              title: "How guitars get tuned",
              level: 1,
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
          guidedStep: "newMove",
          guidedNewMovePhase: "shadow"
        }
      };
    }
  };
  global.eval(loadJS("js/pages/practice.js"));

  var html = renderPracticeCurriculumV2Card({
    instrument: "guitar"
  });
  assert.ok(html.indexOf("Live now: Day 2: How guitars get tuned") >= 0);
  assert.ok(html.indexOf("Track Rhythm") >= 0);
  assert.ok(html.indexOf("shadow • 4 blocks • 10 min shell") >= 0);
  assert.ok(html.indexOf("Unlock path: Day 2 in motion") >= 0);
  assert.ok(html.indexOf("Session in motion") >= 0);
  assert.ok(html.indexOf("In progress - shadow. Resume when you're ready.") >= 0);
  assert.ok(html.indexOf("After this: Day 3 - The D chord") >= 0);
});

test("practice curriculum v2 surfaces react to canonical completion state", function() {
  resetEnvironment("chordspark");
  global.S.curriculumV2CompletedSessions = {
    guitar: ["gtr-d01"]
  };
  global.sparkCore = undefined;
  global.eval(loadJS("js/utils/normalize.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2_data.generated.js"));
  global.eval(loadJS("js/curriculum/curriculum_v2.js"));
  global.eval(loadJS("js/pages/practice.js"));

  var guidedHtml = renderPracticeGuidedSessionCard({});
  var trackHtml = renderPracticeCurriculumV2Card({
    instrument: "guitar"
  });
  assert.ok(guidedHtml.indexOf("Guided Session 2") >= 0);
  assert.ok(guidedHtml.indexOf("How guitars get tuned") >= 0);
  assert.ok(guidedHtml.indexOf("1/30 done") >= 0);
  assert.ok(trackHtml.indexOf("1 of 30 sessions completed") >= 0);
  assert.ok(trackHtml.indexOf("Day 2: How guitars get tuned") >= 0);
  assert.ok(trackHtml.indexOf("Unlock path: Day 1 already banked") >= 0);
  assert.ok(trackHtml.indexOf("New move day") >= 0);
  assert.ok(trackHtml.indexOf("You've banked 1 sessions. Day 2 is next.") >= 0);
});

test("practice quick start card favors an active guided runtime over stale chord resume state", function() {
  resetEnvironment("chordspark");
  global.window = {};
  global.S.lastChordName = "Em";
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
  global.eval(loadJS("js/pages/practice.js"));

  var html = renderPracticeQuickStartCard();
  assert.ok(html.indexOf("Guided Session Live") >= 0);
  assert.ok(html.indexOf("How guitars get tuned") >= 0);
  assert.ok(html.indexOf("In progress - Song block • 4 blocks") >= 0);
  assert.ok(html.indexOf("Resume Guided") >= 0);
  assert.ok(html.indexOf("Quick Chord") >= 0);
  assert.strictEqual(html.indexOf("Pick Up Where You Left Off"), -1);
});

test("shared session helpers can resolve sparkCore from the global binding", function() {
  resetEnvironment("chordspark");
  global.window = {};
  global.FINGER_EXERCISES = [{
    id: "spider",
    name: "Spider Walk",
    desc: "Warm up evenly",
    tier: 1,
    duration: 90,
    frequency: "daily",
    goal: "Stay relaxed"
  }];
  global.getExpectedNotes = function() { return ["C", "E", "G"]; };
  global.getCoachFeedback = function() { return []; };
  global.ringHTML = function(value) { return "<div class=\"ring\">" + String(value) + "</div>"; };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          chordDetectActive: true,
          chordDetectNotes: ["C", "E"],
          chordDetectMatch: 92,
          chordDetectError: "",
          legacyFingerExerciseActive: true,
          legacyFingerExerciseId: "spider",
          legacyPracticeRemainingSec: 45,
          legacyFingerExerciseCount: 2
        }
      };
    }
  };
  global.eval(loadJS("js/utils/normalize.js"));
  global.eval(loadJS("js/pages/shared.js"));

  var runtime = getLegacyChordDetectRuntime();
  var fingerHtml = fingerExerciseCard();

  assert.strictEqual(runtime.active, true);
  assert.deepStrictEqual(runtime.notes, ["C", "E"]);
  assert.strictEqual(runtime.match, 92);
  assert.ok(fingerHtml.indexOf("Spider Walk") >= 0);
  assert.ok(fingerHtml.indexOf("0:45") >= 0);
  assert.ok(fingerHtml.indexOf("Completed 2x") >= 0);
  assert.ok(fingerHtml.indexOf("card live-timer-surface") >= 0);
});

test("songs surfaces can resolve sparkCore from the global binding", function() {
  resetEnvironment("chordspark");
  var connectedReturnTo = null;
  global.window = {
    location: { href: "https://sparksuite.local/app?songs=1" }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          stemPlaying: true,
          stemCurrentTime: 12,
          stemDuration: 48
        }
      };
    },
    getRuntimeState: function() {
      return {
        spotifyPlaylistConnected: true,
        spotifyPlaylistPlaylists: [{
          curriculum_key: "guitar_core",
          playlist_name: "SparkSuite - Guitar"
        }],
        spotifyPlaylistLastSyncAt: "2026-04-22T20:00:00.000Z",
        spotifyPlaylistLastResult: { addedCount: 2, resolvedCount: 3 },
        spotifyPlaylistUnresolvedTracks: [{ title: "Missing Song", artist: "Unknown" }],
        spotifyPlaylistSyncStatus: "idle",
        spotifyPlaylistError: null
      };
    },
    connectSpotifyPlaylist: function(options) {
      connectedReturnTo = options && options.returnTo;
    }
  };
  global.STEM_NAMES = ["vocals"];
  global.STEM_COLORS = { vocals: "#4ECDC4" };
  global.STEM_ICONS = { vocals: "V" };
  global.formatTime = function(value) { return "0:" + String(value); };
  global.eval(loadJS("js/pages/songs.js"));

  var spotifyState = _getSpotifyPlaylistPanelState();
  var stemsHtml = stemsPage();
  sparkSpotifyPlaylistConnect();

  assert.strictEqual(spotifyState.connected, true);
  assert.strictEqual(spotifyState.playlists.length, 1);
  assert.strictEqual(spotifyState.unresolvedTracks.length, 1);
  assert.ok(stemsHtml.indexOf("0:12 / 0:48") >= 0);
  assert.ok(stemsHtml.indexOf("Pause") >= 0);
  assert.strictEqual(connectedReturnTo, "https://sparksuite.local/app?songs=1");
});

test("piano app confirms reset before dispatching reset", function() {
  resetEnvironment("pianospark");
  var resetCalls = 0;
  global.document.addEventListener = function() {};
  global.document.removeEventListener = function() {};
  global.resetProgress = function() { resetCalls++; };
  global.confirm = function() { return true; };
  global.eval(loadJS("js/instruments/piano/app.js"));

  pianoAct("pianoConfirmResetProgress");
  assert.strictEqual(resetCalls, 1);

  resetCalls = 0;
  global.confirm = function() { return false; };
  pianoAct("pianoConfirmResetProgress");
  assert.strictEqual(resetCalls, 0);
});

if (process.exitCode) process.exit(process.exitCode);
