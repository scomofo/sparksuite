/*
 * Minimal Standard MIDI File (format 1) writer shared by the song-corpus
 * generators. Kept dependency-free; byte layout is pinned by
 * tests/test_public_domain_midis.js and tests/test_generated_backing_midis.js.
 */

var fs = require("fs");

var PPQ = 480;

function vlq(value) {
  var bytes = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function str(text) {
  var out = [];
  for (var i = 0; i < text.length; i++) out.push(text.charCodeAt(i) & 0xff);
  return out;
}

function u32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function u16(value) {
  return [(value >>> 8) & 0xff, value & 0xff];
}

// events: [{tick, bytes:[...]}] — absolute ticks, converted to deltas here.
function trackChunk(events) {
  var sorted = events.slice().sort(function(a, b) { return a.tick - b.tick; });
  var data = [];
  var lastTick = 0;
  sorted.forEach(function(evt) {
    data = data.concat(vlq(evt.tick - lastTick), evt.bytes);
    lastTick = evt.tick;
  });
  data = data.concat(vlq(0), [0xff, 0x2f, 0x00]); // end of track
  return str("MTrk").concat(u32(data.length), data);
}

function tempoEvent(tick, bpm) {
  var usPerBeat = Math.round(60000000 / bpm);
  return { tick: tick, bytes: [0xff, 0x51, 0x03, (usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff] };
}

function timeSigEvent(tick, numerator, denominatorPow2) {
  return { tick: tick, bytes: [0xff, 0x58, 0x04, numerator, denominatorPow2, 24, 8] };
}

function trackNameEvent(tick, name) {
  return { tick: tick, bytes: [0xff, 0x03, name.length].concat(str(name)) };
}

// notes: [{tick, midi, dur, vel}] on a fixed channel.
function noteEvents(notes, channel, velocity) {
  var events = [];
  notes.forEach(function(note) {
    events.push({ tick: note.tick, bytes: [0x90 | channel, note.midi, note.vel || velocity] });
    events.push({ tick: note.tick + note.dur, bytes: [0x80 | channel, note.midi, 0x40] });
  });
  return events;
}

// tracks: [{name, notes, channel, velocity}]
function writeSmf(filePath, bpm, timeSig, title, tracks) {
  var chunks = trackChunk([
    trackNameEvent(0, title),
    tempoEvent(0, bpm),
    timeSigEvent(0, timeSig[0], Math.log2(timeSig[1]))
  ]);
  tracks.forEach(function(track) {
    chunks = chunks.concat(trackChunk(
      [trackNameEvent(0, track.name)].concat(noteEvents(track.notes, track.channel, track.velocity))
    ));
  });
  var header = str("MThd").concat(u32(6), u16(1), u16(1 + tracks.length), u16(PPQ));
  var bytes = header.concat(chunks);
  fs.writeFileSync(filePath, Buffer.from(bytes));
  return bytes.length;
}

var PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function n(name) {
  var letter = name[0];
  var octave = parseInt(name.slice(1), 10);
  return 12 * (octave + 1) + PITCH[letter];
}

// Builds a melody line from [name, durTicks] pairs laid end to end,
// with null entries as rests.
function line(startTick, steps) {
  var notes = [];
  var tick = startTick;
  steps.forEach(function(step) {
    if (step[0] !== null) notes.push({ tick: tick, midi: n(step[0]), dur: step[1] });
    tick += step[1];
  });
  return notes;
}

module.exports = {
  PPQ: PPQ,
  writeSmf: writeSmf,
  n: n,
  line: line
};
