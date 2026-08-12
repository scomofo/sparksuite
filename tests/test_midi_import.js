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

// ── Native fallback: no Midi global, core SparkChartIO parser instead ──

// Format 0, one track: tempo 120bpm, 4/4, track name "Lead", then C4
// (vel 100) held for one beat (480 ticks at ppq 480).
var nativeMidiBytes = new Uint8Array([
  0x4d, 0x54, 0x68, 0x64,             // MThd
  0x00, 0x00, 0x00, 0x06,             // header length 6
  0x00, 0x00, 0x00, 0x01,             // format 0, 1 track
  0x01, 0xe0,                         // ppq 480
  0x4d, 0x54, 0x72, 0x6b,             // MTrk
  0x00, 0x00, 0x00, 0x24,             // track length 36
  0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20,       // tempo 500000us = 120bpm
  0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08, // time signature 4/4
  0x00, 0xff, 0x03, 0x04, 0x4c, 0x65, 0x61, 0x64, // track name "Lead"
  0x00, 0x90, 0x3c, 0x64,             // note on C4 vel 100
  0x83, 0x60, 0x80, 0x3c, 0x40,       // delta 480, note off C4
  0x00, 0xff, 0x2f, 0x00              // end of track
]);

var fallbackSandbox = {
  console: console,
  Promise: Promise,
  Uint8Array: Uint8Array,
  ArrayBuffer: ArrayBuffer,
  Buffer: Buffer
};
fallbackSandbox.window = fallbackSandbox;

vm.runInNewContext(loadJS("js/sparksuite/domain/tempo_map.js"), fallbackSandbox, { filename: "js/sparksuite/domain/tempo_map.js" });
vm.runInNewContext(loadJS("js/sparksuite/core/chart_io.js"), fallbackSandbox, { filename: "js/sparksuite/core/chart_io.js" });
vm.runInNewContext(loadJS("js/import/midi_parse.js"), fallbackSandbox, { filename: "js/import/midi_parse.js" });
vm.runInNewContext(loadJS("js/import/midi_normalize.js"), fallbackSandbox, { filename: "js/import/midi_normalize.js" });

test("parseMidiFile falls back to the core SparkChartIO parser without a Midi global", async function() {
  var raw = await fallbackSandbox.parseMidiFile({
    name: "native.mid",
    arrayBuffer: function() {
      return Promise.resolve(nativeMidiBytes.buffer.slice(0));
    }
  });

  assert.strictEqual(raw.header.ppq, 480);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(raw.header.tempos)), [{ ticks: 0, bpm: 120 }]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(raw.header.timeSignatures)), [{ ticks: 0, timeSignature: [4, 4] }]);
  assert.strictEqual(raw.tracks.length, 1);
  assert.strictEqual(raw.tracks[0].name, "Lead");
  assert.strictEqual(raw.tracks[0].channel, 0);
  assert.strictEqual(raw.tracks[0].notes.length, 1);

  var note = raw.tracks[0].notes[0];
  assert.strictEqual(note.midi, 60);
  assert.strictEqual(note.ticks, 0);
  assert.strictEqual(note.durationTicks, 480);
  assert.strictEqual(note.time, 0);
  assert.ok(Math.abs(note.duration - 0.5) < 1e-9, "one beat at 120bpm should last 0.5s, got " + note.duration);
  assert.ok(Math.abs(note.velocity - 100 / 127) < 1e-9);
});

test("core-parser fallback output normalizes like a @tonejs/midi parse", async function() {
  var raw = await fallbackSandbox.parseMidiFile({
    name: "native.mid",
    arrayBuffer: function() {
      return Promise.resolve(nativeMidiBytes.buffer.slice(0));
    }
  });
  var normalized = fallbackSandbox.normalizeParsedMidi(raw, "native.mid");

  assert.strictEqual(normalized.ppq, 480);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.tempoMap)), [{ tick: 0, bpm: 120 }]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.timeSignatures)), [{ tick: 0, numerator: 4, denominator: 4 }]);
  assert.strictEqual(normalized.tracks.length, 1);
  assert.strictEqual(normalized.tracks[0].name, "Lead");

  var note = normalized.tracks[0].notes[0];
  assert.strictEqual(note.pitch, 60);
  assert.strictEqual(note.note, "C4");
  assert.strictEqual(note.startTick, 0);
  assert.strictEqual(note.endTick, 480);
  assert.ok(Math.abs(note.durSec - 0.5) < 1e-9);
  assert.strictEqual(note.velocity, 100);
});

test("parseMidiFile still reports a clear error when no parser is available", async function() {
  var bareSandbox = {
    console: console,
    Promise: Promise,
    Uint8Array: Uint8Array,
    ArrayBuffer: ArrayBuffer,
    Buffer: Buffer
  };
  bareSandbox.window = bareSandbox;
  vm.runInNewContext(loadJS("js/import/midi_parse.js"), bareSandbox, { filename: "js/import/midi_parse.js" });

  await assert.rejects(function() {
    return bareSandbox.parseMidiFile({
      name: "native.mid",
      arrayBuffer: function() {
        return Promise.resolve(nativeMidiBytes.buffer.slice(0));
      }
    });
  }, /MIDI parser library adapter not implemented/);
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
