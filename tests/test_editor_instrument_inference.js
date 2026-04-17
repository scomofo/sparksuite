var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.APP_NAME = "SparkSuite";
  global.S = {
    activeInstrument: "pianospark"
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
  global.SCR = { EDITOR: "editor" };
  global.createPerformanceChartShell = function() {
    return { id: "", songId: "", title: "", arrangementType: "" };
  };
  global.createEmptyExercise = function() {
    return { type: "exercise" };
  };
  global.buildPerformanceChartFromSong = function(song, arrangementType) {
    return {
      id: song.id,
      title: song.title,
      arrangementType: arrangementType
    };
  };
}

function test(name, fn) {
  try {
    resetState();
    (0, eval)(loadJS("js/editor/engine.js"));
    (0, eval)(loadJS("js/editor/seeds.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Editor Instrument Inference ---");

test("editor default arrangement follows the active piano instrument in the shared shell", function() {
  var chart = createEmptyChart();
  assert.strictEqual(chart.arrangementType, "block_chords");
});

test("editor seed arrangement follows the active piano instrument in the shared shell", function() {
  var seeded = seedChartFromSong({ id: "song_1", title: "Shared Piano Song" });
  assert.strictEqual(seeded.arrangementType, "block_chords");
});

if (process.exitCode) process.exit(process.exitCode);
