var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function resetEnvironment() {
  global.window = global;
  global.S = { activeInstrument: "chordspark" };
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
    getActive: function() { return null; }
  };
  global.parseMidiFile = function(file) {
    return Promise.resolve({ name: file.name });
  };
  global.normalizeParsedMidi = function(_raw, fileName) {
    return {
      sourceName: fileName,
      tracks: [
        { id: "t1", name: "Piano RH", notes: [{}, {}] },
        { id: "t2", name: "Piano LH", notes: [{}] }
      ]
    };
  };
  global.render = function() {};
  global.syncCalls = [];
  global.syncMidiImportStateRequest = function(payload) {
    global.syncCalls.push(payload);
  };
}

async function run() {
  resetEnvironment();
  loadJS("js/import/midi_assign.js");
  loadJS("js/import/midi_ui.js");

  global.SparkInstruments = {
    getActive: function() {
      return { id: "pianospark" };
    }
  };

  await handleMidiImport({ name: "lesson.mid" });

  assert.strictEqual(global.S.importedMidiAssignments.t1, "melody");
  assert.strictEqual(global.S.importedMidiAssignments.t2, "left_hand");
  assert.strictEqual(global.syncCalls[0].assignments.t1, "melody");

  resetEnvironment();
  loadJS("js/import/midi_assign.js");
  loadJS("js/import/midi_ui.js");

  await handleMidiImport({ name: "lesson.mid" });

  assert.strictEqual(global.S.importedMidiAssignments.t1, "chord_seed");
  assert.strictEqual(global.S.importedMidiAssignments.t2, "chord_seed");

  console.log("=== MIDI Import Instrument Inference Tests ===");
  console.log("2 passed, 0 failed");
}

run().catch(function(err) {
  console.error("=== MIDI Import Instrument Inference Tests ===");
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
