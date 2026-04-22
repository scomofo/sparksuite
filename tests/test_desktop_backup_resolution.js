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
    releaseInfo: null
  };
  global.SparkInstruments = {
    getActive: function() {
      return null;
    }
  };
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

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
