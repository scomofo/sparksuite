var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


function resetEnv() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.confirm = function() { return true; };
  global.S = {
    guidedPlan: {
      id: "guided_plan_1",
      num: 2,
      title: "undefined",
      level: 1,
      bpm: 72,
      spark: { text: "Start here" }
    },
    guidedStep: "spark",
    newMovePhase: "watch",
    streak: 3,
    completedGuidedSessions: []
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        appId: "chordspark",
        getData: function() { return { ALL_CHORDS: [] }; },
        ui: { chord: function() { return "<div>chord</div>"; } }
      };
    },
    getAll: function() { return []; }
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: { guidedPlan: S.guidedPlan }
        },
        runtimeState: { guidedStep: "spark" },
        lastSessionOutcome: { xpAwarded: 30 }
      };
    }
  };
  global.SparkCurriculumV2 = null;
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/pages/guided.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Guided Page Resolution ---");

test("guided pages ignore stale plan titles", function() {
  var sessionHtml = guidedSessionPage();
  var doneHtml = guidedDonePage();
  assert.ok(sessionHtml.indexOf("guided_plan_1") >= 0);
  assert.ok(doneHtml.indexOf("guided_plan_1") >= 0);
  assert.ok(sessionHtml.indexOf(">undefined<") === -1);
  assert.ok(doneHtml.indexOf(">undefined<") === -1);
});

test("guided page prefers block-aware curriculum v2 copy when present", function() {
  S.guidedPlan = {
    id: "gtr-d01",
    num: 1,
    title: "First sound in 2 minutes",
    level: 1,
    bpm: 80,
    focus_song: "\"Horse\" intro, open strings only",
    blockActivities: {
      warm_engine: { duration_sec: 90, block_type: "warm_engine", focus_song: "\"Horse\" intro, open strings only" },
      drill: {
        duration_sec: 180,
        block_type: "drill",
        kind: "review",
        focus_song: "\"Horse\" intro, open strings only",
        copy: {
          setup: "Use the drill block copy here.",
          success: "Nice. Drill cleaned up.",
          retry: "Let's loop that."
        }
      },
      song: { duration_sec: 240, block_type: "song", focus_song: "\"Horse\" intro, open strings only" }
    },
    spark: { text: "First sound in 2 minutes. warm engine block." },
    newMove: { text: "First sound in 2 minutes. drill block.", chord: "C" },
    songSlice: { text: "First sound in 2 minutes. song block.", song: "\"Horse\" intro, open strings only" }
  };
  var sparkHtml = guidedSessionPage();
  assert.ok(sparkHtml.indexOf("warm engine block") >= 0);
  assert.ok(sparkHtml.indexOf(">2 min<") >= 0);
  assert.ok(sparkHtml.indexOf(">warm engine<") >= 0);
  assert.ok(sparkHtml.indexOf(">\"Horse\" intro, open strings only<") >= 0);
  assert.ok(sparkHtml.indexOf("Into Review") >= 0);
  assert.ok(sparkHtml.indexOf("Warm Engine Live") >= 0);

  S.guidedStep = "newMove";
  S.newMovePhase = "try";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: {
        guidedStep: "newMove",
        guidedNewMovePhase: "try",
        guidedActivityId: "gtr-d01-drill",
        guidedActivityKind: "review",
        guidedBlockType: "drill"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var guidedView = getGuidedSessionView();
  assert.strictEqual(guidedView.activeActivityId, "gtr-d01-drill");
  assert.strictEqual(guidedView.activeActivityKind, "review");
  assert.strictEqual(guidedView.activeBlockType, "drill");
  assert.ok(guidedView.activeActivity);
  assert.strictEqual(guidedView.activeActivity.id, "gtr-d01-drill");
  var newMoveHtml = guidedSessionPage();
  assert.ok(newMoveHtml.indexOf("drill block") >= 0);
  assert.ok(newMoveHtml.indexOf(">3 min<") >= 0);
  assert.ok(newMoveHtml.indexOf(">drill<") >= 0);
  assert.ok(newMoveHtml.indexOf("Use the drill block copy here.") >= 0);
  assert.ok(newMoveHtml.indexOf("Into Refine") >= 0);
  assert.ok(newMoveHtml.indexOf("Drill In Progress") >= 0);

  S.newMovePhase = "watch";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "newMove", guidedNewMovePhase: "watch" },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var watchHtml = guidedSessionPage();
  assert.ok(watchHtml.indexOf("Use the drill block copy here.") >= 0);
  assert.ok(watchHtml.indexOf("Start Shadow") >= 0);

  S.newMovePhase = "refine";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "newMove", guidedNewMovePhase: "refine" },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var refineHtml = guidedSessionPage();
  assert.ok(refineHtml.indexOf("Nice. Drill cleaned up.") >= 0);
  assert.ok(refineHtml.indexOf("Into Song") >= 0);

  S.guidedStep = "songSlice";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "songSlice" },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var songHtml = guidedSessionPage();
  assert.ok(songHtml.indexOf(">4 min<") >= 0);
  assert.ok(songHtml.indexOf(">song<") >= 0);
  assert.ok(songHtml.indexOf("Into Cooldown") >= 0);
  assert.ok(songHtml.indexOf("Song Block Live") >= 0);
});

test("guided page shows block progress from the active v2 session plan", function() {
  S.guidedPlan = {
    id: "gtr-d01",
    num: 1,
    title: "First sound in 2 minutes",
    level: 1,
    bpm: 80,
    spark: { text: "Warm up." },
    newMove: { text: "Try the drill.", chord: "C" },
    songSlice: { text: "Play the song." },
    victoryLap: { text: "Free play." }
  };
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan },
        segments: [
          {
            id: "gtr-d01_warm_engine",
            label: "Warm Engine",
            durationSec: 90,
            completed: true,
            meta: { guidedBlockType: "warm_engine" }
          },
          {
            id: "gtr-d01_drill",
            label: "Drill",
            durationSec: 180,
            completed: false,
            meta: { guidedBlockType: "drill" }
          },
          {
            id: "gtr-d01_song",
            label: "Song Slice",
            durationSec: 240,
            completed: false,
            meta: { guidedBlockType: "song" }
          },
          {
            id: "gtr-d01_cooldown",
            label: "Cooldown",
            durationSec: 90,
            completed: false,
            meta: { guidedBlockType: "cooldown" }
          }
        ]
      },
      runtimeState: {
        guidedStep: "newMove",
        guidedNewMovePhase: "try",
        activeSegmentId: "gtr-d01_drill",
        transport: {
          status: "running",
          positionMs: 90000
        }
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };

  var html = guidedSessionPage();
  assert.ok(html.indexOf("Warm Engine") >= 0);
  assert.ok(html.indexOf("Song Slice") >= 0);
  assert.ok(html.indexOf(">done<") >= 0);
  assert.ok(html.indexOf(">now<") >= 0);
  assert.ok(html.indexOf(">up next<") >= 0);
  assert.ok(html.indexOf(">2 min<") >= 0);
  assert.ok(html.indexOf(">3 min<") >= 0);
  assert.ok(html.indexOf(">4 min<") >= 0);
  assert.ok(html.indexOf("Block 2 of 4") >= 0);
  assert.ok(html.indexOf("Drill") >= 0);
  assert.ok(html.indexOf("Drill In Progress") >= 0);
  assert.ok(html.indexOf("3 min block") >= 0);
  assert.ok(html.indexOf("10 min shell") >= 0);
  assert.ok(html.indexOf("New Move") >= 0);
  assert.ok(html.indexOf("Try 3/4") >= 0);
  assert.ok(html.indexOf("3/10 min through session") >= 0);
  assert.ok(html.indexOf("width:50%") >= 0);
  assert.ok(html.indexOf("1m 30s left") >= 0);
  assert.ok(html.indexOf("7m left") >= 0);
  assert.ok(html.indexOf("About 1m 30s left in this block.") >= 0);
  assert.ok(html.indexOf("onclick=\"act('guidedAdvancePhase')\"") >= 0);
  assert.ok(html.indexOf(">Continue<") >= 0);
  assert.ok(html.indexOf("onclick=\"act('guidedSkipBlock')\"") >= 0);
  assert.ok(html.indexOf(">Skip Drill<") >= 0);
});

test("guided page shows drill subphase progress on the active block card", function() {
  S.guidedPlan = {
    id: "gtr-d02",
    num: 2,
    title: "The D chord",
    level: 1,
    bpm: 80,
    newMove: { text: "Try the shape.", chord: "D" }
  };
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: {
          guidedPlan: S.guidedPlan,
          guidedShellDurationSec: 600
        },
        segments: [
          {
            id: "gtr-d02_warm_engine",
            label: "Warm Engine",
            durationSec: 90,
            completed: true,
            meta: { guidedBlockType: "warm_engine" }
          },
          {
            id: "gtr-d02_drill",
            label: "Drill",
            durationSec: 180,
            completed: false,
            meta: { guidedBlockType: "drill" }
          },
          {
            id: "gtr-d02_song",
            label: "Song Slice",
            durationSec: 240,
            completed: false,
            meta: { guidedBlockType: "song" }
          },
          {
            id: "gtr-d02_cooldown",
            label: "Cooldown",
            durationSec: 90,
            completed: false,
            meta: { guidedBlockType: "cooldown" }
          }
        ]
      },
      runtimeState: {
        guidedStep: "review",
        activeSegmentId: "gtr-d02_drill"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };

  var reviewHtml = guidedSessionPage();
  assert.ok(reviewHtml.indexOf("Drill In Progress") >= 0);
  assert.ok(reviewHtml.indexOf("Review Pass") >= 0);

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: {
          guidedPlan: S.guidedPlan,
          guidedShellDurationSec: 600
        },
        segments: [
          {
            id: "gtr-d02_warm_engine",
            label: "Warm Engine",
            durationSec: 90,
            completed: true,
            meta: { guidedBlockType: "warm_engine" }
          },
          {
            id: "gtr-d02_drill",
            label: "Drill",
            durationSec: 180,
            completed: false,
            meta: { guidedBlockType: "drill" }
          },
          {
            id: "gtr-d02_song",
            label: "Song Slice",
            durationSec: 240,
            completed: false,
            meta: { guidedBlockType: "song" }
          },
          {
            id: "gtr-d02_cooldown",
            label: "Cooldown",
            durationSec: 90,
            completed: false,
            meta: { guidedBlockType: "cooldown" }
          }
        ]
      },
      runtimeState: {
        guidedStep: "newMove",
        guidedNewMovePhase: "shadow",
        activeSegmentId: "gtr-d02_drill"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };

  var shadowHtml = guidedSessionPage();
  assert.ok(shadowHtml.indexOf("Drill In Progress") >= 0);
  assert.ok(shadowHtml.indexOf("Shadow 2/4") >= 0);
  assert.ok(shadowHtml.indexOf("width:50%") >= 0);
  assert.ok(shadowHtml.indexOf("1m 30s left") >= 0);
  assert.ok(shadowHtml.indexOf("About 1m 30s left in this block.") >= 0);
  assert.ok(shadowHtml.indexOf("onclick=\"act('guidedAdvancePhase')\"") >= 0);
  assert.ok(shadowHtml.indexOf("onclick=\"act('guidedSkipBlock')\"") >= 0);
});

test("guided page header reflects non-drill block themes", function() {
  S.guidedPlan = {
    id: "gtr-d03",
    num: 3,
    title: "The D chord",
    level: 1,
    bpm: 80,
    spark: { text: "Wake up the hands." },
    songSlice: { text: "Play the phrase." },
    victoryLap: { text: "Finish easy." }
  };

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan },
        segments: [
          { id: "gtr-d03_warm_engine", label: "Warm Engine", durationSec: 90, completed: false, meta: { guidedBlockType: "warm_engine" } },
          { id: "gtr-d03_drill", label: "Drill", durationSec: 180, completed: false, meta: { guidedBlockType: "drill" } },
          { id: "gtr-d03_song", label: "Song Slice", durationSec: 240, completed: false, meta: { guidedBlockType: "song" } },
          { id: "gtr-d03_cooldown", label: "Cooldown", durationSec: 90, completed: false, meta: { guidedBlockType: "cooldown" } }
        ]
      },
      runtimeState: {
        guidedStep: "spark",
        activeSegmentId: "gtr-d03_warm_engine"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var sparkHtml = guidedSessionPage();
  assert.ok(sparkHtml.indexOf("Warm Engine Live") >= 0);

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan },
        segments: [
          { id: "gtr-d03_warm_engine", label: "Warm Engine", durationSec: 90, completed: true, meta: { guidedBlockType: "warm_engine" } },
          { id: "gtr-d03_drill", label: "Drill", durationSec: 180, completed: true, meta: { guidedBlockType: "drill" } },
          { id: "gtr-d03_song", label: "Song Slice", durationSec: 240, completed: false, meta: { guidedBlockType: "song" } },
          { id: "gtr-d03_cooldown", label: "Cooldown", durationSec: 90, completed: false, meta: { guidedBlockType: "cooldown" } }
        ]
      },
      runtimeState: {
        guidedStep: "songSlice",
        activeSegmentId: "gtr-d03_song"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var songHtml = guidedSessionPage();
  assert.ok(songHtml.indexOf("Song Block Live") >= 0);

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan, guidedShellExtensionSec: 300, guidedShellExtensionCount: 1 },
        segments: [
          { id: "gtr-d03_warm_engine", label: "Warm Engine", durationSec: 90, completed: true, meta: { guidedBlockType: "warm_engine" } },
          { id: "gtr-d03_drill", label: "Drill", durationSec: 180, completed: true, meta: { guidedBlockType: "drill" } },
          { id: "gtr-d03_song", label: "Song Slice", durationSec: 240, completed: true, meta: { guidedBlockType: "song" } },
          { id: "gtr-d03_cooldown", label: "Cooldown", durationSec: 390, completed: false, meta: { guidedBlockType: "cooldown", guidedExtensionSec: 300, guidedExtensionCount: 1 } }
        ]
      },
      runtimeState: {
        guidedStep: "victoryLap",
        activeSegmentId: "gtr-d03_cooldown"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var cooldownHtml = guidedSessionPage();
  assert.ok(cooldownHtml.indexOf("Cooldown Block") >= 0);
  assert.ok(cooldownHtml.indexOf("onclick=\"act('guidedComplete')\"") >= 0);
  assert.ok(cooldownHtml.indexOf(">Finish Session<") >= 0);
  assert.ok(cooldownHtml.indexOf("onclick=\"act('guidedExtendBlock')\"") >= 0);
  assert.ok(cooldownHtml.indexOf(">Keep Going +5 more min<") >= 0);
  assert.ok(cooldownHtml.indexOf("+5 min extra") >= 0);
  assert.ok(cooldownHtml.indexOf("+5 min extra focus time") >= 0);
  assert.ok(cooldownHtml.indexOf("Extended Victory Lap!") >= 0);
  assert.ok(cooldownHtml.indexOf("Extra Focus Time") >= 0);
  assert.ok(cooldownHtml.indexOf("Focus Stretch x1") >= 0);
  assert.ok(cooldownHtml.indexOf("Extended session mode") >= 0);
  assert.ok(cooldownHtml.indexOf("You're in extra focus time. Stay here as long as it feels useful.") >= 0);
  assert.ok(cooldownHtml.indexOf("guidedSkipBlock") === -1);
});

test("guided victory lap tiers extension copy for deeper focus stretches", function() {
  S.guidedPlan = {
    id: "gtr-d03",
    num: 3,
    title: "The D chord",
    level: 1,
    bpm: 80,
    victoryLap: { text: "Finish easy." }
  };

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan, guidedShellExtensionSec: 600, guidedShellExtensionCount: 2 },
        segments: [
          { id: "gtr-d03_warm_engine", label: "Warm Engine", durationSec: 90, completed: true, meta: { guidedBlockType: "warm_engine" } },
          { id: "gtr-d03_drill", label: "Drill", durationSec: 180, completed: true, meta: { guidedBlockType: "drill" } },
          { id: "gtr-d03_song", label: "Song Slice", durationSec: 240, completed: true, meta: { guidedBlockType: "song" } },
          { id: "gtr-d03_cooldown", label: "Cooldown", durationSec: 690, completed: false, meta: { guidedBlockType: "cooldown", guidedExtensionSec: 600, guidedExtensionCount: 2 } }
        ]
      },
      runtimeState: {
        guidedStep: "victoryLap",
        activeSegmentId: "gtr-d03_cooldown"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };

  var html = guidedSessionPage();
  assert.ok(html.indexOf("Focus Stretch Landing") >= 0);
  assert.ok(html.indexOf("Extended Focus x2") >= 0);
  assert.ok(html.indexOf("Focus Stretch x2") >= 0);
  assert.ok(html.indexOf("Open landing. End on your terms.") >= 0);
  assert.ok(html.indexOf("Deep Focus Stretch Active") >= 0);
  assert.ok(html.indexOf("Deep Focus Live") >= 0);
  assert.ok(html.indexOf("Extended session mode x2") >= 0);
  assert.ok(html.indexOf("This is a real focus stretch now. Loop the part that still feels rewarding and let it breathe.") >= 0);
  assert.ok(html.indexOf("You're in a real focus stretch now. Keep looping the part that still feels alive.") >= 0);
  assert.ok(html.indexOf("14/20 min in focus stretch") >= 0);
  assert.ok(html.indexOf("Focus stretch is open. About 5m 45s available if you want it.") >= 0);
  assert.ok(html.indexOf("background:linear-gradient(135deg,#6E56B3,#FF8A5C)") >= 0);
  assert.ok(html.indexOf(">Wrap Up When Ready<") >= 0);
  assert.ok(html.indexOf(">Stretch Another +5 min<") >= 0);
});

test("guided cards use block-aware transition labels", function() {
  S.guidedPlan = {
    id: "gtr-d04",
    num: 4,
    title: "D with a drum loop",
    level: 1,
    bpm: 80,
    spark: { text: "Wake the hands up." },
    review: { text: "Take a pass." },
    newMove: { text: "Drill it.", chord: "D" },
    songSlice: { text: "Play the loop.", song: "D loop" },
    victoryLap: { text: "Finish loose." }
  };

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: {
        guidedStep: "review",
        activeSegmentId: "gtr-d04_drill",
        guidedBlockType: "drill"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  assert.ok(guidedSessionPage().indexOf("Into New Move") >= 0);

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: {
        guidedStep: "newMove",
        guidedNewMovePhase: "shadow",
        activeSegmentId: "gtr-d04_drill",
        guidedBlockType: "drill"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  assert.ok(guidedSessionPage().indexOf("Start Try") >= 0);

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: {
        guidedStep: "victoryLap",
        activeSegmentId: "gtr-d04_cooldown",
        guidedBlockType: "cooldown"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  assert.ok(guidedSessionPage().indexOf("Finish Session") >= 0);
  assert.ok(guidedSessionPage().indexOf("Cooldown Block") >= 0);
});

test("guided cards switch to ready copy near the end of a block", function() {
  S.guidedPlan = {
    id: "gtr-d05",
    num: 5,
    title: "The A chord",
    level: 1,
    bpm: 80,
    songSlice: { text: "Play the loop.", song: "A loop" }
  };

  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan },
        segments: [
          { id: "gtr-d05_warm_engine", label: "Warm Engine", durationSec: 90, completed: true, meta: { guidedBlockType: "warm_engine" } },
          { id: "gtr-d05_drill", label: "Drill", durationSec: 180, completed: true, meta: { guidedBlockType: "drill" } },
          { id: "gtr-d05_song", label: "Song Slice", durationSec: 240, completed: false, meta: { guidedBlockType: "song" } },
          { id: "gtr-d05_cooldown", label: "Cooldown", durationSec: 90, completed: false, meta: { guidedBlockType: "cooldown" } }
        ]
      },
      runtimeState: {
        guidedStep: "songSlice",
        activeSegmentId: "gtr-d05_song",
        transport: {
          status: "running",
          positionMs: 225000
        }
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };

  var html = guidedSessionPage();
  assert.ok(html.indexOf("Ready to move on when you are.") >= 0);
});

test("guided song slice ignores stale cached copy", function() {
  S.guidedPlan.songSlice = {
    text: "undefined",
    song: "null"
  };
  S.guidedStep = "songSlice";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "songSlice" },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var html = guidedSessionPage();
  assert.ok(html.indexOf("Play this short song slice with steady timing.") >= 0);
  assert.ok(html.indexOf("null") === -1);
  assert.ok(html.indexOf("undefined") === -1);
});

test("guided pages ignore malformed cached BPM values", function() {
  S.guidedPlan.bpm = "NaN";
  S.guidedPlan.newMove = {
    text: "Try it",
    chord: "C",
    strum: "D D U U"
  };
  S.guidedStep = "newMove";
  S.newMovePhase = "try";
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: {
        guidedStep: "newMove",
        newMovePhase: "try"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var html = guidedSessionPage();
  assert.ok(html.indexOf("Level 1 &bull; 80 BPM") >= 0);
  assert.ok(html.indexOf("at 80 BPM") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("guided done page ignores malformed completion counters", function() {
  S.streak = "NaN";
  S.completedGuidedSessions = { broken: true };
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan }
      },
      runtimeState: { guidedStep: "spark" },
      lastSessionOutcome: { xpAwarded: "NaN" }
    };
  };
  var html = guidedDonePage();
  assert.ok(html.indexOf("Nice work. Momentum counts.") >= 0);
  assert.ok(html.indexOf("+30") >= 0);
  assert.ok(html.indexOf("&#128293;0") >= 0);
  assert.ok(html.indexOf(">0/22<") >= 0);
  assert.ok(html.indexOf("background:linear-gradient(135deg,#FFF7D6,#FFF0E7)") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("guided done page falls back to curriculum v2 session totals", function() {
  S.completedGuidedSessions = ["gtr-d01", "gtr-d02", "gtr-d03"];
  SparkInstruments.getActive = function() {
    return {
      instrumentType: "guitar",
      id: "guitar",
      appId: "guitar",
      getData: function() { return { ALL_CHORDS: [] }; },
      ui: { chord: function() { return "<div>chord</div>"; } }
    };
  };
  SparkCurriculumV2 = {
    getTrackSummary: function(instrument) {
      assert.strictEqual(instrument, "guitar");
      return { sessionCount: 30 };
    }
  };
  var html = guidedDonePage();
  assert.ok(html.indexOf(">3/30<") >= 0);
  assert.ok(html.indexOf("/22<") === -1);
});

test("guided done page acknowledges deep focus landings", function() {
  S.guidedPlan = {
    id: "gtr-d03",
    num: 3,
    title: "The D chord",
    level: 1,
    bpm: 80
  };
  sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        flow: "guided_session",
        context: { guidedPlan: S.guidedPlan, guidedShellExtensionSec: 600, guidedShellExtensionCount: 2 },
        segments: [
          { id: "gtr-d03_warm_engine", label: "Warm Engine", durationSec: 90, completed: true, meta: { guidedBlockType: "warm_engine" } },
          { id: "gtr-d03_drill", label: "Drill", durationSec: 180, completed: true, meta: { guidedBlockType: "drill" } },
          { id: "gtr-d03_song", label: "Song Slice", durationSec: 240, completed: true, meta: { guidedBlockType: "song" } },
          { id: "gtr-d03_cooldown", label: "Cooldown", durationSec: 690, completed: true, meta: { guidedBlockType: "cooldown", guidedExtensionSec: 600, guidedExtensionCount: 2 } }
        ]
      },
      runtimeState: {
        guidedStep: "guided_done"
      },
      lastSessionOutcome: { xpAwarded: 30 }
    };
  };
  var html = guidedDonePage();
  assert.ok(html.indexOf("Session 3 Landed Smoothly") >= 0);
  assert.ok(html.indexOf("The D chord · You can step away now or ease into whatever comes next.") >= 0);
  assert.ok(html.indexOf("You ended from deep focus time. Nice work stopping on your terms.") >= 0);
  assert.ok(html.indexOf("&#127807;") >= 0);
  assert.ok(html.indexOf("color:#6E56B3") >= 0);
  assert.ok(html.indexOf("Good landing") >= 0);
  assert.ok(html.indexOf("Take a breath, a sip of water, or a minute away from the instrument before you jump into the next thing.") >= 0);
  assert.ok(html.indexOf(">Earned<") >= 0);
  assert.ok(html.indexOf(">Rhythm<") >= 0);
  assert.ok(html.indexOf(">In Bank<") >= 0);
  assert.ok(html.indexOf("background:linear-gradient(135deg,#6E56B308,#F6F3FF)") >= 0);
  assert.ok(html.indexOf("Start Next Session Gently") >= 0);
  assert.ok(html.indexOf("Land at Home") >= 0);
  assert.ok(html.indexOf("Ready now is great. Later is great too.") >= 0);
  assert.ok(html.indexOf("background:linear-gradient(135deg,#A78BFA,#FFB86B);color:#2F2347") >= 0);
  assert.ok(html.indexOf("background:#E9E0FF;color:#6E56B3;margin-top:8px;border:1px solid #C8B5FF") >= 0);
  assert.ok(html.indexOf("Pause First") >= 0);
  assert.ok(html.indexOf("Set the instrument down, roll your shoulders, and let the session settle for a moment.") >= 0);
});

test("guided exit routes through a confirmation action", function() {
  var source = loadJS("js/pages/guided.js");
  assert.ok(source.indexOf('onclick="act(\\\'guidedConfirmStop\\\')"') >= 0);
  assert.strictEqual(source.indexOf("if(confirm('End session early?'))act('guidedStop')"), -1);
});

test("guided confirmation action delegates to guidedStop only after confirm", function() {
  var handled;
  var acted = [];
  global.window = global;
  global.S = {};
  global.T = {};
  global.confirm = function() { return true; };
  global.act = function(name) { acted.push(name); };
  global.registerSparkActionFamily = function(name, handler) {
    global.runSparkActionFamilies = handler;
  };
  global.eval(loadJS("js/actions/system_family.js"));
  handled = global.runSparkActionFamilies("guidedConfirmStop");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(acted, ["guidedStop"]);

  acted = [];
  global.confirm = function() { return false; };
  handled = global.runSparkActionFamilies("guidedConfirmStop");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(acted, []);
});

test("guided actions can resolve sparkCore from the global binding", function() {
  var handled;
  var syncCalls = [];
  var advanceCalls = [];
  var skipCalls = [];
  var extendCalls = [];
  var completeCalls = [];
  var startCalls = [];
  global.window = {
    registerSparkActionFamily: function(name, handler) {
      global.runSparkActionFamilies = handler;
    }
  };
  global.S = {
    guidedStep: "spark",
    newMovePhase: null
  };
  global.T = {};
  global.SCR = {
    GUIDED: "guided",
    HOME: "home"
  };
  global.SparkSessionTypes = {
    FLOW_GUIDED_SESSION: "guided_session"
  };
  global.render = function() {};
  global.sparkCore = {
    advanceGuidedSession: function(payload) {
      advanceCalls.push(payload);
      return {
        runtimeState: {
          guidedActivityId: "gtr-d01-drill",
          guidedActivityKind: "review",
          guidedBlockType: "drill"
        }
      };
    },
    skipGuidedBlock: function(payload) {
      skipCalls.push(payload);
      return {
        runtimeState: {
          guidedStep: "songSlice",
          guidedNewMovePhase: null,
          guidedActivityId: "gtr-d01-song",
          guidedActivityKind: "song_chunk",
          guidedBlockType: "song",
          activeScreen: "guided_session"
        }
      };
    },
    extendGuidedBlock: function(payload) {
      extendCalls.push(payload);
      return {
        runtimeState: {
          guidedStep: "victoryLap",
          guidedNewMovePhase: null,
          guidedActivityId: "gtr-d01-cooldown",
          guidedActivityKind: "freeplay",
          guidedBlockType: "cooldown",
          activeScreen: "guided_session"
        }
      };
    },
    syncGuidedRuntimeState: function(payload) {
      syncCalls.push(payload);
      return {
        guidedActivityId: "gtr-d01-drill",
        guidedActivityKind: "review",
        guidedBlockType: "drill"
      };
    },
    startSession: function(payload) {
      startCalls.push(payload);
      return {
        context: {
          guidedPlan: {
            id: "gtr-d01"
          }
        }
      };
    },
    completeGuidedSession: function(payload) {
      completeCalls.push(payload);
      return {
        guidedActivityId: null,
        guidedActivityKind: null,
        guidedBlockType: null
      };
    },
    getRuntimeState: function() {
      return {
        guidedActivityId: "gtr-d01-warm_engine",
        guidedActivityKind: "warm_engine_play",
        guidedBlockType: "warm_engine"
      };
    }
  };

  global.eval(loadJS("js/actions/system_family.js"));

  handled = global.runSparkActionFamilies("guidedNext");
  assert.strictEqual(handled, true);
  assert.strictEqual(S.guidedStep, "review");
  assert.deepStrictEqual(advanceCalls, [{
    guidedNewMovePhase: null
  }]);
  assert.deepStrictEqual(syncCalls, []);
  assert.strictEqual(S.guidedActivityId, "gtr-d01-drill");
  assert.strictEqual(S.guidedActivityKind, "review");
  assert.strictEqual(S.guidedBlockType, "drill");

  handled = global.runSparkActionFamilies("guidedSkipBlock");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(skipCalls, [{}]);
  assert.strictEqual(S.guidedStep, "songSlice");
  assert.strictEqual(S.newMovePhase, null);
  assert.strictEqual(S.guidedActivityId, "gtr-d01-song");
  assert.strictEqual(S.guidedActivityKind, "song_chunk");
  assert.strictEqual(S.guidedBlockType, "song");

  S.guidedStep = "victoryLap";
  S.newMovePhase = null;
  handled = global.runSparkActionFamilies("guidedExtendBlock");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(extendCalls, [{}]);
  assert.strictEqual(S.guidedStep, "victoryLap");
  assert.strictEqual(S.guidedActivityId, "gtr-d01-cooldown");
  assert.strictEqual(S.guidedActivityKind, "freeplay");
  assert.strictEqual(S.guidedBlockType, "cooldown");

  S.guidedStep = "review";
  S.newMovePhase = null;
  S.guidedActivityId = "gtr-d01-drill";
  S.guidedActivityKind = "review";
  S.guidedBlockType = "drill";
  delete global.sparkCore.advanceGuidedSession;
  handled = global.runSparkActionFamilies("guidedNext");
  assert.strictEqual(handled, true);
  assert.strictEqual(S.guidedStep, "newMove");
  assert.strictEqual(S.newMovePhase, "watch");
  assert.deepStrictEqual(syncCalls, [{
    guidedStep: "newMove",
    guidedNewMovePhase: "watch"
  }]);
  assert.strictEqual(S.guidedActivityId, "gtr-d01-drill");
  assert.strictEqual(S.guidedActivityKind, "review");
  assert.strictEqual(S.guidedBlockType, "drill");

  handled = global.runSparkActionFamilies("start_guided_session", "1");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(startCalls, [{
    flow: "guided_session",
    sessionNum: 1
  }]);
  assert.strictEqual(S.screen, "guided");
  assert.strictEqual(S.guidedActivityId, "gtr-d01-warm_engine");
  assert.strictEqual(S.guidedActivityKind, "warm_engine_play");
  assert.strictEqual(S.guidedBlockType, "warm_engine");

  handled = global.runSparkActionFamilies("guidedComplete");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(completeCalls, [{}]);
  assert.strictEqual(S.screen, "guided_done");
  assert.strictEqual(S.guidedActivityId, null);
  assert.strictEqual(S.guidedActivityKind, null);
  assert.strictEqual(S.guidedBlockType, null);
});

test("openPracticePlan resumes the guided screen when a guided session is already active", function() {
  var planOpenCalls = [];
  global.openPracticePlanScreenRequest = function(payload) {
    planOpenCalls.push(payload || {});
    return payload || {};
  };
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          flow: "guided_session",
          context: { guidedPlan: S.guidedPlan }
        },
        runtimeState: {
          activeScreen: "guided_session",
          guidedStep: "songSlice"
        }
      };
    }
  };
  global.eval(loadJS("js/actions/system_family.js"));

  var handled = global.runSparkActionFamilies("openPracticePlan");
  assert.strictEqual(handled, true);
  assert.strictEqual(S.screen, "guided");
  assert.deepStrictEqual(planOpenCalls, []);
});

if (process.exitCode) process.exit(process.exitCode);
