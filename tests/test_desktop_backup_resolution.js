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
  global.S = {
    releaseInfo: null,
    desktopInfo: {}
  };
  global.SparkInstruments = {
    getActive: function() {
      return null;
    }
  };
  global.saveState = function() {};
}

console.log("\n--- Desktop Backup Resolution ---");

test("buildFullLocalBackup prefers the active instrument app id when release info is missing", function() {
  resetEnv();
  SparkInstruments.getActive = function() {
    return { appId: "pianospark" };
  };

  global.eval(loadJS("js/desktop/bridge.js"));
  var backup = buildFullLocalBackup();

  assert.strictEqual(backup.app, "pianospark");
});

test("buildFullLocalBackup falls back to sparksuite when no app id is available", function() {
  resetEnv();

  global.eval(loadJS("js/desktop/bridge.js"));
  var backup = buildFullLocalBackup();

  assert.strictEqual(backup.app, "sparksuite");
});

test("buildFullLocalBackup uses canonical storage export and debug bundle when available", function() {
  resetEnv();
  global.sparkCore = {
    storage: {
      getCurrentSchemaVersion: function() { return 4; },
      getUserProfile: function() { return { userId: "portable_user", xp: 10, settings: { gameplay: {} } }; },
      getSettings: function() { return { gameplay: { inputLatencyOffsetMs: -8 } }; },
      getPracticeJournal: function() { return [{ id: "entry_1" }]; }
    }
  };
  global.exportSparkUserData = function(options) {
    return {
      schemaVersion: options.storage.getCurrentSchemaVersion(),
      exportedAt: "2026-04-24T00:00:00.000Z",
      profile: options.storage.getUserProfile(),
      settings: options.storage.getSettings(),
      practiceJournal: options.storage.getPracticeJournal()
    };
  };
  global.buildSparkDebugBundle = function() {
    return { session: { id: "session_1" }, recentEvents: [] };
  };

  global.eval(loadJS("js/desktop/bridge.js"));
  var backup = buildFullLocalBackup();

  assert.strictEqual(backup.schemaVersion, 4);
  assert.strictEqual(backup.userData.profile.userId, "portable_user");
  assert.strictEqual(backup.debugBundle.session.id, "session_1");
  assert.strictEqual(backup.state, undefined);
});

test("exportFullBackupDesktopAware saves the canonical backup payload", async function() {
  resetEnv();
  global.sparkCore = {
    storage: {
      getCurrentSchemaVersion: function() { return 4; },
      getUserProfile: function() { return { userId: "portable_user" }; },
      getSettings: function() { return {}; },
      getPracticeJournal: function() { return []; }
    }
  };
  global.exportSparkUserData = function(options) {
    return {
      schemaVersion: options.storage.getCurrentSchemaVersion(),
      exportedAt: "2026-04-24T00:00:00.000Z",
      profile: options.storage.getUserProfile(),
      settings: options.storage.getSettings(),
      practiceJournal: options.storage.getPracticeJournal()
    };
  };
  global.buildSparkDebugBundle = function() {
    return { session: null };
  };
  global.sparkDesktop = {
    calls: [],
    saveJson: function(payload) {
      this.calls.push(payload);
      return Promise.resolve({ ok: true });
    }
  };

  global.eval(loadJS("js/desktop/bridge.js"));
  return exportFullBackupDesktopAware().then(function(result) {
    assert.strictEqual(result, true);
    assert.strictEqual(global.sparkDesktop.calls.length, 1);
    assert.strictEqual(global.sparkDesktop.calls[0].schemaVersion, 4);
    assert.strictEqual(global.sparkDesktop.calls[0].userData.profile.userId, "portable_user");
  });
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
