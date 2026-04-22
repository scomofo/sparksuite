var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  var emitted = [];
  global.window = global;
  global.S = {
    level: 1,
    quizAns: null,
    quizQ: { name: "C" },
    quizOpts: [{ name: "C" }],
    quizCorrect: 0,
    quizScore: 0,
    quizTotal: 0,
    quizStreak: 0,
    xp: 0
  };
  global.T = {};
  global.SCR = { QUIZ: "quiz" };
  global.render = function() {};
  global.saveState = function() {};
  global.checkBadges = function() {};
  global.logHistory = function() {};
  global.fireMicro = function() {};
  global.snd = function() {};
  global.genQ = function() { return { name: "C" }; };
  global.tickS = function() {};
  global.tickD = function() {};
  global.setTimeout = function() { return 1; };
  global.clearTimeout = function() {};
  global._sparkEmit = function(type, payload) {
    emitted.push({ type: type, payload: payload });
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "ukespark" };
    },
    getAll: function() {
      return [{
        id: "ukespark",
        appId: "ukespark",
        instrument: "ukulele",
        getData: function() {
          return {
            ALL_CHORDS: [{ name: "C", short: "C" }]
          };
        }
      }];
    }
  };
  global.__emitted = emitted;
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/instruments/guitar/app.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Guitar Quiz Emit Resolution ---");

test("correct quiz answers emit the resolved active instrument app id", function() {
  guitarAct("answerQuiz", "C");
  assert.strictEqual(__emitted.length, 1);
  assert.strictEqual(__emitted[0].type, "drill_answered");
  assert.strictEqual(__emitted[0].payload.appId, "ukespark");
  assert.strictEqual(__emitted[0].payload.skillId, "C");
  assert.strictEqual(__emitted[0].payload.correct, true);
});

if (process.exitCode) process.exit(process.exitCode);
