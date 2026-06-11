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

test("initSettingsDefaults migrates persisted legacy releaseInfo.build", function() {
  // releaseInfo is persisted; pre-1.3.x installs saved {build} not
  // {buildNumber}, and the || init leaves an existing object untouched.
  S.releaseInfo = { version: "0.9.0", build: 120, firstInstalled: 1, lastUpdated: 2 };

  global.eval(loadJS("js/settings/settings_state.js"));
  initSettingsDefaults();

  assert.strictEqual(S.releaseInfo.buildNumber, 120, "legacy build value must carry over");
  assert.strictEqual(S.releaseInfo.build, undefined, "legacy build key is dropped so it cannot persist forever");
  assert.strictEqual(S.releaseInfo.version, "0.9.0", "persisted fields stay until the manifest fetch replaces them");
});

test("initSettingsDefaults leaves a modern releaseInfo alone", function() {
  S.releaseInfo = { version: "1.3.0", buildNumber: 7, firstInstalled: 1, lastUpdated: 2 };

  global.eval(loadJS("js/settings/settings_state.js"));
  initSettingsDefaults();

  assert.strictEqual(S.releaseInfo.buildNumber, 7);
});

test("initSettingsDefaults drops a leftover build key beside buildNumber", function() {
  // A state saved by the copy-only migration carries BOTH keys; the cleanup
  // must still run without clobbering the already-migrated buildNumber.
  S.releaseInfo = { version: "1.3.0", buildNumber: 7, build: 120, firstInstalled: 1, lastUpdated: 2 };

  global.eval(loadJS("js/settings/settings_state.js"));
  initSettingsDefaults();

  assert.strictEqual(S.releaseInfo.buildNumber, 7, "migrated value must not be clobbered by the legacy key");
  assert.strictEqual(S.releaseInfo.build, undefined, "legacy key is dropped even when already migrated");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
