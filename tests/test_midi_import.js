var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function loadJS(relPath) {
  return fs.readFileSync(path.join(__dirname, "..", relPath), "utf8");
}

var midiHeader = new Uint8Array([
  0x4d, 0x54, 0x68, 0x64,
  0x00, 0x00, 0x00, 0x06,
  0x00, 0x01, 0x00, 0x01,
  0x01, 0xe0
]);
var midiBase64 = Buffer.from(midiHeader).toString("base64");
var parseCalls = [];
var syncCalls = [];
var desktopOpenOptions = null;
var renderCalls = 0;

var sandbox = {
  console: console,
  Promise: Promise,
  Uint8Array: Uint8Array,
  ArrayBuffer: ArrayBuffer,
  Buffer: Buffer,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  S: {
    importedMidi: null,
    importedMidiTracks: [],
    importedMidiAssignments: {}
  },
  escHTML: function(value) {
    return String(value);
  },
  render: function() {
    renderCalls++;
  },
  syncMidiImportStateRequest: function(payload) {
    syncCalls.push(payload);
  },
  isDesktopBuild: function() {
    return true;
  },
  openImportFileDesktopAware: async function(options) {
    desktopOpenOptions = options;
    return {
      ok: true,
      name: "desktop_import.mid",
      extension: "mid",
      isBinary: true,
      base64: midiBase64
    };
  },
  Midi: function(buffer) {
    parseCalls.push(Array.from(new Uint8Array(buffer)));
    return {
      header: {
        ppq: 480,
        tempos: [{ ticks: 0, bpm: 120 }],
        timeSignatures: [{ ticks: 0, timeSignature: [4, 4] }]
      },
      tracks: [{
        name: "Lead Track",
        notes: [{
          midi: 60,
          ticks: 0,
          durationTicks: 240,
          time: 0,
          duration: 0.5,
          velocity: 0.8
        }]
      }]
    };
  }
};
sandbox.window = sandbox;

vm.runInNewContext(loadJS("js/import/midi_parse.js"), sandbox, { filename: "js/import/midi_parse.js" });
vm.runInNewContext(loadJS("js/import/midi_normalize.js"), sandbox, { filename: "js/import/midi_normalize.js" });
vm.runInNewContext(loadJS("js/import/midi_assign.js"), sandbox, { filename: "js/import/midi_assign.js" });
vm.runInNewContext(loadJS("js/import/midi_ui.js"), sandbox, { filename: "js/import/midi_ui.js" });

console.log("=== MIDI Import Tests ===");

test("parseMidiFile accepts browser File-style inputs", async function() {
  parseCalls.length = 0;
  await sandbox.parseMidiFile({
    name: "browser.mid",
    arrayBuffer: function() {
      return Promise.resolve(midiHeader.buffer.slice(0));
    }
  });
  assert.strictEqual(parseCalls.length, 1);
  assert.deepStrictEqual(parseCalls[0].slice(0, 4), [0x4d, 0x54, 0x68, 0x64]);
});

test("parseMidiFile accepts desktop base64 payloads", async function() {
  parseCalls.length = 0;
  await sandbox.parseMidiFile({
    name: "desktop.mid",
    isBinary: true,
    base64: midiBase64
  });
  assert.strictEqual(parseCalls.length, 1);
  assert.deepStrictEqual(parseCalls[0].slice(0, 4), [0x4d, 0x54, 0x68, 0x64]);
});

test("midiImportPage renders desktop import button in desktop builds", function() {
  sandbox.S.importedMidi = null;
  sandbox.S.importedMidiTracks = [];
  var html = sandbox.midiImportPage();
  assert.ok(html.indexOf("Import from Desktop") >= 0);
});

test("importMidiDesktopAware requests midi-only filters and updates import state", async function() {
  parseCalls.length = 0;
  syncCalls.length = 0;
  renderCalls = 0;
  desktopOpenOptions = null;
  sandbox.S.importedMidi = null;
  sandbox.S.importedMidiTracks = [];
  sandbox.S.importedMidiAssignments = {};

  var result = await sandbox.importMidiDesktopAware();

  assert.strictEqual(result, true);
  assert.ok(desktopOpenOptions);
  assert.strictEqual(desktopOpenOptions.filters.length, 1);
  assert.strictEqual(desktopOpenOptions.filters[0].name, "MIDI");
  assert.deepStrictEqual(Array.from(desktopOpenOptions.filters[0].extensions), ["mid", "midi"]);
  assert.strictEqual(parseCalls.length, 1);
  assert.strictEqual(sandbox.S.importedMidi.sourceName, "desktop_import.mid");
  assert.strictEqual(sandbox.S.importedMidiTracks.length, 1);
  assert.strictEqual(sandbox.S.importedMidiAssignments.track_0, "single_note");
  assert.strictEqual(syncCalls.length, 1);
  assert.strictEqual(renderCalls, 1);
});

async function run() {
  for (var i = 0; i < tests.length; i++) {
    try {
      await tests[i].fn();
      passed++;
      console.log("  PASS: " + tests[i].name);
    } catch (err) {
      failed++;
      console.error("  FAIL: " + tests[i].name);
      console.error("    " + err.message);
    }
  }
  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
}

run();
