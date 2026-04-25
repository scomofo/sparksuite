var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.S = {
    sessionPlan: {
      num: 2,
      title: "undefined",
      level: 1,
      bpm: 80,
      blocks: [
        { type: "warm_engine", duration_sec: 90 },
        { type: "drill", duration_sec: 180 },
        { type: "song", duration_sec: 240 },
        { type: "cooldown", duration_sec: 90 }
      ],
      blockActivities: {
        warm_engine: { kind: "warm_engine_play", copy: { setup: "Warm up with one note." } },
        drill: { kind: "chord_intro", copy: { setup: "Place C-E-G under your hand.", success: "Quick review pass." } },
        song: { kind: "song_chunk", copy: { setup: "Loop the phrase with relaxed timing.", success: "Moonlight intro" } },
        cooldown: { kind: "freeplay", copy: { setup: "Let it ring once more." } }
      },
      spark: { text: "null" },
      review: { text: "undefined", chords: [] },
      newMove: { chord: "C", text: "null" },
      songSlice: { text: "undefined", song: "null" },
      victoryLap: { text: "NaN" },
      lh: "undefined"
    },
    sessionStep: "songSlice",
    sessionTimer: 0,
    paused: false,
    fingerWarmUpDone: true,
    newMovePhase: "try",
    feedbackMessage: "",
    detecting: false,
    lastReviewChords: [],
    adaptiveBpm: 72,
    personalBests: { bpm: 90 },
    chord: "undefined",
    timer: 120,
    detectedNotes: []
  };
  global.backBtnHTML = function() { return ""; };
  global.sessionStepIndicator = function() { return "<div>steps</div>"; };
  global.getWarmUpExercise = function() { return null; };
  global.findChord = function(name) {
    if (name === "C") return { name: "C", short: "C" };
    return null;
  };
  global.pianoSVG = function(chord) {
    return "<div>" + (chord && chord.name || "") + "</div>";
  };
  global.newMovePhaseIndicator = function() { return "<div>phase</div>"; };
  global.delayedFeedbackCard = function(msg) { return "<div>" + msg + "</div>"; };
  global.getChordMatch = function() { return 85; };
  global.getCoachFeedback = function() { return "Nice"; };
  global.detectionConfidenceHTML = function() { return "<div>confidence</div>"; };
  global.getSessionExercise = function() { return null; };
  global.getCurrentLevel = function() { return null; };
  global.lhPatternViz = function() { return "<div>lh</div>"; };
  global.adaptiveBpmDisplay = function(bpm) { return "<div>" + bpm + "</div>"; };
  global.pianoFormatTime = function(value) { return String(value); };
  global.act = function() {};
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/sparksuite/ui/session_shell.js"));
    global.eval(loadJS("js/instruments/piano/pages/session.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Piano Session Page Resolution ---");

test("piano session page ignores stale guided session text", function() {
  var html = pianoSessionPage();
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf(">NaN<") === -1);
  assert.ok(html.indexOf("Guided session") >= 0);
  assert.ok(html.indexOf("Loop the phrase with relaxed timing.") >= 0);
  assert.ok(html.indexOf("song chunk") >= 0);
  assert.ok(html.indexOf("4 min block") >= 0);
  assert.ok(html.indexOf("Moonlight intro") >= 0);
});

test("piano session page surfaces the live guided shell from sparkCore", function() {
  global.sparkCore = {
    getActiveSessionView: function() {
      return {
        plan: {
          segments: [
            { id: "warm_1", type: "warm_engine", label: "Warm engine", duration_sec: 90 },
            { id: "song_1", type: "song", label: "Song block", duration_sec: 240 }
          ]
        },
        activeSegment: { id: "song_1", type: "song", label: "Song block", duration_sec: 240 },
        runtimeState: {
          activeSegmentId: "song_1",
          transport: { status: "running", positionMs: 60000, durationMs: 240000 }
        }
      };
    }
  };

  var html = pianoSessionPage();
  assert.ok(html.indexOf("Guided Session Live") >= 0);
  assert.ok(html.indexOf("Block 3 of 4") >= 0);
  assert.ok(html.indexOf("In progress - Song block") >= 0);
  assert.ok(html.indexOf("10 min shell") >= 0);
  assert.ok(html.indexOf("1m 0s in block") >= 0);
  assert.ok(html.indexOf("3m 0s left") >= 0);
});

test("legacy session page ignores stale chord labels", function() {
  var html = legacySessionHTML();
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">Chord<") >= 0);
});

test("piano session page ignores stale finger focus and transition tip text", function() {
  S.sessionStep = "newMove";
  S.newMovePhase = "refine";
  S.lastReviewChords = ["G"];
  global.PIANO_TRANSITION_TIPS = { "G_C": "undefined" };
  global.getSessionExercise = function() {
    return { name: "null", desc: "NaN" };
  };
  var html = pianoSessionPage();
  assert.ok(html.indexOf("Finger Focus: Finger Focus") >= 0);
  assert.ok(html.indexOf("Practice this motion slowly.") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf(">NaN<") === -1);
});

test("piano session page uses v2 block activity copy for spark and victory lap", function() {
  S.sessionStep = "spark";
  var sparkHtml = pianoSessionPage();
  assert.ok(sparkHtml.indexOf("Warm up with one note.") >= 0);
  assert.ok(sparkHtml.indexOf("warm engine play") >= 0);

  S.sessionStep = "victoryLap";
  var victoryHtml = pianoSessionPage();
  assert.ok(victoryHtml.indexOf("Let it ring once more.") >= 0);
  assert.ok(victoryHtml.indexOf("freeplay") >= 0);
});

test("victory lap ignores stale finger check text", function() {
  S.sessionStep = "victoryLap";
  global.getSessionExercise = function() {
    return { name: "undefined", desc: "null" };
  };
  var html = pianoSessionPage();
  assert.ok(html.indexOf("Finger Check: Finger Check") >= 0);
  assert.ok(html.indexOf("Lock it in with one more rep.") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
});

test("piano session page ignores malformed BPM values", function() {
  S.sessionPlan.bpm = "NaN";
  var html = pianoSessionPage();
  assert.ok(html.indexOf("Level 1 • 80 BPM") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("piano session exit routes through a confirmation action", function() {
  var source = loadJS("js/instruments/piano/pages/session.js");
  assert.ok(source.indexOf('onclick="act(\\\'pianoConfirmStopSession\\\')"') >= 0);
  assert.strictEqual(source.indexOf("if(confirm('End session early?'))act('stop_session')"), -1);
});

test("piano app confirms session stop before dispatching stop_session", function() {
  global.window = global;
  global.document = {
    addEventListener: function() {},
    removeEventListener: function() {},
    getElementById: function() { return null; }
  };
  global.S = {
    screen: "session",
    active: true,
    detecting: true,
    sessionStep: "spark",
    sessionPlan: { num: 1 }
  };
  global.T = { sessionStep: 1, session: 1 };
  global.confirm = function() { return true; };
  global.eval(loadJS("js/instruments/piano/app.js"));

  pianoAct("pianoConfirmStopSession");
  assert.strictEqual(S.active, false);
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.sessionStep, null);
  assert.strictEqual(S.sessionPlan, null);

  S.active = true;
  S.screen = "session";
  S.sessionStep = "spark";
  S.sessionPlan = { num: 1 };
  global.confirm = function() { return false; };
  pianoAct("pianoConfirmStopSession");
  assert.strictEqual(S.active, true);
  assert.strictEqual(S.screen, "session");
  assert.deepStrictEqual(S.sessionPlan, { num: 1 });
});

if (process.exitCode) process.exit(process.exitCode);
