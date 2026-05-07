var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  var rendered = 0;
  var strummed = [];
  var openedEarTraining = null;

  global.window = global;
  global.S = {
    level: 1,
    earTrainQ: null,
    earTrainOpts: [],
    earTrainAns: null,
    earTrainScore: 2,
    earTrainTotal: 4,
    earTrainStreak: 1
  };
  global.T = {};
  global.SparkProgressBridge = null;
  global.sparkCore = {
    openLegacyEarTraining: function(runtime) {
      openedEarTraining = runtime;
    }
  };
  global.render = function() { rendered++; };
  global.strumChord = function(name) { strummed.push(name); };
  global.snd = function() {};
  global.logHistory = function() {};
  global.checkBadges = function() {};
  global.saveState = function() {};
  global.setTimeout = function(fn) {
    return 1;
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "ukespark",
        appId: "ukespark",
        instrument: "ukulele",
        getData: function() {
          return {
            CHORDS: {
              1: [
                { name: "C Major", short: "C" },
                { name: "G Major", short: "G" },
                { name: "A Minor", short: "Am" },
                { name: "F Major", short: "F" }
              ]
            },
            ALL_CHORDS: [
              { name: "C Major", short: "C" },
              { name: "G Major", short: "G" },
              { name: "A Minor", short: "Am" },
              { name: "F Major", short: "F" }
            ]
          };
        }
      };
    }
  };

  return {
    getRendered: function() { return rendered; },
    getStrummed: function() { return strummed; },
    getOpenedEarTraining: function() { return openedEarTraining; }
  };
}

function test(name, fn) {
  try {
    var env = resetEnvironment();
    global.eval(loadJS("js/actions/families.js"));
    global.eval(loadJS("js/actions/practice_family.js"));
    fn(env);
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Practice Action Family ---");

test("shared ear training launch works for instruments without a local handler", function(env) {
  var handled = runSparkActionFamilies("startEarTrain");

  assert.strictEqual(handled, true);
  assert.ok(S.earTrainQ, "expected a question chord");
  assert.strictEqual(S.earTrainAns, null);
  assert.strictEqual(S.earTrainOpts.length, 4);
  assert.ok(S.earTrainOpts.indexOf(S.earTrainQ) >= 0);
  assert.deepStrictEqual(env.getStrummed(), [S.earTrainQ]);
  assert.strictEqual(env.getRendered(), 1);
  assert.ok(env.getOpenedEarTraining(), "expected core ear training runtime sync");
  assert.strictEqual(env.getOpenedEarTraining().question, S.earTrainQ);
  assert.deepStrictEqual(env.getOpenedEarTraining().options, S.earTrainOpts);
  assert.strictEqual(env.getOpenedEarTraining().score, 2);
  assert.strictEqual(env.getOpenedEarTraining().total, 4);
  assert.strictEqual(env.getOpenedEarTraining().streak, 1);
});
