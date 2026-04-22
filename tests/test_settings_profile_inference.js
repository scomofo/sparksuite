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
    resetEnv();
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
  global.APP_NAME = "ChordSpark";
  global.S = {};
  global.SparkInstruments = {
    getActive: function() {
      return null;
    },
    getAll: function() {
      return [];
    }
  };
}

console.log("\n--- Settings Profile Inference ---");

test("initSettingsDefaults seeds profile from a thin active instrument", function() {
  SparkInstruments.getActive = function() {
    return { appId: "ukespark" };
  };
  SparkInstruments.getAll = function() {
    return [{ id: "ukespark", appId: "ukespark", instrument: "ukulele" }];
  };

  global.eval(loadJS("js/settings/settings_state.js"));
  initSettingsDefaults();

  assert.strictEqual(S.profile.instrumentPrimary, "ukulele");
});

test("initSettingsDefaults falls back to APP_NAME for non-guitar shells", function() {
  global.APP_NAME = "BassSpark";

  global.eval(loadJS("js/settings/settings_state.js"));
  initSettingsDefaults();

  assert.strictEqual(S.profile.instrumentPrimary, "bass");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
