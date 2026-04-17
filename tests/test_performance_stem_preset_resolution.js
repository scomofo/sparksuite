var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function resetEnv() {
  global.window = global;
  global.document = {
    querySelector: function() { return null; }
  };
  global.performance = { now: function() { return Date.now(); } };
  global.S = {
    performPracticePreset: "full_mix",
    performChart: { instrument: "piano" }
  };
  global.render = function() {};
  global.stopAllTimers = function() {};
  global.loadPerformanceChart = function() { return Promise.resolve({ events: [] }); };
  global.normalizePerformanceChart = function(chart) { return chart; };
  global.createEmptyPhraseStats = function() { return []; };
  global.applyPerformanceDifficultyToState = function() {};
  global.PerformanceInput = { start: function() {} };
  global.PerformanceTransport = { start: function() {}, setAudioSource: function() {} };
  global.requestAnimationFrame = function() { return 1; };
  global.cancelAnimationFrame = function() {};
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [
        {
          id: "pianospark",
          appId: "pianospark",
          instrument: "piano",
          stemMutePreset: {
            piano: false,
            vocals: true,
            drums: true,
            bass: true,
            guitar: true,
            other: true
          }
        },
        {
          id: "bassspark",
          appId: "bassspark",
          instrument: "bass",
          stemMutePreset: {
            bass: false,
            vocals: true,
            drums: true,
            guitar: true,
            piano: true,
            other: true
          }
        }
      ];
    }
  };
}

console.log("\n--- Performance Stem Preset Resolution ---");

test("applyPerformanceStemPreset mutes the piano stem for thin active piano sessions", function() {
  resetEnv();
  var muted = {};
  var volume = [];
  global.setStemMuted = function(stem, isMuted) {
    muted[stem] = isMuted;
  };
  global.setStemVolume = function(value) {
    volume.push(value);
  };

  global.eval(loadJS("js/performance/session.js"));
  applyPerformanceStemPreset("no_guitar");

  assert.strictEqual(S.performPracticePreset, "no_guitar");
  assert.strictEqual(muted.piano, true);
  assert.strictEqual(muted.guitar, false);
  assert.deepStrictEqual(volume, [0.8]);
});

test("applyPerformanceStemPreset solos the bass stem for thin active bass sessions", function() {
  resetEnv();
  S.performChart = { instrument: "bass" };
  SparkInstruments.getActive = function() {
    return { appId: "bassspark" };
  };
  var muted = {};
  global.setStemMuted = function(stem, isMuted) {
    muted[stem] = isMuted;
  };
  global.setStemVolume = function() {};

  global.eval(loadJS("js/performance/session.js"));
  applyPerformanceStemPreset("guitar_solo");

  assert.strictEqual(muted.bass, false);
  assert.strictEqual(muted.guitar, true);
  assert.strictEqual(muted.drums, true);
});

test("perform preset labels follow the resolved active stem label", function() {
  resetEnv();
  global.escHTML = function(value) { return String(value); };

  global.eval(loadJS("js/performance/session.js"));
  global.eval(loadJS("js/pages/perform.js"));

  var presets = getPerformancePracticePresetOptions();
  assert.strictEqual(presets[1].label, "No Piano");
  assert.strictEqual(presets[2].label, "Quiet Piano");
  assert.strictEqual(presets[3].label, "Solo Piano");
});

test("formatTechniqueFocusLabel ignores sentinel focus keys", function() {
  resetEnv();
  global.escHTML = function(value) { return String(value); };

  global.eval(loadJS("js/pages/perform.js"));

  assert.strictEqual(formatTechniqueFocusLabel("undefined"), "Technique");
  assert.strictEqual(formatTechniqueFocusLabel(" null "), "Technique");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
