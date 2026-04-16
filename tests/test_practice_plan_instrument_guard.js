var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    activeInstrument: "pianospark",
    practicePlanDate: new Date().toISOString().slice(0, 10),
    practicePlan: {
      instrumentId: "ukespark",
      instrumentType: "ukulele",
      focus: "Ukulele island groove",
      items: [
        { id: "uke_1", label: "Replay Ukulele Island Package", type: "performance_song", durationSec: 300 }
      ]
    },
    practicePlanInstrumentId: "ukespark",
    practicePlanInstrumentType: "ukulele",
    practicePlanComplete: false
  };
  global.__sparkState = global.S;
  global.SparkState = {
    getRoot: function() { return global.S; },
    read: function(path, fallback) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length; i++) {
        if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
        cursor = cursor[parts[i]];
      }
      return cursor == null ? fallback : cursor;
    },
    write: function(path, value) {
      var parts = Array.isArray(path) ? path.slice() : [path];
      var cursor = global.S;
      var i;
      for (i = 0; i < parts.length - 1; i++) {
        if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      return value;
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "pianospark",
        instrument: "piano"
      };
    }
  };
  global.escHTML = function(value) { return String(value); };
  global.SparkPracticeBridge = undefined;
}

function test(name, fn) {
  try {
    resetState();
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Practice Plan Instrument Guard ---");

test("shared plan page hides cached plans from another instrument", function() {
  eval(loadJS("js/practice/engine.js"));
  eval(loadJS("js/pages/plan.js"));

  var html = planPage();

  assert.ok(html.indexOf("No practice plan is available right now.") >= 0);
  assert.strictEqual(html.indexOf("Replay Ukulele Island Package"), -1);
});

test("piano plan page hides cached plans from another instrument", function() {
  eval(loadJS("js/practice/engine.js"));
  eval(loadJS("js/instruments/piano/pages/plan.js"));

  var html = pianoPlanPage();

  assert.ok(html.indexOf("No practice plan is available right now.") >= 0);
  assert.strictEqual(html.indexOf("Replay Ukulele Island Package"), -1);
});

if (process.exitCode) process.exit(process.exitCode);
