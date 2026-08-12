var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(function() {
      passed++;
      console.log("  PASS: " + name);
      finish();
    })
    .catch(function(err) {
      failed++;
      console.error("  FAIL: " + name);
      console.error("    " + err.message);
      finish();
    });
}

var pending = 0;
function finish() {
  pending--;
  if (pending === 0) {
    console.log("\n" + passed + " passed, " + failed + " failed");
    if (failed > 0) process.exit(1);
  }
}

function resetEnv() {
  global.window = global;
  global.S = {};
  global.render = function() {};
  global.parseMidiFile = function() {
    return Promise.resolve({ tracks: [{ id: "track_1", name: "Track 1", notes: [1, 2, 3] }] });
  };
  global.normalizeParsedMidi = function(raw) {
    return raw;
  };
  global.syncMidiImportStateRequest = function() {};
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [
        { id: "pianospark", appId: "pianospark", instrument: "piano" }
      ];
    }
  };
}

console.log("\n--- MIDI Import Runtime Inference ---");

pending++;
test("handleMidiImport infers app type from a thin active instrument", async function() {
  resetEnv();
  var requestedType = null;
  global.autoAssignMidiTracks = function(normalized, appType) {
    requestedType = appType;
    return { track_1: "block_chords" };
  };

  loadVM("js/import/midi_ui.js");
  await handleMidiImport({ name: "demo.mid" });

  assert.strictEqual(requestedType, "piano");
  assert.strictEqual(S.importedMidiAssignments.track_1, "block_chords");
});
