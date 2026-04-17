var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.TRANSITION_TIPS = {};
  global.S = {
    guidedPlan: {
      num: 3,
      title: "Clean Changes",
      level: 2,
      bpm: 72,
      spark: { text: "Get ready." },
      review: { chords: ["G"], text: "Review the last move." },
      newMove: { chord: "C", text: "Place the new chord cleanly." },
      songSlice: { text: "Try it in time." },
      victoryLap: { text: "Lock it in." }
    },
    guidedStep: "newMove",
    newMovePhase: "shadow"
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
    }
  };
  global.escHTML = function(value) { return String(value); };
  global.SparkInstruments = {
    getActive: function() {
      return {
        getData: function() {
          return {
            ALL_CHORDS: [
              { name: "C", short: "C" },
              { name: "G", short: "G" }
            ]
          };
        },
        ui: {
          chord: function(chord) {
            return '<div class="mock-chord">' + chord.name + "</div>";
          }
        }
      };
    }
  };
}

function test(name, fn) {
  try {
    resetState();
    (0, eval)(loadJS("js/pages/guided.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Guided New Move Animation ---");

test("shared guided new-move phase renders animated shadow cues", function() {
  var html = guidedSessionPage();

  assert.ok(html.indexOf("guidedShadowFloat") >= 0);
  assert.ok(html.indexOf("Shadow") >= 0);
  assert.ok(html.indexOf("mock-chord") >= 0);
});

test("shared guided new-move phase defaults to watch animation when phase is missing", function() {
  global.S.newMovePhase = null;
  var html = guidedSessionPage();

  assert.ok(html.indexOf("Watch") >= 0);
  assert.ok(html.indexOf("guidedWatchPulse") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
