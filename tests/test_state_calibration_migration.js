var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnv(savedState, backupState) {
  global.window = global;
  global.SCR = { HOME: "home" };
  global.TAB = { PRACTICE: "practice" };
  global.clearTimeout = function() {};
  global.setTimeout = function() { return 1; };
  global.clearInterval = function() {};
  global.setInterval = function() { return 1; };
  global.render = function() {};
  global.safeJsonParse = function(raw, fallback) {
    try { return JSON.parse(raw); } catch (err) { return fallback; }
  };
  global.capArray = function(arr) { return arr; };
  global.buildPersistedStateSnapshot = function(source, fields) {
    var out = {};
    for (var i = 0; i < fields.length; i++) out[fields[i]] = source[fields[i]];
    return out;
  };
  global.applyPersistedStateSnapshot = function(target, source, fields) {
    for (var i = 0; i < fields.length; i++) {
      if (Object.prototype.hasOwnProperty.call(source, fields[i])) target[fields[i]] = source[fields[i]];
    }
  };
  global.removePersistedBackup = function() {};
  global.localStorageWrites = [];
  global.localStorage = {
    getItem: function(key) {
      if (key === "chordspark_state") return savedState ? JSON.stringify(savedState) : null;
      if (key === "chordspark_state_backup") return backupState ? JSON.stringify(backupState) : null;
      return null;
    },
    setItem: function(key, value) {
      localStorageWrites.push({ key: key, value: JSON.parse(value) });
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

console.log("\n--- State Calibration Migration ---");

test("loadState migrates legacy performAudioOffsetMs into performMicOffsetMs", function() {
  resetEnv({
    performAudioOffsetMs: 87,
    performMicOffsetMs: null
  });
  // SparkDay: the local-calendar-day helper day-boundary logic depends on.
  global.eval(loadJS("js/utils/day.js"));
  global.eval(loadJS("js/state.js"));
  assert.strictEqual(S.performMicOffsetMs, 87);
  assert.strictEqual(S.performAudioOffsetMs, 0);
});

test("recoverFromCrash migrates backup audio offset into mic offset before saving", function() {
  resetEnv(null, {
    _backupTime: Date.now(),
    performAudioOffsetMs: 44,
    performMicOffsetMs: null
  });
  global.eval(loadJS("js/state.js"));
  assert.strictEqual(S.performMicOffsetMs, 44);
  assert.strictEqual(S.performAudioOffsetMs, 0);
  assert.ok(localStorageWrites.length >= 1);
  assert.strictEqual(localStorageWrites[0].value.performMicOffsetMs, 44);
  assert.ok(!Object.prototype.hasOwnProperty.call(localStorageWrites[0].value, "performAudioOffsetMs"));
});

if (process.exitCode) process.exit(process.exitCode);
