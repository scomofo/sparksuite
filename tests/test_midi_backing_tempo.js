// Regression test for bug #7: in SMF format 1 the Set-Tempo event lives in
// track 0 while notes live in tracks 1+. The parser must apply track 0's tempo
// to those notes (a global tempo map), not default every note track to 120 BPM.
var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
global.eval(fs.readFileSync(path.join(__dirname, "..", "js/performance/midi_backing.js"), "utf8"));

function u32(n) { return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]; }
function u16(n) { return [(n >> 8) & 0xFF, n & 0xFF]; }
function vlq(n) {
  var bytes = [n & 0x7F];
  n >>= 7;
  while (n > 0) { bytes.unshift((n & 0x7F) | 0x80); n >>= 7; }
  return bytes;
}
function mtrk(data) { return [0x4D, 0x54, 0x72, 0x6B].concat(u32(data.length), data); }

// Format-1 file: division ticks/beat, optional tempo (track 0), one note in track 1.
function buildFormat1(ticksPerBeat, usPerBeat, noteTick) {
  var trk0 = (usPerBeat == null)
    ? [0x00, 0xFF, 0x2F, 0x00]
    : [0x00, 0xFF, 0x51, 0x03, (usPerBeat >> 16) & 0xFF, (usPerBeat >> 8) & 0xFF, usPerBeat & 0xFF, 0x00, 0xFF, 0x2F, 0x00];
  var trk1 = vlq(noteTick).concat([0x90, 0x3C, 0x64], vlq(noteTick), [0x80, 0x3C, 0x00], [0x00, 0xFF, 0x2F, 0x00]);
  var header = [0x4D, 0x54, 0x68, 0x64].concat(u32(6), u16(1), u16(2), u16(ticksPerBeat));
  return new Uint8Array(header.concat(mtrk(trk0), mtrk(trk1)));
}

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- MIDI backing tempo (format 1) ---");

test("track-0 tempo (150 BPM) is applied to a track-1 note", function() {
  // 150 BPM = 400000 us/beat; note at 480 ticks (1 beat) -> 0.4s, NOT 0.5s (120 BPM).
  var parsed = window.parseMidiBuffer(buildFormat1(480, 400000, 480).buffer);
  assert.strictEqual(parsed.notes.length, 1);
  assert.ok(Math.abs(parsed.notes[0].t - 0.4) < 1e-6, "expected 0.4s, got " + parsed.notes[0].t);
  assert.strictEqual(parsed.bpm, 150);
});

test("slower track-0 tempo (75 BPM) is applied to a track-1 note", function() {
  // 75 BPM = 800000 us/beat; note at 480 ticks -> 0.8s.
  var parsed = window.parseMidiBuffer(buildFormat1(480, 800000, 480).buffer);
  assert.ok(Math.abs(parsed.notes[0].t - 0.8) < 1e-6, "expected 0.8s, got " + parsed.notes[0].t);
  assert.strictEqual(parsed.bpm, 75);
});

test("no tempo event defaults to 120 BPM", function() {
  var parsed = window.parseMidiBuffer(buildFormat1(480, null, 480).buffer);
  assert.ok(Math.abs(parsed.notes[0].t - 0.5) < 1e-6, "expected 0.5s (120 BPM), got " + parsed.notes[0].t);
  assert.strictEqual(parsed.bpm, 120);
});
